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

