import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  getDocumentDownloadUrl, getDocuments, getRequirements,
  Document, Requirement,
} from '../apis/documentApi';
import { uploadDocument } from '../apis/documentUploadApi';
import { requiredDocumentsReady } from '../../../utils/documents/documentUtils';
import { pickDocument, pickWasCancelled } from '../../../utils/documents/pickDocument';

export function useDocuments(type: AccountType, onSubmit: () => void) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [uploadingId, setUploadingId] = useState('');
  const [previewingId, setPreviewingId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const required = await getRequirements(type);
        const uploaded = await getDocuments();
        setRequirements(required);
        setDocuments(uploaded);
        setLoaded(true);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : 'Unable to load documents.');
      }
      setLoading(false);
    }
    load();
  }, [type]);

  async function addDocument(requirement: Requirement) {
    if (uploadingId) return;
    setUploadingId(requirement.id);
    setError('');
    try {
      const selected = await pickDocument(requirement);
      const uploaded = await uploadDocument(
        requirement.id, selected.file, selected.name, selected.mime,
      );
      const updated = [
        ...documents.filter(item => item.requirementId !== requirement.id),
        { ...uploaded, requirementId: requirement.id },
      ];
      setDocuments(updated);
      setUploadingId('');

    } catch (problem) {
      if (!pickWasCancelled(problem))
        setError(problem instanceof Error ? problem.message : 'Unable to upload document.');
      setUploadingId('');
    }
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

  function continueToDashboard() {
    if (!loaded) {
      setError('Document requirements could not be loaded. Try again.');
      return;
    }
    if (!requiredDocumentsReady(requirements, documents)) {
      setError('Upload or replace the required documents before continuing.');
      return;
    }
    onSubmit();
  }

  return {
    requirements, documents, error, loading, uploadingId, previewingId,
    addDocument, previewDocument, continueToDashboard,
  };
}

