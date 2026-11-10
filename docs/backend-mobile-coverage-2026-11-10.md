# Backend-to-mobile coverage matrix — 10 November 2026

This matrix was reconciled against the read-only backend checkout
`feat/stripe-reflow` at `2803ca1ccb087fe279b0e9f43674680f284a90cb` and the
mobile baseline `73d7a57`. Backend paths below are relative to `/api`.

The backend contains 198 registered HTTP handlers across 30 controller source
files (including the two teaching-catalogue handlers declared in its module
file). Global JWT and role guards apply unless a route is explicitly public or
OTP-token-only. The standard response interceptor normally returns
`{ success, message, data, meta? }`; the mobile response adapter also accepts
raw payloads. Validation uses transformed, whitelisted DTOs and rejects unknown
body fields.

Status meanings:

- **Verified integration** — service, UI consumer, response handling, and focused
  source/contract tests are present. This does not mean a live account was used.
- **Integrated; runtime blocked** — mobile flow is complete, but credentials,
  external services, disposable accounts, or a device are required for E2E.
- **Not applicable to mobile** — admin, infrastructure, webhook, compatibility,
  or email-recipient flow that should not be exposed as a teacher/school action.

## Teacher, school, and public routes

| Backend endpoints | Access and purpose | Mobile service and UI | Paging, search, filters, sorting | Final status |
| --- | --- | --- | --- | --- |
| `POST /auth/register`; `POST /auth/login`; `POST /auth/oauth/google`; `POST /auth/refresh` | Public account creation/login, Google exchange, token rotation | `authApi`, Google adapter, registration/login/session screens; secure keychain and single-flight refresh | N/A | **Verified integration**; Google/device credentials blocked |
| `POST /auth/email/otp/resend`; `POST /auth/email/otp/verify`; `POST /auth/password/forgot`; `POST /auth/password/reset`; `POST /auth/2fa/verify` | Public or purpose-bound OTP challenges | Verification, reset, and 2FA screens | N/A; retry/cooldown errors retained | **Verified integration**; email/SMS delivery runtime blocked |
| `GET /auth/me`; `GET /users/me`; `PATCH /users/me` | Current account/session and self update | Mobile uses `/users/me` as the authoritative account endpoint in auth, settings, and session restoration; `/auth/me` is a redundant authenticated identity view | N/A | `/users/me` **Verified integration**; `/auth/me` **Not applicable (redundant)** |
| `POST /auth/phone/otp/send`; `POST /auth/phone/otp/verify` | Current account UK phone verification | Phone verification card in onboarding, documents, and account settings | N/A; cooldown/field errors shown | **Integrated; runtime blocked** by Twilio/test number |
| `GET /auth/2fa/status`; `POST /auth/2fa/setup`; `POST /auth/2fa/enable`; `POST /auth/2fa/recovery-codes`; `POST /auth/2fa/disable` | Current-account authenticator lifecycle | Security screen and recovery-code card | N/A | **Verified integration**; authenticator device acceptance pending |
| `POST /users/me/profile-image/upload-url`; `POST /users/me/profile-image/upload-complete`; `GET /users/me/profile-image` | Teacher/school signed profile-image upload and read | Profile image API and account/profile settings | N/A; signed upload excludes API bearer token | **Verified integration**; S3 runtime blocked |
| `POST /instructors`; `GET /instructors/me`; `PATCH /instructors/:id`; `PATCH /instructors/me/status`; `GET /instructors/:id` | Teacher onboarding, settings, submission, own private profile | Onboarding, settings, document/review status flow | N/A | **Verified integration**; review transition live test pending |
| `POST /institutions`; `GET /institutions/me`; `PATCH /institutions/:id`; `PATCH /institutions/me/status` | School onboarding, settings, submission | Onboarding, school settings, compliance/signatory/document flow | N/A | **Verified integration**; review transition live test pending |
| `GET /instructors/directory` | Active-school teacher discovery | Teachers screen and `teachersApi`; public profile action | `page`, `limit`, search, subject, skill, key stage, city, distance, availability/match filters supported server-side; loaded pages deduplicated | **Verified integration**; large live dataset pending |
| `GET /instructors/profile/:id`; `GET /institutions/profile/:id` | Role/relationship-governed public profiles | Limited profile modal; teacher certificates and school achievements now mapped and rendered with secure links | N/A | **Integrated and fixed**; signed-document runtime pending |
| `GET /availability/me`; `PUT /availability/me`; `GET /availability/jobs/:jobId/check` | Teacher weekly/date-exception availability and job clash check | Availability settings card, job cards, invitation review | N/A | **Verified integration** |
| `GET /institutions/me/signatory-approval`; `POST /institutions/me/signatory-approval`; `GET /institutions/me/compliance-approval`; `POST /institutions/me/compliance-approval` | School sends and tracks approval requests | Documents/onboarding panels | N/A | **Verified integration**; mail delivery pending |
| `GET /signatory-approvals/token/:token`; `POST /signatory-approvals/token/:token/approve`; `POST /signatory-approvals/token/:token/decline`; `GET /compliance-approvals/token/:token`; `POST /compliance-approvals/token/:token/approve`; `POST /compliance-approvals/token/:token/decline` | One-use public links for external signatory/compliance recipients | Intentionally handled by emailed web links, not an authenticated teacher/school workspace screen | N/A | **Not applicable to mobile (external recipient callback)** |
| `GET /document-requirements/profile` | Current role’s required onboarding documents | Documents screen and readiness checks | Role-filtered server result | **Verified integration** |
| `GET /documents`; `POST /documents`; `PATCH /documents/:id`; `POST /documents/:id/upload-url`; `POST /documents/:id/upload-complete`; `GET /documents/:id/download-url` | Owner compliance-document CRUD/upload/download | Documents screen, document cards, signed raw upload | N/A; duplicate upload/readiness guards | **Verified integration**; S3/review runtime pending |
| `GET /profile-documents`; `POST /profile-documents`; `PATCH /profile-documents/:id`; `DELETE /profile-documents/:id`; `POST /profile-documents/:id/upload-url`; `POST /profile-documents/:id/upload-complete` | Reusable teacher certificates / school achievements | Profile History document manager; results appear on public profiles | Server orders issue date then creation date | **Newly integrated and verified** |
| `GET /dropdowns`; `GET /dropdowns/:name`; `GET /teaching-catalogue`; `GET /teaching-catalogue/school` | Public dynamic options and phase-aware teaching catalogue | Every applicable selector, onboarding, settings, job/invitation forms | Query `schoolType` on public catalogue; school route derives profile phase | **Contract tested** against backend seed catalogue |
| `POST /contact/founding-interest`; `PATCH /contact/founding-interest/:id/details` | Public school/teacher founding waitlist and token detail completion | Landing waitlist modal and follow-up detail service | N/A | **Verified integration** |
| `POST /contact/register-interest` | Legacy simple email-interest endpoint | Superseded by the richer founding-interest contract used by the current landing UI | N/A | **Not applicable (compatibility endpoint)** |
| `GET /jobs`; `GET /jobs/:id` | Public live-job discovery/detail | Teacher jobs, job detail, dashboard recommendations | `page`, `limit`, `search`, `subject`, `keyStage`, `urgent`, `jobType`; pagination resets on filters and deduplicates IDs | **Verified integration** |
| `GET /jobs/institution/:institutionId` | Signed-in users list one school’s public active jobs | School public profile “Active roles” section | Server pagination; total displayed; load-more deduplicates IDs | **Newly integrated and verified** |
| `GET /jobs/mine`; `GET /jobs/mine/:id`; `POST /jobs`; `PATCH /jobs/:id`; `DELETE /jobs/:id` | School-owned draft/publish/edit/delete lifecycle | School jobs/current/history screens and posting wizard | `page`, `limit`, status/search/subject/stage/job-type filters; current/history status streams merged and deduplicated | **Verified integration** |
| `GET /jobs/accessible/:id` | Participant access to historical/locked job context | Booking/application/invitation details | N/A | **Contract tested** |
| `POST /applications`; `GET /applications/me`; `GET /applications/:id`; `GET /applications/:id/history` | Teacher applies and reads own participant data/history | Application wizard, teacher applications, detail timeline | Page/limit/status/job filters; history paginated | **Verified integration** |
| `GET /applications/job/:jobId`; `PATCH /applications/:id/status`; `POST /applications/:id/hire` | Owning school reviews/transitions/hires | School applications list/detail and hiring payment terms | Per-job page/limit/status filters; school jobs merged newest-first with bounded concurrency | **Verified integration**; two-account hire race pending |
| `GET /applications/instructor/:instructorId` | Self/admin compatibility view of one teacher’s applications | Teacher uses the clearer `/applications/me`; admin intentionally excluded | Same paging DTO as `/me` | **Not applicable (redundant self route)** |
| `GET /matching/jobs/recommended`; `GET /matching/jobs/:jobId/score` | Teacher recommendations and score explanation | Recommended jobs and match explanation | Page/limit on recommendations | **Verified integration** |
| `GET /matching/jobs/:jobId/instructors`; `GET /matching/jobs/:jobId/applications` | Owning-school ranked candidates/applicants | Teacher directory/job match mode and ranked applicant panel | Page/limit and directory filters | **Verified integration** |
| `POST /job-invitations`; `GET /job-invitations/me`; `GET /job-invitations/:id`; `POST /job-invitations/:id/accept`; `POST /job-invitations/:id/decline`; `POST /job-invitations/:id/cancel` | School invitation and teacher decision lifecycle | Invitations screen, invitation form/detail, notification/deep-link routing | Page/limit/status/role streams; incremental loading and dedupe | **Verified integration**; live decision/race pending |
| `POST /bookings/direct-hire` | Compatibility alias for invitation creation | Mobile uses canonical `/job-invitations`, which exposes the same workflow and richer ID lifecycle | N/A | **Not applicable (compatibility endpoint)** |
| `GET /bookings/me`; `GET /bookings/:id`; `PATCH /bookings/:id/cancel`; `PATCH /bookings/:id/complete`; `PATCH /bookings/:id/no-show` | Participant booking lifecycle | Bookings screens/cards/detail actions | Page/limit/status/date/invoice filters; first page, load-more, empty/end states | **Verified integration**; destructive lifecycle uses confirmation; live two-party test pending |
| `POST /bookings/:id/attendance/activate`; `PATCH /bookings/:id/attendance/:shiftId`; `PATCH /bookings/:id/attendance/:shiftId/correct`; `PATCH /bookings/:id/attendance/correction-requests/:requestId` | School attendance decisions and corrections | Attendance panel within booking detail | Shift collection is embedded in booking response | **Verified integration**; payroll/Stripe fixture pending |
| `POST /bookings/:id/payment-sync` | Participant refresh/evaluate automatic billing | Booking payment panel | N/A; uncertain manual creation must refresh before retry | **Verified integration** |
| `POST /reviews`; `GET /reviews/instructor/:instructorId`; `GET /reviews/institution/:institutionId` | Booking participant reviews and profile history | Booking completion review action and public/profile review history | Page/limit on review reads | **Verified integration** |
| `GET /conversations`; `POST /conversations`; `GET /conversations/:id`; `GET /conversations/:id/threads`; `GET /conversations/application/:applicationId`; `GET /conversations/booking/:bookingId`; `GET /conversations/unread-count` | Teacher/school inbox, participant context, thread picker, unread count | Messages screen, profile/application/booking/invitation message actions | Inbox page/limit; participant threads use cursor/limit; preserved explicit selection | **Verified integration**; two-account socket acceptance pending |
| `GET /conversations/:id/messages`; `POST /conversations/:id/messages`; `POST /conversations/:id/read`; `POST /conversations/:id/attachments`; `GET /conversations/:id/attachments/:attachmentId/download-url`; `POST /conversations/socket-ticket` | Message pagination, read receipts, signed attachments, one-use socket ticket | Conversation thread/composer, attachment picker, realtime hook | Cursor/limit message loading; ID dedupe and reconnect refresh | **Verified integration**; S3/socket device runtime pending |
| `GET /notifications`; `GET /notifications/unread-count`; `POST /notifications/:id/read`; `POST /notifications/read-all`; `GET /notifications/preferences`; `PATCH /notifications/preferences` | Current-user inbox and preferences | Notifications screen/card, preference settings, safe navigation | Page/limit/read/type filters where supplied; incremental loading | **Verified integration**; native push is not a backend feature |
| `GET /payments/school-billing`; `POST /payments/school-billing/setup-session`; `POST /payments/school-billing/sync`; `PATCH /payments/school-billing`; `DELETE /payments/school-billing/payment-method` | School saved card, consent, automatic-payment settings | School Billing card and hosted Stripe setup | N/A | **Verified integration**; Stripe test mode/device pending |
| `POST /payments/booking-tips/checkout`; `POST /payments/booking-tips/:id/sync` | School optional post-completion tip | Booking tip card and Stripe hosted checkout | N/A; no automatic retry after uncertain mutation | **Verified integration**; Stripe test mode pending |
| `GET /payments/payout-account`; `GET /payments/payout-account/balance`; `POST /payments/payout-account/onboarding-link`; `POST /payments/payout-account/dashboard-link`; `POST /payments/payout-account/instant-payout` | Teacher Connect status, balance, management, withdrawal | Teacher Earnings/Payouts screens | Recent payouts embedded; uncertain withdrawal is not retried automatically | **Verified integration**; Stripe Connect credentials pending |
| `POST /payments/payout-account/session` | Stripe Connect embedded-component client secret | Installed native SDK does not expose the web Connect embedded component used by this contract; native uses authenticated onboarding/dashboard links | N/A | **Not applicable to current native SDK** |
| `POST /invoices`; `GET /invoices/me`; `GET /invoices/:id`; `POST /invoices/:id/payment-session`; `POST /invoices/:id/sync`; `POST /invoices/:id/send` | Participant invoice creation/history/detail/payment/reconciliation | Billing history, PaymentSheet/hosted fallback, resend; completed-booking manual fallback restored when automatic collection is disabled/blocked/review-required | Page/limit/status; total shown; load-more dedupe | **Integrated and fixed**; Stripe test mode pending |

