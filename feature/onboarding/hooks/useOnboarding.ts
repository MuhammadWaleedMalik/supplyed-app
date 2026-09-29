import { useEffect, useState } from 'react';
import {
  AccountType,
  initialData,
  OnboardingData,
  schoolSteps,
  teacherSteps,
} from '../../../utils/onboarding/onboardingData';
import { canContinue } from '../../../utils/onboarding/onboardingUtils';
import {
  createProfile as createRoleProfile,
  requestSignatoryApproval,
} from '../apis/profileApi';

export function useOnboarding(
  type: AccountType,
  onExit: () => void,
  onProfileCreated: (type: AccountType) => void,
) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [attempted, setAttempted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const steps = type === 'teacher' ? teacherSteps : schoolSteps;

  useEffect(() => {
    setStep(1);
    setData(initialData);
    setAttempted(false);
    setConfirmOpen(false);
    setCreateError('');
  }, [type]);

  function update(field: string, value: string | boolean) {
    setData(current => ({ ...current, [field]: value }));
  }

  function continueStep() {
    setAttempted(true);
    if (!canContinue(type, step, data)) {
      return;
    }
    if (step === steps.length) {
      setConfirmOpen(true);
      return;
    }
    setAttempted(false);
    setStep(step + 1);
  }

  function reviewAgain() {
    setConfirmOpen(false);
  }

  async function createProfile() {
    setCreating(true);
    setCreateError('');
    try {
      await createRoleProfile(type, data);

      if (type === 'school' && data.institutionType === 'MAT school') {
        await requestSignatoryApproval({
          signatoryName: data.signatoryName,
          signatoryEmail: data.signatoryEmail,
          signatoryJobTitle: data.signatoryJobTitle,
        });
      }

      setConfirmOpen(false);
      onProfileCreated(type);
    } catch (problem) {
      setCreateError(
        problem instanceof Error
          ? problem.message
          : 'Unable to create profile.',
      );
    }
    setCreating(false);
  }

  function backStep() {
    if (step === 1) {
      onExit();
    } else {
      setAttempted(false);
      setStep(step - 1);
    }
  }

  function editStep(nextStep: number) {
    setAttempted(false);
    setStep(nextStep);
  }

  return {
    type,
    step,
    steps,
    data,
    update,
    attempted,
    confirmOpen,
    creating,
    createError,
    continueStep,
    reviewAgain,
    createProfile,
    backStep,
    editStep,
  };
}
