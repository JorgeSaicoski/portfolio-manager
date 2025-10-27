# Security Documentation

Security best practices, audits, and vulnerability reports for Portfolio Manager.

## Available Guides

### [Security Overview](overview.md)
Security best practices and guidelines.

**Topics:**
- Authentication security
- API security
- Input validation
- CORS configuration
- Rate limiting
- Secrets management

### [Audit Summary](audit-summary.md)
Results from security audits and penetration testing.

**Includes:**
- Audit findings
- Remediation status
- Security improvements
- Testing methodology

### [Vulnerabilities](vulnerabilities.md)
Known security issues and mitigations.

**Covers:**
- CVE tracking
- Dependency vulnerabilities
- Mitigation strategies
- Update procedures

## Security Checklist

### Development
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (proper escaping)
- [ ] CSRF protection (state parameter)
- [ ] Secure password storage (delegated to Authentik)

### Production
- [ ] HTTPS everywhere
- [ ] Secure cookies (Secure, HttpOnly, SameSite)
- [ ] Strong secrets (min 32 chars)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Regular dependency updates
- [ ] Monitoring and alerting
- [ ] Regular backups
- [ ] Incident response plan

## Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, email security concerns to: [your-security-email@example.com]

Include:
- Detailed description
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

**[⬅️ Back to Documentation](../README.md)**
