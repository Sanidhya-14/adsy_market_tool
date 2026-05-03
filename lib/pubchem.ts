export interface PubChemIdentity {
  cid: number;
  name: string;
  iupacName: string | null;
  molecularFormula: string | null;
  molecularWeight: number | null;
  canonicalSmiles: string | null;
  inchi: string | null;
  inchiKey: string | null;
  casNumber: string | null;
  synonyms: string[];
  ghsHazards: string[];
  structureImageUrl: string;
  fetchedAt: string;
}

const PUG_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUG_VIEW_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';
const TIMEOUT_MS = 30_000;
const MAX_RPS = 4;

// In-memory rate limit: track timestamps of last N requests within 1-second window.
const requestTimestamps: number[] = [];

async function rateLimit(): Promise<void> {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 1000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_RPS) {
    const waitMs = 1000 - (now - requestTimestamps[0]) + 10;
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    return rateLimit();
  }
  requestTimestamps.push(Date.now());
}

async function pubchemFetch(url: string): Promise<Response> {
  await rateLimit();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
  } finally {
    clearTimeout(timer);
  }
}

// CAS registry number pattern: 2–7 digits, hyphen, 2 digits, hyphen, 1 check digit
const CAS_REGEX = /^\d{1,7}-\d{2}-\d$/;

function extractCas(synonyms: string[]): string | null {
  return synonyms.find((s) => CAS_REGEX.test(s)) ?? null;
}

// Extract GHS H-codes by serialising the full response and scanning for Hxxx patterns.
// The PUG-View JSON is deeply nested and inconsistent; string scan is the safest fallback.
function extractGhsHazards(data: unknown): string[] {
  try {
    const text = JSON.stringify(data);
    const matches = text.match(/\bH[2-4]\d{2}\b/g);
    if (!matches) return [];
    return [...new Set(matches)].sort();
  } catch {
    return [];
  }
}

interface PugPropertyResponse {
  PropertyTable?: {
    Properties?: Array<{
      CID?: number;
      IUPACName?: string;
      MolecularFormula?: string;
      MolecularWeight?: number | string;
      CanonicalSMILES?: string;
      InChI?: string;
      InChIKey?: string;
    }>;
  };
}

interface PugSynonymsResponse {
  InformationList?: {
    Information?: Array<{ Synonym?: string[] }>;
  };
}

interface PugCidsResponse {
  IdentifierList?: { CID?: number[] };
}

export async function fetchPubChemByCid(cid: number): Promise<PubChemIdentity | null> {
  try {
    // 1. Properties
    const propUrl = `${PUG_BASE}/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,InChI,InChIKey/JSON`;
    const propRes = await pubchemFetch(propUrl);
    if (!propRes.ok) return null;
    const propJson: PugPropertyResponse = await propRes.json();
    const props = propJson?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    // 2. Synonyms
    const synUrl = `${PUG_BASE}/compound/cid/${cid}/synonyms/JSON`;
    const synRes = await pubchemFetch(synUrl);
    let synonyms: string[] = [];
    if (synRes.ok) {
      const synJson: PugSynonymsResponse = await synRes.json();
      synonyms = synJson?.InformationList?.Information?.[0]?.Synonym?.slice(0, 10) ?? [];
    }

    // 3. GHS hazards via PUG-View (best-effort — failure returns empty array)
    let ghsHazards: string[] = [];
    try {
      const ghsUrl = `${PUG_VIEW_BASE}/data/compound/${cid}/JSON?heading=GHS+Classification`;
      const ghsRes = await pubchemFetch(ghsUrl);
      if (ghsRes.ok) {
        const ghsJson: unknown = await ghsRes.json();
        ghsHazards = extractGhsHazards(ghsJson);
      }
    } catch {
      // Non-fatal — some compounds have no GHS data
    }

    const mw = props.MolecularWeight != null ? parseFloat(String(props.MolecularWeight)) : null;

    return {
      cid,
      name: synonyms[0] ?? String(cid),
      iupacName: props.IUPACName ?? null,
      molecularFormula: props.MolecularFormula ?? null,
      molecularWeight: mw != null && !isNaN(mw) ? mw : null,
      canonicalSmiles: props.CanonicalSMILES ?? null,
      inchi: props.InChI ?? null,
      inchiKey: props.InChIKey ?? null,
      casNumber: extractCas(synonyms),
      synonyms,
      ghsHazards,
      structureImageUrl: `${PUG_BASE}/compound/cid/${cid}/PNG`,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchPubChemByName(name: string): Promise<PubChemIdentity | null> {
  try {
    const cidUrl = `${PUG_BASE}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
    const cidRes = await pubchemFetch(cidUrl);
    if (!cidRes.ok) return null;
    const cidJson: PugCidsResponse = await cidRes.json();
    const cid = cidJson?.IdentifierList?.CID?.[0];
    if (!cid) return null;
    return fetchPubChemByCid(cid);
  } catch {
    return null;
  }
}
