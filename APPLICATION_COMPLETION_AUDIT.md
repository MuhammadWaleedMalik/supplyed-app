# SupplyEd application completion audit

Updated: 20 October 2026.

The mobile changes below are implemented in the existing React Native project.
This is a source, contract, mocked-behavior and build audit, not certification of
production readiness. Protected flows have not been exercised with live accounts.
The user confirmed that the local backend contains real data and chose code/build
checks without phone interaction. No production deployment, database mutation,
login/OTP, invitation, notification, booking or payment was performed for testing.

The original mobile working-tree changes were preserved. The supplied website and
backend were inspected as reference implementations. Backend corrections are
concrete patches in `docs/backend-fixes`, tested in an isolated source copy; they
are **not applied to the original backend or running service**. The original
backend has an active test watcher, so writing there could trigger unreviewed
operations against its configured services. No `.env` was copied into isolation.

## Architecture and detailed evidence

- Mobile: React Native 0.87, React 19, TypeScript, Redux Toolkit, native Modals,
  Lucide icons, shared themed controls and Keychain/Keystore session storage.
  `App.tsx` and `utils/navigation/appNavigation.ts` route auth/onboarding/account
  screens; `feature/dashboard/shared/store/navigationSlice.ts` routes workspace
  pages, contextual records and return paths.
- Feature API functions call `protectedRequest`, sharing the backend envelope,
  token refresh, errors and pagination helpers. Existing `screens`, `hooks` and
  `apis` separation is retained; no new navigation or UI framework was introduced.
- Website: supplied Next.js app at `supplyed-web`; role routes, forms and API
  proxies were traced for workflow/payload parity. Website source was not edited.
- Backend: supplied NestJS 11 / PostgreSQL / Prisma 7 app at `supplyed-backend`,
  using JWT/Passport, Socket.IO, Stripe, object storage and email/SMS adapters.
- Detailed evidence: [marketplace audit](docs/audit-marketplace.md),
  [auth/account audit](docs/audit-auth-account.md),
  [messaging/payment/admin audit](docs/audit-messaging-payments.md), and
  [web routes/backend audit](docs/audit-routes-backend.md).
- The [earlier implementation handoff](docs/mobile-handoff-status.md) records
  work-unit calculations, rich text, upload bytes, snapshots, message drafts and
  other earlier changes. This audit supersedes its current UI/navigation status.

## Screen and entry-point inventory

All rows below were source-reviewed. "Implemented" does not mean device-verified.
The linked module reports contain API, authorization, persistence and error paths.

