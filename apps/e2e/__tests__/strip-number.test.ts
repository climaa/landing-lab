import { describe, expect, it } from 'vitest';

import { stripNumber } from '../support/strip-number';

describe('stripNumber', () => {
  it.each([
    ['1,529', 1529],
    ['660', 660],
    ['219.5 KB', 219.5],
    ['0', 0],
  ])('reads %j as %d', (text, expected) => {
    // Act
    const value = stripNumber(text);

    // Assert
    expect(value).toBe(expected);
  });

  // The flake: a strip read before it had measured gave "", which Number() turns
  // into 0, and "the image count shown equals the images in the document" failed
  // with 0 ≠ 660. A cell with no digit is not a reading; it must not pass as one.
  it.each([[''], ['—'], ['  ']])('refuses %j instead of reading it as 0', (text) => {
    // Act + Assert
    expect(() => stripNumber(text)).toThrow(/not a number/);
  });
});
