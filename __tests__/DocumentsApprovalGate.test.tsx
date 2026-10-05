import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { endpoints } from '../constants/endpoints';
import { useDocuments } from '../feature/documents/hooks/useDocuments';
import { protectedRequest } from '../utils/api/request';

jest.mock('../utils/api/request', () => ({
  ...jest.requireActual('../utils/api/request'),
  protectedRequest: jest.fn(),
}));

const request = protectedRequest as jest.MockedFunction<typeof protectedRequest>;
let renderer: ReactTestRenderer | undefined;
let form: ReturnType<typeof useDocuments>;
let approvalStatus: string;
let hasDocument: boolean;
let isMatSchool: boolean;
let approvalError: boolean;

function Harness({ onReviewStatus }: { onReviewStatus: () => void }) {
  form = useDocuments('school', onReviewStatus);
  return null;
}

beforeEach(() => {
  request.mockReset();
  approvalStatus = 'PENDING';
  hasDocument = true;
  isMatSchool = true;
  approvalError = false;
  request.mockImplementation(async path => {
    if (path === endpoints.requirements) {
      return [{ id: 'requirement-1', isRequired: true,
        documentType: { id: 'type-1', name: 'Safeguarding policy', code: 'POLICY' } }];
    }
    if (path.startsWith(endpoints.documents + '?')) {
      return hasDocument ? [{ id: 'document-1', requirementId: 'requirement-1',
        fileKey: 'uploaded-policy.pdf', uploadedAt: '2026-10-05', status: 'PENDING' }] : [];
    }
    if (path === endpoints.schoolMe) {
      return { id: 'school-1', status: 'INCOMPLETE',
        institutionType: isMatSchool ? 'MAT_SCHOOL' : 'SINGLE_SCHOOL' };
    }
    if (path === endpoints.schoolSignatoryApproval) {
      if (approvalError) throw new Error('Unable to refresh approval status.');
      return { id: 'approval-1', status: approvalStatus };
    }
    if (path === endpoints.schoolStatus) return { id: 'school-1', status: 'PENDING_REVIEW' };
    throw new Error('Unexpected request: ' + path);
  });
});

afterEach(async () => {
  if (renderer) await act(async () => renderer?.unmount());
  renderer = undefined;
});

async function mount() {
  const onReviewStatus = jest.fn();
  await act(async () => {
    renderer = create(<Harness onReviewStatus={onReviewStatus} />);
  });
  return onReviewStatus;
}

it('shows the waiting screen without submitting while the signatory is pending', async () => {
  const onReviewStatus = await mount();
  await act(async () => form.continueToReviewStatus());
  expect(onReviewStatus).toHaveBeenCalledTimes(1);
  expect(request.mock.calls.filter(([path]) =>
    path === endpoints.schoolSignatoryApproval,
  )).toHaveLength(2);
  expect(request.mock.calls.some(([path]) => path === endpoints.schoolStatus)).toBe(false);
});

it('refetches approval and submits after approval with uploaded documents', async () => {
  const onReviewStatus = await mount();
  approvalStatus = 'APPROVED';
  await act(async () => form.continueToReviewStatus());
  expect(form.approval?.status).toBe('APPROVED');
  expect(request).toHaveBeenCalledWith(endpoints.schoolStatus, 'PATCH');
  expect(onReviewStatus).toHaveBeenCalledTimes(1);
});

it('keeps the required document check before any submission', async () => {
  hasDocument = false;
  approvalStatus = 'APPROVED';
  const onReviewStatus = await mount();
  await act(async () => form.continueToReviewStatus());
  expect(form.error).toBe('Upload or replace the required documents before continuing.');
  expect(onReviewStatus).not.toHaveBeenCalled();
  expect(request.mock.calls.some(([path]) => path === endpoints.schoolStatus)).toBe(false);
});

it('does not submit when the latest approval cannot be loaded', async () => {
  const onReviewStatus = await mount();
  approvalError = true;
  await act(async () => form.continueToReviewStatus());
  expect(form.error).toBe('Unable to refresh approval status.');
  expect(form.submitting).toBe(false);
  expect(onReviewStatus).not.toHaveBeenCalled();
  expect(request.mock.calls.some(([path]) => path === endpoints.schoolStatus)).toBe(false);
});

it('allows single schools with uploaded documents to submit without signatory approval', async () => {
  isMatSchool = false;
  const onReviewStatus = await mount();
  await act(async () => form.continueToReviewStatus());
  expect(request).toHaveBeenCalledWith(endpoints.schoolStatus, 'PATCH');
  expect(request.mock.calls.some(([path]) => path === endpoints.schoolSignatoryApproval)).toBe(false);
  expect(onReviewStatus).toHaveBeenCalledTimes(1);
});
