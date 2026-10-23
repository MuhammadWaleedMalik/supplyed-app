# Staged account-security patch

`account-security.patch` is a unified patch against the inspected `supplyed-backend` source. `account-security-source.json` records the exact before/after source for deterministic isolated application. Neither artifact contains runtime environment values or database data.

The real backend has an active watcher and real data. **Do not apply this patch there during this audit.** It has been applied only to `android/app/build/audit/backend`, without copying `.env`, starting a server or connecting Prisma.

Changes cover private-account ownership, verified-phone lock, null DTO rejection, atomic OTP send/claim/throttle/user update, 2FA verification after email verification, setup-secret comparison, and recovery-list conditional updates. No Prisma schema/migration changes.

Per-user OTP serialization uses PostgreSQL `SELECT ... FOR UPDATE` with a parameterized user ID. Send checks, invalidation and insert run together; successful claims and user updates run together. bcrypt comparison stays outside the transaction; the conditional claim rechecks expiry, consumption and attempt count afterward.

Email/reset default limits are 60 seconds and 5 sends/hour, overridable by `OTP_RESEND_COOLDOWN_SECONDS` and `OTP_MAX_SENDS_PER_HOUR`. Phone retains its existing `PHONE_OTP_*` configuration. A failed mail/SMS delivery still consumes a send slot and invalidates the prior code; recovery is another request after cooldown. No provider call was performed.

Isolated TypeScript check passed after normalizing the owner-update return through existing `UsersService.getById`. Mocked security checks passed 59 assertions; no real PostgreSQL concurrency test was performed.

Apply any separate production-configuration patch **after** this patch because both touch `auth.service.ts`. Review changes against the current backend source before applying; do not overwrite later edits using the source map.

Before deployment, apply the separate `web-email-two-factor.patch` to align website email verification with its existing login 2FA-challenge handling. `features/auth/backend.ts:403` and `features/auth/actions.ts:421` currently expect a full session; the staged backend correctly requires 2FA if an existing enabled account has to reverify email. Both website Login and Signup are covered by the staged patch. Mobile already handles this challenge.

Refresh/logout lifecycle is explicitly not fixed by this patch alone. The separate `session-rotation.patch` implements stored-hash rotation, logout and reset/issuance races. It depends on this patch plus production configuration, and has a **hard website refresh-cookie compatibility gate**. See [session rollout notes](session-rotation-README.md). Revoking persisted rows alone does not invalidate stateless tokens currently issued by the real server.
