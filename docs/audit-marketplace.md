# Marketplace flow audit

Audit date: 20 October 2026. This is the jobs, applications, teacher matching,
invitations, bookings and reviews portion of the application audit. Findings
come from the mobile repository and the supplied local website/backend source.
No requests were sent to the running backend, and no real user data was changed.

## Inventory and entry points

| Area | Mobile entry point and implementation | API and source review |
| --- | --- | --- |
| Teacher job discovery | Jobs tab; `TeacherJobsScreen`, `TeacherJobList`, `RecommendedJobs` | Public live jobs and teacher recommendations have real paginated adapters. Search, subject, key stage and urgent filters reach the jobs endpoint. |
| Teacher application | Job card/detail → `ApplicationWizard` → review → submit | Proposal is sanitized and measured against the backend 2,000-character serialized limit. Submission reaches `POST /applications`. |
| Teacher application history | Applications tab; `MyApplicationsList`, expandable `ApplicationTimeline` | Own applications remain visible when the public job no longer exists; the saved job name is retained. History has its own pagination. |
| School jobs | Jobs tab; `SchoolJobsScreen`, `PostedJobsPanel`, `JobPostingFlow` | Existing drafts use owner detail, new jobs create a draft then activate, and activation failures retain the created ID. Editor sends changed fields. |
| School job detail | Job row → full-screen detail | Existing edit, duplicate, application list, close and delete actions are connected. Close/delete have confirmations; backend restricts deletion when history pins the job. |
| School job history | History navigation; `SchoolJobHistoryScreen` | Closed, expired and suspended jobs are separately paginated. Duplicate creates a fresh draft and clears dates. |
| School applications | Applications tab or selected job → `SchoolApplicationsScreen`, `SchoolApplicationDetail` | Status changes, ranked applications, teacher profile and conversation entry points exist. Allowed progression mirrors the backend state machine. |
| Teacher directory | Find teachers → profile → invite | Directory/matching responses are real. Teacher booking previews retain dates/units only. Filters now open separately from the results. |
| Invitation creation | Teacher card/profile → `InvitationForm` | Existing job or New job → full terms review → Send invitation. Optional message/deadline are collapsed. `initialJobId` supports retaining a matching-job selection. |
| Invitations | Invitations navigation, notification or conversation invitation link → `InvitationsScreen` | Sent/received lists, frozen offered details and role-specific accept/decline/cancel endpoints are connected. Terms are reviewed before sending. |
| Bookings | Bookings tab, contextual booking/notification links → `PaginatedBookingsScreen` | Own paginated bookings, agenda filters, details, completion, no-show, cancellation, messages, profiles and invoice entry points exist. |
| Reviews | Completed booking → review; profile → `ReviewHistory` | One review per party, 14-day window, integer rating and optional comment. Review history is paginated. |

Source-reviewed means the entry point and handler were traced in code; it does
not mean the interaction was exercised on a physical phone.

## Endpoint and authorization map

All paths below are relative to the configured `/api` base.

