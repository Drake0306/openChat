import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { db } from '../../lib/db';
import SettingsPageClient from './settings-page-client';

export default async function SettingsPage() {
  const session = await auth();
  
  // Ensure user is authenticated
  if (!session?.user) {
    redirect('/signin');
  }

  // Check if user has Google account
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true }
  });

  const hasGoogleAccount = user?.accounts.some(account => account.provider === 'google') || false;
  
  return (
    <SettingsPageClient 
      user={{
        ...session.user,
        hasGoogleAccount
      }} 
    />
  );
}