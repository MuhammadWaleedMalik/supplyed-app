# Reviewable backend correction bundle

These patches are prepared against the supplied local backend source. They are
applied and compiled **only** in the mobile workspace's isolated copy:
`android/app/build/audit/backend`.

The real backend repository, environment files, database and running processes
were not changed. Its compiled server and separate test watcher remain running.
Do not apply these files to that watched checkout during this audit.

## Patch order and scope

| Order | Patch | Result |
| --- | --- | --- |
| 1 | `account-security.patch` | Self/admin account reads; verified-phone lock; atomic OTP issue/claim and throttling; 2FA challenge/setup/recovery integrity. |
| 2 | `job-update-authorization.patch` | Require operating school for owned job edits and prevent editing suspended job contents; preserve administrator moderation. |
| 3 | `application-hire-profile-checks.patch` | Lock and recheck teacher/school/job eligibility inside the hire transaction. |
| 4 | `payout-request-id.patch` | Persist a withdrawal request snapshot and reuse its Stripe idempotency key; additive Prisma model/migration. |
| 5 | `config-log-security.patch` | Reject missing, short or known-development production JWT secrets; redact recovery credentials, signed URLs and signatory token paths in logs/metadata. |
| 6 | `profile-document-submission.patch` | Enforce current document requirements when an owner submits a profile, matching the website rules. |
| 7 | `session-rotation.patch` | Persist/rotate refresh tokens in the existing table and revoke a session on logout; explicit cutoff for legacy stateless refresh tokens. |

Apply the account patch before configuration/logging because both change
`auth.service.ts`. Apply session rotation after both of those patches. No patch
modifies a runtime environment file. Review and rebase against the intended
release commit; these patches are not instructions
to overwrite newer backend work.

The `*-source.json` files are exact source-only before/after snapshots used to
reconstruct the isolated copy without editing the watched checkout.
The smaller `*-source-map.json` files record hashes. They contain no environment
values or database records and are validation aids, not application runtime
files. The unified patches are the release changes; do not blindly restore
snapshots over an updated checkout.

Detailed account constraints are in [account-security-README.md](account-security-README.md).
Payment sequencing, request recovery and the separate deferred mobile patch are
in [payout-rollout.md](payout-rollout.md). Profile readiness rules are in
[profile-document-submission.md](profile-document-submission.md).

**Session rotation has a deployment gate:** the website must persist rotated
refresh tokens through a cookie-writable boundary or durable session store and
coordinate refresh across its server workers. Its current read-only RSC paths
and process-local refresh cache are insufficient for strict one-use rotation.
Do not deploy `session-rotation.patch` to the shared backend before that client
work is complete. This bundle does not claim that website session issue is fixed.

## Checks performed safely

- All **seven patches** passed ordered `git apply --check --ignore-space-change`
  and application in a second clean source-only audit folder. Its resulting
  **37 changed source paths** match the compiled isolated copy, apart from the
  intentional private Prisma generator output path. Exact patch/source hashes
  and order are in `validation-manifest.json`. The whitespace option accommodates
  the original CRLF files.
- The isolated account/marketplace code passed TypeScript with
  `--noEmit --incremental false --project tsconfig.build.json`.
- Prisma 7.8 client generation passed with output explicitly set to
  `generated/audit-client` inside the isolated copy. A dummy database URL was
  used only to satisfy configuration parsing; generation did not connect to a
  database. `JITI_FS_CACHE=false` prevented the CLI from writing a cache through
  the shared dependency junction.
- `npm run build` (`nest build`) passed with the final frozen **seven patches**, the private
  generated client and its added payout model. The compiler output path was
  checked to stay inside the isolated copy before Nest cleared/rebuilt it.
- Targeted ESLint passed for the final auth/session/2FA, configuration,
  logging and profile-readiness helper files.
- The selected existing mocked/unit backend suites passed: **8 suites,
  125 tests**. The final run maps `@prisma/client` to the private generated
  client. Selected suites are listed below.
