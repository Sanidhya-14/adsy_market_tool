const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get';
const TIMEOUT_MS = 30_000;

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

interface ComtradeRecord {
  refPeriodId?: number;
  reporterCode?: number;
  partnerCode?: number;
  partnerDesc?: string;
  partnerISO?: string;
  flowCode?: string;
  primaryValue?: number;
  netWgt?: number | null;
}

interface ComtradeResponse {
  data?: ComtradeRecord[];
  count?: number;
  message?: string[];
}

export async function fetchUSTradeFlows(
  hsCode: string,
  direction: 'import' | 'export',
  year?: number
): Promise<TradeFlowSummary | null> {
  const apiKey = process.env.COMTRADE_API_KEY;
  if (!apiKey) return null;

  const reportYear = year ?? new Date().getFullYear() - 1;
  const flowCode = direction === 'import' ? 'M' : 'X';

  const url = `${COMTRADE_BASE}/C/A/HS?reporterCode=842&cmdCode=${hsCode}&flowCode=${flowCode}&period=${reportYear}&partnerCode=0&includeDesc=true`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'subscription-key': apiKey },
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return null;

    const json: ComtradeResponse = await res.json();
    const records = json.data;
    if (!records || records.length === 0) return null;

    // Aggregate by partner country, exclude "World" (code 0)
    const partnerMap = new Map<string, { tradeValueUsd: number; iso3: string }>();

    for (const rec of records) {
      if (!rec.partnerCode || rec.partnerCode === 0) continue;
      const country = rec.partnerDesc ?? `Partner ${rec.partnerCode}`;
      const iso3 = rec.partnerISO ?? '';
      const value = rec.primaryValue ?? 0;
      const existing = partnerMap.get(country);
      if (existing) {
        existing.tradeValueUsd += value;
      } else {
        partnerMap.set(country, { tradeValueUsd: value, iso3 });
      }
    }

    if (partnerMap.size === 0) return null;

    const sorted = [...partnerMap.entries()]
      .sort((a, b) => b[1].tradeValueUsd - a[1].tradeValueUsd)
      .slice(0, 10);

    const totalValueUsd = sorted.reduce((sum, [, v]) => sum + v.tradeValueUsd, 0);

    return {
      topPartners: sorted.map(([country, v]) => ({
        country,
        iso3: v.iso3,
        tradeValueUsd: v.tradeValueUsd,
        sharePercent: totalValueUsd > 0 ? (v.tradeValueUsd / totalValueUsd) * 100 : 0,
      })),
      totalValueUsd,
      period: String(reportYear),
      flowDirection: direction,
      hsCode,
    };
  } catch {
    return null;
  }
}
