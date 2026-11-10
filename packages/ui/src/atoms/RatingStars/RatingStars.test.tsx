import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { RatingStars } from './RatingStars';

// `globals` is off in vitest.config.ts, so Testing Library registers no automatic
// cleanup — without this every render stacks in the same document.
afterEach(cleanup);

describe('RatingStars', () => {
  // value → [drawn half-step, accessible name]. The drawing rounds to the nearest
  // half with ties up; the name keeps the score to one decimal, so it never
  // claims the rounding the stars had to make.
  it.each([
    [0, '0', 'Rated 0 out of 5'],
    [0.5, '0.5', 'Rated 0.5 out of 5'],
    [4, '4', 'Rated 4 out of 5'],
    [4.24, '4', 'Rated 4.2 out of 5'],
    [4.25, '4.5', 'Rated 4.3 out of 5'],
    [4.75, '5', 'Rated 4.8 out of 5'],
    [4.9, '5', 'Rated 4.9 out of 5'],
    [5, '5', 'Rated 5 out of 5'],
    [-1, '0', 'Rated 0 out of 5'],
    [7, '5', 'Rated 5 out of 5'],
    [Number.NaN, '0', 'No rating'],
    [Number.POSITIVE_INFINITY, '0', 'No rating'],
  ])('draws %s as %s stars and names it "%s"', (value, drawn, name) => {
    // Arrange + Act
    render(<RatingStars value={value} />);

    // Assert
    const rating = screen.getByRole('img');
    expect(rating.getAttribute('data-value')).toBe(drawn);
    expect(rating.getAttribute('aria-label')).toBe(name);
  });

  it('is one element with no children, whatever the score', () => {
    // Arrange + Act
    const { container } = render(<RatingStars value={3.5} />);

    // Assert — the point of the atom: a rating costs one node, not five images.
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });

  it('lets a caller name the rating in its own words', () => {
    // Arrange + Act
    render(<RatingStars value={4.5} label="4.5 stars from 132 reviews" />);

    // Assert
    expect(screen.getByRole('img', { name: '4.5 stars from 132 reviews' })).toBeTruthy();
  });

  it.each([
    ['sm', 'ds-rating-stars ds-rating-stars--sm'],
    ['md', 'ds-rating-stars ds-rating-stars--md'],
    ['lg', 'ds-rating-stars ds-rating-stars--lg'],
  ] as const)('sets the %s size modifier', (size, className) => {
    // Arrange + Act
    render(<RatingStars value={4} size={size} />);

    // Assert
    expect(screen.getByRole('img').className).toBe(className);
  });

  it('defaults to md and appends a caller className after its own', () => {
    // Arrange + Act
    render(<RatingStars value={4} className="u-mt-2" />);

    // Assert
    expect(screen.getByRole('img').className).toBe(
      'ds-rating-stars ds-rating-stars--md u-mt-2',
    );
  });

  it('has no accessibility violations', async () => {
    // Arrange
    const { container } = render(<RatingStars value={4.5} />);

    // Act — the two rules off as in TriStateCheckbox.test.tsx: jsdom has no
    // computed colours, and a lone fragment has no landmark to sit in.
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });

    // Assert
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
