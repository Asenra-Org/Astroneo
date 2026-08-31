import type { FeaturedStar } from '@/types/star';

export declare const MIN_DESCRIPTION_CHARS: number;

/** Slugs that have a long-form, human-written article in star-articles.json. */
export declare function getArticleSlugs(): Set<string>;

/**
 * True when a star/planet/moon page carries enough original content to justify
 * asking Google to index it. See lib/indexable.js for the full rationale.
 */
export declare function isIndexableStar(star: Partial<FeaturedStar> | null | undefined): boolean;
