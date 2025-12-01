# API Authentication

Guide to authenticating with the Portfolio Manager API.

## Overview

The Portfolio Manager API uses OAuth2/OIDC authentication via Authentik. All protected endpoints require a valid JWT Bearer token.

## Authentication Flow

### 1. Get Access Token

**Via Authentik Login:**

1. Redirect user to Authentik login:
   ```
   http://localhost:9000/application/o/authorize/?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:3000/callback&
     response_type=code&
     scope=openid profile email
   ```

2. User logs in at Authentik

3. Authentik redirects back with authorization code:
   ```
   http://localhost:3000/callback?code=AUTHORIZATION_CODE
   ```

4. Exchange code for access token:
   ```bash
   curl -X POST http://localhost:9000/application/o/token/ \
     -d "grant_type=authorization_code" \
     -d "code=AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3000/callback"
   ```

5. Response contains access token:
   ```json
   {
     "access_token": "eyJhbGc...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "eyJhbGc...",
     "id_token": "eyJhbGc..."
   }
   ```

### 2. Use Access Token

Include the access token in the Authorization header:

```bash
curl -H "Authorization: Bearer eyJhbGc..." \
     http://localhost:8000/api/portfolios/own
```

### 3. Refresh Token (when expired)

```bash
curl -X POST http://localhost:9000/application/o/token/ \
  -d "grant_type=refresh_token" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

## Token Information

### JWT Claims

The access token contains:
```json
{
  "sub": "user-id-123",           // User ID
  "email": "user@example.com",
  "preferred_username": "username",
  "name": "Full Name",
  "given_name": "First",
  "family_name": "Last",
  "exp": 1234567890,              // Expiration timestamp
  "iat": 1234567800,              // Issued at timestamp
  "iss": "http://localhost:9000/application/o/portfolio/"
}
```

### Token Expiration

- **Access Token**: 1 hour (configurable in Authentik)
- **Refresh Token**: 30 days (configurable in Authentik)

## Authentication Patterns

### Frontend (SvelteKit)

```javascript
// Store token
localStorage.setItem('access_token', token);

// Add to requests
fetch('/api/portfolios/own', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// Handle expiration
if (response.status === 401) {
  // Token expired, refresh or redirect to login
  refreshToken();
}
```

### Backend (for testing)

```bash
# Set token as environment variable
export TOKEN="eyJhbGc..."

# Use in requests
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/portfolios/own
```

## Endpoints

### Public Endpoints (No Auth Required)

- `GET /health` - Health check
- `GET /api/portfolios/public/:id` - View public portfolio
- `GET /api/projects/public/:id` - View public project
- `GET /api/categories/public/:id` - View public category
- `GET /api/sections/public/:id` - View public section
- `GET /uploads/*` - Static files

### Protected Endpoints (Auth Required)

All endpoints under `/api/*/own/*` require authentication:

- `GET /api/portfolios/own` - List user's portfolios
- `POST /api/portfolios/own` - Create portfolio
- `PUT /api/portfolios/own/:id` - Update portfolio
- `DELETE /api/portfolios/own/:id` - Delete portfolio

See [API Overview](/backend/API_OVERVIEW.md) for complete endpoint list.

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Authorization header required"
}
```

**Cause**: Missing Authorization header
**Solution**: Add `Authorization: Bearer <token>` header

### 401 Invalid Token

```json
{
  "error": "Invalid token"
}
```

**Cause**: Malformed or expired token
**Solution**: Refresh token or login again

### 403 Forbidden

```json
{
  "error": "Access denied: portfolio belongs to another user"
}
```

**Cause**: Trying to access/modify another user's resource
**Solution**: Verify you're accessing your own resources

## Testing Mode

For development/testing, you can disable authentication:

```bash
# In .env
TESTING_MODE=true
```

**WARNING**: Never use testing mode in production!

## Security Best Practices

### Token Storage

**Frontend:**
- ✅ Use `httpOnly` cookies (recommended)
- ✅ Use `sessionStorage` for single-tab sessions
- ⚠️ Use `localStorage` only if necessary
- ❌ Never expose tokens in URLs

**Mobile:**
- ✅ Use secure storage (Keychain, Keystore)
- ❌ Never store in plain text

### Token Handling

- Always use HTTPS in production
- Validate tokens on every request
- Implement token refresh before expiration
- Clear tokens on logout
- Never log tokens

### CORS Configuration

Configure allowed origins in backend `.env`:

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Troubleshooting

### "Authorization header required"

Add header to request:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/portfolios/own
```

### "Invalid token"

1. Check token hasn't expired
2. Verify token format (should start with `eyJ`)
3. Check Authentik issuer URL matches backend configuration
4. Try getting a new token

### Token Expired

Implement refresh flow or redirect to login.

### CORS Errors

1. Check `ALLOWED_ORIGINS` in backend `.env`
2. Verify request includes credentials
3. Check browser console for specific CORS error

## Related Documentation

- [Authentication Setup](/docs/authentication/) - Configure Authentik
- [API Overview](/backend/API_OVERVIEW.md) - Complete API reference
- [API Examples](examples.md) - Request/response examples
- [Troubleshooting](/docs/authentication/troubleshooting.md)

## External Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [Authentik Documentation](https://goauthentik.io/docs/)
