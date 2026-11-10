import type { Metadata } from 'next';
import bodyFace from '@lab/ui/fonts/atkinson-hyperlegible-latin-400-normal.woff2';
import bodyBoldFace from '@lab/ui/fonts/atkinson-hyperlegible-latin-700-normal.woff2';
import displayFace from '@lab/ui/fonts/fraunces-latin-600-normal.woff2';
import { BRAND, DESCRIPTION, SITE_URL } from '@/lib/site';
import { SiteAnalytics } from './site-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: { default: BRAND, template: `%s · ${BRAND}` },
  description: DESCRIPTION,
  metadataBase: SITE_URL,
};

/** Preloaded: fonts.css sets `font-display: block`, so text waits on its face. */
const ABOVE_THE_FOLD_FACES = [bodyFace, bodyBoldFace, displayFace];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {ABOVE_THE_FOLD_FACES.map((face) => (
          <link
            key={face}
            rel="preload"
            href={face}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>
        {children}
        {/* Production deployments only: a preview sets NODE_ENV=production too,
            and would otherwise count a reviewer as a reader. */}
        {process.env.VERCEL_ENV === 'production' && <SiteAnalytics />}
      </body>
    </html>
  );
}
