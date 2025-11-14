import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  isValidEmail,
  isValidHost,
  isValidPath,
  isValidPort,
  isValidTaskId,
  isValidUserId,
  isValidWebSocketUrl,
  sanitizeInput,
  validateDashboardOptions,
} from './security';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Security Utils', () => {
  describe('isValidHost', () => {
    it('should accept localhost', () => {
      expect(isValidHost('localhost')).toBe(true);
    });

    it('should accept valid IPv4 addresses', () => {
      expect(isValidHost('127.0.0.1')).toBe(true);
      expect(isValidHost('192.168.1.1')).toBe(true);
      expect(isValidHost('0.0.0.0')).toBe(true);
      expect(isValidHost('255.255.255.255')).toBe(true);
    });

    it('should accept valid hostnames', () => {
      expect(isValidHost('example.com')).toBe(true);
      expect(isValidHost('sub.example.com')).toBe(true);
      expect(isValidHost('my-server')).toBe(true);
      expect(isValidHost('server123')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidHost('256.1.1.1')).toBe(false);
      expect(isValidHost('192.168.1.1.1')).toBe(false);
    });

    it('should reject command injection attempts', () => {
      expect(isValidHost('localhost; rm -rf /')).toBe(false);
      expect(isValidHost('localhost && echo "hacked"')).toBe(false);
      expect(isValidHost('localhost | cat /etc/passwd')).toBe(false);
      expect(isValidHost('$(whoami)')).toBe(false);
      expect(isValidHost('`cat /etc/passwd`')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(isValidHost('host<script>')).toBe(false);
      expect(isValidHost('host name')).toBe(false);
      expect(isValidHost('host!name')).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidHost('')).toBe(false);
      expect(isValidHost(null as any)).toBe(false);
      expect(isValidHost(undefined as any)).toBe(false);
      expect(isValidHost(123 as any)).toBe(false);
    });
  });

  describe('isValidPort', () => {
    it('should accept valid port numbers', () => {
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort(443)).toBe(true);
      expect(isValidPort(3000)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
      expect(isValidPort(1)).toBe(true);
    });

    it('should accept valid port strings', () => {
      expect(isValidPort('80')).toBe(true);
      expect(isValidPort('3000')).toBe(true);
      expect(isValidPort('65535')).toBe(true);
    });

    it('should reject out-of-range ports', () => {
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(99999)).toBe(false);
    });

    it('should reject invalid port formats', () => {
      expect(isValidPort('abc')).toBe(false);
      expect(isValidPort('80abc')).toBe(false);
      expect(isValidPort('3000; rm -rf /')).toBe(false);
      expect(isValidPort(NaN)).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidPort('')).toBe(false);
      expect(isValidPort(null as any)).toBe(false);
      expect(isValidPort(undefined as any)).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
      );
      expect(escapeHtml('Test & Demo')).toBe('Test &amp; Demo');
      expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle invalid input', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
      expect(escapeHtml(123 as any)).toBe('');
    });

    it('should prevent XSS attacks', () => {
      const xssAttempts = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      xssAttempts.forEach((attempt) => {
        const escaped = escapeHtml(attempt);
        expect(escaped).not.toContain('<');
        expect(escaped).not.toContain('>');
        expect(escaped).not.toContain('"');
      });
    });
  });

  describe('isValidPath', () => {
    it('should accept valid relative paths', () => {
      expect(isValidPath('file.txt')).toBe(true);
      expect(isValidPath('folder/file.txt')).toBe(true);
      expect(isValidPath('folder/subfolder/file.txt')).toBe(true);
    });

    it('should reject path traversal attempts', () => {
      expect(isValidPath('../file.txt')).toBe(false);
      expect(isValidPath('../../etc/passwd')).toBe(false);
      expect(isValidPath('folder/../../../file.txt')).toBe(false);
      expect(isValidPath('./../file.txt')).toBe(false);
    });

    it('should reject absolute paths', () => {
      expect(isValidPath('/etc/passwd')).toBe(false);
      expect(isValidPath('/usr/bin/bash')).toBe(false);
      expect(isValidPath('C:\\Windows\\System32')).toBe(false);
      expect(isValidPath('D:\\folder\\file.txt')).toBe(false);
    });

    it('should reject home directory paths', () => {
      expect(isValidPath('~/file.txt')).toBe(false);
      expect(isValidPath('~/.ssh/id_rsa')).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidPath('')).toBe(false);
      expect(isValidPath(null as any)).toBe(false);
      expect(isValidPath(undefined as any)).toBe(false);
    });
  });

  describe('isValidWebSocketUrl', () => {
    it('should accept valid WebSocket URLs', () => {
      expect(isValidWebSocketUrl('ws://localhost:3001')).toBe(true);
      expect(isValidWebSocketUrl('wss://example.com:443')).toBe(true);
      expect(isValidWebSocketUrl('ws://192.168.1.1:8080')).toBe(true);
    });

    it('should reject non-WebSocket protocols', () => {
      expect(isValidWebSocketUrl('http://localhost:3000')).toBe(false);
      expect(isValidWebSocketUrl('https://example.com')).toBe(false);
      expect(isValidWebSocketUrl('ftp://example.com')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(isValidWebSocketUrl('not-a-url')).toBe(false);
      expect(isValidWebSocketUrl('ws://')).toBe(false);
      expect(isValidWebSocketUrl('')).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidWebSocketUrl(null as any)).toBe(false);
      expect(isValidWebSocketUrl(undefined as any)).toBe(false);
    });
  });

  describe('isValidTaskId', () => {
    it('should accept valid task IDs', () => {
      expect(isValidTaskId('task-001')).toBe(true);
      expect(isValidTaskId('TASK_123')).toBe(true);
      expect(isValidTaskId('feature-new-login')).toBe(true);
      expect(isValidTaskId('001')).toBe(true);
    });

    it('should reject task IDs with invalid characters', () => {
      expect(isValidTaskId('task 001')).toBe(false);
      expect(isValidTaskId('task@001')).toBe(false);
      expect(isValidTaskId('task#001')).toBe(false);
      expect(isValidTaskId('task;rm -rf /')).toBe(false);
    });

    it('should reject task IDs that are too long', () => {
      const longId = 'a'.repeat(101);
      expect(isValidTaskId(longId)).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidTaskId('')).toBe(false);
      expect(isValidTaskId(null as any)).toBe(false);
      expect(isValidTaskId(undefined as any)).toBe(false);
    });
  });

  describe('isValidUserId', () => {
    it('should accept valid user IDs', () => {
      expect(isValidUserId('user-123')).toBe(true);
      expect(isValidUserId('john.doe')).toBe(true);
      expect(isValidUserId('developer_1')).toBe(true);
      expect(isValidUserId('sidarta-veloso')).toBe(true);
    });

    it('should reject user IDs with invalid characters', () => {
      expect(isValidUserId('user 123')).toBe(false);
      expect(isValidUserId('user@host')).toBe(false);
      expect(isValidUserId('user#123')).toBe(false);
      expect(isValidUserId('user;whoami')).toBe(false);
    });

    it('should reject user IDs that are too long', () => {
      const longId = 'a'.repeat(101);
      expect(isValidUserId(longId)).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidUserId('')).toBe(false);
      expect(isValidUserId(null as any)).toBe(false);
      expect(isValidUserId(undefined as any)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
      expect(isValidEmail('developer+test@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it('should reject empty or invalid types', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML and truncate', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should truncate to max length', () => {
      const input = 'a'.repeat(2000);
      const sanitized = sanitizeInput(input, 100);
      expect(sanitized.length).toBe(100);
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle invalid input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('validateDashboardOptions', () => {
    it('should accept valid options', () => {
      const result = validateDashboardOptions({
        host: 'localhost',
        port: 5173,
        wsPort: 3001,
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid host', () => {
      const result = validateDashboardOptions({
        host: 'invalid; rm -rf /',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid host');
    });

    it('should reject invalid port', () => {
      const result = validateDashboardOptions({
        port: 99999,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid WebSocket port', () => {
      const result = validateDashboardOptions({
        wsPort: -1,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept partial options', () => {
      expect(validateDashboardOptions({ host: 'localhost' }).valid).toBe(true);
      expect(validateDashboardOptions({ port: 5173 }).valid).toBe(true);
      expect(validateDashboardOptions({ wsPort: 3001 }).valid).toBe(true);
      expect(validateDashboardOptions({}).valid).toBe(true);
    });
  });
});
