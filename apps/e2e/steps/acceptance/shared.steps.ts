import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { test } from './fixtures';

const { When, Then } = createBdd(test);

// Steps more than one feature speaks. They live here rather than in any one
// feature's step file, so removing a feature never takes another's steps with it.

When('I switch to the dark theme', async ({ chrome }) => {
  await chrome.switchToDarkTheme();
});

Then('the page has no accessibility violations', async ({ chrome }) => {
  // The scan itself lives on `Chrome` so both lanes ask axe the same question;
  // the claim that the answer is empty is this step's, and stays here.
  const { violations, summary } = await chrome.axeViolations();
  expect(violations, `accessibility violations: ${summary}`).toEqual([]);
});

Then('the response status is 404', ({ scenarioState }) => {
  const { response } = scenarioState;
  // No fallback and no optional chain: `undefined?.status()` is `undefined`,
  // which compares unequal to 404 and would report a soft 404 for a scenario
  // that simply never navigated.
  if (!response) {
    throw new Error('No response recorded — a "When I request …" step must run first.');
  }

  expect(response.status()).toBe(404);
});
