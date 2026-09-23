import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { pick } from '@react-native-documents/picker';
import App from '../App';
import LandingHeader from '../components/landing/LandingHeader';
import Button from '../components/Ui/Button';
import Input from '../components/Ui/Input';
import CodeInputs from '../components/auth/CodeInputs';
import RoleSelection from '../components/onboarding/RoleSelection';
import OnboardingFooter from '../components/onboarding/OnboardingFooter';
import ProfileConfirmation from '../components/onboarding/ProfileConfirmation';
import DocumentsUpload from '../components/documents/DocumentsUpload';
import DocumentCard from '../components/documents/DocumentCard';
import HirerDashboardScreen from '../feature/dashboard/screen/HirerDashboardScreen';
import { clearTokens } from '../utils/api/session';

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});

function reply(data: object) {
  return { ok: true, status: 200, json: async () => ({ data }) } as Response;
}

test('verified individual uploads immediately and uses the review button to reach dashboard', async () => {

  (pick as jest.Mock).mockResolvedValue([{
    uri: 'file://selected-dbs.pdf',
    name: 'dbs.pdf',
    type: 'application/pdf',
    size: 4,
    error: null,
  }]);
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (url, options) => {
      const path = String(url);
      if (path.endsWith('/auth/login')) return reply({ otpToken: 'challenge' });
      if (path.endsWith('/auth/email/otp/verify'))
        return reply({
          user: {
            id: 'user-1', email: 'hirer@example.com',
            role: 'USER', emailVerified: true,
          },
          accessToken: 'access', refreshToken: 'refresh',
        });
      if (path.endsWith('/users/me')) return reply({ id: 'user-1' });
      if (path.endsWith('/recruiters') && options?.method === 'POST')
        return reply({ id: 'profile-1', status: 'INCOMPLETE' });
      if (path.includes('/document-requirements/profile'))
        return reply([{
          id: 'req-1', context: 'RECRUITER_PROFILE', isRequired: true,
          documentType: {
            id: 'type-1', code: 'DBS', name: 'DBS',
            allowedMimes: ['application/pdf'], maxSizeBytes: 10000,
          },
        }]);
      if (path === 'file://selected-dbs.pdf')
        return { ok: true, status: 200, blob: async () => ({ size: 4 }) } as Response;
      if (path.includes('/documents?')) return reply({ documents: [] });
      if (path.endsWith('/documents') && options?.method === 'POST')
        return reply({ id: 'doc-1', requirementId: 'req-1' });
      if (path.endsWith('/documents/doc-1/upload-url'))
        return reply({ url: 'https://storage.example/upload', fileKey: 'key-1' });
      if (path === 'https://storage.example/upload')
        return { ok: true, status: 200 } as Response;
      if (path.endsWith('/documents/doc-1/upload-complete'))
        return reply({
          id: 'doc-1', requirementId: 'req-1', fileKey: 'key-1',
          uploadedAt: '2026-09-22T12:00:00Z',
          status: 'PENDING', originalName: 'dbs.pdf',
        });
      if (path.endsWith('/recruiters/me'))
        return reply({ id: 'profile-1', status: 'ACTIVE' });
      if (path.includes('/jobs/mine')) return reply([]);
      if (path.endsWith('/auth/me'))
        return reply({ id: 'user-1', email: 'hirer@example.com', role: 'RECRUITER' });
      throw new Error('Unexpected API call: ' + path);
    });

  let app: ReactTestRenderer.ReactTestRenderer;
  await act(() => { app = ReactTestRenderer.create(<App />); });
  await act(() => app!.root.findByType(LandingHeader).props.onLogin());
  await act(() => {
    const inputs = app!.root.findAllByType(Input);
    inputs.find(input => input.props.email)!.props.onChangeText('hirer@example.com');
    inputs.find(input => input.props.password)!.props.onChangeText('Password1!');
  });
  await act(async () => {
    await app!.root.findAllByType(Button)
      .find(button => button.props.title.startsWith('Continue securely'))!
      .props.onPress();
  });
  await act(() => {
    for (let index = 0; index < 6; index++)
      app!.root.findByType(CodeInputs).props.onChange(index, String(index + 1));
  });
  await act(async () => {
    await app!.root.findAllByType(Button)
      .find(button => button.props.title === 'Verify and continue')!
      .props.onPress();
  });
  await act(() => app!.root.findByType(RoleSelection).props.onSelect('individual'));
  await act(() =>
    app!.root.findAllByType(Input)
      .find(input => input.props.label === 'FULL NAME')!
      .props.onChangeText('A Hirer'),
  );
  await act(() => app!.root.findByType(OnboardingFooter).props.onContinue());
  await act(() => app!.root.findByType(OnboardingFooter).props.onContinue());
  expect(app!.root.findByType(ProfileConfirmation).props.visible).toBe(true);
  await act(async () => {
    await app!.root.findByType(ProfileConfirmation).props.onCreate();
  });
  await act(async () => { await Promise.resolve(); });
  expect(app!.root.findByType(DocumentsUpload).props.loading).toBe(false);
  await act(async () => {
    await app!.root.findByType(DocumentCard).props.onAdd(
      app!.root.findByType(DocumentCard).props.requirement,
    );
  });
  expect(pick).toHaveBeenCalled();
  expect(app!.root.findByType(DocumentsUpload).props.documents).toHaveLength(1);
  expect(app!.root.findAllByType(HirerDashboardScreen)).toHaveLength(0);
  await act(async () => {
    await app!.root.findByType(DocumentsUpload).props.onSubmit();
  });
  expect(app!.root.findAllByType(HirerDashboardScreen)).toHaveLength(1);
  expect(fetchMock.mock.calls.some(call => String(call[0]).endsWith('/recruiters/me/status'))).toBe(false);

  await act(() => app!.unmount());
  fetchMock.mockRestore();
  clearTokens();
});




