# Security Policy

## Overview

This document outlines the security features, best practices, and vulnerability reporting process for the Portfolio Manager application.

## Security Features

### Authentication & Authorization

#### ✅ Authentik OAuth2/OIDC Integration
- **Industry-standard OAuth2** with Authorization Code flow + PKCE
- **OIDC token validation** using Authentik's public keys (JWKS)
- **No passwords stored** in application - managed by Authentik
- **Ready for 2FA** - can be enabled in Authentik settings
- **Social login support** - Easy to add Google, GitHub, etc.

See [AUTHENTIK_SETUP.md](AUTHENTIK_SETUP.md) for configuration details.

### API Security

#### Rate Limiting
- **100 requests per minute** per IP address (configurable)
- In-memory rate limiter with automatic cleanup
- Prevents DoS attacks and brute force attempts

**Configuration:**
```env
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

#### Request Size Limits
- **Maximum 10MB** request body size (configurable)
- Prevents memory exhaustion attacks

**Configuration:**
```env
MAX_REQUEST_SIZE=10485760  # 10MB in bytes
```

#### Security Headers
All responses include comprehensive security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filter |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS (production only) |
| `Content-Security-Policy` | `default-src 'self'; ...` | Restrict resource loading |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | Restrictive | Disable unnecessary browser features |

#### CORS Configuration
- **Development**: Wildcard (`*`) for easy local testing
- **Production**: Strict origin whitelist

**Configuration:**
```env
# Single origin
ALLOWED_ORIGINS=https://example.com

# Multiple origins (comma-separated)
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

#### Request ID Tracking
- Every request gets a unique `X-Request-ID` header
- Enables request tracing across logs
- Useful for debugging and security audits

### Input Validation & Sanitization

#### XSS Protection
- HTML/script tag removal from user input
- Event handler (`onclick`, etc.) stripping
- `javascript:` and `data:` protocol filtering
- HTML entity escaping

**Available Utilities:**
```go
import "github.com/JorgeSaicoski/portfolio-manager/backend/internal/shared/middleware"

// Remove all HTML
clean := middleware.SanitizeString(userInput)

// Allow safe HTML tags
safeHTML := middleware.SanitizeHTML(richText)

// Validate email
valid := middleware.ValidateEmail(email)

// Validate URL (blocks javascript:, data: protocols)
valid := middleware.ValidateURL(url)

// Sanitize filename (prevent path traversal)
safe := middleware.SanitizeFilename(filename)
```

#### SQL Injection Protection
- ✅ **GORM ORM** with parameterized queries
- ✅ **Prepared statements** enabled
- ✅ **No raw SQL** in application code

#### DTOs with Validation
All API inputs validated using struct tags:
```go
type CreatePortfolioDTO struct {
    Title       string `json:"title" binding:"required,min=1,max=200"`
    Description string `json:"description" binding:"max=1000"`
    Email       string `json:"email" binding:"required,email"`
}
```

### Database Security

#### Connection Security
- ✅ **Environment variables only** for credentials
- ✅ **Connection pooling** with limits
- ✅ **Query timeouts** (30 seconds default)
- ✅ **Prepared statement caching**

**Configuration:**
```env
DB_QUERY_TIMEOUT=30
DB_MAX_IDLE_CONNS=10
DB_MAX_OPEN_CONNS=100
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=10m
```

#### Database Logging
- **Development**: Full query logging
- **Production**: Error-level only (no query exposure)

**Configuration:**
```env
DB_LOG_LEVEL=error  # silent, error, warn, info
```

### Monitoring & Observability

#### Prometheus Metrics
- **Protected by basic auth** (configurable)
- Metrics available at `/metrics` endpoint

**Configuration:**
```env
PROMETHEUS_AUTH_USER=admin
PROMETHEUS_AUTH_PASSWORD=changeme-secure-password
```

**Access:**
```bash
curl -u admin:password http://localhost:8000/metrics
```

