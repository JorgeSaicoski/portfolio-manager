# Authentik User Groups and Permissions Guide

This guide explains how to create and manage user groups in Authentik, assign users to groups, and use groups for access control in the Portfolio Manager application.

## Table of Contents

- [Why Use Groups?](#why-use-groups)
- [Prerequisites](#prerequisites)
- [Step 1: Create User Groups](#step-1-create-user-groups)
- [Step 2: Assign Users to Groups](#step-2-assign-users-to-groups)
- [Step 3: Auto-Assign New Users to Groups](#step-3-auto-assign-new-users-to-groups)
- [Step 4: Configure Group-Based Policies](#step-4-configure-group-based-policies)
- [Step 5: Access Groups in Portfolio Manager](#step-5-access-groups-in-portfolio-manager)
- [Advanced: Group Hierarchies](#advanced-group-hierarchies)
- [Troubleshooting](#troubleshooting)

## Why Use Groups?

User groups provide several benefits:

1. **Organize Users**: Group users by role, department, or permissions
2. **Access Control**: Restrict application access to specific groups
3. **Policy Management**: Apply security policies to groups instead of individual users
4. **Simplified Management**: Add/remove users from groups instead of managing individual permissions
5. **API Authorization**: Backend can check group membership for role-based access control (RBAC)

**Common Group Examples:**
- `admins` - Full system access
- `users` - Standard user access
- `readonly` - View-only access
- `premium-users` - Access to premium features
- `beta-testers` - Access to experimental features

## Prerequisites

- Authentik is running and accessible
- You have admin access to Authentik
- OAuth2 Provider and Application are configured (see [provider-application-setup.md](./provider-application-setup.md))

## Step 1: Create User Groups

### 1.1 Navigate to Groups

1. **Login to Authentik** admin panel: `http://localhost:9000/`
2. In the sidebar, click **Directory**
3. Click **Groups**

You should see a list of existing groups (may be empty on first setup).

### 1.2 Create Admin Group

Let's create an administrators group first.

1. Click **Create** button (top right)

2. Fill in the **Group** form:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Name** | `admins` | Group identifier (lowercase, no spaces) |
   | **Label** (optional) | `Administrators` | Human-readable display name |
   | **Parent** | (leave empty) | For flat structure |
   | **Attributes** | (leave empty for now) | Custom JSON attributes |

3. Click **Create**

**✅ Admin group created!**

### 1.3 Create Standard Users Group

Now create a group for regular users.

1. Click **Create** button again

2. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `users` |
   | **Label** | `Standard Users` |
   | **Parent** | (leave empty) |

3. Click **Create**

### 1.4 Create Additional Groups (Optional)

Create any additional groups you need:

**Example: Read-Only Group**
- **Name**: `readonly`
- **Label**: `Read-Only Users`

**Example: Premium Users Group**
- **Name**: `premium`
- **Label**: `Premium Users`

**Example: Beta Testers Group**
- **Name**: `beta`
- **Label**: `Beta Testers`

### 1.5 Review Your Groups

You should now see your groups listed:

```
Groups
- admins (Administrators)
- users (Standard Users)
- readonly (Read-Only Users)
- premium (Premium Users)
- beta (Beta Testers)
```

## Step 2: Assign Users to Groups

Now let's assign existing users to groups.

### 2.1 Assign via User Profile

**Method 1: From the User's Profile**

1. Navigate to **Directory** → **Users**
2. Click on a user (e.g., your admin user)
3. Click the **Groups** tab
4. Click **Add to Group** button
5. Select the group(s) from the dropdown (e.g., `admins`)
6. Click **Add**

**✅ User added to group!**

### 2.2 Assign via Group Page

**Method 2: From the Group's Page**

1. Navigate to **Directory** → **Groups**
2. Click on a group (e.g., `admins`)
3. Click the **Users** tab
4. Click **Add existing user** button
5. Select user(s) from the dropdown
6. Click **Add**

### 2.3 Bulk Assign Users

To assign multiple users at once:

1. Go to **Directory** → **Groups**
2. Click on the group
3. Click **Users** tab
4. Click **Add existing user**
5. **Hold Ctrl/Cmd** and click multiple users in the dropdown
6. Click **Add**

### 2.4 Verify User Membership

To verify a user is in a group:

**Check from User:**
1. Directory → Users → Click user
2. Check **Groups** tab - you should see the groups listed

**Check from Group:**
1. Directory → Groups → Click group
2. Check **Users** tab - you should see the users listed

## Step 3: Auto-Assign New Users to Groups

When users self-register via the enrollment flow, you can automatically add them to a default group.

### 3.1 Create Group Membership Policy

1. Navigate to **Policies** → **Policies**
2. Click **Create** → **Group Membership Policy**
3. Configure the policy:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Name** | `auto-assign-users-group` | Descriptive name |
   | **Group** | `users` | The group to assign new users to |

4. Click **Create**

### 3.2 Bind Policy to Enrollment Flow

Now we'll apply this policy to the enrollment flow.

1. Navigate to **Flows & Stages** → **Flows**
2. Find and click on `default-enrollment-flow` (or your custom enrollment flow)
3. Click the **Stage Bindings** tab
4. Find the **User Write** stage in the list (e.g., `user-write`, `enrollment-user-write`)
5. Click on the stage name to edit it

### 3.3 Configure User Write Stage Groups

1. In the User Write stage configuration, scroll to **Groups** section
2. Click **Add Group** or select from **Groups** dropdown
3. Select `users` (or your default group)
4. Click **Update** to save

**Alternative Method: Using Group Membership Stage**

For more control, you can add a dedicated stage:

1. Navigate to **Flows & Stages** → **Stages**
2. Click **Create** → **User Write Stage** (if you need a new one)
3. Or create **Prompt Stage** that includes group selection
4. In the stage, configure **Groups** to add users to

### 3.4 Test Auto-Assignment

1. Logout from Authentik (or use incognito mode)
2. Go to enrollment URL: `http://localhost:9000/if/flow/default-enrollment-flow/`
3. Register a new test user
4. After registration, login to Authentik admin
5. Go to **Directory** → **Users** → Find the test user
6. Click **Groups** tab
7. **Verify** the user is in the `users` group

**✅ If the user appears in the group, auto-assignment is working!**

## Step 4: Configure Group-Based Policies

Use groups to control access to applications and features.

### 4.1 Restrict Application Access by Group

Let's restrict Portfolio Manager to users in the `users` or `admins` groups.

1. Navigate to **Applications** → **Applications**
2. Click on **Portfolio Manager**
3. Click the **Policy Bindings** tab
4. Click **Create Binding**

5. In the **Create Policy Binding** form:
   - Click **Create Policy** button (or select existing)
   - Select **Group Membership Policy**
   - Configure:
     - **Name**: `require-users-group`
     - **Group**: `users`
   - Click **Create**

6. The policy is now bound to the application

7. **Add another policy** for admins:
   - Click **Create Binding** again
   - Create or select policy for `admins` group
   - Use **OR** logic (either users OR admins can access)

### 4.2 Configure Policy Logic

By default, policies use **AND** logic (all policies must pass).

To use **OR** logic (any policy can pass):

1. On the **Policy Bindings** tab
2. Look for **Policy engine mode** setting
3. Select:
   - **any** - OR logic (user passes if ANY policy passes)
   - **all** - AND logic (user passes if ALL policies pass)

**For our case:** Select **any** so users in `users` OR `admins` can access.

### 4.3 Test Group-Based Access

1. **Create a test user** NOT in any group:
   - Directory → Users → Create
   - Username: `testuser`
   - Don't add to any groups

2. **Try to access Portfolio Manager** as this user:
   - Logout from admin
   - Login as `testuser`
   - Try to access `http://localhost:3000`
   - You should be **denied access** or see "Insufficient permissions"

3. **Add user to `users` group:**
   - Login as admin
   - Directory → Users → `testuser` → Groups tab
   - Add to `users` group

4. **Try again** - should now work!

## Step 5: Access Groups in Portfolio Manager

The Portfolio Manager backend can access user group memberships to implement role-based access control.

### 5.1 Add Groups Scope to Provider

First, ensure the `groups` scope is available:

1. Navigate to **Applications** → **Providers**
2. Click **Portfolio Manager Provider**
3. Scroll to **Scopes** section
4. **Add** `groups` scope (if not already present)
5. Click **Update**

### 5.2 Update Frontend to Request Groups

Update frontend `.env` to request the `groups` scope:

```env
VITE_AUTHENTIK_SCOPES=openid email profile groups
```

### 5.3 Backend Access to Groups

When the backend validates tokens, group information will be included:

**Example ID Token claims:**
```json
{
  "sub": "abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "preferred_username": "johndoe",
  "groups": ["users", "premium"]
}
```

**Backend can check groups:**
```go
// Example in Go
if contains(userClaims.Groups, "admins") {
    // User is admin - allow privileged operations
}

if contains(userClaims.Groups, "premium") {
    // User has premium access
}
```

### 5.4 Example: Admin-Only Endpoint

**Backend implementation example:**

```go
// Middleware to require admin group
func RequireAdmin(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        claims := getClaimsFromContext(r.Context())

        if !contains(claims.Groups, "admins") {
            http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
            return
        }

        next.ServeHTTP(w, r)
    })
}

// Protected route
router.Handle("/api/admin/users", RequireAdmin(adminUsersHandler))
```

**Frontend can show/hide features:**
```javascript
// Example in JavaScript
const userGroups = user.groups || [];

const isAdmin = userGroups.includes('admins');
const isPremium = userGroups.includes('premium');

// Show admin panel only to admins
if (isAdmin) {
    showAdminPanel();
}

// Show premium features
if (isPremium) {
    enablePremiumFeatures();
}
```

### 5.5 Example Group-Based Authorization Matrix

| Feature | Required Group | API Endpoint |
|---------|----------------|--------------|
| View portfolio | `users` | `GET /api/portfolios` |
| Edit portfolio | `users` | `PUT /api/portfolios/:id` |
| Delete portfolio | `users` | `DELETE /api/portfolios/:id` |
| View all users | `admins` | `GET /api/admin/users` |
| Manage users | `admins` | `POST/PUT/DELETE /api/admin/users` |
| Access premium features | `premium` | `GET /api/premium/*` |
| View analytics | `users` or `premium` | `GET /api/analytics` |
| Export data | `premium` | `GET /api/export` |

## Advanced: Group Hierarchies

Authentik supports nested groups for complex organizational structures.

### 6.1 Create Parent-Child Groups

**Example: Organizational structure**

```
company (parent)
  ├── engineering (child)
  │     ├── frontend-team
  │     └── backend-team
  ├── sales (child)
  └── support (child)
```

**To create hierarchy:**

1. Create parent group first: `engineering`
2. Create child group: `frontend-team`
3. When creating child, select **Parent**: `engineering`
4. Repeat for other children

### 6.2 Inherited Permissions

Users in child groups inherit permissions from parent groups.

**Example:**
- Policy applies to `engineering` group
- Users in `frontend-team` (child of `engineering`) also get access

### 6.3 Query Parent Groups

When checking group membership, Authentik includes parent groups:

```json
{
  "groups": ["frontend-team", "engineering", "company"]
}
```

The user is directly in `frontend-team`, but also gets `engineering` and `company`.

## Troubleshooting

### Groups Not Appearing in Token

**Cause:** `groups` scope not requested or not configured.

**Solution:**
1. Check provider includes `groups` scope:
   - Applications → Providers → Portfolio Manager Provider
   - Scopes section should include `groups`

2. Check frontend requests groups scope:
   ```env
   VITE_AUTHENTIK_SCOPES=openid email profile groups
   ```

3. Clear cookies and login again

4. Decode the ID token at [jwt.io](https://jwt.io) and verify `groups` claim exists

### User Not Auto-Assigned to Group

**Cause:** User Write stage not configured with default groups.

**Solution:**
1. Navigate to Flows & Stages → Flows → `default-enrollment-flow`
2. Click Stage Bindings tab
3. Find User Write stage, click to edit
4. Scroll to **Groups** section
5. Add the default group (e.g., `users`)
6. Save and test with new user registration

### Group Policy Not Working

**Cause:** Policy not bound to application or flow.

**Solution:**
1. Verify policy exists:
   - Policies → Policies
   - Look for your group membership policy

2. Verify policy is bound:
   - Applications → Applications → Portfolio Manager
   - Policy Bindings tab
   - Should see your policy listed

3. Check policy logic:
   - If multiple policies, ensure mode is `any` or `all` as appropriate

4. Check user is actually in the group:
   - Directory → Users → [username] → Groups tab

### Backend Not Receiving Groups Claim

**Cause:** Token validation not extracting groups.

**Solution:**
1. Verify `groups` scope is requested by frontend

2. Check backend token parsing includes `groups` field:
   ```go
   type Claims struct {
       jwt.RegisteredClaims
       Email    string   `json:"email"`
       Name     string   `json:"name"`
       Groups   []string `json:"groups"`  // Make sure this is present
   }
   ```

3. Log the raw token claims to verify groups are present

4. Check backend logs for token validation errors

### User in Group But Still Denied Access

**Cause:** Case sensitivity or typo in group name.

**Solution:**
1. Verify exact group name:
   - Directory → Groups → Check name
   - Groups are case-sensitive: `Users` ≠ `users`

2. Check backend code uses exact match:
   ```go
   if contains(claims.Groups, "users") { // lowercase!
   ```

3. Log the actual groups received:
   ```go
   log.Printf("User groups: %v", claims.Groups)
   ```

## Best Practices

### Naming Conventions

- Use **lowercase** for group names: `admins`, not `Admins`
- Use **descriptive names**: `readonly-users`, not `ro`
- Use **labels** for human-readable names

### Group Structure

- **Start simple**: Just `admins` and `users` groups
- **Add as needed**: Don't over-engineer initially
- **Use hierarchies** only if you have complex organizational needs

### Security

- **Least privilege**: Give users minimum necessary group memberships
- **Review regularly**: Audit group memberships quarterly
- **Remove unused groups**: Clean up groups no longer needed
- **Monitor admin group**: Keep admin membership list small and audited

### Integration

- **Document group meanings**: Keep a table of what each group can access
- **Consistent naming**: Use same group names in backend authorization logic
- **Test group policies**: Verify with test users before deploying

## Example: Complete Group Setup

Here's a recommended starting configuration:

### Groups to Create

```
admins - Full system access
users - Standard authenticated users
premium - Users with premium features
readonly - Read-only access (for reporting tools)
```

### Auto-Assignment

- New enrollments → `users` group

### Application Access

- Portfolio Manager → Requires `users` OR `admins` group

### Backend Authorization

```go
// Can view portfolios
if contains(groups, "users") || contains(groups, "admins") || contains(groups, "readonly") {
    // allow
}

// Can modify portfolios
if contains(groups, "users") || contains(groups, "admins") {
    // allow
}

// Can access admin endpoints
if contains(groups, "admins") {
    // allow
}

// Can access premium features
if contains(groups, "premium") || contains(groups, "admins") {
    // allow
}
```

## Next Steps

After setting up groups:

1. **[Configure Email Verification](./email-verification.md)** - Verify user emails
2. **[Setup Email Configuration](./email-configuration.md)** - Configure SMTP, SES, or SendGrid
3. **Test group-based access** in your application
4. **Document** your group structure and permissions
5. **Train users** on how to request group membership changes

## Additional Resources

- [Authentik Groups Documentation](https://goauthentik.io/docs/users-sources/user/group/)
- [Authentik Policies Documentation](https://goauthentik.io/docs/policies/)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)
