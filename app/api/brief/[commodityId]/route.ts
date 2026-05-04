import { type NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AIBrief } from '@/models/AIBrief';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commodityId: string }> }
) {
  const { commodityId } = await params;
  const mode  = req.nextUrl.searchParams.get('mode') ?? 'specialty-chem';
  const today = new Date().toISOString().slice(0, 10);

  try {
    await connectDB();

    const brief = await AIBrief.findOne(
      { commodityId, industryMode: mode },
      null,
      { sort: { date: -1 } }
    ).lean();

    if (!brief) {
      return Response.json({ available: false });
    }

    const briefDate = (brief as { date: string }).date;
    const msPerDay  = 86_400_000;
    const daysOld   = Math.max(
      0,
      Math.floor((new Date(today).getTime() - new Date(briefDate).getTime()) / msPerDay)
    );

    return Response.json({ available: true, brief, isTodaysBrief: briefDate === today, daysOld });
  } catch (err) {
    console.error('[brief] reader error:', err);
    return Response.json({ available: false, error: 'internal' });
  }
}
