# SupplyED mobile API and user-journey reconciliation

Audit date: 6 November 2026

Sources checked:

- the supplied `SupplyED API and End-to-End User Journey Documentation`;
- the React Native app in this repository;
- the current Next.js web app at
  `C:\Users\Usman Cheema\Desktop\Waleed\SupplyEd\supplyed-web`;
- the current Nest backend at `C:\Users\Usman Cheema\Desktop\Waleed\SupplyEd\supplyed-backend`.

The backend was inspected only. No backend source, database, Stripe account,
object-storage data, email, SMS, or production configuration was changed.

## Important routing rule

The document describes a Next.js web app as well as the SupplyED backend.
Browser routes such as `/api/jobs`, `/api/settings/profile`, and
`/api/onboarding/documents` are web-only proxies. The mobile app must call the
actual backend routes such as `/jobs`, `/users/me`, and `/documents`; it must not
copy the Next.js `/api/*` layer.

## Journey coverage after this change

| Journey area | Mobile status | Main implementation |
| --- | --- | --- |
| Registration, login, refresh, email OTP, password recovery, Google exchange and login 2FA | Integrated | `feature/auth`, `utils/api/request.ts`, secure session storage |
| Phone OTP and account/security settings | Integrated | auth phone API, account settings, 2FA/recovery-code screens |
| Teacher and school profile onboarding | Integrated | onboarding hooks, profile payloads and role APIs |
| Required onboarding documents and presigned uploads | Integrated | `feature/documents`, upload session guards |
| MAT trust signatory approval | Integrated | signatory request/status panel |
| Single-school compliance approval | Added | compliance request/status panel using `/institutions/me/compliance-approval` |
| Required school phase | Added/fixed | distinct `PRIMARY`/`SECONDARY` `schoolType`, separate from `SINGLE_SCHOOL`/`MAT_SCHOOL` `institutionType` |
| Phase-aware subjects and skills | Added/fixed | public and school-scoped teaching-catalogue APIs filter school forms and job forms |
| Profile completion | Added | account History shows backend completion and missing items |
| Reusable certificates/achievements | Added | create, edit, delete, presigned upload/replace, and open from Profile History |
| Profile image | Already integrated | presigned upload and completion API |
| School job create, draft, publish, edit, delete, duplicate, owner detail and history | Reconciled to current web/backend | real `INSTANT`/`BRIEF` job type, date-only assignments, structured shifts/exceptions, payment frequency, period boundary, timezone and worker count |
| Teacher marketplace and recommendations | Integrated | marketplace paging, match score and recommended jobs |
| Teacher availability calendar | Added | recurring weekdays with split slots, time zone, date exceptions and confirmed-work summary |
| Job/offer availability check | Added | job cards and teacher invitation detail call `/availability/jobs/:jobId/check` |
| Applications, history, ranking, shortlist/reject and atomic hire | Reconciled to current web/backend | hire uses `/applications/:id/hire`, supports optional negotiated booking payment terms and displays availability conflicts |
| Invitations and atomic accept/decline/cancel | Reconciled to current web/backend | current non-exclusive targeted-matching rules, invitation list/detail/form; accept returns the booking |
| Conversations, topics, messages, attachments, unread counts and realtime ticket | Integrated | conversation APIs, presigned uploads and socket hook |
| Notifications, read one/all, unread count and preferences | Integrated | notification APIs and navigation mapping |
| Booking list/detail, completion, no-show and cancellation | Integrated | booking screens and role/state guards |
| Attendance activation and shift decisions | Added | school booking management uses supported attendance endpoints |
| Attendance correction and pending-request review | Added for backend-supported actors | correction/review UI is school-side because the current controller authorizes institution/admin only |
| Automatic booking payment periods and reconciliation | Added | booking payment states, attendance-backed totals and `/bookings/:id/payment-sync` |
| Invoices, creation, payment session, sync, send, void and refund | Integrated | native Stripe recovery is offered only when an automatic payment fails; manual creation remains admin-only |
| School payment method and automatic payments | Added | in-app Stripe setup, return reconciliation, enable/disable, replace/remove |
| Optional booking tips | Added | completed-booking tip Checkout, server sync and teacher/school status |
| Teacher payout account, balance and instant payout | Integrated | app-contained hosted Connect page, readiness/balance/payout UI |
| Mutual reviews and public profile reviews | Integrated | booking review actions and profile history |
| Founding interest and dropdown/reference data | Integrated | landing form and dynamic dropdown APIs |

## Changes made in this pass

### School onboarding and teaching data

