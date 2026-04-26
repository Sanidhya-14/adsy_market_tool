import { fetchBLSData } from '@/lib/bls';

export async function GET() {
  try {
    const data = await fetchBLSData();
    return Response.json(data);
  } catch (err) {
    console.error('BLS API error:', err);
    return Response.json({ cpi: null, ppi: null }, { status: 502 });
  }
}
