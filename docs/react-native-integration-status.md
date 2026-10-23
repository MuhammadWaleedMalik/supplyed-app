# React Native integration status

Updated: 22 October 2026

This tracker covers the current React Native CLI checkout. It distinguishes
source/test evidence from backend and device verification. No live account,
message, invitation, booking, SMS, document, payment, payout, database, or
production mutation was used during this pass. Existing uncommitted work was
preserved.

This pass compared native against the supplied read-only live source checkouts:
backend `e02161b0cac74e39709ea903c3f88499eca892dd` and web
`fb187dc6e783785844df3d9af72a2dcb6daa3aee`. Source parity does not by itself
prove what is deployed, so staging/device checks remain called out separately.

| Feature | Native screen/service | Backend API | Correction and evidence | Status |
| --- | --- | --- | --- | --- |
| Transport and envelopes | `utils/api/request.ts`, `response.ts` | All REST APIs | Joins the `/api` base once; accepts raw or standard `{ success, data }` payloads; preserves status, code, request ID and field errors; supports timeout/external cancellation. Raw/envelope regression tests pass. | **FIXED & TESTED** |
| Session refresh/account boundary | `utils/api/request.ts`, `session.ts` | `POST /auth/refresh` | One in-flight refresh per session, nested/rotated token support, ordered secure persistence, one replay, no logout on network/5xx, logout on rejected refresh/replayed auth failure, and stale-account response guards. Six mocked refresh/session cases pass. | **FIXED & TESTED** |
| Pagination integrity | `utils/api/pagination.ts`, `paginationGuard.ts` | Paginated lists | Stable-ID deduplication, page/total consistency, final-count validation, page/time caps, and session-change rejection. Multi-page/corruption tests pass. | **FIXED & TESTED** |
| Authentication | `feature/auth`, `utils/auth/authValidation.ts` | `/auth/register`, `/login`, email OTP, password reset, 2FA, Google exchange | Email/password bounds, composition only for create/reset, exact six-digit OTPs, challenge bearer tokens, and secure token persistence. Google still requires configured client IDs and device verification. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| UK phone/settings/profile image | `feature/auth/apis/phoneApi.ts`, `feature/dashboard/shared/apis/settingsApi.ts`, `profileImageApi.ts` | `/auth/phone/otp/*`, `/users/me`, role profiles, profile-image signed upload | Canonical UK numbers, verified-phone lock/fresh check, partial-save disclosure, typed numeric/list fields, signed upload then completion. Backend-wide phone immutability is not runtime verified. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Job creation/edit/publication | `jobsApi.ts`, `useSchoolJobs.ts`, job wizard components | `/jobs`, `/jobs/mine`, `/jobs/mine/:id`, `/jobs/accessible/:id` | Draft-first activation retains the created ID; partial PATCHes; subject/skill arrays; UK/DST date and work-unit rules; length limits; explicit listing instants; filled history; accessible booking-linked read. Work-unit/DST tests pass and the live backend source contains the accessible route. | **FIXED & CONTRACT TESTED / DEVICE PENDING** |
| School address job mode | `JobDetailsStep.tsx`, `JobPostingFlow.tsx`, `useSchoolJobs.ts`, `utils/jobs/jobAddress.ts` | `GET /institutions/me`, ordinary job address fields | Loads the current school address, offers school/different modes, never sends a UI-only flag, preserves the alternate address, and retains a saved address if the profile changed. Normalized comparison tests pass. | **FIXED & TESTED (adapter/logic); DEVICE PENDING** |
| Applications/hiring | `applicationsApi.ts`, teacher/school application hooks and screens | `/applications`, `/applications/me`, `/applications/job/:jobId`, `/:id/status`, `/:id/history` | Sends only `jobId` and optional sanitized `coverLetter`; reconciles uncertain creates/status changes; keeps embedded `jobDetails`, school, booking and conversation context; terminal/forward UI flow and paginated history. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Invitations | `invitationsApi.ts`, `InvitationForm.tsx`, `InvitationDetails.tsx` | `/job-invitations*`, `POST /conversations` | Durable account-scoped request UUID/payload, exact retry, frozen terms/deadline decisions, post-success announcement recovery. Announcement now uses the General conversation `{ instructorId }`, so chat failure cannot create a second invitation. | **FIXED / NOT RUNTIME VERIFIED** |
| Bookings/reviews | `bookingsApi.ts`, `reviewsApi.ts`, `PaginatedBookingsScreen.tsx` | `/bookings/me`, `/bookings/:id`, lifecycle routes, `/reviews` | Direct detail independent of list page, server filters, source/application snapshots, job subjects/address, cancel/complete/no-show/review validation, invoice link, accessible job action, and booking-specific message action. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| General/Jobs messaging | `ContactConversation.tsx`, `conversationsApi.ts`, `normalizeConversation.ts`, `utils/messaging/threads.ts` | `/conversations`, `/:id/threads`, `/application/:id`, `/booking/:id`, messages/read/attachments/socket-ticket | Exactly two categories; applications/bookings are Jobs; job summary alone remains General; participant-scoped cursor picker; stable open thread on picker failure; invitation links in General; conversation-scoped drafts and signed attachments retained. REST and socket messages plus conversation pages are normalized to the backend/web booking, participant, nullable-context and date contract before entering state. Live backend routes and schemas are contract tested. | **FIXED & CONTRACT TESTED / DEVICE PENDING** |
| Realtime/foreground | `useConversationSocket.ts`, `useConversation.ts`, `useForegroundRefresh.ts` | `/conversations/socket-ticket`, Socket.IO `/conversations` | Fresh one-use tickets, reconnect invalidation, foreground polling fallback, background suppression, read/typing/read-only handling and uncertain-send review. Native origin/handshake and background behavior need a device plus deployed socket. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Discovery/matching/public profiles | `teachersApi.ts`, `matchingApi.ts`, `publicProfileApi.ts` | `/instructors/directory`, `/instructors/profile/:id`, `/institutions/profile/:id`, `/matching/jobs/*` | Backend filters/paging, privacy-safe booking periods, unavailable-vs-empty schedules, score factors/flags, and array staffing needs. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Profile/dashboard aggregates | dashboard/profile hooks and screens | Existing jobs/applications/bookings/reviews endpoints | Native bounded page aggregation and independent partial-error presentation are present; no web `/api/my-profile/*` route is called as a backend API. Large live datasets and partial backend failures were not exercised. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Dropdowns/rich text | `feature/dropdowns`, `DynamicSelect.tsx`, `ProposalEditor.tsx`, teaching helpers | `/dropdowns*`, `/teaching-catalogue` | Every selector uses live key/value/label options; the typed native catalogue is tested against the complete web union and backend seed catalogue; retired values, retry/error states, Other/custom validation, subject-skill dependency and safe native edit/render are retained. The stale hard-coded waitlist option file was removed. | **FIXED & CONTRACT TESTED / DEVICE PENDING** |
| Onboarding/documents/signatory | onboarding/document features | Role profiles/status, `/document-requirements/profile`, `/documents*`, `/institutions/me/signatory-approval` | Resume/edit protections, live requirements, per-requirement limits, concurrent upload guards, raw signed PUT before completion, missing vs awaiting-review state, MAT signatory fields. Requires staging/device upload and review testing. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Invoices | invoice APIs/cards | `/invoices*` | Planned units stay separate from actual units; decimal/PO/refund validation; participant/admin states and reconciliation; no false paid state before backend sync. | **IMPLEMENTED / NOT RUNTIME VERIFIED** |
| Native payment/payout provider | invoice/payout screens | Invoice payment session, payout account/balance/link/instant payout | Native PaymentSheet now consumes both the returned PaymentIntent and CustomerSession secrets supported by the installed Stripe SDK, preserving saved-method behavior, branded appearance, 3DS return and hosted-invoice fallback. Connect embedded management remains web-only, with the authenticated Stripe dashboard/onboarding link used natively. Instant payout matches the current backend amount-only DTO and is never retried automatically after an uncertain result. | **FIXED & TYPECHECKED / STRIPE DEVICE TEST PENDING** |
| Notifications/deep links | notification API/hooks/store and `notificationNavigation.ts` | `/notifications*` plus socket notification events | Unread/read rollback reconciliation, validated preferences, safe route whitelist, exact `JOB_INVITATION`/`JOB_INVITATION_STATUS` `data.invitationId` preference. Deep-link regression test passes. Native push delivery is not part of the inspected backend. | **FIXED & TESTED (routing); DEVICE PENDING** |
| Public waitlist/theme | landing/waitlist and theme components | `/contact/founding-interest*`, `/dropdowns/themeAccent` | Dynamic options, validation/duplicate feedback/token follow-up, combined accent/urgent preference persistence and native theme controls are represented in the app. Theme derivation is tested byte-for-byte against web; default colors and sans-serif heading treatment match web. | **FIXED & CONTRACT TESTED / DEVICE PENDING** |
| Web/container infrastructure | None | Next.js proxies, Server Actions, CSS/DOM, robots, Docker/health | Not callable or portable native functionality. | **NOT APPLICABLE** |

