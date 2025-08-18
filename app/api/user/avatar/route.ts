import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Get current user to check for existing image
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Delete old image file if it exists
    if (currentUser?.image) {
      try {
        const oldFilename = currentUser.image.split('/').pop();
        if (oldFilename) {
          const oldFilePath = join(process.cwd(), 'public', 'uploads', 'profiles', oldFilename);
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        }
      } catch (fileError) {
        console.error('Error deleting old file:', fileError);
        // Continue with upload even if old file deletion fails
      }
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update user's image in database
    const imageUrl = `/uploads/profiles/${fileName}`;
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true
      }
    });

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to find existing image
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Delete physical file if it exists
    if (currentUser?.image) {
      try {
        // Extract filename from the image URL (e.g., /uploads/profiles/filename.jpg -> filename.jpg)
        const filename = currentUser.image.split('/').pop();
        if (filename) {
          const filePath = join(process.cwd(), 'public', 'uploads', 'profiles', filename);
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        }
      } catch (fileError) {
        console.error('Error deleting physical file:', fileError);
        // Continue with database update even if file deletion fails
      }
    }

    // Remove user's image from database
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true
      }
    });

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profile picture removed successfully' 
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}