#### Structured Logging
- JSON-formatted logs with context
- Request IDs for tracing
- IP addresses logged for security auditing
- Sensitive data redacted in production

### Error Handling

#### Production Mode
- **Generic error messages** to prevent information disclosure
- **Full error details** logged server-side with request context
- **No stack traces** exposed to clients
- **Request IDs** included for support

#### Development Mode
- Detailed error messages for debugging
- Stack traces available
- Query logging enabled

## Security Best Practices

### For Developers

#### 1. Input Validation
```go
// ✅ GOOD - Validate and sanitize
func CreateProject(dto ProjectDTO) error {
    // Validate struct
    if err := validator.Validate(dto); err != nil {
        return err
    }

    // Sanitize text fields
    dto.Description = middleware.SanitizeHTML(dto.Description)

    // Proceed with creation
    // ...
}

// ❌ BAD - Direct database insertion
func CreateProject(title, desc string) error {
    db.Exec("INSERT INTO projects VALUES (?, ?)", title, desc)
}
```

#### 2. Authentication Checks
```go
// ✅ GOOD - Protect route
protected := router.Group("/api/portfolios")
protected.Use(middleware.AuthMiddleware())
{
    protected.POST("", handler.Create)
    protected.PUT("/:id", handler.Update)
}

// ❌ BAD - Unprotected sensitive endpoint
router.POST("/api/portfolios", handler.Create)
```

#### 3. Error Handling
```go
// ✅ GOOD - Safe error response
if err := db.Create(&portfolio).Error; err != nil {
    logger.WithError(err).Error("Failed to create portfolio")
    return c.JSON(500, gin.H{"error": "Failed to create portfolio"})
}

// ❌ BAD - Leaking implementation details
if err := db.Create(&portfolio).Error; err != nil {
    return c.JSON(500, gin.H{"error": err.Error()})
}
```

#### 4. File Uploads (Future)
```go
// ✅ GOOD - Validate file type and size
func UploadImage(file *multipart.FileHeader) error {
    // Check file size
    if file.Size > 5*1024*1024 {
        return errors.New("file too large")
    }

    // Validate extension
    allowed := []string{"jpg", "jpeg", "png", "gif"}
    if !middleware.ValidateFileExtension(file.Filename, allowed) {
        return errors.New("invalid file type")
    }

    // Sanitize filename
    filename := middleware.SanitizeFilename(file.Filename)

    // Check magic bytes (MIME type)
    // ... validate actual file content

    // Save file
    // ...
}
```

### For Operations

#### 1. Environment Variables
```bash
# ✅ GOOD - Use strong, random values
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60)
JWT_SECRET=$(openssl rand -base64 32)
PROMETHEUS_AUTH_PASSWORD=$(openssl rand -base64 24)

# ❌ BAD - Weak or default values
AUTHENTIK_SECRET_KEY=changeme
JWT_SECRET=secret123
```

#### 2. CORS Configuration
```bash
# ✅ GOOD - Production with specific origins
ALLOWED_ORIGINS=https://example.com,https://www.example.com

# ⚠️ ACCEPTABLE - Development only
ALLOWED_ORIGINS=*

# ❌ BAD - Production with wildcard
# GIN_MODE=release
# ALLOWED_ORIGINS=*
```

#### 3. HTTPS in Production
```bash
# ✅ GOOD - Always use HTTPS
AUTHENTIK_ISSUER=https://auth.example.com/application/o/portfolio-manager/

# ❌ BAD - HTTP in production
# AUTHENTIK_ISSUER=http://auth.example.com/application/o/portfolio-manager/
```

## Security Checklist for Deployment

### Before Going to Production

- [ ] **Change all default passwords**
  - [ ] Database passwords
  - [ ] Prometheus auth credentials
  - [ ] Authentik admin password

