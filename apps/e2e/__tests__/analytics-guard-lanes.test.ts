import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Every lane that opens a browser installs the analytics guard, automatically.
 *
 * Structural on purpose: the guard's behaviour is proven in
 * `analytics-guard.test.ts`; what can silently go missing is a lane that never
 * installs it. The local lane did not until landing-lab#1.
 */
const LANE_FIXTURES = ['steps/acceptance/fixtures.ts', 'steps/local/fixtures.ts'];

describe('the analytics guard in every lane', () => {
  it.each(LANE_FIXTURES)('%s installs guardAnalytics as an auto fixture', (file) => {
    // Arrange
    const source = readFileSync(join(import.meta.dirname, '..', file), 'utf8');

    // Act
    const guardFixture = /analyticsGuard:\s*\[[\s\S]*?guardAnalytics\(context\)[\s\S]*?\{\s*auto:\s*true\s*\}/.exec(
      source,
    );

    // Assert
    expect(source).toContain("from '../../support/analytics-guard'");
    expect(guardFixture, `${file} has no automatic analyticsGuard fixture`).not.toBeNull();
  });
});
