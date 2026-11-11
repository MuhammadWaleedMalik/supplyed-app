import { protectedRequest } from '../../../utils/api/request';

export type IdentityVerificationStatus =
  | 'LINK_SENT'
  | 'SUBMITTED'
  | 'RESULTS_READY'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type IdentityVerificationResult =
  | 'VERIFIED'
  | 'IN_REVIEW'
  | 'RETRY_PENDING'
  | 'UNSUCCESSFUL';

export type IdentityState =
  | 'NOT_STARTED'
  | 'LINK_SENT'
  | 'PROCESSING'
  | 'IN_REVIEW'
  | 'RETRY_PENDING'
  | 'VERIFIED'
  | 'UNSUCCESSFUL';

// These are the teacher-safe fields returned by the existing backend.
export type IdentityVerification = {
  completedAt: string | null;
  createdAt: string;
  guestLinkUrl: string | null;
  id: string;
  linkExpiresAt: string;
  result: IdentityVerificationResult | null;
  status: IdentityVerificationStatus;
  submittedAt: string | null;
};

export type MyIdentityVerification = {
  canStart: boolean;
  required: boolean;
  state: IdentityState;
  verification: IdentityVerification | null;
  verifiedAt: string | null;
};

export type TeacherDbsState =
  | 'IN_PROGRESS'
  | 'VERIFIED'
  | 'CERTIFICATE_NEEDED'
  | 'NOT_VERIFIED';

export type TeacherDbsCheck = {
  id: string;
  state: TeacherDbsState;
  submittedAt: string | null;
  resultAt: string | null;
};

const statuses: IdentityVerificationStatus[] = [
  'LINK_SENT',
  'SUBMITTED',
  'RESULTS_READY',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
];
const results: IdentityVerificationResult[] = [
  'VERIFIED',
  'IN_REVIEW',
  'RETRY_PENDING',
  'UNSUCCESSFUL',
];
const states: IdentityState[] = [
  'NOT_STARTED',
  'LINK_SENT',
  'PROCESSING',
  'IN_REVIEW',
  'RETRY_PENDING',
  'VERIFIED',
  'UNSUCCESSFUL',
];
const dbsStates: TeacherDbsState[] = [
  'IN_PROGRESS',
  'VERIFIED',
  'CERTIFICATE_NEEDED',
  'NOT_VERIFIED',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readGuestLink(value: unknown) {
  const link = readString(value);
  if (!link?.startsWith('https://')) return null;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' &&
      url.hostname &&
      !url.username &&
      !url.password
      ? link
      : null;
  } catch {
    return null;
  }
}

export function normalizeIdentityVerification(
  value: unknown,
): IdentityVerification | null {
  if (!isRecord(value) || !readString(value.id)) return null;
  const status = statuses.find(item => item === value.status);
  if (!status) return null;
  return {
    completedAt: readString(value.completedAt),
    createdAt: readString(value.createdAt) ?? new Date(0).toISOString(),
    guestLinkUrl:
      status === 'LINK_SENT' ? readGuestLink(value.guestLinkUrl) : null,
    id: String(value.id),
    linkExpiresAt: readString(value.linkExpiresAt) ?? new Date(0).toISOString(),
    result: results.find(item => item === value.result) ?? null,
    status,
    submittedAt: readString(value.submittedAt),
  };
}

export function normalizeMyIdentityVerification(
  value: unknown,
): MyIdentityVerification {
  const item = isRecord(value) ? value : {};
  return {
    canStart: item.canStart === true,
    // Match the web: only an explicit false switches the identity step off.
    required: item.required !== false,
    state: states.find(state => state === item.state) ?? 'NOT_STARTED',
    verification: normalizeIdentityVerification(item.verification),
    verifiedAt: readString(item.verifiedAt),
  };
}

export function normalizeMyDbsCheck(value: unknown): TeacherDbsCheck | null {
  const item = isRecord(value) ? value.dbsCheck : null;
  if (item === null) return null;
  if (!isRecord(item) || !readString(item.id))
    throw new Error('Your DBS check could not be loaded. Please try again.');
  const state = dbsStates.find(candidate => candidate === item.state);
  if (!state)
    throw new Error('Your DBS check could not be loaded. Please try again.');
  return {
    id: String(item.id),
    state,
    submittedAt: readString(item.submittedAt),
    resultAt: readString(item.resultAt),
  };
}

