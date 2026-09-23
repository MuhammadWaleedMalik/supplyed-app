import { saveTokens, clearTokens } from '../utils/api/session';
import { apiRequest } from '../utils/api/request';
import { createProfile } from '../feature/onboarding/apis/profileApi';
import { initialData } from '../utils/onboarding/onboardingData';
import {
  getDocumentDownloadUrl,
  getDocuments,
  getRequirements,
} from '../feature/documents/apis/documentApi';
import { uploadDocument } from '../feature/documents/apis/documentUploadApi';
import {
  requiredDocumentCount,
  requiredDocumentsReady,
} from '../utils/documents/documentUtils';

function reply(data: object, status = 200) {
  return { ok: status < 400, status, json: async () => ({ data }) } as Response;
}

afterEach(() => clearTokens());

test('API client unwraps backend data and school profile omits coordinates', async () => {
  saveTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(reply({ id: 'user-1' }))
    .mockResolvedValueOnce(reply({ id: 'school-1', status: 'INCOMPLETE' }));

  const profile = await createProfile('school', {
    ...initialData,
    fullName: 'School User',
    schoolName: 'Greenfield School',
    domain: 'https://GREENFIELD.ac.uk/info',
    address: '1 School Lane',
    city: 'Manchester',
    confirmed: true,
  });

  expect(profile.id).toBe('school-1');
  expect(fetchMock.mock.calls[0][0]).toContain('/users/me');
  expect(fetchMock.mock.calls[1][0]).toContain('/institutions');
  const request = fetchMock.mock.calls[1][1] as RequestInit;
  const body = JSON.parse(request.body as string);
  expect(body.name).toBe('Greenfield School');
  expect(body.domain).toBe('greenfield.ac.uk');
  expect(body.safeguardingConfirmed).toBe(true);
  expect(body.latitude).toBeUndefined();
  expect(body.longitude).toBeUndefined();
  expect((request.headers as Record<string, string>).Authorization).toBe(
    'Bearer access-token',
  );
  fetchMock.mockRestore();
});

test('document requirements and rejected files affect the required count', async () => {
  saveTokens({ accessToken: 'access-token' });
  const requirement = {
    id: 'req-1',
    isRequired: true,
    documentType: { id: 'type-1', code: 'DBS', name: 'DBS' },
  };
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    reply([requirement]),
  );
  const requirements = await getRequirements('teacher');
  expect(fetchMock.mock.calls[0][0]).toContain('role=INSTRUCTOR');
  expect(requiredDocumentCount(requirements, []).ready).toBe(0);
  expect(requiredDocumentsReady(requirements, [])).toBe(false);
  const rejected = [{
    id: 'doc-1', requirementId: 'req-1', fileKey: 'file',
    uploadedAt: 'now', status: 'REJECTED', rejectionComment: 'Please upload a clearer scan.',
  }];
  expect(requiredDocumentCount(requirements, rejected).ready).toBe(0);
  expect(requiredDocumentsReady(requirements, rejected)).toBe(false);
  expect(requiredDocumentsReady(requirements, [{
    ...rejected[0], status: 'PENDING',
  }])).toBe(true);
  fetchMock.mockRestore();
});

test('signed document upload sends bytes without the app bearer', async () => {
  saveTokens({ accessToken: 'access-token' });
  const fetchMock = jest.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(reply({ documents: [] }))
    .mockResolvedValueOnce(reply({ id: 'doc-1', requirementId: 'req-1' }))
    .mockResolvedValueOnce(reply({
      url: 'https://storage.example/upload', fileKey: 'key-1',
      requiredHeaders: { 'X-Test': 'yes' },
    }))
    .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
    .mockResolvedValueOnce(reply({
      id: 'doc-1', requirementId: 'req-1', uploadedAt: 'now',
    }));

  await uploadDocument('req-1', { size: 4 } as Blob, 'proof.pdf', 'application/pdf');
  const storage = fetchMock.mock.calls[3];
  expect(storage[0]).toBe('https://storage.example/upload');
  expect((storage[1]?.headers as Record<string, string>).Authorization).toBeUndefined();
  expect((storage[1]?.headers as Record<string, string>)['X-Test']).toBe('yes');
  expect(fetchMock.mock.calls[4][0]).toContain('/upload-complete');
  fetchMock.mockRestore();
});

test('replacement reuses the document row and preview requests a fresh signed URL', async () => {
  saveTokens({ accessToken: 'access-token' });
  const fetchMock = jest.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(reply({ documents: [{
      id: 'doc-1', requirementId: 'req-1', status: 'REJECTED',
      fileKey: 'old-file', uploadedAt: 'yesterday',
      rejectionComment: 'Blurry image',
    }] }))
    .mockResolvedValueOnce(reply({
      url: 'https://storage.example/replace', fileKey: 'new-file',
    }))
    .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
    .mockResolvedValueOnce(reply({
      id: 'doc-1', requirementId: 'req-1', status: 'PENDING',
      fileKey: 'new-file', uploadedAt: 'today',
    }))
    .mockResolvedValueOnce(reply({
      downloadUrl: 'https://storage.example/preview',
    }));
  await uploadDocument('req-1', { size: 5 } as Blob, 'clear.pdf', 'application/pdf');
  expect(fetchMock.mock.calls[1][0]).toContain('/documents/doc-1/upload-url');
  expect(fetchMock.mock.calls.some(call =>
    String(call[0]).endsWith('/documents') && call[1]?.method === 'POST',
  )).toBe(false);
  expect(await getDocumentDownloadUrl('doc-1')).toBe(
    'https://storage.example/preview',
  );
  fetchMock.mockRestore();
});

test('document listing loads every page before showing the count', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(reply({
      documents: [{ id: 'doc-1', requirementId: 'req-1' }],
      pagination: { hasNextPage: true },
    }))
    .mockResolvedValueOnce(reply({
      documents: [{ id: 'doc-2', requirementId: 'req-2' }],
      pagination: { hasNextPage: false },
    }));
  expect(await getDocuments()).toHaveLength(2);
  expect(fetchMock.mock.calls[1][0]).toContain('page=2');
  fetchMock.mockRestore();
});

test('backend errors are shown instead of advancing silently', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ message: ['Invalid file', 'Try again'] }),
  } as Response);
  await expect(apiRequest('/documents')).rejects.toThrow('Invalid file, Try again');
  fetchMock.mockRestore();
});
