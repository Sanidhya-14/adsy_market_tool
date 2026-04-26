const BLS_BASE = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

export interface BLSObservation {
  year: string;
  period: string;   // M01–M12
  periodName: string;
  value: string;
}

export interface BLSSeries {
  seriesID: string;
  data: BLSObservation[];
}

interface BLSResponse {
  status: string;
  Results?: { series: BLSSeries[] };
}

// ── Series IDs ─────────────────────────────────────
export const CPI_SERIES_ID  = 'CUUR0000SA0';   // CPI-U All Items
export const PPI_SERIES_ID  = 'WPUFD49104';    // PPI Final Demand

// All series fetched for the macro analysis page
export const MACRO_SERIES = {
  // CPI
  cpiAll:       'CUUR0000SA0',      // All Items
  cpiCore:      'CUUR0000SA0L1E',   // Core (ex Food & Energy)
  cpiFood:      'CUUR0000SAF',      // Food
  cpiEnergy:    'CUUR0000SA0E',     // Energy
  cpiShelter:   'CUUR0000SAH1',     // Shelter
  cpiMedical:   'CUUR0000SAM',      // Medical Care
  cpiTransport: 'CUUR0000SAT',      // Transportation
  // PPI
  ppiAll:       'WPUFD49104',       // Final Demand (headline)
  ppiGoods:     'WPUFD49207',       // Final Demand: Finished Goods
  ppiServices:  'WPUFD49502',       // Final Demand: Services
} as const;

type MacroKey = keyof typeof MACRO_SERIES;

// ── Helper: POST to BLS ─────────────────────────────
async function blsPost(
  seriesids: string[],
  startyear: string,
  endyear: string
): Promise<BLSSeries[]> {
  const apiKey = process.env.BLS_API_KEY;
  const body: Record<string, unknown> = { seriesid: seriesids, startyear, endyear };
  if (apiKey) body.registrationkey = apiKey;

  const res = await fetch(BLS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const json: BLSResponse = await res.json();
  if (json.status !== 'REQUEST_SUCCEEDED' || !json.Results) return [];
  return json.Results.series;
}

// ── Simple fetch for sidebar widget (CPI + PPI latest) ──
export async function fetchBLSData(): Promise<{
  cpi: BLSObservation | null;
  ppi: BLSObservation | null;
}> {
  const now = new Date();
  const year = String(now.getFullYear());
  const prev = String(now.getFullYear() - 1);
  const series = await blsPost([CPI_SERIES_ID, PPI_SERIES_ID], prev, year);

  function latest(id: string): BLSObservation | null {
    const s = series.find((s) => s.seriesID === id);
    return s?.data?.[0] ?? null;
  }

  return { cpi: latest(CPI_SERIES_ID), ppi: latest(PPI_SERIES_ID) };
}

// ── Full macro fetch for analysis page (3 yrs for YoY) ──
export async function fetchMacroData(): Promise<Record<MacroKey, BLSObservation[]>> {
  const now  = new Date();
  const end  = String(now.getFullYear());
  const start = String(now.getFullYear() - 3);

  const ids = Object.values(MACRO_SERIES);
  const series = await blsPost(ids, start, end);

  function getData(id: string): BLSObservation[] {
    return series.find((s) => s.seriesID === id)?.data ?? [];
  }

  return {
    cpiAll:       getData(MACRO_SERIES.cpiAll),
    cpiCore:      getData(MACRO_SERIES.cpiCore),
    cpiFood:      getData(MACRO_SERIES.cpiFood),
    cpiEnergy:    getData(MACRO_SERIES.cpiEnergy),
    cpiShelter:   getData(MACRO_SERIES.cpiShelter),
    cpiMedical:   getData(MACRO_SERIES.cpiMedical),
    cpiTransport: getData(MACRO_SERIES.cpiTransport),
    ppiAll:       getData(MACRO_SERIES.ppiAll),
    ppiGoods:     getData(MACRO_SERIES.ppiGoods),
    ppiServices:  getData(MACRO_SERIES.ppiServices),
  };
}
