# Portfolio Manager - Authentication Setup Guide

## Quick Start - Fix Login Issues NOW

If you're seeing **"Invalid client identifier"** errors when trying to login, follow these steps:

### 1. Create OAuth2 Provider in Authentik (5 minutes)

Follow the detailed guide: **[AUTHENTIK_QUICKSTART.md](./AUTHENTIK_QUICKSTART.md)**

**TL;DR:**
1. Go to `http://localhost:9000/if/flow/initial-setup/` and create admin account (if first time)
2. Login to `http://localhost:9000/`
3. Create OAuth2 Provider: Applications → Providers → Create
   - Client ID: `portfolio-manager`
   - Redirect URIs: `http://localhost:3000/auth/callback` and `http://localhost:3000/`
   - Copy the generated Client Secret
4. Create Application: Applications → Applications → Create
   - Link to the provider you just created
5. Update `.env` file with the Client Secret
6. Restart services: `podman compose restart portfolio-backend portfolio-frontend`
7. Test login at `http://localhost:3000/auth/login`

### 2. Enable User Registration (5 minutes)

Follow the detailed guide: **[ENROLLMENT_SETUP.md](./ENROLLMENT_SETUP.md)**

**TL;DR:**
1. In Authentik admin: System → Brands → Your brand
2. Set **Enrollment flow** to `default-enrollment-flow`
3. Click Update
4. Test registration at `http://localhost:3000/auth/register`

---

## Architecture Overview

Your Portfolio Manager uses **Authentik** as the authentication provider with OAuth2/OIDC:

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ 1. Visit app
         ▼
┌─────────────────────────┐
│  Frontend (Port 3000)   │
│  - Login redirects to   │
│    Authentik            │
│  - Receives OAuth code  │
│  - Exchanges for tokens │
└────────┬────────────────┘
         │
         │ 2. Redirect to Authentik
         ▼
┌──────────────────────────┐
│ Authentik (Port 9000)    │
│ - Handles login UI       │
│ - User authentication    │
│ - Issues OAuth tokens    │
└────────┬─────────────────┘
         │
         │ 3. Send tokens
         ▼
┌─────────────────────────┐
│  Backend API (Port 8000)│
│  - Validates tokens     │
│  - Extracts user info   │
│  - Authorizes requests  │
└─────────────────────────┘
```

## What's Been Fixed

### Frontend Changes

**File: [frontend/src/lib/stores/auth.ts](frontend/src/lib/stores/auth.ts)**

Added `register()` method that redirects users to Authentik's enrollment flow:

```typescript
async register(username: string, email: string, password: string): Promise<ApiResponse<void>>
```

**File: [frontend/src/lib/components/auth/Register.svelte](frontend/src/lib/components/auth/Register.svelte)**

- Updated to call the new `register()` method
- Added informational message about redirect to Authentik
- Improved user experience during registration flow

### Documentation Created

1. **[AUTHENTIK_QUICKSTART.md](./AUTHENTIK_QUICKSTART.md)** - Fix login issues immediately
2. **[ENROLLMENT_SETUP.md](./ENROLLMENT_SETUP.md)** - Enable user self-registration
3. **[AUTHENTIK_SETUP.md](./AUTHENTIK_SETUP.md)** - Complete setup guide (existing)

## Current Authentication Flow

### Login Flow

1. User clicks "Login" at `http://localhost:3000/auth/login`
2. Frontend redirects to Authentik: `http://localhost:9000/application/o/authorize/`
3. User enters credentials in Authentik's login page
4. Authentik redirects back to: `http://localhost:3000/auth/callback?code=...&state=...`
5. Frontend exchanges authorization code for tokens (access_token, id_token)
6. Tokens are stored in cookies and localStorage
7. User is redirected to the main app

### Registration Flow

1. User clicks "Register" at `http://localhost:3000/auth/register`
2. User fills out registration form (username, email, password)
3. Frontend redirects to Authentik: `http://localhost:9000/if/flow/default-enrollment-flow/`
4. Authentik creates the user account
5. User is automatically logged in
6. User can now use those credentials to login to Portfolio Manager

### Token Validation (Backend)

1. Frontend sends API requests with `Authorization: Bearer {access_token}` header
2. Backend validates token using OIDC discovery
3. Backend extracts user claims (sub, email, name, etc.)
4. Backend authorizes request based on user identity

## Configuration Files

### Frontend Environment Variables

**File: `frontend/.env` (create if missing)**

```env
VITE_AUTHENTIK_URL=http://localhost:9000
VITE_AUTHENTIK_CLIENT_ID=portfolio-manager
VITE_AUTHENTIK_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
```

### Backend Environment Variables

**File: `.env` (in project root)**

