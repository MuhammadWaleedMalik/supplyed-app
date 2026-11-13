/* eslint-env node, es2020 */
require('./register.cjs');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPaymentReleasePreview,
  expandBookingSchedule,
} = require('../utils/jobs/paymentReleaseSchedule');
const {
  reconcileScheduleWeekdays,
} = require('../utils/jobs/scheduleSelection');

const slot = (start = '09:00', end = '17:00') => ({ start, end });
const schedule = (days = [1, 2, 3, 4, 5], exceptions = []) => ({
  weekdays: days.map(day => ({ day, slots: [slot()] })),
  exceptions,
});
const booking = (overrides = {}) => ({
  agreedTerms: null,
  termsStatus: 'RECORDED',
  job: { id: 'job-1', title: 'Current job title' },
  startDate: '2026-11-17',
  endDate: '2026-11-18',
  timeZone: 'Europe/London',
  schedule: schedule(),
  attendanceShifts: [],
  status: 'CONFIRMED',
  completedAt: null,
  paymentFrequency: 'daily',
  periodAnchor: 'ASSIGNMENT_START',
  payType: 'daily',
  ...overrides,
});

test('preview uses the immutable accepted booking schedule over changed top-level terms', () => {
  const preview = buildPaymentReleasePreview(
    booking({
      startDate: '2026-11-17',
      endDate: '2026-11-18',
      schedule: schedule([1]),
      paymentFrequency: 'monthly',
      agreedTerms: {
        title: 'Accepted maths cover',
        startDate: '2026-11-17',
        endDate: '2026-11-18',
        schedule: schedule([2, 3]),
        paymentFrequency: 'daily',
        periodAnchor: 'ASSIGNMENT_START',
        payType: 'daily',
        timeZone: 'Europe/London',
      },
    }),
  );
  assert.equal(preview.state, 'ready');
  assert.equal(preview.bookingTitle, 'Accepted maths cover');
  assert.equal(preview.assignmentStart, '2026-11-17');
  assert.equal(preview.assignmentEnd, '2026-11-18');
  assert.equal(preview.frequency, 'daily');
  assert.deepEqual(
    preview.periods.map(item => item.workingDates[0]),
    ['2026-11-17', '2026-11-18'],
  );
});

test('unusable legacy attendance rows fall back to the accepted schedule', () => {
  const preview = buildPaymentReleasePreview(
    booking({
      attendanceShifts: [
        {
          id: 'legacy-shift',
          workDate: '2026-11-17',
          scheduledStart: '',
          scheduledEnd: '',
          status: 'AWAITING_CONFIRMATION',
        },
      ],
      agreedTerms: {
        startDate: '2026-11-17',
        endDate: '2026-11-18',
        schedule: schedule([2, 3]),
        paymentFrequency: 'daily',
        payType: 'daily',
        timeZone: 'Europe/London',
      },
    }),
  );
  assert.equal(preview.state, 'ready');
  assert.deepEqual(
    preview.periods.map(item => item.workingDates[0]),
    ['2026-11-17', '2026-11-18'],
  );
});

test('inclusive short ranges produce only weekdays that actually occur', () => {
  const shifts = expandBookingSchedule(booking());
  assert.deepEqual(
    shifts.map(item => item.workDate),
    ['2026-11-17', '2026-11-18'],
  );
  assert.deepEqual(
    expandBookingSchedule(
      booking({
        startDate: '2026-11-21',
        endDate: '2026-11-21',
        schedule: schedule([6]),
      }),
    ).map(item => item.workDate),
    ['2026-11-21'],
  );
});

test('Monday through next Monday repeats six weekdays without selecting weekends', () => {
  const shifts = expandBookingSchedule(
    booking({ startDate: '2026-11-16', endDate: '2026-11-23' }),
  );
  assert.deepEqual(
    shifts.map(item => item.workDate),
    [
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-23',
    ],
  );
});

test('range changes preserve custom hours and deliberate weekday deselection', () => {
  const initial = {
    weekdays: [
      { day: 2, slots: [slot('10:00', '14:00')] },
      { day: 3, slots: [slot()] },
    ],
    exceptions: [],
  };
  const expanded = reconcileScheduleWeekdays(
    initial,
    [1, 2, 3, 4, 5],
    [1, 4, 5],
    [4],
    initial.weekdays,
  );
  assert.deepEqual(
    expanded.weekdays.map(item => item.day),
    [1, 2, 3, 5],
  );
  assert.deepEqual(expanded.weekdays.find(item => item.day === 2).slots, [
    slot('10:00', '14:00'),
  ]);
  const shrunk = reconcileScheduleWeekdays(
    expanded,
    [2, 3],
    [],
    [4],
    expanded.weekdays,
  );
  assert.deepEqual(
    shrunk.weekdays.map(item => item.day),
    [2, 3],
  );
});