- **37** direct configuration/redaction assertions passed: production missing,
  short and known-placeholder secret rejection; valid/derived secrets;
  development fallback; token/query URL masking; nested recovery-code,
  authenticator URI/QR, challenge-token and signed-URL redaction.
- Separate agent checks passed **59 account-security**, **38 session/reset/2FA**,
  **12 payout snapshot/replay** and **23 profile-document** mocked assertions.
  These cover the new authentication paths that the existing 125 tests do not
  exercise. No check used PostgreSQL, Stripe, email or SMS.

The isolated copy excludes `.env` files. Installed packages are reused read-only
through a directory junction. No dependency installation, shared Prisma client
regeneration or backend start command was run. An initial Prisma configuration
cache write was denied; generation was rerun successfully with that cache
disabled. The shared dependency files were not changed.

The final selected test command, from the isolated backend folder:

```powershell
node node_modules/jest/bin/jest.js --config jest.audit.json --runInBand --runTestsByPath `
  src/app.controller.spec.ts `
  src/modules/jobs/job-dates.spec.ts `
  src/modules/jobs/job-work-units.spec.ts `
  src/modules/jobs/job-listing-window.spec.ts `
  src/modules/instructors/instructor-bookings.spec.ts `
  src/modules/bookings/invitation-availability.spec.ts `
  src/modules/matching/matching.service.spec.ts `
  src/modules/contact/contact.waitlist.spec.ts
```

`jest.audit.json` copies the existing package Jest configuration, places its
cache inside the isolated copy, and maps `^@prisma/client$` to
`<rootDir>/../generated/audit-client`. The private compiler configuration maps
the same import for type checking. These are audit-only settings; do not deploy
the isolated build output as a ready-to-run backend.

The database integration suite and tests that create an HTTP server were
excluded. The selected contact suite intentionally simulates a mail-delivery
failure; its expected log does not indicate any real email was sent.

## Before a controlled release

1. Use a separate backend checkout and review/apply the patches in order.
   Preserve existing uncommitted backend changes; no blanket replacement.
2. Verify production secrets are strong and at least 32 characters. The
   configuration patch intentionally prevents startup with missing, short or
   known development secrets. Optional explicit refresh/OTP secrets meet the
   same rule; otherwise they derive from the strong base secret. Changing
   existing signing secrets invalidates old tokens and needs a planned rollout.
3. Validate the additive payout migration against a disposable PostgreSQL
   database. Generate the normal client in that separate environment, then
   typecheck/build/test there. The actual live migration state was not queried.
4. Exercise concurrent OTP claims, hire/suspension races, cross-account access
   denial, invitation acceptance and transaction rollback in that disposable
   environment. Mocked checks do not prove PostgreSQL locking behavior.
5. Exercise the payout replay paths in Stripe test mode, including lost
   responses, concurrent equal requests and pending records older than 23 hours.
   Do not delete pending requests to retry a payment.
6. Align the website's email-reverification handling with the staged 2FA
   challenge response (`web-email-two-factor.patch`) before backend release.
   Resolve the website refresh-persistence/multiworker gate above before
   enabling strict session rotation. Existing stateless refresh tokens are
   deliberately rejected after rollout, requiring sign-in. A lost rotation
   response or a losing concurrent refresh also requires sign-in; there is
   no replay grace. Existing access tokens remain valid until their short
   expiry, so this does not promise immediate access-token revocation.
7. Apply `mobile-session-logout.patch` only after the backend logout endpoint
   is deployed and verified. It is staged separately so local logout remains
   reliable when the new endpoint is unavailable.
8. Deploy the backend schema/API before applying
   `payout-mobile-after-backend.patch`. The current backend rejects unknown
   DTO properties, so the request-ID mobile change remains intentionally
   staged. Update the website's retained request-ID handling separately.
9. Validate the mobile release on a device, then use an intentional deployment
   procedure. No application of these patches to the real backend, migration,
   process restart, real payment or live-user test is included in this audit.

Session rollout limitations and broader production controls are
listed in [the account audit](../audit-auth-account.md) and
[the routes/configuration audit](../audit-routes-backend.md).
