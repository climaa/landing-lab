import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MetricsStrip } from '@/components/MetricsStrip';
import { INITIAL_STRIP, type StripState } from '@/hooks/useDocumentMetrics';

const MEASURED: StripState = {
  status: 'measured',
  dom: { images: 660, imagesWithoutAlt: 660, domNodes: 4213 },
  htmlBytes: 224_677,
  axe: { status: 'idle' },
};

const html = (state: StripState) =>
  renderToStaticMarkup(<MetricsStrip label="Before" state={state} onRunAxe={() => {}} />);

describe('MetricsStrip', () => {
  it('shows a placeholder per value while measuring, and no number', () => {
    // Arrange + Act
    const markup = html(INITIAL_STRIP);

    // Assert
    expect(markup.match(/ds-skeleton/g)?.length).toBeGreaterThanOrEqual(4);
    expect(markup).not.toMatch(/\d{3}/);
  });

  it('writes each measured number as it was measured', () => {
    // Arrange + Act
    const markup = html(MEASURED);

    // Assert
    expect(markup).toContain('>660<');
    expect(markup).toContain('>4,213<');
    expect(markup).toContain('>219.4 KB<');
  });

  it('offers the accessibility check once measured, and not before', () => {
    // Arrange + Act
    const idle = html(MEASURED);
    const measuring = html(INITIAL_STRIP);

    // Assert
    expect(idle).toMatch(/<button[^>]*>Run accessibility check<\/button>/);
    expect(measuring).toMatch(/<button[^>]*disabled=""[^>]*>Run accessibility check/);
  });

  it('shows the rules axe found violated and the elements they cover, marked as a failure', () => {
    // Arrange
    const state: StripState = {
      ...MEASURED,
      axe: {
        status: 'done',
        result: { violations: 2, nodes: 770, axeVersion: '4.14.0', tags: [] },
      },
    };

    // Act
    const markup = html(state);

    // Assert
    expect(markup).toContain('<span class="lab-fail">2 rules · 770 elements</span>');
  });

  it('says it could not measure, rather than showing a number', () => {
    // Arrange + Act
    const markup = html({ status: 'error', axe: { status: 'idle' } });

    // Assert
    expect(markup).toContain('Could not measure this page.');
  });

  it('marks itself so the page it sits on is measured without it', () => {
    // Arrange + Act
    const markup = html(MEASURED);

    // Assert
    expect(markup).toMatch(/^<section[^>]*data-metrics-ignore=""/);
  });
});
