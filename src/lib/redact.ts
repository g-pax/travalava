/**
 * PII redaction utilities for feedback messages
 */

// Email pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone patterns (basic US/international formats)
const PHONE_REGEX =
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;

/**
 * Redacts PII from user messages
 */
export function redactPII(message: string): string {
  return message
    .replace(EMAIL_REGEX, "[EMAIL_REDACTED]")
    .replace(PHONE_REGEX, "[PHONE_REDACTED]");
}
