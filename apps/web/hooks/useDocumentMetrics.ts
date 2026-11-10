'use client';

import { useCallback, useState } from 'react';
import {
  type AxeResult,
  auditWindow,
  type DomMetrics,
  measureDocument,
  measureHtmlBytes,
} from '@/lib/metrics';

export interface SeoSummary {
  errors: number;
  warnings: number;
  /** The rules that fired, in the guard's order. */
  rules: string[];
}

export interface StripState {
  status: 'measuring' | 'measured' | 'error';
  dom?: DomMetrics;
  htmlBytes?: number;
  axe: { status: 'idle' | 'running' | 'done' | 'error'; result?: AxeResult };
  /** The SEO guard's answer for the page; absent where nothing asks for one. */
  seo?: { status: 'loading' | 'done' | 'error'; summary?: SeoSummary };
}

export const INITIAL_STRIP: StripState = {
  status: 'measuring',
  axe: { status: 'idle' },
  seo: { status: 'loading' },
};

/** What `/api/seo` answers, reduced to what the strip shows. */
export async function fetchSeoSummary(
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SeoSummary> {
  const response = await fetchImpl(`/api/seo?path=${encodeURIComponent(path)}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`/api/seo answered ${response.status}`);
  const { page, summary } = (await response.json()) as {
    page: { findings: { rule: string; severity: string }[] };
    summary: { errors: number; warnings: number };
  };

  return {
    errors: summary.errors,
    warnings: summary.warnings,
    rules: [...new Set(page.findings.map((finding) => finding.rule))],
  };
}

/** After the browser has nothing else to do, so hydration has settled the DOM. */
const whenIdle = (win: Window) =>
  new Promise<void>((resolve) => {
    if ('requestIdleCallback' in win) win.requestIdleCallback(() => resolve());
    else setTimeout(resolve, 0);
  });

/**
 * One page's numbers, measured in the window that shows it. `measure` is called
 * once that window has fired `load` — the page's own, or an iframe's — and
 * `audit` runs axe there on request, never before, so the audit's own weight
 * never counts in the numbers above it.
 */
export function useDocumentMetrics(path: string) {
  const [state, setState] = useState<StripState>(INITIAL_STRIP);

  const measure = useCallback(
    async (win: Window) => {
      try {
        await whenIdle(win);
        const dom = measureDocument(win.document);
        const htmlBytes = await measureHtmlBytes(path);
        setState((previous) => ({ ...previous, status: 'measured', dom, htmlBytes }));
      } catch {
        setState((previous) => ({ ...previous, status: 'error' }));
      }
      try {
        const summary = await fetchSeoSummary(path);
        setState((previous) => ({ ...previous, seo: { status: 'done', summary } }));
      } catch {
        setState((previous) => ({ ...previous, seo: { status: 'error' } }));
      }
    },
    [path],
  );

  const audit = useCallback(async (win: Window) => {
    setState((previous) => ({ ...previous, axe: { status: 'running' } }));
    try {
      const result = await auditWindow(win);
      setState((previous) => ({ ...previous, axe: { status: 'done', result } }));
    } catch {
      setState((previous) => ({ ...previous, axe: { status: 'error' } }));
    }
  }, []);

  return { state, measure, audit };
}
