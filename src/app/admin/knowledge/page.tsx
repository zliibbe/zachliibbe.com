import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import KnowledgeAdmin from './components/KnowledgeAdmin';

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user?.email ||
    session.user.email !== 'zliibbe@gmail.com'
  ) {
    redirect('/api/auth/signin');
  }

  return <KnowledgeAdmin session={session} />;
}
