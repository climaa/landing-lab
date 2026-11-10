// A fake site for the guard to crawl: HTML written for the lab, served by a
// fetch that never touches the network.

export const ORIGIN = 'https://lab.example';

/**
 * @param {{ canonical?: string | string[], alternates?: [string, string][], links?: string[], jsonLd?: string[] }} parts
 */
export function page({ canonical, alternates = [], links = [], jsonLd = [] }) {
  const canonicals = canonical === undefined ? [] : [canonical].flat();

  return `<!doctype html><html lang="en-GB"><head>
${canonicals.map((href) => `<link rel="canonical" href="${href}">`).join('\n')}
${alternates.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('\n')}
${jsonLd.map((text) => `<script type="application/ld+json">${text}</script>`).join('\n')}
</head><body>${links.map((href) => `<a href="${href}">x</a>`).join('')}</body></html>`;
}

export const GRAPH = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'Taskbloom', url: `${ORIGIN}/` },
    { '@type': 'Service', name: 'Garden design', provider: { '@id': '#org' } },
    { '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 100 },
  ],
});

const ALTERNATES = /** @type {[string, string][]} */ ([
  ['en-GB', `${ORIGIN}/after`],
  ['en-IE', `${ORIGIN}/ie/after`],
  ['x-default', `${ORIGIN}/after`],
]);

/** The lab's own shape: a fixed page, its alternate, an old address, a broken page. */
export const LAB = {
  '/after': page({
    canonical: `${ORIGIN}/after`,
    alternates: ALTERNATES,
    links: ['/after#p-0', '/ie/after'],
    jsonLd: [GRAPH],
  }),
  '/ie/after': page({
    canonical: `${ORIGIN}/ie/after`,
    alternates: ALTERNATES,
    jsonLd: [GRAPH],
  }),
  '/garden-designers': page({ canonical: `${ORIGIN}/after`, jsonLd: [GRAPH] }),
  '/before': page({
    canonical: `${ORIGIN}/before`,
    alternates: [['en-GB', `${ORIGIN}/after`], ...ALTERNATES],
    links: ['/garden-designers', '/before#p-0'],
    jsonLd: [`${GRAPH.slice(0, -2)},]}`],
  }),
  '/sitemap.xml': `<?xml version="1.0"?><urlset><url><loc>${ORIGIN}/after</loc></url><url><loc>${ORIGIN}/ie/after</loc></url></urlset>`,
};

/**
 * @param {Record<string, string | { status: number, location?: string }>} routes
 * @returns {typeof fetch & { calls: string[] }}
 */
export function fakeFetch(routes) {
  /** @type {string[]} */
  const calls = [];
  const impl = /** @type {typeof fetch & { calls: string[] }} */ (
    async (input) => {
      const url = new URL(String(input));
      calls.push(url.pathname);
      const route = routes[url.pathname];
      if (route === undefined)
        return new Response('not found', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        });
      if (typeof route !== 'string') {
        return new Response(null, {
          status: route.status,
          headers: { location: route.location ?? '/' },
        });
      }
      const type = url.pathname.endsWith('.xml')
        ? 'application/xml'
        : 'text/html; charset=utf-8';

      return new Response(route, { status: 200, headers: { 'content-type': type } });
    }
  );
  impl.calls = calls;

  return impl;
}