export async function getMyIdentityVerification() {
  return normalizeMyIdentityVerification(
    await protectedRequest<unknown>('/identity-verification/me'),
  );
}

export async function startIdentityVerification(consent: boolean) {
  if (consent !== true)
    throw new Error('Agree to the identity check before starting it.');
  const verification = normalizeIdentityVerification(
    await protectedRequest<unknown>('/identity-verification/me', 'POST', {
      consent: true,
    }),
  );
  if (!verification)
    throw new Error(
      'Your identity check could not be started. Please try again.',
    );
  return verification;
}

export async function getMyDbsCheck() {
  return normalizeMyDbsCheck(await protectedRequest<unknown>('/dbs-checks/me'));
}

export function identityStepRequired(identity: MyIdentityVerification) {
  return (
    identity.required &&
    (identity.state === 'NOT_STARTED' || identity.state === 'UNSUCCESSFUL')
  );
}

export function identityCheckPending(state: IdentityState) {
  return (
    state === 'LINK_SENT' ||
    state === 'PROCESSING' ||
    state === 'IN_REVIEW' ||
    state === 'RETRY_PENDING'
  );
}

const stateTags: Record<
  IdentityState,
  {
    label: string;
    tone: 'green' | 'amber' | 'red' | 'ghost';
  }
> = {
  NOT_STARTED: { label: 'Not verified', tone: 'ghost' },
  LINK_SENT: { label: 'Waiting for you', tone: 'amber' },
  PROCESSING: { label: 'Checking', tone: 'amber' },
  IN_REVIEW: { label: 'In review', tone: 'amber' },
  RETRY_PENDING: { label: 'Needs another look', tone: 'amber' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  UNSUCCESSFUL: { label: 'Unsuccessful', tone: 'red' },
};

export function identityStateTag(state: IdentityState) {
  return stateTags[state];
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Keep the same status meanings and teacher-facing wording as the web.
export function describeIdentityState(identity: MyIdentityVerification) {
  const { state, verification } = identity;
  switch (state) {
    case 'NOT_STARTED':
      return verification?.status === 'EXPIRED'
        ? "Your last TrustID link expired before it was used. Start again when you're ready."
        : "Verify your identity and right to work with TrustID, our identity partner. You'll need your phone and your passport or share code. It takes about five minutes.";
    case 'LINK_SENT':
      return `Open the TrustID link on your phone to photograph your passport (or enter your share code) and take a selfie. We've also emailed and texted it to you.${
        verification
          ? ` It expires on ${shortDate(verification.linkExpiresAt)}.`
          : ''
      }`;
    case 'PROCESSING':
      return "TrustID is checking what you sent. This can take a little while; we'll email you when it's done.";
    case 'IN_REVIEW':
      return "TrustID has finished your check and our team is reviewing the result. We'll let you know the outcome.";
    case 'RETRY_PENDING':
      return "TrustID couldn't verify the photos you sent. Our team will review it and may send you a new link to try again.";
    case 'VERIFIED':
      return identity.verifiedAt
        ? `Your identity and right to work were confirmed on ${shortDate(
            identity.verifiedAt,
          )}.`
        : 'Your identity and right to work are confirmed.';
    case 'UNSUCCESSFUL':
      return "We couldn't verify your identity. Please contact SupplyEd support.";
  }
}

export function describeDbsCheck(check: TeacherDbsCheck | null) {
  switch (check?.state) {
    case 'IN_PROGRESS':
      return 'Your DBS check is in progress.';
    case 'VERIFIED':
      return 'Your DBS check is verified.';
    case 'CERTIFICATE_NEEDED':
      return 'Show SupplyEd the certificate the DBS posted to you so the team can review it.';
    case 'NOT_VERIFIED':
      return 'Your DBS check is not verified. Please contact SupplyEd support.';
    default:
      return 'Your DBS check has not been sent yet.';
  }
}