```env
# Authentik OAuth2 Configuration
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_CLIENT_SECRET=<your-generated-secret-from-authentik>
AUTHENTIK_URL=http://portfolio-authentik-server:9000

# Backend API
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio_db
DB_USER=portfolio_user
DB_PASSWORD=portfolio_pass
```

### Authentik Configuration (in Authentik UI)

**OAuth2 Provider Settings:**
- Name: `Portfolio Manager Provider`
- Client Type: `Confidential`
- Client ID: `portfolio-manager`
- Redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/`
- Scopes: `openid`, `email`, `profile`
- Signing Key: `authentik Self-signed Certificate`

**Application Settings:**
- Name: `Portfolio Manager`
- Slug: `portfolio-manager`
- Provider: Link to `Portfolio Manager Provider`
- Launch URL: `http://localhost:3000`

**Brand Settings (for enrollment):**
- Enrollment Flow: `default-enrollment-flow`
- Authentication Flow: `default-authentication-flow`

## Testing Your Setup

### Test Login

```bash
# 1. Start all services
podman compose up -d

# 2. Check services are running
podman compose ps

# 3. Open frontend
# Visit: http://localhost:3000/auth/login

# 4. You should be redirected to Authentik
# Expected URL: http://localhost:9000/application/o/authorize/?client_id=...

# 5. Login with your Authentik credentials

# 6. You should be redirected back to your app
# Expected URL: http://localhost:3000/auth/callback?code=...

# 7. Check browser console for any errors
# Should see successful token exchange
```

### Test Registration

```bash
# 1. Open registration page
# Visit: http://localhost:3000/auth/register

# 2. Fill in registration form
# - Username: testuser
# - Email: test@example.com
# - Password: TestPass123

# 3. Click "Continue to Registration"

# 4. You should be redirected to Authentik enrollment
# Expected URL: http://localhost:9000/if/flow/default-enrollment-flow/

# 5. Complete the Authentik registration form

# 6. After registration, you should be automatically logged in

# 7. Try logging out and logging back in with new credentials
```

### Verify Backend Token Validation

```bash
# 1. Login to the app (get an access token)

# 2. Open browser DevTools → Application → Cookies
# Copy the value of 'auth-token' cookie

# 3. Make an authenticated API request
curl -H "Authorization: Bearer <your-access-token>" \
     http://localhost:8000/api/portfolios/own

# Expected: 200 OK with your portfolio data
# If 401 Unauthorized: Token validation is failing
```

## Troubleshooting

### "Invalid client identifier" Error

**Symptom:** Login redirects to Authentik but shows error

**Solution:**
1. The OAuth2 provider doesn't exist yet
2. Follow [AUTHENTIK_QUICKSTART.md](./AUTHENTIK_QUICKSTART.md) to create it
3. Verify Client ID is exactly `portfolio-manager`
4. Check redirect URIs include `http://localhost:3000/auth/callback`

### Token Exchange Fails

**Symptom:** Redirect to `/auth/callback` but no login

**Check browser console for errors:**

```javascript
// Common errors:
"Failed to exchange authorization code for tokens"
"Invalid state parameter"
"Missing code verifier"
```

**Solutions:**
- Verify Client Secret in `.env` matches Authentik
- Clear browser localStorage and cookies, try again
- Check CORS settings: `ALLOWED_ORIGINS=http://localhost:3000`
- Check network tab for failed requests to `/application/o/token/`

### Backend Rejects Tokens (401 Unauthorized)

**Symptom:** API requests return 401

**Check backend logs:**

```bash
podman compose logs -f portfolio-backend
```

**Common issues:**
- `AUTHENTIK_ISSUER` mismatch (must be exactly `http://localhost:9000/application/o/portfolio-manager/`)
- Backend can't reach Authentik (network issue)
- Token has expired (check token expiry in JWT payload)
- Token signature invalid (check OIDC discovery at `http://localhost:9000/.well-known/openid-configuration`)

### Registration Page Not Working

**Symptom:** Click "Continue to Registration" but nothing happens or error

**Solution:**
1. Check enrollment flow exists: System → Brands → Enrollment flow
2. If not set, follow [ENROLLMENT_SETUP.md](./ENROLLMENT_SETUP.md)
3. Test enrollment URL directly: `http://localhost:9000/if/flow/default-enrollment-flow/`
4. If 404: Flow doesn't exist, create it in Flows & Stages

### CORS Errors

**Symptom:** Browser console shows CORS policy errors

**Solution:**
```env
# In .env file
ALLOWED_ORIGINS=http://localhost:3000

# Restart backend
podman compose restart portfolio-backend
```

### Services Won't Start

```bash
# Check what's running
podman compose ps

# Check logs for specific service
podman compose logs portfolio-authentik-server
podman compose logs portfolio-backend
podman compose logs portfolio-frontend

# Restart everything
podman compose down
podman compose up -d
```