| Screens / components | Natural entry points and actions | Current implementation / limits |
| --- | --- | --- |
| `SplashScreen`, `SessionScreen` | App launch; stored-session restore; retry or exit | Restore checks current session, role, profile, documents and review status; failed restore has retry. |
| `LandingPage`, `WaitlistForm` | Public launch; Create account, Log in, Join waitlist, About | Compact mobile welcome. Existing waitlist is a separate modal; optional product/FAQ content is expandable. Real waitlist endpoints retained. |
| `LoginScreen`, `RegisterScreen` | Welcome and reciprocal auth links | Compact mobile headers, credential validation, real auth APIs, configured Google chooser; no fake provider. |
| `VerificationScreen`, `TwoFactorScreen`, `ForgotPasswordScreen` | Server auth challenge, forgot-password link, resend/back | OTP validation, retry feedback and session-safe completions; verification can continue into a 2FA challenge. Domain 401 errors no longer expire a valid session. |
| `OnboardingScreen`, account/preferences/compliance/rates steps | Verified new account or resumed unfinished profile | Teacher/school fields, shared live dropdowns, conditional MAT data, UK phone and step validation. Phone-sized intro and scroll reset on step change. |
| `DocumentsScreen`, `DocumentsUpload`, `SignatoryApprovalPanel` | Created profile, resume, Review status return | Required document progress/errors/retry, editable/resendable signatory request, optional phone verification, submission and resubmission. |
| `ReviewStatusScreen` | Submitted profile, login restore, return from documents | Refresh status; edit rejected profile; return to documents; active profile enters workspace. Profile editing returns here instead of bypassing review. |
| `SchoolDashboard`, `TeacherDashboard`, dashboard screens, `DashboardSummary` | Workspace root and Home tab | Focused greeting, discovery CTA, real counts, pending offer, next booking and secondary shortcuts. Independent section failures and pull refresh. |
| `TeacherJobsScreen`, `TeacherJobList`, `RecommendedJobs` | Jobs tab, home Browse jobs, job notification | Search and compact filter sheet, all/matching scope, paged results, expandable job details and profile. No bulky always-visible filter form. |
| `ApplicationWizard`, `ApplicationDetailsStep`, `ApplicationReviewStep` | Eligible job Apply | Sanitized proposal, terms review, submit, recover existing application after uncertain response. |
| `SchoolJobsScreen`, `PostedJobsPanel`, `JobPostingFlow`, three job steps | Jobs tab, Post a job, record edit/duplicate | Draft creation, requirements, dates/pay/units/location, review, activation and retry against same created job. Per-step scroll reset. |
| School job detail, `JobActions` | View job & applicants | Owner details, edit, duplicate, close/delete confirmations, applicant list and invitation context. |
| `SchoolJobHistoryScreen` | Account menu Job history | Closed/expired/suspended records, search/status sheet, detail and duplicate. |
| `TeacherApplicationsScreen`, `MyApplicationsList` | Applications tab, home/account menu, notification | Search/status sheet, applications/invitations switch, focused application detail, cover letter, history, school profile and message action. |
| `SchoolApplicationsScreen`, `SchoolApplicationList`, `RankedApplicants`, `SchoolApplicationDetail` | Account menu, home Applications, job applicants, notification | Search and job/status/order filter sheet, real ranked matches, detail/timeline, shortlisting/rejection/hire; reject confirmation. School Applications remains reachable after tab simplification. |
| `TeachersScreen`, `TeacherDirectoryCard`, `TeacherProfileSummary`, `TeacherBookingDates` | School Teachers tab, home, Invite a teacher | Virtualized directory, searchable profiles, filter sheet, matching job selection, dates-only availability, focused profile, Message teacher and Invite. |
| `InvitationForm`, `InvitationReview` | Teacher card/profile, matching selection, saved-send recovery | New job or Existing job, full terms review, optional message/deadline, send, exact-request retry and announcement recovery. No 'private job' choice in UI. |
| `InvitationsScreen`, `InvitationDetails` | Account menu, home, applications Invited tab, message/notification/deep link | Real sent/received lists, status filter, frozen offer, accept/decline/cancel confirmation and exact resulting booking. Dedicated detail modal; failed list fetch does not discard a successful detail fetch. |
| `BookingsScreen`, `PaginatedBookingsScreen`, `BookingFilterBar` | Bookings tab, home next booking, accepted offer, notification | Agenda, search/status/date/invoice refinement, pagination, detail, directions, profiles, messages, cancellation/outcomes/reviews/invoice. Completion/no-show shown only after actual start instant. |
| `BookingInvoiceCard`, `InvoiceCard`, `InvoiceDetails` | Completed booking, billing invoice | Actual worked units, server amount calculation, payment/PDF/resend; role-gated void/refund actions, duplicate guards and state reconciliation. |
| `BillingScreen`, `TeacherBillingScreen`, payout cards | Account menu, home Billing/Earnings, invoice context | Compact invoice filters, native PaymentSheet, hosted Connect setup, balances and payouts. Payout request-ID upgrade remains staged with backend dependency. |
| `MessagesScreen`, `ContactConversation`, `ConversationThread`, `ConversationDetails` | Inbox tab, applications/bookings/profile, notification | Contact/topic navigation, selection, history, text/attachments, retry, read/typing and invitation review links. Reconnect auth does not log out the REST session. |
| `NotificationsScreen`, `NotificationCard`, `NotificationSettingsCard` | Bell, Settings preferences | All/unread, pages, read one/all, proper conversation-ID links, contextual records and profile. Native push is not implemented by this backend. |
| `ProfileScreen`, `SettingsScreen`, `ProfileSettingsPage`, profile/account/history cards | Account sheet, Review status edit | Profile Teaching/School, Account, History sections; Settings Preferences/Account; persistent Save bar and independent preferences. Real saves and visible partial/error feedback. |
| `SecurityScreen`, password/2FA/recovery cards | Account menu or admin Security | Existing password and 2FA APIs, field validation, setup confirmation, recovery display and retry. |
| `AdminPaymentsScreen`, admin users/invoice/payout components | ADMIN account root | Users, payments and payout lookup remain role-restricted. Focused user-edit modal and separated payment tasks; API/admin/session guards retained. |
| Shared `Select`, `DynamicSelect`, `FilterSheet`, search/date/rich-text controls | All relevant forms/lists | Virtualized searchable dropdowns, Done for multiselect, empty/error/retry states, safe-area/keyboard treatment, compact filters and clearer touch targets. Native rendering still needs device checks. |

