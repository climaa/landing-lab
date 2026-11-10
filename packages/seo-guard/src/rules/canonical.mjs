// @ts-check
import { shown } from '../normalise.mjs';

/** @typedef {import('../types.mjs').Rule} Rule */

/** @type {Rule} */
export const canonicalMissing = (facts) =>
  facts.canonical.length === 0
    ? [
        {
          rule: 'canonical-missing',
          severity: 'error',
          message: 'no canonical link',
          evidence: '',
        },
      ]
    : [];

/** @type {Rule} */
export const canonicalMultiple = (facts) =>
  facts.canonical.length > 1
    ? [
        {
          rule: 'canonical-multiple',
          severity: 'error',
          message: `${facts.canonical.length} canonical links`,
          evidence: facts.canonical.join(' · '),
        },
      ]
    : [];

/** @type {Rule} */
export const canonicalNotSelf = (facts, ctx) => {
  const [canonical] = facts.canonical;
  if (
    facts.canonical.length !== 1 ||
    canonical === undefined ||
    canonical === facts.url
  ) {
    return [];
  }

  return [
    {
      rule: 'canonical-not-self',
      severity: 'error',
      message: `the canonical is ${shown(canonical, ctx.origin)}, not this page`,
      evidence: `<link rel="canonical" href="${canonical}">`,
    },
  ];
};
