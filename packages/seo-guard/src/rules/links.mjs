// @ts-check
import { shown } from '../normalise.mjs';

/** @typedef {import('../types.mjs').Rule} Rule */

/**
 * The internal pages a page links to, once each, in the order they first appear.
 *
 * @param {import('../extract.mjs').PageFacts} facts
 * @param {string} origin
 */
export const internalTargets = (facts, origin) => [
  ...new Set(
    facts.links.filter((link) => new URL(link).origin === origin && link !== facts.url),
  ),
];

/** A redirect status: the address answers, but somewhere else. @param {number} status */
const isRedirect = (status) => status >= 300 && status < 400;

/** @type {Rule} */
export const linkNonCanonical = (facts, ctx) =>
  internalTargets(facts, ctx.origin).flatMap((target) => {
    const page = ctx.pages.get(target);
    const canonical = page?.facts?.canonical[0];
    if (!page || page.status !== 200 || canonical === undefined || canonical === target)
      return [];

    return [
      {
        rule: 'link-non-canonical',
        severity: /** @type {const} */ ('error'),
        message: `${shown(target, ctx.origin)} is not its own canonical URL (canonical: ${shown(canonical, ctx.origin)})`,
        evidence: `<a href="${shown(target, ctx.origin)}">`,
      },
    ];
  });

/** @type {Rule} */
export const linkRedirect = (facts, ctx) =>
  internalTargets(facts, ctx.origin).flatMap((target) => {
    const page = ctx.pages.get(target);
    if (!page || !isRedirect(page.status)) return [];

    return [
      {
        rule: 'link-redirect',
        severity: /** @type {const} */ ('warning'),
        message: `${shown(target, ctx.origin)} answers ${page.status}`,
        evidence: `<a href="${shown(target, ctx.origin)}">`,
      },
    ];
  });
