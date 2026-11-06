# SupplyEd React Native app

The mobile app keeps the existing folder structure and a simple flow:

1. `constants/endpoints.ts` stores the backend routes.
2. Each feature's `apis` folder contains small functions that call those routes.
3. Hooks manage loading, form values, and errors.
4. Screens and components display the values and call the hook functions.

For example, sending a phone code follows this path:

`PhoneVerificationCard` → `usePhoneVerification` → `phoneApi` → `protectedRequest` → `endpoints.phoneOtpSend`.

The app calls the SupplyEd backend. The backend handles SMS, Stripe accounts,
invoice calculation, and webhooks. Invoice checkout uses native Stripe PaymentSheet;
payout onboarding and supported account-management pages open in the system browser.

## Mobile experience and completion audit

School tabs are Home, Jobs, Teachers, Bookings and Inbox. Teacher tabs are Home,
Jobs, Applications, Bookings and Inbox. The account sheet keeps Profile,
Applications, Invitations, Billing/Earnings, Security and Settings accessible;
schools also have Job history. The bell opens Notifications.

Home focuses on the next booking, pending offers and useful actions. Search results
stay visible while long filters live in Apply/Reset sheets. Dropdowns use searchable
virtualized lists. Invitation flows say **New job** or **Existing job** and review
the full offered terms before sending. Profile and Settings use focused sections
with a persistent Save action.

See [APPLICATION_COMPLETION_AUDIT.md](APPLICATION_COMPLETION_AUDIT.md) for the
screen/API inventory, research, implemented fixes, actual checks and remaining
release gates. Backend security and payout corrections are staged in
`docs/backend-fixes`; they have **not** changed the original backend or real data.
The matching payout mobile upgrade must only be applied after its backend contract.

## Run the app

Install dependencies with `npm install`. Set your backend addresses in the local
`.env` file, including the `/api` prefix:

```env
API_BASE_URL_ANDROID=http://YOUR_COMPUTER_LAN_IP:3003/api
API_BASE_URL_IOS=http://localhost:3003/api
```

For an Android emulator, `http://10.0.2.2:3003/api` usually points to your
computer. A physical phone needs a reachable LAN address. An iPhone needs the
computer's LAN address as well. `localhost` is suitable for the iOS simulator.

```sh
npm run start
npm run android
```

Run these in separate terminals. On macOS, use `npm run ios` for iOS. The scripts
copy the API addresses into `constants/env.ts` before starting the app. Stripe
keys, Twilio credentials, and webhook configuration belong in the backend.

## Where to find the integrations

| Flow                                              | App location                                            | API file                                        |
| ------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| Phone collection                                  | First onboarding step                                   | `feature/onboarding/apis/profileApi.ts`         |
| SMS verification                                  | Created-profile screen, profile/settings, admin account | `feature/auth/apis/phoneApi.ts`                 |
| Payout setup and management                       | Teacher Settings and Billing                            | `feature/dashboard/shared/apis/paymentsApi.ts`  |
| Balance, instant withdrawal, recent payouts       | Teacher Billing                                         | `feature/dashboard/shared/apis/paymentsApi.ts`  |
| Create an invoice                                 | School completed bookings, admin Payments               | `feature/dashboard/shared/apis/invoicesApi.ts`  |
| Invoice lists, payment, PDF, resend               | School Billing and booking invoice cards                | `feature/dashboard/shared/apis/invoicesApi.ts`  |
| Earnings invoices                                 | Teacher Billing                                         | `feature/dashboard/shared/apis/invoicesApi.ts`  |
| Filters, void, full/partial refund, payout lookup | Admin Payments                                          | Invoice and payment API files above             |
| User phone fields and verification filters        | Admin Users                                             | `feature/dashboard/admin/apis/adminUsersApi.ts` |

Admin accounts open the admin workspace after login. Teacher and school accounts
continue through the existing profile, documents, and approval flow.

Unverified phone edits save with Save settings without SMS. Verified numbers are
locked, including a fresh-server-state check before sensitive changes. Verification
is optional. Review submission checks required uploads and MAT approval separately
from phone verification. Backend-wide lock enforcement remains a deployment dependency.

