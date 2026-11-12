// @vitest-environment jsdom
//
// jsdom rather than the suite's node default: this imports ../.storybook/preview
// to read the real sidebar order, and that module pulls in addon-docs blocks.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { toId } from 'storybook/internal/csf';
import { describe, expect, it } from 'vitest';
import preview from '../.storybook/preview';
import { GATES, MEASURES } from '../src/docs/quality-gates/gates';

/**
 * A docs page's sidebar path and its URL are the same string: Storybook derives
 * the id from `<Meta title>`, so renaming a page silently invalidates every
 * `?path=/docs/...` link pointing at it. Nothing else in the repo checks those —
 * not lint, not the build, not CI — and a dead one only shows up as Storybook's
 * "story not found" screen, in the blog's case to a reader rather than to us.
 *
 * The ids here are derived with Storybook's own `toId`, not a local regex, so
 * the rule cannot drift from the one the manager actually applies.
 */

const STORYBOOK_DIR = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(STORYBOOK_DIR, '..', '..');
const DOCS_DIR = path.join(STORYBOOK_DIR, 'src', 'docs');

const mdxFilesIn = (dir: string) =>
  fs
    .readdirSync(dir, { recursive: true })
    .filter((entry): entry is string => typeof entry === 'string')
    .filter((entry) => entry.endsWith('.mdx'))
    .map((entry) => path.join(dir, entry));

/** Every unattached MDX doc renders under the name `Docs`; only the title varies. */
const DOCS_STORY_NAME = 'Docs';
const META_TITLE = /<Meta\s+title="([^"]+)"/;
const DOCS_LINK = /\?path=\/docs\/([a-z0-9-]+--docs)/g;

const docPages = mdxFilesIn(DOCS_DIR).map((file) => ({
  file: path.relative(REPO_ROOT, file),
  title: META_TITLE.exec(fs.readFileSync(file, 'utf8'))?.[1],
}));

const linkSources = [
  ...mdxFilesIn(DOCS_DIR),
  path.join(STORYBOOK_DIR, 'vercel.json'),
].map((file) => ({
  file: path.relative(REPO_ROOT, file),
  links: [...fs.readFileSync(file, 'utf8').matchAll(DOCS_LINK)].flatMap(
    ([, id]) => id ?? [],
  ),
}));

describe('every docs page declares a title', () => {
  it.each(docPages)('$file', ({ title }) => {
    expect(title).toMatch(/^Docs\//);
  });
});

/** Narrowed rather than cast: an untitled page is already a failure above, and
 *  dropping it here keeps that one failure from cascading into every other case. */
const titles = docPages.flatMap(({ title }) => title ?? []);
const knownIds = new Set(titles.map((title) => toId(title, DOCS_STORY_NAME)));

describe('every ?path=/docs/ link resolves to a page that exists', () => {
  // Files with no links at all still get a case, so the suite reports which
  // files were searched rather than silently covering a shrinking set.
  it.each(linkSources)('$file', ({ links }) => {
    expect(links.filter((id) => !knownIds.has(id))).toEqual([]);
  });
});

/** storySort nests as `'Folder', ['Child', ...]` — a child array follows its
 *  parent rather than nesting inside it, so a leaf is a string with no array
 *  after it. Only leaves are real pages; folders exist to hold them. */
const leafPaths = (nodes: readonly unknown[], prefix: string[] = []): string[] =>
  nodes.flatMap((node, index) => {
    if (typeof node !== 'string') return [];

    const trail = [...prefix, node];
    const children = nodes[index + 1];

    return Array.isArray(children) ? leafPaths(children, trail) : [trail.join('/')];
  });

const ordered = leafPaths(
  (preview.parameters?.options as { storySort: { order: unknown[] } }).storySort.order,
);
const orderedDocs = ordered.filter((entry) => entry.startsWith('Docs/'));

describe('the sidebar order and the docs pages on disk agree', () => {
  // Both directions: an unlisted page falls back to alphabetical and lands in
  // the wrong place, a listed-but-missing page is a rename nobody finished.
  it.each(titles)('%s is placed by storySort', (title) => {
    expect(orderedDocs).toContain(title);
  });

  it('storySort lists no docs page that does not exist', () => {
    expect(orderedDocs.filter((entry) => !titles.includes(entry))).toEqual([]);
  });
});

/**
 * Every link this repository writes in prose to one of its own properties
 * carries the tag naming the surface it left.
 *
 * WHY A TEST AND NOT A HELPER. These links are markdown inside `.mdx` — prose,
 * not code, so no call site can import `tagOutbound` to get this right. The tag
 * is typed by hand, which means it is forgotten by hand; this is the only thing
 * that makes it enforceable. It is also why Storybook can be an origin at all.
 *
 * `storybook.carloslima.dev` IS DELIBERATELY EXEMPT as a destination. Its beacon
 * rewrites the reported URL to `origin + <the path param>` and drops the rest of
 * the query before recording it (`.storybook/analytics-head.ts`), so a tag
 * arriving there dies one step short of the dashboard. Tagging it anyway would
 * put a parameter in the address bar of every reader who followed it in exchange
 * for nothing — the same trade this repo declines for `github.com`.
 *
 * Anchored on `](https://…)` so it matches link TARGETS only. Bare hostnames in
 * prose are not links — `qa/AcceptanceSuiteLocally.mdx` names one inside a code
 * span, and `qa/DeployedConsole.mdx` uses one as the visible label of a link
 * whose target is the same host. Rewriting on the host rather than the target
 * would corrupt that label.
 */
const OWN_PROPERTY_LINK = /\]\((https:\/\/(?:[a-z-]+\.)?carloslima\.dev[^)]*)\)/g;
const EXEMPT_HOST = 'storybook.carloslima.dev';

