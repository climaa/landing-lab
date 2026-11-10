import { describe, expect, it } from 'vitest';

import { extractFacts } from '../extract.mjs';
import {
  canonicalMissing,
  canonicalMultiple,
  canonicalNotSelf,
} from '../rules/canonical.mjs';
import {
  hreflangDuplicate,
  hreflangInvalid,
  hreflangNoSelf,
  hreflangNotReciprocal,
  hreflangNoXDefault,
} from '../rules/hreflang.mjs';
import { jsonLdInvalid, jsonLdMissingKey } from '../rules/jsonld.mjs';
import { linkNonCanonical, linkRedirect } from '../rules/links.mjs';
import { GRAPH, ORIGIN, page } from './site.mjs';

const at = (path) => `${ORIGIN}${path}`;
const factsOf = (html, path = '/a') => extractFacts(html, at(path));
/** A context whose fetched pages are the given HTML, by path. */
const ctxOf = (pages = {}) => ({
  origin: ORIGIN,
  pages: new Map(
    Object.entries(pages).map(([path, value]) => [
      at(path),
      typeof value === 'number'
        ? { status: value, facts: null }
        : { status: 200, facts: extractFacts(value, at(path)) },
    ]),
  ),
});
const rulesOf = (findings) => findings.map((finding) => finding.rule);

describe('canonical rules', () => {
  it('reports a page with no canonical', () => {
    // Arrange
    const facts = factsOf(page({}));

    // Act + Assert
    expect(rulesOf(canonicalMissing(facts, ctxOf()))).toEqual(['canonical-missing']);
    expect(canonicalMissing(factsOf(page({ canonical: at('/a') })), ctxOf())).toEqual([]);
  });

  it('reports two canonicals on one page', () => {
    // Arrange
    const facts = factsOf(page({ canonical: [at('/a'), at('/b')] }));

    // Act + Assert
    expect(rulesOf(canonicalMultiple(facts, ctxOf()))).toEqual(['canonical-multiple']);
    expect(canonicalMultiple(factsOf(page({ canonical: at('/a') })), ctxOf())).toEqual(
      [],
    );
  });

  it('reports a canonical that names another page', () => {
    // Arrange
    const facts = factsOf(page({ canonical: at('/b') }));

    // Act
    const findings = canonicalNotSelf(facts, ctxOf());

    // Assert
    expect(findings[0]?.message).toBe('the canonical is /b, not this page');
    expect(canonicalNotSelf(factsOf(page({ canonical: at('/a') })), ctxOf())).toEqual([]);
  });
});

describe('link rules', () => {
  it('reports a link to a page whose canonical is elsewhere', () => {
    // Arrange
    const facts = factsOf(page({ canonical: at('/a'), links: ['/old'] }));
    const ctx = ctxOf({ '/old': page({ canonical: at('/new') }) });

    // Act
    const findings = linkNonCanonical(facts, ctx);

    // Assert
    expect(findings.map((f) => f.message)).toEqual([
      '/old is not its own canonical URL (canonical: /new)',
    ]);
  });

  it('passes a link to a page that is its own canonical, and a link to itself', () => {
    // Arrange
    const facts = factsOf(page({ canonical: at('/a'), links: ['/b', '/a#top'] }));
    const ctx = ctxOf({ '/b': page({ canonical: at('/b') }) });

    // Act + Assert
    expect(linkNonCanonical(facts, ctx)).toEqual([]);
  });

  it('warns on a link that answers with a redirect, and not on one that answers 200', () => {
    // Arrange
    const facts = factsOf(page({ links: ['/moved', '/b'] }));
    const ctx = ctxOf({ '/moved': 301, '/b': page({ canonical: at('/b') }) });

    // Act
    const findings = linkRedirect(facts, ctx);

    // Assert
    expect(findings).toEqual([
      {
        rule: 'link-redirect',
        severity: 'warning',
        message: '/moved answers 301',
        evidence: '<a href="/moved">',
      },
    ]);
  });
});

