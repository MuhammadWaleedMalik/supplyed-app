# Mobile handoff implementation

## 22 October 2026 — UI/UX follow-up

This section supersedes the older UI, editor, messaging, pagination and test
descriptions below. It describes changes in the React Native workspace, not a
claim that every deployed API or every device flow has been verified. Existing
unrelated working-tree changes were preserved. No dependencies were added.
The backend and website checkouts were read as references, not edited.

**Final backend parity blocker:** the backend checkout changed during verification
from the inspected `feat/dropdown` commit
`e02161b0cac74e39709ea903c3f88499eca892dd` to
`feat/trustid-identity-verification` at
`d540a942f85276b6766a6d391297889e70b77ce2`. The latter lacks
`src/modules/dropdowns/dropdown-seed.data.ts`, `GET /jobs/accessible/:id`,
`GET /conversations/:id/threads` and `GET /conversations/booking/:bookingId`.
The final test run therefore has **35 passing / 2 failing** reference-contract
tests, after an earlier 37/37 pass. Tests have not been weakened or skipped to
hide this mismatch. No backend branch switch was performed by this work. Confirm
the intended backend branch before claiming full integration parity or deploying.

### Requested-task checklist

| Task | Implementation and verification status |
| --- | --- |
| 1. Teacher profile details | Shared profile hero, verification, teaching expertise, availability, facts and reviews. Missing/private fields are not fabricated. Implemented; complete device review pending. |
| 2. School-address checkbox | Shared job/invitation form uses school address and preserves the alternate address. Address utilities covered by tests. |
| 3. Strict date ordering | Mobile validation enforces Live < Expiry < Start < End and shows field errors; checked again before submission. Unit tests pass. Backend enforcement is pending the separate patch described below. |
| 4. Automatically updated times | Changed dependent fields receive a brief highlight and accessible explanation; reduced-motion preference respected. Device animation review pending. |
| 5–6. Job/proposal rich editors | Shared editor no longer rewrites live content from delayed parent echoes. Current-content bridge tested for typing, formatting, composition and deletion. Native keyboard/selection smoke test still required. |
| 7. Detail screens | Redesigned applications, application flow, invitations, bookings, conversations and public profiles using shared headers, sections, facts and status badges. Long prose/address/proposal content has a scrollable Read more popup. Implemented; not every screen/device size visually verified. |
| 8. Hire popup | Custom contextual confirmation with loading, duplicate-submit protection and error handling. No live hire performed. |
| 9. Complete booking popup | Custom complete/no-show confirmation. Other invitation, job and invoice actions use the same modal family. No live booking/payment mutations performed. |
| 10. Teacher pagination | Applications, bookings, inbox, conversation picker, messages and invoice history use incremental pages/cursors. Existing job paging retained. Exceptions for auxiliary metadata are documented below. |
| 11. School pagination | Job/application/invitation/booking/inbox/thread/message/invoice lists use incremental loading. School application streams are merged newest-first with bounded concurrency. Metadata limitation remains. |
| 12. Missing job messages | Explicit thread selection is retained, direct-thread data survives inbox refresh, unrelated invitation loading no longer gates the chat, and loading/error/empty states are separate. No authenticated two-account send/receive test performed in this follow-up. |
| 13. Consistent UI | Shared detail headers, confirmations, spacing, badges, previews, empty states and load-more feedback applied across the affected workflows. This is not a claim that every legacy/admin screen was redesigned. |

### Latest requested adjustments

- Landing page: removed the About/Hide about SupplyEd toggle; all About sections
  are rendered immediately. FAQ questions retain their normal accordion behavior.
- Applications: **Applied** is the initial filter for both roles; the invented
  Not rejected option and its handling were removed. User-selected filters remain
  available. Booking defaults are **Confirmed** with latest scheduled work first.
- Booking cards: responsive main/details columns on wider layouts, stacked on
  narrow phones, vertically paginated. Cancelled badge and reason are red.
  Directions are teacher-only. Both application and direct-invitation bookings
  can open their booking conversation.
- Chat: suggestions removed; General/Jobs and job selection moved into a toolbar
  picker that closes after selection. Zero-count categories are disabled. Picker
  rows separate job title, status, unread count, date and selected state.
