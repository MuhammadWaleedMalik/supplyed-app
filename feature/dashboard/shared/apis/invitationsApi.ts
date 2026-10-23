import * as Keychain from 'react-native-keychain';
import { protectedRequest, ApiError } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import {
  getCurrentSessionUser,
  getSessionVersion,
} from '../../../../utils/api/session';
import {
  getMessages,
  sendMessage,
  startTeacherConversation,
} from '../../../../constants/conversationsApi';
import type { Job } from './jobsApi';
import type { Booking, BookingPagination } from './bookingsApi';

export type Invitation = {
  createdAt?: string;
  id: string;
  status: string;
  job: Job;
  jobStatus: string;
  instructor: { id: string; fullName: string };
  institution: { id: string; name: string };
  message: string | null;
  expiresAt: string;
  publishOnDecline: boolean;
  bookingId: string | null;
};
export type InvitationRequest = {
  requestId: string;
  instructorId: string;
  jobId?: string;
  newJob?: object;
  message?: string;
  expiresAt?: string;
};
export type PendingInvitation = {
  payload: InvitationRequest;
  invitation?: Invitation;
};
const running = new Set<string>();
const decisions = new Set<string>();

async function savePending(service: string, pending: PendingInvitation) {
  const saved = await Keychain.setGenericPassword(
    'invitation',
    JSON.stringify(pending),
    { service },
  );
  if (!saved)
    throw new Error(
      pending.invitation
        ? 'Invitation sent, but its reply could not be saved. Retry the saved request to finish messaging.'
        : 'Unable to securely save this invitation. Nothing was sent. Please retry.',
    );
}

function accountService() {
  const id = getCurrentSessionUser()?.id;
  if (!id) throw new Error('Sign in before sending an invitation.');
  return 'com.supplyed.invitation.' + id;
}
export function newRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, letter => {
    const random = Math.floor(Math.random() * 16);
    return (letter === 'x' ? random : (random % 4) + 8).toString(16);
  });
}
export async function readPendingInvitation(): Promise<
  PendingInvitation | undefined
> {
  const saved = await Keychain.getGenericPassword({
    service: accountService(),
  });
  if (!saved) return undefined;
  const pending = JSON.parse(saved.password);
  if (!pending?.payload?.requestId || !pending.payload.instructorId)
    throw new Error('The saved invitation request could not be read.');
  return pending;
}
export function getInvitations() {
  return getAllPages<Invitation>('/job-invitations/me', 'invitations');
}
export async function getInvitationsPage(page = 1, status = '') {
  const query = new URLSearchParams({ page: String(page), limit: '20' });
  if (status) query.set('status', status);
  const result = await protectedRequest<{ invitations: Invitation[]; pagination: BookingPagination }>('/job-invitations/me?' + query.toString());
  if (!Array.isArray(result.invitations) || !result.pagination || result.pagination.page !== page)
    throw new Error('Unable to read invitations. Please refresh.');
  return { items: result.invitations, page, hasMore: result.pagination.hasNextPage, total: result.pagination.total };
}
export function getInvitation(id: string) {
  return protectedRequest<Invitation>(
    '/job-invitations/' + encodeURIComponent(id),
  );
}
export function invitationStatus(invitation: Invitation) {
  return invitation.status === 'PENDING' &&
    Date.parse(invitation.expiresAt) <= Date.now()
    ? 'EXPIRED'
    : invitation.status;
}
export async function decideInvitation(
  id: string,
  action: 'accept' | 'decline' | 'cancel',
) {
  if (decisions.has(id))
    throw new Error('This decision is already being sent.');
  decisions.add(id);
  try {
    return await protectedRequest<Invitation | Booking>(
      '/job-invitations/' + encodeURIComponent(id) + '/' + action,
      'POST',
    );
  } finally {
    decisions.delete(id);
  }
}

// Persist before POST. Never replace a request whose outcome is uncertain.
export async function sendInvitation(payload?: InvitationRequest) {
  const service = accountService();
  const version = getSessionVersion();
  if (running.has(service))
    throw new Error('This invitation is already being sent.');
  running.add(service);
  let pending: PendingInvitation | undefined;
  try {
    pending = await readPendingInvitation();
    if (pending && payload && pending.payload.requestId !== payload.requestId)
      throw new Error(
        'Finish retrying your saved invitation before sending another.',
      );
    if (!pending) {
      if (!payload) throw new Error('There is no invitation to retry.');
      if (!!payload.jobId === !!payload.newJob)
        throw new Error('Choose an existing job or create a new job.');
      pending = { payload };
      await savePending(service, pending);
    }
    if (version !== getSessionVersion())
      throw new Error('Your session changed.');
    if (!pending.invitation) {
      try {
        pending.invitation = await protectedRequest<Invitation>(
          '/job-invitations',
          'POST',
          pending.payload,
        );
      } catch (error) {
        // Validation, permission and availability failures reject the transaction.
        // Keep transport, authentication and server failures for the same-request retry.
        if (
          error instanceof ApiError &&
          [400, 403, 404, 409, 422].includes(error.status)
        )
          await Keychain.resetGenericPassword({ service });
        throw error;
      }
      await savePending(service, pending);
    }
    if (version !== getSessionVersion())
      throw new Error('Your session changed.');
    const invitation = pending.invitation;
    try {
      const conversation = await startTeacherConversation(
        invitation.instructor.id,
      );
      if (version !== getSessionVersion())
        throw new Error('Your session changed.');
      const recent = await getMessages(conversation.id, undefined, 100);
      if (version !== getSessionVersion())
        throw new Error('Your session changed.');
      if (!Array.isArray(recent.messages))
        throw new Error('Unable to check recent messages.');
      const path = '/job-invitations/' + invitation.id;
      if (
        !recent.messages.some(
          message =>
            message.senderSide === 'poster' && message.body.includes(path),
        )
      ) {
        await sendMessage(
          conversation.id,
          `I've sent you a job invitation for “${invitation.job.title}”. Review and respond from Job invitations: ${path}`,
          [],
        );
      }
      await Keychain.resetGenericPassword({ service });
      return { invitation, conversation };
    } catch (error) {
      throw new Error(
        'Invitation sent, but the chat announcement could not be confirmed. Retry the saved request to finish messaging. ' +
          (error instanceof Error ? error.message : ''),
      );
    }
  } finally {
    running.delete(service);
  }
}
