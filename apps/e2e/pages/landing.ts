import { expect, type Locator, type Page } from '@playwright/test';

import { stripNumber } from '../support/strip-number';
import { WEB_URL } from './web-host';

export type Side = 'Before' | 'After';

/** The category pages and the compare page, as a reader sees them. */
export class LandingPage {
  constructor(private readonly page: Page) {}

  async open(path: '/before' | '/after' | '/compare') {
    await this.page.goto(`${WEB_URL}${path}`);
  }

  /** The metrics strip of one variant, by the label it carries. */
  strip(side: Side): Locator {
    return this.page.getByRole('region', { name: `${side}: measured` });
  }

  /**
   * One row's value in a strip, once the strip has measured.
   *
   * The strip itself first: on /before and /after it mounts only after
   * hydration (`PageStrip` renders nothing on the server), and until it exists
   * "no skeleton inside it" is already true. On a slow runner the read then
   * landed on a cell still measuring, read "" — and `number` made that 0.
   */
  async value(side: Side, row: string): Promise<string> {
    const strip = this.strip(side);
    await expect(strip).toBeVisible({ timeout: 20_000 });
    await expect(strip.locator('.ds-skeleton')).toHaveCount(0, { timeout: 20_000 });

    return (
      await strip
        .locator('.lab-strip__row', { has: this.page.getByText(row, { exact: true }) })
        .locator('dd')
        .innerText()
    ).trim();
  }

  /** A strip value read as a number; see `stripNumber` for what it refuses. */
  async number(side: Side, row: string): Promise<number> {
    return stripNumber(await this.value(side, row));
  }

  frame(side: Side): Locator {
    return this.page.getByTitle(
      side === 'Before' ? 'Before: one image per star' : 'After: one image per rating',
    );
  }

  ratingImages(): Locator {
    return this.page.getByRole('img', { name: /^Rated \d(\.\d)? out of 5$/ });
  }

  async runAccessibilityCheckOnBoth() {
    await this.page
      .getByRole('button', { name: 'Run accessibility check on both' })
      .click();
    for (const side of ['Before', 'After'] as const) {
      await expect(this.strip(side).locator('.lab-strip__running')).toHaveCount(0, {
        timeout: 60_000,
      });
      await expect(this.strip(side).getByRole('button')).toHaveCount(0);
    }
  }
}
