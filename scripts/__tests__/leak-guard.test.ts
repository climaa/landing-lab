import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

// @ts-expect-error — plain .mjs with JSDoc types, no declaration file.
import { findLeaks, parseDenylist } from '../leak-guard.mjs';

const SCRIPT = resolve(__dirname, '../leak-guard.mjs');

describe('parseDenylist', () => {
  it('keeps one term per line, trimmed, skipping blanks and comments', () => {
    // Arrange
    const text = '# names that must never ship\n  Acme Corp  \n\nacme.example\n';

    // Act
    const terms = parseDenylist(text);

    // Assert
    expect(terms).toEqual(['Acme Corp', 'acme.example']);
  });
});

describe('findLeaks', () => {
  it('reports each hit as path:line, case-insensitively', () => {
    // Arrange
    const files = [
      { path: 'README.md', text: 'A lab.\nNothing from ACME CORP here.\n' },
      { path: 'apps/web/data.ts', text: "export const x = 'clean';\n" },
    ];

    // Act
    const leaks = findLeaks(files, ['acme corp']);

    // Assert
    expect(leaks).toEqual([{ path: 'README.md', line: 2, term: 'acme corp' }]);
  });

  it('finds nothing when no term appears', () => {
    // Arrange
    const files = [{ path: 'README.md', text: 'Taskbloom is fictional.\n' }];

    // Act
    const leaks = findLeaks(files, ['acme corp']);

    // Assert
    expect(leaks).toEqual([]);
  });

  it('matches a term as written, so a domain is not a word fragment', () => {
    // Arrange
    const files = [{ path: 'a.md', text: 'see acme.example/path\nacmeexample\n' }];

    // Act
    const leaks = findLeaks(files, ['acme.example']);

    // Assert
    expect(leaks).toEqual([{ path: 'a.md', line: 1, term: 'acme.example' }]);
  });
});

describe('leak-guard.mjs, run on a repository', () => {
  const dirs: string[] = [];

  afterEach(() => {
    dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  /** A throwaway git repository with one tracked file, and an optional denylist. */
  function repo(tracked: string, denylist?: string) {
    const dir = mkdtempSync(join(tmpdir(), 'leak-guard-'));
    dirs.push(dir);
    const git = (...args: string[]) =>
      spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    git('init', '-q');
    mkdirSync(join(dir, 'docs'));
    writeFileSync(join(dir, 'docs', 'page.md'), tracked);
    git('add', '.');
    if (denylist !== undefined) writeFileSync(join(dir, '.leak-denylist'), denylist);

    return spawnSync('node', [SCRIPT, '--root', dir], { encoding: 'utf8' });
  }

  it('fails naming path:line when a tracked file holds a denied term', () => {
    // Arrange + Act
    const run = repo('one\ntwo Acme Corp\n', 'acme corp\n');

    // Assert
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('docs/page.md:2');
  });

  it('passes when no tracked file holds a denied term', () => {
    // Arrange + Act
    const run = repo('Taskbloom only.\n', 'acme corp\n');

    // Assert
    expect(run.status).toBe(0);
  });

  it('passes with a one-line notice when there is no denylist', () => {
    // Arrange + Act
    const run = repo('anything\n');

    // Assert
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/no \.leak-denylist/);
  });
});
