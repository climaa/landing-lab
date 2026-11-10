import { describe, expect, it } from 'vitest';

import { normaliseUrl } from '../normalise.mjs';

describe('normaliseUrl', () => {
  it.each([
    ['/after', 'https://lab.example/before', 'https://lab.example/after'],
    [
      'https://LAB.example:443/after',
      'https://lab.example/',
      'https://lab.example/after',
    ],
    ['/after#p-0', 'https://lab.example/', 'https://lab.example/after'],
    ['/after?b=2&a=1', 'https://lab.example/', 'https://lab.example/after?a=1&b=2'],
    ['/after/', 'https://lab.example/', 'https://lab.example/after/'],
    ['http://lab.example:80/x', 'https://lab.example/', 'http://lab.example/x'],
    ['https://other.example/x', 'https://lab.example/', 'https://other.example/x'],
    ['mailto:hi@lab.example', 'https://lab.example/', null],
    ['javascript:void(0)', 'https://lab.example/', null],
    ['http://[bad', 'https://lab.example/', null],
  ])('%s against %s is %s', (href, base, expected) => {
    // Arrange + Act
    const url = normaliseUrl(href, base);

    // Assert
    expect(url).toBe(expected);
  });
});
