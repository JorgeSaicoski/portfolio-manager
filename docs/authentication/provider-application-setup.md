# Authentik Provider and Application Setup Guide

This guide provides a **complete, step-by-step walkthrough** for creating an OAuth2/OIDC Provider and Application in Authentik for the Portfolio Manager.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Overview](#overview)
- [Step 1: Create OAuth2/OIDC Provider](#step-1-create-oauth2oidc-provider)
- [Step 2: Create Application](#step-2-create-application)
- [Step 3: Configure Backend Environment](#step-3-configure-backend-environment)
- [Step 4: Configure Frontend Environment](#step-4-configure-frontend-environment)
- [Step 5: Verify Configuration](#step-5-verify-configuration)
- [Understanding OAuth2 Concepts](#understanding-oauth2-concepts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Authentik is running and accessible at `http://localhost:9000`
- You have admin access to Authentik
- You have completed the initial Authentik setup (created admin account)

If you haven't set up Authentik yet, see [authentik-setup.md](./authentik-setup.md).

## Overview

To enable OAuth2/OIDC authentication, you need to create two components in Authentik:

1. **Provider**: The OAuth2/OIDC configuration (protocol settings, client credentials, scopes)
2. **Application**: The user-facing application that uses the provider (branding, URLs)

```
┌─────────────────┐
│   Application   │  ← What users see
│ "Portfolio Mgr" │
└────────┬────────┘
         │ linked to
         ▼
┌─────────────────┐
│    Provider     │  ← OAuth2 configuration
│  (OAuth2/OIDC)  │
└─────────────────┘
```

## Step 1: Create OAuth2/OIDC Provider

The provider contains all the OAuth2/OIDC protocol configuration.

### 1.1 Navigate to Providers

1. **Login to Authentik** admin panel: `http://localhost:9000/`
2. In the sidebar, click **Applications**
3. Click the **Providers** tab at the top

### 1.2 Create New Provider

1. Click the **Create** button (top right corner)
2. You'll see a list of provider types
3. Select **OAuth2/OpenID Provider**

### 1.3 Configure Basic Settings

Fill in the following fields in the **General** section:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `Portfolio Manager Provider` | Descriptive name for admin use |
| **Authentication flow** | `default-authentication-flow` | How users login (dropdown) |
| **Authorization flow** | `default-provider-authorization-explicit-consent` | How users grant consent (dropdown) |

**What are flows?**
- **Authentication flow**: The login process (username/password, 2FA, etc.)
- **Authorization flow**: The consent screen ("Portfolio Manager wants to access your profile")

### 1.4 Configure Protocol Settings

This is the most important section!

| Field | Value | Notes |
|-------|-------|-------|
| **Client type** | `Confidential` | Required for server-side apps with secrets |
| **Client ID** | `portfolio-manager` | **CRITICAL**: Must match exactly! |
| **Client Secret** | *Click "Generate"* | **IMPORTANT**: Copy this immediately! |

**Client Type Options:**
- **Confidential**: For apps with a backend that can securely store secrets (our case)
- **Public**: For mobile apps or SPAs without a backend

**⚠️ CRITICAL: Save Your Client Secret!**

After clicking "Generate", you'll see something like:
```
fsDOReE4LH6YWK25oMxLeDKqrhKCLCjBOvVg25zcjPO2p1SST1zoPmFAFyHNnuvjUHiu3FadHsFC6IHnt1MMEKqeVz6xMSlleZW3UHic3ovO9Hlp121eXxullcu2JSo4
```

**Copy this secret to your password manager or `.env` file NOW!** You cannot retrieve it later.

### 1.5 Configure Redirect URIs

Redirect URIs tell Authentik where to send users after authentication.

Click the **"+ Add"** button for each of these URIs:

```
http://localhost:3000/auth/callback
http://localhost:3000/
```

**Why two URIs?**
- `http://localhost:3000/auth/callback`: Primary callback endpoint (REQUIRED)
- `http://localhost:3000/`: Fallback for direct redirects

**⚠️ CRITICAL: URIs must match EXACTLY!**
- Include/exclude trailing slashes consistently
- Match the protocol (`http` vs `https`)
- Match the port number
- Any mismatch will cause "redirect_uri_mismatch" errors

**For Production:** Add your production URLs:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/
```

### 1.6 Configure Advanced Settings

Scroll down to the **Advanced protocol settings** section:

| Field | Value | Notes |
|-------|-------|-------|
| **Signing Key** | `authentik Self-signed Certificate` | Select from dropdown |
| **Subject mode** | `Based on the User's hashed ID` | Default - keeps user ID consistent |
| **Include claims in id_token** | ✅ Checked | Includes user info in ID token |

**What is a Signing Key?**
The cryptographic key used to sign tokens (JWTs). The self-signed certificate is fine for development and production.

**Subject Mode Options:**
- **Based on User's hashed ID**: Stable identifier (recommended)
- **Based on User's email**: Changes if email changes
- **Based on User's username**: Changes if username changes
- **Based on User's UPN**: For enterprise environments

### 1.7 Configure Scopes

Scopes determine what information the application can access.

In the **Scopes** section, add these scopes (they should be available in the multi-select dropdown):

- ✅ `openid` - **REQUIRED** for OIDC
- ✅ `email` - Access to user's email address
- ✅ `profile` - Access to user's profile (name, etc.)

**Optional scopes you might add later:**
- `offline_access` - For refresh tokens (long-lived sessions)
- `groups` - Access to user's group memberships

**What do these scopes do?**

| Scope | Provides |
|-------|----------|
| `openid` | Basic OIDC authentication (required) |
| `email` | `email`, `email_verified` claims |
| `profile` | `name`, `given_name`, `family_name`, `preferred_username` |
| `offline_access` | Refresh tokens for extended sessions |
| `groups` | User's group memberships |

### 1.8 Additional Settings (Optional)

You can leave these at defaults for now:

- **Token validity**: Default (10 minutes for access token)
- **Refresh token validity**: Default (30 days)
- **Sub Mode**: Leave as selected
- **Issuer Mode**: `Per Provider` (default)

### 1.9 Create the Provider

1. **Review all settings** - scroll through the form
2. Click the **Create** button at the bottom
3. You should see a success message and be redirected to the provider list

**✅ Provider Created!** You should now see "Portfolio Manager Provider" in the list.

## Step 2: Create Application

Now we create the user-facing application that uses this provider.

### 2.1 Navigate to Applications

1. In the Authentik admin panel, click **Applications** in the sidebar
2. You should see the **Applications** tab (not Providers)
3. Click **Create** button (top right)

### 2.2 Configure Application Settings

Fill in the following fields:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `Portfolio Manager` | User-facing name |
| **Slug** | `portfolio-manager` | **CRITICAL**: Must match client ID! |
| **Group** | Leave empty | Optional: for organizing apps |
| **Provider** | `Portfolio Manager Provider` | Select the provider you just created |

**What is a Slug?**
The slug is used in URLs: `http://localhost:9000/application/o/{slug}/`

**⚠️ IMPORTANT:** The slug must match your OIDC issuer URL!

Expected issuer: `http://localhost:9000/application/o/portfolio-manager/`

### 2.3 Configure UI Settings (Optional)

These settings affect how the application appears to users:

| Field | Value | Notes |
|-------|-------|-------|
| **Launch URL** | `http://localhost:3000` | Where "Launch" button goes |
| **Open in new tab** | ❌ Unchecked | Open in same tab |

**Optional Fields:**
- **Icon**: Upload a logo for the application (appears in user dashboard)
- **Publisher**: Your company/project name
- **Description**: Brief description of what this application does

### 2.4 Configure Policy Bindings (Optional)

Leave empty for now - this is for advanced access control.

**Policy bindings** let you restrict who can access this application based on:
- Group membership
- User attributes
- Custom logic

We'll cover this in [user-groups-permissions.md](./user-groups-permissions.md).

### 2.5 Create the Application

1. **Review all settings**
2. Click **Create** button at the bottom
3. You should see "Portfolio Manager" in the applications list

**✅ Application Created!**

### 2.6 Verify Application-Provider Link

1. Click on **Portfolio Manager** in the applications list
2. You should see:
   - **Provider**: `Portfolio Manager Provider`
   - **Launch URL**: `http://localhost:3000`
3. If the provider is not linked, click **Edit** and select it

## Step 3: Configure Backend Environment

Now we need to configure the backend to communicate with Authentik.

### 3.1 Locate Backend .env File

The backend environment variables are typically in one of these locations:
- `.env` in project root
- `backend/.env`
- Defined in `docker-compose.yml` or `compose.yaml`

### 3.2 Add/Update Authentik Variables

Add or update these variables:

```env
# Authentik OAuth2 Configuration
AUTHENTIK_URL=http://portfolio-authentik-server:9000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_CLIENT_SECRET=<paste-your-client-secret-here>
```

**⚠️ Replace `<paste-your-client-secret-here>` with the secret you copied in Step 1.4!**

### 3.3 Understanding These Variables

| Variable | Value | Why? |
|----------|-------|------|
| `AUTHENTIK_URL` | `http://portfolio-authentik-server:9000` | Backend talks to Authentik via Docker network |
| `AUTHENTIK_ISSUER` | `http://localhost:9000/application/o/portfolio-manager/` | Token validation - must match provider |
| `AUTHENTIK_CLIENT_ID` | `portfolio-manager` | Identifies this client |
| `AUTHENTIK_CLIENT_SECRET` | (long string) | Authenticates this client |

**Why different URLs?**
- Backend uses `portfolio-authentik-server:9000` - Docker internal network
- Frontend/Browser uses `localhost:9000` - External access
- The **issuer** must match what browsers see!

### 3.4 Additional Backend Variables (Optional)

```env
# Optional: CORS configuration
ALLOWED_ORIGINS=http://localhost:3000

# Optional: Token validation
AUTHENTIK_JWKS_URL=http://portfolio-authentik-server:9000/application/o/portfolio-manager/jwks/

# Optional: Introspection endpoint
AUTHENTIK_INTROSPECTION_URL=http://portfolio-authentik-server:9000/application/o/introspect/
```

## Step 4: Configure Frontend Environment

Now configure the frontend to initiate OAuth2 flows.

### 4.1 Locate Frontend .env File

Frontend environment variables are typically in:
- `frontend/.env`
- `frontend/.env.local`
- `.env` in project root (with `VITE_` prefix)

### 4.2 Add/Update Authentik Variables

Add or update these variables:

```env
# Authentik OAuth2 Configuration (Frontend)
VITE_AUTHENTIK_URL=http://localhost:9000
VITE_AUTHENTIK_CLIENT_ID=portfolio-manager
VITE_AUTHENTIK_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
VITE_AUTHENTIK_SCOPES=openid email profile
```

### 4.3 Understanding Frontend Variables

| Variable | Value | Why? |
|----------|-------|------|
| `VITE_AUTHENTIK_URL` | `http://localhost:9000` | Where to redirect for login |
| `VITE_AUTHENTIK_CLIENT_ID` | `portfolio-manager` | Client identifier |
| `VITE_AUTHENTIK_REDIRECT_URI` | `http://localhost:3000/auth/callback` | Where Authentik sends user back |
| `VITE_AUTHENTIK_ISSUER` | `http://localhost:9000/application/o/portfolio-manager/` | For token validation |
| `VITE_AUTHENTIK_SCOPES` | `openid email profile` | What permissions to request |

**Note:** Frontend uses `http://localhost:9000` because it's accessed by the user's browser, not from inside Docker.

## Step 5: Verify Configuration

### 5.1 Restart Services

Restart backend and frontend to pick up new environment variables:

```bash
# Using Podman
podman compose restart portfolio-backend portfolio-frontend

# Or using Docker
docker compose restart portfolio-backend portfolio-frontend
```

### 5.2 Check Authentik Configuration

1. **Login to Authentik** admin: `http://localhost:9000/`
2. **Navigate to Applications** → **Applications**
3. **Click on** "Portfolio Manager"
4. **Verify** you see:
   - Provider: Portfolio Manager Provider
   - Slug: portfolio-manager
   - Launch URL: http://localhost:3000

5. **Click on** the provider name link
6. **Verify**:
   - Client ID: `portfolio-manager`
   - Redirect URIs include: `http://localhost:3000/auth/callback`
   - Scopes include: `openid`, `email`, `profile`

### 5.3 Test Authorization Endpoint

Test that Authentik's authorization endpoint is accessible:

```bash
curl -v "http://localhost:9000/application/o/authorize/?client_id=portfolio-manager&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=openid%20email%20profile"
```

**Expected result:**
- HTTP 302 redirect to login page
- OR HTTP 200 with HTML login form

**If you get an error:**
- Check that Authentik is running: `podman compose ps`
- Verify client_id matches: `portfolio-manager`
- Check Authentik logs: `podman compose logs portfolio-authentik-server`

### 5.4 Test Full Login Flow

1. **Open frontend** in browser: `http://localhost:3000`
2. **Click "Login"** button
3. **You should be redirected** to: `http://localhost:9000/application/o/authorize/...`
4. **Login** with your Authentik credentials
5. **Grant consent** if prompted
6. **You should be redirected back** to: `http://localhost:3000/auth/callback`
7. **Frontend should** exchange code for tokens and log you in

**✅ If this works, your configuration is correct!**

## Understanding OAuth2 Concepts

### What is OAuth2?

OAuth2 is an authorization framework that allows applications to obtain limited access to user accounts.

**Key Players:**
1. **Resource Owner** (User): You, the person with data
2. **Client** (Portfolio Manager): The app requesting access
3. **Authorization Server** (Authentik): Issues tokens
4. **Resource Server** (Backend API): Protects the data

### The Authorization Code Flow (What We Use)

```
1. User clicks "Login"
   ↓
2. Frontend redirects to Authentik
   ↓
3. User logs in at Authentik
   ↓
4. Authentik redirects back with CODE
   ↓
5. Frontend sends CODE to Authentik
   ↓
6. Authentik returns ACCESS TOKEN
   ↓
7. Frontend uses TOKEN to call API
   ↓
8. Backend validates TOKEN with Authentik
   ↓
9. Backend returns protected data
```

**Why use codes instead of tokens directly?**
- **Security**: Tokens never pass through browser URL (where they could be logged)
- **PKCE**: Adds extra protection against interception attacks

### What are Scopes?

Scopes are permissions that define what the application can access.

**Example request:**
```
scope=openid email profile
```

**Result in token:**
```json
{
  "sub": "abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "preferred_username": "johndoe"
}
```

### What are Tokens?

**Access Token:**
- Short-lived (10 minutes default)
- Used to access protected API endpoints
- Format: JWT (JSON Web Token)

**ID Token:**
- Contains user information
- Also a JWT
- Can be decoded by client

**Refresh Token:**
- Long-lived (30 days default)
- Used to get new access tokens
- Should be stored securely

### JWT Structure

A JWT has three parts separated by dots:

```
eyJhbGc...(header).eyJzdWI...(payload).SflKxwR...(signature)
```

**Header**: Algorithm and token type
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

**Payload**: Claims (user data)
```json
{
  "sub": "abc123",
  "email": "user@example.com",
  "exp": 1699999999
}
```

**Signature**: Cryptographic signature to verify authenticity

You can decode JWTs at [jwt.io](https://jwt.io) (but never paste real tokens there in production!).

## Troubleshooting

### Error: "Invalid client identifier"

**Cause:** Client ID mismatch or provider doesn't exist.

**Solution:**
1. Verify Provider exists: Applications → Providers → Look for "Portfolio Manager Provider"
2. Check Client ID is exactly: `portfolio-manager`
3. Verify Application exists with correct slug: `portfolio-manager`
4. Check frontend `.env` has: `VITE_AUTHENTIK_CLIENT_ID=portfolio-manager`

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in the request doesn't match what's configured in Authentik.

**Solution:**
1. In Authentik, go to Applications → Providers → Portfolio Manager Provider
2. Check **Redirect URIs** section
3. Ensure it includes EXACTLY: `http://localhost:3000/auth/callback`
4. Check for trailing slashes (they matter!)
5. Verify frontend `.env` has: `VITE_AUTHENTIK_REDIRECT_URI=http://localhost:3000/auth/callback`

### Error: "unauthorized_client"

**Cause:** Client secret is wrong or client type is incorrect.

**Solution:**
1. Verify **Client Type** is `Confidential` (not Public)
2. Regenerate client secret:
   - Applications → Providers → Portfolio Manager Provider → Edit
   - Click "Generate" for Client Secret
   - Copy the new secret
3. Update backend `.env` with new secret
4. Restart backend: `podman compose restart portfolio-backend`

### Error: "invalid_scope"

**Cause:** Requested scope is not configured in provider.

**Solution:**
1. Check provider scopes: Applications → Providers → Portfolio Manager Provider
2. Ensure these scopes are selected:
   - `openid`
   - `email`
   - `profile`
3. Check frontend request isn't asking for scopes not configured
4. Verify `.env` has: `VITE_AUTHENTIK_SCOPES=openid email profile`

### Backend Returns 401 "Invalid token"

**Cause:** Token validation failing.

**Solution:**
1. Check backend can reach Authentik:
   ```bash
   podman compose exec portfolio-backend curl http://portfolio-authentik-server:9000/-/health/live/
   ```
   Should return HTTP 204

2. Verify `AUTHENTIK_ISSUER` matches exactly:
   ```env
   AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
   ```
   Note the trailing slash!

3. Check backend logs for specific error:
   ```bash
   podman compose logs portfolio-backend
   ```

4. Verify provider slug matches issuer URL:
   - Issuer: `http://localhost:9000/application/o/portfolio-manager/`
   - Slug should be: `portfolio-manager`

### CORS Errors

**Cause:** Backend not allowing requests from frontend origin.

**Solution:**
1. Add to backend `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000
   ```

2. Restart backend

3. Check backend CORS middleware configuration

### "Failed to fetch" Errors

**Cause:** Network connectivity issues.

**Solution:**
1. Check all services are running:
   ```bash
   podman compose ps
   ```

2. Verify Authentik is accessible:
   ```bash
   curl http://localhost:9000/-/health/live/
   ```

3. Check browser console for exact error

4. Verify firewall isn't blocking ports 3000, 8000, or 9000

## Next Steps

Now that you have the provider and application configured:

1. **[Setup User Enrollment](./enrollment-setup.md)** - Allow users to self-register
2. **[Configure Email Verification](./email-verification.md)** - Verify user email addresses
3. **[Setup User Groups](./user-groups-permissions.md)** - Organize users and control access
4. **[Configure Email](./email-configuration.md)** - Send emails via SMTP, SES, or SendGrid

## Additional Resources

- [Authentik OAuth2 Provider Docs](https://goauthentik.io/docs/providers/oauth2/)
- [OAuth2 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OIDC Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [JWT.io](https://jwt.io) - JWT decoder and validator
- [OAuth2 Playground](https://www.oauth.com/playground/) - Test OAuth2 flows