| Endpoints | Role/ownership enforced in backend source | Persistence/response |
| --- | --- | --- |
| `GET /jobs`, `/jobs/:id` | Public discovery only returns ACTIVE jobs within their listing window. | Paginated `jobs`, or job DTO including nullable planned units and public school identity. |
| `GET /jobs/mine`, `/jobs/mine/:id` | School/admin controller; owner lookup for individual drafts/history. | Owner jobs retain all statuses. |
| `POST /jobs`, `PATCH /jobs/:id`, `DELETE /jobs/:id` | School/admin; create checks operating school; update/delete check ownership. See update authorization correction below. | Job creation/update; FK restrictions protect booking/invitation history. |
| `POST /applications`, `GET /applications/me` | Teacher; creation requires an active profile and an accepting job. | Unique teacher/job application plus initial history row in a transaction. |
| `GET /applications/job/:jobId`, `PATCH /applications/:id/status` | Owning school/admin; moderation and operating-profile checks in service. | Status and history updated atomically; hire opens booking and closes job. |
| `GET /applications/:id`, `/:id/history` | Applicant, owning school or admin. | Application DTO or paginated history. |
| `GET /matching/jobs/recommended`, `/:jobId/score` | Teacher's own profile and a public job. | Scores and explanations; no stored client-generated score. |
| `GET /matching/jobs/:jobId/applications`, `/:jobId/instructors` | Owning school/admin. | Paginated ranked response; candidates with hard schedule/travel conflicts excluded. |
| `GET /instructors/directory` | Active school only. | Active teacher directory, server filters and sanitized public profile data. |
| `POST /job-invitations` | School only; active profiles; school must own existing job. | Existing job or atomic new DRAFT; immutable offered snapshot, unique request key/hash and deadline. |
| `GET /job-invitations/me`, `/:id` | Teacher/school participant only. | Paginated sent/received invitations and offered snapshot. |
| `POST /job-invitations/:id/accept` | Invited teacher only. | Transactionally rechecks profiles, job, overlap and offered terms; creates booking exactly once. |
| `POST /job-invitations/:id/decline`, `/:id/cancel` | Invited teacher / inviting school respectively. | Only eligible, invitation-created declined jobs become public. Cancellation/expiry do not publish. |
| `GET /bookings/me`, `/bookings/:id` | Own bookings; detail participant/admin check. | Frozen work dates, pay and planned units; current invoice and party reviews. |
| `PATCH /bookings/:id/complete`, `/no-show` | School/admin participant; work must have started. | Final outcome guarded on CONFIRMED status. |
| `PATCH /bookings/:id/cancel` | Either party/admin. | Required trimmed reason, maximum 1,000 characters; final cancellation outcome. |
| `POST /reviews` | Booking participant, COMPLETED booking, within 14 days. | Unique booking/reviewer-side review; rating recalculated transactionally. |
| `GET /reviews/instructor/:id`, `/institution/:id` | Backend's existing review-read policy. | Paginated review DTO. Admin-only deletion is outside marketplace mobile roles. |

## Fixes implemented in mobile

1. Replaced **New private job** with **New job** and added the same explicit
   review/confirmation stage for both existing and newly created jobs.
2. Review now includes agreed pay, planned units, work dates/timezone, address,
   subjects/skills, role description, personal message and response deadline.
   It explains when booking occurs and when a declined new job becomes public.
3. Existing jobs are freshly fetched through the owner endpoint before review.
   Expired DRAFT jobs are excluded: the previous `listingStatus()` shortcut
   returned DRAFT before inspecting expiry.
4. Optional message/deadline fields no longer dominate the initial screen.
   Message input enforces 1,000 characters; new jobs default to daily pay like
   the website. Shared job fields remain in `JobDetailsStep` with an optional
   footer, avoiding a second implementation.
5. Saved invitation retry no longer depends on the job-list network request.
   Exact teacher/terms/request ID remain preserved for uncertain responses.
6. Definitive invitation-create 400/403/404/409/422 responses release the saved
   request so the school can correct eligibility or choose another teacher.
   Transport, authentication, timeout, rate-limit and server errors retain it.
   Failures after an invitation is returned also retain the saved invitation.
7. Clearing optional job pay or experience now sends explicit `null`; previously
   `undefined` vanished from JSON, leaving the old database value unchanged.
   Unchanged nullable planned units remain omitted.
8. Application submission recovers the existing unique teacher/job application
   after a lost response or duplicate rejection using an authoritative GET,
   without repeating the POST.
9. Application status updates recover a confirmed requested status after a
   lost response or repeated transition by reading the exact application.
   Other final statuses remain errors.
10. Successful teacher application submission invalidates related marketplace
    data so recommendations and counters refresh.
11. Booking cancellation and review API adapters now validate the same trimmed
    reason/comment lengths and integer rating bounds as backend DTOs.
12. Invitation forms expose `onStepChange` so their owning scroll container can
    reset to the top on review/back/mode changes without nesting ScrollViews.

Files: `components/dashboard/InvitationForm.tsx`,
`InvitationReview.tsx`, `JobDetailsStep.tsx`;
`feature/dashboard/shared/apis/{invitations,jobs,applications,bookings,reviews}Api.ts`;
`feature/dashboard/teacher/hooks/useTeacherJobs.ts`.

