# Owner profile submission document guard

Status: staged, not deployed. No real backend files, database records, S3
objects or profile statuses were changed.

## Confirmed gap and existing policy

The teacher and school `updateOwnStatus` service methods allow an eligible
owner to submit a profile as PENDING without checking document uploads.
The website and mobile check documents before calling this endpoint, so a
direct API request can bypass that check.

The website's existing policy is explicit:

- `features/onboarding/document-utils.ts`, `missingRequiredDocuments`:
  required documents and optional documents already marked REJECTED or
  REQUIRES_INFO must be ready before submission.
- The same file's `isDocumentReadyForReview`: an uploaded file with status
  PENDING, APPROVED or NOT_REQUIRED is ready. Submission does not require
  prior admin approval.
- `features/onboarding/documents.ts`, `getDocumentSnapshots`: the newest
  uploaded file wins when a requirement has duplicate records. Its
  `listProfileDocuments` excludes application documents and deleted records.
- Backend `document-requirements.repository.ts`, `findActiveByContexts`:
  only requirements and document types that are active belong to the
  caller's profile requirement list.
- `DocumentRequirement` has a unique document-type/context pair. No schema
  change or invented mandatory document list is necessary.

The patch follows these rules. It also requires the uploaded file key to
exist, consistent with the backend upload-complete operation. It does not
add an expiry policy: neither website readiness helper enforces expiry.

## Staged implementation

`profile-document-submission.patch` changes five files:

- New `src/common/profile/profile-submission-documents.ts`
- `src/modules/instructors/instructors.service.ts`
- `src/modules/instructors/instructors.repository.ts`
- `src/modules/institutions/institutions.service.ts`
- `src/modules/institutions/institutions.repository.ts`

Owner service methods pass the owner user ID to the existing repository status
update. In the same transaction, the repository checks current active
requirements for the relevant profile context, using the newest uploaded,
non-deleted, non-application document owned by that user. Missing/rejected
requirements produce a 400 with document names before any status update.
The status update itself also includes the owner ID predicate.

Administrative calls omit that optional argument and keep their current
behavior. School trust-signatory checks remain unchanged. There are no
controller, schema, migration, client API or module dependency changes.

`profile-document-submission-source-map.json` records SHA-256 before/after
hashes of UTF-8 source with LF-normalized line endings. On CRLF checkouts use
`git apply --ignore-space-change --check` before applying in an isolated
checkout. Full staged source is also available in the audit build workspace.

## Verification and limits

Twenty-three inline mocked assertions passed:

- Required file missing, file key missing, REJECTED and REQUIRES_INFO reject.
- Uploaded PENDING, APPROVED and NOT_REQUIRED accept.
- An absent optional document accepts; rejected/info-required optional files reject.
- Query scope restricts owner, profile context, active requirements/types,
  non-deleted non-application files and newest upload.
- Both repositories stop before status mutation on missing files.
- Both owner service methods enable the check.
- Both admin repository paths skip the owner submission guard.

The combined isolated backend compile is recorded by the main audit. No real
profile was submitted and no real database transaction was executed. Before
deployment, exercise actual PostgreSQL relation ordering and transaction
behavior in a disposable database, including duplicate documents and concurrent
review/upload. The patch checks readiness at submission; later admin document
review may legitimately change document status.