Pence amounts use `utils/payments/paymentUtils.ts`; booking rates are already in
pounds. Daily/hourly invoices require worked units. Fixed invoices omit them.
The backend calculates invoice amounts and validates booking eligibility.

Returning from Stripe refreshes backend state. Web return URLs are supported by
manually returning to the app; native universal links require a backend/domain
configuration. A payment becomes paid only when the backend returns `PAID`.

Withdrawal, invoice, and refund buttons prevent repeated requests. An uncertain
mutation result requires checking current backend state before retrying. API
errors show friendly guidance and retain diagnostic status/codes/request IDs internally. Expired access tokens
share one refresh request; invalid sessions return to login. Access and refresh
tokens are saved in device Keychain/Keystore through `react-native-keychain`.

## Conversations and native Stripe

The existing folders are retained. New conversation REST calls live in
`constants/conversationsApi.ts`, payment session/sync calls in
`constants/paymentSessionsApi.ts`, and route definitions in `constants/endpoints.ts`.
The dashboard hooks, Redux store and components stay in their existing folders.

Messages open by application ID from school applicants, teacher applications and
bookings. The inbox opens existing conversation IDs. A single app-level Socket.IO
connection uses the API origin, `/conversations` namespace and `/api/socket.io`
transport path. Sending, history, uploads and read marking use REST. The backend
proxy must support WebSocket upgrades on that path. Backgrounding disconnects the
socket and stops polling; foregrounding reconciles missed messages.

Invoice checkout uses native Stripe PaymentSheet. The backend supplies the public
key and payment secret; saved cards are not enabled because this backend returns
a web CustomerSession without a customer ID. Native and hosted checkout reconcile
through `POST /invoices/:id/sync`. Cancellation is not payment success. Teacher
setup uses hosted Connect onboarding and refetches readiness after returning.
Accounts without an Express dashboard are directed to manage bank details on the
SupplyEd website; hosted onboarding is not a full bank-management replacement.
Successful PaymentSheet confirmation checks invoice sync up to five times while
the payment screen remains active, stopping on `PAID` or `VOID`.

Rebuild the native app after installing dependencies; Metro reload alone is not
enough for Stripe and Keychain. Android and iOS register the `supplyed` URL scheme
for `supplyed://stripe-redirect`. On macOS, run `bundle exec pod install` inside
`ios` before building. The Podfile retains CocoaPods linking using the installed
Stripe SDK's supported SPM opt-out.

Test with two authorised accounts: application-specific navigation, live text and
attachments, history beyond 30 messages, read/typing indicators, rejection, long
disconnect/reconnect, token expiry and logout. Use Stripe test mode for payment,
cancellation, already-paid conflict and processing states. Never use real charges
to verify the integration.

## Notifications

The dashboard bell opens the notification inbox for teachers and schools. It has
All/Unread filters, pull-to-refresh, more pages, and read-one/read-all actions.
Settings includes optional email switches; in-app notifications stay enabled.

`feature/dashboard/shared/apis/notificationsApi.ts` calls the backend through the
existing authenticated request helper. `useNotifications.ts` loads pages and
handles read actions; `notificationsSlice.ts` keeps the inbox and its separate
unread badge in memory. The existing `useConversationSocket.ts` handles both
messages and notification events, including foreground/reconnect reconciliation.
Logout clears both stores. `utils/navigation/notificationNavigation.ts` maps
allowed internal links to existing screens.

No new packages or notification permissions are needed. This is an in-app inbox
and email preferences integration; native lock-screen push requires future
APNs/FCM support in the backend and app.

## App theme

The palette button on public screens and Settings use the live `themeAccent`
collection. Custom hex colors are also supported. Changes apply immediately and
persist on this device through Keychain/Keystore, including after restarting.
The exact color derivation from the handoff lives in `utils/ui/themeColors.ts`.

Use `useTheme()` for component colors and `createThemedStyles()` from
`components/Ui/theme.ts` for styles that update with the selected color.

## Marketplace handoff (19 October 2026)