describe('hreflang rules', () => {
  it('reports a language declared twice, once', () => {
    // Arrange
    const facts = factsOf(
      page({
        alternates: [
          ['en-GB', at('/a')],
          ['en-gb', at('/a')],
          ['en-IE', at('/i')],
        ],
      }),
    );

    // Act
    const findings = hreflangDuplicate(facts, ctxOf());

    // Assert
    expect(findings.map((f) => f.message)).toEqual(['en-GB is declared twice']);
    expect(
      hreflangDuplicate(factsOf(page({ alternates: [['en-GB', at('/a')]] })), ctxOf()),
    ).toEqual([]);
  });

  it('reports a code that is not BCP 47', () => {
    // Arrange
    const facts = factsOf(
      page({
        alternates: [
          ['english', at('/a')],
          ['en-GB', at('/a')],
          ['x-default', at('/a')],
        ],
      }),
    );

    // Act + Assert
    expect(hreflangInvalid(facts, ctxOf()).map((f) => f.message)).toEqual([
      'english is not a language code',
    ]);
  });

  it('warns when no alternate names the page itself', () => {
    // Arrange
    const facts = factsOf(page({ alternates: [['en-IE', at('/i')]] }));

    // Act + Assert
    expect(rulesOf(hreflangNoSelf(facts, ctxOf()))).toEqual(['hreflang-no-self']);
    expect(
      hreflangNoSelf(factsOf(page({ alternates: [['en-GB', at('/a')]] })), ctxOf()),
    ).toEqual([]);
  });

  it('warns on two languages with no x-default', () => {
    // Arrange
    const facts = factsOf(
      page({
        alternates: [
          ['en-GB', at('/a')],
          ['en-IE', at('/i')],
        ],
      }),
    );

    // Act + Assert
    expect(rulesOf(hreflangNoXDefault(facts, ctxOf()))).toEqual([
      'hreflang-no-x-default',
    ]);
    expect(
      hreflangNoXDefault(factsOf(page({ alternates: [['en-GB', at('/a')]] })), ctxOf()),
    ).toEqual([]);
  });

  it('reports, in one finding, every alternate that does not list the page back', () => {
    // Arrange
    const facts = factsOf(
      page({
        alternates: [
          ['en-GB', at('/b')],
          ['en-IE', at('/c')],
          ['x-default', at('/a')],
        ],
      }),
    );
    const ctx = ctxOf({
      '/b': page({ alternates: [['en-GB', at('/b')]] }),
      '/c': page({ alternates: [['en-IE', at('/c')]] }),
    });

    // Act
    const findings = hreflangNotReciprocal(facts, ctx);

    // Assert
    expect(findings.map((f) => f.message)).toEqual([
      '/b and /c do not list /a as an alternate',
    ]);
  });

  it('passes alternates that list each other', () => {
    // Arrange
    const both = [
      ['en-GB', at('/a')],
      ['en-IE', at('/b')],
    ];
    const facts = factsOf(page({ alternates: both }));
    const ctx = ctxOf({ '/b': page({ alternates: both }) });

    // Act + Assert
    expect(hreflangNotReciprocal(facts, ctx)).toEqual([]);
  });
});

describe('JSON-LD rules', () => {
  it('reports a block that does not parse, and lists the types of one that does', () => {
    // Arrange
    const broken = factsOf(page({ jsonLd: ['{"@type": "Organization",}'] }));
    const valid = factsOf(page({ jsonLd: [GRAPH] }));

    // Act + Assert
    expect(rulesOf(jsonLdInvalid(broken, ctxOf()))).toEqual(['jsonld-invalid']);
    expect(jsonLdInvalid(valid, ctxOf())).toEqual([]);
    expect(valid.jsonLd[0]).toMatchObject({
      ok: true,
      types: ['Organization', 'Service', 'AggregateRating'],
    });
  });

  it('warns on a known type missing a key it needs, accepting either alternative', () => {
    // Arrange
    const facts = factsOf(
      page({
        jsonLd: [
          JSON.stringify({ '@type': 'AggregateRating', ratingValue: 4, ratingCount: 9 }),
          JSON.stringify({ '@type': 'Organization', name: 'Taskbloom' }),
        ],
      }),
    );

    // Act + Assert
    expect(jsonLdMissingKey(facts, ctxOf()).map((f) => f.message)).toEqual([
      'Organization has no url',
    ]);
  });
});
