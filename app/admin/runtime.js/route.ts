import { runtimeResponse } from '@/lib/backoffice/http';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return runtimeResponse(request);
}
