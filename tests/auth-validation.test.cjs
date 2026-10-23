require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getPasswordChecks,
  isValidEmail,
  isValidLoginPassword,
} = require('../utils/auth/authValidation');

test('enforces auth field lengths without login composition rules', () => {
  assert.equal(isValidEmail(' person@example.test '), true);
  assert.equal(isValidEmail(`${'a'.repeat(245)}@example.test`), false);
  assert.equal(isValidLoginPassword('legacy12'), true);
  assert.equal(isValidLoginPassword('lowercaselegacy'), true);
  assert.equal(isValidLoginPassword('short'), false);
  assert.equal(isValidLoginPassword('x'.repeat(129)), false);
  assert.equal(
    getPasswordChecks('A1!' + 'x'.repeat(126)).every(item => item.valid),
    false,
  );
});
