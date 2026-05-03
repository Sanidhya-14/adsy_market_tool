import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { fetchPubChemByCid } from '@/lib/pubchem';
import { connectDB } from '@/lib/mongodb';
import { PubChemCache } from '@/models/PubChemCache';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ commodityId: string }> }
) {
  const { commodityId } = await params;
  const commodity = getCommodityById(commodityId);

  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  if (commodity.pubchemCid == null) {
    return Response.json({
      available: false,
      reason: 'mixture',
      displayName: commodity.name,
    });
  }

  await connectDB();
  const now = new Date();

  const cached = await PubChemCache.findOne({
    commodityId,
    expiresAt: { $gt: now },
  });

  if (cached) {
    return Response.json({
      available: true,
      identity: cached.identity,
      cached: true,
    });
  }

  const identity = await fetchPubChemByCid(commodity.pubchemCid);

  if (!identity) {
    return Response.json({ available: false, reason: 'fetch_failed' });
  }

  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await PubChemCache.findOneAndUpdate(
    { commodityId },
    { commodityId, cid: commodity.pubchemCid, identity, fetchedAt: now, expiresAt },
    { upsert: true, new: true }
  );

  return Response.json({
    available: true,
    identity,
    cached: false,
  });
}
