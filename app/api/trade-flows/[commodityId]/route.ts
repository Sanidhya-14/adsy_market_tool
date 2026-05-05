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

  const direction = (req.nextUrl.searchParams.get('direction') ?? 'import') as 'import' | 'export';
  const yearParam = req.nextUrl.searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : undefined;

  const summary = await fetchUSTradeFlows(commodity.hsCode ?? '', direction, year, commodityId);

  if (summary === null) {
    return Response.json({
      available: false,
      reason: 'no_wits_mapping',
      commodityName: commodity.name,
    });
  }

  return Response.json({
    available: true,
    summary,
    commodityName: commodity.name,
  });
}
