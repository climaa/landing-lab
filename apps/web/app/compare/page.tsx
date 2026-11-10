import { SiteHeader } from '@lab/ui';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { CompareView } from '@/components/CompareView';
import { HeadLinks } from '@/lib/head';
import { BRAND, absolute } from '@/lib/site';

export const metadata: Metadata = {
  title: 'One image per star, or one per rating',
  robots: { index: false, follow: true },
};

/** The demo's one screen: both variants, side by side, measured live. */
export default function ComparePage() {
  return (
    <>
      <HeadLinks canonical={absolute('/compare')} />
      <SiteHeader brand={BRAND} brandHref="/after" as={NextLink} container="full" />
      <CompareView />
    </>
  );
}
