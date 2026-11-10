/**
 * Where this site lives, and the addresses its pages declare.
 *
 * Every canonical and alternate is absolute and built from one origin, so a page
 * and the address it claims cannot disagree. The origin is the deployment's when
 * Vercel names one, and the local `next start` port otherwise — the one the e2e
 * suite and the SEO guard both boot, so a local crawl reads canonicals that point
 * back at the server it is crawling.
 */
const VERCEL_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = new URL(
  process.env.SITE_URL ??
    (VERCEL_HOST ? `https://${VERCEL_HOST}` : 'http://localhost:3400'),
);

export const absolute = (path: string): string => new URL(path, SITE_URL).toString();

export const BRAND = 'Taskbloom';
export const DESCRIPTION =
  'Compare local garden designers, read their reviews and ask for a quote. Taskbloom is a fictional marketplace.';

/** The two addresses the same category page is published at, one per language. */
export const ALTERNATES = {
  'en-GB': '/after',
  'en-IE': '/ie/after',
  'x-default': '/after',
} as const;
