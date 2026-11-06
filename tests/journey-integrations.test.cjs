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
  assert.match(availability, /endpoints\.availabilityForJob/);
  assert.match(availability, /weeklySchedule: \{ weekdays \}/);
  assert.match(availabilityCard, /DATE EXCEPTIONS/);
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

test('school forms consume the phase-aware teaching catalogue', () => {
  const catalogue = read('feature/dropdowns/apis/teachingCatalogueApi.ts');
  const fields = read('components/onboarding/TeachingFields.tsx');
  assert.match(catalogue, /\/teaching-catalogue\/school/);
  assert.match(catalogue, /schoolType=/);
  assert.match(fields, /getSchoolTeachingCatalogue/);
  assert.match(fields, /catalogueValues\.subjects/);
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