Unregistered older overview/panel components are not treated as missing routes.
They were left intact to avoid removing existing functionality solely for cleanup.
No empty mobile action handler or `href="#"` substitute was added. Missing backend
capabilities are disclosed rather than represented by fake successful actions.

## Navigation decisions and verified transitions

- School tabs: Home, Jobs, Teachers, Bookings, Inbox.
- Teacher tabs: Home, Jobs, Applications, Bookings, Inbox.
- Account sheet: Profile, Applications, Invitations, Billing/Earnings, school Job
  history, Security, Settings, Log out. Bell retains the notification inbox.
- Home shows actionable work; messages and notifications remain complete dedicated
  destinations. Only redundant home summaries were removed. Expensive application
  aggregation now loads only on Jobs/Applications, rather than on every workspace
  page. Home independently loads the smaller data needed for its real summaries.
- Contextual booking, invitation, application and conversation links retain a
  return destination. Android back returns to the source, then Home where needed;
  Home allows the normal OS back behavior.
- Fifty-one assertions against the actual Redux reducer and tab definitions
  cover role tabs, exact booking IDs, repeated record opens, notification to
  invitation to booking returns, conversation returns, source application IDs,
  tab reset, invalidation, logout reset and archived-job detail returns. All passed
  without network calls.

## Confirmed fixes and changed areas

| Defect | Implemented correction | Main files |
| --- | --- | --- |
| Thousands of dropdown rows mounted at once; failed reads could cause refresh loops | FlatList picker, filtering/aliases, multi-select completion, retry without GET invalidation loop, stale collection correction | `Select.tsx`, `DynamicSelect.tsx`, `feature/dropdowns`, `utils/api/request.ts`, `dropdownEvents.ts` |
| Web/mobile teaching aliases differed | Consistent punctuation/alias handling and limits, named/custom values separated | `TeachingFields.tsx`, `teachingChoices.ts`, profile/job adapters |
| Directory filters consumed results area and lacked supported server fields | Compact search/filter sheet, native paged list, custom subjects/skills, hourly cap, DBS and existing filters | `TeachersScreen.tsx`, `TeacherFilterFields.tsx`, `teachersApi.ts` |
| Website-style home and lengthy inline account forms | Focused home and native account sheet; compact welcome/auth/onboarding; grouped settings with persistent save | `DashboardSummary.tsx`, dashboard layout/styles/nav, landing/auth/onboarding components, `ProfileSettingsPage.tsx` |
| Invitation terminology, incomplete existing-job review and fragile retry | New/Existing job; full frozen terms review; freshly loaded owned job; expired drafts excluded; uncertain request retained | `InvitationForm.tsx`, `InvitationReview.tsx`, `invitationsApi.ts` |
| Hidden secondary routes and incorrect context return | Persistent Invitations/Applications entry points; historical job detail/applicants; exact booking navigation; notification-origin preservation | `navigationSlice.ts`, `appNavigation.ts`, `ProfileMenu.tsx`, dashboard layout |
| Tall filters and oversized list content | Shared filter sheets; concise application/job cards; detail views retain full content | Job/application/booking filter components, lists, `SchoolApplicationDetail.tsx` |
| Clearing optional values failed to clear server fields | Explicit null payloads, omission for untouched fields, fresh account guards | `jobsApi.ts`, `settingsApi.ts`, `useProfileSettings.ts` |
| Lost response caused confusing application re-submit/status failure | Recover authoritative unique application/status without an extra mutation | `applicationsApi.ts`, `useTeacherJobs.ts` |
| Rejected profiles could not resubmit, signatory recovery incomplete | Real resubmission, edit/retry navigation, matching MAT enum and validation | document/profile APIs, documents/onboarding hooks, `ReviewStatusScreen.tsx` |
| Incorrect security code could expire a valid session | Only explicit expired-access-token responses enter coordinated refresh | `request.ts`, auth/security hooks |
| Missing teacher general-message entry and conversation notification targeting | Create/open general conversation; prefer conversation ID in notification links | `TeachersScreen.tsx`, conversation API, `notificationNavigation.ts` |
| Socket auth transient errors signed out valid REST sessions | Fresh-ticket reconnect and independent error recovery | `useConversationSocket.ts` |
| Late requests could update a different account or abandoned screen | Session/unmount guards around account, documents, invitations, invoices, admin and payouts | Scoped hooks/screens/API adapters |
| Small close/password controls and truncated long choices | 48dp targets, wrapping choices, selected/accessibility labels | Shared UI and flow styles |

## Backend corrections: staged, not deployed

