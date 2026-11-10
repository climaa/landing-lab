import { describe, expect, it, vi } from 'vitest';

import { fetchSeoSummary } from '@/hooks/useDocumentMetrics';

describe('fetchSeoSummary', () => {
  it('reduces the report to its counts and the rules that fired, once each', async () => {
    // Arrange
    const body = {
      page: {
        findings: [
          { rule: 'jsonld-invalid', severity: 'error' },
          { rule: 'jsonld-invalid', severity: 'error' },
        ],
      },
      summary: { errors: 2, warnings: 0 },
    };
    const fetchImpl = vi.fn(async () => Response.json(body));

    // Act
    const summary = await fetchSeoSummary('/before', fetchImpl);

    // Assert
    expect(fetchImpl).toHaveBeenCalledWith('/api/seo?path=%2Fbefore', {
      cache: 'no-store',
    });
    expect(summary).toEqual({ errors: 2, warnings: 0, rules: ['jsonld-invalid'] });
  });

  it('refuses an answer that is not 200', async () => {
    // Arrange
    const fetchImpl = vi.fn(async () => new Response('', { status: 502 }));

    // Act + Assert
    await expect(fetchSeoSummary('/before', fetchImpl)).rejects.toThrow(/502/);
  });
});
