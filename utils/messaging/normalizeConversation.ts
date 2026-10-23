import type {
  ChatMessage,
  Conversation,
  ConversationParticipant,
  ConversationSide,
  MessageAttachment,
  MessagesPage,
} from '../../constants/conversationsApi';

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value ? value : null;
}

function dateIso(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function side(value: unknown): ConversationSide | null {
  return value === 'instructor' || value === 'poster' ? value : null;
}

function normalizeAttachment(value: unknown): MessageAttachment {
  const attachment = record(value);
  return {
    contentType: text(attachment.contentType, 'application/octet-stream'),
    fileName: text(attachment.fileName, 'file'),
    id: text(attachment.id),
    sizeBytes: Number.isFinite(Number(attachment.sizeBytes))
      ? Math.max(0, Number(attachment.sizeBytes))
      : 0,
  };
}

export function normalizeMessage(value: unknown): ChatMessage {
  const message = record(value);
  return {
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map(normalizeAttachment)
      : [],
    body: text(message.body),
    conversationId: text(message.conversationId),
    createdAt: dateIso(message.createdAt) || new Date(0).toISOString(),
    id: text(message.id),
    senderSide: side(message.senderSide),
  };
}

function normalizeParticipant(value: unknown): ConversationParticipant | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const participant = value as UnknownRecord;
  return {
    id: nullableText(participant.id),
    userId: nullableText(participant.userId),
    imageUrl: nullableText(participant.imageUrl),
    name: text(participant.name, 'Account unavailable') || 'Account unavailable',
    role: participant.role === 'teacher' ? 'teacher' : 'school',
  };
}

export function normalizeConversation(value: unknown): Conversation {
  const conversation = record(value);
  const participantValues = record(conversation.participants);
  const participants = {
    instructor: normalizeParticipant(participantValues.instructor),
    poster: normalizeParticipant(participantValues.poster),
  };
  const me = side(conversation.me);
  const fallbackRole = me === 'poster' ? 'teacher' : 'school';
  const counterpart =
    normalizeParticipant(conversation.counterpart) ||
    (me === 'poster' ? participants.instructor : participants.poster) || {
      id: null,
      userId: null,
      imageUrl: null,
      name: 'Account unavailable',
      role: fallbackRole,
    };
  const bookingValue = record(conversation.booking);
  const booking = text(bookingValue.id)
    ? {
        id: text(bookingValue.id),
        status: text(bookingValue.status),
        applicationId: nullableText(bookingValue.applicationId),
      }
    : null;
  const jobValue = record(conversation.job);
  const job = text(jobValue.id)
    ? {
        id: text(jobValue.id),
        title: text(jobValue.title, 'Job') || 'Job',
        hours:
          jobValue.hours == null || !Number.isFinite(Number(jobValue.hours))
            ? null
            : Number(jobValue.hours),
        days:
          jobValue.days == null || !Number.isFinite(Number(jobValue.days))
            ? null
            : Number(jobValue.days),
        ...(typeof jobValue.status === 'string'
          ? { status: jobValue.status }
          : {}),
      }
    : null;
  const lastMessageValue = record(conversation.lastMessage);
  const lastMessage = conversation.lastMessage
    ? {
        body: text(lastMessageValue.body),
        createdAt:
          dateIso(lastMessageValue.createdAt) || new Date(0).toISOString(),
        fromMe: Boolean(lastMessageValue.fromMe),
        hasAttachments: Boolean(lastMessageValue.hasAttachments),
      }
    : null;
  const unread = Number(conversation.unreadCount);
  const createdAt = dateIso(conversation.createdAt) || new Date(0).toISOString();

  return {
    id: text(conversation.id),
    instructorId: participants.instructor?.id || undefined,
    institutionId: participants.poster?.id || undefined,
    applicationId: nullableText(conversation.applicationId),
    booking,
    bookingId: booking?.id || null,
    applicationStatus: nullableText(conversation.applicationStatus),
    readOnly: me === null || Boolean(conversation.readOnly),
    job,
    me,
    counterpart,
    participants,
    lastMessage,
    unreadCount: Number.isFinite(unread) ? Math.max(0, Math.trunc(unread)) : 0,
    counterpartLastReadAt: dateIso(conversation.counterpartLastReadAt),
    lastMessageAt: dateIso(conversation.lastMessageAt),
    createdAt,
  };
}

export function normalizeMessagesPage(value: unknown): MessagesPage {
  const page = record(value);
  return {
    messages: Array.isArray(page.messages)
      ? page.messages.map(normalizeMessage)
      : [],
    hasMore: Boolean(page.hasMore),
  };
}
