import { ALTERNATES, BRAND, SITE_URL, absolute } from './site';

export type Variant = 'before' | 'after';

export interface HreflangLink {
  hrefLang: string;
  href: string;
}

/** The structured data both variants describe: who sells, what, rated how. */
export function structuredData(rating: number, reviewCount: number) {
  const org = absolute('/#org');
  const service = absolute('/#garden-design');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': org, name: BRAND, url: SITE_URL.toString() },
      {
        '@type': 'Service',
        '@id': service,
        name: 'Garden design',
        provider: { '@id': org },
      },
      {
        '@type': 'AggregateRating',
        itemReviewed: { '@id': service },
        ratingValue: rating,
        reviewCount,
        bestRating: 5,
      },
    ],
  };
}

/**
 * The JSON-LD a variant ships. The after page's parses; the before page's has a
 * trailing comma before its last bracket, the kind a hand-edited template leaves,
 * and so a crawler reads none of it.
 */
export function jsonLdText(
  variant: Variant,
  rating: number,
  reviewCount: number,
): string {
  const text = JSON.stringify(structuredData(rating, reviewCount));

  return variant === 'after' ? text : `${text.slice(0, -2)},]}`;
}

/**
 * The alternates a page declares. The fixed page lists each language once and
 * itself among them; the before page repeats `en-GB` — the doubled alternate
 * the audited page carried — and is listed by none of the pages it names.
 */
export function hreflangLinks(variant: Variant): HreflangLink[] {
  const once = Object.entries(ALTERNATES).map(([hrefLang, path]) => ({
    hrefLang,
    href: absolute(path),
  }));

  if (variant === 'after') return once;

  return [{ hrefLang: 'en-GB', href: absolute(ALTERNATES['en-GB']) }, ...once];
}
