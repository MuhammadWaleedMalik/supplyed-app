# Staged session rotation — deployment blocked on website coordination

These are reviewable source patches, not changes to the running backend, website or current mobile app. The backend contains real data and has an active watcher. No server was started, restarted or deployed, and no database/provider calls were made.

## Artifacts and order

| Artifact | Target | Prerequisites |
| --- | --- | --- |
| `web-email-two-factor.patch` (6 files) | Website | Reuses existing challenge handling for email verification in Login and Signup. Apply before the backend account-security email-verification change. |
| `session-rotation.patch` (10 files) | Backend | Apply after `account-security.patch` and `config-log-security.patch`. Hold deployment until the website refresh-cookie gate is resolved. |
| `mobile-session-logout.patch` (3 files) | Mobile | Apply with a server that supports POST `/auth/logout`. Current mobile source remains unchanged by this companion. |

The matching `*-source.json` files contain exact before/after source snapshots to apply and verify in an isolated copy. They contain no environment secrets, real tokens or database data. Do not overwrite newer source from these snapshots.

## Implemented behavior

- New refresh JWTs carry a stable signed `sessionId` and unique `jti`. RefreshToken stores only SHA-256 of the JWT, with user/expiry/revocation state. No Prisma migration is required.
- Refresh checks signature, token type, current verified user, current 2FA requirement and active stored hash. Rotation conditionally replaces the hash/expiry of the same session row. Two uses of the same token have at most one winner.
- POST `/auth/logout` accepts a refresh token body, verifies its signature/type/session claims, and revokes that signed user/session. It does not require a live access token. A signed older token can revoke a just-rotated token from the same session, covering logout versus refresh.
- Password reset holds the same user lock, changes the password, consumes the reset code, revokes all persisted refresh sessions and removes pending 2FA challenges.
- New password-authenticated session issuance compares the password hash observed during authentication with the current hash under the user lock. 2FA challenge creation/reuse checks it before returning any challenge; 2FA completion captures a password snapshot before consuming the challenge and checks it again at session issuance. A reset winning any of these races prevents authentication based on the older password.
- No password hash is placed in a JWT or response DTO. JWT verification failures return 401; persistence outages remain server errors instead of being disguised as invalid sessions.
- Mobile logout captures the refresh token, clears local credentials immediately and sends revocation using the captured value. Late results cannot clear or replace a newer user’s session.

## Hard deployment gate

Website `lib/server/token-refresh.ts` rotates tokens during Server Component rendering even when cookies cannot be written, with a **process-local 30-second grace cache**. A strict rotating backend invalidates the cookie’s older token. Later requests or another worker can lose access; workers can race and the losing request can expire a still-valid session.

Do not deploy this session patch as compatible with the current website. First move refresh into a writable session flow and ensure rotated tokens are durably available across workers, with appropriate distributed coordination. This needs an explicit website session architecture change and acceptance tests; a short process-local cache is insufficient. No untested broad rewrite or permissive backend replay bypass was introduced.

## Explicit cutoff and limits

- The staged server rejects every legacy refresh JWT without `sessionId` and `jti`; existing users must sign in again after rollout. There is no indefinite legacy fallback.
- Access JWTs are not looked up in the session table. Logout/reset takes full effect on already-issued access credentials at their configured expiry (15 minutes by default). Immediate access/socket revocation is not implemented by this patch.
- A successfully rotated token cannot be retried with its predecessor. A lost response, lost keychain/cookie write or uncoordinated concurrent refresh may require sign-in. Mobile’s ordinary requests share one refresh promise, but that cannot recover a response that never arrived.
- Stale-token reuse is rejected; it does not automatically revoke the active successor or all sessions. This patch does not claim token-family theft detection.
- Offline logout clears local credentials but cannot prove server revocation. A copied refresh token may remain usable until expiry if the revocation request never reaches the server.
- Refresh expiry remains configurable and sliding through rotation. Expired/revoked row retention and cleanup require an operational retention policy; no deletion job or database cleanup was run.

## Validation

- Session sources: 38 mocked assertions covering persisted hashes, unique identifiers, rotation/replay/concurrency, signed logout ownership, logout/refresh race semantics, legacy rejection, persistence errors, password-reset issuance races and 2FA challenge reuse/creation limits.
- Independent peer review: 9 focused assertions for expected-password checks, user-lock ordering, valid challenge reuse/create and throttling.
- Website parity: full TypeScript source-overlay check passed with no emitted files; 12 mocked assertions exercised normalizer, server action, Login and Signup challenge-to-session branches.
- Mobile logout: full TypeScript source-overlay check passed with no emitted files; 3 mocked assertions verified immediate local clear, captured token identity and immunity of a newer session to late offline failure.
- The integration agent applied all seven backend patches sequentially to a fresh source-only baseline, verified all 37 changed source paths against the compiled copy, and passed final Nest build and targeted auth/session/2FA/config/helper ESLint. These source/mocked checks do not prove production PostgreSQL concurrency, browser-cookie behavior, multiple workers, real email/SMS or device keychain behavior.
