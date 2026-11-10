import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CategoryScreen } from '@/components/CategoryScreen';
import { CATEGORY } from '@/data/garden-designers';

const RATINGS = CATEGORY.pros.length + CATEGORY.reviews.length;
const AVATARS = RATINGS;

const markupOf = (variant: 'before' | 'after') =>
  renderToStaticMarkup(
    <CategoryScreen category={CATEGORY} variant={variant} path={`/${variant}`} />,
  );

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe('CategoryScreen', () => {
  it('draws the before page with five star images per rating and an avatar image each', () => {
    // Arrange + Act
    const html = markupOf('before');

    // Assert
    expect(count(html, /<img [^>]*src="\/before\/star-/g)).toBe(RATINGS * 5);
    expect(count(html, /<img [^>]*src="\/before\/avatar\.png"/g)).toBe(AVATARS);
  });

  it('gives none of the before page images an alt', () => {
    // Arrange + Act
    const html = markupOf('before');

    // Assert
    expect(count(html, /<img(?![^>]*\balt=)[^>]*>/g)).toBe(count(html, /<img/g));
  });

  it('draws the after page with one rating image per rating and no <img> at all', () => {
    // Arrange + Act
    const html = markupOf('after');

    // Assert
    expect(count(html, /role="img"/g)).toBe(RATINGS);
    expect(count(html, /<img/g)).toBe(0);
  });

  it('names every rating on the after page with its score', () => {
    // Arrange + Act
    const names = [...markupOf('after').matchAll(/aria-label="([^"]+)"/g)].map(
      (m) => m[1],
    );

    // Assert
    expect(
      names.filter((name) => /^Rated \d(\.\d)? out of 5$/.test(name ?? '')),
    ).toHaveLength(RATINGS);
  });

  it('links "See all" to the old address only on the before page', () => {
    // Arrange + Act
    const before = markupOf('before');
    const after = markupOf('after');

    // Assert
    expect(before).toContain('href="/garden-designers"');
    expect(after).not.toContain('href="/garden-designers"');
  });
});
