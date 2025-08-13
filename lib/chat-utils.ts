// Generate a title from the first user message
export function generateChatTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(' ');
  const title = words.slice(0, 6).join(' ');
  return title.length > 50 ? title.substring(0, 47) + '...' : title;
}