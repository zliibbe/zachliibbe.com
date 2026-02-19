import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import BlogAdmin from './components/BlogAdmin';

// Prevent static generation for admin pages
export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  try {
    const session = await getAuthSession();

    if (!session) {
      redirect('/auth/signin');
    }

    return <BlogAdmin session={session} />;
  } catch (error) {
    console.error('Admin page error:', error);
    redirect('/auth/signin');
  }
}
