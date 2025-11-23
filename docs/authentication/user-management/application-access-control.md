# Application Access Control in Authentik

Step-by-step guide for controlling which users can access which applications using Authentik groups.

## Table of Contents

- [How Application Access Works](#how-application-access-works)
- [Single Application Access](#single-application-access)
- [Multiple Application Access](#multiple-application-access)
- [Setting Up Application Groups](#setting-up-application-groups)
- [Granting Application Access](#granting-application-access)
- [Revoking Application Access](#revoking-application-access)
- [Verifying Access](#verifying-access)
- [Multi-Organization Setup](#multi-organization-setup)

---

## How Application Access Works

Applications check if users are in specific groups to grant or deny access.

**Basic Flow**:
1. User logs in through Authentik
2. Authentik returns user information including groups
3. Application checks if user is in required group
4. If yes → Grant access
5. If no → Deny access

**Example**:
- Portfolio Manager requires users to be in `portfolio-users` group
- Analytics Dashboard requires users to be in `analytics-users` group
- User in both groups can access both applications
- User in neither group cannot access either application

---

## Single Application Access

### Portfolio Manager Only

If you only have Portfolio Manager and want all authenticated users to access it:

**Option 1: Create Single Group (Recommended)**

1. **Create group**:
   - Go to **Directory** → **Groups**
   - Click **Create**
   - Name: `portfolio-users`
   - Click **Create**

2. **Add users to group**:
   - See [Managing Groups](managing-groups.md#assigning-users-to-groups)
   - Add each user to `portfolio-users` group

**Option 2: Auto-Assign During Registration**

Set up enrollment to automatically add new users to the group:

1. Go to **Flows & Stages** → **Stages**
2. Find your **User Write** stage (in enrollment flow)
3. Edit the stage
4. Set **Create users group**: Select `portfolio-users`
5. Click **Update**

**Result**: All new registrations automatically get Portfolio Manager access.

---

## Multiple Application Access

When you have multiple applications in your ecosystem:

### Example Setup

**Applications**:
- Portfolio Manager (main application)
- Analytics Dashboard (optional module)
- Admin Panel (administration interface)

**Groups to Create**:
1. `portfolio-users` - Access to Portfolio Manager
2. `analytics-users` - Access to Analytics Dashboard
3. `admin-users` - Access to Admin Panel

### User Access Scenarios

**Scenario A: Basic User**
- Groups: `portfolio-users`
- Can access: Portfolio Manager only

**Scenario B: Power User**
- Groups: `portfolio-users`, `analytics-users`
- Can access: Portfolio Manager + Analytics Dashboard

**Scenario C: Administrator**
- Groups: `portfolio-users`, `analytics-users`, `admin-users`
- Can access: All three applications

---

## Setting Up Application Groups

### Step 1: Plan Your Groups

Decide which applications need access control:

**Example Plan**:
```
Application              Group Name           Purpose
--------------------------------------------------------------------------------
Portfolio Manager   →    portfolio-users      All Portfolio Manager users
Analytics Dashboard →    analytics-users      Users who can view analytics
Admin Panel         →    admin-users          System administrators
Custom Service A    →    servicea-users       Users of custom service
```

### Step 2: Create Groups in Authentik

For each application:

1. Go to **Directory** → **Groups**
2. Click **Create**
3. Fill in:
   - **Name**: Use format `appname-users` (e.g., `portfolio-users`)
   - **Parent**: (leave blank unless using hierarchies)
4. Click **Create**

Repeat for all applications.

### Step 3: Document Your Groups

Keep a document listing what each group does:

```
Group Name          Application          Description
--------------------------------------------------------------------------------
portfolio-users     Portfolio Manager    Basic access to Portfolio Manager
analytics-users     Analytics Dashboard  Read access to analytics
admin-users         Admin Panel          Full system administration
```

---

## Granting Application Access

### Add User to Application Group

**Method 1: From User Profile**

1. Go to **Directory** → **Users**
2. Click on the username
3. Click **Groups** tab
4. Click **Add to existing group**
5. Select the application group (e.g., `portfolio-users`)
6. Click **Add**

**Result**: User can now access that application.

**Method 2: From Group Profile**

1. Go to **Directory** → **Groups**
2. Click on the group name (e.g., `portfolio-users`)
3. Click **Users** tab
4. Click **Add existing user**
5. Search for and select the user
6. Click **Add**

### Grant Multiple Application Access

To give user access to multiple applications:

1. Go to **Directory** → **Users**
2. Click on the username
3. Click **Groups** tab
4. Add to first group (e.g., `portfolio-users`)
5. Click **Add to existing group** again
6. Add to second group (e.g., `analytics-users`)
7. Repeat for each application

**Example**: Add user to `portfolio-users` + `analytics-users` groups.

---

## Revoking Application Access

### Remove User from Application Group

1. Go to **Directory** → **Users**
2. Click on the username
3. Click **Groups** tab
4. Find the application group
5. Click the trash icon (🗑️) next to the group
6. Confirm removal

**Result**: User can no longer access that application.

**Important**: User may need to log out and log back in for change to take effect.

### Remove Access from All Applications

To completely revoke all access:

1. Remove user from all application groups
2. Or set user as **inactive**:
   - Go to user profile
   - Uncheck **Is active**
   - Click **Update**

**Result**: User cannot access any application.

---

## Verifying Access

### Check Which Applications User Can Access

1. Go to **Directory** → **Users**
2. Click on the username
3. Click **Groups** tab
4. Review list of groups

**Example**:
- User in `portfolio-users` only → Access to Portfolio Manager
- User in `portfolio-users` + `analytics-users` → Access to both

### Test Application Access

1. Log in as the user (or have user test)
2. Try to access each application
3. Verify correct access:
   - Should access: Applications where user is in required group
   - Should deny: Applications where user is NOT in required group

### Troubleshooting Access Issues

**User cannot access application they should have access to**:

1. **Check group membership**:
   - Verify user is in correct group
   - Check group name matches exactly (case-sensitive)

2. **Check user is active**:
   - User profile → **Is active** should be checked

3. **Try logging out and back in**:
   - Group changes may require new login session

4. **Verify application configuration**:
   - Application must be configured to check the correct group name

---

## Multi-Organization Setup

When managing multiple client organizations, use prefixed group names.

### Example: Two Organizations

**Organization 1: NextDoorMarket**

Groups:
- `nextdoor-admins` - NextDoorMarket administrators
- `nextdoor-users` - NextDoorMarket regular users
- `nextdoor-viewers` - NextDoorMarket read-only users

**Organization 2: CornerStore**

Groups:
- `cornerstore-admins` - CornerStore administrators
- `cornerstore-users` - CornerStore regular users
- `cornerstore-viewers` - CornerStore read-only users

### Creating Organization Groups

For NextDoorMarket:

1. Create parent group:
   - Name: `nextdoor-org`

2. Create child groups:
   - Name: `nextdoor-admins`, Parent: `nextdoor-org`
   - Name: `nextdoor-users`, Parent: `nextdoor-org`
   - Name: `nextdoor-viewers`, Parent: `nextdoor-org`

3. Repeat pattern for CornerStore with `cornerstore-*` prefix

### Assigning Users by Organization

1. Identify which organization user belongs to
2. Add user to appropriate org-prefixed group
3. User only accesses their organization's data

**Application-level filtering**:
- Applications check organization prefix
- Data is filtered by organization
- Users cannot see other organizations' data

---

## Common Scenarios

### Scenario 1: Simple Setup (Single Application)

**Goal**: All users access Portfolio Manager

**Steps**:
1. Create group `portfolio-users`
2. Add all users to this group
3. Portfolio Manager checks for `portfolio-users` group

**Result**: All authenticated users can access Portfolio Manager.

### Scenario 2: Role-Based Access (Single Application, Multiple Roles)

**Goal**: Different features based on role

**Groups**:
- `portfolio-admins` - Full access
- `portfolio-managers` - Edit access
- `portfolio-users` - Basic access
- `portfolio-viewers` - Read-only

**Steps**:
1. Create all four groups
2. Assign users based on their role
3. Application checks groups and grants permissions accordingly

### Scenario 3: Multi-Application Ecosystem

**Goal**: Users access different combinations of applications

**Setup**:
1. Create groups:
   - `portfolio-users`
   - `analytics-users`
   - `admin-users`

2. Assign users:
   - Basic user: `portfolio-users` only
   - Analyst: `portfolio-users` + `analytics-users`
   - Admin: All three groups

3. Each application checks its specific group

**Result**: Users see only applications they have access to.

### Scenario 4: Multi-Tenant SaaS

**Goal**: Multiple organizations, complete data isolation

**Setup**:
1. For each organization, create:
   - `orgname-admins`
   - `orgname-managers`
   - `orgname-users`

2. Assign users to their organization's groups

3. Application filters data by organization

**Result**: Complete isolation between organizations.

---

## Tips and Best Practices

### Group Naming

- **Be consistent**: Use same pattern for all app groups
- **Include app name**: `portfolio-users`, not just `users`
- **Use lowercase**: Easier to remember and type
- **Use hyphens**: Separate words with hyphens

### Access Management

- **Principle of least privilege**: Only grant access users need
- **Document access levels**: Write down what each group can do
- **Regular audits**: Review group membership quarterly
- **Remove promptly**: Revoke access when users leave

### Multi-Organization

- **Prefix with org name**: `nextdoor-admins`, `cornerstore-admins`
- **Consistent patterns**: All orgs follow same group structure
- **Document conventions**: Write down your naming rules
- **Plan for scale**: Design for dozens or hundreds of organizations

### Testing

- **Test with real users**: Have users verify they can/cannot access applications
- **Test edge cases**: What happens if user is in no groups? Multiple groups?
- **Document results**: Keep record of access control testing

---

## Troubleshooting

### User Has Access But Shouldn't

1. Check all groups user is in
2. Remove from incorrect groups
3. User may need to log out/in

### User Should Have Access But Doesn't

1. Verify user is in correct group
2. Check group name matches application configuration exactly
3. Verify user is active
4. Try logging out and back in
5. Check application logs for errors

### Groups Not Working

1. Verify application is configured to check groups
2. Check group names match exactly (case-sensitive)
3. Test with different user
4. Check Authentik logs for authentication issues

### Cannot Find Group

1. Go to Directory → Groups
2. Use search box
3. Check for typos in group name
4. Verify group was created

---

## Related Documentation

- [Creating Users](creating-users.md) - Create user accounts
- [Managing Groups](managing-groups.md) - Detailed group management
- [User Approval Setup](user-approval-setup.md) - Require approval for new users
- [Authentik API Integration](authentik-api-integration.md) - Automate access control

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues).