- Composer remains editable during a send; sending no longer makes the input
  non-editable and dismisses the keyboard. Larger permanent context panels were
  removed from the message area. Native device acceptance is still required.
- Splash: removed the duplicate JavaScript splash and artificial delay. Android
  launch artwork is bounded/centred; iOS artwork uses aspect-fit. Native changes
  need rebuilding/reinstalling, not only Metro refresh.
- Teacher billing: all-time, this-week, this-month and this-year **gross paid
  invoice earnings**, pending payments and invoice pagination. Teacher share is
  used, not the school's fee-inclusive total. Refund/dispute caveats are visible;
  this is not a net bank-payout balance.

### Primary files changed in this follow-up

Paths under each shared directory are grouped here; the entire dirty worktree is
not attributed to this change.

- `components/Ui/`: `Button.tsx`, `Checkbox.tsx`, `DateField.tsx`,
  `WorkDateField.tsx`, `AutoUpdatedField.tsx`, `ProposalEditor.tsx`, `RichText.tsx`,
  `ContentPreview.tsx`, `DetailHeader.tsx`, `RecordLayout.tsx`, `FilterSheet.tsx`,
  `ConfirmDialog.tsx`.
- `components/dashboard/`: `SchoolApplicationDetail.tsx`,
  `ApplicationDetailsStep.tsx`, `ApplicationReviewStep.tsx`, `ApplicationWizard.tsx`,
  `ApplicationTimeline.tsx`, `ApplicationFilterBar.tsx`, `ApplicationStatusField.tsx`,
  `MyApplicationsList.tsx`, `JobDetailsStep.tsx`, `JobRecordDetails.tsx`,
  `JobActions.tsx`, `TeacherJobList.tsx`, `InvitationForm.tsx`,
  `InvitationDetails.tsx`, `BookingRecordCard.tsx`, `BookingFilterBar.tsx`,
  `ContactConversation.tsx`, `ConversationPicker.tsx`, `ConversationThread.tsx`,
  `ConversationDetails.tsx`, `chatStyles.ts`, `NavigationContext.tsx`,
  `ProfileContent.tsx`, `LimitedProfileCard.tsx`, `TeacherProfileSummary.tsx`,
  `EarningsSummaryCard.tsx`, `InvoiceCard.tsx`, `BookingInvoiceCard.tsx`,
  `AdminInvoiceCreate.tsx`, `PayoutBalanceCard.tsx`.
- `feature/dashboard/shared/`: `components/DashboardLayout.tsx`,
  `hooks/usePagedResource.ts`, `hooks/useBookings.ts`, `screens/MessagesScreen.tsx`,
  `screens/InvitationsScreen.tsx`, `screens/PaginatedBookingsScreen.tsx`,
  `screens/BillingScreen.tsx`, `apis/applicationsApi.ts`, `apis/invitationsApi.ts`,
  `apis/invoicesApi.ts`, `apis/publicProfileApi.ts`.
- `feature/dashboard/school/`: `hooks/useSchoolApplications.ts`,
  `hooks/useSchoolJobs.ts`, `screens/SchoolApplicationsScreen.tsx`,
  `screens/SchoolJobsScreen.tsx`, `screens/SchoolDashboard.tsx`.
- `feature/dashboard/teacher/`: `hooks/useTeacherApplications.ts`,
  `hooks/useTeacherJobs.ts`, `screens/TeacherApplicationsScreen.tsx`,
  `screens/TeacherBillingScreen.tsx`, `screens/TeacherDashboard.tsx`.
- `feature/dashboard/admin/screens/AdminPaymentsScreen.tsx`,
  `feature/landing/screen/LandingPage.tsx`, `components/landing/waitlistStyles.ts`.
- `utils/api/mergedPager.ts`, `utils/jobs/workSchedule.ts`,
  `utils/ui/editorContent.ts`, `utils/payments/earnings.ts`,
  `tests/ux-regressions.test.cjs`.
- `App.tsx`, `android/app/src/main/res/drawable/splash_screen.xml`,
  `android/app/src/main/res/values-v31/styles.xml`,
  `ios/supplyed/LaunchScreen.storyboard`; removed the duplicate
  `components/SplashScreen.tsx`.
- `docs/backend-fixes/strict-job-dates.patch` is a proposed backend change, not
  an applied backend modification.

