'use server';

import { auth } from './auth';
import { db } from './db';
import { redirect } from 'next/navigation';

export async function updateUserPlan(plan: 'BASIC' | 'PRO') {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { plan },
  });

  // Redirect to chat page after successful plan update
  redirect('/chat');
}