- `feature/dropdowns` loads shared public dropdown collections. `DynamicSelect`
  displays their labels and submits their values. Failed loads show Retry;
  the app never seeds or resets backend choices.
- `components/onboarding/TeachingFields.tsx` handles named and custom subjects
  and skills. API helpers produce the separate Other payload arrays. Unrelated
  profile/job updates omit unchanged choices and exact saved timestamps.
- `components/Ui/ProposalEditor.tsx` is shared by job descriptions and application
  proposals. Screens pass `value` and `onChange`. HTML sanitizing, Markdown
  import, and native selection details stay in small shared helpers.
- School jobs have a review step, draft/active editing, listing dates, UK work
  times, close/delete confirmation, and retries against the same created job.
- `feature/dashboard/school/screens/TeachersScreen.tsx` shows teacher discovery
  and server match explanations. Invitation forms support existing and new jobs,
  full terms review, a response timezone, and an optional message/deadline.
- `feature/dashboard/shared/apis/invitationsApi.ts` saves the exact request
  before sending. A failed chat announcement resumes separately. Invitations,
  Invited filters/tags, explicit decisions, and chat review links use the
  invitation endpoints; they do not fabricate applications or bookings.
- `DashboardSummary` loads its focused sections independently. Messages,
  notifications and payout forms remain in their dedicated screens.
  `ProfileHistory` combines saved application titles, timelines, bookings, and
  received/given reviews.
- Document uploads have separate progress/error/retry states for each requirement.
  Required upload confirmations and MAT approval control review submission;
  phone verification remains optional and uses validated UK numbers.

The backend must deploy the subject/staffing and dropdown migrations and its
registered collection seed before these screens can load. This is backend
preparation, not an app startup action. Native iOS dependencies need
`bundle exec pod install` in `ios` on macOS after installing npm packages.

Invitation links use `supplyed://job-invitations/<UUID>`. The app waits through
login/onboarding/approval, opens the offer for review, and requires an explicit
accept/decline action. HTTPS universal/app links still need deployment domain
association files and platform configuration.

## Check changes

```sh
npm run typecheck
npm run lint
```

Project-owned test files, the Jest configuration/script and test-only direct dependencies
were removed per the consolidated handoff. Keep runtime helpers and native assets.
Use lint, type checking, production bundles and the manual acceptance checklist.
On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

The Android debug build and an Android Metro production bundle were checked.
The local backend contains real data; the user chose code/build validation without
phone interaction. Live end-to-end verification still needs isolated test accounts
and a connected phone/emulator. iOS builds must be checked on macOS. Test concurrent
uploads, keyboard/editor selection, phone delivery, invitation conflicts,
Stripe test payments, and full login/onboarding on devices before release.

## Release configuration

Node 22.11 or newer is required. `.env` is optional for local development;
the fallback addresses target the Android emulator and iOS simulator. The local
`.env` takes precedence; process environment variables supply values in CI or
when the local value is missing. Quoted dotenv values are supported.
Only public API addresses and OAuth client IDs belong in generated client configuration.

Before building a release on either platform, set both `API_BASE_URL_ANDROID`
and `API_BASE_URL_IOS` to the deployment's HTTPS API URL, then run:

```sh
npm run sync-env -- --release
```

Release API requests and sockets reject HTTP. Android release manifests also
disable cleartext traffic. Debug builds retain HTTP support for local backends.
Android releases are unsigned until an upload signing configuration is supplied
in CI or Android Studio; they no longer fall back to the public debug keystore.
Never commit signing passwords or private keys. Configure the iOS bundle ID,
team, signing, and privacy disclosures on macOS before distribution.

