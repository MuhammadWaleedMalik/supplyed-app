# Website routes and backend configuration audit

Reviewed 20 October 2026 against the supplied local website and backend source.
This is a source review, not a claim that every route was exercised in a browser,
on a phone, or against the live database. No login, mutation, email, notification,
payment, server restart, migration or database test was performed.

Related findings: [marketplace](audit-marketplace.md),
[backend patches and safe validation](backend-fixes/README.md).

## Website page inventory and entrances

The website has 30 `page.tsx` files. Route groups in parentheses do not add URL
segments. All registered pages have an identifiable intended entrance below.
Some entrances are contextual or external callbacks, rather than permanent tabs.

| URL | Intended entrance | Access and current source result |
| --- | --- | --- |
| `/` | Website root/logo; public account-menu home action | Public landing and waitlist. |
| `/founding-schools` | Public For schools navigation | Public founding-school interest form. |
| `/founding-teachers` | Public For teachers navigation | Public founding-teacher interest form. |
| `/how-it-works` | Sitemap/search/direct URL | Public standalone page. Header/footer instead link to `/#waitlist-how-it-works`; the standalone page has no ordinary navigation link. |
| `/terms` | Public footer Terms and Privacy links | Public legal page; Privacy links to its `#privacy` anchor. |
| `/signatory-approval/[token]` | School signatory approval email | Public page authorized by the one-use approval token at the backend. Not a general account page. |
| `/login` | Public account entry; expired-session redirects | Email/social authentication. Existing authenticated sessions redirect by account state. |
| `/signup` | Public registration/auth links | Registration and verification flow. |
| `/forgot-password` | Login recovery action | Password reset challenge flow. |
| `/post-auth` | Auth success/verification/session-repair transitions | Server requires a session; client handles verification/onboarding destination. |
| `/onboarding` | First verified sign-in; profile application correction | Server requires verified session; administrators redirect to dashboard. |
| `/dashboard` | Successful account entry and workspace Home | Server `AppRouteShell`; role-specific dashboard or pending/rejected/suspended application status. |
| `/find-jobs` | Teacher Jobs navigation | Teacher job discovery and recommendations. |
| `/find-teachers` | School Teachers navigation; school top search | Active teacher directory and contextual job matching. |
| `/post-job` | School Post job quick action; job editing | School job creation/editing. |
| `/applications` | School/teacher Applications navigation; job detail | Role-specific own applications or school application management. |
| `/bookings` | School/teacher Bookings navigation; contextual booking link | Real own-booking workflow. Protected by server shell despite missing proxy matcher entry. |
| `/job-invitations` | School/teacher Invitations navigation | Real sent/received list. |
| `/job-invitations/[id]` | Notification, email, conversation invitation link | Participant-specific invitation; sign-in/onboarding preserves the supported invitation return path. |
| `/job-detail` | Job card, application or booking context | Role/context selects job detail; identifier is supplied in query context. |
| `/teacher-profile` | Teacher card, application, booking or conversation | Contextual teacher profile with invite/message entry. |
| `/institution-profile` | Job, booking or conversation school link | Contextual school profile; server shell protects it despite omitted proxy matcher. |
| `/my-profile` | Account/profile menu | Signed-in profile, history and reviews. |
| `/messaging` | Messages navigation; application/profile/booking conversation action | Real conversation list and selected thread. |
| `/calendar` | Signed-in teacher public account menu: Schedule | **Placeholder:** fixed March 2026 and generated cells; Save/Prev/Next have no handlers; preference toggles are no-ops. |
| `/settings` | Workspace/account settings menu | Role-specific account and profile settings. |
| `/security` | Account Security menu; administrator navigation | 2FA/security screen; server shell protects it despite omitted proxy matcher. |
| `/billing` | School Billing / teacher Earnings / admin Payments navigation | Invoices and role-specific payment/payout operations. |
| `/payouts/return` | Stripe Connect return URL | Server requires verified teacher session; refreshes account status. |
| `/payouts/refresh` | Stripe Connect expired-link refresh URL | Server requires verified teacher session; starts a replacement setup link. |

Sources: `app/**/page.tsx`, `components/route-shell.tsx`,
`components/organisms/RouteShell.tsx`, `AppChrome.tsx`, `PublicHeader.tsx`,
`PublicFooter.tsx`, `PayoutCallbackPage.tsx`,
`components/molecules/PublicAccountMenu.tsx`, `lib/routes.ts`,
`lib/invitation-links.ts`, and `app/sitemap.ts`.

