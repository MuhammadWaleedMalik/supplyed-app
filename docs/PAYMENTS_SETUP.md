# SupplyED mobile payments

The app implements the supplied website payment business flow using hosted Stripe
pages: school card setup and consent, invoice payment and failed-payment recovery,
teacher onboarding/balances/withdrawals, and completed-booking tips. These are
system-browser flows. Native PaymentSheet and embedded Connect parity are not
implemented.

The nearby `../../supplyed-backend` checkout is older than the supplied reference:
its payments controller lacks the school-billing and booking-tip APIs entirely.
Those mobile screens need the current backend contract deployed before they can
work against that server. This change does not modify that repository, deploy a
backend, configure Stripe, or migrate a database.

## Run configuration

Keep public values in the mobile `.env`, then run `npm run sync-env`:

```dotenv
API_BASE_URL_ANDROID=http://10.0.2.2:3003/api
API_BASE_URL_IOS=http://localhost:3003/api
PAYMENT_WEB_ORIGIN=https://supplyed.vercel.app
```

Android emulator uses `10.0.2.2`; physical devices need the backend computer's
reachable LAN address. `localhost` works for an iOS simulator on the backend Mac.
Release API URLs must use HTTPS; validate with `npm run sync-env -- --release`.
`PAYMENT_WEB_ORIGIN` is a public, exact HTTPS origin used to validate callbacks;
the default above does not demonstrate that a mobile return bridge is deployed.
No Stripe secret or webhook signing key belongs in mobile configuration.

