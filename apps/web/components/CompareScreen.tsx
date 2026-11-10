'use client';

import { Button, SegmentedControl } from '@lab/ui';
import { type Ref, useState } from 'react';
import type { StripState } from '@/hooks/useDocumentMetrics';
import { HowMeasured, MetricsStrip } from './MetricsStrip';

export interface CompareSide {
  label: 'Before' | 'After';
  /** The iframe's address, and its title. */
  src: string;
  title: string;
  state: StripState;
  frameRef?: Ref<HTMLIFrameElement>;
  /** Draws a labelled box where the live page would be, as the design board
   *  does. For a screenshot: a live page inside it would neither hold still nor
   *  keep its own accessibility failures out of the compare page's audit. */
  placeholder?: boolean;
  onLoad?: () => void;
  onRunAxe?: () => void;
}

export interface CompareScreenProps {
  before: CompareSide;
  after: CompareSide;
  onRunBoth?: () => void;
}

const TABS = [
  { value: 'Before', label: 'Before' },
  { value: 'After', label: 'After' },
] as const;

/**
 * The five-second screen: the broken page and the fixed one side by side, each
 * under the numbers measured in it. On a phone the two strips stay side by side
 * and the pages take turns below them. Draws what it is given; the compare page
 * measures, a story passes sample numbers.
 */
export function CompareScreen({ before, after, onRunBoth }: CompareScreenProps) {
  const [shown, setShown] = useState<string>('Before');
  const sides = [before, after];
  const ready = before.state.status === 'measured' && after.state.status === 'measured';

  return (
    <main id="main" className="lab-compare">
      <header className="lab-compare__head">
        <h1>One image per star, or one per rating</h1>
        <p className="lab-muted">
          The same 100 reviews, drawn two ways. Every number is measured in the page below
          it.
        </p>
      </header>
      <div className="lab-compare__strips">
        {sides.map((side) => (
          <MetricsStrip
            key={side.label}
            label={side.label}
            state={side.state}
            path={side.placeholder ? undefined : side.src}
            onRunAxe={side.onRunAxe}
          />
        ))}
      </div>
      <div className="lab-compare__tools">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRunBoth}
          disabled={!onRunBoth || !ready}
        >
          Run accessibility check on both
        </Button>
        <SegmentedControl
          className="lab-compare__tabs"
          label="Page shown"
          options={TABS}
          value={shown}
          onChange={setShown}
        />
      </div>
      <div className="lab-compare__frames">
        {sides.map((side) =>
          side.placeholder ? (
            <div
              key={side.label}
              className="lab-compare__frame lab-compare__frame--placeholder"
              data-shown={side.label === shown || undefined}
            >
              {side.src} (live page)
            </div>
          ) : (
            <iframe
              key={side.label}
              ref={side.frameRef}
              className="lab-compare__frame"
              data-shown={side.label === shown || undefined}
              src={side.src}
              title={side.title}
              onLoad={side.onLoad}
            />
          ),
        )}
      </div>
      <HowMeasured />
    </main>
  );
}
