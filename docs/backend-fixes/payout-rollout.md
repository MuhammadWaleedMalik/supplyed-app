# Payout request-ID rollout

Status: reviewable patches only. The real backend, real database and active
mobile payout API have not been changed by these patches.

## Backend patch

Apply `payout-request-id.patch` to a separate backend checkout and compare
`payout-request-id-source-map.json` against the intended source. It changes:

- `src/modules/payments/dto/payout-balance.dto.ts`
- `src/modules/payments/payments.controller.ts`
- `src/modules/payments/payout-accounts.repository.ts`
- `src/modules/payments/instant-payouts.service.ts`
- `prisma/schema.prisma`
- New additive migration
  `prisma/migrations/20261020150000_instant_payout_requests/migration.sql`

Both source maps use SHA-256 of UTF-8 text with line endings normalized to LF.
On a Windows checkout with CRLF files, check/apply the patch with
`git apply --ignore-space-change --check <patch>` and then
`git apply --ignore-space-change <patch>`. The staged mobile patch passed that
read-only apply check against the active mobile source.

The request remains `POST /payments/payout-account/instant-payout`:

```json
{
  "requestId": "72699165-9283-45d5-96ec-8072dce9631b",
  "amountPence": 10000
}
```

Use a new UUID for a new intended withdrawal. Retry the same UUID and original
body after an unknown response. Omitting `amountPence` still requests the full
balance; the server freezes the first evaluated amount before contacting Stripe.
Reusing an ID with another amount returns 409. A saved completed request retrieves
its Stripe payout; it never creates another one.

The additive table stores no card/bank details, only provider account/destination
identifiers, amount and request/payout IDs. Its account relationship uses RESTRICT
to avoid silently removing recovery history. Retain completed request records;
deleting them would permit an old request ID to create another withdrawal.

Pending records older than 23 hours need support reconciliation using the
connected account, request metadata and payout history. Do not delete a pending
record to make the button work: a payout may already exist in Stripe.
There is no new admin reconciliation endpoint in this patch.

Before deployment, test migration application and concurrent request reservation
in a disposable PostgreSQL database, plus Stripe test-mode success, declined
request, lost-response replay, webhook timing, account changes and recovery of
pending records. Review database backup/rollout separately from source review.
No database commands or real Stripe actions were performed in this audit.

## Mobile patch, after backend deployment

`payout-mobile-after-backend.patch` is intentionally separate. Its hashes are
in `payout-mobile-source-map.json`. It updates the existing payments API/hook/card
and adds `utils/payments/pendingPayout.ts`.

It saves the exact UUID/body under the authenticated user's Keychain service
before sending, loads the pending request on screen entry and offers Retry saved
withdrawal. A pending record blocks a new withdrawal. A failed save prevents
POST; a failed response or failed cleanup retains recovery state. Mount/refresh
never sends a withdrawal.

The current backend rejects unknown DTO properties, so deploying the mobile
patch first would break withdrawals. Deploy and verify the backend migration
and API first; then apply/rebase and device-test the mobile patch. Its current
TypeScript verification used an in-memory overlay and its storage/network checks
used mocks; native Keychain persistence remains unverified.

Old mobile/web callers may continue omitting `requestId` after the backend
deployment. The server generates a unique ID for each received request so
different equal-amount withdrawals no longer collapse. Such clients cannot
recover an ambiguous result exactly. Do not automatically retry them. Update
the website separately to retain its UUID/body if it needs equivalent recovery.

The request ID is an idempotency identifier, not an authorization credential.
The backend always derives the payout account from the authenticated instructor.