Implementation references: [Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding)
and [React Native incoming links](https://reactnative.dev/docs/linking).

Run Metro and the native app in separate terminals with `npm start` and
`npm run android`, or `npm run ios` on macOS. On Windows use `npm.cmd` if
PowerShell blocks `npm.ps1`. After native dependency changes, rebuild; iOS also
requires `bundle exec pod install` in `ios` on macOS.

## Backend contract used by the app

Paths below are relative to the configured `/api` base. Calls use the existing
Bearer-token transport, unwrap `data`, and share the existing token refresh.

| Flow | Requests |
| --- | --- |
| School billing | `GET /payments/school-billing` |
| Save/replace card | `POST /payments/school-billing/setup-session` with `{consentToTerms:true}`, then `POST /payments/school-billing/sync` with `{sessionId}` |
| Enable/disable automation | `PATCH /payments/school-billing` with `{automaticPaymentsEnabled}`; enabling also sends explicit `consentToTerms:true` |
| Remove saved method | `DELETE /payments/school-billing/payment-method` |
| Invoice history/detail | `GET /invoices/me?page=1&limit=20&status=OPEN`, `GET /invoices/:id` |
| Invoice reconciliation | `POST /invoices/:id/sync`, then open its validated `hostedInvoiceUrl` if eligible |
| Failed automatic recovery | `POST /invoices/:id/payment-session` checks backend eligibility and enables card recovery for legacy failed methods; its web secrets are never passed to native PaymentSheet or stored |
| Booking payment state | `POST /bookings/:id/payment-sync` |
| Teacher account/setup | `GET /payments/payout-account`, `POST /payments/payout-account/onboarding-link` |
| Balance/history/withdrawal | `GET /payments/payout-account/balance`, `POST /payments/payout-account/instant-payout` with `{}` for the full instant balance or `{amountPence}` |
| Tips | `POST /payments/booking-tips/checkout` with `{bookingId,amountPence}`, then `POST /payments/booking-tips/:tipId/sync` with `{sessionId}` |
| Invoice management | Existing `POST /invoices`, `POST /invoices/:id/send`; admin-only void/refund and instructor payout lookup remain available |

The backend owns amounts, fees, attendance periods, automatic collection, ownership
checks and Stripe idempotency. The app sends integer pence for tips/withdrawals;
invoice `rateAmount` is already pounds. No fee percentage is invented in mobile.
Scheduled/processing automatic invoices cannot be paid manually. Only authoritative
`PAID` marks collection complete; a collected invoice and a teacher's bank payout
have separate statuses. `PROCESSING`, refunds and disputes retain their own state.

The deployed backend must have the handoff's payment migrations, approved fee and
terms version, deliberate automatic-billing/worker settings, matching Stripe test
keys and signed webhook destinations at `POST /api/payments/webhooks/stripe`.
Relevant server-only settings include `STRIPE_SECRET_KEY`,
`STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_CONNECT_WEBHOOK_SECRET`, `FRONTEND_URL`, `PROCESSING_FEE_PERCENT`,
`AUTOMATIC_BILLING_TERMS_VERSION`, `AUTOMATIC_BILLING_ENABLED` and
`NOTIFICATION_WORKERS_ENABLED`. Use the backend's deployment procedure and existing
business values. `STRIPE_TEACHER_DASHBOARD=none` does not provide an Express
dashboard; the app requests fresh onboarding links instead. Hosted onboarding
does not replace every embedded bank-management component.
The mobile payout screen also links to the website's Billing page for bank changes
that are unavailable in hosted setup; website authentication is separate.

## Browser return and recovery

`utils/payments/pendingFlows.ts` stores only user-scoped operation references in
Keychain/Keystore before opening Stripe. URLs, client secrets and card details
are excluded. `flowCoordinator.ts` serializes checks for each flow and prevents
overlapping preparation for a resource. App-level recovery runs on login/session
restoration, foreground and supported links; screens also expose status checks.
Unresolved references survive navigation/process death and remain isolated from
other accounts. A return URL never establishes success. A lost response never
automatically replays a withdrawal, refund or setup creation.

The supplied backend can return `READY` for the previously saved card while a
replacement Checkout is incomplete. Replacement recovery references are retained
through their provider expiry and synchronized on returns, rather than treating
that existing card as proof the replacement finished. A per-session completion
field from the backend would allow clearing these references sooner. Starting a
fresh setup is an explicit, consented action and supersedes the earlier link.

The app accepts the custom return route:

```text
supplyed://payments/return?flow=school-card&result=success&session_id=SESSION_ID
```

Supported `flow` values are `school-card`, `invoice`, `tip`, and
`teacher-onboarding`; `result` is `success`, `cancelled`, `return`, or `refresh`.
Invoice returns require `invoice_id`; tip returns require `tip_id` and successful
tip/card returns require `session_id`. Duplicate/unknown query keys, credentials,
fragments and unrelated origins are rejected. IDs still require authenticated
backend ownership checks.

The planned HTTPS route is
`${PAYMENT_WEB_ORIGIN}/mobile/payments/return` with the same query contract.
Its browser fallback/bridge is not deployed by this mobile change, backend
sessions do not yet opt into mobile return URLs, and verified HTTPS app/universal
links are not configured. Until those external pieces exist, users manually
return to the app; foreground recovery and explicit status checks work without
an automatic redirect.

Android currently uses `applicationId "com.supplyed"` and registers the payment
custom-scheme intent. iOS already registers `supplyed`; its bundle ID is still
`org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)`. Choose actual
shipping identifiers/signing credentials before creating domain association
files. No team ID, certificate fingerprint or owned domain is fabricated here.

## Verify in Stripe test mode

Run `npm test`, `npm run typecheck` and `npm run lint` for automated checks.
Mocked checks do not prove provider configuration, device linking or bank arrival.
Use isolated school, teacher and admin identities with the compatible backend:

1. Save/replace a card with explicit consent; test cancellation, expired setup,
   enable/disable/remove and delayed Stripe reconciliation.
2. Pay a manual invoice, recover a declined/authentication-required automatic
   invoice, and verify scheduled/processing invoices offer no manual payment.
   Test payment elsewhere, missing payment links and a missed webhook.
3. Close/restart the app during checkout; return manually and through a supported
   custom link, repeat the link, expire access tokens and switch accounts.
   Confirm pending flows cannot resolve under another user.
4. Leave onboarding unfinished, finish it, refresh readiness/balances, then test
   unavailable and eligible instant withdrawals. A lost response requires fresh
   balance/history review before another confirmed request.
5. Tip a completed booking: review the backend amount/fee/total, cancel/resume,
   observe processing/paid, and verify failed/refunded/disputed display states.
6. Verify invoice PDF, school resend, admin partial/full refund and void;
   confirm teacher earnings exclude the school fee and never imply bank arrival.

Do not use live charges, payouts or refunds as tests. Native iOS builds/device flows,
Stripe dashboard/webhook configuration, compatible backend deployment and the
HTTPS return bridge remain release verification work.

## Validation completed

- `npm test`: 154 passing tests, including payment recovery, callback/account
  races, school setup recovery, invoice eligibility and payout lifecycle checks.
- `npm run typecheck` and `npm run lint`: passed.
- Android `:app:assembleDebug`: passed. The debug APK uses Metro for JavaScript.
- Metro production JavaScript bundles for Android and iOS: passed. Bundling found
  a missing `app.json`; it was restored with the existing native registered name,
  `supplyed`.
- No device/emulator was connected. Stripe test-mode provider journeys and native
  iOS compilation have not been verified on a device.

## Changed file inventory

App/configuration: `.env.example`, `App.tsx`, `app.json`,
`android/app/src/main/AndroidManifest.xml`, `constants/env.ts`,
`constants/payments.ts`, `scripts/syncEnv.js`.

Payment screens/components: `components/dashboard/BookingInvoiceCard.tsx`,
`components/dashboard/BookingTipCard.tsx`, `components/dashboard/InvoiceCard.tsx`,
`components/dashboard/InvoiceDetails.tsx`, `components/dashboard/PayoutAccountCard.tsx`,
`components/dashboard/PayoutBalanceCard.tsx`, `components/dashboard/ProfileSettingsPage.tsx`,
`components/dashboard/RecentPayoutsCard.tsx`, `components/dashboard/SchoolBillingCard.tsx`,
`feature/dashboard/shared/screens/BillingScreen.tsx`,
`feature/dashboard/teacher/screens/TeacherBillingScreen.tsx`.
The unused `components/payments/StripePage.tsx` WebView was removed.

Payment data/navigation: `constants/paymentSessionsApi.ts`,
`feature/dashboard/shared/hooks/usePayoutAccount.ts`,
`feature/dashboard/shared/store/navigationSlice.ts`,
`utils/payments/flowCoordinator.ts`, `utils/payments/invoicePaymentState.ts`,
`utils/payments/invoiceValidation.ts`, `utils/payments/paymentLinks.ts`,
`utils/payments/paymentUtils.ts`, `utils/payments/payoutUtils.ts`,
`utils/payments/pendingFlows.ts`, `utils/payments/usePaymentRecovery.ts`.

Tests: `tests/booking-payment-lifecycle.test.cjs`, `tests/invoice-payments.test.cjs`,
`tests/journey-integrations.test.cjs`, `tests/payment-recovery.test.cjs`,
`tests/payment-return-lifecycle.test.cjs`, `tests/payout-lifecycle.test.cjs`,
`tests/school-billing-lifecycle.test.cjs`. Documentation: `README.md` and this file.
