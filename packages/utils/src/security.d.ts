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
export declare const HostSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Zod schema for validating port numbers
 * Valid range: 1-65535
 */
export declare const PortSchema: z.ZodUnion<
  [
    z.ZodNumber,
    z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>,
  ]
>;
/**
 * Zod schema for validating WebSocket URLs
 */
export declare const WebSocketUrlSchema: z.ZodEffects<
  z.ZodString,
  string,
  string
>;
/**
 * Zod schema for validating task IDs
 * Alphanumeric with optional hyphens/underscores, max 100 chars
 */
export declare const TaskIdSchema: z.ZodString;
/**
 * Zod schema for validating user IDs
 * Alphanumeric with optional hyphens/underscores/dots, max 100 chars
 */
export declare const UserIdSchema: z.ZodString;
/**
 * Zod schema for validating email addresses
 */
export declare const EmailSchema: z.ZodString;
/**
 * Zod schema for validating file paths (relative only, no traversal)
 */
export declare const SafePathSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Zod schema for dashboard options
 */
export declare const DashboardOptionsSchema: z.ZodObject<
  {
    host: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    port: z.ZodOptional<
      z.ZodUnion<
        [
          z.ZodNumber,
          z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>,
        ]
      >
    >;
    wsPort: z.ZodOptional<
      z.ZodUnion<
        [
          z.ZodNumber,
          z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>,
        ]
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    host?: string | undefined;
    port?: number | undefined;
    wsPort?: number | undefined;
  },
  {
    host?: string | undefined;
    port?: string | number | undefined;
    wsPort?: string | number | undefined;
  }
>;
/**
 * Type-safe validation functions
 */
export declare function isValidHost(host: string): boolean;
export declare function isValidPort(port: number | string): boolean;
export declare function isValidWebSocketUrl(url: string): boolean;
export declare function isValidTaskId(id: string): boolean;
export declare function isValidUserId(id: string): boolean;
export declare function isValidEmail(email: string): boolean;
export declare function isValidPath(filePath: string): boolean;
/**
 * Sanitizes HTML content to prevent XSS attacks
 * Escapes special HTML characters
 */
export declare function escapeHtml(text: string): string;
/**
 * Sanitizes user input for safe display
 * Combines validation and escaping
 */
export declare function sanitizeInput(
  input: string,
  maxLength?: number,
): string;
/**
 * Security validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
/**
 * Validates dashboard options comprehensively
 */
export declare function validateDashboardOptions(options: {
  host?: string;
  port?: number | string;
  wsPort?: number | string;
}): ValidationResult;
