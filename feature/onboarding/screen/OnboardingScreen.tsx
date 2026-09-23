import React from 'react';
import { useWindowDimensions } from 'react-native';
import AccountStep from '../../../components/onboarding/AccountStep';
import ComplianceFields from '../../../components/onboarding/ComplianceFields';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import ProfileConfirmation from '../../../components/onboarding/ProfileConfirmation';
import ReviewContent from '../../../components/onboarding/ReviewContent';
import SchoolFields from '../../../components/onboarding/SchoolFields';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { getStepTitle } from '../../../utils/onboarding/onboardingUtils';
import { useOnboarding } from '../hooks/useOnboarding';

type Props = {
  email: string;
  onExit: () => void;
  onProfileCreated: (type: AccountType) => void;
};

export default function OnboardingScreen({
  email,
  onExit,
  onProfileCreated,
}: Props) {
  const form = useOnboarding(onExit, onProfileCreated);
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 700;

  return (
    <>
      <OnboardingLayout
        type={form.type}
        step={form.step}
        steps={form.steps}
        title={getStepTitle(form.type, form.step)}
        email={email}
        onExit={onExit}
        onBack={form.backStep}
        onContinue={form.continueStep}
      >
        {form.step === 1 && (
          <AccountStep
            type={form.type}
            data={form.data}
            attempted={form.attempted}
            wide={wide}
            onSelect={form.setType}
            update={form.update}
          />
        )}
        {form.type === 'school' && form.step === 2 && (
          <SchoolFields
            data={form.data}
            update={form.update}
            attempted={form.attempted}
            wide={wide}
          />
        )}
        {form.type === 'school' && form.step === 3 && (
          <ComplianceFields
            data={form.data}
            update={form.update}
            attempted={form.attempted}
            wide={wide}
          />
        )}
        {form.type && form.step === form.steps.length && (
          <ReviewContent
            type={form.type}
            email={email}
            data={form.data}
            editStep={form.editStep}
          />
        )}
      </OnboardingLayout>
      <ProfileConfirmation
        visible={form.confirmOpen}
        loading={form.creating}
        error={form.createError}
        onReview={form.reviewAgain}
        onCreate={form.createProfile}
      />
    </>
  );
}
