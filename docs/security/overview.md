# Security Overview

Security best practices and guidelines for Portfolio Manager.

## Security Architecture

Portfolio Manager implements defense-in-depth security:

1. **Authentication Layer** - Authentik (OIDC/OAuth2)
2. **API Layer** - JWT validation, CORS, rate limiting
3. **Data Layer** - PostgreSQL with proper access controls

## Key Security Features

### Authentication & Authorization
- ✅ OAuth2/OIDC via Authentik
- ✅ PKCE flow (prevents code interception)
- ✅ JWT token-based API authentication
- ✅ Token expiration and refresh
- ✅ CSRF protection (state parameter)

### API Security
- ✅ Input validation
- ✅ SQL injection prevention (GORM ORM)
- ✅ XSS prevention (proper escaping)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request size limits

### Infrastructure Security
- ✅ Rootless containers (Podman)
- ✅ Secrets management (.env files, not committed)
- ✅ Database access controls
- ✅ Network isolation

## Production Security Checklist

### HTTPS/TLS
- [ ] Enable HTTPS everywhere
- [ ] Valid TLS certificates
- [ ] Redirect HTTP to HTTPS
- [ ] HSTS headers

### Secrets Management
- [ ] Strong random secrets (min 32 chars)
- [ ] Rotate secrets regularly
- [ ] Use secret management service (Vault, AWS Secrets Manager)
- [ ] Never commit secrets to git

### Application Security
- [ ] Secure cookies (Secure, HttpOnly, SameSite)
- [ ] Content Security Policy headers
- [ ] X-Frame-Options, X-Content-Type-Options
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints

### Database Security
- [ ] Strong database password
- [ ] Restrict database access (firewall/network)
- [ ] Regular backups
- [ ] Encrypted backups
- [ ] Connection pooling limits

### Monitoring & Logging
- [ ] Authentication logs
- [ ] API access logs
- [ ] Error monitoring
- [ ] Security event alerting
- [ ] Regular log review

### Dependencies
- [ ] Regular dependency updates
- [ ] Vulnerability scanning
- [ ] Review security advisories
- [ ] Automated dependency updates (Dependabot)

## Common Vulnerabilities & Mitigations

### SQL Injection
**Risk**: Database compromise
**Mitigation**: Using GORM ORM with parameterized queries
**Status**: ✅ Protected

### XSS (Cross-Site Scripting)
**Risk**: Client-side code execution
**Mitigation**: Svelte automatic escaping, Content Security Policy
**Status**: ✅ Protected

### CSRF (Cross-Site Request Forgery)
**Risk**: Unauthorized actions
**Mitigation**: OAuth state parameter, SameSite cookies
**Status**: ✅ Protected

### Authentication Bypass
**Risk**: Unauthorized access
**Mitigation**: JWT validation, token expiration
**Status**: ✅ Protected

### Rate Limiting
**Risk**: DoS, brute force
**Mitigation**: Rate limiting middleware
**Status**: ✅ Implemented

## Security Headers

Recommended headers for production:

```nginx
# Nginx example
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self';" always;
```

## Incident Response

### If You Discover a Security Issue

1. **DO NOT** open a public GitHub issue
2. Email: [security contact - to be added]
3. Include:
   - Detailed description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 48 hours
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

## Security Updates

### Staying Informed

- Watch the GitHub repository
- Subscribe to security advisories
- Follow dependency security alerts
- Review Authentik security updates

### Update Procedure

1. Review changelog and security notes
2. Test in staging environment
3. Backup production database
4. Deploy during maintenance window
5. Verify functionality
6. Monitor logs for issues

## Compliance & Standards

### Standards Followed

- OWASP Top 10
- OAuth 2.0 / OpenID Connect specifications
- JWT best practices
- Container security best practices

### Data Protection

- User passwords: Never stored (delegated to Authentik)
- Tokens: Short-lived, stored securely
- Personal data: Minimal collection
- Data retention: User-controlled

## Additional Resources

- [Audit Summary](audit-summary.md) - Security audit results
- [Vulnerabilities](vulnerabilities.md) - Known issues and CVEs
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Authentik Security](https://goauthentik.io/docs/security/)

---

**[⬅️ Back to Security Documentation](README.md)**
