import { nextAccountScreen } from '../utils/navigation/nextAccountScreen';
import { clearTokens, saveTokens } from '../utils/api/session';

function reply(data: object) {
  return { ok: true, status: 200, json: async () => ({ data }) } as Response;
}

const requirement = {
  id: 'req-1',
  context: 'INSTITUTION_PROFILE',
  isRequired: true,
  documentType: { id: 'type-1', code: 'DBS', name: 'DBS' },
};

afterEach(() => {
  jest.restoreAllMocks();
  clearTokens();
});

test('login returns to document onboarding when no document is uploaded', async () => {
  saveTokens({ accessToken: 'access' });
  jest.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    const path = String(url);
    if (path.endsWith('/institutions/me'))
      return reply({ id: 'school-1', status: 'ACTIVE' });
    if (path.includes('/document-requirements/profile'))
      return reply([requirement]);
    if (path.includes('/documents?')) return reply({ documents: [] });
    throw new Error('Unexpected request: ' + path);
  });
  expect(await nextAccountScreen('school')).toBe('documents');
});

test('login reaches dashboard when required documents are pending review', async () => {
  saveTokens({ accessToken: 'access' });
  jest.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    const path = String(url);
    if (path.endsWith('/institutions/me'))
      return reply({ id: 'school-1', status: 'ACTIVE' });
    if (path.includes('/document-requirements/profile'))
      return reply([requirement]);
    if (path.includes('/documents?')) return reply({ documents: [{
      id: 'doc-1', requirementId: 'req-1', fileKey: 'file.pdf',
      uploadedAt: 'today', status: 'PENDING',
    }] });
    throw new Error('Unexpected request: ' + path);
  });
  expect(await nextAccountScreen('school')).toBe('dashboard');
});

test('a rejected document returns to document onboarding on login', async () => {
  saveTokens({ accessToken: 'access' });
  jest.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    const path = String(url);
    if (path.endsWith('/institutions/me'))
      return reply({ id: 'school-1', status: 'ACTIVE' });
    if (path.includes('/document-requirements/profile'))
      return reply([requirement]);
    if (path.includes('/documents?')) return reply({ documents: [{
      id: 'doc-1', requirementId: 'req-1', fileKey: 'old.pdf',
      uploadedAt: 'yesterday', status: 'REJECTED',
      rejectionComment: 'Please upload a clearer image.',
    }] });
    throw new Error('Unexpected request: ' + path);
  });
  expect(await nextAccountScreen('school')).toBe('documents');
});

test('account without a profile returns to profile onboarding', async () => {
  saveTokens({ accessToken: 'access' });
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false, status: 404, json: async () => ({ message: 'Not found' }),
  } as Response);
  expect(await nextAccountScreen('school')).toBe('onboarding');
});