- Added the backend's new `schoolType` dropdown to the mobile contract.
- Added `schoolType` to onboarding data, validation, review, create payload,
  profile settings, change detection and update payload.
- Renamed the existing `institutionType` field in the UI to “Organisation
  structure” so it is no longer confused with primary/secondary phase.
- Added `/teaching-catalogue?schoolType=...` and
  `/teaching-catalogue/school` clients. School staffing and job subject/skill
  choices are now filtered by the authoritative catalogue.

### Approval and profile completion

- Added single-school compliance approval fetch/request/resend/status handling.
- Preserved the separate MAT trust-signatory flow.
- The profile History status card uses the role profile's supported `status`
  field. The stale `/profile-completion/me` request was removed because the
  current backend has no such controller or response contract.

### Availability and work lifecycle

- Added GET/PUT teacher availability with recurring weekdays, time slots,
  time zone and add/exclude/replace date exceptions.
- Added job conflict checks to marketplace jobs and invitation review.
- Added booking attendance activation, present/absent decisions, corrections,
  and correction-request approval/rejection for the actors supported by the
  current backend.

### Current web parity

- Replaced the legacy description-encoded job mode with the backend's required
  `jobType` contract: `INSTANT` for Targeted matching and `BRIEF` for Open
  applications.
- Changed assignment start/end writes from legacy datetimes to the backend's
  required `YYYY-MM-DD` values.
- Added the web job flow's recurring whole-hour shifts, split shifts, date
  exceptions, payment frequency, payment-period boundary, timezone and worker
  count.
- Added the current web hiring route and optional negotiated booking terms.
  Hiring no longer attempts to set `HIRED` through the ordinary status route.
- Updated invitation eligibility and copy for current non-exclusive targeted
  matching. Existing invitation jobs must be active `INSTANT` roles.
- Updated visible names to the current web terminology: Dashboard, My Jobs,
  Messages, Earnings, Find jobs, Open applications and Targeted matching.
- Added the My Jobs hiring-route filter used by the web app.
- Removed completed-response dropdown caching. Concurrent identical reads may
  share the same in-flight request, but every later read calls the backend.
- Added current school collection/failure/next-attempt details and the expanded
  invoice response fields used by the web billing experience.

### Billing and reusable documents

- Added school Stripe card setup, setup synchronization, automatic-payment
  toggle and payment-method removal.
- Replaced the old school-created booking invoice UI with automatic-payment
  states, booking-level reconciliation and native recovery for failed card
  payments.
- Added optional completed-booking tips with Checkout return reconciliation.
- Kept hosted card setup, tips and Connect payout management inside a reusable
  full-screen app page, with a browser fallback only when Stripe cannot load.
- Added reusable profile document metadata create/update/delete and secure
  upload/replace/open workflows for teacher certificates and school
  achievements.

## Document/backend differences that were not fabricated

| Document item | Current backend evidence | Mobile decision |
| --- | --- | --- |
| Next.js `/api/*` routes | These belong to the web repository, not Nest controllers | Mobile calls backend routes directly |
| Teacher-created attendance correction request | A request DTO/model exists, but no controller route creates one; attendance mutations are institution/admin-only | Mobile exposes only the actions the backend actually authorizes |
| Public compliance/signatory token decision pages | Backend emails web URLs intended for external recipients | Mobile manages the school's request/status; recipient decisions remain on the public web pages |
| Stripe Connect embedded session | Backend returns a web-component session and separate hosted links for mobile clients | React Native uses the hosted link in a full-screen app page; a secure browser fallback appears only if the page cannot load |
| Direct Postcodes.io browser call | The current backend geocoding service performs the authoritative Postcodes.io lookup on profile/job writes | Mobile keeps local format feedback and relies on backend validation/geocoding |

## Verification performed

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed without warnings.
- `npm.cmd test`: 49/49 tests passed, including current web/backend contract checks.
- `git ... diff --check`: passed before the final documentation update.
- `gradlew.bat :app:assembleDebug --offline --console=plain`: passed; debug APK assembled.

## Release checks still required

- Run real school and teacher accounts through email/SMS, Stripe test mode,
  presigned uploads, approval emails and booking attendance in an isolated test
  environment. These calls were not executed against real data.
- Test the Android UI on a phone/emulator, especially long teaching lists,
  availability times, document picking and in-app Stripe return handling.
- Build and test iOS on macOS/Xcode.
- Configure release HTTPS URLs, OAuth identifiers, app links, Stripe return
  URLs, signing keys and service credentials before release.
- Add a backend route first if teacher-created attendance correction requests
  become a required product; then add the corresponding mobile UI.
