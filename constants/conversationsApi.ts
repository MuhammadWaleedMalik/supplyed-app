import type { PlannedWorkUnits } from '../utils/jobs/workSchedule';
import { endpoints } from './endpoints';
import { protectedRequest } from '../utils/api/request';
import { getAllPages } from '../utils/api/pagination';
import {
  normalizeConversation,
  normalizeMessage,
  normalizeMessagesPage,
} from '../utils/messaging/normalizeConversation';
import type { Application } from '../feature/dashboard/shared/apis/applicationsApi';

export type ConversationSide = 'instructor' | 'poster';
export type MessageAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};
export type ChatMessage = {
  id: string;
  conversationId: string;
  senderSide: ConversationSide | null;
  body: string;
  attachments: MessageAttachment[];
  createdAt: string;
};
export type ConversationParticipant = {
  id: string | null;
  userId: string | null;
  name: string;
  imageUrl: string | null;
  role: 'teacher' | 'school';
};
export type ConversationBooking = {
  id: string;
  status: string;
  applicationId: string | null;
};
export type Conversation = {
  id: string;
  instructorId?: string;
  institutionId?: string;
  applicationId: string | null;
  booking: ConversationBooking | null;
  /** Derived from booking for native navigation and topic grouping. */
  bookingId: string | null;
  applicationStatus: string | null;
  readOnly: boolean;
  job: (PlannedWorkUnits & {
    id: string;
    title: string;
    status?: string;
  }) | null;
  me: ConversationSide | null;
  counterpart: ConversationParticipant;
  participants: {
    instructor: ConversationParticipant | null;
    poster: ConversationParticipant | null;
  };
  lastMessage: {
    body: string;
    fromMe: boolean;
    hasAttachments: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
  counterpartLastReadAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};
export type MessagesPage = { messages: ChatMessage[]; hasMore: boolean };
export type ConversationsPage = {
  conversations: Conversation[];
  page: number;
  hasNextPage: boolean;
};
export type ConversationTopic = 'GENERAL' | 'JOBS';
export type ConversationThreadsPage = {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
};
export type AttachmentUpload = {
  attachment: MessageAttachment;
  upload: {
    url: string;
    method?: string;
    expiresAt: string;
    requiredHeaders: Record<string, string>;
  };
};

export async function getConversationsPage(
  page = 1,
): Promise<ConversationsPage> {
  const result = await protectedRequest<{
    conversations?: unknown;
    pagination?: { page?: unknown; hasNextPage?: unknown };
  }>(endpoints.conversations + '?page=' + page + '&limit=20');
  if (!Array.isArray(result.conversations))
    throw new Error('The server returned an invalid conversations page.');
  return {
    conversations: result.conversations.map(normalizeConversation),
    page:
      typeof result.pagination?.page === 'number'
        ? result.pagination.page
        : page,
    hasNextPage: result.pagination?.hasNextPage === true,
  };
}
export function getUnreadCount() {
  return protectedRequest<{ total: number }>(endpoints.conversationUnread);
}
export async function openApplicationConversation(applicationId: string) {
  return normalizeConversation(await protectedRequest<unknown>(
    endpoints.conversationForApplication(applicationId),
  ));
}
export async function openBookingConversation(bookingId: string) {
  return normalizeConversation(await protectedRequest<unknown>(
    endpoints.conversationForBooking(bookingId),
  ));
}
export async function getConversationThreads(
  id: string,
  topic: ConversationTopic,
  before?: string,
) {
  const query = new URLSearchParams({ topic, limit: '20' });
  if (before) query.set('before', before);
  const result = await protectedRequest<Partial<ConversationThreadsPage>>(
    endpoints.conversationThreads(id) + '?' + query.toString(),
  );
  if (
    !Array.isArray(result.conversations) ||
    typeof result.total !== 'number' ||
    typeof result.hasMore !== 'boolean' ||
    (result.nextCursor !== null &&
      result.nextCursor !== undefined &&
      typeof result.nextCursor !== 'string')
  )
    throw new Error('The server returned an invalid conversation picker.');
  return {
    conversations: result.conversations.map(normalizeConversation),
    total: result.total,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor || null,
  };
}
export async function getConversation(id: string) {
  return normalizeConversation(
    await protectedRequest<unknown>(endpoints.conversation(id)),
  );
}

export async function startTeacherConversation(instructorId: string) {
  return normalizeConversation(
    await protectedRequest<unknown>(endpoints.conversations, 'POST', {
      instructorId,
    }),
  );
}

export async function getAllConversations() {
  const conversations = await getAllPages<unknown>(
    endpoints.conversations,
    'conversations',
  );
  return conversations.map(normalizeConversation);
}

export function getConversationApplication(applicationId: string) {
  return protectedRequest<Application>(
    endpoints.applications + '/' + encodeURIComponent(applicationId),
  );
}
export async function getMessages(id: string, before?: string, limit = 30) {
  const query =
    '?limit=' +
    Math.max(1, Math.min(100, Math.trunc(limit))) +
    (before ? '&before=' + encodeURIComponent(before) : '');
  return normalizeMessagesPage(
    await protectedRequest<unknown>(endpoints.conversationMessages(id) + query),
  );
}
export async function sendMessage(
  id: string,
  body: string,
  attachmentIds: string[],
) {
  const text = body.trim();
  if (
    (!text && !attachmentIds.length) ||
    text.length > 2000 ||
    attachmentIds.length > 5
  ) {
    throw new Error('Write up to 2,000 characters or attach up to five files.');
  }
  return normalizeMessage(
    await protectedRequest<unknown>(
      endpoints.conversationMessages(id),
      'POST',
      { body: text, attachmentIds },
    ),
  );
}
export function markConversationRead(id: string) {
  return protectedRequest<{ readAt: string | null }>(
    endpoints.conversationRead(id),
    'POST',
  );
}
export function createChatAttachment(
  id: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  return protectedRequest<AttachmentUpload>(
    endpoints.conversationAttachments(id),
    'POST',
    { fileName, contentType, sizeBytes },
  );
}
export function getAttachmentDownload(id: string, attachmentId: string) {
  return protectedRequest<{ url: string; expiresAt: string }>(
    endpoints.conversationDownload(id, attachmentId),
  );
}

// After a long disconnect, walk back to the loaded history so no messages are skipped.
export async function getMissedMessages(
  id: string,
  existing: ChatMessage[],
  lastSyncedId?: string,
) {
  // Socket messages may be newer than a gap. Only a REST cursor proves overlap.
  const anchor = lastSyncedId || existing[0]?.id;
  let page = await getMessages(id);
  let messages = page.messages;
  const cursors = new Set<string>();
  while (
    anchor &&
    page.hasMore &&
    page.messages.length &&
    !page.messages.some(message => message.id === anchor)
  ) {
    const cursor = page.messages[0].id;
    if (cursors.has(cursor) || cursors.size >= 100)
      throw new Error(
        'Unable to reconcile message history. Please refresh the conversation.',
      );
    cursors.add(cursor);
    page = await getMessages(id, cursor);
    messages = [...page.messages, ...messages];
  }
  return { messages, hasMore: page.hasMore };
}

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map(message => [message.id, message]));
  incoming.forEach(message => byId.set(message.id, message));
  return Array.from(byId.values()).sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
