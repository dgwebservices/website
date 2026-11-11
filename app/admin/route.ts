import { entryHtml } from '@/backoffice/entry';
import { serveBackofficePage } from '@/lib/backoffice/http';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return serveBackofficePage(request, entryHtml);
}
