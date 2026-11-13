import type { Conversation } from '../../constants/conversationsApi';

export type Topic = 'general' | 'jobs';
export type Thread = {
  key: string;
  topic: Topic;
  conversationId: string;
  title: string;
  createdAt: string;
  status: string;
};
export function conversationTopic(conversation: Conversation): Topic {
  return conversation.applicationId || conversation.bookingId
    ? 'jobs'
    : 'general';
}
export function contactKey(conversation: Conversation) {
  const other = conversation.counterpart;
  return other.id ? `${other.role}:${other.id}` : `unknown:${conversation.id}`;
}

export function conversationContextLabel(conversation: Conversation) {
  const applicationStatus = (conversation.applicationStatus || '').toUpperCase();
  if (conversation.booking) {
    return conversation.booking.applicationId || conversation.applicationId
      ? 'Booking · Application'
      : 'Booking · Invitation';
  }
  if (conversation.applicationId) {
    return applicationStatus.includes('INVIT') ? 'Invitation' : 'Application';
  }
  return conversation.job ? 'Job conversation' : 'General conversation';
}

export function conversationPreview(conversation: Conversation) {
  if (!conversation.lastMessage)
    return conversationContextLabel(conversation) + ' chat';
  const body = conversation.lastMessage.body.trim();
  if (body) return body;
  return conversation.lastMessage.hasAttachments ? 'Attachment' : 'Message';
}

function conversationActivityAt(conversation: Conversation) {
  return (
    conversation.lastMessageAt ||
    conversation.lastMessage?.createdAt ||
    conversation.createdAt
  );
}

export function contactGroups(conversations: Conversation[]) {
  const groups = new Map<string, Conversation[]>();
  for (const item of conversations) {
    const key = contactKey(item);
    const group = groups.get(key) || [];
    if (!group.some(existing => existing.id === item.id)) group.push(item);
    groups.set(key, group);
  }
  return Array.from(groups, ([key, items]) => {
    items.sort((a, b) =>
      conversationActivityAt(b).localeCompare(conversationActivityAt(a)),
    );
    const latestActivity = items[0];
    const latestMessage = items.find(item => item.lastMessage);
    return {
      key,
      items,
      latest: latestMessage || latestActivity,
      activityAt: conversationActivityAt(latestActivity),
      unread: items.reduce((total, item) => total + item.unreadCount, 0),
    };
  }).sort((a, b) => b.activityAt.localeCompare(a.activityAt));
}

export function contactThreads(conversations: Conversation[]) {
  const threads: Thread[] = conversations.map(item => ({
    key: item.id,
    conversationId: item.id,
    topic: conversationTopic(item),
    title: item.job?.title || 'General',
    status: item.applicationStatus || item.job?.status || '',
    createdAt: item.createdAt,
  }));
  return threads.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.key.localeCompare(a.key),
  );
}

export function defaultThread(threads: Thread[]) {
  return threads.find(thread => thread.topic !== 'general') || threads[0];
}
