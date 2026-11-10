/**
 * Taskbloom's garden designers: the one category the lab draws, twice.
 *
 * Everything here is fictional — the brand, the businesses, the towns, the
 * reviewers and their words — and generated rather than typed, from a fixed
 * seed, so both variants draw exactly the same content and every build draws
 * the same page. A page reads this module; it reads no file.
 */

export interface Review {
  id: string;
  author: string;
  initials: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** A half step between 1 and 5. */
  rating: number;
  body: string;
}

export interface Pro {
  id: string;
  name: string;
  initials: string;
  town: string;
  yearsTrading: number;
  /** The mean of `reviews`, never typed in. */
  rating: number;
  reviews: Review[];
}

export interface Category {
  brand: string;
  title: string;
  pros: Pro[];
  /** Every review, newest first, as the page's "Recent reviews" list draws them. */
  reviews: Review[];
  /** The mean over every review, for the page's AggregateRating. */
  rating: number;
  reviewCount: number;
}

export const SEED = 20261110;
const PROS_COUNT = 10;
const REVIEWS_PER_PRO = 10;

const PRO_NAMES: readonly [string, string][] = [
  ['Fernwick Gardens', 'North Halden'],
  ['Lowmoor Landscapes', 'Eastbridge'],
  ['Hollin & Reed', 'Ashcombe'],
  ['Brackenfold Design', 'Little Wendover'],
  ['Quillstone Gardens', 'Marrowby'],
  ['Thistledown Studio', 'Kelling Cross'],
  ['Saltmarsh Planting Co.', 'Wyvern Bay'],
  ['Orchard Lane Designs', 'Stonebridge'],
  ['Copperbeech Outdoor', 'Hartley Fen'],
  ['Wildgate Gardens', 'Pellham'],
];

const FIRST_NAMES = [
  'Maya',
  'Tomas',
  'Ines',
  'Rhys',
  'Priya',
  'Oskar',
  'Lena',
  'Kofi',
  'Ada',
  'Jonah',
  'Nadia',
  'Felix',
  'Sana',
  'Ewan',
  'Mira',
  'Theo',
  'Zara',
  'Callum',
  'Ruth',
  'Idris',
];
const LAST_INITIALS = 'ABCDEFGHJKLMNPRSTW';

const SENTENCES = [
  'Turned a sloping plot into three terraces we actually use.',
  'Clear plan, clear price, and the work finished a week early.',
  'The planting scheme still looks good in the second winter.',
  'They listened more than they talked at the first visit.',
  'Every drawing came with a cost beside it, which helped us choose.',
  'The new path drains properly for the first time in years.',
  'Small garden, big change: it feels twice the size now.',
  'Kept the old apple tree and designed around it.',
  'Arrived when they said they would, every single day.',
  'The lighting plan makes evenings outside a real option.',
  'Honest about what would not grow in our clay soil.',
  'Left the site cleaner than they found it.',
  'Our children have a lawn again instead of a mud patch.',
  'The raised beds are the right height for my back.',
  'A tricky shared boundary, handled calmly with the neighbours.',
  'Native planting that brought the birds back.',
  'Took a vague idea and made it into a proper plan.',
  'Fair when a delivery was late and they had to rearrange.',
  'The seating area gets sun until the evening now.',
  'Would hire them again for the front garden next year.',
];

/** Weighted towards good reviews, as a category page's are: 3.5–5 in halves. */
const RATINGS = [5, 5, 5, 4.5, 4.5, 4.5, 4, 4, 3.5, 5];

/** mulberry32: a small seeded PRNG, so the page is the same on every build. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

const mean = (values: readonly number[]) =>
  Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T;

/** A date in 2026, January to October, as `YYYY-MM-DD`. */
function dateFrom(random: () => number): string {
  const month = 1 + Math.floor(random() * 10);
  const day = 1 + Math.floor(random() * 28);

  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function reviewFor(random: () => number, proIndex: number, index: number): Review {
  const first = pick(random, FIRST_NAMES);
  const last = pick(random, [...LAST_INITIALS]);
  const sentenceA = pick(random, SENTENCES);
  const sentenceB = pick(
    random,
    SENTENCES.filter((s) => s !== sentenceA),
  );

  return {
    id: `r-${proIndex}-${index}`,
    author: `${first} ${last}.`,
    initials: `${first[0]}${last}`,
    date: dateFrom(random),
    rating: pick(random, RATINGS),
    body: `${sentenceA} ${sentenceB}`,
  };
}

export function buildCategory(seed = SEED): Category {
  const random = mulberry32(seed);
  const pros = PRO_NAMES.slice(0, PROS_COUNT).map(([name, town], proIndex): Pro => {
    const reviews = Array.from({ length: REVIEWS_PER_PRO }, (_, index) =>
      reviewFor(random, proIndex, index),
    );

    return {
      id: `p-${proIndex}`,
      name,
      initials: initialsOf(name),
      town,
      yearsTrading: 3 + Math.floor(random() * 20),
      rating: mean(reviews.map((review) => review.rating)),
      reviews,
    };
  });
  const reviews = pros
    .flatMap((pro) => pro.reviews)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

  return {
    brand: 'Taskbloom',
    title: 'Garden designers near you',
    pros,
    reviews,
    rating: mean(reviews.map((review) => review.rating)),
    reviewCount: reviews.length,
  };
}

export const CATEGORY = buildCategory();
