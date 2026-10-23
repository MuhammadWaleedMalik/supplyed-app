require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createMergedPager, newestFirst } = require('../utils/api/mergedPager');
const { dateWindowErrors, validateDateWindow } = require('../utils/jobs/workSchedule');
const { collectEarnings, periodStart } = require('../utils/payments/earnings');
const { observeEditorContent, requestCurrentEditorContent } = require('../utils/ui/editorContent');

const record = (id, date, status = 'APPLIED') => ({ id, createdAt: date, status });
function source(items, size = 2) {
  return async page => ({ items: items.slice((page - 1) * size, page * size), page, hasMore: page * size < items.length });
}
test('merges server streams globally newest-first with no skipped records', async () => {
  const pager = createMergedPager([
    source([record('f', '6'), record('c', '3'), record('a', '1')]),
    source([record('e', '5'), record('d', '4'), record('b', '2')]),
  ], newestFirst, () => true, 2);
  const pages = [await pager(1), await pager(2), await pager(3)];
  assert.deepEqual(pages.flatMap(page => page.items.map(item => item.id)), ['f', 'e', 'd', 'c', 'b', 'a']);
  assert.equal(pages[2].hasMore, false);
});
test('bounded scans can return an empty page without prematurely ending history', async () => {
  const pager = createMergedPager([source([record('c', '3', 'REJECTED'), record('b', '2', 'REJECTED'), record('a', '1')])], newestFirst, item => item.status === 'APPLIED', 2, 2);
  const first = await pager(1);
  assert.equal(first.items.length, 0); assert.equal(first.hasMore, true);
  assert.deepEqual((await pager(2)).items.map(item => item.id), ['a']);
});
test('failed merged pages are transactional and can be retried', async () => {
  let fail = true;
  const base = source([record('c', '3'), record('b', '2'), record('a', '1')], 1);
  const pager = createMergedPager([async page => { if (page === 2 && fail) { fail = false; throw new Error('offline'); } return base(page); }], newestFirst, () => true, 2);
  await assert.rejects(pager(1), /offline/);
  assert.deepEqual((await pager(1)).items.map(item => item.id), ['c', 'b']);
  assert.deepEqual((await pager(2)).items.map(item => item.id), ['a']);
});
test('merged paging deduplicates overlapping pages and rejects a non-advancing response', async () => {
  const pager = createMergedPager([async page => ({ page, items: page === 1 ? [record('b', '2')] : [record('b', '2'), record('a', '1')], hasMore: page === 1 })], newestFirst, () => true, 2);
  assert.deepEqual((await pager(1)).items.map(item => item.id), ['b', 'a']);
  const broken = createMergedPager([async () => ({ page: 1, items: [], hasMore: true })], newestFirst);
  await assert.rejects(broken(1), /incomplete page/);
});
test('school fan-out never exceeds four concurrent requests', async () => {
  let running = 0, peak = 0;
  const pager = createMergedPager(Array.from({ length: 12 }, (_, index) => async page => {
    running++; peak = Math.max(peak, running); await new Promise(resolve => setTimeout(resolve, 1)); running--;
    return { page, items: [record(String(index), String(index))], hasMore: false };
  }), newestFirst);
  assert.equal((await pager(1)).items.length, 12); assert.ok(peak <= 4);
});

const validDates = { liveFrom: '2026-11-01T00:00:00Z', expiresAt: '2026-11-02T00:00:00Z', startDate: '2026-11-03T09:00:00Z', endDate: '2026-11-03T15:00:00Z' };
test('date validation enforces strict Live < Expiry < Start < End', () => {
  assert.deepEqual(dateWindowErrors(validDates), {});
  assert.match(dateWindowErrors({ ...validDates, expiresAt: validDates.liveFrom }).expiresAt, /later/);
  assert.match(dateWindowErrors({ ...validDates, startDate: validDates.expiresAt }).startDate, /later/);
  assert.match(dateWindowErrors({ ...validDates, endDate: validDates.startDate }).endDate, /later/);
  assert.throws(() => validateDateWindow({ ...validDates, endDate: validDates.startDate }));
});
test('date validation catches invalid timestamps and DST ambiguity at the relevant field', () => {
  assert.ok(dateWindowErrors({ startDate: 'invalidZ' }).startDate);
  assert.ok(dateWindowErrors({ startDate: '2026-10-25T01:30' }).startDate);
  assert.ok(dateWindowErrors({ expiresAt: '2026-10-25', startDate: '2026-10-26T00:00' }).startDate);
});

