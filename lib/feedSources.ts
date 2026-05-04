export interface FeedSource {
  id: string;
  name: string;
  feedUrl: string;
  sourceCountry: 'us' | 'uk' | 'global';
  industryFocus: string[];
}

// Feed URL notes (verified 2026-05-04):
// Chem Eng Online:  /feed/ confirmed working RSS; C&EN FeedBurner returns empty body (defunct)
// Chemistry World:  /rss returns HTML; /409.rss returns valid RSS (news section)
// Fierce Pharma:   /rss/xml confirmed working
// ResourceWise:    main domain times out; /blog/rss.xml works
export const FEED_SOURCES: FeedSource[] = [
  {
    id: 'cen',
    name: 'Chemical Engineering Online',
    feedUrl: 'https://www.chemengonline.com/feed/',
    sourceCountry: 'us',
    industryFocus: ['specialty-chem', 'energy'],
  },
  {
    id: 'chemistry-world',
    name: 'Chemistry World',
    feedUrl: 'https://www.chemistryworld.com/409.rss',
    sourceCountry: 'uk',
    industryFocus: ['specialty-chem', 'life-sciences'],
  },
  {
    id: 'fierce-pharma',
    name: 'Fierce Pharma Manufacturing',
    feedUrl: 'https://www.fiercepharma.com/rss/xml',
    sourceCountry: 'us',
    industryFocus: ['life-sciences'],
  },
  {
    id: 'resourcewise',
    name: 'ResourceWise',
    feedUrl: 'https://www.resourcewise.com/blog/rss.xml',
    sourceCountry: 'us',
    industryFocus: ['energy', 'specialty-chem'],
  },
];
