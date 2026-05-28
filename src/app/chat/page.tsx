import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ChatPage } from './chat-page';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return <ChatPage />;
}
