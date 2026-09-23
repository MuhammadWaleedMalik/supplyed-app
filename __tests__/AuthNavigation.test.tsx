import React from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import LandingHeader from '../components/landing/LandingHeader';
import AuthLayout from '../components/auth/AuthLayout';
import AuthSwitch from '../components/auth/AuthSwitch';
import Button from '../components/Ui/Button';
import Input from '../components/Ui/Input';
import LoginScreen from '../feature/auth/screen/LoginScreen';
import RegisterScreen from '../feature/auth/screen/RegisterScreen';
import VerificationScreen from '../feature/auth/screen/VerificationScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});

test('navigates through login, email code, and registration', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: { otpToken: 'email-challenge' } }),
  } as Response);
  let app: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    app = ReactTestRenderer.create(<App />);
  });

  await act(() => {
    app!.root.findByType(LandingHeader).props.onLogin();
  });
  expect(app!.root.findAllByType(LoginScreen)).toHaveLength(1);
  expect(app!.root.findByType(KeyboardAvoidingView)).toBeTruthy();
  expect(app!.root.findByType(ScrollView).props.keyboardShouldPersistTaps).toBe(
    'handled',
  );

  await act(() => {
    app!.root
      .findAllByType(Input)
      .find(input => input.props.email)!
      .props.onChangeText('school@example.com');
  });
  await act(() => {
    app!.root
      .findAllByType(Input)
      .find(input => input.props.password)!
      .props.onChangeText('Password1!');
  });
  await act(() => {
    app!.root
      .findAllByType(Button)
      .find(button => button.props.title.startsWith('Continue securely'))!
      .props.onPress();
  });
  expect(app!.root.findAllByType(VerificationScreen)).toHaveLength(1);

  await act(() => {
    app!.root.findByType(AuthLayout).props.onBack();
  });
  expect(app!.root.findAllByType(LoginScreen)).toHaveLength(1);

  await act(() => {
    app!.root.findByType(AuthSwitch).props.onPress();
  });
  expect(app!.root.findAllByType(RegisterScreen)).toHaveLength(1);

  await act(() => {
    app!.root.findByType(AuthLayout).props.onBack();
  });
  expect(app!.root.findAllByType(LoginScreen)).toHaveLength(1);

  await act(() => {
    app!.root.findByType(AuthLayout).props.onBack();
  });
  await act(() => {
    app!.root.findByType(LandingHeader).props.onRegister();
  });
  expect(app!.root.findAllByType(RegisterScreen)).toHaveLength(1);

  await act(() => {
    app!.root.findByType(AuthLayout).props.onBack();
  });
  expect(app!.root.findAllByType(LandingHeader)).toHaveLength(1);

  await act(() => {
    app!.unmount();
  });
  fetchMock.mockRestore();
});

