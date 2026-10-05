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
share one refresh request; invalid sessions return to login. Sessions still use
the app's existing in-memory token storage.

## Check changes

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The regression tests cover phone cooldown/expiry, verified phone preservation,
document/approval gates, payout limits and uncertain results, invoice payloads,
payment reconciliation, refunds, safe Stripe links, and token refresh.

Live end-to-end checks need authenticated test accounts, a connected device or
simulator, and working Stripe/Twilio backend configuration. On development
backends without Twilio configured, the SMS code can be logged by the backend
instead of delivered.
