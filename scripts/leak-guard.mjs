// @ts-check
//
// No tracked file names what this public repository must never name.
//
// The lab's brand is fictional, and the site that motivated it must stay
// unnamed: no company name, domain or anything else that identifies it, in any
// tracked file. The terms themselves cannot be written here — a list of what
// must not appear is itself a mention — so they live in a gitignored
// `.leak-denylist` at the repository root, one term per line, `#` for comments.
//
//   node scripts/leak-guard.mjs                 this repository
//   node scripts/leak-guard.mjs --root <dir>    another checkout (tests)
//
// Exit 0: no hit, or no denylist on this machine (said in one line, since a
// fresh clone has none). 1: a tracked file holds a term; each hit is printed
// as path:line. Matching is case-insensitive and literal. `.pen` boards and
// binaries are skipped: a board is drawn text that only Pencil edits, and a
// binary is not read as text.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DENYLIST = '.leak-denylist';

/** Never read as text: drawn boards and binary assets. */
const SKIPPED = /\.(pen|png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|zip)$/i;

/** @param {string} text @returns {string[]} */
export function parseDenylist(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * @param {readonly { path: string, text: string }[]} files
 * @param {readonly string[]} terms
 * @returns {{ path: string, line: number, term: string }[]}
 */
export function findLeaks(files, terms) {
  const lowered = terms.map((term) => term.toLowerCase());

  return files.flatMap(({ path, text }) =>
    text
      .toLowerCase()
      .split('\n')
      .flatMap((content, index) =>
        lowered
          .filter((term) => content.includes(term))
          .map((term) => ({ path, line: index + 1, term })),
      ),
  );
}

/** @param {string} root @returns {{ path: string, text: string }[]} */
function trackedTextFiles(root) {
  const listed = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });

  return listed
    .split('\0')
    .filter((path) => path !== '' && !SKIPPED.test(path))
    .filter((path) => existsSync(join(root, path)))
    .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
}

/** @param {string[]} argv @returns {number} */
function main(argv) {
  const rootFlag = argv.indexOf('--root');
  const root =
    rootFlag === -1
      ? resolve(dirname(fileURLToPath(import.meta.url)), '..')
      : resolve(argv[rootFlag + 1] ?? '.');
  const denylistPath = join(root, DENYLIST);

  if (!existsSync(denylistPath)) {
    console.log(`leak-guard: no ${DENYLIST} on this machine, nothing to check`);

    return 0;
  }

  const terms = parseDenylist(readFileSync(denylistPath, 'utf8'));
  const leaks = findLeaks(trackedTextFiles(root), terms);

  if (leaks.length === 0) {
    console.log(`leak-guard: ${terms.length} term(s), no tracked file holds one`);

    return 0;
  }

  // The term is not echoed: the log of a public CI run is public too.
  console.error('leak-guard: a tracked file names something it must not');
  leaks.forEach(({ path, line }) => console.error(`  ${path}:${line}`));

  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
