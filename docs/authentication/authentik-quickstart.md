# Authentik Quick Start - Fix Login Issues

## Current Problem

Your frontend is trying to authenticate with `client_id=portfolio-manager`, but this OAuth2 client hasn't been created in Authentik yet. This is why you're seeing:

```
"Invalid client identifier"
"The client identifier (client_id) is missing or invalid."
```

## Quick Fix - Create OAuth2 Application

### Step 1: Access Authentik Admin UI

1. **First Time Setup**: If you haven't set up an admin account yet, go to:
   ```
   http://localhost:9000/if/flow/initial-setup/
   ```

   Create your admin account:
   - Email: `admin@example.com` (or your email)
   - Username: `admin`
   - Password: (choose a strong password)

2. **Login to Authentik**: Go to `http://localhost:9000/` and login with your admin credentials

### Step 2: Create OAuth2/OIDC Provider

1. In the Authentik admin panel, navigate to **Applications** → **Providers**

2. Click **Create** button (top right)

3. Select **OAuth2/OpenID Provider**

4. Fill in the following details:

   **Basic Settings:**
   - **Name**: `Portfolio Manager Provider`
   - **Authentication flow**: `default-authentication-flow` (select from dropdown)
   - **Authorization flow**: `default-provider-authorization-explicit-consent` (select from dropdown)

   **Protocol Settings:**
   - **Client type**: `Public` **⚠️ CRITICAL: Must be Public, NOT Confidential!**
   - **Client ID**: `portfolio-manager` (IMPORTANT: must match exactly)

     **Why Public?** Browser-based applications cannot securely store client secrets.
     They must use "Public" client type with PKCE (Proof Key for Code Exchange) security.
     Setting this to "Confidential" will cause "Client ID Error" during login.

   **Redirect URIs** (Click "+ Add" for each):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/
   ```

   **Advanced Settings:**
   - **Signing Key**: Select `authentik Self-signed Certificate`
   - **Subject mode**: `Based on the User's hashed ID` (default)
   - **Include claims in id_token**: ✅ Checked

   **Scopes** - Add these scopes (they should be available by default):
   - `openid`
   - `email`
   - `profile`

5. Click **Create** at the bottom

### Step 3: Create Application

1. Navigate to **Applications** → **Applications**

2. Click **Create** button

3. Fill in the details:
   - **Name**: `Portfolio Manager`
   - **Slug**: `portfolio-manager` (IMPORTANT: must match exactly)
   - **Provider**: Select `Portfolio Manager Provider` (the one you just created)
   - **Launch URL**: `http://localhost:3000` (optional but helpful)
   - **UI Settings**: Leave as default or customize as needed

4. Click **Create**

### Step 4: Update Environment Variables

Open your `.env` file in the project root and verify/update these values:

```env
# Make sure this matches the client secret you copied from Step 2
AUTHENTIK_CLIENT_SECRET=<paste-your-client-secret-here>

# These should already be correct
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_URL=http://portfolio-authentik-server:9000
```

### Step 5: Enable User Registration (Enrollment Flow)

By default, Authentik doesn't allow users to self-register. To enable this:

1. Navigate to **Flows & Stages** → **Flows**

2. Find the flow named `portfolio-enrollment` (or create one if it doesn't exist)

3. Click on the flow to view details

4. Make sure it includes these stages:
   - **Prompt Stage** (for username, email, password)
   - **User Write Stage** (to create the user)
   - **User Login Stage** (to automatically log them in)

5. Go to **System** → **Brands** → Click on your brand (usually "authentik")

6. In the **Flow settings** section:
   - **Enrollment flow**: Select `portfolio-enrollment`

7. Click **Update**

### Step 6: Restart Services

```bash
podman compose restart portfolio-backend portfolio-frontend
```

Or if using Docker:
```bash
docker compose restart portfolio-backend portfolio-frontend
```

### Step 7: Test Login

1. Open your frontend: `http://localhost:3000`

2. Click "Login" - you should now be redirected to Authentik without errors

3. Login with your admin credentials or any user you've created

4. After successful login, you should be redirected back to `http://localhost:3000/auth/callback` and then to your app

## Troubleshooting

### Still seeing "Invalid client identifier"?

1. **Verify Client ID**: In Authentik admin → Applications → Providers → Portfolio Manager Provider
   - Ensure "Client ID" field says exactly `portfolio-manager`

2. **Check Application Slug**: In Authentik admin → Applications → Applications → Portfolio Manager
   - Ensure "Slug" field says exactly `portfolio-manager`

3. **Verify Redirect URIs**: Make sure you added both:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/`

### Token exchange fails?

1. **Check Client Secret**: Make sure the secret in your `.env` file matches the one in Authentik
   - Regenerate if needed: Authentik admin → Applications → Providers → Portfolio Manager Provider → Edit → Generate new secret

2. **Verify Issuer URL**: Must be exactly `http://localhost:9000/application/o/portfolio-manager/`

### CORS errors?

1. In your `.env`, verify:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000
   ```

2. Make sure Authentik is accessible from your frontend at `http://localhost:9000`

## Next Steps

Once login works:
- Configure the enrollment flow for user self-registration (see main [AUTHENTIK_SETUP.md](./AUTHENTIK_SETUP.md))
- Set up email verification
- Enable 2FA (optional)
- Add social login providers (optional)

## Checking Your Setup

Run these commands to verify Authentik is running:

```bash
# Check container status
podman compose ps

# View Authentik logs
podman compose logs -f portfolio-authentik-server

# Check Authentik health
curl http://localhost:9000/-/health/live/
```

Expected output for health check: HTTP 204 (no content) = healthy

## Common Configuration Values

For reference, here are the expected configuration values:

| Setting | Value |
|---------|-------|
| Authentik URL | `http://localhost:9000` |
| Client ID | `portfolio-manager` |
| Redirect URI | `http://localhost:3000/auth/callback` |
| Issuer | `http://localhost:9000/application/o/portfolio-manager/` |
| Scopes | `openid email profile` |
| Response Type | `code` (Authorization Code flow) |
| PKCE | Enabled (S256) |

## Security Notes

- The current configuration uses `http://` which is fine for local development
- In production, ALWAYS use `https://` for all URLs
- Store client secrets securely (never commit `.env` to git)
- Consider using environment-specific configuration files
