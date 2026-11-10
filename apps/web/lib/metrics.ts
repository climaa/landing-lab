/**
 * What the metrics strip measures, as pure functions over what they are handed:
 * a document, a fetch, a window. Each number is taken from the page it
 * describes, in the browser; none is computed at build time or typed in.
 */

/** Marks the strip's own markup, so it measures the page and not itself. */
export const IGNORE_ATTRIBUTE = 'data-metrics-ignore';

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export interface DomMetrics {
  /** `<img>` elements in the document, loaded or not. */
  images: number;
  /** Of those, the ones with no `alt` at all; `alt=""` is a decorative image. */
  imagesWithoutAlt: number;
  /** Elements, not nodes: text and comments are not counted. */
  domNodes: number;
}

export interface AxeResult {
  /** Rules violated. */
  violations: number;
  /** Elements across those rules. */
  nodes: number;
  axeVersion: string;
  tags: string[];
}

/** How many elements matching `selector` sit inside the strip's own markup. */
const ignored = (doc: Document, selector: string) =>
  [...doc.querySelectorAll(selector)].filter((element) =>
    element.closest(`[${IGNORE_ATTRIBUTE}]`),
  ).length;

export function measureDocument(doc: Document): DomMetrics {
  return {
    images: doc.querySelectorAll('img').length - ignored(doc, 'img'),
    imagesWithoutAlt:
      doc.querySelectorAll('img:not([alt])').length - ignored(doc, 'img:not([alt])'),
    domNodes: doc.getElementsByTagName('*').length - ignored(doc, '*'),
  };
}

/** The document's own bytes, decoded, from a fresh request: no subresources. */
export async function measureHtmlBytes(
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const response = await fetchImpl(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);

  return (await response.arrayBuffer()).byteLength;
}

export interface AxeRun {
  run(
    context: Document,
    options: { runOnly: { type: 'tag'; values: string[] } },
  ): Promise<{ violations: { nodes: unknown[] }[]; testEngine: { version: string } }>;
}

/** Runs axe over a document, on the four WCAG A/AA tags. */
export async function runAxe(axe: AxeRun, doc: Document): Promise<AxeResult> {
  const { violations, testEngine } = await axe.run(doc, {
    runOnly: { type: 'tag', values: AXE_TAGS },
  });

  return {
    violations: violations.length,
    nodes: violations.reduce((total, violation) => total + violation.nodes.length, 0),
    axeVersion: testEngine.version,
    tags: AXE_TAGS,
  };
}

/** axe-core, loaded only when someone asks for an audit. */
export const loadAxe = async (): Promise<AxeRun> =>
  (await import('axe-core')).default as unknown as AxeRun;

/** The name an embedded page publishes its own audit under. */
export const AUDIT_HOOK = '__labAudit';

type AuditingWindow = Window & { [AUDIT_HOOK]?: () => Promise<AxeResult> };

/**
 * Audits a page in its own window. axe reads computed styles through the window
 * it was loaded into, so a page shown in an iframe is audited by an axe loaded
 * there: the embedded page publishes `__labAudit` (PageStrip), and this calls it.
 */
export async function auditWindow(
  win: Window,
  self: Window = window,
): Promise<AxeResult> {
  if (win === self) return runAxe(await loadAxe(), win.document);
  const audit = (win as AuditingWindow)[AUDIT_HOOK];
  if (!audit) throw new Error('the embedded page publishes no audit');

  return audit();
}

/** What an embedded page calls to publish its audit for the page around it. */
export function publishAudit(win: Window): () => void {
  (win as AuditingWindow)[AUDIT_HOOK] = async () => runAxe(await loadAxe(), win.document);

  return () => {
    delete (win as AuditingWindow)[AUDIT_HOOK];
  };
}