### Root causes addressed

The rich editor mixed live contenteditable state with parent-prop synchronization
and delayed library change callbacks. An older echo could rewrite newer HTML and
reset selection. The editor now seeds content once; input/composition/formatting
observers publish current DOM content without writing it back. Delayed callbacks
request the current content instead of publishing stale HTML. Sanitization stays
at the submission boundary.

The conversation code could prefer a default job thread over an explicitly opened
thread, lose a directly opened thread when replacing the inbox with refreshed
results, and block chat rendering on unrelated invitation requests. Persistent
context controls also squeezed the message viewport when the keyboard opened.
Those code paths were corrected. The yellow empty placeholder was replaced with
distinct neutral empty/loading/error states; real errors remain visible. The
sample Latin job title is user data, not evidence of a localization defect.
These are source-level findings, not proof that every reported missing message
has been reproduced and verified on two live accounts.

### Pagination and integration boundaries

| API area | Before → after | Evidence/status |
| --- | --- | --- |
| Applications: `/applications/me`, `/applications/job/:id`, `/applications/:id` | Whole-history loading → paged lists, direct detail reads, Applied default and newest-first merged school streams | Paging utilities tested; role-based runtime flow unverified |
| Invitations: `/job-invitations/me`, `/:id`, decision endpoints | Whole visible-list history → incremental 20-item pages, direct detail and custom decisions | Implemented; no live invitation/decision sent |
| Bookings and booking chat | Existing paging retained; responsive cards, teacher-only directions, all booking sources can open chat | Contract inspected; lifecycle mutations unverified |
| Inbox, participant threads and messages | Eager history/selection coupling → paged inbox, cursor picker/messages, preserved explicit selection | Adapter/static/unit coverage; authenticated realtime acceptance pending |
| Invoice history and earnings | Page controls → scroll pagination; no earnings summary → complete-history gross teacher totals | Earnings/date/currency/completeness tests pass; live financial actions unverified |
| Dropdowns and theme | Existing backend-backed catalogs preserved | Theme parity passes. Catalog/routes passed against the earlier backend; final checks fail against the changed checkout above. |

Lists retain loaded records, reject stale requests, deduplicate IDs, show retry
and load-more states, and guard repeated end-of-list calls. School application
merge operations commit only after successful reads; initial source fan-out is
capped at four concurrent requests. Filtering scans are bounded so an empty
filtered page does not incorrectly mean the entire history ended.

Remaining read-side scaling limits:

1. School applications still need job metadata and an initial page from each job
   because the backend has no aggregate school-applications endpoint. Existing
   job/invitation creation dropdowns also read job metadata.
2. The legacy Invited badge lookup on teacher job cards still reads invitation
   history; the backend lacks a job-ID batch lookup. Dedicated invitation screens
   are paginated, but not every auxiliary lookup is history-free.
3. The backend has no earnings aggregate endpoint. The summary streams invoice
   pages of 100, separately from the 20-item visible list. It refuses partial or
   inconsistent totals and caps at 100 pages. Very large histories need a server
   summary endpoint. Refund allocations are not exposed, hence the explicit gross
   rather than net earnings label.
4. The previously inspected `feat/dropdown` backend date validator accepts equal
   expiry/start and equal start/end. The staged patch tightens these and updates its old equality tests.
   `git apply --check --ignore-space-change` passed against the supplied backend;
   the patch was NOT applied or executed there. Review compatibility with web
   date-only/legacy jobs before deployment. That validator file is absent in the
   final `feat/trustid-identity-verification` checkout; the patch is not intended
   for that incompatible base.

### Verification for this follow-up

- `npm.cmd test`: earlier **37 passed**, including 13 new UX regression tests;
  final **35 passed / 2 failed** after the external backend checkout changed.
  Both failures are the reference-contract checks detailed above; all 13 new UX
  regression tests pass. The failure is retained as a release blocker.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed after cleanup.
- `android/gradlew.bat :app:assembleDebug --offline --console=plain`: passed.
- `node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --bundle-output android/app/build/ui-validation/index.android.bundle --assets-dest android/app/build/ui-validation/assets --max-workers 2`: passed; 82 assets.
- Targeted `git diff --check`: passed; Git noted expected LF/CRLF conversion.
- Android build retains Gradle deprecation warnings. Metro reports the existing
  React Native feature-flag export fallback warning; neither blocked the build.