## Route protection and confirmed website leftovers

- The application layout itself supplies query context; protection lives in each
  server page's `AppRouteShell`. That shell checks the session, auth error,
  verified email, current onboarding profile and application status. Role
  rendering in `RouteShell` is followed by backend role/ownership checks.
- Next 16 `proxy.ts` independently covers most application paths.
  `/bookings`, `/security` and `/institution-profile` are absent from its matcher,
  but all three pages invoke the protected server shell. This is inconsistent
  defence in depth, **not a demonstrated unauthenticated-data bypass**.
- The invitation return helper accepts supported invitation paths, rather than
  an arbitrary external redirect.
- NextAuth and verified-session tickets disable their development fallback
  secret in production. The backend's original JWT configuration did not;
  the staged configuration patch corrects that separate issue.
- `AppChrome.submitNavSearch` returns immediately unless the role is a school,
  although teacher and administrator search fields are displayed. Their top
  search is a confirmed no-op. The real mobile job/teacher filters remain the
  appropriate discovery entrances.
- `/calendar` is reachable but not connected to availability persistence.
  The mobile booking agenda should show actual bookings. Independent editable
  availability needs a real API/model before it can be presented as saved.
- Legacy `/api/teachers` and `/api/teachers/[id]` call backend `/teachers`
  paths that do not exist in the inspected backend controller inventory.
  Their `useTeachers`/`useTeacher` hooks have no current component consumers.
  The active FindTeachers page correctly uses `/instructors/directory`.
  These are unused legacy adapters, not the active directory failure.
- Several website queries still return seed/empty data when `API_BASE_URL` is
  missing (`features/teachers`, applications, conversations, notifications,
  bookings and payments). Deployment must not mistake that fallback for live
  data. No environment values were read to infer which branch is deployed.
- The website payout BFF currently forwards `amountPence` only. It will need
  the same retained `requestId` contract as the staged mobile payout patch
  after the backend migration is deployed.

No website files were changed during this audit.

## Backend registration and access model

`main.ts` registers the `/api` prefix, transformation, whitelist validation and
rejection of unknown body fields. `AppModule` registers `JwtAuthGuard` and
`RolesGuard` globally. A normal route therefore requires an access token unless
explicitly marked public. OTP-only endpoints have a dedicated purpose-bound
guard. Role decorators do not replace service-level participant/owner checks.

The following inventory covers the registered controller classes, including
controllers defined inside a module file. Paths are relative to `/api`.

| Controller/group | Prefix | Expected callers and reviewed boundary |
| --- | --- | --- |
| AppController | `/` | Authenticated diagnostic greeting. |
| AuthController | `/auth` | Public login/register/Google exchange/refresh/recovery; purpose-bound email/password/2FA challenge verification; authenticated `me`. |
| PhoneVerificationController | `/auth/phone/otp` | Current authenticated account; resend/claim integrity hardened in staged account patch. |
| TwoFactorController | `/auth/2fa` | Current account setup/status/disable/recovery codes; explicit administrator reset. |
| UsersController | `/users` | Self profile; administrator list/create/update/delete. Staged patch restricts arbitrary-ID account reads to self/admin. |
| InstructorsController | `/instructors` | Teacher own onboarding/profile; active-school directory; participant/public-profile policies and administrator review. |
| InstitutionsController | `/institutions` | School own onboarding/profile; contextual profile and administrator review. |
| DocumentsController | `/documents` | Current teacher/school documents, upload completion and download authorization; administrator review/removal. |
| DocumentRequirementsController | `/document-requirements` | Administrator management; current role's profile requirements. |
| DocumentTypesController | `/document-types` | Administrator management. |
| DocumentReviewsController | `/document-reviews` | Administrator review/history operations. |
| JobsController | `/jobs` | Public live-job reads; school-owned writes/drafts; administrator moderation. |
| ApplicationsController | `/applications` | Teacher application creation/own list; owner-school/admin transitions; participant history/detail. |
| MatchingController | `/matching` | Teacher recommendations/score; owning school/admin applicants and candidates. |
| BookingsController | `/bookings` | Participant own/detail/cancellation; school/admin completion and no-show; administrator list. |
| DirectHireController | `/bookings/direct-hire` | School-only compatibility endpoint for invitation creation. |
| JobInvitationsController | `/job-invitations` | School creation/cancellation; invited teacher accept/decline; participant list/detail. |
| ReviewsController | `/reviews` | Participants create; authenticated profile review reads; administrator deletion. |
| ConversationsController | `/conversations` | School opens conversation; teacher/school messaging; membership checks on detail/messages/attachments; administrator job history. |
| NotificationsController | `/notifications` | Current user's inbox, unread count, preferences and read acknowledgements. |
| InstitutionSignatoryApprovalController | `/institutions/me/signatory-approval` | Current school sends/reads its signatory request. |
| SignatoryApprovalsController | `/signatory-approvals` | Public token review/approve/decline; administrator list and override. |
| PayoutAccountsController | `/payments` | Teacher Connect/account/balance/payout; administrator instructor-account lookup. |
| StripeWebhooksController | `/payments/webhooks` | Public Stripe receiver; signature checked against exact raw body. |
| InvoicesController | `/invoices` | School/teacher own invoices, participant detail; administrator management. |
| ContactController | `/contact` | Public interest submission and token-authorized detail completion; administrator interest list/status. |
| DropdownsController | `/dropdowns` | Public active catalogues; administrator management. |
| TeachingCatalogueController | `/teaching-catalogue` | Public database teaching snapshot. |
| HealthController | `/health` | Public health check, including database ping. Not invoked during this audit. |

