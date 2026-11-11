/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  APP_ENVIRONMENT?: string;
  ALLOW_INDEXING?: string;
  DGWEB_APP_ORIGIN?: string;
  DGWEB_DATA_MODE?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const nodeEnv = (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process?.env;
    const runtimeEnv = env ?? ({
      APP_ENVIRONMENT: nodeEnv?.APP_ENVIRONMENT,
      ALLOW_INDEXING: nodeEnv?.ALLOW_INDEXING,
      DGWEB_APP_ORIGIN: nodeEnv?.DGWEB_APP_ORIGIN,
      DGWEB_DATA_MODE: nodeEnv?.DGWEB_DATA_MODE,
      NEXT_PUBLIC_SUPABASE_URL: nodeEnv?.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nodeEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    } as Env);
    (globalThis as typeof globalThis & { __DG_RUNTIME_ENV__?: Env }).__DG_RUNTIME_ENV__ = runtimeEnv;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => runtimeEnv.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await runtimeEnv.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/diensten/beheer-en-doorontwikkeling") {
      return Response.redirect(new URL("/diensten/beheer-en-groei", request.url), 308);
    }

    const response = await handler.fetch(request, runtimeEnv, ctx);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    const backoffice = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
    headers.set("X-Frame-Options", backoffice ? "SAMEORIGIN" : "DENY");
    headers.set("Content-Security-Policy", backoffice
      ? "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'"
      : "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'");
    if (runtimeEnv.ALLOW_INDEXING !== "true") headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    if (runtimeEnv.APP_ENVIRONMENT === "production" && url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    if (backoffice) {
      headers.set("Cache-Control", "no-store, private");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    } else if (url.pathname.startsWith("/api/")) headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default worker;
