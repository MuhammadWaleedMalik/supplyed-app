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
      (b.lastMessageAt || b.createdAt).localeCompare(
        a.lastMessageAt || a.createdAt,
      ),
    );
    return {
      key,
      items,
      latest: items[0],
      unread: items.reduce((total, item) => total + item.unreadCount, 0),
    };
  }).sort((a, b) =>
    (b.latest.lastMessageAt || b.latest.createdAt).localeCompare(
      a.latest.lastMessageAt || a.latest.createdAt,
    ),
  );
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