The table identifies registration and source guards; it does not assert that
every combination of roles and resources was runtime-tested. Detailed market
transactions are covered in `audit-marketplace.md`; account/payments checks are
documented with the staged backend changes.

## Configuration and data safety

Confirmed defects corrected **only in the isolated audit copy and staged patches**:

1. Access/refresh/OTP JWT secrets previously used a known fallback even in
   production. The configuration patch requires at least 32 characters and
   rejects the known development placeholder in production, for both the base
   secret and explicitly configured derived secrets. Local-development
   fallback remains available; no real environment file was modified.
2. Body redaction omitted 2FA recovery codes, authenticator URI/QR image,
   challenge tokens and signed download/upload URLs. These keys are now
   redacted recursively.
3. Access/error logs and response metadata retained approval tokens and
   query values in URLs. The new shared URL helper removes query/fragment
   values and masks the signatory token while preserving the route name.

Deployment limitations that remain unverified:

- Swagger is registered unconditionally at `/api/docs`; decide exposure at the
  deployment proxy. Documentation exposure alone does not bypass API guards.
- No application-wide/IP login throttle was found. Staged per-account OTP
  resend/claim protection does not replace perimeter abuse controls.
- No TLS/reverse-proxy, production cookie, security-header or secret-store
  configuration was exercised. There is no claim of production security
  certification.
- The original 15 SQL migration directories were inventoried; their actual
  applied state and database constraints were not queried. The payout patch
  adds one separate migration; it was not executed.
- `PrismaService.onModuleInit` connects and pings the database, and
  `ScheduleModule.forRoot()` enables notification/email/reminder workers.
  Starting an audit server could therefore cause side effects and was avoided.

## Running processes and isolated checks

Read-only process inspection found a backend compiled `dist/src/main` process
and a separate backend Jest test watcher. A source edit would not directly
replace the compiled server, but it could trigger watched tests. Therefore
**the real backend repository and running processes were left untouched**.
No further process changes or live requests were used.

The isolated source copy is under `android/app/build/audit/backend`. It contains
selected source/config/schema/migration/test files, no `.env`, and a read-only
use of installed dependencies through a junction. New Prisma client output is
private to `generated/audit-client`; generation used a dummy URL and did not
connect to a database. Its runtime dependency is also resolved read-only.

See the backend bundle README for final command results and patch application
order. An isolated successful compile is not a deployment or a migration
verification. Phone gestures, keyboard behavior, accessibility and end-to-end
server contracts still require later device/staging checks.

## Migration source inventory

These directories exist in the supplied backend. Existence and readable SQL
were checked; the live `_prisma_migrations` table was not queried.

