import type { Meta, StoryObj } from '@storybook/react';

import { RatingStars } from './RatingStars';

const meta: Meta<typeof RatingStars> = {
  title: 'Atoms/RatingStars',
  component: RatingStars,
};

export default meta;

type Story = StoryObj<typeof RatingStars>;

const STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/**
 * Every value the component draws, one row each. The drawing has eleven states
 * and no more — any score rounds to one of these — so this one baseline holds
 * every fill rule in RatingStars.css.
 */
export const Scale: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--space-8) max-content',
        gap: 'var(--space-2) var(--space-3)',
        alignItems: 'center',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
      }}
    >
      {STEPS.map((step) => (
        <div key={step} style={{ display: 'contents' }}>
          <span>{step}</span>
          <RatingStars value={step} />
        </div>
      ))}
    </div>
  ),
};

/** The three type steps the stars are measured from, at the same score. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <RatingStars value={4.5} size="sm" />
      <RatingStars value={4.5} size="md" />
      <RatingStars value={4.5} size="lg" />
    </div>
  ),
};

/**
 * As a page sets it: the score in words beside the stars, then the count. The
 * stars sit on the text baseline, as a glyph of the same size would.
 */
export const InText: Story = {
  render: () => (
    <p
      style={{
        margin: 0,
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--space-1)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
      }}
    >
      <strong>4.9</strong>
      <RatingStars value={4.9} size="sm" />
      <span style={{ color: 'var(--color-text-muted)' }}>(132 reviews)</span>
    </p>
  ),
};
