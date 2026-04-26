export type DataSource = 'EIA' | 'FRED';

export interface Commodity {
  id: string;
  name: string;
  shortName: string;
  category: string;
  unit: string;
  dataSource: DataSource;
  badgeLabel: string;
  badgeColor: 'green' | 'gold';
  description: string;
  eiaSeriesId?: string;
  fredSeriesId?: string;
  basePrice: number;
  volatility: number;
}

export const COMMODITIES: Commodity[] = [
  {
    id: 'crude-oil',
    name: 'Crude Oil (WTI)',
    shortName: 'WTI Crude',
    category: 'Energy',
    unit: '$/bbl',
    dataSource: 'EIA',
    badgeLabel: 'Gov: EIA',
    badgeColor: 'green',
    description: 'West Texas Intermediate crude oil spot price (Cushing, OK)',
    eiaSeriesId: 'RWTC',
    basePrice: 78.5,
    volatility: 3.2,
  },
  {
    id: 'natural-gas',
    name: 'Natural Gas (Henry Hub)',
    shortName: 'Nat Gas HH',
    category: 'Energy',
    unit: '$/MMBtu',
    dataSource: 'EIA',
    badgeLabel: 'Gov: EIA',
    badgeColor: 'green',
    description: 'Henry Hub natural gas spot price',
    eiaSeriesId: 'RNGWHHD',
    basePrice: 2.85,
    volatility: 0.35,
  },
  {
    id: 'gasoline',
    name: 'Gasoline (RBOB)',
    shortName: 'RBOB Gasoline',
    category: 'Energy',
    unit: '$/gal',
    dataSource: 'EIA',
    badgeLabel: 'Gov: EIA',
    badgeColor: 'green',
    description: 'Reformulated blendstock for oxygenate blending (NY Harbor)',
    eiaSeriesId: 'EER_EPMRR_PF4_RGC_DPG',
    basePrice: 2.65,
    volatility: 0.12,
  },
  {
    id: 'ethanol',
    name: 'Ethanol',
    shortName: 'Ethanol',
    category: 'Bio-Chemicals',
    unit: '$/gal',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Fuel ethanol spot price (Chicago)',
    fredSeriesId: 'APU000074714',
    basePrice: 1.72,
    volatility: 0.08,
  },
  {
    id: 'naphtha',
    name: 'Naphtha',
    shortName: 'Naphtha',
    category: 'Petrochemicals',
    unit: '$/MT',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Naphtha spot price (Far East/Asia)',
    fredSeriesId: 'PNAPHTHAUSDM',
    basePrice: 612,
    volatility: 28,
  },
  {
    id: 'methanol',
    name: 'Methanol',
    shortName: 'Methanol',
    category: 'Chemicals',
    unit: '$/MT',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Methanol contract price (Europe)',
    fredSeriesId: 'PMETUSDM',
    basePrice: 375,
    volatility: 18,
  },
  {
    id: 'caustic-soda',
    name: 'Caustic Soda (NaOH)',
    shortName: 'Caustic Soda',
    category: 'Chemicals',
    unit: '$/MT',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Sodium hydroxide (50% solution) price index',
    fredSeriesId: 'WPU0613020101',
    basePrice: 480,
    volatility: 22,
  },
  {
    id: 'liquid-chlorine',
    name: 'Liquid Chlorine',
    shortName: 'Chlorine',
    category: 'Chemicals',
    unit: '$/MT',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Chlorine (liquefied) producer price index',
    fredSeriesId: 'WPU0613040101',
    basePrice: 265,
    volatility: 14,
  },
  {
    id: 'benzene',
    name: 'Benzene',
    shortName: 'Benzene',
    category: 'Petrochemicals',
    unit: '$/MT',
    dataSource: 'FRED',
    badgeLabel: 'Gov: FRED',
    badgeColor: 'green',
    description: 'Benzene spot price (US Gulf Coast)',
    fredSeriesId: 'PBANSOPUSDM',
    basePrice: 820,
    volatility: 45,
  },
];

export const CATEGORIES = [...new Set(COMMODITIES.map((c) => c.category))];

export function getCommodityById(id: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.id === id);
}