| Directory | Scope indicated by migration |
| --- | --- |
| `20260927000000_init` | Initial accounts/profile/document schema. |
| `20260928000000_bookings_reviews_mat_trusts` | Bookings, reviews and school trust data. |
| `20261001000000_phone_verification_otp` | Phone verification challenges. |
| `20261001120000_payments_stripe_connect` | Payments and connected payout accounts. |
| `20261005000000_conversations_messages` | Conversation/message persistence. |
| `20261007000000_notifications` | Notification preferences/delivery records. |
| `20261009000000_application_job_name` | Saved application job-name context. |
| `20261012000000_waitlist_preferences` | Founding interest/waitlist preferences. |
| `20261015000000_school_chat_direct_hire` | School chat and direct-hire data. |
| `20261015010000_job_invitations` | Invitation snapshots/idempotency/uniqueness. |
| `20261016000000_job_live_from` | Listing opening times. |
| `20261016010000_remove_application_interview` | Remove obsolete interview status. |
| `20261019000000_job_subjects_catalogue` | Multi-subject teaching data. |
| `20261019010000_database_dropdowns` | Database-managed dropdown catalogues. |
| `20261020000000_job_work_units` | Optional planned job hours/days. |

The staged payout patch adds `20261020150000_instant_payout_requests`.
It exists only in the review bundle/isolated source until an intentional release.

## Website HTTP route inventory

The generated table below lists every registered `route.ts` file and exported
HTTP method. These routes supplement server actions; absence of a BFF mutation
route does not imply the website lacks that action. Protected BFF calls use
`lib/server/api-client.ts`, which reads server-held session tokens and forwards
the request to the guarded backend. The inspected file previews use authorized
signed URLs, private/no-store responses and sandbox/nosniff headers.

| URL | Methods |
| --- | --- |
| `/api/applications/[id]/history` | GET |
| `/api/applications/[id]` | GET |
| `/api/applications/active-jobs/count` | GET |
| `/api/applications/job/[jobId]` | GET |
| `/api/applications/me` | GET |
| `/api/auth/[...nextauth]` | GET, POST |
| `/api/auth/me` | GET |
| `/api/bookings/[id]` | GET |
| `/api/bookings/me` | GET |
| `/api/conversations/[id]/attachments/[attachmentId]/preview` | GET |
| `/api/conversations/[id]/attachments` | POST |
| `/api/conversations/[id]/messages` | GET |
| `/api/conversations/[id]` | GET |
| `/api/conversations` | GET |
| `/api/conversations/socket-ticket` | POST |
| `/api/conversations/unread-count` | GET |
| `/api/dropdowns/[name]` | GET |
| `/api/dropdowns` | GET |
| `/api/health` | GET |
| `/api/institutions/profile/[id]` | GET |
| `/api/instructors/directory` | GET |
| `/api/instructors/profile/[id]` | GET |
| `/api/invoices/[id]` | GET |
| `/api/invoices/me` | GET |
| `/api/invoices` | GET |
| `/api/job-invitations/[id]` | GET |
| `/api/job-invitations/me` | GET |
| `/api/jobs/[id]` | GET |
| `/api/jobs/mine` | GET |
| `/api/jobs` | GET |
| `/api/matching/jobs/[jobId]/applications` | GET |
| `/api/matching/jobs/[jobId]/instructors` | GET |
| `/api/matching/jobs/[jobId]/score` | GET |
| `/api/matching/jobs/recommended` | GET |
| `/api/my-profile/applications` | GET |
| `/api/my-profile/reviews` | GET |
| `/api/notifications/preferences` | GET |
| `/api/notifications` | GET |
| `/api/notifications/unread-count` | GET |
| `/api/onboarding/document-requirements` | GET |
| `/api/onboarding/documents/[documentId]/preview` | GET |
| `/api/onboarding/documents` | POST |
| `/api/onboarding/me` | GET |
| `/api/payments/payout-account/balance` | GET |
| `/api/payments/payout-account/instant-payout` | POST |
| `/api/payments/payout-account` | GET |
| `/api/payments/payout-accounts/instructor/[instructorId]` | GET |
| `/api/reviews/institution/[institutionId]` | GET |
| `/api/reviews/instructor/[instructorId]` | GET |
| `/api/settings/profile` | GET |
| `/api/signatory-approvals/[token]` | GET, POST |
| `/api/teachers/[id]` | GET |
| `/api/teachers` | GET |
| `/api/teaching-catalogue` | GET |
| `/theme-bootstrap.js` | GET |
