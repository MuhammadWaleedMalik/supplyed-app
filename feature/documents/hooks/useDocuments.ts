import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import {
  getProfile,
  getSignatoryApproval,
  SignatoryApproval,
  submitProfileForReview,
} from '../../onboarding/apis/profileApi';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  getDocumentDownloadUrl, getDocuments, getRequirements,
  Document, Requirement,
} from '../apis/documentApi';
import { uploadDocument } from '../apis/documentUploadApi';
import { requiredDocumentsReady } from '../../../utils/documents/documentUtils';
import { pickDocument, pickWasCancelled } from '../../../utils/documents/pickDocument';

function errorMessage(problem: unknown) {
  return problem instanceof Error ? problem.message : 'Unable to send profile for review.';
}

export function useDocuments(type: AccountType, onReviewStatus: () => void) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState('');
  const [previewingId, setPreviewingId] = useState('');
  const [needsTrustApproval, setNeedsTrustApproval] = useState(false);
  const [approval, setApproval] = useState<SignatoryApproval | null>(null);
  const [refreshingApproval, setRefreshingApproval] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const required = await getRequirements();
        const uploaded = await getDocuments();
        const profile = await getProfile(type);
        const isMatSchool =
          type === 'school' && profile.institutionType === 'MAT_SCHOOL';

        setRequirements(required);
        setDocuments(uploaded);
        setNeedsTrustApproval(isMatSchool);

        if (isMatSchool) {
          setApproval(await getSignatoryApproval());
        }

        setLoaded(true);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : 'Unable to load documents.');
      }
      setLoading(false);
    }
    load();
  }, [type]);

  async function refreshApprovalStatus() {
    if (!needsTrustApproval) return;
    setRefreshingApproval(true);
    setError('');
    try {
      setApproval(await getSignatoryApproval());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to refresh approval status.');
    }
    setRefreshingApproval(false);
  }

  async function addDocument(requirement: Requirement) {
    if (uploadingId) return;
    setUploadingId(requirement.id);
    setError('');
    try {
      const selected = await pickDocument(requirement);
      const uploaded = await uploadDocument(
        requirement.id, selected.file, selected.name, selected.mime,
      );
      setDocuments([
        ...documents.filter(item => item.requirementId !== requirement.id),
        { ...uploaded, requirementId: requirement.id },
      ]);
    } catch (problem) {
      if (!pickWasCancelled(problem))
        setError(problem instanceof Error ? problem.message : 'Unable to upload document.');
    }
    setUploadingId('');
  }

  async function previewDocument(document: Document) {
    setPreviewingId(document.id);
    setError('');
    try {
      const url = await getDocumentDownloadUrl(document.id);
      await Linking.openURL(url);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to open document.');
    }
    setPreviewingId('');
  }

  async function continueToReviewStatus() {
    if (!loaded) {
      setError('Document requirements could not be loaded. Try again.');
      return;
    }
    if (!requiredDocumentsReady(requirements, documents)) {
      setError('Upload or replace the required documents before continuing.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitProfileForReview(type);
      setSubmitting(false);
      onReviewStatus();
    } catch (problem) {
      const message = errorMessage(problem);
      const waitingForSignatory =
        needsTrustApproval &&
        (message.toLowerCase().includes('signatory') ||
          message.toLowerCase().includes('trust'));

      setSubmitting(false);
      if (waitingForSignatory) {
        onReviewStatus();
      } else {
        setError(message);
      }
    }
  }

  return {
    requirements, documents, error, loading, submitting, uploadingId, previewingId,
    needsTrustApproval, approval, refreshingApproval,
    refreshApprovalStatus, addDocument, previewDocument, continueToReviewStatus,
  };
}