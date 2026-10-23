require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  changeSchedule,
  listingInstant,
} = require('../utils/jobs/workSchedule');
const { londonToIso } = require('../utils/jobs/londonTime');
const {
  jobAddress,
  sameJobAddress,
} = require('../utils/jobs/jobAddress');

function hourly(extra = {}) {
  return {
    payType: 'hourly',
    startDate: '2026-11-02T02:00',
    endDate: '2026-11-03T05:00',
    hours: '',
    days: '',
    ...extra,
  };
}

test('computes inclusive hourly units and redistributes edited totals', () => {
  const calculated = changeSchedule(hourly(), 'endDate', '2026-11-03T05:00');
  assert.equal(calculated.hours, '6');
  const redistributed = changeSchedule(
    { ...calculated, hours: '8' },
    'hours',
    '8',
  );
  assert.equal(redistributed.endDate, '2026-11-03T06:00');
  assert.equal(redistributed.scheduleError, '');
});

test('uses UK calendar boundaries and rejects ambiguous DST wall times', () => {
  assert.equal(
    new Date(listingInstant('2026-10-25')).toISOString(),
    '2026-10-24T23:00:00.000Z',
  );
  assert.equal(
    new Date(listingInstant('2026-10-25', true)).toISOString(),
    '2026-10-26T00:00:00.000Z',
  );
  assert.throws(() => londonToIso('2026-03-29T01:30'));
  assert.throws(() => londonToIso('2026-10-25T01:30'));
});

test('matches normalized school addresses and preserves distinct saved locations', () => {
  const school = jobAddress({
    address: ' 10  Example Road ',
    city: 'London',
    county: 'Greater London',
    postalCode: 'sw1a 1aa',
    countryCode: 'gb',
  });
  assert.equal(
    sameJobAddress(school, {
      address: '10 example road',
      city: ' london ',
      county: 'greater london',
      postalCode: 'SW1A 1AA',
      countryCode: 'GB',
    }),
    true,
  );
  assert.equal(
    sameJobAddress(school, { ...school, address: '12 Example Road' }),
    false,
  );
});
