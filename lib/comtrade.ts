const WITS_BASE = 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade';
const TIMEOUT_MS = 20_000;

// WITS partner dimension includes regional/income aggregate codes alongside ISO3 countries.
// Filter these out so topPartners contains only sovereign nations.
const WITS_AGGREGATE_IDS = new Set([
  'WLD', '000',                              // World totals
  'EAS', 'EAP', 'ECS', 'ECA',               // East Asia, Europe & Central Asia
  'LCN', 'LAC',                              // Latin America & Caribbean
  'MEA', 'MNA',                              // Middle East & North Africa
  'NAC',                                     // North America
  'SAS',                                     // South Asia
  'SSF', 'SSA',                              // Sub-Saharan Africa
  'HIC', 'UMC', 'LMC', 'LIC', 'MIC', 'LDC', // Income groups
  'INX', 'OEC', 'EMU', 'OED', 'CSS',         // Other WITS aggregates
]);

// WITS uses broad product groups, not HS codes. All commodities in the same group
// return identical product-level totals (e.g. all fuels return the same US fuels trade data).
// This is a known limitation of the free WITS tier.
const WITS_PRODUCT_MAP: Record<string, string> = {
  // Energy
  'crude-oil':       'fuels',
  'brent-crude':     'fuels',
  'gasoline':        'fuels',
  'heating-oil':     'fuels',
  'diesel':          'fuels',
  'natural-gas':     'fuels',
  'naphtha':         'fuels',
  'biodiesel':       'fuels',
  'ethanol':         'fuels',
  // Chemicals & petrochemicals
  'caustic-soda':    'Chemical',
  'liquid-chlorine': 'Chemical',
  'methanol':        'Chemical',
  'benzene':         'Chemical',
  'toluene':         'Chemical',
  'xylene':          'Chemical',
  'ethylene':        'Chemical',
  'propylene':       'Chemical',
  'styrene':         'Chemical',
  'phenol':          'Chemical',
  'acetone':         'Chemical',
  'acetonitrile':    'Chemical',
  'dmso':            'Chemical',
  'isopropanol':     'Chemical',
  'ipa':             'Chemical',
  'acetic-acid':     'Chemical',
  // Polymers
  'hdpe':            'manuf',
  'polypropylene':   'manuf',
};

export interface TradeFlow {
  partnerCountry: string;
  partnerIso3: string;
  tradeValueUsd: number;
  netWeightKg: number | null;
  period: string;
  flowDirection: 'import' | 'export';
}

export interface TradeFlowSummary {
  topPartners: Array<{
    country: string;
    iso3: string;
    tradeValueUsd: number;
    sharePercent: number;
  }>;
  totalValueUsd: number;
  period: string;
  flowDirection: 'import' | 'export';
  hsCode: string;
}

// SDMX-JSON response types from WITS
interface WitsSeries {
  observations: Record<string, [number]>;
}
interface WitsDataSet {
  series: Record<string, WitsSeries>;
}
interface WitsDimValue {
  id: string;
  name: string;
}
interface WitsDim {
  id: string;
  values: WitsDimValue[];
}
interface WitsResponse {
  dataSets?: WitsDataSet[];
  structure?: {
    dimensions?: {
      series?: WitsDim[];
      observation?: WitsDim[];
    };
  };
}

async function fetchWits(
  productCode: string,
  indicator: string,
  year: number
): Promise<WitsResponse | null> {
  const url =
    `${WITS_BASE}/reporter/usa/year/${year}/partner/all` +
    `/product/${productCode}/indicator/${indicator}?format=JSON`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as WitsResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseWitsPartners(
  data: WitsResponse
): Map<string, { name: string; iso3: string; value: number }> | null {
  const dataset = data.dataSets?.[0];
  if (!dataset || !dataset.series || Object.keys(dataset.series).length === 0) return null;

  // PARTNER is dimension index 2 in the series dimensions array
  const partnerDim = data.structure?.dimensions?.series?.[2];
  if (!partnerDim) return null;

  const partnerMap = new Map<string, { name: string; iso3: string; value: number }>();

  for (const [key, series] of Object.entries(dataset.series)) {
    const parts = key.split(':');
    const partnerIdx = parseInt(parts[2] ?? '0', 10);
    const partner = partnerDim.values[partnerIdx];
    if (!partner) continue;

    // Skip World and regional/income aggregates — keep only ISO3 sovereign countries
    if (WITS_AGGREGATE_IDS.has(partner.id)) continue;

    const value = series.observations?.['0']?.[0] ?? 0;
    if (value <= 0) continue;

    const existing = partnerMap.get(partner.id);
    if (existing) {
      existing.value += value;
    } else {
      partnerMap.set(partner.id, { name: partner.name, iso3: partner.id, value });
    }
  }

  return partnerMap.size > 0 ? partnerMap : null;
}

export async function fetchUSTradeFlows(
  hsCode: string,
  direction: 'import' | 'export',
  year?: number,
  commodityId?: string
): Promise<TradeFlowSummary | null> {
  if (!commodityId) return null;

  const productCode = WITS_PRODUCT_MAP[commodityId];
  if (!productCode) return null;

  const indicator = direction === 'import' ? 'MPRT-TRD-VL' : 'XPRT-TRD-VL';
  const baseYear = year ?? new Date().getFullYear() - 2;

  // Try requested year, fall back one more year if empty
  for (const yr of [baseYear, baseYear - 1]) {
    const data = await fetchWits(productCode, indicator, yr);
    if (!data) continue;

    const partnerMap = parseWitsPartners(data);
    if (!partnerMap) continue;

    const sorted = [...partnerMap.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const totalValueUsd = sorted.reduce((s, p) => s + p.value, 0);

    return {
      topPartners: sorted.map(p => ({
        country: p.name,
        iso3: p.iso3,
        tradeValueUsd: p.value,
        sharePercent: totalValueUsd > 0 ? (p.value / totalValueUsd) * 100 : 0,
      })),
      totalValueUsd,
      period: String(yr),
      flowDirection: direction,
      hsCode: productCode, // WITS product group, not an HS code
    };
  }

  return null;
}
