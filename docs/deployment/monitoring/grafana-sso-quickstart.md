# Grafana SSO Quick Start Guide

Quick reference for setting up Grafana SSO with Authentik.

## Quick Setup (5 minutes)

### 1. Create OAuth2 Provider in Authentik
```
URL: http://localhost:9000/if/admin/
Path: Applications → Providers → Create → OAuth2/OpenID Provider

Settings:
- Name: Grafana OAuth2 Provider
- Client type: Confidential
- Redirect URI: http://localhost:3001/login/generic_oauth
- Scopes: openid, profile, email, groups

📋 Copy: Client ID and Client Secret
```

### 2. Create Application in Authentik
```
Path: Applications → Applications → Create

Settings:
- Name: Grafana
- Slug: grafana
- Provider: Grafana OAuth2 Provider
- Launch URL: http://localhost:3001
```

### 3. Update Environment Variables
```bash
# Edit .env file
nano .env

# Add these lines (replace with your values):
GRAFANA_OAUTH_CLIENT_ID=<your-client-id>
GRAFANA_OAUTH_CLIENT_SECRET=<your-client-secret>
```

### 4. Create Groups (Optional - for role mapping)
```
Path: Directory → Groups → Create

Create:
- Grafana Admins (→ Admin role)
- Grafana Editors (→ Editor role)
- Grafana Viewers (→ Viewer role)

Assign users to groups
```

### 5. Restart Grafana
```bash
podman compose --profile monitoring down
podman compose --profile monitoring up -d
```

### 6. Test Login
```
1. Go to: http://localhost:3001
2. Click: "Sign in with Authentik"
3. Login with Authentik credentials
4. Verify you're logged into Grafana
```

## Configuration Summary

| Setting | Value |
|---------|-------|
| Authentik URL | `http://localhost:9000` |
| Grafana URL | `http://localhost:3001` |
| Redirect URI | `http://localhost:3001/login/generic_oauth` |
| Required Scopes | `openid`, `profile`, `email`, `groups` |
| Admin Fallback | Username: `admin`, Password: `admin` |

## Role Mapping

| Authentik Group | Grafana Role | Permissions |
|-----------------|--------------|-------------|
| Grafana Admins | Admin | Full access + user management |
| Grafana Editors | Editor | Create/edit dashboards |
| Grafana Viewers | Viewer | Read-only access |
| (no group) | Viewer | Default for all users |

## Common Issues

### No SSO Button?
```bash
# Check env vars are set:
podman compose --profile monitoring config | grep GRAFANA_OAUTH

# If empty, add to .env and restart
```

### Invalid Redirect URI?
```
✓ Check exact match: http://localhost:3001/login/generic_oauth
✓ No trailing slash
✓ http:// not https://
```

### Wrong Role?
```
✓ Verify user in correct Authentik group
✓ Group name is case-sensitive
✓ Logout and login again
```

## Files Modified

- `docker-compose.yml` - Grafana OAuth2 configuration
- `.env` - OAuth2 client credentials
- `docs/GRAFANA_SSO_SETUP.md` - Detailed setup guide (see for troubleshooting)

## Next Steps

After SSO is working:
- [ ] Assign users to appropriate groups
- [ ] Test role permissions
- [ ] Configure dashboards
- [ ] Set up alert rules (Task 4)

For detailed troubleshooting, see: `docs/GRAFANA_SSO_SETUP.md`
