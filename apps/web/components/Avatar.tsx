import type { Variant } from '@/lib/seo';

/**
 * A reviewer's or a business's mark. After: their initials, hidden from the
 * accessibility tree because the name is already written beside them. Before:
 * a generic silhouette image with no `alt`, as the audited page had.
 */
export function Avatar({ variant, initials }: { variant: Variant; initials: string }) {
  if (variant === 'before') {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the missing alt IS the before page
    return <img className="lab-avatar" src="/before/avatar.png" width={40} height={40} />;
  }

  return (
    <span className="lab-avatar lab-avatar--initials" aria-hidden="true">
      {initials}
    </span>
  );
}
