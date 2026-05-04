import { type NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { generateAllBriefs } from '@/lib/briefGenerator';

// Vercel Pro: 60s, Enterprise: 300s — free tier caps at 10s (not enough for full run)
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  try {
    await connectDB();
    const mode = req.nextUrl.searchParams.get('mode') ?? undefined;
    const results = await generateAllBriefs(mode);

    const succeeded = results.filter(r => r.success && !r.cached).length;
    const failed    = results.filter(r => !r.success).length;
    const cached    = results.filter(r => r.cached).length;

    return Response.json({ ok: true, succeeded, failed, cached, total: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
