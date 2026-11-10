import { check, GuardError } from '@lab/seo-guard';
import { seoTarget } from '@/lib/seo-path';
import { SITE_URL } from '@/lib/site';

/**
 * `GET /api/seo?path=/before`: the SEO guard's report for one page of this site,
 * run at request time against the site's own origin. `next build` has no server
 * to crawl, so this is what makes the strip's SEO row as live as its other
 * numbers. Only a path is accepted, never a URL: see `seoTarget`.
 */
export async function GET(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path');
  const target = seoTarget(path, SITE_URL.origin);
  if (!target) {
    return Response.json(
      { error: 'path must be a path on this site, like /after' },
      { status: 400 },
    );
  }
  try {
    const report = await check({ urls: [target], origin: SITE_URL.origin });

    return Response.json(
      { page: report.pages[0], summary: report.summary },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    if (!(error instanceof GuardError) && !(error instanceof TypeError)) throw error;

    return Response.json({ error: error.message }, { status: 502 });
  }
}