- A connected Android screen was inspected read-only during the work. This was
  not a full visual or behavioral acceptance run. No rebuilt APK was installed,
  no account was created, and no message, hire, cancellation, refund or payout was
  submitted by this verification. iOS native/device testing was not available on
  Windows.

### Required manual acceptance

Use authorized disposable school/teacher accounts and Stripe test mode, never
real financial records: verify Applied/Confirmed defaults and changed filters;
several pages of each list; deep links to historical records; school application
review/hire; invitation decisions; booking complete/cancel/no-show; long-content
popups; editor typing/formatting/back-forward navigation; rapid chat sends with
keyboard retained, zero-count tabs, thread switching, attachments and reconnect;
earnings against known invoice fixtures; narrow-screen/large-font layouts; and a
cold native launch on Android/iOS. Prior backend/security/payment rollout gates
in the existing audit still apply.

## Earlier checkpoint — 20 October 2026

This is the earlier handoff checkpoint. The later mobile UI and full-application
audit, current verification results and staged backend corrections are recorded in
[APPLICATION_COMPLETION_AUDIT.md](../APPLICATION_COMPLETION_AUDIT.md).

Implemented in the existing React Native/Redux app, preserving the earlier working-tree changes. No backend database changes or live account mutations were performed.

## Client changes

| Area | Main files | Behavior |
| --- | --- | --- |
| Work units and dates | `utils/jobs/workSchedule.ts`, `feature/dashboard/shared/apis/jobsApi.ts`, `feature/dashboard/school/hooks/useSchoolJobs.ts` | Inclusive daily units; equal daily hourly shifts; bidirectional date/unit edits; integer limits; optional/null semantics; timezone/DST checks; effective saved-date validation for PATCHes. Legacy null units stay blank until a scheduling edit. |
| Job and invitation forms | `components/dashboard/JobDetailsStep.tsx`, `JobRequirementsStep.tsx`, `JobReviewStep.tsx`, `InvitationForm.tsx` | Location → pay basis/amount → work dates → applicable units → listing dates → other role details. Listing errors return to Details. Fixed pay hides units. Invitation response deadlines remain separate. |
| Rich text | `components/Ui/ProposalEditor.tsx`, `utils/ui/editorSelection.ts`, `feature/dashboard/shared/apis/applicationsApi.ts` | Programmatic content synchronization does not focus the editor or restore an old selection. Application limits use sanitized serialized `coverLetter`; empty markup is omitted. |
| Contact inbox | `feature/dashboard/shared/screens/MessagesScreen.tsx`, `components/dashboard/ContactConversation.tsx`, `utils/messaging/threads.ts` | Complete paginated inbox/invitation loading; stable identity grouping; four topic tabs; searchable individual items; newest contextual default; stable selection after refresh; distinct-conversation unread totals. |
| Conversation lifecycle | `utils/messaging/drafts.ts`, `components/dashboard/ConversationThread.tsx`, `feature/dashboard/shared/hooks/useConversation.ts` | Text, attachments, upload/send state and uncertain-send guards survive topic changes. Completions update the original conversation. Account changes clear the store and reject stale completions. Only the active visible conversation is read. |
| Invitation chat context | `components/dashboard/ConversationDetails.tsx`, `utils/navigation/invitationLinks.ts` | Exact invitation snapshots and native View invitation actions. Job, instructor and institution IDs must all match. Invitation contexts explicitly disclose shared job-message history. Historical message references are recognized without rewriting stored messages. |
| Realtime and refresh | `feature/dashboard/shared/hooks/useConversationSocket.ts`, `useForegroundRefresh.ts`, `usePagedResource.ts` | Fresh socket ticket on reconnect; foreground refresh; mutation/notification invalidation; teacher refresh preserves loaded directory pages. |
| Booking privacy and address | `utils/jobs/teacherSchedule.ts`, `components/dashboard/TeacherBookingDates.tsx`, `TeacherProfileSummary.tsx`, `LimitedProfileCard.tsx`, `feature/dashboard/school/screens/TeachersScreen.tsx`, `feature/dashboard/shared/screens/PaginatedBookingsScreen.tsx` | UK booking dates/times only in discovery, with preview expansion and distinct empty/unavailable states. Own bookings include trimmed address/city/county/postcode and an explicit missing-address message. |
| Snapshot propagation | `utils/api/marketplaceResponse.ts`, job/booking/invoice/conversation API types and summaries | Missing planned units normalize to null. Booking/invitation/invoice snapshots are not replaced with live job values. Actual invoice `unitsWorked` remains independent. |
| Settings and phone | `feature/dashboard/shared/apis/settingsApi.ts`, `hooks/useProfileSettings.ts`, account/profile settings components, `feature/auth/apis/phoneApi.ts` | Unverified UK phones save without SMS; verified numbers are disabled. Fresh server state guards replacement and OTP initiation. Field feedback and a visible error summary retain edits. Account/profile writes report partial success. |
| Errors and account boundaries | `utils/api/userFacingError.ts`, `request.ts`, `session.ts` | Friendly errors without diagnostic IDs or raw server internals; diagnostic status/code/reference remain internal. Multi-request job/settings/phone operations check account identity before further writes. |
| Uploads | `utils/api/upload.ts`, document/photo/chat upload adapters | Raw file bytes use the returned supported upload method and required headers. Uploads do not inherit API bearer credentials. |
| Preferences | `components/Ui/brandTheme.ts`, `ThemePicker.tsx`, `components/dashboard/TeacherJobList.tsx` | Saved accent and urgent notices are preserved together; custom colors retain the established contrast derivation. |
| Test cleanup | `package.json`, `package-lock.json`, former `tests/*.test.ts` and `jest.config.js` | Removed project-owned test files, the test script/config and test-only direct dependencies. No replacement test files were added. Lint/type checking/native build tooling remain. |

