import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import RegisterForm from '../components/auth/RegisterForm';
import Input from '../components/Ui/Input';
import {
  canRegister,
  getPasswordChecks,
  isValidEmail,
} from '../utils/auth/authValidation';

test('validates sign-up email, password and confirmation as they change', async () => {
  let form: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    form = ReactTestRenderer.create(
      <RegisterForm
        wide={false}
        actions={{
          onVerification: () => {},
          onAuthenticated: () => {},
          onTwoFactor: () => {},
          onForgotPassword: () => {},
        }}
      />,
    );
  });
  const field = (label: string) =>
    form!.root.findAllByType(Input).find(input => input.props.label === label)!;

  await act(() => field('EMAIL ADDRESS').props.onBlur());
  expect(field('EMAIL ADDRESS').props.error).toBe(
    'Enter a valid email address.',
  );
  await act(() =>
    field('EMAIL ADDRESS').props.onChangeText('school@example.com'),
  );
  expect(field('EMAIL ADDRESS').props.error).toBeUndefined();

  await act(() => field('PASSWORD').props.onFocus());
  expect(JSON.stringify(form!.toJSON())).toContain('At least 8 characters');
  await act(() => field('PASSWORD').props.onChangeText('StrongPass1!'));
  expect(JSON.stringify(form!.toJSON())).not.toContain('At least 8 characters');

  await act(() => field('CONFIRM PASSWORD').props.onFocus());
  expect(field('CONFIRM PASSWORD').props.error).toBe('Passwords do not match.');
  await act(() => field('CONFIRM PASSWORD').props.onChangeText('different'));
  expect(field('CONFIRM PASSWORD').props.error).toBe('Passwords do not match.');
  await act(() => field('CONFIRM PASSWORD').props.onChangeText('StrongPass1!'));
  expect(field('CONFIRM PASSWORD').props.error).toBeUndefined();

  expect(isValidEmail('school@example.com')).toBe(true);
  expect(isValidEmail('school@')).toBe(false);
  expect(getPasswordChecks('StrongPass1!').every(check => check.valid)).toBe(
    true,
  );
  expect(
    canRegister('school@example.com', 'StrongPass1!', 'StrongPass1!'),
  ).toBe(true);
  expect(canRegister('school@example.com', 'StrongPass1!', 'different')).toBe(
    false,
  );

  await act(() => form!.unmount());
});

