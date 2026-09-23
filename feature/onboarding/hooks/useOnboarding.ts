import { useState } from 'react';
import {
  AccountType,
  initialData,
  individualSteps,
  OnboardingData,
  schoolSteps,
  teacherSteps,
} from '../../../utils/onboarding/onboardingData';
import { canContinue } from '../../../utils/onboarding/onboardingUtils';
import { createProfile as createRoleProfile } from '../apis/profileApi';

export function useOnboarding(
  onExit: () => void,
  onProfileCreated: (type: AccountType) => void,
) {
  const [type, setType] = useState<AccountType | null>(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [attempted, setAttempted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  let steps = schoolSteps;
  if (type === 'teacher') steps = teacherSteps;
  if (type === 'individual') steps = individualSteps;

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
    if (!type) return;
    setCreating(true);
    setCreateError('');
    try {
      await createRoleProfile(type, data);
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
    setType,
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
