'use client';

import { useEffect, useRef } from 'react';
import { useDocumentMetrics } from '@/hooks/useDocumentMetrics';
import { CompareScreen } from './CompareScreen';

/** The compare page's measuring half: one iframe per variant, measured in place. */
export function CompareView() {
  const beforeFrame = useRef<HTMLIFrameElement>(null);
  const afterFrame = useRef<HTMLIFrameElement>(null);
  const before = useDocumentMetrics('/before');
  const after = useDocumentMetrics('/after');

  // Each handler reads its frame's window when it runs, never during render.
  const measureBefore = () => {
    const win = beforeFrame.current?.contentWindow;
    if (win) void before.measure(win);
  };
  const measureAfter = () => {
    const win = afterFrame.current?.contentWindow;
    if (win) void after.measure(win);
  };
  const auditBefore = () => {
    const win = beforeFrame.current?.contentWindow;
    if (win) void before.audit(win);
  };
  const auditAfter = () => {
    const win = afterFrame.current?.contentWindow;
    if (win) void after.audit(win);
  };

  // A frame can finish loading before this component hydrates, and then its
  // `load` has already fired with no handler attached. Measure any frame that
  // is complete by the time we mount; the others report through `onLoad`.
  useEffect(() => {
    const pairs = [
      [beforeFrame.current, before.measure],
      [afterFrame.current, after.measure],
    ] as const;
    for (const [frame, measure] of pairs) {
      const win = frame?.contentWindow;
      if (
        win &&
        frame.contentDocument?.readyState === 'complete' &&
        win.location.href !== 'about:blank'
      ) {
        void measure(win);
      }
    }
  }, [before.measure, after.measure]);

  return (
    <CompareScreen
      before={{
        label: 'Before',
        src: '/before',
        title: 'Before: one image per star',
        state: before.state,
        frameRef: beforeFrame,
        onLoad: measureBefore,
        onRunAxe: auditBefore,
      }}
      after={{
        label: 'After',
        src: '/after',
        title: 'After: one image per rating',
        state: after.state,
        frameRef: afterFrame,
        onLoad: measureAfter,
        onRunAxe: auditAfter,
      }}
      onRunBoth={() => {
        auditBefore();
        auditAfter();
      }}
    />
  );
}
