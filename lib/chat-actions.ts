'use server';

import { auth } from './auth';
import { db } from './db';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  title?: string | null;
  provider: string;
  model?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

// Create a new conversation
export async function createConversation(provider: string, model?: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        provider,
        model,
        title: `New Chat - ${new Date().toLocaleDateString()}`,
      },
    });

    return conversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    // Fallback to in-memory storage or return a temporary ID
    return `temp-${Date.now()}`;
  }
}

// Save a message to conversation
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Skip saving if it's a temporary conversation ID
    if (conversationId.startsWith('temp-')) {
      console.log('Temporary conversation, skipping database save');
      return;
    }

    await db.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  } catch (error) {
    console.error('Error saving message:', error);
    // Continue without failing - chat should work even if saving fails
  }
}

// Get conversation with messages
export async function getConversation(conversationId: string): Promise<ChatConversation | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Skip database for temporary conversations
    if (conversationId.startsWith('temp-')) {
      return null;
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return null;

    return {
      id: conversation.id,
      title: conversation.title,
      provider: conversation.provider,
      model: conversation.model,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
}

// Get all conversations for user
export async function getUserConversations(): Promise<ChatConversation[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get the first message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit to recent conversations
    });

    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      provider: conv.provider,
      model: conv.model,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    }));
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    if (conversationId.startsWith('temp-')) {
      return;
    }

    await db.conversation.update({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      data: { title },
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
  }
}


// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    if (conversationId.startsWith('temp-')) {
      return;
    }

    await db.conversation.delete({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}