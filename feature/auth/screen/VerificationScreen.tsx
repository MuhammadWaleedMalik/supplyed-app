import React from 'react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { AuthActions } from '../apis/authApi';

type Props = {
  email: string;
  token: string;
  onBack: () => void;
  actions: AuthActions;
};

export default function VerificationScreen({
  email,
  token,
  onBack,
  actions,
}: Props) {
  return (
    <AuthLayout
      register={false}
      verify
      email={email}
      token={token}
      onBack={onBack}
      onSwitch={onBack}
      actions={actions}
    />
  );
}

