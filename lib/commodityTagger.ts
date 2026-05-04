import { COMMODITIES } from './commodities';

const ALIASES: Record<string, string[]> = {
  'crude-oil':        ['crude', 'wti', 'brent crude', 'petroleum', 'barrel'],
  'natural-gas':      ['nat gas', 'natural gas', 'henry hub', 'lng', 'methane'],
  'gasoline':         ['gasoline', 'rbob', 'petrol', 'fuel'],
  'ethanol':          ['ethanol', 'biofuel', 'bioethanol', 'corn ethanol'],
  'naphtha':          ['naphtha'],
  'methanol':         ['methanol', 'methyl alcohol'],
  'caustic-soda':     ['caustic soda', 'sodium hydroxide', 'naoh', 'lye'],
  'liquid-chlorine':  ['chlorine', 'liquid chlorine', 'cl2'],
  'benzene':          ['benzene'],
  'toluene':          ['toluene'],
  'xylene':           ['xylene', 'xylenes'],
  'ethylene':         ['ethylene', 'ethene'],
  'propylene':        ['propylene', 'propene'],
  'styrene':          ['styrene'],
  'phenol':           ['phenol', 'carbolic acid'],
  'acetone':          ['acetone', 'propanone'],
  'hdpe':             ['hdpe', 'polyethylene', 'high-density polyethylene'],
  'polypropylene':    ['polypropylene', 'pp resin'],
  'acetonitrile':     ['acetonitrile', 'acn', 'mecn'],
  'dmso':             ['dmso', 'dimethyl sulfoxide'],
  'ipa':              ['isopropanol', 'isopropyl alcohol'],
  'acetic-acid':      ['acetic acid', 'glacial acetic'],
  'brent-crude':      ['brent', 'ice brent'],
  'heating-oil':      ['heating oil', 'distillate'],
  'diesel':           ['diesel', 'ulsd', 'ultra-low sulfur'],
  'biodiesel':        ['biodiesel', 'fame', 'b20', 'b100'],
};

// Build keyword map: commodityId → sorted terms (longer first for specificity)
const KEYWORD_MAP: Map<string, string[]> = new Map();

for (const commodity of COMMODITIES) {
  const terms = new Set<string>();

  // Auto-generate from name (words > 3 chars, lowercase)
  commodity.name.split(/\s+/).forEach(word => {
    const clean = word.replace(/[^a-z]/gi, '').toLowerCase();
    if (clean.length > 3) terms.add(clean);
  });

  // Add pubchemQueryName words
  if (commodity.pubchemQueryName) {
    terms.add(commodity.pubchemQueryName.toLowerCase());
  }

  // Add hardcoded aliases
  const aliases = ALIASES[commodity.id];
  if (aliases) {
    aliases.forEach(a => terms.add(a.toLowerCase()));
  }

  // Sort by length descending — longer/more specific terms ranked first
  KEYWORD_MAP.set(commodity.id, [...terms].sort((a, b) => b.length - a.length));
}

export function tagArticle(title: string, summary: string | null): string[] {
  const text = `${title} ${summary ?? ''}`.toLowerCase();
  const matches: Array<{ id: string; bestTermLen: number }> = [];

  for (const [id, terms] of KEYWORD_MAP) {
    for (const term of terms) {
      if (text.includes(term)) {
        matches.push({ id, bestTermLen: term.length });
        break; // first (longest) match is enough
      }
    }
  }

  // Sort by specificity (term length) desc, take top 5
  matches.sort((a, b) => b.bestTermLen - a.bestTermLen);
  return matches.slice(0, 5).map(m => m.id);
}
