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