const proseLinks = [{ dir: DOCS_DIR, source: 'storybook' }].flatMap(({ dir, source }) =>
  mdxFilesIn(dir).flatMap((file) =>
    [...fs.readFileSync(file, 'utf8').matchAll(OWN_PROPERTY_LINK)]
      .map(([, url]) => ({
        file: path.relative(REPO_ROOT, file),
        url: url ?? '',
        source,
      }))
      .filter(({ url }) => !url.includes(EXEMPT_HOST)),
  ),
);

describe('every outbound link to an own property says where it came from', () => {
  it('found some to check', () => {
    expect(proseLinks.length).toBeGreaterThan(0);
  });

  it.each(proseLinks)('$file → $url', ({ url, source }) => {
    expect(new URL(url).searchParams.get('utm_source')).toBe(source);
  });
});

/**
 * The Quality Gates pages state facts about other files: job names, measured
 * numbers, rule ids. Prose about a file drifts the day the file changes and
 * nothing notices, so each fact a test can hold is held here, against the file
 * it was copied from. What stays prose is covered by the `Source:` line under
 * every diagram, which this block also requires.
 */
const QUALITY_GATES_DIR = path.join(DOCS_DIR, 'quality-gates');
const read = (relative: string) =>
  fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8');

const prYml = read('.github/workflows/pr.yml');
const jobsBlock = prYml.slice(prYml.indexOf('\njobs:'));
/** Two-space keys under `jobs:` are the job ids. */
const prJobs = [...jobsBlock.matchAll(/^ {2}([a-z][a-z0-9-]*):\s*$/gm)].map(
  ([, id]) => id,
);
/** A `checks` leg is `name: <id>,` inside the matrix, inline or spread over lines. */
const prLegs = [...jobsBlock.matchAll(/\bname: ([a-z][a-z0-9-]*),/g)].map(([, id]) => id);

const readme = read('README.md');
/** The README table row a measure was copied from, found by its label cell. */
const readmeRow = (label: string) =>
  readme.split('\n').find((line) => line.startsWith(`| ${label} `)) ?? '';

const ruleSources = fs
  .readdirSync(path.join(REPO_ROOT, 'packages/seo-guard/src/rules'))
  .map((file) => read(`packages/seo-guard/src/rules/${file}`))
  .join('\n');
const documentedRules = [
  ...fs
    .readFileSync(path.join(QUALITY_GATES_DIR, 'SeoGuard.mdx'), 'utf8')
    .matchAll(/^\| `([a-z]+(?:-[a-z]+)+)`/gm),
].map(([, id]) => id ?? '');

/** Each `<Mermaid …/>` on a page, with the text that follows it. The chart
 *  ends at its closing `` `} ``: a `<br/>` inside it is not the tag's end. */
