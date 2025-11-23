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

### Getting Started (Choose Your Path)

**New to Authentik?** Start with:
1. **[Provider & Application Setup](provider-application-setup.md)** ⚡ (15 min)
   - Complete OAuth2/OIDC provider configuration
   - Create application and link to provider
   - Understanding OAuth2 concepts
   - Step-by-step with detailed explanations

2. **[Enrollment Setup](enrollment-setup.md)** 📝 (15 min)
   - Enable user self-registration
   - **CRITICAL**: Username field configuration
   - **NEW**: Auto-assign users to groups
   - Complete testing checklist

**Having login issues?** Quick fix:
- **[Authentik Quickstart](authentik-quickstart.md)** 🚀 (5 min)
  - Fixes "Invalid client identifier" error
  - Creates OAuth2 provider quickly
  - Gets you unstuck fast

### Complete Guides

### [Provider & Application Setup](provider-application-setup.md) 🆕
**Complete, step-by-step OAuth2 provider and application configuration**

Covers:
- Creating OAuth2/OIDC Provider with all settings explained
- Creating and linking Application
- Configuring backend and frontend environments
- Understanding OAuth2 concepts (flows, tokens, scopes)
- Comprehensive troubleshooting

**When to use:** First-time setup or when you need detailed explanations

### [Authentik Setup](authentik-setup.md)
**High-level Authentik configuration guide**

Covers:
- Initial setup and admin account creation
- Quick OAuth2/OIDC setup
- Container management with Podman

**When to use:** Overview reference or infrastructure setup

### [Authentik Quickstart](authentik-quickstart.md)
**Fix login issues in 5 minutes**

Solves:
- "Invalid client identifier" error
- OAuth2 provider not found
- Redirect URI mismatch

**When to use:** You're stuck and need a quick fix NOW

### [Enrollment Setup](enrollment-setup.md) ✨ Updated
**Enable user self-registration with group assignment**

Includes:
- ⚠️ **Username field fix** (critical!)
- Creating and configuring enrollment flow
- **NEW**: Auto-assign users to groups
- Configuring User Write stage
- Complete testing checklist
- Links to email verification and password policies

**When to use:** Allow users to register without admin intervention

### [User Groups & Permissions](user-groups-permissions.md) 🆕
**Organize users and control access with groups**

Covers:
- Creating user groups
- Assigning users to groups manually and automatically
- Group-based access policies
- Backend integration for RBAC
- Group hierarchies

**When to use:** Organize users by role and implement access control

### [Email Configuration](email-configuration.md) 🆕
**Configure email sending for notifications and verification**

Covers:
- SMTP setup (Gmail, Outlook, Office 365)
- Amazon SES integration (complete setup)
- SendGrid integration (complete setup)
- Testing email configuration
- Production best practices

**When to use:** Before setting up email verification or password reset

### [Email Verification](email-verification.md) 🆕
**Send verification emails to new users during registration**

Covers:
- Creating email verification stage
- Adding to enrollment flow
- Customizing email templates
- Testing verification flow
- Troubleshooting email issues

**When to use:** Ensure users provide valid email addresses

## User Management

### [Creating Users](user-management/creating-users.md) 🆕
**Step-by-step guide for creating and managing users in Authentik UI**

Covers:
- Creating regular and admin users
- Setting user passwords
- Activating and deactivating accounts
- Editing user information
- Common scenarios and best practices

**When to use:** Day-to-day user management through Authentik interface

### [Managing Groups](user-management/managing-groups.md) 🆕
**Guide for creating and managing user groups in Authentik UI**

Covers:
- Creating and editing groups
- Assigning users to groups
- Group hierarchies and organization
- Application-specific groups
- Multi-tenant group structures

**When to use:** Organizing users and controlling permissions

### [User Approval Setup](user-management/user-approval-setup.md) 🆕
**Configure Authentik to require admin approval for new users**

Covers:
- Setting up approval workflow in Authentik UI
- Configuring enrollment flow with inactive users
- Email notifications for admins
- Approving and rejecting users
- Testing the approval process

**When to use:** B2B applications or when user verification is required

### [Application Access Control](user-management/application-access-control.md) 🆕
**Control which users can access which applications using groups**

Covers:
- Single and multi-application access patterns
- Setting up application-specific groups
- Granting and revoking access
- Multi-organization setups
- Verifying access

**When to use:** Managing access across Portfolio Manager and other services

### [Authentik API Integration](user-management/authentik-api-integration.md) 🆕
**For developers: Integrating Authentik API for automation**

Covers:
- When to use API vs UI
- API authentication and tokens
- Referencing existing code in repository
- Common API operations
- Bulk user creation examples

**When to use:** Automating user management or bulk operations

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

## Recommended Setup Order

For a complete Authentik setup from scratch, follow this order:

### 1. Initial Setup (30-45 minutes)

1. **[Provider & Application Setup](provider-application-setup.md)** (15 min)
   - Create OAuth2/OIDC provider
   - Create application
   - Configure backend and frontend

2. **[User Groups & Permissions](user-groups-permissions.md)** (10 min)
   - Create `admins` and `users` groups
   - Add yourself to `admins` group
   - Document group structure

3. **[Enrollment Setup](enrollment-setup.md)** (15 min)
   - Configure user registration
   - Add username field (critical!)
   - Auto-assign users to `users` group
   - Test registration flow

### 2. Email Setup (20-30 minutes)

4. **[Email Configuration](email-configuration.md)** (15 min)
   - Choose provider (SMTP/SES/SendGrid)
   - Configure email backend
   - Test email sending

5. **[Email Verification](email-verification.md)** (10 min)
   - Create email verification stage
   - Add to enrollment flow
   - Test verification flow

### 3. Testing & Validation (15 minutes)

6. **Test complete flow:**
   - Register new test user
   - Verify email (if configured)
   - Check group assignment
   - Login to Portfolio Manager
   - Access protected features

7. **Review [Troubleshooting](troubleshooting.md)** for common issues

### 4. Optional Enhancements

After core setup is working:

- **Password reset flow** - Allow users to recover accounts
- **Social login** - Google, GitHub, etc.
- **2FA/MFA** - Enhanced security
- **Custom branding** - Logo, colors, themes
- **Group-based policies** - Advanced access control
- **Audit logs** - Monitor authentication events

## Next Steps After Setup

### Production Readiness

1. **Security**
   - Switch to HTTPS everywhere
   - Use strong client secrets
   - Enable 2FA for admin accounts
   - Configure rate limiting
   - Review security headers

2. **Monitoring**
   - Set up logging and alerts
   - Monitor authentication metrics
   - Track failed login attempts
   - Review audit logs regularly

3. **Backup & Recovery**
   - Backup Authentik PostgreSQL database
   - Document configuration
   - Test recovery procedures
   - Store secrets securely (Vault, AWS Secrets Manager)

4. **Performance**
   - External Authentik instance (optional)
   - Load balancing (if high traffic)
   - CDN for static assets
   - Database optimization

### Ongoing Maintenance

- **Regularly update Authentik** to latest version
- **Review and cleanup** inactive users
- **Audit group memberships** quarterly
- **Monitor email deliverability** (bounce/complaint rates)
- **Update documentation** as you make changes

---

**[⬅️ Back to Documentation](../README.md)**
