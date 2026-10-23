import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../utils/api/session';
import { assertUploadSession } from '../../../utils/api/upload';
import { Linking } from 'react-native';
import {
  getProfile,
  getSignatoryApproval,
  SignatoryApproval,
  submitProfileForReview,
} from '../../onboarding/apis/profileApi';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  getDocumentDownloadUrl,
  getDocuments,
  getRequirements,
  Document,
  Requirement,
} from '../apis/documentApi';
import { uploadDocument } from '../apis/documentUploadApi';
import { requiredDocumentsReady } from '../../../utils/documents/documentUtils';
import {
  pickDocument,
  pickWasCancelled,
} from '../../../utils/documents/pickDocument';

function errorMessage(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to send profile for review.';
}

export function useDocuments(type: AccountType, onReviewStatus: () => void) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIds, setUploadingIds] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, Awaited<ReturnType<typeof pickDocument>>>
  >({});
  const [previewingId, setPreviewingId] = useState('');
  const [needsTrustApproval, setNeedsTrustApproval] = useState(false);
  const [approval, setApproval] = useState<SignatoryApproval | null>(null);
  const [refreshingApproval, setRefreshingApproval] = useState(false);
  const uploading = useRef(new Set<string>());
  const submittingRef = useRef(false);
  const refreshingApprovalRef = useRef(false);
  const previewingRef = useRef(false);
  const mounted = useRef(true);

  function isCurrent(version: number) {
    return mounted.current && version === getSessionVersion();
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setLoaded(false);
    setLoading(true);
    setError('');
    async function load() {
      try {
        const required = await getRequirements();
        assertUploadSession(version);
        const uploaded = await getDocuments();
        assertUploadSession(version);
        const profile = await getProfile(type);
        const isMatSchool =
          type === 'school' && profile.institutionType === 'MAT_SCHOOL';
        if (!active || version !== getSessionVersion()) return;

        setRequirements(required);
        setDocuments(uploaded);
        setNeedsTrustApproval(isMatSchool);

        if (isMatSchool) {
          const latest = await getSignatoryApproval();
          if (!active || version !== getSessionVersion()) return;
          setApproval(latest);
        }

        setLoaded(true);
      } catch (problem) {
        if (!active || version !== getSessionVersion()) return;
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load documents.',
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [type, loadAttempt]);

  function retryLoad() {
    if (loading || uploading.current.size > 0 || submittingRef.current) return;
    setLoadAttempt(current => current + 1);
  }

  async function refreshApprovalStatus() {
    if (!needsTrustApproval || refreshingApprovalRef.current) return;
    refreshingApprovalRef.current = true;
    const version = getSessionVersion();
    setRefreshingApproval(true);
    setError('');
    try {
      const latest = await getSignatoryApproval();
      if (isCurrent(version)) setApproval(latest);
    } catch (problem) {
      if (!isCurrent(version)) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to refresh approval status.',
      );
    } finally {
      refreshingApprovalRef.current = false;
      if (isCurrent(version)) setRefreshingApproval(false);
    }
  }

  async function addDocument(requirement: Requirement, retry = false) {
    if (uploading.current.has(requirement.id) || submittingRef.current) return;
    uploading.current.add(requirement.id);
    setUploadingIds([...uploading.current]);
    const version = getSessionVersion();
    try {
      const selected =
        retry && selectedFiles[requirement.id]
          ? selectedFiles[requirement.id]
          : await pickDocument(requirement);
      if (!isCurrent(version)) return;
      assertUploadSession(version);
      setUploadErrors(current => ({ ...current, [requirement.id]: '' }));
      setSelectedFiles(current => ({ ...current, [requirement.id]: selected }));
      const uploaded = await uploadDocument(
        requirement.id,
        selected.file,
        selected.name,
        selected.mime,
      );
      assertUploadSession(version);
      if (!isCurrent(version)) return;
      setDocuments(current => [
        ...current.filter(item => item.requirementId !== requirement.id),
        { ...uploaded, requirementId: requirement.id },
      ]);
      setSelectedFiles(current => {
        const next = { ...current };
        delete next[requirement.id];
        return next;
      });
    } catch (problem) {
      if (!pickWasCancelled(problem) && isCurrent(version))
        setUploadErrors(current => ({
          ...current,
          [requirement.id]:
            problem instanceof Error
              ? problem.message
              : 'Unable to upload document.',
        }));
    } finally {
      uploading.current.delete(requirement.id);
      if (isCurrent(version)) setUploadingIds([...uploading.current]);
    }
  }

  async function previewDocument(document: Document) {
    if (previewingRef.current) return;
    previewingRef.current = true;
    const version = getSessionVersion();
    setPreviewingId(document.id);
    setError('');
    try {
      const url = await getDocumentDownloadUrl(document.id);
      if (!isCurrent(version)) return;
      await Linking.openURL(url);
    } catch (problem) {
      if (!isCurrent(version)) return;
      setError(
        problem instanceof Error ? problem.message : 'Unable to open document.',
      );
    } finally {
      previewingRef.current = false;
      if (isCurrent(version)) setPreviewingId('');
    }
  }

  async function continueToReviewStatus() {
    if (submittingRef.current || uploading.current.size > 0) return;
    if (!loaded) {
      setError('Document requirements could not be loaded. Try again.');
      return;
    }
    if (
      Object.values(uploadErrors).some(Boolean) ||
      !requiredDocumentsReady(requirements, documents)
    ) {
      setError('Upload or replace the required documents before continuing.');
      return;
    }

    submittingRef.current = true;
    const version = getSessionVersion();
    setSubmitting(true);
    setError('');
    try {
      const latestRequirements = await getRequirements();
      if (!isCurrent(version)) return;
      const latestDocuments = await getDocuments();
      if (!isCurrent(version)) return;
      setRequirements(latestRequirements);
      setDocuments(latestDocuments);
      if (!requiredDocumentsReady(latestRequirements, latestDocuments)) {
        setError(
          'The document requirements have changed. Complete the required uploads before continuing.',
        );
        return;
      }
      if (needsTrustApproval) {
        const latestApproval = await getSignatoryApproval();
        assertUploadSession(version);
        if (!isCurrent(version)) return;
        setApproval(latestApproval);
        if (latestApproval?.status !== 'APPROVED') {
          setSubmitting(false);
          onReviewStatus();
          return;
        }
      }
      await submitProfileForReview(type);
      assertUploadSession(version);
      if (!isCurrent(version)) return;
      setSubmitting(false);
      onReviewStatus();
    } catch (problem) {
      if (!isCurrent(version)) return;
      const message = errorMessage(problem);
      const waitingForSignatory =
        needsTrustApproval &&
        (message.toLowerCase().includes('signatory') ||
          message.toLowerCase().includes('trust'));

      if (isCurrent(version)) setSubmitting(false);
      if (waitingForSignatory) {
        onReviewStatus();
      } else {
        setError(message);
      }
    } finally {
      submittingRef.current = false;
      if (isCurrent(version)) setSubmitting(false);
    }
  }

  return {
    requirements,
    documents,
    error,
    loading,
    submitting,
    uploadingIds,
    uploadErrors,
    previewingId,
    needsTrustApproval,
    approval,
    updateApproval: setApproval,
    refreshingApproval,
    loaded,
    retryLoad,
    refreshApprovalStatus,
    addDocument,
    previewDocument,
    continueToReviewStatus,
    retryDocument: (requirement: Requirement) => addDocument(requirement, true),
  };
}