- [ ] **Generate secure secrets**
  - [ ] `AUTHENTIK_SECRET_KEY` (min 50 characters)
  - [ ] Use `openssl rand -base64 60`

- [ ] **Configure CORS properly**
  - [ ] Set `ALLOWED_ORIGINS` to specific domains
  - [ ] Never use `*` in production

- [ ] **Enable HTTPS**
  - [ ] Update all URLs to use `https://`
  - [ ] Configure SSL certificates
  - [ ] Set `GIN_MODE=release`

- [ ] **Database security**
  - [ ] Use strong database passwords
  - [ ] Restrict database user permissions (least privilege)
  - [ ] Enable SSL for database connections (`DB_SSLMODE=require`)

- [ ] **Rate limiting**
  - [ ] Adjust limits based on expected traffic
  - [ ] Monitor for abuse patterns

- [ ] **Monitoring**
  - [ ] Set up Prometheus alerts
  - [ ] Configure log aggregation
  - [ ] Enable database audit logging

- [ ] **Authentik configuration**
  - [ ] Enable 2FA for admin accounts
  - [ ] Review session timeout settings
  - [ ] Configure password policies
  - [ ] Set up email verification

- [ ] **Network security**
  - [ ] Use firewall rules
  - [ ] Restrict database access to application only
  - [ ] Use private networks where possible

- [ ] **Backups**
  - [ ] Set up automated database backups
  - [ ] Test backup restoration
  - [ ] Encrypt backup files

## Vulnerability Reporting

### Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email the security team at: **[your-security-email@example.com]**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: Within 48-72 hours
  - High: Within 1-2 weeks
  - Medium: Within 1 month
  - Low: Next scheduled release

### Disclosure Policy

- We follow **responsible disclosure**
- Vulnerabilities will be fixed before public disclosure
- Credits will be given to reporters (unless requested otherwise)

## Security Updates

### Keeping Dependencies Updated

```bash
# Backend (Go)
cd backend
go get -u ./...
go mod tidy

# Frontend (Node.js)
cd frontend
npm audit fix
npm update

# Container images (Podman)
podman compose pull
```

**Note**: This project uses **Podman** as the container runtime with native compose support (Podman v4.0+).

### Monitoring Security Advisories

- GitHub Security Advisories (Dependabot)
- Go vulnerability database
- npm audit reports
- Authentik security announcements

## Common Security Scenarios

### 1. User Tries SQL Injection

**Attack:**
```
POST /api/portfolios
{
  "title": "'; DROP TABLE portfolios; --"
}
```

**Protection:**
- ✅ GORM uses parameterized queries
- ✅ Input validation rejects suspicious patterns
- ✅ Database user has limited permissions

### 2. Cross-Site Scripting (XSS)

**Attack:**
```
POST /api/portfolios
{
  "description": "<script>alert('XSS')</script>"
}
```

**Protection:**
- ✅ `SanitizeHTML()` removes script tags
- ✅ HTML entities escaped on output
- ✅ CSP headers prevent inline script execution

### 3. Rate Limit Bypass

**Attack:**
```bash
# Rapid requests from single IP
for i in {1..1000}; do curl http://api.example.com/; done
```

**Protection:**
- ✅ Rate limiter blocks after 100 req/min
- ✅ Returns 429 Too Many Requests
- ✅ Logs excessive requests for monitoring

### 4. Unauthorized API Access

**Attack:**
```
GET /api/portfolios/own
# No Authorization header
```

**Protection:**
- ✅ Auth middleware rejects request (401)
- ✅ No data exposed
- ✅ Attempt logged with IP address

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Authentik Security Best Practices](https://goauthentik.io/docs/security/)
- [Go Security Best Practices](https://golang.org/doc/security/best-practices)
- [Podman Security](https://docs.podman.io/en/latest/markdown/podman-1.html#security)
- [Docker Security](https://docs.docker.com/engine/security/) (if using Docker)

## License

This security policy is part of the Portfolio Manager project.