## Admin and infrastructure routes

The following handlers were inventoried but intentionally not added to teacher
or school navigation:

- Users/admin: `POST /users/admin`, `GET /users`, `GET /users/:id`,
  `PATCH /users/admin/:id`, `DELETE /users/admin/:id`,
  `POST /auth/2fa/admin/:userId/disable`.
- Profile/admin: instructor and institution list/admin update/delete routes;
  document type/requirement/review CRUD; document admin download/review/remove;
  signatory admin list/override; founding-interest admin list/status.
- Marketplace/admin: `GET /jobs/admin/all`; mixed-role job write routes remain
  integrated for schools; admin booking list, application moderation, job
  conversation audit, and review deletion are excluded from mobile.
- Payments/admin: invoice all/job/refund/void, instructor payout lookup, and
  booking-tip refund. Existing legacy admin components are not exposed to
  teacher/school roles and were not expanded.
- Infrastructure: `GET /`, `GET /health`, and
  `POST /payments/webhooks/stripe`. Health/root are operational probes; the
  webhook is authenticated by Stripe’s raw-body signature.

## Pagination and query contract notes

- Page-based resources use stable-ID deduplication, stale-session rejection,
  reset on filter changes, explicit loading/error/empty/end states, and totals
  where the backend returns them.
- Conversation messages/participant threads retain backend cursor semantics.
- School-wide applications require bounded per-job fan-out because the backend
  has no aggregate school-applications endpoint. The merged pager is globally
  newest-first and transactional.
