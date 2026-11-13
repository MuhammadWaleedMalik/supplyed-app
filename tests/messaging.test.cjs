require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  contactGroups,
  contactThreads,
  conversationContextLabel,
  conversationPreview,
  conversationTopic,
  defaultThread,
} = require('../utils/messaging/threads');
const { endpoints } = require('../constants/endpoints');
const {
  getNotificationDestination,
} = require('../utils/navigation/notificationNavigation');
const {
  normalizeConversation,
  normalizeMessage,
  normalizeMessagesPage,
} = require('../utils/messaging/normalizeConversation');

function conversation(id, extra = {}) {
  return {
    id,
    createdAt: `2026-10-2${id.length}T10:00:00Z`,
    lastMessageAt: null,
    lastMessage: null,
    unreadCount: 0,
    applicationStatus: '',
    counterpart: { id: 'person-1', role: 'teacher', name: 'Taylor' },
    job: { id: 'job', title: 'Cover role' },
    ...extra,
  };
}

test('uses exactly General and Jobs conversation categories', () => {
  const general = conversation('general');
  const application = conversation('application', { applicationId: 'app' });
  const booking = conversation('booking', { bookingId: 'booking-id' });
  assert.equal(conversationTopic(general), 'general');
  assert.equal(conversationTopic(application), 'jobs');
  assert.equal(conversationTopic(booking), 'jobs');
  const threads = contactThreads([general, application, booking]);
  assert.deepEqual(new Set(threads.map(item => item.topic)), new Set(['general', 'jobs']));
  assert.equal(defaultThread(threads).topic, 'jobs');
});

test('inbox previews the newest real message and labels its booking context', () => {
  const message = conversation('message', {
    createdAt: '2026-10-20T10:00:00Z',
    lastMessageAt: '2026-10-28T10:00:00Z',
    lastMessage: {
      body: 'I can arrive at 8:15.',
      createdAt: '2026-10-28T10:00:00Z',
      fromMe: false,
      hasAttachments: false,
    },
    booking: {
      id: 'booking-1',
      status: 'CONFIRMED',
      applicationId: 'application-1',
    },
    applicationId: 'application-1',
  });
  const newerEmptyThread = conversation('empty', {
    createdAt: '2026-10-29T10:00:00Z',
    applicationId: 'application-2',
    applicationStatus: 'APPLIED',
  });
  const group = contactGroups([newerEmptyThread, message])[0];
  assert.equal(group.latest.id, 'message');
  assert.equal(conversationPreview(group.latest), 'I can arrive at 8:15.');
  assert.equal(conversationContextLabel(group.latest), 'Booking · Application');
});

test('empty chats show application, invitation, booking or general context', () => {
  assert.equal(
    conversationPreview(
      conversation('invite', {
        applicationId: 'invitation-1',
        applicationStatus: 'INVITED',
      }),
    ),
    'Invitation chat',
  );
  assert.equal(
    conversationContextLabel(
      conversation('direct', {
        booking: {
          id: 'booking-direct',
          status: 'CONFIRMED',
          applicationId: null,
        },
        applicationId: null,
      }),
    ),
    'Booking · Invitation',
  );
  assert.equal(
    conversationPreview(
      conversation('general-chat', { job: null, applicationId: null }),
    ),
    'General conversation chat',
  );
});

test('builds booking and participant-thread paths with encoded IDs', () => {
  assert.equal(
    endpoints.conversationForBooking('booking/one'),
    '/conversations/booking/booking%2Fone',
  );
  assert.equal(
    endpoints.conversationThreads('conversation/one'),
    '/conversations/conversation%2Fone/threads',
  );
});

test('prefers a validated invitation ID for invitation notifications', () => {
  const destination = getNotificationDestination({
    id: 'notification',
    type: 'JOB_INVITATION_STATUS',
    title: 'Invitation updated',
    body: 'Review the offer',
    link: '/job-invitations',
    data: { invitationId: 'invitation_exact_123' },
    readAt: null,
    createdAt: '2026-10-22T10:00:00Z',
  });
  assert.deepEqual(destination, {
    screen: 'Invitations',
    invitationId: 'invitation_exact_123',
  });
});

test('normalizes the backend conversation contract used by the web app', () => {
  const result = normalizeConversation({
    id: 'conversation-1',
    applicationId: 'application-1',
    booking: {
      id: 'booking-1',
      status: 'CONFIRMED',
      applicationId: 'application-1',
    },
    job: { id: 'job-1', title: 'Science cover', hours: 12, days: null },
    me: 'poster',
    counterpart: null,
    participants: {
      instructor: {
        id: 'teacher-1',
        userId: 'user-1',
        name: 'Taylor Teacher',
        imageUrl: null,
        role: 'teacher',
      },
      poster: {
        id: 'school-1',
        userId: 'user-2',
        name: 'SupplyEd School',
        imageUrl: null,
        role: 'school',
      },
    },
    unreadCount: 2.8,
    createdAt: '2026-10-22T10:00:00+01:00',
  });

  assert.equal(result.bookingId, 'booking-1');
  assert.equal(result.booking.id, 'booking-1');
  assert.equal(result.counterpart.id, 'teacher-1');
  assert.equal(result.instructorId, 'teacher-1');
  assert.equal(result.institutionId, 'school-1');
  assert.equal(result.job.hours, 12);
  assert.equal(result.unreadCount, 2);
  assert.equal(result.createdAt, '2026-10-22T09:00:00.000Z');
  assert.equal(conversationTopic(result), 'jobs');
});

test('normalizes malformed and deleted-account message fields safely', () => {
  const message = normalizeMessage({
    id: 'message-1',
    senderSide: 'deleted',
    createdAt: 'not-a-date',
    attachments: [{ id: 'file-1', sizeBytes: '42' }],
  });
  assert.equal(message.senderSide, null);
  assert.equal(message.createdAt, '1970-01-01T00:00:00.000Z');
  assert.deepEqual(message.attachments[0], {
    id: 'file-1',
    fileName: 'file',
    contentType: 'application/octet-stream',
    sizeBytes: 42,
  });
  assert.deepEqual(normalizeMessagesPage({ messages: [message], hasMore: 1 }), {
    messages: [message],
    hasMore: true,
  });
});
