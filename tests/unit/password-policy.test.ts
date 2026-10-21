import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePasswordChange } from '../../src/lib/auth/password-policy';

test('password changes require at least 12 characters', () => {
  assert.equal(validatePasswordChange('current', 'short-pass1', 'short-pass1'), 
    'Kata sandi baru harus terdiri dari minimal 12 karakter dan maksimal 72 byte.');
});

test('password changes reject bcrypt inputs longer than 72 UTF-8 bytes', () => {
  const oversizedPassword = 'é'.repeat(37);

  assert.equal(
    validatePasswordChange('current', oversizedPassword, oversizedPassword),
    'Kata sandi baru harus terdiri dari minimal 12 karakter dan maksimal 72 byte.',
  );
});

test('password changes require matching confirmation', () => {
  assert.equal(
    validatePasswordChange('current', 'new-password-123', 'different-password'),
    'Konfirmasi kata sandi baru tidak cocok.',
  );
});

test('password policy accepts a confirmed password in the supported range', () => {
  assert.equal(
    validatePasswordChange('current', 'new-password-123', 'new-password-123'),
    null,
  );
});
