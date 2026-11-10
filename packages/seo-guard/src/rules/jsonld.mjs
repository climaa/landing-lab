// @ts-check

/** @typedef {import('../types.mjs').Rule} Rule */

/** The keys a known type is not useful without, any one of an alternative set. */
const REQUIRED = {
  Organization: [['name'], ['url']],
  AggregateRating: [['ratingValue'], ['reviewCount', 'ratingCount']],
  Service: [['name'], ['provider']],
};

/** @type {Rule} */
export const jsonLdInvalid = (facts) =>
  facts.jsonLd.flatMap((block, index) =>
    block.ok
      ? []
      : [
          {
            rule: 'jsonld-invalid',
            severity: /** @type {const} */ ('error'),
            message: `JSON-LD block ${index + 1} does not parse`,
            evidence: block.error,
          },
        ],
  );

/** @param {Record<string, unknown>} node */
const missingKeysOf = (node) =>
  Object.entries(REQUIRED).flatMap(([type, groups]) => {
    const types = [node['@type']].flat();
    if (!types.includes(type)) return [];

    return groups
      .filter((group) => !group.some((key) => node[key] !== undefined))
      .map((group) => ({ type, key: group.join(' or ') }));
  });

/** @type {Rule} */
export const jsonLdMissingKey = (facts) =>
  facts.jsonLd.flatMap((block) =>
    block.ok
      ? block.nodes.flatMap(missingKeysOf).map(({ type, key }) => ({
          rule: 'jsonld-missing-key',
          severity: /** @type {const} */ ('warning'),
          message: `${type} has no ${key}`,
          evidence: type,
        }))
      : [],
  );
