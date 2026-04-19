import { PricePoint } from './mockData';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

interface FREDObservation {
  date: string;
  value: string;
}
interface FREDResponse {
  observations?: FREDObservation[];
}

export async function fetchFREDSeries(
  seriesId: string,
  limit = 52
): Promise<PricePoint[] | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(FRED_BASE);
    url.searchParams.set('series_id', seriesId);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', String(limit + 1));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json: FREDResponse = await res.json();
    const obs = json?.observations;
    if (!obs || obs.length === 0) return null;

    return obs
      .reverse()
      .map((o) => ({
        date: o.date,
        price: parseFloat(o.value),
      }))
      .filter((p) => !isNaN(p.price));
  } catch {
    return null;
  }
}