## Automated and build evidence

- `npm.cmd test`: 24/24 focused tests passed, including direct live-reference
  dropdown/theme/route contract checks.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with no warnings.
- `android/gradlew.bat :app:assembleDebug --offline --console=plain`: passed
  (`BUILD SUCCESSFUL`, 236 tasks; existing Gradle deprecation warnings only).
- `git diff --check`: run at handoff; line-ending warnings are reported
  separately from whitespace errors.

## Runtime blockers and manual acceptance

1. Confirm the deployed API revision matches the supplied backend source. The
   source contains `GET /jobs/accessible/:id`,
   `GET /conversations/:id/threads`, and
   `GET /conversations/booking/:bookingId`, and native contract tests now
   guard those routes.
2. Confirm Socket.IO origin/path/ticket settings with a signed-in Android and
   iOS device, including background/foreground and reconnect catch-up.
3. Exercise PaymentSheet payment, saved payment methods, 3DS return, hosted
   fallback, Connect onboarding/dashboard links and instant-payout
   reconciliation in Stripe test mode. Do not automatically retry an uncertain
   withdrawal because the current backend DTO has no idempotency request ID.
4. Configure Google client IDs and test Google, email/SMS OTP, 2FA, signed
   image/document/chat uploads, review submission, notification links,
   invitation races, hiring conflicts, Stripe test-mode payment/3DS, and payout
   reconciliation with disposable staging accounts.
5. Run the large-text, small-screen, keyboard, screen-reader, safe-area and
   iOS build/device matrix. This Windows pass did not build iOS or exercise a
   physical device/emulator.
