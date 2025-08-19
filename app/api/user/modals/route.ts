import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all modals from database with timeout
    const modalsPromise = db.modal.findMany({
      orderBy: [
        { isLocal: 'desc' }, // Local models first
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get user's modal settings with timeout
    const userPromise = db.user.findUnique({
      where: { id: session.user.id },
      include: {
        modalSettings: true
      }
    });

    // Use Promise.race with timeout to prevent hanging queries
    const [modals, user] = await Promise.all([
      Promise.race([
        modalsPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Modal query timeout')), 5000))
      ]) as Promise<any[]>,
      Promise.race([
        userPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('User query timeout')), 5000))
      ]) as Promise<any>
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert user settings to map for easy lookup
    const userSettings: Record<string, boolean> = {};
    user.modalSettings?.forEach((setting: any) => {
      userSettings[setting.modalId] = setting.enabled;
    });

    // Combine modal data with user settings (default to modal's enabled state if no user setting)
    const modalsWithSettings = modals.map((modal: any) => ({
      id: modal.id,
      name: modal.name,
      description: modal.description,
      icon: modal.icon,
      color: modal.color,
      category: modal.category,
      isLocal: modal.isLocal,
      enabled: userSettings.hasOwnProperty(modal.id) ? userSettings[modal.id] : modal.enabled
    }));

    return NextResponse.json({ 
      modals: modalsWithSettings,
      settings: userSettings 
    });
  } catch (error) {
    console.error('Error fetching modal settings:', error);
    
    // Return a more specific error message
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json({ error: 'Database query timeout' }, { status: 504 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { modalId, enabled } = await request.json();

    if (!modalId || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid request body. modalId (string) and enabled (boolean) are required.' 
      }, { status: 400 });
    }

    // Verify that the modal exists in the database
    const modalExists = await db.modal.findUnique({
      where: { id: modalId }
    });

    if (!modalExists) {
      return NextResponse.json({ 
        error: `Modal '${modalId}' not found` 
      }, { status: 404 });
    }

    // Upsert the modal setting with timeout
    const upsertPromise = db.modalSetting.upsert({
      where: {
        userId_modalId: {
          userId: session.user.id,
          modalId: modalId
        }
      },
      update: {
        enabled: enabled
      },
      create: {
        userId: session.user.id,
        modalId: modalId,
        enabled: enabled
      }
    });

    // Add timeout to prevent hanging queries
    await Promise.race([
      upsertPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upsert timeout')), 5000)
      )
    ]);

    return NextResponse.json({ 
      success: true,
      message: `Modal setting updated successfully`,
      modalId,
      enabled
    });
  } catch (error) {
    console.error('Error updating modal setting:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Database operation timeout. Please try again.' 
        }, { status: 504 });
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Invalid modal ID provided' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to update modal setting. Please try again later.' 
    }, { status: 500 });
  }
}