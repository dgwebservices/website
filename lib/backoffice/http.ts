import { createBackofficeWeb } from '@/backoffice/server/web.mjs';
import { readConfig } from '@/backoffice/server/auth.mjs';
import { normalizeTrustedProxyRequest } from '@/backoffice/server/proxy-request.mjs';

function runtimeConfiguration() {
  const runtime = (globalThis as typeof globalThis & { __DG_RUNTIME_ENV__?: Record<string, unknown> }).__DG_RUNTIME_ENV__;
  return { ...process.env, ...runtime };
}

const handlers = createBackofficeWeb({ env: runtimeConfiguration });
function transportRequest(request: Request) {
  let config;
  try { config = readConfig(runtimeConfiguration()); } catch { return request; }
  return normalizeTrustedProxyRequest(request, config);
}
export const serveBackofficePage = (request: Request, entryHtml: string) => handlers.page(transportRequest(request), entryHtml);
export const runtimeResponse = (request: Request) => handlers.runtime(transportRequest(request));
export const apiResponse = (request: Request) => handlers.api(transportRequest(request));
export const authResponse = (request: Request) => handlers.auth(transportRequest(request));
