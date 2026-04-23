import Dashboard from '@/components/Dashboard';
import { getOptionalSession } from '@/lib/dal';

export default async function Home() {
  const session = await getOptionalSession();
  const user = session
    ? { name: session.name as string, email: session.email as string }
    : undefined;

  return <Dashboard user={user} />;
}
