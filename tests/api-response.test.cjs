require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  apiErrorMessage,
  joinApiPath,
  parseApiReply,
} = require('../utils/api/response');

test('parses raw and enveloped success payloads without double unwrapping', () => {
  const raw = { data: { domain: true } };
  assert.deepEqual(parseApiReply(raw), {
    envelope: false,
    hasData: true,
    data: raw,
    success: undefined,
    message: undefined,
    code: undefined,
    requestId: undefined,
    fieldErrors: undefined,
  });
  assert.deepEqual(parseApiReply([{ id: 'one' }]).data, [{ id: 'one' }]);
  const envelope = parseApiReply({
    success: true,
    statusCode: 200,
    message: 'Success',
    data: { id: 'job' },
  });
  assert.equal(envelope.envelope, true);
  assert.equal(envelope.hasData, true);
  assert.deepEqual(envelope.data, { id: 'job' });
});

test('preserves error code, request ID, field errors and message arrays', () => {
  const reply = parseApiReply({
    success: false,
    statusCode: 422,
    message: ['Title is required', 'Date is invalid'],
    code: 'VALIDATION_FAILED',
    fieldErrors: { title: 'Required', date: ['Invalid', 123] },
    meta: { requestId: 'request-123' },
    data: null,
  });
  assert.equal(reply.code, 'VALIDATION_FAILED');
  assert.equal(reply.requestId, 'request-123');
  assert.deepEqual(reply.fieldErrors, {
    title: ['Required'],
    date: ['Invalid'],
  });
  assert.equal(apiErrorMessage(reply), 'Title is required, Date is invalid');
});

test('joins an API base and one relative backend path exactly once', () => {
  assert.equal(
    joinApiPath('https://example.test/api/', '/jobs?page=2'),
    'https://example.test/api/jobs?page=2',
  );
  assert.throws(() => joinApiPath('https://example.test/api', 'jobs'));
  assert.throws(() => joinApiPath('https://example.test/api', '//jobs'));
});
