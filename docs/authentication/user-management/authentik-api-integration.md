# Authentik API Integration for Developers

Brief guide for developers who need to integrate Authentik API for programmatic user management and automation.

## Table of Contents

- [When to Use the API](#when-to-use-the-api)
- [API Authentication](#api-authentication)
- [Existing Code in Repository](#existing-code-in-repository)
- [Common API Operations](#common-api-operations)
- [API Documentation](#api-documentation)
- [Example: Bulk User Creation](#example-bulk-user-creation)

---

## When to Use the API

**Use Authentik UI** (see [User Management guides](./)) for:
- Creating individual users manually
- Day-to-day user management
- Setting up groups and permissions
- Testing and learning Authentik

**Use Authentik API** (this guide) for:
- Bulk user creation (10+ users)
- Automated client onboarding
- Integrating user creation into your application code
- Scripting repetitive tasks
- CI/CD pipelines

**Rule of thumb**: If you're doing it once or occasionally, use the UI. If you're doing it repeatedly or in code, use the API.

---

## API Authentication

### Creating an API Token

1. Log in to Authentik admin: `http://localhost:9000`
2. Navigate to **Directory** → **Tokens & App passwords**
3. Click **Create** → **Token**
4. Configure:
   - **Identifier**: `api-automation` (or descriptive name)
   - **User**: Select your admin user
   - **Intent**: `API`
   - **Expiry**: Set appropriate expiry or never
5. Click **Create**
6. **Copy the token** - you won't see it again!

### Using the Token

In your code:

```go
req.Header.Set("Authorization", "Bearer YOUR_TOKEN_HERE")
```

**Store securely**:
- Use environment variables: `AUTHENTIK_API_TOKEN`
- Never commit tokens to git
- Rotate tokens regularly

---

## Existing Code in Repository

**Before writing new code, check the existing codebase:**

### Backend API Integration

Location: `backend/internal/auth/` or `backend/pkg/authentik/`

**What's already implemented**:
- Token validation middleware
- User info retrieval from Authentik
- Group membership checking
- OAuth2/OIDC client configuration

**Example usage** (check your repo for actual code):

```go
// Validate token and get user info
userInfo, err := authentik.ValidateToken(token)
if err != nil {
    // Handle error
}

// Check if user is in group
if hasGroup(userInfo.Groups, "portfolio-users") {
    // Grant access
}
```

### Scripts and Tools

Check for existing scripts:
- `scripts/create-admin-user.go` - Admin user creation
- `scripts/onboard-client.sh` - Client onboarding automation
- `backend/cmd/admin/` - Admin CLI tools

**Use existing code** instead of rewriting. It's already tested and integrated.

---

## Common API Operations

### Creating a User

**Endpoint**: `POST /api/v3/core/users/`

**Minimal Example** (see existing code for full implementation):

```go
payload := map[string]interface{}{
    "username":  "john.doe",
    "name":      "John Doe",
    "email":     "john@example.com",
    "is_active": true,
}

// POST to http://localhost:9000/api/v3/core/users/
// Header: Authorization: Bearer YOUR_TOKEN
// Body: JSON payload
```

### Adding User to Group

**Endpoint**: `POST /api/v3/core/groups/{group_uuid}/add_user/`

**Example**:

```go
payload := map[string]interface{}{
    "pk": userPK, // User's UUID
}

// POST to http://localhost:9000/api/v3/core/groups/{group_uuid}/add_user/
```

### Getting User Info

**Endpoint**: `GET /application/o/userinfo/`

**Used for**: Token validation

```go
// GET http://localhost:9000/application/o/userinfo/
// Header: Authorization: Bearer USER_ACCESS_TOKEN
// Returns user's groups, email, name, etc.
```

**Note**: This is already implemented in your backend authentication middleware.

---

## API Documentation

### Official Authentik API Docs

**Primary resource**: https://goauthentik.io/developer-docs/api/

**Your Instance**: http://localhost:9000/api/v3/schema/swagger-ui/

### Exploring the API

1. Open: `http://localhost:9000/api/v3/schema/swagger-ui/`
2. Browse available endpoints
3. Test endpoints directly in browser
4. See request/response schemas

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/v3/core/users/` | User CRUD operations |
| `/api/v3/core/groups/` | Group CRUD operations |
| `/api/v3/core/groups/{uuid}/add_user/` | Add user to group |
| `/api/v3/flows/instances/` | Flow management |
| `/application/o/userinfo/` | Get authenticated user info |

---

## Example: Bulk User Creation

### Use Case

Onboarding a new client with 50 users.

### Option 1: Use Existing Script

If your repo has a script:

```bash
# Check for existing scripts
ls scripts/

# Example usage (adjust based on your script)
./scripts/bulk-create-users.sh users.csv
```

### Option 2: Write Simple Script

**users.csv**:
```csv
username,email,name,group
john.doe,john@example.com,John Doe,portfolio-users
jane.smith,jane@example.com,Jane Smith,portfolio-users
```

**create_users.sh**:
```bash
#!/bin/bash

AUTHENTIK_URL="http://localhost:9000"
AUTHENTIK_TOKEN="your-api-token"

while IFS=, read -r username email name group
do
    echo "Creating user: $username"

    # Create user (simplified - add error handling)
    curl -X POST "$AUTHENTIK_URL/api/v3/core/users/" \
      -H "Authorization: Bearer $AUTHENTIK_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"$username\",
        \"email\": \"$email\",
        \"name\": \"$name\",
        \"is_active\": true
      }"

    # Add to group (would need group UUID - see API docs)
    # ...

done < users.csv
```

### Option 3: Use Go Program

**Check your repo first** for existing Go code in:
- `backend/cmd/admin/`
- `scripts/`
- `internal/authentik/`

If writing new code, follow existing patterns in the repo.

---

## Tips and Best Practices

### Before You Code

1. **Check existing code** - Don't reinvent the wheel
2. **Read API docs** - Understand endpoints first
3. **Test in Swagger UI** - Verify endpoints work
4. **Use existing patterns** - Follow repo conventions

### Security

- **Never commit tokens** - Use environment variables
- **Rotate tokens** - Set expiry dates
- **Limit permissions** - Use service accounts with minimal access
- **Validate input** - Sanitize all data before API calls

### Error Handling

- **Check HTTP status codes** - Handle 4xx and 5xx errors
- **Parse error messages** - Authentik returns helpful error details
- **Retry logic** - Implement for transient failures
- **Log failures** - Track what went wrong

### Performance

- **Batch operations** - Create multiple users in loop, not one at a time
- **Rate limiting** - Don't overwhelm Authentik API
- **Connection pooling** - Reuse HTTP clients
- **Async operations** - Use goroutines for parallel processing

### Testing

- **Test on dev instance** - Never test on production first
- **Use test users** - Create throwaway accounts for testing
- **Cleanup after tests** - Delete test users
- **Mock API calls** - Unit test without hitting real API

---

## Common Patterns

### Pattern 1: Client Onboarding

```go
// Pseudocode - see existing code for actual implementation

func OnboardClient(orgName, orgSlug, adminEmail string) error {
    // 1. Create organization groups
    CreateGroup(fmt.Sprintf("%s-admins", orgSlug))
    CreateGroup(fmt.Sprintf("%s-users", orgSlug))

    // 2. Create admin user
    user := CreateUser(fmt.Sprintf("%s_admin", orgSlug), adminEmail, orgName + " Admin")

    // 3. Add admin to admin group
    AddUserToGroup(user.PK, fmt.Sprintf("%s-admins", orgSlug))

    // 4. Send welcome email
    SendWelcomeEmail(adminEmail)

    return nil
}
```

### Pattern 2: Bulk Import

```go
func ImportUsers(csvPath string) error {
    users := ReadCSV(csvPath)

    for _, user := range users {
        // Create user
        created := CreateUser(user.Username, user.Email, user.Name)

        // Add to groups
        for _, group := range user.Groups {
            AddUserToGroup(created.PK, group)
        }
    }

    return nil
}
```

### Pattern 3: Token Validation

**This is already implemented in your backend**:

```go
func ValidateToken(token string) (*UserInfo, error) {
    resp, err := http.Get(
        authentikURL + "/application/o/userinfo/",
        WithHeader("Authorization", "Bearer " + token),
    )

    if resp.StatusCode != 200 {
        return nil, errors.New("invalid token")
    }

    var userInfo UserInfo
    json.Unmarshal(resp.Body, &userInfo)

    return &userInfo, nil
}
```

---

## Troubleshooting

### API Returns 401 Unauthorized

- Token is invalid or expired
- Check token in Authentik: Directory → Tokens
- Generate new token if needed

### API Returns 403 Forbidden

- Token user doesn't have required permissions
- Use admin/superuser account for token
- Check user has necessary groups/roles

### API Returns 400 Bad Request

- Check request JSON format
- Verify all required fields are present
- Check field types match API schema

### Connection Refused

- Verify Authentik is running: `docker ps | grep authentik`
- Check URL is correct (http://localhost:9000)
- Verify port 9000 is exposed

---

## Next Steps

### Learn More

- **Authentik API Docs**: https://goauthentik.io/developer-docs/api/
- **Your API Schema**: http://localhost:9000/api/v3/schema/
- **Swagger UI**: http://localhost:9000/api/v3/schema/swagger-ui/

### Existing Code

- Explore `backend/` directory for authentication code
- Check `scripts/` for automation examples
- Review `internal/auth/` or `pkg/authentik/` packages

### UI Alternatives

For manual operations, see:
- [Creating Users](creating-users.md) - Manual user creation in UI
- [Managing Groups](managing-groups.md) - Group management in UI
- [User Approval Setup](user-approval-setup.md) - Approval workflows in UI
- [Application Access Control](application-access-control.md) - Access control in UI

---

**Questions?** Check [Troubleshooting Guide](../troubleshooting.md) or [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues).
