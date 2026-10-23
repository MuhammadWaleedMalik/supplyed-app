# Teacher discovery, messaging and payments audit

Audit date: 20 October 2026. Scope: the mobile repository plus the supplied
local `supplyed-web` and `supplyed-backend` source. No live messages, uploads,
notifications, invoices, withdrawals, Stripe calls, user mutations or database
migrations were performed. The backend contains real data.

## Screen and API inventory

| Mobile entry point | Flow traced | API/backend contract |
| --- | --- | --- |
| School Find teachers | Search → filter sheet → results → profile → message or invite | `GET /instructors/directory`; matching uses `GET /matching/jobs/:jobId/instructors`; general chat uses `POST /conversations` with `instructorId`. Invitation work is recorded in `audit-marketplace.md`. |
| Messages | Contact → General/Applications/Invitations/Bookings topic → selected thread → messages/details | Conversation list/detail, application conversation lookup, cursor-based message history, read receipt and unread-count endpoints. Multiple topics may share the underlying job conversation; frozen invitation terms remain in invitation details. |
| Message composer | Text or picked file → signed upload → send | `POST /conversations/:id/attachments` reserves the attachment and returns a signed upload; raw bytes go to that URL, then `POST /conversations/:id/messages` links verified uploads. Download URLs come from the participant-authorized download endpoint. |
| Live updates | Authenticated foreground app → new socket ticket → namespace connection → REST catch-up | `POST /conversations/socket-ticket`, `/conversations` Socket.IO namespace. The socket carries message, read, typing and notification events. HTTP remains the source for catch-up. |
| Notifications | All/unread list → read/open → exact native destination | `GET /notifications`, unread count, `POST /:id/read`, `POST /read-all`; preferences use `GET/PATCH /notifications/preferences`. Unsafe or unknown web links stay in Notifications. |
| School Billing | List → filter sheet → invoice details → native payment or hosted Stripe payment → backend sync | `GET /invoices/me`, `GET /invoices/:id`, `POST /:id/payment-session`, `POST /:id/sync`; resend via `POST /:id/send`. |
| Booking invoice | Completed booking → review units/PO number → create → invoice | `POST /invoices`; school/admin role and owning school checked on server. Creation uncertainty is reconciled against the booking/invoice before another create is offered. |
| Teacher Earnings | Payouts / Invoices tabs | Account, balance, onboarding/dashboard links and instant withdrawal under `/payments/payout-account`; invoice list uses the same own-invoice endpoint. |
| Admin Invoices | Paginated list/filter sheet → details → resend, void or refund; separate create form | Admin `GET /invoices`; create/send; admin-only `POST /:id/void` and `POST /:id/refund`. |
| Admin Payouts | Teacher identifier → payout status | `GET /payments/payout-accounts/instructor/:instructorId`, admin-only. |
| Admin Users | Paginated/filterable list → focused create/edit modal | `GET /users`, `POST /users/admin`, `PATCH /users/admin/:id`. The backend restricts these endpoints to admin. |
| Admin Account / Settings | Separate tabs for own account and existing settings | Existing shared account/profile/settings APIs; no impersonation or new privileged endpoint introduced. |

## Implemented mobile corrections

1. **Find teachers fits a phone.** Search and a compact filter button precede
   the results. A draft filter sheet offers Apply/Reset; results use a FlatList
   with pull refresh, error recovery and load-more. Profiles and invitations
   have their own full-screen modal instead of expanding into the result list.
   Invitation review/back changes scroll to the top.
2. **Directory filters match the web/backend.** Subject and skill accept custom
   text. Hourly maximum and DBS verification are now available alongside
   daily rate, experience, rating, location, key stage, QTS and availability.
   Blank/false values are omitted from queries; numeric bounds and text lengths
   are validated before requests. Matching retains the selected job when inviting.
   Teacher booking previews expose only the permitted date/unit information.
3. **General conversation has a real entry point.** A school can select
   Message teacher in the directory profile, matching the website's general
   teacher conversation flow. Duplicate taps and stale-session completion are
   guarded; the returned conversation is opened directly.
4. **Chat notification routing no longer loses context.** A message notification
   with `conversationId` opens that thread; application context remains
   supported. A generic message link opens the inbox. Required thread selection
   cannot be cleared into an empty/unavailable screen.
5. **Conversation headers are smaller.** Contact/topic context is retained;
   repeated headings and verbose invitation terms are removed from above the
   chat. The details screen explains the shared job thread and links to the
   invitation's frozen terms.
