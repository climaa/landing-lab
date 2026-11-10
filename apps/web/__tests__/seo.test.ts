import { describe, expect, it } from 'vitest';

import { hreflangLinks, jsonLdText } from '@/lib/seo';
import { absolute } from '@/lib/site';

const typesIn = (text: string) =>
  (JSON.parse(text)['@graph'] as { '@type': string }[]).map((node) => node['@type']);

describe('hreflangLinks', () => {
  it('lists each language once for the fixed page, itself included', () => {
    // Arrange + Act
    const links = hreflangLinks('after');

    // Assert
    expect(links).toEqual([
      { hrefLang: 'en-GB', href: absolute('/after') },
      { hrefLang: 'en-IE', href: absolute('/ie/after') },
      { hrefLang: 'x-default', href: absolute('/after') },
    ]);
  });

  it('declares en-GB twice on the before page', () => {
    // Arrange + Act
    const languages = hreflangLinks('before').map((link) => link.hrefLang);

    // Assert
    expect(languages.filter((lang) => lang === 'en-GB')).toHaveLength(2);
  });
});

describe('jsonLdText', () => {
  it('parses on the fixed page, with an Organization, a Service and an AggregateRating', () => {
    // Arrange + Act
    const text = jsonLdText('after', 4.6, 100);

    // Assert
    expect(typesIn(text)).toEqual(['Organization', 'Service', 'AggregateRating']);
  });

  it('carries the computed rating and count', () => {
    // Arrange + Act
    const graph = JSON.parse(jsonLdText('after', 4.6, 100))['@graph'];

    // Assert
    expect(graph[2]).toMatchObject({ ratingValue: 4.6, reviewCount: 100 });
  });

  it('does not parse on the before page', () => {
    // Arrange + Act
    const text = jsonLdText('before', 4.6, 100);

    // Assert
    expect(() => JSON.parse(text)).toThrow(SyntaxError);
  });
});
