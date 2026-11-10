require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { requiredDocumentsVerified } = require('../utils/documents/documentUtils');
const { scheduleDateWindow } = require('../utils/jobs/workSchedule');
const { textPage, textPreview, TEXT_PAGE_SIZE } = require('../utils/ui/textWindow');
const {
  canSchoolCompleteBooking,
  canSchoolReportNoShow,
} = require('../utils/bookings/bookingActions');

const requirement = (overrides = {}) => ({
  id: 'dbs', isRequired: true, requiresReview: true,
  context: 'INSTRUCTOR_PROFILE', isActive: true,
  documentType: { id: 'dbs-type', code: 'DBS', name: 'DBS', isActive: true },
  ...overrides,
});
const document = (overrides = {}) => ({
  id: 'doc', requirementId: 'dbs', status: 'APPROVED', fileKey: 'upload.pdf',
  uploadedAt: '2026-10-01T10:00:00Z', ...overrides,
});
const now = Date.parse('2026-11-10T00:00:00Z');

test('teacher eligibility rejects every unfinished, rejected or expired upload, including older duplicates', () => {
  assert.equal(requiredDocumentsVerified([requirement()], [document()], now), true);
  for (const invalid of [
    { status: 'PENDING' }, { status: 'REJECTED' }, { status: 'NOT_REQUIRED' },
    { fileKey: '' }, { uploadedAt: '' }, { documentExpiryDate: '2026-11-10T00:00:00Z' },
    { documentExpiryDate: 'invalid' },
  ]) {
    assert.equal(requiredDocumentsVerified([requirement()], [document(invalid)], now), false);
    assert.equal(requiredDocumentsVerified([requirement()], [
      document({ id: 'new', uploadedAt: '2026-11-09T12:00:00Z' }),
      document({ id: 'old', ...invalid }),
    ], now), false, 'an approved new upload cannot hide an invalid old upload');
  }
  assert.equal(requiredDocumentsVerified([requirement()], [document({ documentExpiryDate: '2026-11-11' })], now), true);
});

test('teacher eligibility handles optional, inactive, deleted and application-specific documents', () => {
  assert.equal(requiredDocumentsVerified([requirement()], [], now), false);
  assert.equal(requiredDocumentsVerified([requirement({ isRequired: false })], [], now), true);
  assert.equal(requiredDocumentsVerified([requirement({ isRequired: false })], [document({ status: 'PENDING' })], now), false);
  for (const ignored of [{ deletedAt: '2026-11-09' }, { applicationId: 'application' }]) {
    assert.equal(requiredDocumentsVerified([requirement()], [document(ignored)], now), false);
    assert.equal(requiredDocumentsVerified([requirement()], [document(), document({ ...ignored, status: 'REJECTED' })], now), true);
  }
  for (const ignored of [{ isActive: false }, { context: 'JOB_APPLICATION' }, { documentType: { isActive: false } }])
    assert.equal(requiredDocumentsVerified([requirement(ignored)], [document({ status: 'PENDING' })], now), true);
  assert.equal(requiredDocumentsVerified([requirement({ requiresReview: false })], [document({ status: 'NOT_REQUIRED' })], now), true);
});

test('short schedules expose only actual calendar weekdays; full weeks expose all days', () => {
  assert.deepEqual([...scheduleDateWindow('2026-11-08', '2026-11-08').available], [0]);
  for (let length = 1; length <= 6; length++) {
    const result = scheduleDateWindow('2026-11-06', `2026-11-${String(5 + length).padStart(2, '0')}`);
    assert.equal(result.days, length);
    assert.deepEqual([...result.available], Array.from({ length }, (_, i) => (5 + i) % 7));
  }
  assert.equal(scheduleDateWindow('2026-11-08', '2026-11-14').available.size, 7);
  assert.equal(scheduleDateWindow('2026-11-08', '2099-11-14').available.size, 7);
  assert.equal(scheduleDateWindow('2026-03-28', '2026-03-30').days, 3); // DST weekend
  for (const dates of [['2026-02-30', '2026-03-02'], ['2026-11-10', '2026-11-09'], ['', ''], ['2026-11-08', '']])
    assert.equal(scheduleDateWindow(...dates), undefined);
});

test('only a school can complete a confirmed booking, without a start-date UI restriction', () => {
  assert.equal(canSchoolCompleteBooking('school', 'CONFIRMED'), true);
  assert.equal(canSchoolCompleteBooking('teacher', 'CONFIRMED'), false);
  for (const status of ['COMPLETED', 'CANCELLED', 'NO_SHOW'])
    assert.equal(canSchoolCompleteBooking('school', status), false);

  const now = Date.parse('2026-11-10T12:00:00Z');
  assert.equal(
    canSchoolReportNoShow('school', 'CONFIRMED', '2026-11-11T09:00:00Z', now),
    false,
  );
  assert.equal(
    canSchoolReportNoShow('school', 'CONFIRMED', '2026-11-10T09:00:00Z', now),
    true,
  );
});