6. **Socket tickets recover correctly.** A used/expired one-time socket ticket
   requests a fresh ticket instead of signing the user out. Temporary connection
   limits and middleware failures retry with delay. Role/origin/namespace
   rejections stop. The authenticated REST client remains responsible for login
   refresh/expiry.
7. **Uncertain sends remain reviewable.** HTTP 408 joins transport/server
   failures in the uncertain-send state. Draft content/attachments are kept and
   the conversation must refresh before the user decides whether to send again.
   There is no automatic message resend.
8. **Stale account work is guarded.** Attachment-open continuations, payout
   actions, invoice actions, invoice-create callbacks, admin user saves and
   paginated list completion check the mounted session. A late response from an
   earlier login cannot navigate, open a payment URL or populate another user's
   screen.
9. **Billing shows useful information first.** Invoice filters live in a sheet,
   create invoice is a separate action, and secondary invoice actions appear
   with expanded details. Single-page lists omit redundant paging controls.
   Teacher Earnings separates payouts and invoices. Admin separates Invoices,
   Payouts, Users, Account and Settings.
10. **Admin forms are usable and match validation.** Create/edit opens a focused
    safe-area modal with keyboard avoidance and scrolling. List errors appear
    near the list. Passwords require eight characters, uppercase, a number and
    a special character, matching backend validation. Names are capped at 200.
    Admin international phone numbers no longer receive a forced UK prefix.
    An empty optional refund reason is omitted rather than sent as an invalid enum.

Primary changed files are in the existing `feature/.../screens`, `hooks` and
`apis` structure. New discovery components are `TeacherDirectoryCard`,
`TeacherFilterFields` and the small `teachersApi` adapter. Shared filter controls
were created by the main UI task; no parallel state-management framework was added.

## Backend authorization and persistence review

These are source findings, not live penetration or payment tests.

- Conversations verify the institution's operating profile and teacher state
  when starting a conversation. A job/application context is checked against
  its parties. Reads require participant/admin access; writes require the
  allowed participant roles. Rejected application threads are read-only.
  A unique context key prevents duplicate general/job conversations.
- Message validation limits text to 2,000 characters and attachments to five.
  Sending verifies the uploaded object's actual size/type against the 10 MB
  limit and permitted types. Attachment ownership and conversation association
  are checked before linking a file; downloads require conversation access.
- Notifications use the authenticated user ID for list, count, read and
  preferences. The mobile app does not treat arbitrary notification URLs as
  external navigation.
- Invoices check participant ownership; payment-session creation is restricted
  to the paying school. PENDING invoices are hidden from participant lists.
  Creation reserves the booking in a transaction and rejects another non-VOID
  invoice. Stripe creation/refund keys and persisted invoice state provide
  retry protection. Payment success is taken from backend sync, never from
  the native sheet closing alone.
- Stripe webhook authentication covers the raw request body. Source includes
  processed-event tracking and protections against regressing confirmed invoice
  and refund state. Signature delivery and real event ordering were not exercised.
- Admin user/list/update and invoice/payout administrative actions have backend
  role checks. Client-side role visibility is not the authorization boundary.

## Payout defect and staged fix

**High priority; not deployed.** The current backend constructs an instant-payout
idempotency key from connected account, current balance and amount. Two genuinely
different withdrawals with the same amount/balance can therefore reuse the same
Stripe request. An unknown response also cannot be recovered reliably with a
new balance-derived key.

The concrete correction is staged in
[`backend-fixes/payout-request-id.patch`](backend-fixes/payout-request-id.patch).
Its source hashes are in `payout-request-id-source-map.json`. It adds:

- Optional validated v4 UUID `requestId` to the withdrawal DTO/controller.
- An additive `InstantPayoutRequest` table with account-scoped unique request ID,
  original requested amount, frozen effective amount/destination/Stripe account,
  and the resulting Stripe payout ID.
- Reservation before Stripe, including recovery from a concurrent Prisma unique
  conflict. Each distinct request gets a distinct Stripe key. Exact replay uses
  the same frozen parameters, or retrieves the already-confirmed payout.
- A 409 if a request ID is reused with a different requested amount. An unresolved
  request older than 23 hours requires review rather than risk re-creating a
  payout after Stripe key pruning.
- Server-generated unique IDs for old callers. They remain wire-compatible,
  but cannot replay an ambiguous request because they do not retain its ID.