- Teacher earnings require bounded invoice-page aggregation because the backend
  has no earnings aggregate endpoint. The UI labels these as gross invoice
  earnings and refuses to present incomplete totals.

## Changes made in this reconciliation

1. Removed the nonexistent `/profile-completion/me` call. Account History now
   displays the authoritative role-profile `status` already returned by the
   supported profile endpoint.
2. Added teacher `certificates` and school `achievements` from public-profile
   responses to the mobile types and public profile UI, with secure-link errors.
3. Added the school public-profile active-roles section using
   `GET /jobs/institution/:institutionId`, including server paging, totals,
   load-more, deduplication, and empty/error states.
4. Restored the school’s supported manual `POST /invoices` fallback for
   completed bookings that automatic collection cannot cover. Validation,
   confirmation, and uncertain-result refresh guards are retained.
5. Added focused regression assertions for all four corrections.

## Verification and blockers

- `npm.cmd test`: 52/52 passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed without warnings/errors.
- `android/gradlew.bat :app:assembleDebug --offline --console=plain`: passed
  (`BUILD SUCCESSFUL`, 236 tasks; Gradle deprecation warnings only).
- Android production Metro bundle: passed; 82 assets copied. Metro retained the
  existing React Native feature-flag export fallback warning.
- No backend files, database rows, emails, SMS messages, invitations, bookings,
  messages, uploads, payments, refunds, or payouts were mutated.
- Live authentication, two-account marketplace flows, S3, Socket.IO, Twilio,
  Google OAuth, Stripe test mode, small/large-text device layout, and iOS build
  remain blocked by test credentials, disposable accounts, services, or macOS.

