export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getPasswordChecks(password: string) {
  return [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function passwordsMatch(password: string, confirmation: string) {
  return password.length > 0 && password === confirmation;
}

export function canRegister(
  email: string,
  password: string,
  confirmation: string,
) {
  return (
    isValidEmail(email) &&
    getPasswordChecks(password).every(check => check.valid) &&
    passwordsMatch(password, confirmation)
  );
}
