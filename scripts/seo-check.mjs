// @ts-check
//
// The `seo` gate check: the built category pages, read as a crawler reads them.
//
//   node scripts/seo-check.mjs        (after `pnpm turbo run build --filter=@lab/web`)
//
// Starts `next start` for apps/web on :3400 — the origin its canonicals name when
// no deployment does, so a canonical and the server it is read from agree — then
// runs the guard twice:
//
//   1. every page the sitemap lists must have no error-level finding, and
//   2. /before must still fail. It is the antipattern on purpose; if the guard
//      ever stops finding its problems, the green in step 1 means nothing.
//
// Exit 0 when both hold, 1 when either does not, 2 when the server cannot start
// (a port already taken is refused rather than crawled: it may be serving
// something other than this build).
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { run } from '../packages/seo-guard/src/cli.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3400;
const ORIGIN = `http://localhost:${PORT}`;
const READY_MS = 60_000;

/** @returns {Promise<boolean>} */
const portIsFree = () =>
  new Promise((resolve) => {
    const probe = createServer()
      .once('error', () => resolve(false))
      .once('listening', () => probe.close(() => resolve(true)))
      .listen(PORT);
  });

async function waitForServer() {
  const deadline = Date.now() + READY_MS;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${ORIGIN}/after`)).ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

async function main() {
  if (!(await portIsFree())) {
    console.error(
      `seo-check: port ${PORT} is taken; stop whatever serves it and run again`,
    );

    return 2;
  }
  const server = spawn(
    'pnpm',
    ['--filter', '@lab/web', 'exec', 'next', 'start', '--port', String(PORT)],
    {
      cwd: ROOT,
      stdio: 'ignore',
      detached: true,
    },
  );
  try {
    if (!(await waitForServer())) {
      console.error(
        `seo-check: apps/web did not answer on ${ORIGIN} within ${READY_MS / 1000}s`,
      );

      return 2;
    }
    const site = await run(['--sitemap', `${ORIGIN}/sitemap.xml`]);
    const control = await run([`${ORIGIN}/before`], { stdout: () => {} });
    if (control !== 1)
      console.error(
        'seo-check: /before passed the guard; the guard has stopped seeing it',
      );

    return site === 0 && control === 1 ? 0 : 1;
  } finally {
    // The whole group: `pnpm exec` starts next, which starts its own server.
    if (server.pid) process.kill(-server.pid, 'SIGTERM');
  }
}

process.exitCode = await main();
