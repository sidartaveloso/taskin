# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Taskin, please report it by emailing **security@opentask.dev** (or creating a private security advisory on GitHub).

**Please do not open public issues for security vulnerabilities.**

We will respond to your report within 48 hours and work with you to understand and address the issue.

## Security Features

Taskin implements defense-in-depth security with multiple layers of protection:

### 1. Input Validation (First Line of Defense)

All user inputs are validated using **Zod schemas** before processing:

#### Host Validation

- **Allowed**: `localhost`, valid IPv4 addresses (0.0.0.0 - 255.255.255.255), DNS hostnames
- **Blocked**: Command injection (`; rm -rf /`, `&& echo hacked`, `| cat /etc/passwd`)
- **Blocked**: Script tags (`<script>`, `<img onerror>`)
- **Blocked**: Path traversal in hostnames

#### Port Validation

- **Allowed**: Numbers 1-65535 (string or integer)
- **Blocked**: Non-numeric strings (`"80abc"`, `"8080; echo hacked"`)
- **Blocked**: Out-of-range ports (`0`, `70000`)

#### IPv4 Validation

- **Allowed**: Exactly 4 octets, each 0-255 (e.g., `192.168.1.1`)
- **Blocked**: Invalid octets (`256.1.1.1`)
- **Blocked**: Incomplete addresses (`192.168.1`)
- **Blocked**: Too many octets (`192.168.1.1.1`)

#### Path Validation

- **Allowed**: Relative paths without traversal
- **Blocked**: Path traversal (`../`, `../../etc/passwd`)
- **Blocked**: Home directory access (`~/`, `~root/`)
- **Blocked**: Absolute paths (`/etc/passwd`, `C:\Windows\System32`)

#### WebSocket URL Validation

- **Allowed**: `ws://` and `wss://` protocols only
- **Blocked**: `http://`, `javascript:`, `data:`, malformed URLs

### 2. Output Escaping (Second Line of Defense)

All dynamic content is escaped before rendering:

#### HTML Escaping

- Converts `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, `"` → `&quot;`, `'` → `&#x27;`
- Prevents XSS attacks via user-controlled data injection into HTML

Example:

```typescript
const userInput = '<script>alert("XSS")</script>';
const escaped = escapeHtml(userInput);
// Result: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

### 3. HTTP Security Headers (Third Line of Defense)

All HTTP responses include security headers:

| Header                    | Value                                                                                     | Protection                    |
| ------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| `X-Frame-Options`         | `DENY`                                                                                    | Prevents clickjacking attacks |
| `X-Content-Type-Options`  | `nosniff`                                                                                 | Prevents MIME type sniffing   |
| `X-XSS-Protection`        | `1; mode=block`                                                                           | Enables browser XSS filter    |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'` | Restricts resource loading    |
| `X-Powered-By`            | _(removed)_                                                                               | Reduces server fingerprinting |

### 4. Testing

All security features are covered by **46 comprehensive unit tests**:

- ✅ Command injection (`; rm -rf /`, `&& echo hacked`, `$(whoami)`)
- ✅ XSS attacks (`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`)
- ✅ Path traversal (`../`, `../../etc/passwd`, `~/`)
- ✅ IPv4 validation (`256.1.1.1`, `192.168.1`, `192.168.1.1.1`)
- ✅ Port validation (`"80abc"`, `"8080; echo hacked"`, `-1`, `70000`)
- ✅ WebSocket URL validation (`http://`, `javascript:`, malformed URLs)

Run security tests:

```bash
cd packages/utils
pnpm test
```

## Security Best Practices

When using Taskin:

1. **Dashboard Binding**
   - Bind dashboard to `localhost` only (default) unless you need remote access
   - Use firewall rules to restrict access to dashboard ports
   - Use HTTPS in production (configure reverse proxy)

2. **Task File Permissions**
   - Ensure `TASKS/` directory has appropriate file permissions
   - Don't store sensitive data in task markdown files (they're not encrypted)

3. **Dependencies**
   - Keep dependencies up-to-date: `pnpm update`
   - Review `pnpm audit` output regularly

4. **MCP Server**
   - When using MCP server with LLMs, review which files/commands LLM can access
   - Use read-only mode when possible

## Vulnerability Disclosure Timeline

We aim to:

1. Acknowledge receipt within 48 hours
2. Provide initial assessment within 7 days
3. Release patch within 30 days (critical issues: 7 days)
4. Credit reporter in release notes (unless anonymous)

## Security Updates

Security updates are released as **patch versions** (e.g., 1.0.5 → 1.0.6) and include:

- Detailed changelog entry
- GitHub security advisory
- npm deprecation of vulnerable versions (if critical)

## Past Security Issues

None reported to date (project created December 2024).

## Contact

- **Email**: security@opentask.dev
- **GitHub**: [Private Security Advisory](https://github.com/opentask/taskin/security/advisories)

---

**Thank you for helping keep Taskin secure!** 🔒
