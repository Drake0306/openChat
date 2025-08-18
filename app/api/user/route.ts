import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    // Get current user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is using Google OAuth (shouldn't update password)
    const hasGoogleAccount = user.accounts.some(account => account.provider === 'google');
    
    const updateData: any = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    // Update password if provided and user is not using Google OAuth
    if (newPassword && !hasGoogleAccount) {
      // If user already has a password, verify current password
      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }
      // If user doesn't have a password yet (new credentials user), allow setting without current password

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    if (newPassword && hasGoogleAccount) {
      return NextResponse.json({ error: 'Cannot set password for Google authenticated users' }, { status: 400 });
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user and all associated data (cascades due to schema)
    await db.user.delete({
      where: { id: session.user.id }
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}