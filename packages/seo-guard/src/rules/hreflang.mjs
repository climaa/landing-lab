// @ts-check
import { shown } from '../normalise.mjs';

/** @typedef {import('../types.mjs').Rule} Rule */

/** BCP 47 as hreflang uses it: language, optional script, optional region; or x-default. */
const HREFLANG = /^(?:x-default|[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?)$/i;

const TIMES = ['', 'once', 'twice', 'three times', 'four times'];

/** @type {Rule} */
export const hreflangDuplicate = (facts) => {
  /** @type {Map<string, { lang: string, hrefs: string[] }>} */
  const byLang = new Map();
  for (const { lang, href } of facts.hreflang) {
    const entry = byLang.get(lang.toLowerCase()) ?? { lang, hrefs: [] };
    entry.hrefs.push(href);
    byLang.set(lang.toLowerCase(), entry);
  }

  return [...byLang.values()]
    .filter(({ hrefs }) => hrefs.length > 1)
    .map(({ lang, hrefs }) => ({
      rule: 'hreflang-duplicate',
      severity: /** @type {const} */ ('error'),
      message: `${lang} is declared ${TIMES[hrefs.length] ?? `${hrefs.length} times`}`,
      evidence: hrefs.map((href) => `${lang} → ${href}`).join(' · '),
    }));
};

/** @type {Rule} */
export const hreflangInvalid = (facts) =>
  facts.hreflang
    .filter(({ lang }) => !HREFLANG.test(lang))
    .map(({ lang, href }) => ({
      rule: 'hreflang-invalid',
      severity: /** @type {const} */ ('error'),
      message: `${lang} is not a language code`,
      evidence: `${lang} → ${href}`,
    }));

/** @type {Rule} */
export const hreflangNoSelf = (facts) =>
  facts.hreflang.length > 0 && !facts.hreflang.some(({ href }) => href === facts.url)
    ? [
        {
          rule: 'hreflang-no-self',
          severity: 'warning',
          message: 'no alternate names this page itself',
          evidence: facts.hreflang.map(({ lang }) => lang).join(', '),
        },
      ]
    : [];

/** @type {Rule} */
export const hreflangNoXDefault = (facts) => {
  const langs = new Set(facts.hreflang.map(({ lang }) => lang.toLowerCase()));

  return langs.size >= 2 && !langs.has('x-default')
    ? [
        {
          rule: 'hreflang-no-x-default',
          severity: 'warning',
          message: 'alternates without an x-default',
          evidence: [...langs].join(', '),
        },
      ]
    : [];
};

/**
 * Every internal alternate must list this page back. One finding per page,
 * naming every alternate that does not: a page that names two such alternates
 * has one problem in two places, not two problems.
 *
 * @type {Rule}
 */
export const hreflangNotReciprocal = (facts, ctx) => {
  const targets = [...new Set(facts.hreflang.map(({ href }) => href))].filter(
    (href) => href !== facts.url && new URL(href).origin === ctx.origin,
  );
  const missing = targets.filter((href) => {
    const page = ctx.pages.get(href);

    return page?.facts && !page.facts.hreflang.some((alt) => alt.href === facts.url);
  });
  if (missing.length === 0) return [];
  const named = missing.map((href) => shown(href, ctx.origin));

  return [
    {
      rule: 'hreflang-not-reciprocal',
      severity: 'error',
      message: `${named.join(' and ')} ${named.length === 1 ? 'does' : 'do'} not list ${shown(facts.url, ctx.origin)} as an alternate`,
      evidence: named.join(' · '),
    },
  ];
};
