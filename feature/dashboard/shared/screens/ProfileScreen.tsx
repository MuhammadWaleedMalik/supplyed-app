import React from 'react';
import ProfileSettingsPage from '../../../../components/dashboard/ProfileSettingsPage';
import { AccountType } from '../../../../utils/onboarding/onboardingData';

type Props = { type: AccountType; onBack: () => void; onVerifyIdentity: () => void };

export default function ProfileScreen({ type, onBack, onVerifyIdentity }: Props) {
  return <ProfileSettingsPage type={type} title="Profile settings" onBack={onBack} onVerifyIdentity={onVerifyIdentity} />;
}
