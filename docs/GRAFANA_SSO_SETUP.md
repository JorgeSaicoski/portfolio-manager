# Grafana SSO Setup with Authentik

This guide walks you through setting up Single Sign-On (SSO) for Grafana using Authentik OAuth2/OIDC.

## Overview

After completing this setup:
- Users can login to Grafana using their Authentik credentials
- Role mapping based on Authentik groups (Admins, Editors, Viewers)
- Single logout - logging out of Grafana also logs out of Authentik
- Admin fallback still works if SSO fails

## Prerequisites

- Authentik is running and accessible at `http://localhost:9000`
- You have admin access to Authentik
- Grafana is configured in docker-compose.yml (already done)

## Step 1: Create OAuth2 Provider in Authentik

1. **Access Authentik Admin Interface**
   - Navigate to: `http://localhost:9000/if/admin/`
   - Login with your admin credentials

2. **Create OAuth2/OpenID Provider**
   - Go to: **Applications → Providers**
   - Click: **Create**
   - Select: **OAuth2/OpenID Provider**

3. **Configure Provider Settings**
   ```
   Name: Grafana OAuth2 Provider
   Authorization flow: default-provider-authorization-implicit-consent
   Client type: Confidential
   Redirect URIs: http://localhost:3001/login/generic_oauth
   Signing Key: authentik Self-signed Certificate
   ```

4. **Configure Scopes**
   - Select these scopes:
     - `openid`
     - `profile`
     - `email`
     - `groups` (important for role mapping)

5. **Save and Copy Credentials**
   - Click **Create**
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret**
   - You'll need these in Step 3

## Step 2: Create Authentik Application

1. **Create Application**
   - Go to: **Applications → Applications**
   - Click: **Create**

2. **Configure Application**
   ```
   Name: Grafana
   Slug: grafana
   Provider: Grafana OAuth2 Provider (select the one you just created)
   Launch URL: http://localhost:3001
   ```

3. **Save**
   - Click **Create**

## Step 3: Configure Environment Variables

1. **Edit .env file**
   ```bash
   cd /home/bardockgaucho/GolandProjects/portfolio-manager
   nano .env
   ```

2. **Add OAuth2 Credentials**
   Replace the empty values with your credentials from Step 1:
   ```bash
   GRAFANA_OAUTH_CLIENT_ID=<paste-client-id-here>
   GRAFANA_OAUTH_CLIENT_SECRET=<paste-client-secret-here>
   ```

3. **Save and Exit**
   - Press `Ctrl+X`, then `Y`, then `Enter`

## Step 4: Create Grafana Groups (Optional - for Role Mapping)

This step is optional but recommended for role-based access control.

1. **Create Groups in Authentik**
   - Go to: **Directory → Groups**
   - Click: **Create** for each group:
     - Name: `Grafana Admins` (full admin access)
     - Name: `Grafana Editors` (can edit dashboards)
     - Name: `Grafana Viewers` (read-only access)

2. **Assign Users to Groups**
   - Click on a group
   - Go to **Users** tab
   - Click **Add existing user** or **Create user**
   - Assign users to appropriate groups

3. **How Role Mapping Works**
   - `Grafana Admins` group → Grafana Admin role
   - `Grafana Editors` group → Grafana Editor role
   - All other users → Grafana Viewer role (default)

## Step 5: Restart Grafana

1. **Restart Grafana Container**
   ```bash
   cd /home/bardockgaucho/GolandProjects/portfolio-manager
   podman compose --profile monitoring down
   podman compose --profile monitoring up -d
   ```

2. **Wait for Services to Start**
   ```bash
   # Check if Grafana is up
   podman compose logs grafana
   ```

## Step 6: Test SSO Login

1. **Access Grafana**
   - Navigate to: `http://localhost:3001`

2. **Login with SSO**
   - You should see two login options:
     1. **Sign in with Authentik** (new SSO button)
     2. Traditional username/password (fallback)

3. **Click "Sign in with Authentik"**
   - You'll be redirected to Authentik
   - Login with your Authentik credentials
   - You'll be redirected back to Grafana
   - You should be logged in!

4. **Verify Role Mapping** (if you created groups)
   - In Grafana, click your profile icon (top right)
   - Check your role:
     - Should be "Admin" if in `Grafana Admins` group
     - Should be "Editor" if in `Grafana Editors` group
     - Should be "Viewer" otherwise

## Step 7: Test Logout

