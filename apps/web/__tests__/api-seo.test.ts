import { beforeEach, describe, expect, it, vi } from 'vitest';

const check = vi.fn();
vi.mock('@lab/seo-guard', () => ({
  check,
  GuardError: class GuardError extends Error {},
}));

const { GET } = await import('@/app/api/seo/route');
const { seoTarget } = await import('@/lib/seo-path');

const ORIGIN = 'http://localhost:3400';
const ask = (query: string) => GET(new Request(`${ORIGIN}/api/seo${query}`));

describe('seoTarget', () => {
  it.each([
    ['/after', `${ORIGIN}/after`],
    ['/ie/after?x=1', `${ORIGIN}/ie/after?x=1`],
    ['https://evil.example/', null],
    ['//evil.example', null],
    ['/\\evil.example', null],
    ['http:/x', null],
    ['', null],
    [null, null],
  ])('reads %j as %j', (path, expected) => {
    // Arrange + Act
    const target = seoTarget(path, ORIGIN);

    // Assert
    expect(target).toBe(expected);
  });
});

describe('GET /api/seo', () => {
  beforeEach(() => {
    check.mockReset();
  });

  it.each([
    '?path=https://evil.example/',
    '?path=//evil.example',
    '?path=/%5Cevil',
    '?path=http:/x',
    '',
  ])('refuses %s with 400, and fetches nothing', async (query) => {
    // Arrange + Act
    const response = await ask(query);

    // Assert
    expect(response.status).toBe(400);
    expect(check).not.toHaveBeenCalled();
  });

  it("answers a path with the guard's report for that page, on the site's own origin", async () => {
    // Arrange
    const page = { url: `${ORIGIN}/after`, findings: [] };
    check.mockResolvedValue({
      pages: [page],
      summary: { pages: 1, errors: 0, warnings: 0 },
    });

    // Act
    const response = await ask('?path=/after');

    // Assert
    expect(response.status).toBe(200);
    expect(check).toHaveBeenCalledWith({ urls: [`${ORIGIN}/after`], origin: ORIGIN });
    expect(await response.json()).toEqual({
      page,
      summary: { pages: 1, errors: 0, warnings: 0 },
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
