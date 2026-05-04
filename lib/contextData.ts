import feedstockData from './context/feedstock.json';
import aromaticsData from './context/aromatics.json';
import chlorAlkaliData from './context/chlor_alkali.json';
import intermediateData from './context/intermediate.json';

export interface ChemicalContext {
  commodity_name: string;
  tier: number;
  fundamental_drivers?: {
    feedstocks?: string[];
    demand_sectors?: string[];
  };
  market_behavior?: {
    seasonality?: string;
    bullish_triggers?: string[];
    bearish_triggers?: string[];
  };
  historical_crisis_patterns?: Array<{
    event_type: string;
    market_reaction: string;
  }>;
}

// Map commodity_name values (as they appear in JSON files) to commodity ids
const NAME_TO_IDS: Record<string, string[]> = {
  'Crude Oil': ['crude-oil'],
  'Natural Gas': ['natural-gas'],
  'Naphtha': ['naphtha'],
  'Ethanol': ['ethanol'],
  'Gasoline': ['gasoline'],
  'Aromatics Complex': ['benzene', 'toluene', 'xylene', 'styrene', 'phenol'],
  'Caustic Soda (Sodium Hydroxide)': ['caustic-soda'],
  'Liquid Chlorine': ['liquid-chlorine'],
  'Acetic Acid': ['acetic-acid'],
  'Acetonitrile': ['acetonitrile'],
};

// Build lookup map at module load time (sync, in-memory)
const contextMap: Record<string, ChemicalContext> = {};

function registerEntry(entry: ChemicalContext) {
  const ids = NAME_TO_IDS[entry.commodity_name];
  if (!ids) return;
  for (const id of ids) {
    contextMap[id] = entry;
  }
}

for (const entry of feedstockData as ChemicalContext[]) {
  registerEntry(entry);
}

// aromatics.json is a single shared object (not an array)
registerEntry(aromaticsData as ChemicalContext);

for (const entry of chlorAlkaliData as ChemicalContext[]) {
  registerEntry(entry);
}

for (const entry of intermediateData as ChemicalContext[]) {
  registerEntry(entry);
}

export function getChemicalContext(commodityId: string): ChemicalContext | null {
  return contextMap[commodityId] ?? null;
}
