import { Button, Skeleton, Spinner } from '@lab/ui';
import type { StripState } from '@/hooks/useDocumentMetrics';
import { IGNORE_ATTRIBUTE } from '@/lib/metrics';

export interface MetricsStripProps {
  label: string;
  state: StripState;
  onRunAxe?: () => void;
}

const COUNT = new Intl.NumberFormat('en-GB');
const KB = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function Value({ state, value }: { state: StripState; value: string | undefined }) {
  if (state.status === 'measuring') return <Skeleton width={12} />;
  if (state.status === 'error' || value === undefined) return <span>—</span>;

  return <span>{value}</span>;
}

function Accessibility({
  state,
  onRunAxe,
}: Pick<MetricsStripProps, 'state' | 'onRunAxe'>) {
  const { status, result } = state.axe;
  if (status === 'running') {
    return (
      <span className="lab-strip__running">
        <Spinner /> checking
      </span>
    );
  }
  if (status === 'done' && result) {
    return (
      <span className={result.violations === 0 ? 'lab-pass' : 'lab-fail'}>
        {result.violations === 0
          ? '0'
          : `${COUNT.format(result.violations)} ${result.violations === 1 ? 'rule' : 'rules'} · ${COUNT.format(result.nodes)} elements`}
      </span>
    );
  }
  if (status === 'error') return <span>—</span>;

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onRunAxe}
      disabled={!onRunAxe || state.status !== 'measured'}
    >
      Run accessibility check
    </Button>
  );
}

/**
 * One page's numbers. Presentational: the values arrive measured, and the strip
 * only lays them out. It marks itself with `data-metrics-ignore`, so a page that
 * shows its own strip is measured without it.
 */
export function MetricsStrip({ label, state, onRunAxe }: MetricsStripProps) {
  const { dom, htmlBytes } = state;
  const missing = dom?.imagesWithoutAlt ?? 0;
  const rows: [string, string | undefined, string?][] = [
    ['Images', dom && COUNT.format(dom.images)],
    [
      'Images without alt',
      dom && COUNT.format(missing),
      missing > 0 ? 'lab-fail' : 'lab-pass',
    ],
    ['DOM elements', dom && COUNT.format(dom.domNodes)],
    ['HTML', htmlBytes === undefined ? undefined : `${KB.format(htmlBytes / 1024)} KB`],
  ];

  return (
    <section
      className="lab-strip"
      aria-label={`${label}: measured`}
      {...{ [IGNORE_ATTRIBUTE]: '' }}
    >
      <h2 className="lab-strip__label">{label}</h2>
      <dl className="lab-strip__rows">
        {rows.map(([key, value, tone]) => (
          <div key={key} className="lab-strip__row">
            <dt>{key}</dt>
            <dd className={state.status === 'measured' ? tone : undefined}>
              <Value state={state} value={value} />
            </dd>
          </div>
        ))}
        <div className="lab-strip__row">
          <dt>Accessibility</dt>
          <dd>
            <Accessibility state={state} onRunAxe={onRunAxe} />
          </dd>
        </div>
      </dl>
      {state.status === 'error' && (
        <p className="lab-strip__error">Could not measure this page.</p>
      )}
    </section>
  );
}

/** What each number is, said once, under the strips. */
export function HowMeasured() {
  return (
    <details className="lab-how" {...{ [IGNORE_ATTRIBUTE]: '' }}>
      <summary>How these are measured</summary>
      <ul>
        <li>
          In your browser, in the page the numbers sit above, once it has loaded and
          settled.
        </li>
        <li>
          Images: every &lt;img&gt; in the document, loaded or not. Without alt: no alt
          attribute at all; alt=&quot;&quot; counts as present.
        </li>
        <li>
          DOM elements: elements after hydration, Next&apos;s own scripts included; text
          and comments are not elements.
        </li>
        <li>
          HTML: the document&apos;s decoded bytes from a fresh request, without images,
          scripts or styles.
        </li>
        <li>
          Accessibility: axe-core 4.14, rules tagged wcag2a, wcag2aa, wcag21a and
          wcag21aa, run only when you ask.
        </li>
      </ul>
    </details>
  );
}
