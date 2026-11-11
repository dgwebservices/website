import { createBackofficeWeb } from '@/backoffice/server/web.mjs';

function runtimeConfiguration() {
  const runtime = (globalThis as typeof globalThis & { __DG_RUNTIME_ENV__?: Record<string, unknown> }).__DG_RUNTIME_ENV__;
  return { ...process.env, ...runtime };
}

const handlers = createBackofficeWeb({ env: runtimeConfiguration });
export const serveBackofficePage = (request: Request, entryHtml: string) => handlers.page(request, entryHtml);
export const runtimeResponse = (request: Request) => handlers.runtime(request);
export const apiResponse = (request: Request) => handlers.api(request);
export const authResponse = (request: Request) => handlers.auth(request);
