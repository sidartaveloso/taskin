/**
 * Security utilities for input validation and sanitization
 * Provides centralized security functions to prevent XSS, injection attacks, and path traversal
 * Uses Zod for robust type-safe validation
 */
import { z } from 'zod';
/**
 * Zod schema for validating hostnames
 * Allows localhost, IPv4 addresses, and valid DNS hostnames
 */
export const HostSchema = z.string().refine(
  (host) => {
    if (!host || host.length === 0) return false;
    // Allow localhost
    if (host === 'localhost') return true;
    const parts = host.split('.');
    // If all parts are numeric, it must be exactly 4 parts (IPv4)
    const allNumeric = parts.every((p) => /^\d+$/.test(p));
    if (allNumeric) {
      if (parts.length !== 4) return false;
      // Validate IPv4: each octet must be 0-255
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
      });
    }
    // Validate hostname (alphanumeric, hyphens, dots)
    // Must start/end with alphanumeric, can have hyphens in middle
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnameRegex.test(host);
  },
  {
    message:
      'Invalid host. Must be localhost, a valid IPv4 address, or hostname.',
  },
);
/**
 * Zod schema for validating port numbers
 * Valid range: 1-65535
 */
export const PortSchema = z.union([
  z.number().int().min(1).max(65535),
  z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),
]);
/**
 * Zod schema for validating WebSocket URLs
 */
export const WebSocketUrlSchema = z.string().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    } catch {
      return false;
    }
  },
  { message: 'Invalid WebSocket URL. Must use ws:// or wss:// protocol.' },
);
/**
 * Zod schema for validating task IDs
 * Alphanumeric with optional hyphens/underscores, max 100 chars
 */
export const TaskIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Task ID must contain only alphanumeric characters, hyphens, and underscores.',
  });
/**
 * Zod schema for validating user IDs
 * Alphanumeric with optional hyphens/underscores/dots, max 100 chars
 */
export const UserIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      'User ID must contain only alphanumeric characters, dots, hyphens, and underscores.',
  });
/**
 * Zod schema for validating email addresses
 */
export const EmailSchema = z.string().email().max(254);
/**
 * Zod schema for validating file paths (relative only, no traversal)
 */
export const SafePathSchema = z.string().refine(
  (filePath) => {
    if (!filePath || filePath.length === 0) return false;
    // Block path traversal patterns
    const dangerousPatterns = [
      /\.\./, // Parent directory (..)
      /~\//, // Home directory
      /^\//, // Absolute path
      /^[A-Za-z]:\\/, // Windows absolute path
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(filePath));
  },
  {
    message:
      'Invalid path. Must be a relative path without traversal patterns.',
  },
);
/**
 * Zod schema for dashboard options
 */
export const DashboardOptionsSchema = z.object({
  host: HostSchema.optional(),
  port: PortSchema.optional(),
  wsPort: PortSchema.optional(),
});
/**
 * Type-safe validation functions
 */
export function isValidHost(host) {
  return HostSchema.safeParse(host).success;
}
export function isValidPort(port) {
  return PortSchema.safeParse(port).success;
}
export function isValidWebSocketUrl(url) {
  return WebSocketUrlSchema.safeParse(url).success;
}
export function isValidTaskId(id) {
  return TaskIdSchema.safeParse(id).success;
}
export function isValidUserId(id) {
  return UserIdSchema.safeParse(id).success;
}
export function isValidEmail(email) {
  return EmailSchema.safeParse(email).success;
}
export function isValidPath(filePath) {
  return SafePathSchema.safeParse(filePath).success;
}
/**
 * Sanitizes HTML content to prevent XSS attacks
 * Escapes special HTML characters
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const htmlEscapeMap = {
    '"': '&quot;',
    '&': '&amp;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}
/**
 * Sanitizes user input for safe display
 * Combines validation and escaping
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Truncate to max length
  const truncated = input.slice(0, maxLength);
  // Escape HTML
  return escapeHtml(truncated);
}
/**
 * Validates dashboard options comprehensively
 */
export function validateDashboardOptions(options) {
  const result = DashboardOptionsSchema.safeParse(options);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      error: firstError.message,
      valid: false,
    };
  }
  return { valid: true };
}
//# sourceMappingURL=security.js.map
