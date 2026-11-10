import { RatingStars } from '@lab/ui';
import type { Variant } from '@/lib/seo';
import { BeforeStars } from './BeforeStars';

/** The one leaf where the two variants draw a rating differently. */
export function Stars({ variant, value }: { variant: Variant; value: number }) {
  return variant === 'after' ? (
    <RatingStars value={value} size="sm" />
  ) : (
    <BeforeStars value={value} />
  );
}
