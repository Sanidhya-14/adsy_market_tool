// Note: OpenFDA does not have a /drug/drugshortages endpoint.
// FDA drug shortage data lives in a separate non-OpenFDA database.
// fetchDrugShortages uses /drug/enforcement.json to surface shortage-adjacent
// recall/enforcement actions and is documented as a best-effort proxy.

const FDA_BASE = 'https://api.fda.gov';
const TIMEOUT_MS = 30_000;

async function fdaFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface DrugShortage {
  drugName: string;
  status: 'Currently in Shortage' | 'Resolved' | 'Discontinued';
  reason: string | null;
  updatedAt: string;
}

export interface DrugEnforcement {
  productDescription: string;
  reason: string;
  status: string;
  recallInitiationDate: string;
  terminationDate: string | null;
}

// Searches /drug/enforcement.json as a best-effort proxy for shortage events.
// Real FDA drug shortage data is not available via OpenFDA.
export async function fetchDrugShortages(
  chemicalName: string
): Promise<DrugShortage[]> {
  try {
    const query = encodeURIComponent(`"${chemicalName}"`);
    const url = `${FDA_BASE}/drug/enforcement.json?search=product_description:${query}&limit=5`;
    const res = await fdaFetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { results?: Array<Record<string, string>> };
    if (!json.results) return [];

    return json.results.map((r) => ({
      drugName: r.product_description ?? chemicalName,
      status: r.status === 'Terminated' ? 'Resolved' : 'Currently in Shortage',
      reason: r.reason_for_recall ?? null,
      updatedAt: r.report_date ?? r.recall_initiation_date ?? new Date().toISOString().split('T')[0],
    }));
  } catch {
    return [];
  }
}

export async function fetchDrugEnforcements(
  chemicalName: string,
  limit = 5
): Promise<DrugEnforcement[]> {
  try {
    const query = encodeURIComponent(`"${chemicalName}"`);
    const url = `${FDA_BASE}/drug/enforcement.json?search=product_description:${query}&limit=${limit}`;
    const res = await fdaFetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { results?: Array<Record<string, string>> };
    if (!json.results) return [];

    return json.results.map((r) => ({
      productDescription: r.product_description ?? '',
      reason: r.reason_for_recall ?? '',
      status: r.status ?? '',
      recallInitiationDate: r.recall_initiation_date ?? '',
      terminationDate: r.termination_date ?? null,
    }));
  } catch {
    return [];
  }
}

export async function fetchDrugsUsingIngredient(
  chemicalName: string,
  limit = 10
): Promise<Array<{ brandName: string; genericName: string; dosageForm: string; marketingStatus: string }>> {
  try {
    const query = encodeURIComponent(`"${chemicalName}"`);
    const url = `${FDA_BASE}/drug/ndc.json?search=active_ingredients.name:${query}&limit=${limit}`;
    const res = await fdaFetch(url);
    if (!res.ok) return [];
    const json = await res.json() as {
      results?: Array<{
        brand_name?: string;
        generic_name?: string;
        dosage_form?: string;
        marketing_status?: string;
      }>;
    };
    if (!json.results) return [];

    return json.results.map((r) => ({
      brandName: r.brand_name ?? '',
      genericName: r.generic_name ?? '',
      dosageForm: r.dosage_form ?? '',
      marketingStatus: r.marketing_status ?? '',
    }));
  } catch {
    return [];
  }
}
