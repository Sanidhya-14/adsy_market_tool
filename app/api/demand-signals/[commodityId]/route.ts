import { NextRequest } from 'next/server';
import { getCommodityById } from '@/lib/commodities';
import { getChemicalContext } from '@/lib/contextData';
import { fetchDrugShortages, fetchDrugsUsingIngredient } from '@/lib/openfda';
import { fetchTrialsForChemical } from '@/lib/clinicaltrials';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commodityId: string }> }
) {
  const { commodityId } = await params;
  const commodity = getCommodityById(commodityId);

  if (!commodity) {
    return Response.json({ error: 'Commodity not found' }, { status: 404 });
  }

  const mode = req.nextUrl.searchParams.get('mode') ?? 'specialty-chem';

  if (mode === 'life-sciences') {
    const queryName = commodity.pubchemQueryName ?? commodity.name;

    const [shortagesResult, drugsResult, trialsResult] = await Promise.allSettled([
      fetchDrugShortages(queryName),
      fetchDrugsUsingIngredient(queryName),
      fetchTrialsForChemical(queryName),
    ]);

    return Response.json({
      mode,
      shortages:             shortagesResult.status === 'fulfilled' ? shortagesResult.value : [],
      drugsUsingIngredient:  drugsResult.status === 'fulfilled'    ? drugsResult.value    : [],
      trials:                trialsResult.status === 'fulfilled'    ? trialsResult.value   : [],
      downstreamContext:     null,
    });
  }

  // specialty-chem / energy: return context data
  const ctx = getChemicalContext(commodityId);
  return Response.json({
    mode,
    shortages:            [],
    drugsUsingIngredient: [],
    trials:               [],
    downstreamContext:    ctx,
  });
}
