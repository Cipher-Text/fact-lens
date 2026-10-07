// A light check for the newsletter field: one @, no spaces, and a dot in the domain.
// The mail service does the full check when a backend exists (DR-01).
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}