See `docs/backend-fixes` for patches and rollout instructions. Source-level fixes
were made in an isolated backend copy; the original service and database are unchanged.

| Finding | Prepared correction | Deployment/runtime status |
| --- | --- | --- |
| Job PATCH allowed suspended/nonoperating schools to edit | Operating-profile and suspended-job guards, with existing admin exception | Patch only |
| Application hire checked profile state before locks | Recheck school/teacher/job under ordered transaction locks | Patch only; real concurrency needs disposable DB |
| Arbitrary user details could be read; verified phone could be replaced | Ownership-limited user endpoint and verified-phone checks under locks | Account security patch only |
| OTP send/consume and 2FA setup race conditions | Atomic claims, throttling locks, attempt/expiry checks and secret compare-and-set | Account security patch; mocked checks, no SMS/DB calls |
| Direct owner profile submission bypassed required documents | Existing website readiness policy checked inside profile status transaction; admin override retained | Profile-document patch only; 23 mocked assertions |
| Instant payout keys conflated equal repeated withdrawals | Durable request ID and immutable account/amount/destination snapshot; additive migration | Backend patch and matching mobile patch staged together, inactive in current app |
| Missing JWT configuration fell back to known secrets; sensitive log fields leaked | Fail-closed secret validation and sensitive URL/body redaction | Configuration/log patch only |
| Stateless refresh tokens survived logout/reset | Hashed persistent sessions, strict rotation, logout, reset revocation and issuance/reset locking | Separate session patch plus mobile logout companion; blocked from deployment until website refresh coordination is complete |
| Website email reverification assumed a full login response | Existing login/signup 2FA challenge flow also handles reverification | Separate website patch; overlay typecheck and 12 mocked checks |

Refresh/session implementation is staged separately because its strict rotation
needs coordinated website refresh-cookie handling. Legacy refresh tokens require
sign-in after rollout; existing access tokens remain valid until their configured
expiry. Migration state and remaining deployment constraints are recorded in the
detailed auth/backend reports.
Do not infer that deploying a phone UI guard fixes backend authorization.

## Mobile UI research

Public product information and official platform guidance were reviewed; no
competitor's authenticated account was used. These are original adaptations to
SupplyEd, preserving its current website/backend business workflow.

