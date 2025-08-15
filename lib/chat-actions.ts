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
  provider: string;
  model?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface Chat {
  id: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  conversations: ChatConversation[];
  currentConversationId?: string;
}

// Create a new chat (parent container)
export async function createChat(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const chat = await db.chat.create({
      data: {
        userId: session.user.id,
        title: null, // Will be set by first message
      },
    });

    return chat.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

// Create a new conversation within a chat
export async function createConversation(chatId: string, provider: string, model?: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const conversation = await db.conversation.create({
      data: {
        chatId,
        provider,
        model,
      },
    });

    return conversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
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

    // Only update timestamps for completed conversation exchanges (user + assistant)
    // This reduces the frequency of chat list reordering
    if (role === 'assistant') {
      const conversation = await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await db.chat.update({
        where: { id: conversation.chatId },
        data: { updatedAt: new Date() },
      });
    }
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
        chat: {
          userId: session.user.id,
        },
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

// Get chat with all its conversations
export async function getChat(chatId: string): Promise<Chat | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    if (chatId.startsWith('temp-')) {
      return null;
    }

    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!chat) return null;

    return {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      conversations: chat.conversations.map(conv => ({
        id: conv.id,
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
      })),
      currentConversationId: chat.conversations[0]?.id,
    };
  } catch (error) {
    console.error('Error getting chat:', error);
    return null;
  }
}

// Get all chats for user (for sidebar)
export async function getUserChats(): Promise<Chat[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const chats = await db.chat.findMany({
      where: { userId: session.user.id },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 1, // Just get the first message for preview
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 1, // Just the first conversation for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit to recent chats
    });

    const mappedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      conversations: chat.conversations.map(conv => ({
        id: conv.id,
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
      })),
      currentConversationId: chat.conversations[0]?.id,
    }));
    
    console.log('getUserChats returning data:', mappedChats.map(chat => ({ 
      id: chat.id, 
      title: chat.title,
      updatedAt: chat.updatedAt 
    })));
    return mappedChats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
}

// Update chat title (based on first conversation's first message)
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    if (chatId.startsWith('temp-')) {
      console.log('Skipping temp chat update:', chatId);
      return;
    }

    console.log('Updating chat title in database:', { chatId, title, userId: session.user.id });
    
    // First, let's check if the chat exists
    const existingChat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });
    
    console.log('Existing chat found:', existingChat);
    
    if (!existingChat) {
      console.error('Chat not found for update:', { chatId, userId: session.user.id });
      throw new Error('Chat not found');
    }
    
    const updatedChat = await db.chat.update({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      data: { title },
    });
    
    console.log('Successfully updated chat title:', { 
      oldTitle: existingChat.title, 
      newTitle: updatedChat.title,
      chatId: updatedChat.id 
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error; // Re-throw the error so the UI can handle it
  }
}


// Delete a chat and all its conversations
export async function deleteChat(chatId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    if (chatId.startsWith('temp-')) {
      return;
    }

    await db.chat.delete({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
}

// Create a new conversation in an existing chat
export async function createNewConversationInChat(chatId: string, provider: string, model?: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Verify chat belongs to user
  const chat = await db.chat.findFirst({
    where: {
      id: chatId,
      userId: session.user.id,
    },
  });

  if (!chat) {
    throw new Error('Chat not found or not authorized');
  }

  return createConversation(chatId, provider, model);
}