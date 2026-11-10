import { expect, type Response } from '@playwright/test';
import { test as base } from 'playwright-bdd';

import { Chrome } from '../../pages/chrome';
import { ComparisonModal } from '../../pages/comparison-modal';
import { ConsolePage } from '../../pages/console';
import { ReportPage } from '../../pages/report';
import { ShotView } from '../../pages/shot-view';
import { guardAnalytics } from '../../support/analytics-guard';

/** What one scenario's steps hand each other — e.g. how many variants were
 *  reviewed before the step that marks one. A plain object, not a return
 *  value: playwright-bdd steps take fixtures, not each other's results. */
export interface ScenarioState {
  /** How many variants were marked reviewed before the step that marks one. */
  reviewedBefore?: number;
  /** Which report an accept scenario is about, when it is not the one the
   *  console's picker opens on. */
  acceptReport?: string;
  /** What a navigation answered with, for the scenarios whose claim is the
   *  status code rather than anything on the page. */
  response?: Response | null;
}

/** Page objects reach the steps as fixtures, never as `new` inside a step: two steps
 *  in one scenario then share the instance instead of building it twice, and a step
 *  file's imports stay the pages it actually drives. Every later scenario extends this
 *  one object.
 *
 *  It lives under `steps/acceptance/` because that is where `bddgen` looks for the
 *  extended `test` instance — the `steps` glob in playwright.config.ts is the only place
 *  it scans, and it names the lane rather than the layer root so these specs can never
 *  bind to the local lane's `test` (whose page objects point at the dev server on 3300). */
export const test = base.extend<{
  chrome: Chrome;
  console: ConsolePage;
  report: ReportPage;
  modal: ComparisonModal;
  shot: ShotView;
  scenarioState: ScenarioState;
  analyticsGuard: void;
}>({
  chrome: async ({ page }, use) => {
    await use(new Chrome(page));
  },
  console: async ({ page }, use) => {
    await use(new ConsolePage(page));
  },
  report: async ({ page }, use) => {
    await use(new ReportPage(page));
  },
  modal: async ({ page }, use) => {
    await use(new ComparisonModal(page));
  },
  shot: async ({ page }, use) => {
    await use(new ShotView(page));
  },
  scenarioState: async ({}, use) => {
    await use({});
  },
  /** Automatic, so no scenario can forget it: every context the suite opens has
   *  the analytics beacon aborted and the owner's opt-out stored, and a beacon
   *  request that got through anyway fails the scenario — see
   *  `support/analytics-guard.ts` for why `E2E_BASE_URL` makes this necessary. */
  analyticsGuard: [
    async ({ context }, use) => {
      const leaked = await guardAnalytics(context);
      await use();
      expect(leaked(), 'a Vercel Web Analytics beacon left the browser').toEqual([]);
    },
    { auto: true },
  ],
});
