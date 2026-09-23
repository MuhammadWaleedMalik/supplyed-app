import React from 'react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { AuthActions } from '../apis/authApi';

type Props = {
  onBack: () => void;
  onRegister: () => void;
  actions: AuthActions;
};

export default function LoginScreen({ onBack, onRegister, actions }: Props) {
  return (
    <AuthLayout
      register={false}
      onBack={onBack}
      onSwitch={onRegister}
      actions={actions}
    />
  );
}
