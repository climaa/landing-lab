import { describe, expect, it } from 'vitest';

import { buildCategory, CATEGORY, SEED } from '@/data/garden-designers';

describe('the garden designers category', () => {
  it('is the same page for the same seed', () => {
    // Arrange + Act
    const again = buildCategory(SEED);

    // Assert
    expect(again).toEqual(CATEGORY);
  });

  it('is a different page for a different seed', () => {
    // Arrange + Act
    const other = buildCategory(SEED + 1);

    // Assert — the seed is what decides the content, not a constant beside it.
    expect(other.reviews.map((r) => r.body)).not.toEqual(
      CATEGORY.reviews.map((r) => r.body),
    );
  });

  it('holds ten pros of ten reviews each, 100 in all', () => {
    // Arrange + Act
    const { pros, reviews, reviewCount } = CATEGORY;

    // Assert
    expect(pros).toHaveLength(10);
    expect(pros.every((pro) => pro.reviews.length === 10)).toBe(true);
    expect(reviews).toHaveLength(100);
    expect(reviewCount).toBe(100);
  });

  it('rates every review in half steps between 1 and 5', () => {
    // Arrange + Act
    const ratings = CATEGORY.reviews.map((review) => review.rating);

    // Assert
    expect(ratings.every((r) => r >= 1 && r <= 5 && Number.isInteger(r * 2))).toBe(true);
  });

  it("computes each pro's rating as the mean of its reviews, to one decimal", () => {
    // Arrange + Act
    const means = CATEGORY.pros.map((pro) => {
      const sum = pro.reviews.reduce((total, review) => total + review.rating, 0);

      return Math.round((sum / pro.reviews.length) * 10) / 10;
    });

    // Assert
    expect(CATEGORY.pros.map((pro) => pro.rating)).toEqual(means);
  });

  it('lists the reviews newest first', () => {
    // Arrange + Act
    const dates = CATEGORY.reviews.map((review) => review.date);

    // Assert
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
