// Text sanitization utilities for security

/**
 * Sanitize user text input to prevent XSS and enforce limits
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default 500)
 * @returns Sanitized string
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

/**
 * Validate text input is not empty after sanitization
 * @param input - Raw user input
 * @returns Sanitized text or null if empty
 */
export function validateTextInput(input: string | null): string | null {
  if (!input) return null;
  const sanitized = sanitizeTextInput(input);
  return sanitized.length > 0 ? sanitized : null;
}