function invoice(id, extra = {}) { return { id, status: 'PAID', teacherAmountPence: 10000, totalAmountPence: 11250, amountRefundedPence: 0, disputeStatus: null, currency: 'gbp', paidAt: '2026-10-21T10:00:00Z', createdAt: '2026-10-20T10:00:00Z', ...extra }; }
test('earnings periods use UK dates and Monday-start weeks', () => {
  const now = new Date('2026-10-25T23:30:00Z');
  assert.equal(periodStart('This week', now), '2026-10-19');
  assert.equal(periodStart('This month', now), '2026-10-01');
  assert.equal(periodStart('This year', now), '2026-01-01');
  assert.equal(periodStart('This month', new Date('2026-09-30T23:30:00Z')), '2026-10-01');
});
test('earnings use all pages, teacher share, separate pending and currencies, and flag adjustments', async () => {
  const invoices = [invoice('a'), invoice('b', { status: 'OPEN', teacherAmountPence: 5000 }), invoice('c', { paidAt: '2025-12-01T12:00:00Z', amountRefundedPence: 1200 }), invoice('d', { currency: 'eur' }), invoice('e', { status: 'VOID' })];
  const totals = await collectEarnings(async page => ({ invoices: invoices.slice((page - 1) * 2, page * 2), hasNextPage: page * 2 < invoices.length, total: invoices.length }), new Date('2026-10-22T12:00:00Z'));
  const all = totals['All time'].find(item => item.currency === 'GBP');
  assert.equal(all.paidPence, 20000); assert.equal(all.pendingPence, 5000); assert.equal(all.adjustments, 1);
  assert.equal(totals['This week'].find(item => item.currency === 'GBP').paidPence, 10000);
  assert.equal(totals['All time'].find(item => item.currency === 'EUR').paidPence, 10000);
});
test('earnings never return an incomplete or duplicate all-time total', async () => {
  await assert.rejects(collectEarnings(async () => ({ invoices: [invoice('a')], hasNextPage: false, total: 2 })), /complete invoice history/);
  await assert.rejects(collectEarnings(async page => ({ invoices: [invoice('a')], hasNextPage: page === 1, total: 2 })), /history changed/);
});

test('editor publishes current text, formatting, composition and deletions without rewriting the DOM', () => {
  const messages = [], listeners = {};
  let observer, html = '<p>Existing draft</p>', writes = 0;
  const content = { dataset: {}, addEventListener: (event, fn) => { listeners[event] = fn; }, get innerHTML() { return html; }, set innerHTML(value) { writes++; html = value; } };
  const context = vm.createContext({ document: { querySelector: () => content }, window: { ReactNativeWebView: { postMessage: value => messages.push(JSON.parse(value)) } }, MutationObserver: function(fn) { observer = fn; this.observe = () => {}; } });
  vm.runInContext(observeEditorContent, context);
  html = '<p>Hello</p>'; listeners.input();
  html = '<p>Hello world</p>'; listeners.input();
  vm.runInContext(requestCurrentEditorContent, context); // a delayed library echo reads the newest DOM
  html = '<p><b>Hello world</b></p>'; observer();
  html = '<p>你好</p>'; listeners.compositionend();
  html = ''; listeners.input(); listeners.blur();
  assert.deepEqual(messages.map(item => item.data), ['<p>Hello</p>', '<p>Hello world</p>', '<p><b>Hello world</b></p>', '<p>你好</p>', '']);
  assert.equal(writes, 0);
});
test('UI guards retain editable composer during send, omit suggestions and keep one native splash', () => {
  const thread = fs.readFileSync('components/dashboard/ConversationThread.tsx', 'utf8');
  assert.match(thread, /editable=\{canCompose\}/);
  assert.doesNotMatch(thread.match(/const canCompose =[^;]+;/)?.[0] || '', /busy|uploading/);
  assert.doesNotMatch(thread, /Suggested replies|suggestions/);
  assert.doesNotMatch(fs.readFileSync('App.tsx', 'utf8'), /SPLASH_DURATION|<SplashScreen|isSplashVisible/);
  assert.match(fs.readFileSync('components/dashboard/ConversationPicker.tsx', 'utf8'), /disabled=\{counts\[value\] === 0\}/);
});

test('applications initially show Applied and the landing page never hides About sections', () => {
  for (const role of ['school', 'teacher']) {
    const hook = fs.readFileSync(`feature/dashboard/${role}/hooks/use${role === 'school' ? 'School' : 'Teacher'}Applications.ts`, 'utf8');
    assert.match(hook, /applications\.status\.v2',\s*'APPLIED'/);
    assert.doesNotMatch(hook, /NOT_REJECTED/);
  }
  const landing = fs.readFileSync('feature/landing/screen/LandingPage.tsx', 'utf8');
  assert.doesNotMatch(landing, /showAbout|setShowAbout|Hide about SupplyEd/);
  assert.match(landing, /Built for both sides of a booking/);
  assert.match(landing, /How it works/);
  assert.match(landing, /Founding Schools Programme/);
});
