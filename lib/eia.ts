import { PricePoint } from './mockData';

const EIA_BASE = 'https://api.eia.gov/v2';

interface EIAResponse {
  response?: {
    data?: Array<{ period: string; value: string | number }>;
  };
}

export async function fetchEIASeries(
  seriesId: string,
  weeks = 52
): Promise<PricePoint[] | null> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return null;

  try {
    // EIA v2 API — petroleum spot prices
    const url = new URL(`${EIA_BASE}/petroleum/pri/spt/data/`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('data[]', 'value');
    url.searchParams.set('facets[series][]', seriesId);
    url.searchParams.set('sort[0][column]', 'period');
    url.searchParams.set('sort[0][direction]', 'desc');
    url.searchParams.set('length', String(weeks + 1));
    url.searchParams.set('frequency', 'weekly');

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json: EIAResponse = await res.json();
    const rows = json?.response?.data;
    if (!rows || rows.length === 0) return null;

    return rows
      .reverse()
      .map((row) => ({
        date: row.period,
        price: parseFloat(String(row.value)),
      }))
      .filter((p) => !isNaN(p.price));
  } catch {
    return null;
  }
}

export async function fetchEIANaturalGas(weeks = 52): Promise<PricePoint[] | null> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${EIA_BASE}/natural-gas/pri/sum/data/`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('data[]', 'value');
    url.searchParams.set('facets[duoarea][]', 'NUS');
    url.searchParams.set('facets[series][]', 'RNGWHHD');
    url.searchParams.set('sort[0][column]', 'period');
    url.searchParams.set('sort[0][direction]', 'desc');
    url.searchParams.set('length', String(weeks + 1));
    url.searchParams.set('frequency', 'daily');

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json: EIAResponse = await res.json();
    const rows = json?.response?.data;
    if (!rows || rows.length === 0) return null;

    return rows
      .reverse()
      .map((row) => ({
        date: row.period,
        price: parseFloat(String(row.value)),
      }))
      .filter((p) => !isNaN(p.price));
  } catch {
    return null;
  }
}
