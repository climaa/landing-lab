// @ts-check
import { parse } from 'parse5';

import { normaliseUrl } from './normalise.mjs';

/**
 * @typedef {{ lang: string, href: string }} Alternate
 * @typedef {{ ok: true, types: string[], nodes: Record<string, unknown>[] }
 *   | { ok: false, error: string }} JsonLdBlock
 * @typedef {object} PageFacts
 * @property {string} url             The page's own normalised URL.
 * @property {string[]} canonical     Every `link[rel=canonical]` href, normalised.
 * @property {Alternate[]} hreflang   Every `link[rel=alternate][hreflang]`, in order.
 * @property {string[]} links         Every `a[href]` that is an http(s) address, in order.
 * @property {JsonLdBlock[]} jsonLd   Every `ld+json` script, parsed or not.
 */

/**
 * @typedef {{ nodeName: string, attrs?: { name: string, value: string }[],
 *   childNodes?: Node[], value?: string, content?: Node }} Node
 */

/** @param {Node} node @param {string} name */
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;

/** @param {Node} node @param {(node: Node) => void} visit */
function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
  if (node.content) walk(node.content, visit);
}

/** @param {Node} node */
const textOf = (node) =>
  (node.childNodes ?? []).map((child) => child.value ?? '').join('');

/** @param {string} rel */
const relsOf = (rel) => rel.toLowerCase().split(/\s+/);

/**
 * The structured-data nodes a block describes: the block itself, every entry of
 * a top-level array, and every node of an `@graph`.
 *
 * @param {unknown} value
 * @returns {Record<string, unknown>[]}
 */
function nodesOf(value) {
  if (Array.isArray(value)) return value.flatMap(nodesOf);
  if (value === null || typeof value !== 'object') return [];
  const node = /** @type {Record<string, unknown>} */ (value);
  const graph = node['@graph'];

  return graph === undefined ? [node] : nodesOf(graph);
}

/** @param {Record<string, unknown>} node */
const typesOf = (node) => {
  const type = node['@type'];
  if (typeof type === 'string') return [type];

  return Array.isArray(type) ? type.filter((t) => typeof t === 'string') : [];
};

/**
 * @param {string} text
 * @returns {JsonLdBlock}
 */
export function parseJsonLd(text) {
  try {
    const nodes = nodesOf(JSON.parse(text));

    return { ok: true, types: nodes.flatMap(typesOf), nodes };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * What a crawler reads off a page's HTML: no script runs.
 *
 * @param {string} html
 * @param {string} url
 * @returns {PageFacts}
 */
export function extractFacts(html, url) {
  /** @type {PageFacts} */
  const facts = { url, canonical: [], hreflang: [], links: [], jsonLd: [] };

  walk(/** @type {Node} */ (/** @type {unknown} */ (parse(html))), (node) => {
    const href = attr(node, 'href');
    if (node.nodeName === 'link' && href !== undefined) {
      const rels = relsOf(attr(node, 'rel') ?? '');
      const target = normaliseUrl(href, url);
      const lang = attr(node, 'hreflang');
      if (rels.includes('canonical') && target) facts.canonical.push(target);
      if (rels.includes('alternate') && lang !== undefined && target) {
        facts.hreflang.push({ lang, href: target });
      }
    }
    if (node.nodeName === 'a' && href !== undefined) {
      const target = normaliseUrl(href, url);
      if (target) facts.links.push(target);
    }
    if (node.nodeName === 'script' && attr(node, 'type') === 'application/ld+json') {
      facts.jsonLd.push(parseJsonLd(textOf(node)));
    }
  });

  return facts;
}
