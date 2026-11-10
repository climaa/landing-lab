import { describe, expect, it } from 'vitest';

import { run } from '../cli.mjs';
import { fakeFetch, LAB, ORIGIN } from './site.mjs';

/** Runs the CLI against the fake lab, collecting what it prints. */
async function cli(argv, routes = LAB) {
  const out = [];
  const err = [];
  const fetchImpl = fakeFetch(routes);
  const code = await run(argv, {
    fetchImpl,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
  });

  return { code, out: out.join('\n'), err: err.join('\n'), calls: fetchImpl.calls };
}

describe('seo-guard', () => {
  it('passes the fixed pages listed by the sitemap, exit 0', async () => {
    // Arrange + Act
    const { code, out } = await cli(['--sitemap', `${ORIGIN}/sitemap.xml`, '--json']);

    // Assert
    expect(code).toBe(0);
    expect(JSON.parse(out).summary).toEqual({ pages: 2, errors: 0, warnings: 0 });
  });

  it('fails the before page with exactly the four errors it carries, exit 1', async () => {
    // Arrange + Act
    const { code, out } = await cli([`${ORIGIN}/before`, '--json']);

    // Assert
    expect(code).toBe(1);
    const [report] = JSON.parse(out).pages;
    const errors = report.findings.filter((f) => f.severity === 'error');
    expect(errors.map((f) => f.rule)).toEqual([
      'link-non-canonical',
      'hreflang-duplicate',
      'hreflang-not-reciprocal',
      'jsonld-invalid',
    ]);
    expect(errors.map((f) => f.message).slice(0, 3)).toEqual([
      '/garden-designers is not its own canonical URL (canonical: /after)',
      'en-GB is declared twice',
      '/after and /ie/after do not list /before as an alternate',
    ]);
  });

  it('lists the structured data types a page carries', async () => {
    // Arrange + Act
    const { out } = await cli([`${ORIGIN}/after`, '--json']);

    // Assert
    expect(JSON.parse(out).pages[0].jsonLdTypes).toEqual([
      'Organization',
      'Service',
      'AggregateRating',
    ]);
  });

  it('exits 2, not 1, when a listed page does not answer 200', async () => {
    // Arrange + Act
    const { code, err } = await cli([`${ORIGIN}/missing`]);

    // Assert
    expect(code).toBe(2);
    expect(err).toContain('answered 404');
  });

  it('exits 2 on arguments it cannot use', async () => {
    // Arrange + Act
    const none = await cli([]);
    const relative = await cli(['/after']);
    const unknown = await cli(['--frobnicate']);

    // Assert
    expect([none.code, relative.code, unknown.code]).toEqual([2, 2, 2]);
  });

  it('fetches each linked page once, and never an external one', async () => {
    // Arrange
    const routes = {
      ...LAB,
      '/after': LAB['/after'].replace(
        '</body>',
        '<a href="https://elsewhere.example/x">x</a><a href="/ie/after">y</a></body>',
      ),
    };

    // Act
    const { calls } = await cli([`${ORIGIN}/after`], routes);

    // Assert
    expect(calls).toEqual(['/after', '/ie/after']);
  });

  it('prints byte-identical JSON on two runs', async () => {
    // Arrange + Act
    const first = await cli([`${ORIGIN}/before`, `${ORIGIN}/after`, '--json']);
    const second = await cli([`${ORIGIN}/before`, `${ORIGIN}/after`, '--json']);

    // Assert
    expect(first.out).toBe(second.out);
  });

  it('prints a table with one row per page and the findings beneath it', async () => {
    // Arrange + Act
    const { out } = await cli([`${ORIGIN}/after`, `${ORIGIN}/before`]);
    const lines = out.split('\n');

    // Assert
    expect(lines[0]).toMatch(
      /^URL\s+canonical\s+hreflang\s+JSON-LD types\s+errors\s+warnings$/,
    );
    expect(lines[1]).toMatch(
      /^\/after\s+✓\s+3\s+Organization, Service, AggregateRating\s+0\s+0$/,
    );
    expect(lines[2]).toMatch(/^\/before\s+✓\s+4\s+—\s+4\s+1$/);
    expect(lines).toContain('  ✗ hreflang-duplicate: en-GB is declared twice');
    expect(lines).toContain('  ! hreflang-no-self: no alternate names this page itself');
    expect(lines.at(-1)).toBe('2 page(s), 4 error(s), 1 warning(s)');
  });
});

describe('a sitemap index', () => {
  it('is followed one level down', async () => {
    // Arrange
    const routes = {
      ...LAB,
      '/index.xml': `<sitemapindex><sitemap><loc>${ORIGIN}/sitemap.xml</loc></sitemap></sitemapindex>`,
    };

    // Act
    const { code, out } = await cli(
      ['--sitemap', `${ORIGIN}/index.xml`, '--json'],
      routes,
    );

    // Assert
    expect(code).toBe(0);
    expect(JSON.parse(out).pages.map((p) => p.url)).toEqual([
      `${ORIGIN}/after`,
      `${ORIGIN}/ie/after`,
    ]);
  });
});
