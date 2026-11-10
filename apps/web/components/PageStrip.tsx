'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useDocumentMetrics } from '@/hooks/useDocumentMetrics';
import { IGNORE_ATTRIBUTE, publishAudit } from '@/lib/metrics';
import { HowMeasured, MetricsStrip } from './MetricsStrip';

/** Whether this page is the top window, not one of the compare page's frames. */
const isTopLevel = () => window.top === window.self;
const notOnTheServer = () => false;
const neverChanges = () => () => {};

/**
 * The page's own numbers, at the top of /before or /after when it is opened on
 * its own. Inside the compare page's iframes it draws nothing — the compare page
 * draws both strips itself — so the page measured there is the bare page.
 *
 * Mounted after hydration only, and excluded from what it measures, so the
 * numbers are the page's and not the strip's.
 */
export function PageStrip({ label, path }: { label: string; path: string }) {
  const topLevel = useSyncExternalStore(neverChanges, isTopLevel, notOnTheServer);
  const { state, measure, audit } = useDocumentMetrics(path);

  // Inside the compare page's frame, the page draws no strip but lends the
  // compare page its own axe: an audit has to run in the window it audits.
  useEffect(() => (topLevel ? undefined : publishAudit(window)), [topLevel]);

  useEffect(() => {
    if (!topLevel) return;
    const start = () => void measure(window);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => window.removeEventListener('load', start);
  }, [measure, topLevel]);

  if (!topLevel) return null;

  return (
    <div className="lab-page-strip" {...{ [IGNORE_ATTRIBUTE]: '' }}>
      <MetricsStrip
        label={label}
        state={state}
        path={path}
        onRunAxe={() => void audit(window)}
      />
      <HowMeasured />
    </div>
  );
}