- [Zen Educate](https://www.zeneducate.com/download): prioritize requests,
  upcoming work and profiles; separate account setup from daily tasks.
- [Humly educators](https://www.humly.io/for-educators): keep job discovery and
  booked work distinct and easy to reach.
- [Indeed Flex](https://indeedflex.com/blog/for-flexers/how-to-book-shifts/):
  browse/refine, review terms, then book; applied/offered/booked states are distinct.
- [Zenjob job feed](https://support.zenjob.com/hc/en-150/articles/5358946315935-How-do-I-apply-for-a-job):
  refine the feed while retaining the result-first screen.
- [Android navigation](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns):
  five primary destinations, contextual secondary actions and clear return paths.
- [Apple search](https://developer.apple.com/design/human-interface-guidelines/search-fields):
  clear/search controls, meaningful placeholders and optional refinement.
- [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views):
  readable content, descriptive controls and at least 48dp targets for key actions.

## Checks actually executed

| Check | Result and scope |
| --- | --- |
| Read-only dropdown requests | Valid public response on localhost and configured Android LAN address; all 45 collections; cities 3,844, skills 337, regions 251. No seeding or resets. |
| Mobile TypeScript | Final `npm.cmd run typecheck` passed after all active mobile edits. |
| Whole-project ESLint | Final `npm.cmd run lint` passed without warnings/errors after all active mobile edits. |
| Android native debug assembly | Passed: `gradlew.bat :app:assembleDebug --offline --console=plain`, 33 seconds. Debug APK is not a signed production release or an interactive UI test. |
| Android production Metro bundle | Passed after final mobile edits: `react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/build/codex/index.android.bundle --assets-dest android/app/build/codex/assets --max-workers 2`; 83 assets copied. |
| Navigation | 51 actual-reducer assertions passed (44 core/context transitions and 7 archived-job returns). |
| Dropdown/teaching helpers | 6 focused mocked assertions passed. |
| Directory API | 24 mocked assertions passed. |
| Marketplace APIs | 62 mocked assertions passed (8 job eligibility, 48 retry/application/validation, 6 PATCH semantics). |
| Messaging/payment/admin adapters | 51 mocked assertions passed; no Stripe or message mutations. |
| Mobile auth/account | 22 mocked/pure assertions passed, including final independent Account/Profile saves. |
| Backend OTP/2FA/account patch | 59 mocked assertions passed; no live database or SMS. |
| Profile document submission patch | 23 mocked assertions passed for readiness, newest-file selection, query scope, owner transitions and admin bypass. |
| Backend configuration/logging | 37 assertions passed for production secret validation and credential/token URL redaction. |
| Payout upgrade | 12 mocked backend Stripe/idempotency, 4 repository conflict and 12 secure mobile retry assertions passed. Staged mobile overlay TypeScript/lint also passed. Upgrade remains staged. |
| Isolated backend compilation | Final Nest build and targeted auth/session/2FA/config/log/profile-helper lint passed with all 7 backend patches, including the final reset/challenge race fix. |
| Delivered patch validation | All 7 patches applied in order to a fresh source-only copy; 37 resulting paths matched the compiled copy (private Prisma output excluded). See `docs/backend-fixes/validation-manifest.json`. |
| Existing isolated backend tests | 8 safe pure/mocked suites, 125 tests passed for their unchanged marketplace/contact scope; real database and HTTP-server suites excluded. New session behavior has the separate focused assertions below. |
| Staged session lifecycle | 38 mocked session/reset/challenge checks, 3 mobile logout identity/offline checks and 9 independent peer-review assertions passed. Staged mobile logout full source-overlay TypeScript check passed. |
| Staged website email/2FA parity | Full website source-overlay typecheck and 12 mocked normalizer/action/login/signup branch checks passed. Original website unchanged. |
| Diff whitespace | `git -c core.autocrlf=false -c core.whitespace=cr-at-eol diff --check` passed. |
| iOS | Not run: Windows workspace, no macOS/Xcode. |
| Device/live E2E | Not run: user chose no phone interaction and local backend has real data. |

Temporary validation code was executed against actual implementations with mocked
external dependencies. It is not a replacement for persistent regression suites
or authenticated end-to-end coverage. No new test-only dependency was added.
Android build warnings concern existing Gradle compatibility/deprecation settings;
Metro reports a dependency export-resolution warning. Neither is evidence of a
verified runtime failure. Native build output is kept under ignored build folders.

## Remaining work and release gates

1. **Apply/review backend patches in a disposable environment first.** No current
   live backend vulnerability is claimed fixed by the patch files alone. Follow
   the ordered rollout, regenerate the private Prisma client and validate additive
   payout migration before deploying the matching mobile contract.
2. **Session rollout has a hard website dependency.** The prepared strict rotation
   patch must not be deployed while website server components rely on a process-local
   30-second refresh cache. Writable cookie updates and refresh coordination across
   workers need a supported shared/session strategy. Keep strict compare-and-set;
   do not hide failures with an indefinite legacy-token bypass. The staged mobile
   logout companion follows backend deployment. Offline logout still only clears
   local state; the current running server remains stateless until rollout.
3. **Database deployment state.** Confirm existing teaching/dropdown/invitation/
   work-unit migrations and seed state in the intended test and release systems.
   Current source/schema inspection does not establish that migrations are applied.
4. **Real-flow acceptance using test accounts.** Login, Google/2FA, email/SMS,
   required uploads/MAT signatory, rejection/resubmission, both invitation paths,
   hire/accept races, completion/reviews, message attachments/reconnect, invoice
   checkout/refund and payouts need isolated service credentials and test records.
5. **Device UI acceptance.** Check narrow/large-text screens, long dropdowns,
   nested native pickers, keyboard coverage, scroll resets, screen-reader focus,
   deep-link login return and Android back behavior on a phone. Build success is
   not a visual acceptance result. iOS needs its own build and simulator/device run.
6. **Known backend/product limitations.** Invitation announcement recovery can
   only find duplicates in its recent-message window; independent invitation-only
   histories require a changed server contract. School-wide applications use
   per-job requests. Native push and HTTPS universal/app links need backend/domain
   integration. Some Connect account types lack a supported native management URL.
7. **Website findings.** The reference website includes a static teacher calendar
   and incomplete global-search behavior; see route audit. The mobile uses real
   bookings and scoped search. Those website features were not silently fabricated
   or rewritten as part of this mobile implementation.
8. **Release configuration.** Configure HTTPS API URLs, OAuth public IDs/platform
   fingerprints, iOS signing/privacy, Android release signing and service webhooks.
   No release, store upload, deployment or production credential change was done.

The source-reviewed mobile modules have appropriate entry points and real API
handlers. Implemented changes and available build checks support continued testing;
critical live flows and unapplied backend corrections prevent a production-ready
claim at this point.
