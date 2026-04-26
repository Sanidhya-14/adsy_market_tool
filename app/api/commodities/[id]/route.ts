import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { generateMockTimeSeries } from '@/lib/mockData';
import { fetchEIASeries, fetchEIANaturalGas } from '@/lib/eia';
import { fetchFREDSeries } from '@/lib/fred';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commodity = getCommodityById(id);

  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  let series = null;

  if (commodity.dataSource === 'EIA' && commodity.eiaSeriesId) {
    series = id === 'natural-gas'
      ? await fetchEIANaturalGas(52)
      : await fetchEIASeries(commodity.eiaSeriesId, 52);
  } else if (commodity.dataSource === 'FRED' && commodity.fredSeriesId) {
    series = await fetchFREDSeries(commodity.fredSeriesId, 52);
  }

  // Fall back to mock data if API unavailable
  if (!series || series.length === 0) {
    series = generateMockTimeSeries(commodity.id, commodity.basePrice, commodity.volatility, 52);
  }

  const currentPrice = series[series.length - 1].price;
  const prevPrice    = series[series.length - 2]?.price ?? currentPrice;
  const change       = parseFloat((currentPrice - prevPrice).toFixed(commodity.basePrice < 10 ? 3 : 1));
  const changePct    = parseFloat(((change / prevPrice) * 100).toFixed(2));

  return Response.json({
    id: commodity.id,
    source: commodity.dataSource.toLowerCase(),
    series,
    currentPrice,
    change,
    changePct,
  });
}