test('huge text windows stay bounded without losing text or splitting surrogate pairs', () => {
  const huge = 'word '.repeat(10000000); // One crore words; never passed to native Text as one value.
  assert.ok(textPreview(huge).length <= 601);
  for (const index of [0, 1, 2500, 999999]) {
    const result = textPage(huge, index);
    assert.ok(result.text.length <= TEXT_PAGE_SIZE + 1);
    assert.ok(result.page < result.count);
  }
  const unicode = 'a'.repeat(7999) + '😀' + 'b'.repeat(7998) + '🌍end';
  const pages = Array.from({ length: textPage(unicode, 0).count }, (_, i) => textPage(unicode, i).text);
  assert.equal(pages.join(''), unicode);
  for (const page of pages) assert.equal(page.isWellFormed(), true);
  assert.equal(textPreview('a'.repeat(599) + '😀').isWellFormed(), true);
  assert.deepEqual(textPage('', -1), { page: 0, count: 1, text: '' });
});

test('account entry checks current approval, documents, restricted states and API failures', async t => {
  const oldLoad = Module._load;
  let profile, approval, requirements, documents, fail;
  const calls = [];
  class ApiError extends Error { constructor(status) { super('request failed'); this.status = status; } }
  const mocks = new Map([
    [require.resolve('../utils/api/request'), { ApiError }],
    [require.resolve('../feature/onboarding/apis/profileApi'), {
      getProfile: async () => { if (fail) throw fail; return profile; },
      getComplianceApproval: async () => { calls.push('compliance'); return approval; },
      getSignatoryApproval: async () => { calls.push('signatory'); return approval; },
    }],
    [require.resolve('../feature/documents/apis/documentApi'), {
      getRequirements: async () => requirements,
      getDocuments: async () => documents,
    }],
  ]);
  Module._load = function(id, parent, isMain) {
    const key = Module._resolveFilename(id, parent);
    return mocks.has(key) ? mocks.get(key) : oldLoad.call(this, id, parent, isMain);
  };
  let nextAccountScreen;
  try { ({ nextAccountScreen } = require('../utils/navigation/nextAccountScreen')); }
  finally { Module._load = oldLoad; }
  function reset() {
    profile = { id: 'profile', status: 'ACTIVE', institutionType: 'SINGLE_SCHOOL' };
    approval = { status: 'APPROVED' };
    requirements = [requirement()]; documents = [document()]; fail = null; calls.length = 0;
  }
  await t.test('single-school compliance, MAT signatory and explicitly waived compliance', async () => {
    reset(); assert.equal(await nextAccountScreen('school'), 'dashboard');
    assert.deepEqual(calls, ['compliance']);
    approval.status = 'PENDING'; assert.equal(await nextAccountScreen('school'), 'reviewStatus');
    profile.complianceApprovalRequired = false; assert.equal(await nextAccountScreen('school'), 'dashboard');
    profile.institutionType = 'MAT_SCHOOL'; assert.equal(await nextAccountScreen('school'), 'reviewStatus');
    assert.equal(calls.at(-1), 'signatory');
    approval.status = 'APPROVED'; assert.equal(await nextAccountScreen('school'), 'dashboard');
  });
  await t.test('teachers may enter only when active and uploads are ready; pending uploads still cannot apply', async () => {
    reset(); assert.equal(await nextAccountScreen('teacher'), 'dashboard');
    assert.equal(calls.length, 0);
    documents = []; assert.equal(await nextAccountScreen('teacher'), 'documents');
    documents = [document({ status: 'PENDING' })];
    assert.equal(await nextAccountScreen('teacher'), 'dashboard');
    assert.equal(requiredDocumentsVerified(requirements, documents, now), false);
    for (const status of ['PENDING_REVIEW', 'INCOMPLETE', 'REJECTED']) {
      profile.status = status; assert.equal(await nextAccountScreen('teacher'), 'reviewStatus');
    }
    documents = [];
    for (const status of ['SUSPENDED', 'DEACTIVATED']) {
      profile.status = status; assert.equal(await nextAccountScreen('teacher'), 'reviewStatus');
    }
  });
  await t.test('missing profiles go to onboarding; unexpected API errors never unlock the dashboard', async () => {
    reset(); profile = null; assert.equal(await nextAccountScreen('teacher'), 'onboarding');
    fail = new ApiError(404); assert.equal(await nextAccountScreen('teacher'), 'onboarding');
    fail = new ApiError(503); await assert.rejects(nextAccountScreen('teacher'), /request failed/);
  });
});
