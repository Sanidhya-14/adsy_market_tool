import { fetchMacroData } from '@/lib/bls';

export async function GET() {
  try {
    const data = await fetchMacroData();
    return Response.json(data);
  } catch (err) {
    console.error('Macro API error:', err);
    return Response.json({}, { status: 502 });
  }
}