## Security Considerations

### Development (Current Setup)

- Uses `http://` (not secure, but fine for localhost)
- Client secret stored in `.env` file
- Tokens stored in browser cookies + localStorage
- PKCE enabled for OAuth2 (prevents code interception)
- CSRF protection via state parameter

### Production Deployment

Before deploying to production, you MUST:

1. **Use HTTPS everywhere:**
   ```env
   VITE_AUTHENTIK_URL=https://auth.yourdomain.com
   VITE_AUTHENTIK_REDIRECT_URI=https://app.yourdomain.com/auth/callback
   AUTHENTIK_ISSUER=https://auth.yourdomain.com/application/o/portfolio-manager/
   ```

2. **Secure cookies:**
   - Set `Secure` flag on cookies (requires HTTPS)
   - Set `SameSite=Strict` or `SameSite=Lax`
   - Consider using `HttpOnly` cookies

3. **Environment variables:**
   - Use secrets management (e.g., Kubernetes secrets, AWS Secrets Manager)
   - Never commit `.env` to version control

4. **Enable email verification:**
   - Follow [ENROLLMENT_SETUP.md](./ENROLLMENT_SETUP.md) → Step 5
   - Configure real SMTP server

5. **Password policies:**
   - Enforce strong passwords (min 12 chars, complexity requirements)
   - Check against HaveIBeenPwned database

6. **Enable 2FA:**
   - Navigate to Flows & Stages → Add authenticator stages
   - Require 2FA for all users or admin accounts

7. **Regular updates:**
   - Keep Authentik updated
   - Monitor security advisories

8. **Audit logging:**
   - Enable Authentik audit logs
   - Monitor for suspicious activity

## Project Structure

```
portfolio-manager/
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── stores/
│   │   │   │   └── auth.ts              # Auth store with login/register/logout
│   │   │   └── components/
│   │   │       └── auth/
│   │   │           ├── Login.svelte     # Login component
│   │   │           └── Register.svelte  # Registration component
│   │   └── routes/
│   │       └── auth/
│   │           ├── login/+page.svelte   # Login page
│   │           ├── register/+page.svelte # Register page
│   │           └── callback/+page.svelte # OAuth callback handler
│   └── .env                              # Frontend environment variables
├── backend/
│   └── internal/
│       └── shared/
│           └── middleware/
│               └── auth.go               # Token validation middleware
├── docker-compose.yml                    # Service definitions
├── .env                                  # Backend environment variables
├── AUTHENTIK_QUICKSTART.md              # Quick fix for login issues ⭐
├── ENROLLMENT_SETUP.md                  # User registration setup ⭐
├── AUTHENTIK_SETUP.md                   # Complete Authentik guide
└── AUTHENTICATION_README.md             # This file
```

## Useful Commands

```bash
# View all running services
podman compose ps

# View Authentik logs
podman compose logs -f portfolio-authentik-server

# View backend logs
podman compose logs -f portfolio-backend

# View frontend logs
podman compose logs -f portfolio-frontend

# Restart specific service
podman compose restart portfolio-backend

# Restart all services
podman compose restart

# Stop everything
podman compose down

# Start everything
podman compose up -d

# Check Authentik health
curl http://localhost:9000/-/health/live/

# Check backend health
curl http://localhost:8000/health

# Access Authentik shell (for debugging)
podman exec -it portfolio-authentik-server /bin/bash
```

## Getting Help

If you're still stuck after following these guides:

1. **Check the logs** - Most issues show up in service logs
2. **Review configuration** - Verify all environment variables match
3. **Test components individually**:
   - Can you access Authentik UI? `http://localhost:9000/`
   - Can you access frontend? `http://localhost:3000/`
   - Can you access backend health? `http://localhost:8000/health`
4. **Clear browser state** - Clear cookies, localStorage, try incognito mode
5. **Restart services** - Sometimes things just need a restart

## Summary

You now have a complete OAuth2/OIDC authentication system with:

✅ **Secure login flow** - Users authenticate via Authentik
✅ **Self-service registration** - Users can create accounts
✅ **Token-based API authorization** - Backend validates JWT tokens
✅ **Session management** - Tokens stored securely in browser
✅ **PKCE protection** - OAuth2 code interception prevention
✅ **Production-ready architecture** - Just needs HTTPS and environment hardening

**Next steps:**
1. Follow [AUTHENTIK_QUICKSTART.md](./AUTHENTIK_QUICKSTART.md) to fix login
2. Follow [ENROLLMENT_SETUP.md](./ENROLLMENT_SETUP.md) to enable registration
3. Test both login and registration flows
4. Configure email verification (optional, for production)
5. Set up social login providers (optional)
6. Enable 2FA (optional, recommended for production)
