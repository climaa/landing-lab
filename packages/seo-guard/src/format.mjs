// @ts-check
import { shown } from './normalise.mjs';

/** @typedef {import('./crawl.mjs').Report} Report */

/** @param {string[][]} rows */
function table(rows) {
  const widths =
    rows[0]?.map((_, column) =>
      Math.max(...rows.map((row) => (row[column] ?? '').length)),
    ) ?? [];

  return rows.map((row) =>
    row
      .map((cell, column) => cell.padEnd(widths[column] ?? 0))
      .join('  ')
      .trimEnd(),
  );
}

/**
 * The report for a person: one row per page, then each page's findings,
 * the message first and its evidence beneath it.
 *
 * @param {Report} report
 * @returns {string}
 */
export function toTable(report) {
  const { origin, pages, summary } = report;
  const rows = [
    ['URL', 'canonical', 'hreflang', 'JSON-LD types', 'errors', 'warnings'],
    ...pages.map((page) => [
      shown(page.url, origin),
      page.canonical === page.url ? '✓' : '✗',
      String(page.hreflang.length),
      page.jsonLdTypes.join(', ') || '—',
      String(page.findings.filter((f) => f.severity === 'error').length),
      String(page.findings.filter((f) => f.severity === 'warning').length),
    ]),
  ];
  const details = pages
    .filter((page) => page.findings.length > 0)
    .flatMap((page) => [
      '',
      shown(page.url, origin),
      ...page.findings.flatMap((f) => [
        `  ${f.severity === 'error' ? '✗' : '!'} ${f.rule}: ${f.message}`,
        ...(f.evidence ? [`      ${f.evidence}`] : []),
      ]),
    ]);
  const total = `${summary.pages} page(s), ${summary.errors} error(s), ${summary.warnings} warning(s)`;

  return [...table(rows), ...details, '', total].join('\n');
}
