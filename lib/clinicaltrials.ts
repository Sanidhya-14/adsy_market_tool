// ClinicalTrials.gov API v2 — free, no key required
// v2 field mapping documented below

const CT_BASE = 'https://clinicaltrials.gov/api/v2';
const TIMEOUT_MS = 30_000;

export interface ClinicalTrial {
  nctId: string;
  title: string;
  phase: string | null;
  status: string;
  sponsor: string | null;
  startDate: string | null;
  conditions: string[];
  interventionName: string;
}

interface StudyResponse {
  studies?: Array<{
    protocolSection?: {
      identificationModule?: {
        nctId?: string;
        briefTitle?: string;
      };
      statusModule?: {
        overallStatus?: string;
        startDateStruct?: { date?: string };
      };
      sponsorCollaboratorsModule?: {
        leadSponsor?: { name?: string };
      };
      designModule?: {
        phases?: string[];
      };
      conditionsModule?: {
        conditions?: string[];
      };
      armsInterventionsModule?: {
        interventions?: Array<{ name?: string }>;
      };
    };
  }>;
}

// v2 phase format is "PHASE3" → display as "Phase 3"
function formatPhase(phases: string[] | undefined): string | null {
  if (!phases || phases.length === 0) return null;
  return phases
    .map((p) => p.replace('PHASE', 'Phase ').replace('NA', 'N/A'))
    .join(', ');
}

export async function fetchTrialsForChemical(
  chemicalName: string,
  limit = 5
): Promise<ClinicalTrial[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const params = new URLSearchParams({
      'query.intr': chemicalName,
      'filter.overallStatus': 'RECRUITING,ACTIVE_NOT_RECRUITING',
      'pageSize': String(limit),
      'format': 'json',
    });

    let res: Response;
    try {
      res = await fetch(`${CT_BASE}/studies?${params}`, {
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return [];

    const json: StudyResponse = await res.json();
    if (!json.studies) return [];

    return json.studies.map((s) => {
      const id = s.protocolSection;
      const ident = id?.identificationModule;
      const status = id?.statusModule;
      const sponsor = id?.sponsorCollaboratorsModule;
      const design = id?.designModule;
      const cond = id?.conditionsModule;
      const intv = id?.armsInterventionsModule;

      return {
        nctId: ident?.nctId ?? '',
        title: ident?.briefTitle ?? '',
        phase: formatPhase(design?.phases),
        status: status?.overallStatus ?? '',
        sponsor: sponsor?.leadSponsor?.name ?? null,
        startDate: status?.startDateStruct?.date ?? null,
        conditions: cond?.conditions ?? [],
        interventionName: intv?.interventions?.[0]?.name ?? chemicalName,
      };
    }).filter((t) => t.nctId !== '');
  } catch {
    return [];
  }
}
