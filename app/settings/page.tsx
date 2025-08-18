import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';
import SettingsPageClient from './settings-page-client';

export default async function SettingsPage() {
  const session = await auth();
  
  // Ensure user is authenticated
  if (!session?.user) {
    redirect('/signin');
  }
  
  return (
    <SettingsPageClient user={session.user} />
  );
}