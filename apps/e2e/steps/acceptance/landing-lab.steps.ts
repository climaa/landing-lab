import { OPT_OUT_KEY } from '@lab/logger/analytics';
import { check, run } from '@lab/seo-guard';
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { WEB_URL } from '../../pages/web-host';
import { test } from './fixtures';

const { When, Then } = createBdd(test);

// landing-lab.feature: the category page drawn twice, measured, and read by the
// SEO guard. Numbers are compared as relations, never as absolutes, except the
// fixture's fixed 110 ratings and the before page's four SEO errors.

/** Every rating the page draws: 10 pros and 100 reviews. */
const RATINGS = 110;

// ---- Visiting ---------------------------------------------------------------

When('I visit the after page', async ({ landing }) => {
  await landing.open('/after');
});

When('I visit the before page', async ({ landing }) => {
  await landing.open('/before');
});

When('I visit the compare page', async ({ landing }) => {
  await landing.open('/compare');
});

// ---- Rating stars -----------------------------------------------------------

Then(
  'every rating on the page is one image named like {string}',
  async ({ page, landing }, example: string) => {
    // The example only shows the shape of the name; every rating must have it.
    expect(example).toMatch(/^Rated \d(\.\d)? out of 5$/);
    await expect(landing.ratingImages()).toHaveCount(RATINGS);
    // And nothing inside a rating: one element per rating, not one per star.
    const children = await landing
      .ratingImages()
      .evaluateAll((ratings) => ratings.map((rating) => rating.childElementCount));
    expect(children.every((count) => count === 0)).toBe(true);
    await expect(page.locator('img')).toHaveCount(0);
  },
);

Then('a rating of 4.5 is drawn as four and a half stars', async ({ page }) => {
  // The pixels are the baseline's job; here, the state the drawing is made from.
  const rating = page.getByRole('img', { name: 'Rated 4.5 out of 5' }).first();
  await expect(rating).toHaveAttribute('data-value', '4.5');
});

Then('no image on the page lacks alternative text', async ({ page }) => {
  await expect(page.locator('img:not([alt])')).toHaveCount(0);
});

// ---- Before and after, measured -----------------------------------------------

Then(
  'I see the before page and the after page side by side',
  async ({ page, landing }) => {
    const [before, after] = [landing.strip('Before'), landing.strip('After')];
    await expect(before).toBeVisible();
    await expect(after).toBeVisible();
    const [b, a] = [await before.boundingBox(), await after.boundingBox()];
    // The strips sit side by side at every width, the numbers within one glance.
    expect(b && a && Math.abs(b.y - a.y) < 2 && b.x < a.x).toBe(true);

    const wide = (page.viewportSize()?.width ?? 0) >= 1024;
    await expect(landing.frame('Before')).toBeVisible();
    if (wide) {
      await expect(landing.frame('After')).toBeVisible();
    } else {
      // On a phone the pages take turns below the strips.
      await expect(landing.frame('After')).toBeHidden();
      await page.getByRole('button', { name: 'After' }).click();
      await expect(landing.frame('After')).toBeVisible();
    }
  },
);

Then(
  "the after page counts fewer than a tenth of the before page's images",
  async ({ landing }) => {
    const before = await landing.number('Before', 'Images');
    const after = await landing.number('After', 'Images');
    expect(before).toBeGreaterThan(0);
    expect(after * 10).toBeLessThan(before);
  },
);

Then(
  'the after page has fewer DOM elements than the before page',
  async ({ landing }) => {
    expect(await landing.number('After', 'DOM elements')).toBeLessThan(
      await landing.number('Before', 'DOM elements'),
    );
  },
);

Then(
  "the after page's HTML document is smaller than the before page's",
  async ({ landing }) => {
    expect(await landing.number('After', 'HTML')).toBeLessThan(
      await landing.number('Before', 'HTML'),
    );
  },
);

When('I run the accessibility check on both pages', async ({ landing }) => {
  await landing.number('Before', 'Images');
  await landing.number('After', 'Images');
  await landing.runAccessibilityCheckOnBoth();
});

Then('the before page reports accessibility violations', async ({ landing }) => {
  expect(await landing.value('Before', 'Accessibility')).toMatch(/^[1-9]/);
});

Then('the after page reports none', async ({ landing }) => {
  expect(await landing.value('After', 'Accessibility')).toBe('0');
});

