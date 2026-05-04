import { getCommodityById, type Commodity } from './commodities';
import { getChemicalContext } from './contextData';
import { connectDB } from './mongodb';
import { fetchEIASeries, fetchEIANaturalGas } from './eia';
import { fetchFREDSeries } from './fred';
import { generateMockTimeSeries } from './mockData';

// Dynamic imports for models — avoid top-level require during Next.js build
async function getPubChemCache() {
  const { PubChemCache } = await import('../models/PubChemCache');
  return PubChemCache;
}
async function getNewsArticle() {
  const { NewsArticle } = await import('../models/NewsArticle');
  return NewsArticle;
}

export interface BriefContext {
  commodityId: string;
  commodityName: string;
  industryMode: string;
  currentPrice: number | null;
  priceUnit: string | null;
  priceChange24h: number | null;
  priceChangeMtd: number | null;
  priceDataSource: string;
  casNumber: string | null;
  molecularFormula: string | null;
  demandSectors: string[];
  feedstockDependencies: string[];
  seasonality: string | null;
  bullishTriggers: string[];
  bearishTriggers: string[];
  recentHeadlines: string[];
  asOfDate: string;
}

interface PriceResult {
  currentPrice: number | null;
  changePct: number | null;
  source: string;
}

async function fetchPriceData(commodity: Commodity): Promise<PriceResult> {
  // Try internal API first (works in production and when dev server is running)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000';

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${baseUrl}/api/commodities/${commodity.id}`, {
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (res.ok) {
      const data = await res.json();
      const src =
        data.source === 'eia' ? 'EIA' : data.source === 'fred' ? 'FRED' : 'Mock';
      return { currentPrice: data.currentPrice, changePct: data.changePct, source: src };
    }
  } catch { /* fall through */ }

  // Direct EIA/FRED fetch fallback (works without dev server)
  try {
    let series: Array<{ price: number }> | null = null;
    if (commodity.dataSource === 'EIA' && commodity.eiaSeriesId) {
      series =
        commodity.id === 'natural-gas'
          ? await fetchEIANaturalGas(4)
          : await fetchEIASeries(commodity.eiaSeriesId, 4);
    } else if (commodity.dataSource === 'FRED' && commodity.fredSeriesId) {
      series = await fetchFREDSeries(commodity.fredSeriesId, 4);
    }
    if (series && series.length >= 2) {
      const curr = series[series.length - 1].price;
      const prev = series[series.length - 2].price;
      const changePct = parseFloat(((curr - prev) / prev * 100).toFixed(2));
      return { currentPrice: curr, changePct, source: commodity.dataSource };
    }
  } catch { /* fall through */ }

  // Mock fallback — always works, used as last resort
  const mock = generateMockTimeSeries(
    commodity.id, commodity.basePrice, commodity.volatility, 4
  );
  const curr = mock[mock.length - 1].price;
  const prev = mock[mock.length - 2]?.price ?? curr;
  return {
    currentPrice: curr,
    changePct: parseFloat(((curr - prev) / prev * 100).toFixed(2)),
    source: 'Mock',
  };
}

export async function buildBriefContext(
  commodityId: string,
  industryMode: string
): Promise<BriefContext> {
  const commodity = getCommodityById(commodityId);
  if (!commodity) throw new Error(`Commodity not found: ${commodityId}`);

  await connectDB();

  const [priceResult, PubChemCache, NewsArticle] = await Promise.all([
    fetchPriceData(commodity),
    getPubChemCache(),
    getNewsArticle(),
  ]);

  const [pubchemDoc, articles] = await Promise.all([
    PubChemCache.findOne({ commodityId }).lean(),
    NewsArticle.find({ commodityIds: commodityId }, { title: 1 })
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const ctx = getChemicalContext(commodityId);

  return {
    commodityId,
    commodityName: commodity.name,
    industryMode,
    currentPrice: priceResult.currentPrice,
    priceUnit: commodity.unit,
    priceChange24h: priceResult.changePct,
    priceChangeMtd: null,
    priceDataSource: priceResult.source,
    casNumber: (pubchemDoc as { identity?: { casNumber?: string } } | null)?.identity?.casNumber ?? null,
    molecularFormula: (pubchemDoc as { identity?: { molecularFormula?: string } } | null)?.identity?.molecularFormula ?? null,
    demandSectors: ctx?.fundamental_drivers?.demand_sectors ?? [],
    feedstockDependencies: ctx?.fundamental_drivers?.feedstocks ?? [],
    seasonality: ctx?.market_behavior?.seasonality ?? null,
    bullishTriggers: ctx?.market_behavior?.bullish_triggers ?? [],
    bearishTriggers: ctx?.market_behavior?.bearish_triggers ?? [],
    recentHeadlines: (articles as Array<{ title: string }>).map(a => a.title),
    asOfDate: new Date().toISOString().slice(0, 10),
  };
}
