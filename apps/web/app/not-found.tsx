import { SiteFooter, SiteHeader } from '@lab/ui';
import NextLink from 'next/link';
import { BRAND } from '@/lib/site';

/** Every address the app does not serve. */
export default function NotFound() {
  return (
    <>
      <SiteHeader brand={BRAND} brandHref="/after" as={NextLink} />
      <main id="main" className="lab-page">
        <section className="lab-hero">
          <h1>Page not found</h1>
          <p className="lab-muted">There is nothing at this address.</p>
          <a className="lab-link" href="/after">
            See garden designers near you
          </a>
        </section>
      </main>
      <SiteFooter
        copyright={`${BRAND}, a fictional marketplace`}
        year={2026}
        links={[]}
      />
    </>
  );
}
