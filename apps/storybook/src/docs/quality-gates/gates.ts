/**
 * The facts the Quality Gates pages state, in one place a test can hold to the
 * files they describe. `__tests__/docs-links.test.ts` fails when a `name` here
 * is not a job or a `checks` matrix leg in `.github/workflows/pr.yml`, or when a
 * measured value here is not written, as is, in the README's measured table.
 * The pages render these rows rather than restating them in prose.
 */

export interface Gate {
  /** The job key, or the `checks` matrix leg's `name:`, exactly as pr.yml has it. */
  name: string;
  /** Where it sits in pr.yml. */
  kind: 'checks leg' | 'job';
  /** The command the job runs, copied from pr.yml. */
  runs: string;
  /** What a green result proves. */
  proves: string;
  /** Whether `gate` waits on it; only `visual-diff` is left out. */
  blocking: boolean;
}

export const GATES: readonly Gate[] = [
  {
    name: 'lint',
    kind: 'checks leg',
    runs: 'pnpm turbo run lint',
    proves: 'ESLint passes in every workspace.',
    blocking: true,
  },
  {
    name: 'typecheck',
    kind: 'checks leg',
    runs: 'pnpm turbo run typecheck',
    proves: '`tsc --noEmit` passes in every workspace.',
    blocking: true,
  },
  {
    name: 'build',
    kind: 'checks leg',
    runs: 'pnpm turbo run build',
    proves: 'Every app and Storybook build from a clean install.',
    blocking: true,
  },
  {
    name: 'test',
    kind: 'checks leg',
    runs: 'pnpm turbo run test',
    proves: "Every workspace's Vitest suite passes.",
    blocking: true,
  },
  {
    name: 'format',
    kind: 'checks leg',
    runs: 'pnpm format:check',
    proves: 'Every file is as Prettier would print it.',
    blocking: true,
  },
  {
    name: 'health',
    kind: 'checks leg',
    runs: 'pnpm health:check',
    proves:
      'No function above cognitive complexity 20, the project index matches the tree, and dependencies respect the minimum release age.',
    blocking: true,
  },
  {
    name: 'boards',
    kind: 'checks leg',
    runs: 'pnpm turbo run boards:check',
    proves:
      'Every planned story has its tile on a design board, and every board PNG its scale.',
    blocking: true,
  },
  {
    name: 'seo',
    kind: 'checks leg',
    runs: 'pnpm turbo run build --filter=@lab/web && node scripts/seo-check.mjs',
    proves:
      'Every page in the sitemap has no SEO error, and the guard still fails /before.',
    blocking: true,
  },
  {
    name: 'sandcastle',
    kind: 'job',
    runs: 'pnpm typecheck:sandcastle && pnpm test:sandcastle',
    proves:
      'The agent orchestrator, which no turbo workspace covers, typechecks and passes its suite.',
    blocking: true,
  },
  {
    name: 'e2e',
    kind: 'job',
    runs: 'pnpm turbo run e2e',
    proves: 'The Gherkin acceptance scenarios pass against the built console.',
    blocking: true,
  },
  {
    name: 'visual-diff',
    kind: 'job',
    runs: 'pnpm visual-diff',
    proves:
      'Every story still matches its committed baseline screenshot; otherwise a person reads the report.',
    blocking: false,
  },
  {
    name: 'gate',
    kind: 'job',
    runs: 'needs: [checks, sandcastle, e2e]',
    proves: 'Every needed job ended in exactly `success`. The one required check.',
    blocking: true,
  },
];

export interface Measure {
  /** The row label in README.md's "Before and after, measured" table. */
  label: string;
  /** The `/before` cell, as the README writes it. */
  before: string;
  /** The `/after` cell, as the README writes it, without its bold markers. */
  after: string;
  /** The gate that keeps the `/after` value from coming back. */
  heldBy: string;
  /** Who loses if it does. */
  risk: string;
}

export const MEASURES: readonly Measure[] = [
  {
    label: '`<img>` in the page',
    before: '660',
    after: '0',
    heldBy:
      'e2e: the after page has no `<img>` at all, and its ratings are one element each.',
    risk: 'Hundreds of image elements spent on decoration, back on a page meant to rank and load fast.',
  },
  {
    label: '`<img>` without `alt`',
    before: '660',
    after: '0',
    heldBy: 'e2e: no image on the after page lacks alternative text.',
    risk: 'A screen reader announces images and says nothing about the score.',
  },
  {
    label: 'DOM elements',
    before: '1,529',
    after: '973',
    heldBy:
      'e2e: the after page has fewer DOM elements than the before page. The exact count is measured, not gated.',
    risk: 'A heavier page to parse and lay out on every visit.',
  },
  {
    label: 'axe violations (WCAG 2.1 A/AA)',
    before: '1 rule (`image-alt`) on 660 elements',
    after: '0',
    heldBy:
      'e2e: the after page has no accessibility violations. visual-diff also runs axe on every captured story, as a report.',
    risk: 'Visitors using assistive technology cannot read the ratings.',
  },
  {
    label: 'SEO guard',
    before: '4 errors',
    after: '0',
    heldBy:
      'seo: every sitemap page has no error-level finding, and /before must still fail.',
    risk: 'Search engines get mixed signals about which URL to index, and structured data that does not parse cannot feed rich results.',
  },
];