Google sign-in is wired to the native account chooser and the existing backend
`POST /auth/oauth/google` exchange, including 2FA and profile approval routing.
Set `GOOGLE_WEB_CLIENT_ID` and `GOOGLE_IOS_CLIENT_ID` in `.env`, then run
`npm run sync-env`. The sync script also registers the reversed iOS client-ID
URL scheme. The backend must accept the web client ID as its token audience;
register the Android package/signing fingerprints and iOS bundle ID in the same
Google project. See the [official native Google setup](https://react-native-google-signin.github.io/docs/setting-up/get-config).
The button stays disabled until the public IDs are supplied. No client secret
belongs in the app. Microsoft sign-in has no documented backend contract and
is not shown as a working provider.

Email/password, email verification, password reset and two-factor authentication
retain their existing flows. Invalid OTP input is rejected without silently
truncating a pasted code. Remember-device controls email-login persistence.
Server-side logout/revocation still needs a documented backend endpoint;
local logout clears tokens and Redux state.

Live end-to-end checks need authenticated test accounts, a connected device or
simulator, and working Stripe/Twilio backend configuration. On development
backends without Twilio configured, the SMS code can be logged by the backend
instead of delivered.

## Consolidated handoff implementation (20 October 2026)

- Job creation, editing and invitation jobs share `utils/jobs/workSchedule.ts`:
  inclusive calendar days, equal daily hourly shifts, manual total/end-date sync,
  optional integer hours/days, and UK listing windows. Explicit saved listing
  instants remain unchanged until edited; PATCH omission and null clears differ.
- Details follows location, pay, work dates, planned units, listing dates, then
  role information. Fixed pay has no unit input. Listing validation stays in Details.
- The shared rich editor synchronizes external content without focusing. Proposals
  validate the actual sanitized `coverLetter` string against 2,000 characters.
- Messages group contacts by stable identity, with General/Jobs/Applications/Invitations
  tabs and searchable item selection. Invitation contexts use their frozen offer
  and share their matched job conversation. Drafts, attachments, pending sends and
  uncertain-send guards live outside the thread component and clear on account changes.
- Historical and new invitation paths render as native View invitation links.
  Socket connections obtain a fresh `/conversations/socket-ticket` on reconnect.
  Foreground REST polling remains available when realtime is unavailable.
- Teacher profile/directory schedules explicitly whitelist dates and planned units;
  other schools' nested job details cannot reach the booking-date UI. Missing or
  malformed schedules show unavailable; empty schedules show the actual empty result.
- Booking addresses include address, city, county and postcode. Booking/invoice units
  retain their agreed snapshot; actual invoice `unitsWorked` remains separate.
- Unverified phones save through `/users/me` without SMS. Verified phones are locked
  locally and fresh user state is checked before replacement. Settings show field
  feedback, retain edits on error, and distinguish account/profile partial success.
- API errors retain status/code/reference internally while showing friendly copy.
  Accent changes preserve the locally saved urgent-notice preference.

Implementation and verification details: [docs/mobile-handoff-status.md](docs/mobile-handoff-status.md).

Backend deployment prerequisites remain outside this mobile implementation:

1. Deploy `20261020000000_job_work_units`, regenerate the Prisma client and build
   the API. Deployment/database state was not verified by this mobile change.
2. Enforce verified-phone immutability in the backend user update and OTP flows,
   including stale/racing requests. The prepared account-security patch addresses
   this in an isolated source copy; the original server is unchanged.
3. Review and deploy the other authorization, authentication/logging and payout
   patches described in the completion audit. Payout changes include an additive
   migration and a separate mobile contract upgrade. Passing mocked checks does
   not replace validation with a disposable database and Stripe test mode.

Independent invitation-only message histories would require a different backend
contract; this app deliberately uses the current shared job conversation history.

## P0 marketplace and security implementation — 23 October 2026

This section supersedes the older backend-read-only handoff above for P0-01 through
P0-10. The shared backend source was changed in `../../supplyed-backend` and the
existing mobile files were updated in place. No mobile files, custom hooks,
dependencies, navigation routes or native project structure were added. The
website was not edited; its existing `next-env.d.ts` change was preserved.

### Verification status

“VERIFIED FIXED” below means verified in the local automated checks described here,
not deployed, device-tested, or verified against live external providers.

| Finding | Status | Evidence |
| --- | --- | --- |
| P0-01 Signing secrets | VERIFIED FIXED | Missing/empty/placeholder/reused secrets rejected; built production entry point exits before database connection for invalid secrets. |
| P0-02 Private account access | VERIFIED FIXED | HTTP guard tests: unauthenticated 401, other-account 403 without PII, self `/users/me` and admin reads succeed. Existing separate public instructor/institution DTOs retained. |
| P0-03 Rate limiting | VERIFIED FIXED | Concurrent HTTP requests across two API instances share PostgreSQL limits; spoofed forwarding headers do not change the budget; email-send operations share a budget; expiry resets it. Mobile 429 retry tests pass. |
| P0-04 School eligibility | VERIFIED FIXED | Suspended school jobs disappear from public queries; create/publish/apply/invite/hire fail; confirmed booking remains intact. |
| P0-05 Bookable terms | VERIFIED FIXED | Shared policy unit tests and HTTP publish/hire checks reject incomplete, invalid or past terms. Mobile validation tests cover matching requirements. |
| P0-06 Application consent | VERIFIED FIXED | Application records the offered terms; pay/location edits fail; missing or changed consent blocks hiring. |
| P0-07 Booking contract | VERIFIED FIXED | Booking details keep the agreed description/location/pay even after an out-of-band change to the job. Legacy unknowns stay unknown. |
| P0-08 Safe deletion/closure | VERIFIED FIXED | Only empty never-published drafts delete; closure rejects active applicants, cancels invitations and preserves histories/conversations. |
| P0-09 Exclusive reservation | VERIFIED FIXED | Concurrent invitation/application/hire cases serialize; one pending invitation and one occupied booking are protected by partial unique indexes; reserved applications receive 409. |
| P0-10 Invitation failure | VERIFIED FIXED | Decline/cancel/expiry release eligible jobs; invalid or suspended jobs stay non-public; 105 expiries drain; repeated workers and acceptance/expiry races do not reopen accepted jobs. |

### Actual checks and limits

- Backend: **384 tests passed in 19 suites**, including real PostgreSQL HTTP,
  transaction, concurrency and forward-migration tests. Test authentication uses
  a local identity harness; mail/Google/SMS/Stripe/S3 delivery is not contacted.
  Existing payment, messaging and notification unit/regression tests passed.
- Backend TypeScript, Nest build and lint of **all changed TypeScript files** passed.
  Whole-repository lint remains blocked by **45 pre-existing errors** in five
  unchanged conversation files (formatting and three unsafe test-member accesses).
- Mobile: **43 tests passed**, TypeScript passed, and whole-project ESLint passed.
  Android release-mode Metro JavaScript bundling passed (82 assets), with an
  existing React Native private-export dependency warning. No Android APK build,
  emulator, physical-device, iOS or visual/UI automation test was run.
- Prisma client generation and schema validation passed. All **22 migrations**
  applied successfully to a new disposable PostgreSQL 16 database, including the
  three new migrations below. No existing database was migrated or reset.
- The disposable `supplyed_p0_audit_20261023` container and its own generated test
  data were removed after verification. The existing `supplyed_local_db` container
  was left running. Test-data removal is not reversible; the fixtures recreate it.
- A startup smoke check initially inherited `.env` because Windows PowerShell
  removes empty environment variables. That process briefly connected to the
  existing **local** `localhost:5440/supplyed-local-db` and was stopped. Follow-up
  READ ONLY queries found zero subsequent job changes, invitation changes,
  notification-email activity or message-reminder activity. The corrected check
  set invalid secrets inside Node and an unusable test DB URL; it exited safely
  before Nest/database startup. No production deployment or real-secret edit occurred.

### Current business rules

- A school must be ACTIVE. Profile checks happen again inside the transaction,
  not just in the screen or before a database lock.
- Normal publication is `DRAFT -> ACTIVE`. Sending an invitation is
  `DRAFT/ACTIVE -> RESERVED`; acceptance is `RESERVED -> FILLED` with exactly one
  booking and rejection/history entries for other active applications.
- Decline, school withdrawal or expiry returns a valid reserved job to ACTIVE.
  Scheduled listing windows still apply. Past work/listings become EXPIRED;
  suspended schools or incomplete legacy terms leave a private DRAFT. An already
  CLOSED/SUSPENDED/FILLED job is not reopened by the expiry worker.
- **Withdrawing an invitation may publish its job.** To withdraw the role itself,
  close the job instead; closure cancels its pending invitation.
- Title, description, subjects, skills, experience, key stages, dates, pay, payable
  units, address, postcode, country, coordinates and parking are offer terms.
  Any application/invitation/booking locks material edits, including after that
  activity ends. Create a new job for different terms. Listing state is separate.
- Publication/invitation/apply/hire require title, non-empty role description,
  a subject and key stage, address/city/postcode/country, future start, end on or
  after start, positive pay, and hourly/daily/fixed pay type. Hourly jobs require
  positive whole hours within the work period; daily jobs require positive whole
  days within the inclusive UK calendar-day span; fixed jobs have no hours/days.
  Listing opening must precede work; expiry must follow opening, be in the future,
  and be no later than work start. Drafts may remain incomplete.
- Historical applications with no snapshot have `LEGACY_UNVERIFIED` terms and
  cannot be silently hired. An eligible teacher can explicitly accept a new
  invitation. Rejected applications or previous booking history may require a
  new job, as the existing invitation eligibility rules still apply.
- Historical bookings have `LEGACY_PARTIAL`: known original booking pay/dates/units
  remain available, while unknown original description/location are not guessed
  from the current job. There is no new contract-amendment workflow.

### Changed API contracts

All paths below use the existing `/api` prefix and success/error envelopes.

| Endpoint / operation | Contract change |
| --- | --- |
| `GET /users/me` | Authenticated private account response; mobile current-user reads use this path. |
| `GET /users/:id` | ADMIN only; other authenticated users receive 403. Public profile screens continue using public profile endpoints, not account DTOs. |
| Auth, phone OTP, 2FA, signatory approval, contact/waitlist routes | Shared PostgreSQL rate limits; 429 `RATE_LIMITED`, `Retry-After` header and `retryAfter` seconds. |
| `GET /jobs`, institution job lists, job discovery/detail and recommendations | Exclude inactive schools, reserved jobs, pending invitations, occupied bookings and past starts. Owner/history routes remain accessible under existing authorization. |
| `POST /jobs` | Creates a draft only for an eligible school. Mobile publishes with the existing follow-up PATCH after validation. |
| `PATCH /jobs/:id` | Locked validation/eligibility; material offer edits blocked after activity; protected state transitions; status CLOSED resolves applicants/invitations without deleting history. |
| Job responses / school status counts | Add RESERVED plus `hasBeenPublished`, `canDelete`, `termsLocked`. UI trusts `canDelete`, not DRAFT alone. |
| `DELETE /jobs/:id` | Only unused, never-published drafts. Otherwise 409 `JOB_HISTORY_PROTECTED`. |
| `POST /applications` | Locks/rechecks availability and profiles; saves full `agreedTerms`; reserved jobs return 409 `JOB_RESERVED`. |
| Application reads/status responses | Add nullable `agreedTerms` and `termsStatus: RECORDED / LEGACY_UNVERIFIED`; `jobDetails` is saved terms or null, never a reconstructed live offer. |
| `PATCH /applications/:id/status` with HIRED | Requires matching recorded terms, active profiles, valid public job and no overlapping/occupied booking; rejects competitors atomically. |
| `POST /job-invitations` and `/bookings/direct-hire` alias | Existing request shape (`requestId`, `instructorId`, exactly one of `jobId`/`newJob`, optional message/expiry); now reserves exclusively. Retry the same requestId with the same payload. |
| `/job-invitations/:id/accept`, `/decline`, `/cancel` | Atomic acceptance or release. Existing read/list/status pagination remains; `jobStatus` can be RESERVED. `publishOnDecline` remains for compatibility, but all three failure decisions release eligible reservations. |
| Booking list/detail/accept responses | Add nullable `agreedTerms`, `termsStatus: RECORDED / LEGACY_PARTIAL`; nested `job` uses agreed terms, not mutable current job fields. |

Additional domain errors include 403 `SCHOOL_INACTIVE`, 409 `JOB_UNAVAILABLE`,
`JOB_TERMS_LOCKED`, `JOB_TERMS_CHANGED`, `APPLICATION_TERMS_UNVERIFIED`, and 422
`INVALID_JOB_TERMS` with `fieldErrors`. Existing 400 validation/window errors and
401/403/404 authorization responses remain. Mobile renders friendly messages,
preserves field errors, and does not retry or refresh authentication on 429.
Swagger descriptions, status enums and affected response DTOs were updated.

Rate limits use 15-minute windows: security routes share a 150/IP budget;
registration/resend/forgot-password share 5/IP and 3/normalized-email; other
mutating operations allow 10/IP and 10/email or presented credential; reads allow
60/IP. Bearer, signatory and body-token identities are hashed, never stored as
plaintext counter keys. Expired buckets are cleaned hourly. Database errors fail
closed. Trust forwarding headers only from explicitly configured proxy IP/CIDRs;
the default trusts none. Tune limits only after checking real shared-network usage.

### Database and deployment handoff

New model fields: `JobStatus.RESERVED`, `Job.hasBeenPublished`, nullable JSON
`Application.agreedTerms` and `Booking.agreedTerms`, and `RateLimitBucket`.
The Application-to-Job foreign key now restricts deletion. Partial unique indexes
allow only one PENDING invitation and one CONFIRMED/COMPLETED booking per job.

Migrations, in order:

1. `20261023010000_reserved_status`: additive enum value, committed separately.
2. `20261023020000_marketplace_safety`: preflight checks, snapshots, publication
   marker, restrict FK, unique indexes, existing pending-offer reservation and
   shared rate-limit table. ALL existing jobs are conservatively marked as having
   publication history, including old drafts. Existing snapshots stay null.
3. `20261023030000_reserved_dropdown`: adds Reserved to an existing job-status
   dropdown and bumps its revision without replacing administrator labels. Fresh
   unseeded databases get it through the existing dropdown seed.

Before any staging/production rollout:

1. Back up and inspect the target database. Run these read-only preflight queries:

   ```sql
   SELECT "jobId", COUNT(*) FROM "JobInvitation"
   WHERE status = 'PENDING' GROUP BY "jobId" HAVING COUNT(*) > 1;
   SELECT "jobId", COUNT(*) FROM "Booking"
   WHERE status IN ('CONFIRMED', 'COMPLETED')
   GROUP BY "jobId" HAVING COUNT(*) > 1;
   ```

2. If either returns rows, STOP. The migration deliberately refuses to choose a
   winner, cancel contracts or delete offers. Obtain the school's/business owner's
   explicit reconciliation decision. A previously failed migration also requires
   Prisma migration-history inspection and an approved recovery after confirming
   its transaction rolled back; do not edit applied migration files.
3. Stop old API/worker instances during the coordinated schema/API rollout; do not
   mix old code with the new RESERVED state. Use a maintenance window for index/FK
   locks. Install the existing lockfile dependencies and configure three distinct
   random signing secrets of at least 32 characters plus the real trusted proxy
   IPs. Keep all credentials outside source control. Rotate known compromised or
   placeholder keys; rotation invalidates old sessions/challenges.
4. With the explicitly selected target database, run from the backend:

   ```powershell
   pnpm.cmd exec prisma migrate deploy
   pnpm.cmd exec prisma generate
   pnpm.cmd exec prisma validate
   pnpm.cmd run build
   ```

5. Start the updated API and ensure at least one worker instance has
   `NOTIFICATION_WORKERS_ENABLED` enabled. The invitation worker runs every 30
   seconds, up to 20 batches of 100 jobs per tick, with row locks and idempotent
   decisions. Do not disable all workers and expect reservations to reopen on time.
6. Verify public/owner/teacher reads, private-user access, all three invitation
   failure paths, concurrent hire protection, snapshot history and 429 guidance in
   staging. Update the website against these same contracts before release. Do not
   roll back schema by dropping saved history; use a reviewed forward fix.

No rollout was performed by this implementation. Browser/device flows, live
provider delivery, production proxy configuration, operational rate-limit tuning
and reconciliation of actual legacy conflicts remain deployment checks.

### Changed source files

Backend root: `C:\Users\Usman Cheema\Desktop\Waleed\SupplyEd\supplyed-backend`.

```text
.env.example
prisma/schema.prisma
prisma/migrations/20261023010000_reserved_status/migration.sql
prisma/migrations/20261023020000_marketplace_safety/migration.sql
prisma/migrations/20261023030000_reserved_dropdown/migration.sql
src/app.module.ts
src/main.ts
src/common/filters/api-exception.filter.ts
src/common/guards/rate-limit.guard.ts
src/common/http/response-metadata.ts
src/common/logging/redact-sensitive.ts
src/common/middleware/request-logger.middleware.ts
src/modules/auth/auth-config.ts
src/modules/auth/auth-config.spec.ts
src/modules/auth/auth-token.constants.ts
src/modules/auth/auth.module.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.strategy.ts
src/modules/users/users.controller.ts
src/modules/users/swagger.config.ts
src/modules/jobs/job-policy.ts
src/modules/jobs/job-policy.spec.ts
src/modules/jobs/job-listing-window.ts
src/modules/jobs/job-listing-window.spec.ts
src/modules/jobs/job-status.machine.ts
src/modules/jobs/job-work-units.spec.ts
src/modules/jobs/jobs.module.ts
src/modules/jobs/jobs.repository.ts
src/modules/jobs/jobs.service.ts
src/modules/jobs/swagger.config.ts
src/modules/jobs/dto/job-response.dto.ts
src/modules/jobs/dto/paginated-jobs-response.dto.ts
src/modules/applications/applications.repository.ts
src/modules/applications/swagger.config.ts
src/modules/applications/dto/application-response.dto.ts
src/modules/bookings/bookings.repository.ts
src/modules/bookings/direct-hire.service.ts
src/modules/bookings/hiring-transaction.ts
src/modules/bookings/invitation-availability.spec.ts
src/modules/bookings/job-invitations.controller.ts
src/modules/bookings/swagger.config.ts
src/modules/bookings/dto/booking-response.dto.ts
src/modules/bookings/dto/direct-hire.dto.ts
src/modules/bookings/dto/job-invitation-response.dto.ts
src/modules/dropdowns/dropdown-seed.data.ts
src/modules/teaching-catalogue/teaching-catalogue.spec.ts
src/school-chat-direct-hire.integration.spec.ts
src/security.integration.spec.ts
```

Mobile root: this README's directory. Screens covered: school dashboard/jobs,
teacher jobs/applications, school applicant review, invitation creation/decisions,
shared booking details and shared auth/API errors.

```text
README.md
components/dashboard/BookingRecordCard.tsx
components/dashboard/InvitationDetails.tsx
components/dashboard/InvitationForm.tsx
components/dashboard/JobActions.tsx
components/dashboard/JobDetailsStep.tsx
components/dashboard/MyApplicationsList.tsx
components/dashboard/PostedJobsPanel.tsx
components/dashboard/SchoolApplicationDetail.tsx
constants/endpoints.ts
feature/dashboard/school/hooks/useSchoolApplications.ts
feature/dashboard/school/hooks/useSchoolJobs.ts
feature/dashboard/school/screens/SchoolDashboard.tsx
feature/dashboard/school/screens/SchoolJobsScreen.tsx
feature/dashboard/school/store/schoolSlice.ts
feature/dashboard/shared/apis/applicationsApi.ts
feature/dashboard/shared/apis/bookingsApi.ts
feature/dashboard/shared/apis/jobsApi.ts
feature/dashboard/shared/screens/InvitationsScreen.tsx
feature/dashboard/teacher/apis/teacherDashboardApi.ts
feature/dashboard/teacher/hooks/useTeacherApplications.ts
feature/dashboard/teacher/hooks/useTeacherJobs.ts
tests/request-session.test.cjs
tests/ux-regressions.test.cjs
tests/work-schedule.test.cjs
utils/api/request.ts
utils/api/response.ts
utils/api/userFacingError.ts
utils/jobs/londonTime.ts
utils/jobs/workSchedule.ts
```

No intended native configuration changes: `constants/env.ts` and
`ios/supplyed/Info.plist` may appear dirty due to existing line-ending/index state;
their content diffs were empty and they were not edited for this task.
