# Authentication Documentation

Complete guide to setting up and configuring authentication for Portfolio Manager using Authentik.

## Quick Start

**Stuck on login?** Start here:

1. **[Authentik Quickstart](authentik-quickstart.md)** ⚡ (5 min)
   - Fixes "Invalid client identifier" error
   - Creates OAuth2 provider
   - Step-by-step with screenshots

2. **[Enrollment Setup](enrollment-setup.md)** 📝 (5 min)
   - Enable user self-registration
   - **CRITICAL**: Add username field fix included!

3. **[Troubleshooting](troubleshooting.md)** 🔧
   - Common issues and solutions
   - Error message reference

## Guides

### [Authentik Setup](authentik-setup.md)
**Complete, detailed Authentik configuration guide**

Covers:
- Initial setup and admin account creation
- OAuth2/OIDC provider configuration
- Application creation
- Advanced settings (2FA, social login, branding)

**When to use:** First-time setup or comprehensive reference

### [Authentik Quickstart](authentik-quickstart.md)
**Fix login issues in 5 minutes**

Solves:
- "Invalid client identifier" error
- OAuth2 provider not found
- Redirect URI mismatch

**When to use:** You're stuck and need a quick fix NOW

### [Enrollment Setup](enrollment-setup.md)
**Enable user self-registration**

Includes:
- ⚠️ **Username field fix** (critical!)
- Creating enrollment flow
- Configuring User Write stage
- Email verification (optional)
- Password policies

**When to use:** Allow users to register without admin intervention

### [Troubleshooting](troubleshooting.md)
**Common authentication issues and solutions**

Covers:
- Token validation failures
- CORS errors
- Backend 401 errors
- Registration problems
- Logout issues

**When to use:** Something's not working and you need answers

## Architecture Overview

```
User Browser
     │
     ▼
Frontend (Port 3000)
     │ OAuth2/OIDC
     ▼
Authentik (Port 9000)
  │            │
  │ Token      │ User DB
  ▼            ▼
Backend    PostgreSQL
(Port 8000)
```

## Authentication Flow

### Login Flow
1. User clicks "Login" → Redirected to Authentik
2. User enters credentials → Authentik validates
3. Authentik redirects back with authorization code
4. Frontend exchanges code for tokens (PKCE)
5. Frontend stores tokens → User logged in

### Registration Flow
1. User fills registration form → Redirected to Authentik
2. Authentik creates user account
3. User automatically logged in
4. Can now login to Portfolio Manager

## Configuration Reference

### Required Environment Variables

**Frontend** (`.env` or docker-compose):
```env
VITE_AUTHENTIK_URL=http://localhost:9000
VITE_AUTHENTIK_CLIENT_ID=portfolio-manager
VITE_AUTHENTIK_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
```

**Backend** (`.env`):
```env
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_CLIENT_SECRET=<from-authentik-provider>
AUTHENTIK_URL=http://portfolio-authentik-server:9000
```

### Authentik Configuration Checklist

- [ ] OAuth2 Provider created
  - Client ID: `portfolio-manager`
  - Client Type: Confidential
  - Redirect URIs configured
- [ ] Application created and linked to provider
- [ ] Enrollment flow configured (with username field!)
- [ ] Brand settings updated with flows
- [ ] Client secret added to `.env`
- [ ] Services restarted

## Security Considerations

### Development (Current)
- ✅ PKCE flow (prevents code interception)
- ✅ State parameter (CSRF protection)
- ⚠️ HTTP (not HTTPS) - okay for localhost

### Production
- ⚠️ **MUST use HTTPS** everywhere
- ⚠️ Set secure cookies (Secure, HttpOnly, SameSite)
- ⚠️ Use strong client secret
- ⚠️ Enable email verification
- ⚠️ Enforce strong passwords
- ⚠️ Consider 2FA

## Common Issues

| Issue | Quick Fix | Details |
|-------|-----------|---------|
| "Invalid client identifier" | [Quickstart Guide](authentik-quickstart.md) | OAuth2 provider not created |
| "Aborting write to empty username" | [Enrollment Setup - Step 3](enrollment-setup.md#step-3-add-username-field-critical) | Missing username field |
| Backend returns 401 | Check client secret in `.env` | [Troubleshooting](troubleshooting.md) |
| CORS errors | Verify `ALLOWED_ORIGINS` | [Troubleshooting](troubleshooting.md) |

## Next Steps

After setting up authentication:

1. **Test the flow**
   - Register a new user
   - Login with credentials
   - Access protected API endpoints

2. **Optional enhancements**
   - Email verification
   - Password reset flow
   - Social login (Google, GitHub, etc.)
   - 2FA/MFA

3. **Production readiness**
   - Switch to HTTPS
   - External Authentik instance (optional)
   - Backup Authentik database
   - Monitor authentication metrics

---

**[⬅️ Back to Documentation](../README.md)**
