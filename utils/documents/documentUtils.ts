import {
  Document,
  Requirement,
} from '../../feature/documents/apis/documentApi';

export function findDocument(requirementId: string, documents: Document[]) {
  const matches = documents.filter(
    document => document.requirementId === requirementId,
  );
  matches.sort((a, b) =>
    (b.uploadedAt || '').localeCompare(a.uploadedAt || ''),
  );
  return matches[0];
}

export function documentIsReady(document?: Document) {
  if (!document?.fileKey || !document.uploadedAt) return false;
  return ['PENDING', 'APPROVED', 'NOT_REQUIRED'].includes(
    (document.status || '').toUpperCase(),
  );
}

export function requiredDocumentsReady(
  requirements: Requirement[],
  documents: Document[],
) {
  return requirements.every(requirement => {
    const document = findDocument(requirement.id, documents);
    if (!requirement.isRequired && !document) return true;
    return documentIsReady(document);
  });
}

/** Mirrors the backend gate used before a teacher may apply or message. */
export function requiredDocumentsVerified(
  requirements: Requirement[],
  documents: Document[],
  now = Date.now(),
) {
  function acceptable(requirement: Requirement, document?: Document) {
    if (!document?.fileKey || !document.uploadedAt) return false;
    if (document.documentExpiryDate) {
      const expiry = Date.parse(document.documentExpiryDate);
      if (!Number.isFinite(expiry) || expiry <= now) return false;
    }
    const status = (document.status || '').toUpperCase();
    return requirement.requiresReview
      ? status === 'APPROVED'
      : ['APPROVED', 'NOT_REQUIRED'].includes(status);
  }

  for (const requirement of requirements) {
    if (requirement.isActive === false || requirement.documentType.isActive === false)
      continue;
    if (requirement.context && requirement.context !== 'INSTRUCTOR_PROFILE')
      continue;
    const submitted = documents.filter(document =>
      document.requirementId === requirement.id &&
      !document.deletedAt && !document.applicationId,
    );
    if (requirement.isRequired && !submitted.some(document => acceptable(requirement, document)))
      return false;
    // The backend also blocks an optional upload while it is pending,
    // rejected, incomplete or expired. Removing it restores optionality.
    if (submitted.some(document => !acceptable(requirement, document))) return false;
  }
  return true;
}

export function requiredDocumentCount(
  requirements: Requirement[],
  documents: Document[],
) {
  const required = requirements.filter(item => item.isRequired);
  const ready = required.filter(item =>
    documentIsReady(findDocument(item.id, documents)),
  );
  return { total: required.length, ready: ready.length, remaining: required.length - ready.length };
}

