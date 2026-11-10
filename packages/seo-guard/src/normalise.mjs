// @ts-check

/**
 * One spelling per address, so two hrefs that name the same page compare equal.
 *
 * Absolute; scheme and host lower-cased (URL does both); the default port
 * dropped (URL does that too); no fragment, which never reaches a server; query
 * parameters sorted. A trailing slash is kept as written: `/a` and `/a/` are two
 * addresses a server may answer differently, and calling them one would hide
 * exactly the kind of mismatch this guard exists to report.
 *
 * @param {string} href
 * @param {string | URL} base
 * @returns {string | null} `null` for anything that is not an http(s) address.
 */
export function normaliseUrl(href, base) {
  let url;
  try {
    url = new URL(href.trim(), base);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.hash = '';
  url.searchParams.sort();

  return url.toString();
}

/**
 * How an address is written in a message: its path when it is on the origin
 * being checked, the whole URL otherwise.
 *
 * @param {string} url
 * @param {string} origin
 */
export function shown(url, origin) {
  const parsed = new URL(url);

  return parsed.origin === origin ? `${parsed.pathname}${parsed.search}` : url;
}