test('split, overnight and date exceptions match the accepted schedule', () => {
  const shifts = expandBookingSchedule(
    booking({
      startDate: '2026-11-16',
      endDate: '2026-11-20',
      schedule: {
        weekdays: [
          {
            day: 1,
            slots: [slot('09:00', '12:00'), slot('22:00', '02:00')],
          },
          { day: 2, slots: [slot()] },
          { day: 3, slots: [slot()] },
        ],
        exceptions: [
          { date: '2026-11-17', kind: 'exclude' },
          {
            date: '2026-11-18',
            kind: 'replace',
            slots: [slot('11:00', '13:00')],
          },
          {
            date: '2026-11-19',
            kind: 'add',
            slots: [slot('15:00', '17:00')],
          },
        ],
      },
    }),
  );
  assert.deepEqual(
    shifts.map(item => item.workDate),
    ['2026-11-16', '2026-11-16', '2026-11-18', '2026-11-19'],
  );
  assert.equal(shifts[1].end, '2026-11-17T02:00:00.000Z');
});

test('weekly periods respect assignment-start and calendar anchors', () => {
  const base = booking({
    startDate: '2026-11-17',
    endDate: '2026-11-30',
    schedule: schedule([0, 1, 2, 3, 4, 5, 6]),
    paymentFrequency: 'weekly',
  });
  const assignment = buildPaymentReleasePreview(base);
  assert.deepEqual(
    assignment.periods.map(item => item.label),
    ['Week 1', 'Week 2'],
  );
  assert.equal(assignment.periods[0].workingDates.at(-1), '2026-11-23');
  const calendar = buildPaymentReleasePreview({
    ...base,
    periodAnchor: 'CALENDAR',
  });
  assert.deepEqual(
    calendar.periods.map(item => item.label),
    ['Week of 2026-11-16', 'Week of 2026-11-23', 'Week of 2026-11-30'],
  );
});

test('monthly assignment boundaries clamp through February and leap years', () => {
  const allDays = schedule([0, 1, 2, 3, 4, 5, 6]);
  const common = buildPaymentReleasePreview(
    booking({
      startDate: '2027-01-31',
      endDate: '2027-03-02',
      schedule: allDays,
      paymentFrequency: 'monthly',
    }),
  );
  assert.equal(common.periods[1].workingDates[0], '2027-02-28');
  const leap = buildPaymentReleasePreview(
    booking({
      startDate: '2028-01-31',
      endDate: '2028-03-02',
      schedule: allDays,
      paymentFrequency: 'monthly',
    }),
  );
  assert.equal(leap.periods[1].workingDates[0], '2028-02-29');
  const calendar = buildPaymentReleasePreview(
    booking({
      startDate: '2028-01-31',
      endDate: '2028-03-02',
      schedule: allDays,
      paymentFrequency: 'monthly',
      periodAnchor: 'CALENDAR',
    }),
  );
  assert.deepEqual(
    calendar.periods.map(item => item.label),
    ['2028-01', '2028-02', '2028-03'],
  );
});

test('timezone expansion preserves daylight-saving elapsed time', () => {
  const [shift] = expandBookingSchedule(
    booking({
      startDate: '2026-03-29',
      endDate: '2026-03-29',
      schedule: { weekdays: [{ day: 0, slots: [slot('00:00', '03:00')] }] },
    }),
  );
  assert.equal((Date.parse(shift.end) - Date.parse(shift.start)) / 3_600_000, 2);
});

test('fixed, missing, empty and milestone schedules never invent dates', () => {
  const fixed = buildPaymentReleasePreview(
    booking({ payType: 'fixed', paymentFrequency: 'completion' }),
  );
  assert.equal(fixed.periods.length, 1);
  assert.equal(fixed.periods[0].conditionalOnCompletion, true);
  assert.equal(
    buildPaymentReleasePreview(booking({ schedule: null })).state,
    'missing',
  );
  assert.equal(
    buildPaymentReleasePreview(
      booking({
        schedule: schedule([1]),
        startDate: '2026-11-17',
        endDate: '2026-11-18',
      }),
    ).message,
    'No scheduled payments to display',
  );
  assert.equal(
    buildPaymentReleasePreview(
      booking({ payType: 'fixed', paymentFrequency: 'milestone' }),
    ).state,
    'milestone',
  );
});

test('release popup is display-only and forms do not offer hourly or milestone frequency', () => {
  const modal = fs.readFileSync(
    'components/dashboard/PaymentReleaseScheduleModal.tsx',
    'utf8',
  );
  assert.doesNotMatch(
    modal,
    /syncBookingPayment|createInvoice|payment-session|recordAttendance|completeBooking/,
  );
  const bookingCard = fs.readFileSync(
    'components/dashboard/BookingInvoiceCard.tsx',
    'utf8',
  );
  assert.match(bookingCard, /title="Payment release schedule"/);
  const form = fs.readFileSync('components/dashboard/JobDetailsStep.tsx', 'utf8');
  assert.doesNotMatch(form, /\['completion', 'milestone'\]/);
  assert.doesNotMatch(form, /\['hourly', 'daily', 'weekly', 'monthly'\]/);
});