Then(
  'the image count shown on it equals the images in its document',
  async ({ page, landing }) => {
    const shown = await landing.number('Before', 'Images');
    expect(shown).toBe(await page.locator('img').count());
  },
);

Then('the before page shows {int} SEO findings', async ({ landing }, count: number) => {
  await expect(landing.strip('Before').getByText(`✗ ${count} findings`)).toBeVisible({
    timeout: 20_000,
  });
});

Then('the after page shows no SEO findings', async ({ landing }) => {
  await expect(landing.strip('After').getByText('✓ No findings')).toBeVisible({
    timeout: 20_000,
  });
});

// ---- The SEO guard, run in-process against the served pages ----------------------

const guard = async (paths: string[]) =>
  check({ urls: paths.map((path) => `${WEB_URL}${path}`), origin: WEB_URL });

When('the SEO guard checks the after page', async ({ scenarioState }) => {
  scenarioState.seo = { report: await guard(['/after']) };
});

When('the SEO guard checks the before page', async ({ scenarioState }) => {
  const report = await guard(['/before']);
  const exit = await run([`${WEB_URL}/before`], { stdout: () => {} });
  scenarioState.seo = { report, exit };
});

When(
  'the SEO guard checks the after page and its Irish alternate',
  async ({ scenarioState }) => {
    scenarioState.seo = { report: await guard(['/after', '/ie/after']) };
  },
);

const seoOf = (state: { seo?: { report: import('@lab/seo-guard').Report } }) => {
  if (!state.seo)
    throw new Error(
      'No SEO report: a "When the SEO guard checks …" step must run first.',
    );

  return state.seo.report;
};

const findingsOf = (state: Parameters<typeof seoOf>[0], rule: string) =>
  seoOf(state).pages.flatMap((page) =>
    page.findings.filter((finding) => finding.rule === rule),
  );

Then('it reports no findings', ({ scenarioState }) => {
  expect(seoOf(scenarioState).pages.flatMap((page) => page.findings)).toEqual([]);
});

Then(
  'it reports that {string} is not its own canonical address',
  ({ scenarioState }, path: string) => {
    const messages = findingsOf(scenarioState, 'link-non-canonical').map(
      (f) => f.message,
    );
    expect(
      messages.some((message) =>
        message.startsWith(`${path} is not its own canonical URL`),
      ),
    ).toBe(true);
  },
);

Then('it reports that {string} is declared twice', ({ scenarioState }, lang: string) => {
  const messages = findingsOf(scenarioState, 'hreflang-duplicate').map((f) => f.message);
  expect(messages).toContain(`${lang} is declared twice`);
});

Then(
  'it reports that {string} does not list the before page as an alternate',
  ({ scenarioState }, path: string) => {
    const [finding] = findingsOf(scenarioState, 'hreflang-not-reciprocal');
    expect(finding?.evidence.split(' · ')).toContain(path);
    expect(finding?.message).toMatch(/not list \/before as an alternate$/);
  },
);

Then('it reports structured data that does not parse', ({ scenarioState }) => {
  expect(findingsOf(scenarioState, 'jsonld-invalid')).toHaveLength(1);
});

Then('each lists the other as an alternate', ({ scenarioState }) => {
  const [after, irish] = seoOf(scenarioState).pages;
  expect(after?.hreflang.map((alt) => alt.href)).toContain(irish?.url);
  expect(irish?.hreflang.map((alt) => alt.href)).toContain(after?.url);
  expect(findingsOf(scenarioState, 'hreflang-not-reciprocal')).toEqual([]);
});

Then(
  'it lists {string}, {string} and {string} as structured data types',
  ({ scenarioState }, a: string, b: string, c: string) => {
    expect(seoOf(scenarioState).pages[0]?.jsonLdTypes).toEqual([a, b, c]);
  },
);

Then('the run exits with a failure', ({ scenarioState }) => {
  expect(scenarioState.seo?.exit).toBe(1);
});

// ---- Analytics ----------------------------------------------------------------

Then('no analytics beacon leaves the browser', async ({ page, analyticsGuard }) => {
  // The guard is installed (the owner's opt-out is stored, as ?va-disable=1 would
  // store it) and nothing it watches for has left the browser.
  expect(
    await page.evaluate((key) => window.localStorage.getItem(key), OPT_OUT_KEY),
  ).not.toBeNull();
  expect(analyticsGuard()).toEqual([]);
});
