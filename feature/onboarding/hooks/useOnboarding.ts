import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, User } from '../../auth/apis/authApi';
import { ApiError } from '../../../utils/api/request';
import { getCurrentSessionUser } from '../../../utils/api/session';
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
  getProfile,
  requestSignatoryApproval,
  saveOnboardingAccount,
} from '../apis/profileApi';

export function useOnboarding(
  type: AccountType,
  onExit: () => void,
  onProfileCreated: (type: AccountType) => void,
) {
  const [accountUser, setAccountUser] = useState(getCurrentSessionUser());
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    ...initialData,
    fullName: accountUser?.name || '',
    phone: accountUser?.phone || '',
  });
  const [attempted, setAttempted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [profileCreated, setProfileCreated] = useState(false);
  const [profileMayExist, setProfileMayExist] = useState(false);
  const [signatorySent, setSignatorySent] = useState(false);
  const [sendingSignatory, setSendingSignatory] = useState(false);
  const [signatoryError, setSignatoryError] = useState('');
  const creationRunning = useRef(false);
  const signatoryRunning = useRef(false);
  const steps = type === 'teacher' ? teacherSteps : schoolSteps;
  const needsSignatory = type === 'school' && data.institutionType === 'MAT school';
  const phoneLocked = accountUser?.phoneVerified === true;

  useEffect(() => {
    setStep(1);
    const user = getCurrentSessionUser();
    setAccountUser(user);
    setData({ ...initialData, fullName: user?.name || '', phone: user?.phone || '' });
    setAttempted(false);
    setConfirmOpen(false);
    setCreateError('');
    setProfileCreated(false);
    setProfileMayExist(false);
    setSignatorySent(false);
    setSignatoryError('');
  }, [type]);

  function update(field: string, value: string | boolean) {
    if (field === 'phone' && phoneLocked) return;
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
    if (creating) return;
    setConfirmOpen(false);
  }

  async function sendSignatoryEmail() {
    if (!needsSignatory || signatoryRunning.current || signatorySent) return;
    signatoryRunning.current = true;
    setSendingSignatory(true);
    setSignatoryError('');
    try {
      await requestSignatoryApproval({
        signatoryName: data.signatoryName,
        signatoryEmail: data.signatoryEmail,
        signatoryJobTitle: data.signatoryJobTitle,
      });
      setSignatorySent(true);
    } catch (problem) {
      setSignatoryError(
        problem instanceof Error ? problem.message : 'Unable to send the signatory email.',
      );
    }
    signatoryRunning.current = false;
    setSendingSignatory(false);
  }

  async function createProfile() {
    if (creationRunning.current || profileCreated) return;
    creationRunning.current = true;
    setCreating(true);
    setCreateError('');
    try {
      let alreadyCreated = false;
      if (profileMayExist) {
        // A failed connection can hide a successful creation. Check before retrying.
        try {
          const existing = await getProfile(type);
          alreadyCreated = Boolean(existing?.id);
        } catch (problem) {
          if (!(problem instanceof ApiError) || problem.status !== 404) throw problem;
        }
      }
      const savedUser = alreadyCreated
        ? await getCurrentUser()
        : await saveOnboardingAccount(data);
      if (!alreadyCreated) {
        setProfileMayExist(true);
        await createRoleProfile(type, data);
      }
      setAccountUser(savedUser);
      setProfileCreated(true);
      setConfirmOpen(false);
      await sendSignatoryEmail();
    } catch (problem) {
      setCreateError(
        problem instanceof Error
          ? problem.message
          : 'Unable to create profile.',
      );
    }
    creationRunning.current = false;
    setCreating(false);
  }

  function continueToDocuments() {
    if (!profileCreated || creating || sendingSignatory) return;
    if (needsSignatory && !signatorySent) return;
    onProfileCreated(type);
  }

  function updateVerifiedUser(user: User) {
    setAccountUser(user);
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
    accountUser,
    phoneLocked,
    profileCreated,
    needsSignatory,
    signatorySent,
    sendingSignatory,
    signatoryError,
    continueStep,
    reviewAgain,
    createProfile,
    sendSignatoryEmail,
    continueToDocuments,
    updateVerifiedUser,
    backStep,
    editStep,
  };
}
