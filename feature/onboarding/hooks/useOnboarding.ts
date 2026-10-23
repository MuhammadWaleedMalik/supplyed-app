import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, User } from '../../auth/apis/authApi';
import { ApiError } from '../../../utils/api/request';
import {
  getCurrentSessionUser,
  getSessionVersion,
  assertSessionVersion,
} from '../../../utils/api/session';
import {
  AccountType,
  initialData,
  OnboardingData,
  schoolSteps,
  teacherSteps,
} from '../../../utils/onboarding/onboardingData';
import { onboardingErrors } from '../../../utils/onboarding/onboardingUtils';
import { profilePayload } from '../../../utils/onboarding/profilePayload';
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
  const mounted = useRef(true);
  const steps = type === 'teacher' ? teacherSteps : schoolSteps;
  const needsSignatory =
    type === 'school' && data.institutionType === 'MAT_SCHOOL';
  const phoneLocked = accountUser?.phoneVerified === true;
  const validationErrors = attempted
    ? onboardingErrors(type, step, data, accountUser?.email)
    : [];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setStep(1);
    const user = getCurrentSessionUser();
    setAccountUser(user);
    setData({
      ...initialData,
      fullName: user?.name || '',
      phone: user?.phone || '',
    });
    setAttempted(false);
    setConfirmOpen(false);
    setCreateError('');
    setProfileCreated(false);
    setProfileMayExist(false);
    setSignatorySent(false);
    setSignatoryError('');
  }, [type]);

  function update(field: string, value: string | boolean) {
    if (creationRunning.current) return;
    if (field === 'phone' && phoneLocked) return;
    setData(current => ({ ...current, [field]: value }));
  }

  function continueStep() {
    setAttempted(true);
    if (onboardingErrors(type, step, data, accountUser?.email).length) {
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
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    setSendingSignatory(true);
    setSignatoryError('');
    try {
      await requestSignatoryApproval({
        signatoryName: data.signatoryName,
        signatoryEmail: data.signatoryEmail,
        signatoryJobTitle: data.signatoryJobTitle,
      });
      if (active()) setSignatorySent(true);
    } catch (problem) {
      if (!active()) return;
      setSignatoryError(
        problem instanceof Error
          ? problem.message
          : 'Unable to send the signatory email.',
      );
    } finally {
      signatoryRunning.current = false;
      if (active()) setSendingSignatory(false);
    }
  }

  async function createProfile() {
    if (creationRunning.current || profileCreated) return;
    const problems = onboardingErrors(
      type,
      steps.length,
      data,
      accountUser?.email,
    );
    if (problems.length) {
      setCreateError(problems.join('\n'));
      return;
    }
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    creationRunning.current = true;
    setCreating(true);
    setCreateError('');
    try {
      // Validate numeric profile fields before changing the account owner record.
      await profilePayload(type, data);
      assertSessionVersion(version);
      if (!active()) return;
      let alreadyCreated = false;
      if (profileMayExist) {
        // A failed connection can hide a successful creation. Check before retrying.
        try {
          const existing = await getProfile(type);
          assertSessionVersion(version);
          if (!active()) return;
          alreadyCreated = Boolean(existing?.id);
        } catch (problem) {
          if (!(problem instanceof ApiError) || problem.status !== 404)
            throw problem;
        }
      }
      const savedUser = alreadyCreated
        ? await getCurrentUser()
        : await saveOnboardingAccount(data);
      assertSessionVersion(version);
      if (!active()) return;
      if (!alreadyCreated) {
        setProfileMayExist(true);
        await createRoleProfile(type, data);
        assertSessionVersion(version);
        if (!active()) return;
      }
      setAccountUser(savedUser);
      setProfileCreated(true);
      setConfirmOpen(false);
      await sendSignatoryEmail();
    } catch (problem) {
      if (!active()) return;
      setCreateError(
        problem instanceof Error
          ? problem.message
          : 'Unable to create profile.',
      );
    } finally {
      creationRunning.current = false;
      if (active()) setCreating(false);
    }
  }

  function continueToDocuments() {
    if (!profileCreated || creating || sendingSignatory) return;
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
    validationErrors,
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
