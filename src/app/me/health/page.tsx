import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import HealthDashboard from './HealthDashboard';

export default async function HealthPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return <HealthDashboard />;
}
