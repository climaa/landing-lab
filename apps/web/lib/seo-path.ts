/**
 * The one thing /api/seo accepts: a path on this site. Anything that could make
 * the server fetch another host — a scheme, a protocol-relative `//host`, a
 * backslash some parsers read as a slash — is refused before a URL is built,
 * and the built URL must still be on the site's own origin.
 */
export function seoTarget(path: string | null, origin: string): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\'))
    return null;
  let url: URL;
  try {
    url = new URL(path, origin);
  } catch {
    return null;
  }

  return url.origin === new URL(origin).origin ? url.toString() : null;
}
