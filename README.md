# SupplyEd React Native app

The Stripe and Twilio integrations use the existing app structure:

1. `constants/endpoints.ts` stores the backend routes.
2. Each feature's `apis` folder contains small functions that call those routes.
3. Hooks manage loading, form values, and errors.
4. Screens and components display the values and call the hook functions.

For example, sending a phone code follows this path:

`PhoneVerificationCard` → `usePhoneVerification` → `phoneApi` → `protectedRequest` → `endpoints.phoneOtpSend`.

The app calls the SupplyEd backend. The backend handles SMS, Stripe accounts,
invoice calculation, and webhooks. Mobile payment screens open Stripe's hosted
pages in the system browser.

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

Phone edits in Settings are drafts until the SMS code is verified. General
settings saves omit the phone. Onboarding preserves an existing verified number
and verifies the saved phone after profile creation. Review submission checks
required uploads and MAT approval separately from phone verification.

Pence amounts use `utils/payments/paymentUtils.ts`; booking rates are already in
pounds. Daily/hourly invoices require worked units. Fixed invoices omit them.
The backend calculates invoice amounts and validates booking eligibility.

Returning from Stripe refreshes backend state. Web return URLs are supported by
manually returning to the app; native universal links require a backend/domain
configuration. A payment becomes paid only when the backend returns `PAID`.

Withdrawal, invoice, and refund buttons prevent repeated requests. An uncertain
mutation result requires checking current backend state before retrying. API
errors retain backend messages and support request IDs. Expired access tokens
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

The palette button on public screens offers Supply blue, Emerald, Violet, Rose,
Amber, and Slate. Signed-in users can change the same palette under Settings >
Theme (including the admin Settings tab). Changes apply immediately throughout
the app without clearing form input. The selection lasts for the current app
session, including login/logout, and resets to Supply blue on a full reload.

Presets and the session store live in `components/Ui/brandTheme.ts`. Use
`useTheme()` for component colors and `createThemedStyles()` from
`components/Ui/theme.ts` for styles that update when the palette changes.

## Check changes

```sh
npx tsc --noEmit
npm run lint
```

The automated test suites and Jest configuration have been removed. TypeScript
and lint checks remain available; verify affected app flows manually after changes.

## Release configuration

Node 22.11 or newer is required. `.env` is optional for local development;
the fallback addresses target the Android emulator and iOS simulator. Process
environment variables override `.env`, and quoted dotenv values are supported.
Only API addresses belong in this generated client configuration.

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

Google and Microsoft authentication are not implemented yet. Email/password,
email verification, password reset and two-factor authentication are the wired
flows. The remember-device choice now controls Keychain persistence through
login challenges and token refresh. Server-side logout/revocation still needs
a documented backend endpoint; local logout clears tokens and Redux state.

Live end-to-end checks need authenticated test accounts, a connected device or
simulator, and working Stripe/Twilio backend configuration. On development
backends without Twilio configured, the SMS code can be logged by the backend
instead of delivered.
