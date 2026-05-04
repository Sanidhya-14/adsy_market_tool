import { notFound } from 'next/navigation';
import { getOptionalSession } from '@/lib/dal';
import { getCommodityById } from '@/lib/commodities';
import { getChemicalContext } from '@/lib/contextData';
import CommodityDetailPage from '@/components/CommodityDetailPage';
import type { IndustryMode } from '@/lib/commodities';

export default async function CommodityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commodity = getCommodityById(id);
  if (!commodity) notFound();

  const session = await getOptionalSession();
  const industryMode = ((session?.industryMode as IndustryMode | undefined) ?? 'specialty-chem') as IndustryMode;
  const chemicalContext = getChemicalContext(id);

  return (
    <CommodityDetailPage
      commodity={commodity}
      industryMode={industryMode}
      chemicalContext={chemicalContext}
    />
  );
}
