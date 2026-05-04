import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { fetchDrugEnforcements } from '@/lib/openfda';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ commodityId: string }> }
) {
  const { commodityId } = await params;
  const commodity = getCommodityById(commodityId);

  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  const enforcements = await fetchDrugEnforcements(commodity.name);

  return Response.json({
    enforcements,
    commodityName: commodity.name,
  });
}