const splitDiagram = (segment: string) => {
  const end = segment.indexOf('/>', segment.indexOf('`}'));

  return { chart: segment.slice(0, end), after: segment.slice(end + 2).trimStart() };
};
const diagrams = mdxFilesIn(QUALITY_GATES_DIR).flatMap((file) =>
  fs
    .readFileSync(file, 'utf8')
    .split('<Mermaid')
    .slice(1)
    .map((segment) => ({
      file: path.relative(REPO_ROOT, file),
      ...splitDiagram(segment),
    })),
);
/** Node ids as these pages write them: capitals before a shape bracket. */
const nodeIds = (chart: string) =>
  new Set([...chart.matchAll(/\b([A-Z]{1,3})\s*[[{(]/g)].map(([, id]) => id));

describe('quality gates docs', () => {
  it.each(GATES)('$name is a $kind in pr.yml', ({ name, kind }) => {
    expect(kind === 'job' ? prJobs : prLegs).toContain(name);
  });

  it.each(MEASURES)('"$label" is the README row it was copied from', (measure) => {
    const row = readmeRow(measure.label);
    expect(row).toContain(measure.before);
    expect(row).toContain(`**${measure.after}`);
  });

  it('documents some SEO rules', () => {
    expect(documentedRules.length).toBeGreaterThan(0);
  });

  it.each(documentedRules)('rule %s is written in packages/seo-guard', (id) => {
    expect(ruleSources).toContain(`rule: '${id}'`);
  });

  it.each(diagrams)(
    'a diagram on $file has a Source: line and at most 12 nodes',
    (diagram) => {
      expect(diagram.after.startsWith('Source:')).toBe(true);
      expect(nodeIds(diagram.chart).size).toBeLessThanOrEqual(12);
    },
  );
});

/**
 * The README's "Before and after, measured" table is the one source of the lab's
 * numbers. Every other page that prints them copies it, and this block fails the
 * day a copy and the source disagree: a re-measure that updates one and not the
 * other is exactly how 1,529 and 1,530 ended up on the same site.
 */
type Row = { label: string; cells: string[] };

/** The pipe-table rows of the section under `heading`, header and rule dropped. */
const tableUnder = (text: string, heading: string): Row[] => {
  const section = text.slice(text.indexOf(heading)).split(/\n## /)[0] ?? '';

  return section
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.startsWith('| --'))
    .slice(1)
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.replaceAll('**', '').trim()),
    )
    .map(([label = '', ...cells]) => ({ label, cells }));
};

const readmeTable = tableUnder(readme, '## Before and after, measured');
const ratingStarsTable = tableUnder(
  fs.readFileSync(path.join(DOCS_DIR, 'atomic-design', 'RatingStars.mdx'), 'utf8'),
  '## What it changed, measured',
);

/** "1,530" → 1530, "220.2 KB" → 220.2; undefined when the cell holds no number. */
const leadingNumber = (cell: string) => {
  const match = /^([\d,]+(?:\.\d+)?)/.exec(cell);

  return match?.[1] === undefined ? undefined : Number(match[1].replaceAll(',', ''));
};

/** Rows that state a change as "(−N %)" after the /after value. */
const percentRows = readmeTable.flatMap(({ label, cells: [before = '', after = ''] }) => {
  const stated = /\(−(\d+) %\)/.exec(after)?.[1];

  return stated === undefined
    ? []
    : [
        {
          label,
          before: leadingNumber(before),
          after: leadingNumber(after),
          stated: Number(stated),
        },
      ];
});

/** Wherever the numbers are written: an axe count is rules on elements, never "N violations". */
const numberSources = [
  'README.md',
  'apps/storybook/src/docs/quality-gates/gates.ts',
  ...mdxFilesIn(DOCS_DIR).map((file) => path.relative(REPO_ROOT, file)),
];

describe("the README's measured table is the one source of the numbers", () => {
  it('has the table to compare against', () => {
    expect(readmeTable.length).toBeGreaterThan(0);
    expect(ratingStarsTable.length).toBeGreaterThan(0);
  });

  it.each(ratingStarsTable)(
    'Rating Stars repeats "$label" exactly',
    ({ label, cells }) => {
      expect(readmeTable.find((row) => row.label === label)?.cells).toEqual(cells);
    },
  );

  it.each(percentRows)('"$label" states the change its own numbers make', (row) => {
    expect(row.before).toBeGreaterThan(0);
    const change = (((row.before ?? 0) - (row.after ?? 0)) / (row.before ?? 1)) * 100;
    expect(Math.round(change)).toBe(row.stated);
  });

  it.each(numberSources)('%s never counts axe findings as "N violations"', (file) => {
    expect(read(file)).not.toMatch(/\b\d[\d,]*\s+(?:axe\s+)?violations\b/i);
  });
});
