# Authentik Setup Guide

This guide walks you through setting up Authentik for OAuth2/OIDC authentication with the Portfolio Manager application.

## Prerequisites

- **Podman** v4.0+ (with native compose support)
  - [Installation Guide](https://podman.io/getting-started/installation)
- Portfolio Manager repository cloned

**Note**: This project uses **Podman** as the container runtime for security and simplicity. All commands use the native `podman compose` command (no external dependencies required).

## Step 1: Environment Variables

Add the following to your `.env` file (or create one in the project root):

```env
# Authentik Configuration
AUTHENTIK_SECRET_KEY=your-random-secret-key-here-min-50-chars
AUTHENTIK_DB_NAME=authentik
AUTHENTIK_LOG_LEVEL=info

# For OAuth2 integration
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
```

Generate a secure random key for `AUTHENTIK_SECRET_KEY`:
```bash
openssl rand -base64 60
```

## Step 2: Start Authentik

Start the services:
```bash
podman compose up -d portfolio-postgres portfolio-redis
podman compose up -d portfolio-authentik-server portfolio-authentik-worker
```

Wait for Authentik to be ready (check health):
```bash
podman compose ps
```

## Step 3: Initial Authentik Setup

1. **Access Authentik UI**: Open http://localhost:9000/if/flow/initial-setup/

2. **Create Admin Account**:
   - Email: your-admin@example.com
   - Username: admin
   - Password: (choose a strong password)

3. **Login**: http://localhost:9000/

## Step 4: Create OAuth2 Application

### 4.1 Create Provider

1. Navigate to **Applications** → **Providers**
2. Click **Create**
3. Select **OAuth2/OpenID Provider**
4. Configure:
   - **Name**: `Portfolio Manager Provider`
   - **Authentication flow**: `default-authentication-flow`
   - **Authorization flow**: `default-provider-authorization-explicit-consent`
   - **Client type**: `Confidential`
   - **Client ID**: `portfolio-manager` (or auto-generated)
   - **Client Secret**: (copy this - you'll need it!)
   - **Redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/
     ```
   - **Signing Key**: `authentik Self-signed Certificate`
   - **Scopes**:
     - `openid`
     - `email`
     - `profile`
5. Click **Create**

### 4.2 Create Application

1. Navigate to **Applications** → **Applications**
2. Click **Create**
3. Configure:
   - **Name**: `Portfolio Manager`
   - **Slug**: `portfolio-manager`
   - **Provider**: Select `Portfolio Manager Provider` (created above)
   - **Launch URL**: `http://localhost:3000`
4. Click **Create**

## Step 5: Configure Backend

Update your backend `.env` or environment variables:

```env
AUTHENTIK_URL=http://portfolio-authentik-server:9000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_CLIENT_SECRET=<paste-client-secret-from-step-4.1>
```

## Step 6: Configure Frontend

Update your frontend `.env` or `.env.local`:

```env
VITE_AUTHENTIK_URL=http://localhost:9000
VITE_AUTHENTIK_CLIENT_ID=portfolio-manager
VITE_AUTHENTIK_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
```

## Step 7: Test the Setup

1. Start all services:
   ```bash
   podman compose up -d
   ```

2. Access frontend: http://localhost:3000

3. Click "Login" - you should be redirected to Authentik

4. Login with your Authentik credentials

5. After successful login, you should be redirected back to the application

## Troubleshooting

### Authentik not starting
- Check logs: `podman compose logs portfolio-authentik-server`
- Verify PostgreSQL is healthy: `podman compose ps`
- Ensure AUTHENTIK_SECRET_KEY is set

### OAuth redirect issues
- Verify redirect URI matches exactly in Authentik provider settings
- Check browser console for errors
- Verify client ID and client secret are correct

### Token validation fails
- Check AUTHENTIK_ISSUER matches the provider configuration
- Verify backend can reach Authentik (network connectivity)
- Check backend logs for detailed error messages

## Useful Commands

```bash
# View Authentik server logs
podman compose logs -f portfolio-authentik-server

# View Authentik worker logs
podman compose logs -f portfolio-authentik-worker

# Restart Authentik
podman compose restart portfolio-authentik-server portfolio-authentik-worker

# Reset Authentik (WARNING: deletes all data)
podman compose down
podman volume rm portfolio-manager_authentik_media portfolio-manager_authentik_templates
podman compose up -d portfolio-authentik-server portfolio-authentik-worker
```

## Additional Configuration

### Enable 2FA (Optional)

1. Navigate to **Flows & Stages** → **Stages**
2. Find or create authenticator stages
3. Add to authentication flow

### Social Login (Optional)

1. Navigate to **System** → **Sources**
2. Create OAuth/OIDC sources for Google, GitHub, etc.
3. Configure client ID/secret from provider

### Custom Branding (Optional)

1. Navigate to **Customization** → **Tenants**
2. Upload custom logo
3. Customize colors and theme

## Security Notes

- Always use HTTPS in production
- Generate strong AUTHENTIK_SECRET_KEY (min 50 characters)
- Regularly update Authentik to latest version
- Enable 2FA for admin accounts
- Review Authentik audit logs regularly
- Use restrictive CORS settings in production
