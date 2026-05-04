import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { fetchUSTradeFlows } from '@/lib/comtrade';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commodityId: string }> }
) {
  const { commodityId } = await params;
  const commodity = getCommodityById(commodityId);

  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  if (!commodity.hsCode) {
    return Response.json({
      available: false,
      reason: 'no_hs_code',
      commodityName: commodity.name,
      hsCode: null,
    });
  }

  const direction = (req.nextUrl.searchParams.get('direction') ?? 'import') as 'import' | 'export';
  const yearParam = req.nextUrl.searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : undefined;

  if (!process.env.COMTRADE_API_KEY) {
    return Response.json({
      available: false,
      reason: 'no_api_key',
      commodityName: commodity.name,
      hsCode: commodity.hsCode,
    });
  }

  const summary = await fetchUSTradeFlows(commodity.hsCode, direction, year);

  return Response.json({
    available: summary !== null,
    summary,
    commodityName: commodity.name,
    hsCode: commodity.hsCode,
  });
}
