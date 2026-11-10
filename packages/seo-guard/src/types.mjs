// @ts-check

/**
 * @typedef {'error' | 'warning'} Severity
 * @typedef {{ rule: string, severity: Severity, message: string, evidence: string }} Finding
 * @typedef {{ status: number, facts: import('./extract.mjs').PageFacts | null }} Fetched
 * @typedef {object} Context
 * @property {string} origin                        What counts as internal.
 * @property {Map<string, Fetched>} pages           Every page fetched in this run, by URL.
 * @typedef {(facts: import('./extract.mjs').PageFacts, ctx: Context) => Finding[]} Rule
 */

export {};
