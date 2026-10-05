import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import Button from '../components/Ui/Button';
import {
  Document,
  getDocuments,
  getRequirements,
  Requirement,
} from '../feature/documents/apis/documentApi';
import {
  getProfile,
  getSignatoryApproval,
  SignatoryApproval,
  submitProfileForReview,
} from '../feature/onboarding/apis/profileApi';
import ReviewStatusScreen from '../feature/reviewStatus/screen/ReviewStatusScreen';
import { AccountType } from '../utils/onboarding/onboardingData';

jest.mock('../feature/documents/apis/documentApi');
jest.mock('../feature/onboarding/apis/profileApi');
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

const requirement: Requirement = {
  id: 'required-document',
  isRequired: true,
  documentType: { id: 'dbs', name: 'DBS certificate', code: 'DBS' },
};

const uploadedDocument: Document = {
  id: 'uploaded-document',
  requirementId: requirement.id,
  fileKey: 'documents/dbs.pdf',
  uploadedAt: '2026-10-05T00:00:00.000Z',
  status: 'PENDING',
};

function signatory(status: string): SignatoryApproval {
  return {
    id: 'approval',
    status,
    signatoryName: 'Trust signatory',
    signatoryEmail: 'trust@example.com',
    signatoryJobTitle: 'Director',
  };
}

let renderer: TestRenderer.ReactTestRenderer | undefined;
const onDashboard = jest.fn();

async function renderReview(type: AccountType = 'teacher') {
  await act(async () => {
    renderer = TestRenderer.create(
      <ReviewStatusScreen
        type={type}
        email="user@example.com"
        onDashboard={onDashboard}
      />,
    );
  });
}

async function pressButton(title: string) {
  const button = renderer?.root
    .findAllByType(Button)
    .find(item => item.props.title === title);
  expect(button).toBeDefined();
  await act(async () => {
    await button?.props.onPress();
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  renderer = undefined;
  jest
    .mocked(getProfile)
    .mockResolvedValue({ id: 'profile', status: 'INCOMPLETE' });
  jest.mocked(getRequirements).mockResolvedValue([requirement]);
  jest.mocked(getDocuments).mockResolvedValue([]);
  jest.mocked(getSignatoryApproval).mockResolvedValue(null);
  jest
    .mocked(submitProfileForReview)
    .mockResolvedValue({ id: 'profile', status: 'PENDING' });
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
});

test('does not submit a profile when required documents are missing, including after refresh', async () => {
  await renderReview();
  expect(submitProfileForReview).not.toHaveBeenCalled();
  await pressButton('Refetch profile status');
  expect(submitProfileForReview).not.toHaveBeenCalled();
  expect(onDashboard).not.toHaveBeenCalled();
});

test('does not submit when an uploaded required document was rejected', async () => {
  jest
    .mocked(getDocuments)
    .mockResolvedValue([{ ...uploadedDocument, status: 'REJECTED' }]);
  await renderReview();
  expect(submitProfileForReview).not.toHaveBeenCalled();
});

test.each([null, 'PENDING', 'DECLINED', 'EXPIRED'])(
  'does not submit an unapproved MAT profile: %s',
  async status => {
    jest.mocked(getProfile).mockResolvedValue({
      id: 'school-profile',
      status: 'INCOMPLETE',
      institutionType: 'MAT_SCHOOL',
    });
    jest.mocked(getDocuments).mockResolvedValue([uploadedDocument]);
    jest
      .mocked(getSignatoryApproval)
      .mockResolvedValue(status ? signatory(status) : null);
    await renderReview('school');
    await pressButton('Refetch profile status');
    expect(submitProfileForReview).not.toHaveBeenCalled();
    expect(onDashboard).not.toHaveBeenCalled();
  },
);

test('submits a teacher profile once its required documents are uploaded', async () => {
  jest.mocked(getDocuments).mockResolvedValue([uploadedDocument]);
  await renderReview();
  expect(submitProfileForReview).toHaveBeenCalledTimes(1);
  expect(submitProfileForReview).toHaveBeenCalledWith('teacher');
  expect(onDashboard).not.toHaveBeenCalled();
});

test('submits an approved MAT profile only after its required documents are uploaded', async () => {
  jest.mocked(getProfile).mockResolvedValue({
    id: 'school-profile',
    status: 'INCOMPLETE',
    institutionType: 'MAT_SCHOOL',
  });
  jest.mocked(getSignatoryApproval).mockResolvedValue(signatory('APPROVED'));
  await renderReview('school');
  expect(submitProfileForReview).not.toHaveBeenCalled();
  jest.mocked(getDocuments).mockResolvedValue([uploadedDocument]);
  await pressButton('Refetch profile status');
  expect(submitProfileForReview).toHaveBeenCalledTimes(1);
  expect(submitProfileForReview).toHaveBeenCalledWith('school');
});

test('submits after signatory approval refresh when the documents are ready', async () => {
  jest.mocked(getProfile).mockResolvedValue({
    id: 'school-profile',
    status: 'INCOMPLETE',
    institutionType: 'MAT_SCHOOL',
  });
  jest.mocked(getDocuments).mockResolvedValue([uploadedDocument]);
  jest.mocked(getSignatoryApproval).mockResolvedValue(signatory('PENDING'));
  await renderReview('school');
  expect(submitProfileForReview).not.toHaveBeenCalled();
  jest.mocked(getSignatoryApproval).mockResolvedValue(signatory('APPROVED'));
  await pressButton('Refetch approval');
  expect(submitProfileForReview).toHaveBeenCalledTimes(1);
});

test('does not submit or open the dashboard when document readiness cannot be loaded', async () => {
  jest
    .mocked(getRequirements)
    .mockRejectedValue(new Error('Requirements unavailable'));
  await renderReview();
  expect(submitProfileForReview).not.toHaveBeenCalled();
  expect(onDashboard).not.toHaveBeenCalled();
});
