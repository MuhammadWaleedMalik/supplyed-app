const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('school phase is required and sent separately from organisation structure', () => {
  const data = read('utils/onboarding/onboardingData.ts');
  const form = read('components/onboarding/SchoolDetailsFields.tsx');
  const validation = read('utils/onboarding/onboardingUtils.ts');
  const payload = read('utils/onboarding/profilePayload.ts');
  const settings = read('feature/dashboard/shared/apis/settingsApi.ts');

  assert.match(data, /schoolType: string/);
  assert.match(form, /name="schoolType"/);
  assert.match(form, /name="institutionType"/);
  assert.match(validation, /\['PRIMARY', 'SECONDARY'\]\.includes\(data\.schoolType\)/);
  assert.match(payload, /schoolType: data\.schoolType/);
  assert.match(settings, /schoolType: fields\.schoolType/);
  assert.match(settings, /fields\.schoolType !== before\.schoolType/);
});

test('documented school billing and teacher availability journeys have UI-backed APIs', () => {
  const payments = read('feature/dashboard/shared/apis/paymentsApi.ts');
  const billing = read('components/dashboard/SchoolBillingCard.tsx');
  const availability = read('feature/dashboard/teacher/apis/availabilityApi.ts');
  const availabilityCard = read('components/dashboard/AvailabilityCard.tsx');

  for (const endpoint of [
    'schoolBillingSetup',
    'schoolBillingSync',
    'schoolBillingPaymentMethod',
  ]) assert.match(payments, new RegExp(`endpoints\\.${endpoint}`));
  assert.match(billing, /I completed Stripe setup/);
  assert.match(billing, /updateAutomaticPayments/);
  assert.match(billing, /StripeCheckoutModal/);
  assert.match(billing, /checked=\{setupConsent\}/);
  assert.match(billing, /!setupConsent/);
  assert.match(billing, /value=\{billing\.automaticPaymentsEnabled\}/);
  assert.match(billing, /onValueChange=\{enabled =>/);
  assert.match(availability, /endpoints\.availabilityForJob/);
  assert.match(availability, /weeklySchedule: \{ weekdays \}/);
  assert.match(availabilityCard, /Date exceptions/i);
});

test('current automatic booking payments, card recovery and tips are integrated', () => {
  const endpoints = read('constants/endpoints.ts');
  const bookings = read('feature/dashboard/shared/apis/bookingsApi.ts');
  const payments = read('feature/dashboard/shared/apis/paymentsApi.ts');
  const bookingPayment = read('components/dashboard/BookingInvoiceCard.tsx');
  const invoice = read('components/dashboard/InvoiceCard.tsx');
  const tip = read('components/dashboard/BookingTipCard.tsx');

  assert.match(endpoints, /bookingPaymentSync/);
  assert.match(endpoints, /bookingTipCheckout/);
  assert.match(endpoints, /bookingTipSync/);
  assert.match(bookings, /automaticPayment\?: BookingAutomaticPayment/);
  assert.match(bookings, /syncBookingPayment/);
  assert.match(payments, /createBookingTip/);
  assert.match(payments, /syncBookingTip/);
  assert.match(bookingPayment, /Refresh payment/);
  assert.match(bookingPayment, /createInvoice/);
  assert.match(bookingPayment, /Manual payment/);
  assert.match(bookingPayment, /title="Pay manually"/);
  assert.match(bookingPayment, /const latest = await syncBookingPayment/);
  assert.match(bookingPayment, /manualNeedsRefresh/);
  assert.match(invoice, /Approve card payment/);
  assert.match(tip, /Continue to Stripe/);
  assert.match(tip, /openPaymentFlow/);
  assert.match(tip, /parsePoundsToPence/);
  assert.match(tip, /checkout\.feeAmountPence/);
  assert.match(tip, /checkout\.totalAmountPence/);
});

test('attendance, compliance approval and reusable profile documents are actionable', () => {
  const bookings = read('feature/dashboard/shared/apis/bookingsApi.ts');
  const attendance = read('components/dashboard/AttendancePanel.tsx');
  const profile = read('feature/onboarding/apis/profileApi.ts');
  const documents = read('feature/dashboard/shared/apis/profileDocumentsApi.ts');

  assert.match(bookings, /\/attendance\/activate/);
  assert.match(bookings, /\/attendance\/correction-requests\//);
  assert.match(attendance, /Confirm present/);
  assert.match(attendance, /Review correction request/);
  assert.match(profile, /endpoints\.schoolComplianceApproval/);
  assert.match(documents, /\/upload-url/);
  assert.match(documents, /\/upload-complete/);
  assert.match(documents, /'DELETE'/);
});

test('school applications and both booking roles use summary-first detail flows', () => {
  const applications = read(
    'feature/dashboard/school/screens/SchoolApplicationsScreen.tsx',
  );
  const applicationHook = read(
    'feature/dashboard/school/hooks/useSchoolApplications.ts',
  );
  const bookings = read(
    'feature/dashboard/shared/screens/PaginatedBookingsScreen.tsx',
  );
  const bookingCard = read('components/dashboard/BookingRecordCard.tsx');
  const navigationContext = read(
    'components/dashboard/NavigationContext.tsx',
  );

  assert.match(applications, /See applications/);
  assert.match(applications, /<JobRecordDetails job=\{selectedJob\}/);
  assert.match(applications, /<Text style=\{styles\.title\}>Applicants<\/Text>/);
  assert.match(applications, /title="Open application"/);
  assert.match(applicationHook, /filter\(job => !!jobId && job\.id === jobId\)/);
  assert.match(bookings, /title="See booking details"/);
  assert.match(bookings, /detailMode=\{detailOpen\}/);
  assert.match(bookings, /title="Complete booking"/);
  assert.match(bookings, /title=\{type === 'school' \? 'Message teacher'/);
  assert.match(bookingCard, /Placement overview/);
  assert.match(bookingCard, /Schedule and location/);
  assert.match(bookingCard, /Booking controls/);
  assert.match(bookings, /returnPage \? `Back to \$\{returnPage\}`/);
  assert.match(bookings, /showPage\(returnPage \|\| 'Bookings'\)/);
  assert.match(
    navigationContext,
    /nav\.page === 'Bookings' && nav\.notificationBookingId/,
  );
  assert.match(
    bookings,
    /\['CONFIRMED', 'COMPLETED'\]\.includes\(booking\.status\)/,
  );
  assert.match(
    bookings,
    /readOnly=\{type === 'teacher' \|\| booking\.status !== 'CONFIRMED'\}/,
  );
  assert.match(bookings, /hideManage=\{booking\.status === 'COMPLETED'\}/);
  assert.match(bookingCard, /hideManage \|\| open/);
});

test('teacher profile tabs and dense sections remain compact and responsive', () => {
  const styles = read('components/dashboard/settingsStyles.ts');
  const page = read('components/dashboard/ProfileSettingsPage.tsx');
  const profile = read('components/dashboard/ProfileSettingsCard.tsx');
  const availability = read('components/dashboard/AvailabilityCard.tsx');
  const history = read('components/dashboard/ProfileHistory.tsx');

  assert.match(styles, /sectionTabsScroller/);
  assert.match(styles, /minWidth: layout\.compact \? 104 : 116/);
  assert.match(page, /horizontal/);
  assert.match(page, /numberOfLines=\{1\}/);
  assert.match(styles, /availabilityDay/);
  assert.match(profile, /TEACHING PREFERENCES/);
  assert.match(availability, /Weekly schedule/);
  assert.match(availability, /Date exceptions/);
  assert.match(history, /A compact record of applications, bookings and reviews/);
  assert.doesNotMatch(history, /RichText|ApplicationTimeline/);
});

test('mobile entry and applications enforce live approval and document eligibility', () => {
  const entry = read('utils/navigation/nextAccountScreen.ts');
  const review = read('feature/reviewStatus/screen/ReviewStatusScreen.tsx');
  const jobs = read('feature/dashboard/teacher/hooks/useTeacherJobs.ts');
  const documents = read('utils/documents/documentUtils.ts');
  const errors = read('utils/api/userFacingError.ts');

  assert.match(entry, /getComplianceApproval/);
  assert.match(entry, /getSignatoryApproval/);
  assert.match(review, /Check compliance approval/);
  assert.match(review, /profile\?\.status === 'ACTIVE'/);
  assert.match(jobs, /requiredDocumentsVerified/);
  assert.match(documents, /documentExpiryDate/);
  assert.match(documents, /requirement\.requiresReview/);
  assert.match(errors, /INSTRUCTOR_DOCUMENTS_NOT_VERIFIED/);
});

test('school forms consume the phase-aware teaching catalogue', () => {
  const catalogue = read('feature/dropdowns/apis/teachingCatalogueApi.ts');
  const fields = read('components/onboarding/TeachingFields.tsx');
  assert.match(catalogue, /\/teaching-catalogue\/school/);
  assert.match(catalogue, /schoolType=/);
  assert.match(fields, /getSchoolTeachingCatalogue/);
  assert.match(fields, /catalogueValues\.subjects/);
});

test('profile history only uses endpoints exposed by the current backend', () => {
  const endpoints = read('constants/endpoints.ts');
  const status = read('components/dashboard/SettingsStatusCard.tsx');

  assert.doesNotMatch(endpoints, /profile-completion/);
  assert.doesNotMatch(status, /profileCompletion|protectedRequest/);
  assert.match(status, /profile\.status/);
});

test('public profiles render backend certificates and school achievements', () => {
  const profiles = read(
    'feature/dashboard/shared/apis/publicProfileApi.ts',
  );
  const content = read('components/dashboard/ProfileContent.tsx');

  assert.match(profiles, /certificates: ProfileDocument\[\]/);
  assert.match(profiles, /achievements: ProfileDocument\[\]/);
  assert.match(profiles, /documents: profile\.certificates \|\| \[\]/);
  assert.match(profiles, /documents: profile\.achievements \|\| \[\]/);
  assert.match(content, /profile\.documents\?\.length/);
  assert.match(content, /Open document/);
});

test('school public profiles page through the backend institution jobs route', () => {
  const jobs = read('feature/dashboard/shared/apis/jobsApi.ts');
  const section = read('components/dashboard/InstitutionJobsSection.tsx');
  const profile = read('components/dashboard/ProfileContent.tsx');

  assert.match(jobs, /jobs \+ '\/institution\/'/);
  assert.match(section, /getInstitutionJobsPage\(institutionId, nextPage\)/);
  assert.match(section, /new Map\(/);
  assert.match(section, /Load more roles/);
  assert.match(profile, /institutionId=\{profile\.id\}/);
});

test('current web job and hiring contracts are used without response caching', () => {
  const jobs = read('feature/dashboard/shared/apis/jobsApi.ts');
  const details = read('components/dashboard/JobDetailsStep.tsx');
  const applications = read('feature/dashboard/shared/apis/applicationsApi.ts');
  const invitations = read('feature/dashboard/shared/apis/invitationsApi.ts');
  const dropdowns = read('feature/dropdowns/apis/dropdownsApi.ts');
  const labels = read('components/dashboard/JobModeStep.tsx');

  assert.match(jobs, /jobType: \(data\.mode === 'instant' \? 'INSTANT' : 'BRIEF'\)/);
  assert.match(jobs, /startDate: data\.startDate \? isoDate\(data\.startDate\)/);
  assert.match(jobs, /paymentFrequency: data\.paymentFrequency/);
  assert.match(jobs, /schedule: schedulePayload\(data\.schedule\)/);
  assert.match(details, /JobScheduleEditor/);
  assert.match(applications, /\/hire'/);
  assert.match(invitations, /isExclusive: boolean/);
  assert.doesNotMatch(dropdowns, /const cache = new Map/);
  assert.match(labels, /Open applications/);
  assert.match(labels, /Targeted matching/);
});
