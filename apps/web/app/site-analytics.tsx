'use client';

import { optOutBeforeSend } from '@lab/logger/analytics';
import { Analytics } from '@vercel/analytics/next';

/**
 * The page-view beacon, with the owner's opt-out attached. Open any page with
 * `?va-disable=1` once per browser to stop counting your own visits on this
 * origin, `?va-disable=0` to start again — see `@lab/logger/analytics`.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={optOutBeforeSend} />;
}
