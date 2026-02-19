import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import AdminDashboard from './components/AdminDashboard';

export default async function AdminPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return <AdminDashboard session={session} />;
}
