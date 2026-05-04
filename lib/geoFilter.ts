import type { RSSItem } from './rssParser';

const INCLUDE_PATTERNS: RegExp[] = [
  /united\s+states/i, /u\.s\./i, /\bus\b/i, /\bamerican\b/i,
  /north\s+america/i, /\bcanada\b/i, /\bmexico\b/i,
  /gulf\s+coast/i, /gulf\s+of\s+mexico/i,
  /\bepa\b/i, /\bfda\b/i, /\bcpsc\b/i, /\bosha\b/i, /\bdoe\b/i, /\beia\b/i,
  /\bnymex\b/i, /\bcme\b/i, /\bwti\b/i, /henry\s+hub/i, /\bcushing\b/i,
];

const EXCLUDE_PATTERNS: RegExp[] = [
  /\bchina\b/i, /\bindia\b/i, /\beurope\b/i, /\basia\b/i,
  /\bmiddle\s+east\b/i, /\brussia\b/i, /\biran\b/i,
];

export function isNorthAmericanRelevant(
  item: RSSItem,
  sourceCountry: 'us' | 'uk' | 'global'
): boolean {
  // US-origin sources are presumed relevant
  if (sourceCountry === 'us') return true;

  const text = `${item.title} ${item.summary ?? ''}`;

  const hasInclude = INCLUDE_PATTERNS.some(re => re.test(text));
  if (hasInclude) return true;

  // Non-US source, no US angle — exclude if exclusively about non-NA regions
  const hasExclude = EXCLUDE_PATTERNS.some(re => re.test(text));
  return !hasExclude;
}
