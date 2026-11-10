#!/usr/bin/env node
// @ts-check
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { check, GuardError } from './crawl.mjs';
import { toTable } from './format.mjs';

const USAGE =
  'usage: seo-guard [url ...] [--sitemap <url>] [--origin <url>] [--json] [--max-pages <n>]';

/**
 * Exit 0: no error-level finding (warnings allowed). 1: at least one. 2: the
 * guard could not run — bad arguments, a listed URL that is not 200, an
 * unreadable sitemap — kept apart from 1 so a broken site never reads as an SEO
 * finding.
 *
 * @param {string[]} argv
 * @param {{ fetchImpl?: typeof fetch, stdout?: (text: string) => void, stderr?: (text: string) => void }} [io]
 * @returns {Promise<0 | 1 | 2>}
 */
export async function run(argv, io = {}) {
  const stdout = io.stdout ?? ((text) => process.stdout.write(`${text}\n`));
  const stderr = io.stderr ?? ((text) => process.stderr.write(`${text}\n`));
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        sitemap: { type: 'string' },
        origin: { type: 'string' },
        json: { type: 'boolean', default: false },
        'max-pages': { type: 'string', default: '200' },
      },
    });
  } catch (error) {
    stderr(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);

    return 2;
  }
  const { values, positionals } = parsed;
  const maxPages = Number(values['max-pages']);
  try {
    if (!Number.isInteger(maxPages) || maxPages < 1)
      throw new GuardError('--max-pages must be a positive integer');
    const report = await check({
      urls: positionals,
      sitemap: values.sitemap,
      origin: values.origin,
      maxPages,
      fetchImpl: io.fetchImpl,
    });
    stdout(values.json ? JSON.stringify(report, null, 2) : toTable(report));

    return report.summary.errors > 0 ? 1 : 0;
  } catch (error) {
    if (!(error instanceof GuardError) && !(error instanceof TypeError)) throw error;
    stderr(`seo-guard: ${error.message}\n${USAGE}`);

    return 2;
  }
}

// Through `pnpm exec seo-guard` argv[1] is the bin symlink, so compare real paths.
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  process.exitCode = await run(process.argv.slice(2));
}