1. **Logout from Grafana**
   - Click profile icon → Sign out
   - You should be redirected to Authentik logout
   - You'll be logged out of both systems

## Troubleshooting

### SSO Button Doesn't Appear

**Problem**: Only see username/password login, no "Sign in with Authentik" button

**Solutions**:
1. Check environment variables are set:
   ```bash
   podman compose --profile monitoring config | grep GRAFANA_OAUTH
   ```
2. Verify Grafana logs:
   ```bash
   podman compose logs grafana | grep -i oauth
   ```
3. Ensure both `GRAFANA_OAUTH_CLIENT_ID` and `GRAFANA_OAUTH_CLIENT_SECRET` are set in `.env`

### "Invalid Redirect URI" Error

**Problem**: After clicking "Sign in with Authentik", get redirect URI error

**Solutions**:
1. Verify redirect URI in Authentik provider matches exactly: `http://localhost:3001/login/generic_oauth`
2. Check for typos or extra spaces
3. Ensure using `http://` not `https://` (unless you've configured SSL)

### "Unauthorized" Error After Authentik Login

**Problem**: Redirected back to Grafana but get error

**Solutions**:
1. Verify Client Secret is correct in `.env`
2. Check Authentik provider scopes include: `openid`, `profile`, `email`, `groups`
3. Restart Grafana after changing `.env`:
   ```bash
   podman compose restart grafana
   ```

### Wrong Role Assigned

**Problem**: User has wrong permissions in Grafana

**Solutions**:
1. Verify user is in correct Authentik group:
   - Go to Authentik → Directory → Groups
   - Click group → Users tab
   - Ensure user is listed
2. Check group name matches exactly (case-sensitive):
   - Must be `Grafana Admins` (not `grafana admins`)
3. Logout and login again - roles update on login

### Fallback Admin Login Not Working

**Problem**: Can't login with admin username/password

**Solutions**:
1. Admin credentials still work even with OAuth enabled
2. Username: Value of `GRAFANA_USER` in `.env` (default: `admin`)
3. Password: Value of `GRAFANA_PASSWORD` in `.env` (default: `admin`)
4. If forgotten, check `.env` file or reset:
   ```bash
   podman compose --profile monitoring down
   # Edit .env to set new password
   podman volume rm portfolio-manager_grafana_data  # WARNING: Deletes dashboards!
   podman compose --profile monitoring up -d
   ```

## Security Notes

### For Production Use

1. **Use HTTPS**
   - Update all URLs to use `https://`
   - Configure SSL certificates
   - Update Authentik provider redirect URI

2. **Strong Passwords**
   - Change default admin password in `.env`
   - Use strong, unique passwords

3. **Secure Client Secret**
   - Never commit `.env` to version control
   - Rotate secrets periodically
   - Use environment-specific secrets

4. **Group Permissions**
   - Review who has access to `Grafana Admins` group
   - Principle of least privilege - most users should be Viewers

## Advanced Configuration

### Auto-Login (Skip Grafana Login Page)

To automatically redirect to Authentik without showing Grafana login:

1. Edit `docker-compose.yml`:
   ```yaml
   - GF_AUTH_GENERIC_OAUTH_AUTO_LOGIN=true  # Change from false
   ```

2. Restart Grafana

**Note**: Admin fallback login becomes harder to access (need to manually go to `/login`)

### Custom Role Mapping

To create custom role mappings based on different group names:

1. Edit `docker-compose.yml` line 242:
   ```yaml
   - GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH=contains(groups[*], 'Your Custom Admin Group') && 'Admin' || contains(groups[*], 'Your Custom Editor Group') && 'Editor' || 'Viewer'
   ```

2. Replace group names with your Authentik group names

### Disable Fallback Login

To completely disable username/password login (SSO only):

1. Edit `docker-compose.yml`:
   ```yaml
   - GF_AUTH_DISABLE_LOGIN_FORM=true  # Add this line
   ```

2. Restart Grafana

**Warning**: Ensure SSO works first! You can be locked out if misconfigured.

## References

- [Grafana Generic OAuth Documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/)
- [Authentik Grafana Integration](https://goauthentik.io/integrations/services/grafana/)
- [Grafana Environment Variables](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)

## Summary

After completing this setup:
- ✅ Grafana SSO with Authentik is configured
- ✅ Users can login with Authentik credentials
- ✅ Role mapping works based on groups
- ✅ Admin fallback still available
- ✅ Single logout across both systems

Need help? Check the troubleshooting section or review Authentik/Grafana logs.
