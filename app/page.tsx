import Dashboard from '@/components/Dashboard';
import { getOptionalSession } from '@/lib/dal';
import type { IndustryMode } from '@/lib/commodities';

export default async function Home() {
  const session = await getOptionalSession();
  const user = session
    ? { name: session.name as string, email: session.email as string }
    : undefined;
  const industryMode = ((session?.industryMode) ?? 'specialty-chem') as IndustryMode;

  return <Dashboard user={user} industryMode={industryMode} />;
}
