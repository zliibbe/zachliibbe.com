import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import BlogAdmin from './components/BlogAdmin';

export default async function BlogAdminPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return <BlogAdmin session={session} />;
}
