// @ts-check
import { extractFacts } from './extract.mjs';
import { normaliseUrl } from './normalise.mjs';
import {
  canonicalMissing,
  canonicalMultiple,
  canonicalNotSelf,
} from './rules/canonical.mjs';
import {
  hreflangDuplicate,
  hreflangInvalid,
  hreflangNoSelf,
  hreflangNotReciprocal,
  hreflangNoXDefault,
} from './rules/hreflang.mjs';
import { jsonLdInvalid, jsonLdMissingKey } from './rules/jsonld.mjs';
import { internalTargets, linkNonCanonical, linkRedirect } from './rules/links.mjs';

/**
 * @typedef {import('./types.mjs').Finding} Finding
 * @typedef {import('./types.mjs').Fetched} Fetched
 * @typedef {object} PageReport
 * @property {string} url
 * @property {number} status
 * @property {string | null} canonical
 * @property {import('./extract.mjs').Alternate[]} hreflang
 * @property {string[]} jsonLdTypes
 * @property {Finding[]} findings
 * @typedef {object} Report
 * @property {1} version
 * @property {string} origin
 * @property {PageReport[]} pages
 * @property {{ pages: number, errors: number, warnings: number }} summary
 * @typedef {object} CheckOptions
 * @property {string[]} [urls]
 * @property {string} [sitemap]
 * @property {string} [origin]
 * @property {number} [maxPages]
 * @property {typeof fetch} [fetchImpl]
 */

/** The rules, in the order their findings are listed. */
export const RULES = [
  canonicalMissing,
  canonicalMultiple,
  canonicalNotSelf,
  linkNonCanonical,
  linkRedirect,
  hreflangDuplicate,
  hreflangNotReciprocal,
  hreflangNoSelf,
  hreflangInvalid,
  hreflangNoXDefault,
  jsonLdInvalid,
  jsonLdMissingKey,
];

/** The guard could not do its job: bad input, or a listed page that did not answer. */
export class GuardError extends Error {}

/** @param {typeof fetch} fetchImpl */
function pageFetcher(fetchImpl) {
  /** @type {Map<string, Fetched>} */
  const pages = new Map();

  /** @param {string} url @returns {Promise<Fetched>} */
  const get = async (url) => {
    const known = pages.get(url);
    if (known) return known;
    const response = await fetchImpl(url, { redirect: 'manual' });
    const html = (response.headers.get('content-type') ?? '').includes('html');
    const facts =
      response.status === 200 && html ? extractFacts(await response.text(), url) : null;
    /** @type {Fetched} */
    const fetched = { status: response.status, facts };
    pages.set(url, fetched);

    return fetched;
  };

  return { pages, get };
}

/** @param {string} xml */
const locsOf = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1] ?? '');

/**
 * The page URLs a sitemap lists, following a sitemap index one level down.
 *
 * @param {string} sitemap
 * @param {typeof fetch} fetchImpl
 * @param {boolean} [nested]
 * @returns {Promise<string[]>}
 */
async function sitemapUrls(sitemap, fetchImpl, nested = false) {
  const response = await fetchImpl(sitemap);
  if (!response.ok)
    throw new GuardError(`the sitemap ${sitemap} answered ${response.status}`);
  const xml = await response.text();
  if (!xml.includes('<sitemapindex') || nested) return locsOf(xml);
  const children = await Promise.all(
    locsOf(xml).map((loc) => sitemapUrls(loc, fetchImpl, true)),
  );

  return children.flat();
}

/** @param {Finding} a @param {Finding} b */
const byRule = (a, b) =>
  RULE_IDS.indexOf(a.rule) - RULE_IDS.indexOf(b.rule) ||
  a.message.localeCompare(b.message);
const RULE_IDS = [
  'canonical-missing',
  'canonical-multiple',
  'canonical-not-self',
  'link-non-canonical',
  'link-redirect',
  'hreflang-duplicate',
  'hreflang-not-reciprocal',
  'hreflang-no-self',
  'hreflang-invalid',
  'hreflang-no-x-default',
  'jsonld-invalid',
  'jsonld-missing-key',
];

/** @param {CheckOptions} options */
async function listedUrls({ urls = [], sitemap, fetchImpl = fetch, maxPages = 200 }) {
  const fromSitemap = sitemap ? await sitemapUrls(sitemap, fetchImpl) : [];
  const listed = [...urls, ...fromSitemap].map((url) =>
    normaliseUrl(url, 'http://invalid/'),
  );
  if (listed.some((url) => url === null || url.startsWith('http://invalid/'))) {
    throw new GuardError('every URL must be an absolute http(s) address');
  }
  const unique = [...new Set(/** @type {string[]} */ (listed))];
  if (unique.length === 0)
    throw new GuardError('no URL to check: pass URLs or --sitemap');

  return unique.slice(0, maxPages);
}

/**
 * Reads the listed pages as a crawler does — fetch, no script — and every
 * internal page they link to or name as an alternate, then runs every rule.
 *
 * @param {CheckOptions} options
 * @returns {Promise<Report>}
 */
export async function check(options) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const urls = await listedUrls({ ...options, fetchImpl });
  const origin = options.origin
    ? new URL(options.origin).origin
    : new URL(urls[0] ?? '').origin;
  const fetcher = pageFetcher(fetchImpl);

  for (const url of urls) {
    const { status } = await fetcher.get(url);
    if (status !== 200) throw new GuardError(`${url} answered ${status}`);
  }
  for (const url of urls) {
    const facts = fetcher.pages.get(url)?.facts;
    if (!facts) continue;
    const alternates = facts.hreflang
      .map(({ href }) => href)
      .filter((h) => new URL(h).origin === origin);
    for (const target of [...internalTargets(facts, origin), ...alternates])
      await fetcher.get(target);
  }

  const ctx = { origin, pages: fetcher.pages };
  const pages = urls.map((url) => {
    const { status, facts } = /** @type {Fetched} */ (fetcher.pages.get(url));
    const findings = facts ? RULES.flatMap((rule) => rule(facts, ctx)).sort(byRule) : [];

    return {
      url,
      status,
      canonical: facts?.canonical[0] ?? null,
      hreflang: facts?.hreflang ?? [],
      jsonLdTypes: facts
        ? facts.jsonLd.flatMap((block) => (block.ok ? block.types : []))
        : [],
      findings,
    };
  });
  const all = pages.flatMap((page) => page.findings);

  return {
    version: 1,
    origin,
    pages,
    summary: {
      pages: pages.length,
      errors: all.filter((f) => f.severity === 'error').length,
      warnings: all.filter((f) => f.severity === 'warning').length,
    },
  };
}