## Backend corrections prepared

The following patches are staged inside the mobile workspace and have been
applied to an isolated source copy for compilation and mocked checks. They have
not been applied to the real backend repository or deployed. Application order
and validation results are in [the backend bundle](backend-fixes/README.md).

- `backend-fixes/job-update-authorization.patch`: `JobsService.update()` checked
  ownership but omitted the operating-school check used by job creation,
  invitations and application actions. It also permitted edits to the contents
  of a suspended job when no status field was included. The patch adds both
  checks and preserves admin moderation.
- `backend-fixes/application-hire-profile-checks.patch`: normal application hire
  checked active teacher/school state before acquiring row locks, leaving a
  suspension race before booking creation. The patch follows the existing
  invitation lock order (job → teacher → school), then rechecks active profiles
  and job moderation in the hire transaction. Existing admin school-profile
  exceptions are explicitly preserved; teacher activity remains mandatory.

Both patches pass `git apply --check --ignore-space-change` against the supplied
backend source. The whitespace flag is required by the source's CRLF line
endings. The isolated backend build also passed with all seven staged patches,
including account/session, configuration/logging, payout and profile-document
fixes. Transactional database tests remain unverified.

## Database/source integrity reviewed

- Prisma/PostgreSQL models include `Job`, `Application`, `ApplicationStatusHistory`,
  `Booking`, `JobInvitation` and `Review`.
- Unique teacher/job applications, unique application bookings, unique invitation
  request keys, unique accepted-invitation booking links and unique review sides
  are defined. The invitation migration also defines a partial unique index for
  a pending teacher/job invitation.
- Hiring takes row locks and guards single-position occupancy and teacher
  overlap. Booking dates/pay/hours/days are copied from the job at hire time.
- Invitation acceptance compares the current job to the frozen offered snapshot.
  Application hire cancels other pending offers for the same job.
- Relevant migrations exist in source for invitations, live-from dates,
  teaching dropdowns/catalogue and nullable planned work units.
- Migration application state, real database constraints, race behavior and
  deployed source version were not inspected against the running database.

## Checks actually run

- Whole-mobile-project TypeScript check passed after the invitation UI changes.
- Targeted ESLint passed after all scoped mobile changes.
- Eight inline, mocked job-eligibility assertions passed, including the expired
  draft regression, future dates, status and pay rules.
- Forty-eight inline mocked API assertions passed for invitation retry retention
  and release, application submission/status recovery, review validation and
  cancellation validation. No network or persistent storage was used.
- Six inline mocked PATCH assertions passed for clearing optional pay/experience
  and leaving unchanged planned units untouched.
- The final mobile build/check results are reported in the aggregate application
  audit; intermediate checks during concurrent edits are not release evidence.
- Isolated backend checks are listed in `backend-fixes/README.md`, separately
  from these mobile mocked assertions.

## Remaining verification and limits

- No physical phone is available. Modal layout, keyboard behavior, focus,
  accessibility announcements, scroll reset and native date pickers need device
  verification.
- The local backend contains real data. No login, invitation, notification,
  application, booking, review or payment mutation was attempted.
- No backend restart, deployment, migration or production operation was run.
  Backend staged patches require a controlled deployment after validating the
  actual environment and migration state.
- Successful invitation delivery, notification creation, exact-once booking
  under concurrent requests and cross-account permission denial need an isolated
  test database before runtime verification.
- Backend invitation announcement deduplication reads the latest 100 messages;
  a very old uncertain announcement can fall outside that window. The invitation
  itself remains idempotent, but message-level idempotency needs a backend contract
  before making a safe broader change.
- School application aggregation requests applications for each owned job when
  the Jobs/Applications pages need it. Home no longer triggers that aggregation.
  A server school-wide application/summary endpoint would remove the remaining
  N+1 request cost without hiding applications.
- Matching is ownership-protected; the teacher directory additionally requires
  an active school. Whether suspended schools should lose read-only access to
  their previous job matches is a business-policy question, not silently changed.
