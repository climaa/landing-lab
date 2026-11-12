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
//   node scripts/leak-guard.mjs --staged        what the next commit holds
//
// `--staged` is the pre-commit mode: it reads each staged file from the index,
// not the working tree, since the index is what gets committed. A term staged
// and then cleaned from disk only would otherwise pass.
//
// It runs in `.husky/pre-commit`, on the machine that holds the denylist. CI
// does not run it, on purpose: the denylist never reaches CI, so a CI leg could
// only pass without checking anything.
//
// Exit 0: no hit, or no denylist on this machine (a one-line warning, since a
// fresh clone has none). 1: a tracked file holds a term; each hit is printed
// as path:line with the term masked. The denylist itself is never printed.
// Matching is case-insensitive and literal. `.pen` boards and binaries are
// skipped: a board is drawn text that only Pencil edits, and a binary is not
// read as text.
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

/**
 * A term as it may be printed: its first character, then a fixed mask, so a
 * hit can be told apart from another without the log spelling it, or its
 * length, out.
 *
 * @param {string} term @returns {string}
 */
export const maskTerm = (term) => `${term.slice(0, 1)}***`;

/** @param {string} root @returns {{ path: string, text: string }[]} */
function trackedTextFiles(root) {
  const listed = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });

  return listed
    .split('\0')
    .filter((path) => path !== '' && !SKIPPED.test(path))
    .filter((path) => existsSync(join(root, path)))
    .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
}

/** @param {string} root @param {string} path @returns {string} */
const stagedText = (root, path) =>
  execFileSync('git', ['show', `:${path}`], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

/**
 * Every file the next commit adds or changes, as the index holds it.
 *
 * @param {string} root @returns {{ path: string, text: string }[]}
 */
function stagedTextFiles(root) {
  const listed = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'],
    { cwd: root, encoding: 'utf8' },
  );

  return listed
    .split('\0')
    .filter((path) => path !== '' && !SKIPPED.test(path))
    .map((path) => ({ path, text: stagedText(root, path) }));
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
    console.warn(`leak-guard: warning: no ${DENYLIST} on this machine, nothing checked`);

    return 0;
  }

  const terms = parseDenylist(readFileSync(denylistPath, 'utf8'));
  const staged = argv.includes('--staged');
  const files = staged ? stagedTextFiles(root) : trackedTextFiles(root);
  const leaks = findLeaks(files, terms);

  if (leaks.length === 0) {
    console.log(
      `leak-guard: ${terms.length} term(s), no ${staged ? 'staged' : 'tracked'} file holds one`,
    );

    return 0;
  }

  // The term is masked, never echoed: a terminal log gets pasted into issues.
  console.error('leak-guard: a tracked file names something it must not');
  leaks.forEach(({ path, line, term }) =>
    console.error(`  ${path}:${line}  ${maskTerm(term)}`),
  );

  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