The companion mobile rollout is separately staged in
[`backend-fixes/payout-mobile-after-backend.patch`](backend-fixes/payout-mobile-after-backend.patch).
**It is not applied to the active mobile source.** Current backend DTO validation
must accept `requestId` before shipping it. The patch stores the exact pending
request in account-scoped Keychain storage before POST, blocks a different
withdrawal while pending, and exposes an explicit Retry saved withdrawal action
after restart. No automatic withdrawal is triggered by mounting or refreshing.
Storage failure stops a new POST. An error preserves the request; a successful
response clears it. An unresolved/invalid saved request requires support review.

Stripe documents that keys can be pruned after at least 24 hours; the 23-hour
cutoff is deliberately conservative. Confirmed payouts are retrieved by ID.
See [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
and [retrieve a payout](https://docs.stripe.com/api/payouts/retrieve).

Deployment details and remaining compatibility limits are in
[`backend-fixes/payout-rollout.md`](backend-fixes/payout-rollout.md). No migration
was run against the local backend.

## Verification

| Check | Result |
| --- | --- |
| Active mobile `npm.cmd run typecheck` | Passed. |
| Scoped ESLint across the 22 modified discovery/messaging/payment/admin files | Passed without warnings. |
| Safe discovery API/filter assertions | 24 passed: endpoint/query mapping, bounds, custom text, matching normalization, booking-preview privacy. |
| Safe messaging/payment/admin assertions | 51 passed: destination routing, chat payload/limits/deduplication, admin validation, amount/refund rules, URL allowlists, socket ticket renewal and session protection. |
| Staged backend payout service assertions | 12 passed with mocked repository/Stripe: distinct equal-amount/balance requests, exact replay, frozen destination/amount, old-client keys, concurrency and aged unresolved request. |
| Final staged repository assertions | 4 passed: reservation, unique-conflict recovery and propagation of unrelated database errors. |
| Staged mobile payout recovery assertions | 12 passed: unique request IDs, retained request/body, separate users, blocked duplicates, failed storage, changed session and failed cleanup. |
| Staged mobile overlay TypeScript and ESLint | Passed using in-memory source overrides; the active source stayed compatible with the current server. |

The 103 assertions above are inline mocked checks, not new committed test files.
The staged backend is also being compiled in an isolated source copy with a
private generated Prisma client; final combined backend results are recorded
by the main audit. This does not establish that a database migration or Stripe
integration works in the real environment.

## Remaining dependencies and unverified behavior

1. **V2/non-Express bank management is not complete in native UI.** The backend's
   `createDashboardLink` rejects an account whose dashboard is not `express`.
   The website uses `@stripe/connect-js` and `@stripe/react-connect-js`
   (`StripePayoutComponents.tsx`) with
   `POST /payments/payout-account/session`, rendering AccountOnboarding,
   NotificationBanner and Payouts. The current native app has hosted onboarding,
   Express dashboard links, balance/history and withdrawals, but no native
   Connect embedded integration and no configured trusted authenticated website
   route for non-Express management. It explains that bank changes require the
   website. Completing this needs a supported native Connect flow or a deployed,
   authenticated web management route and return handling.
2. **Native saved-card parity needs a backend contract.** The payment-session
   response includes a web Payment Element CustomerSession but no `customerId`;
   its enabled component is `payment_element`. Native PaymentSheet currently uses
   the PaymentIntent secret for card payment. Saved payment methods require the
   native-compatible CustomerSession/customer contract and device verification.
3. **Current withdrawal retry remains legacy until rollout.** The active mobile
   refreshes balance/history after an uncertain withdrawal and never retries
   automatically. It does not have the durable request-ID recovery in the staged
   patch. The current web caller is also legacy and needs its own retained UUID
   to gain exact retry behavior.
4. **Messages have no durable idempotent outbox contract.** The app retains a
   draft and asks the user to review refreshed messages after uncertainty.
   It cannot prove exactly-once delivery across restart/manual resends without
   a server-supported client message identifier.
5. **No phone or safe test backend was available.** Small-screen layout, keyboard,
   file picker/upload, image/PDF opening, background/foreground reconnect,
   notification interactions, Keychain after reinstall/restart, native Stripe
   sheet/3DS, hosted return links, real payment confirmation, refunds, payouts
   and account onboarding require device testing with a disposable environment.
   No real-money end-to-end success is claimed.
