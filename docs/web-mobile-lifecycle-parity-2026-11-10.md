# Web-to-mobile lifecycle parity audit — 10 November 2026

References were inspected read-only:

- `supplyed-web` route shell, onboarding progress, document handling, job,
  application, invitation, booking, messaging and payment flows.
- Backend profile-access, institution-approval, teacher-document, job-policy,
  application and conversation enforcement.

## Account entry and approval

| Lifecycle rule | Web/backend rule | Mobile result |
| --- | --- | --- |
| Email and phone verification | Both must be verified before a profile is fully verified | Existing authentication/onboarding flow retained. |
| Missing role profile | Redirect to onboarding | `nextAccountScreen` sends the user to onboarding. |
| Missing required uploads | Keep the user in document onboarding | Mobile loads current runtime requirements and current uploads before choosing the next screen. |
| Profile pending/rejected/suspended | Dashboard route is an application-status experience, not an operating workspace | Mobile shows Review Status and only calls `onDashboard` for `ACTIVE`. |
| MAT school approval | Approved trust signatory is required | Mobile checks `/institutions/me/signatory-approval` before dashboard entry and displays its status. |
| Single-school approval | Approved compliance contact is required unless the backend explicitly disables it | Mobile now checks `/institutions/me/compliance-approval` before dashboard entry and displays its status. |
| Admin account | Uses the admin workspace, not school/teacher onboarding | Existing admin routing retained. |

## Marketplace authorization

| Action | Required state and mobile handling |
| --- | --- |
| School posts, invites or hires | Backend requires an active school. Mobile disables/blocks these actions from the live school profile status and still handles `SCHOOL_INACTIVE`. |
| Teacher applies | Backend requires an active teacher and fully verified, unexpired documents. Mobile now performs a fresh requirements/documents check before opening the application flow and again immediately before submission. |
| Teacher messaging | Backend rechecks active profile and verified documents for conversation creation/sending. Mobile preserves backend enforcement and now presents the specific recovery message for `INSTRUCTOR_DOCUMENTS_NOT_VERIFIED`. |
| Job availability | Applications and hires require an active, non-reserved job with unchanged terms. Mobile refreshes unavailable jobs and preserves agreed-term conflict handling. |
| Duplicate application | One teacher/job application; an uncertain POST is reconciled by reading the existing application instead of retrying. |
| Hiring | Backend atomically protects job status, school eligibility, teacher schedule and agreed terms. Mobile uses the dedicated hire endpoint and surfaces conflict-specific messages. |

## Document semantics

Upload readiness and operating eligibility are intentionally different:

- A pending upload is sufficient to submit a profile for admin review.
- It is **not** sufficient for a teacher to apply or message.
- Required documents must exist, be uploaded, be unexpired, and be approved
  whenever review is required.
- An optional document that has been uploaded but is pending, rejected,
  incomplete or expired also blocks teacher marketplace actions until it is
  resolved or removed, matching backend enforcement.

## Existing mature parity retained

- Dynamic backend dropdowns and school-phase teaching catalogue.
- Paginated job, application, booking, invitation, notification, conversation
  and billing histories.
- Explicit invitation decisions and immutable offered-term snapshots.
- Schedule-conflict and booking-overlap handling.
- Attendance, invoice recovery, automatic collection and payout workflows.
- Session-version guards around async writes and uncertain-write reconciliation.
- Role-aware public profiles and protected profile viewing.

## Backend authority

Mobile checks improve guidance and prevent avoidable actions, but they do not
replace backend authorization. Every sensitive action remains subject to the
backend's live transactional checks, preventing a stale client from bypassing
approval, document, scheduling, job-status or payment rules.

## Follow-up responsive and lifecycle checks

Dashboard entry now rechecks account access after returning from profile,
settings or security, and on foreground resume. The blocking check preserves
the mounted dashboard while pending; failure offers retry/logout. Suspension
and deactivation take precedence over missing uploads. Review refreshes read
both current profile and current institution approval.

Teacher document eligibility inspects every relevant undeleted upload, so a
new approved file cannot mask an older pending/rejected/expired one. Deleted,
application-specific and inactive requirements are excluded. Application
errors appear in both job-browsing tabs.

Shared UI fixes cover font-aware stacking, record grids, settings and hiring
tabs, wrapped labels/badges/actions, scrollable keyboard-aware dropdowns and
confirmation sheets, and long text previews with 8,000-character pages.
Oversized HTML uses an explicit paged text fallback rather than parsing an
unbounded document. The text-window regression exercises ten million words;
it is a JavaScript test, not a native rendering/memory benchmark.

Regression coverage includes approval destinations, API failures, document
states, duplicate uploads, calendar weekday constraints, and Unicode-safe
long-text pages. Existing reference checks compare dropdown names and routes
against the local web/backend source.

Limitations: the user chose to continue without device testing after ADB
authorization failed for the installed emulator. No Android screenshot pass,
iOS build, screen-reader pass, or authenticated end-to-end account/payment
journey was completed in this follow-up. These source-level checks do not
certify every component on every phone or prove complete web/mobile parity.

Final verification: TypeScript and ESLint passed without errors or warnings;
all 61 tests passed. Android `assembleRelease -PlocalInstallableRelease=true
--offline --console=plain` succeeded. `apksigner verify --verbose --print-certs`
verified the resulting `app-release.apk` with APK Signature Scheme v2 and the
existing Android Debug certificate. This is the local-install release build.