## Verification

- Final `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed with no errors or warnings; the final upload adapters were also linted after their last edit.
- `git diff --check` passed with Windows carriage returns accounted for.

- Android native debug assembly passed: `android/gradlew.bat :app:assembleDebug --offline --console=plain`.
- Android production Metro bundle passed with cache reset, producing `android/app/build/codex/index.android.bundle` and 83 assets. The final incremental production bundle also passed.
- 95 focused checks passed through temporary inline Node execution, with no test files or live API writes:
  - 62 calendar/unit/DST/listing, identity grouping, invitation-reference, schedule-whitelist, snapshot and error checks.
  - 24 mocked adapter/draft checks for PATCH omission/null/pay-type changes, saved listing instants, normalized phone comparisons, stale verified-phone locks, serialized proposals and account-scoped drafts.
  - 9 account-switch/upload checks proving stale multi-step operations do not write to another account, and signed uploads retain raw bytes/method/headers.
- `adb devices` returned no attached devices. No Android device/emulator interaction was exercised.
- iOS native build and simulator checks were not run; this workspace is on Windows.
- Build tooling reported existing Android Gradle deprecations and a Metro dependency export-resolution warning. Neither prevented the completed Android checks.

## Device and backend acceptance still required

These are unverified live behaviors, not passing device tests:

1. Keyboard focus and rich-text formatting across job/invitation wizard steps, native pickers, large text and narrow screens.
2. Two authenticated test accounts switching topics during slow uploads/sends; read receipts, typing, reconnect tickets and background/resume behavior.
3. Invitation authentication return paths, exact offer review, acceptance races, competing cancellations and stale-offer conflicts.
4. A stale settings screen after phone verification; SMS delivery/cooldowns; partial profile-save failures.
5. Live document replacements/review submission, Google/2FA flows and Stripe test-mode payment reconciliation.

Use authorized development accounts and disposable records. No invitations, hires, reviews, SMS messages or payments were submitted as verification.

## External dependencies

1. The backend operator must deploy `prisma/migrations/20261020000000_job_work_units/migration.sql`, regenerate the Prisma client and build the API. The target database/deployment was not inspected or changed. Do not treat this client implementation as evidence that the migration is deployed.
2. The backend must reject replacement/clearing of verified phone numbers in both user-update and OTP paths, including stale/racing requests. The mobile guards are implemented, but cannot establish global immutability across clients.

Invitation-only independent message histories would require a new backend contract. The implemented client uses the existing job conversation, with separate selectable invitation snapshots.
