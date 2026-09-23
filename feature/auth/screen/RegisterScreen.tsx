import React from 'react';
import AuthLayout from '../../../components/auth/AuthLayout';
import { AuthActions } from '../apis/authApi';

type Props = { onBack: () => void; onLogin: () => void; actions: AuthActions };

export default function RegisterScreen({ onBack, onLogin, actions }: Props) {
  return (
    <AuthLayout register onBack={onBack} onSwitch={onLogin} actions={actions} />
  );
}
