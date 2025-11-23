# Managing Groups in Authentik

Step-by-step guide for creating and managing user groups through the Authentik web interface.

## Table of Contents

- [What Are Groups?](#what-are-groups)
- [Creating Groups](#creating-groups)
- [Assigning Users to Groups](#assigning-users-to-groups)
- [Removing Users from Groups](#removing-users-from-groups)
- [Editing Groups](#editing-groups)
- [Deleting Groups](#deleting-groups)
- [Group Hierarchies](#group-hierarchies)
- [Application-Specific Groups](#application-specific-groups)

---

## What Are Groups?

Groups in Authentik organize users and control access to applications.

**Key Concepts:**

- **Groups control permissions**: Users inherit permissions from their groups
- **One user, multiple groups**: Users can be in many groups simultaneously
- **Application access**: Groups determine which applications users can access
- **Naming convention**: Use descriptive names like `portfolio-users`, `nextdoor-admins`

**Example Group Structure:**

```
portfolio-users          → Can access Portfolio Manager
analytics-users          → Can access Analytics Dashboard
nextdoor-admins          → Admins for NextDoorMarket organization
nextdoor-cashiers        → Cashiers for NextDoorMarket organization
nextdoor-customers       → Customers for NextDoorMarket organization
```

---

## Creating Groups

### Step 1: Navigate to Groups Section

1. In Authentik admin panel, click **Directory** in the left sidebar
2. Click **Groups** from the submenu
3. Click the **Create** button (top right)

### Step 2: Fill in Group Information

1. **Name**: Enter the group name (e.g., `portfolio-users`)
   - Use lowercase
   - Use hyphens for spaces
   - Must be unique
   - Cannot be changed easily later

2. **Parent** (optional): Select a parent group if creating hierarchy
   - Leave blank for top-level group
   - See [Group Hierarchies](#group-hierarchies) below

3. **Attributes** (optional): Add custom key-value attributes
   - Usually not needed
   - For advanced configurations only

### Step 3: Create the Group

1. Click **Create** button at the bottom
2. Group is now created and appears in the groups list

---

## Assigning Users to Groups

### Method 1: From User Profile

1. Go to **Directory** → **Users**
2. Click on the username
3. Click the **Groups** tab at the top
4. Click **Add to existing group** button
5. Select the group from the dropdown
6. Click **Add**

**Result**: User is now a member of that group.

### Method 2: From Group Profile

1. Go to **Directory** → **Groups**
2. Click on the group name
3. Click the **Users** tab at the top
4. Click **Add existing user** button
5. Search for and select the user
6. Click **Add**

**Result**: User is now a member of that group.

### Bulk Assignment

To add multiple users to one group:

1. Go to **Directory** → **Groups**
2. Click on the group name
3. Click the **Users** tab
4. Click **Add existing user** repeatedly for each user
5. Or use Authentik API for bulk operations (see [Authentik API Integration](authentik-api-integration.md))

---

## Removing Users from Groups

### From User Profile

1. Go to **Directory** → **Users**
2. Click on the username
3. Click the **Groups** tab
4. Find the group you want to remove
5. Click the trash icon (🗑️) next to the group name
6. Confirm removal

### From Group Profile

1. Go to **Directory** → **Groups**
2. Click on the group name
3. Click the **Users** tab
4. Find the user you want to remove
5. Click the trash icon (🗑️) next to the username
6. Confirm removal

**Result**: User is removed from the group but account remains active.

---

## Editing Groups

### Step 1: Find the Group

1. Go to **Directory** → **Groups**
2. Use the search box to find the group
3. Click on the group name

### Step 2: Edit Information

1. You can edit:
   - **Name**: Change group name (be careful - may break configurations)
   - **Parent**: Change parent group
   - **Attributes**: Add/edit custom attributes

2. Make your changes
3. Click **Update** at the bottom

### Viewing Group Members

1. On the group's profile page
2. Click the **Users** tab
3. See all users in this group
4. Add or remove users as needed

---

## Deleting Groups

### Step 1: Remove Group

1. Go to **Directory** → **Groups**
2. Click on the group name
3. Scroll to the bottom
4. Click **Delete** button
5. Confirm deletion

**Warning**:
- Users in the group will lose associated permissions
- Application access controlled by this group will be revoked
- Cannot be undone

### Before Deleting

1. Check how many users are in the group (Users tab)
2. Verify no applications require this group for access
3. Consider if you might need it later

---

## Group Hierarchies

Groups can be organized in parent-child relationships.

### Why Use Hierarchies?

- **Inheritance**: Child groups can inherit permissions from parent
- **Organization**: Logical grouping (e.g., all `nextdoor-*` groups under `nextdoor-org`)
- **Easier management**: Apply settings to parent, affects all children

### Creating a Group Hierarchy

**Example: Organization with Multiple Roles**

1. **Create parent group**:
   - Name: `nextdoor-org`
   - Parent: (leave blank)

2. **Create child groups**:
   - Name: `nextdoor-admins`
   - Parent: Select `nextdoor-org`

3. **Create more children**:
   - Name: `nextdoor-users`
   - Parent: Select `nextdoor-org`

**Result**:
```
nextdoor-org (parent)
├── nextdoor-admins (child)
├── nextdoor-users (child)
└── nextdoor-viewers (child)
```

### When to Use Hierarchies

- **Multi-tenant setups**: Each organization is a parent group
- **Role-based access**: Parent = department, children = specific roles
- **Complex permissions**: Inherit base permissions, add specific ones

### When NOT to Use Hierarchies

- **Simple setups**: Just need `portfolio-users` and `admins`
- **Flat structure**: All groups are equal importance
- **Starting out**: Can always add hierarchy later

---

## Application-Specific Groups

Control which applications users can access using groups.

### Portfolio Manager Access

**Group name**: `portfolio-users`

**Steps to set up**:

1. Create group named `portfolio-users` (see [Creating Groups](#creating-groups))
2. Add users who should access Portfolio Manager
3. Portfolio Manager checks for this group during authentication

**To grant access**:
- Add user to `portfolio-users` group
- User can now log in to Portfolio Manager

**To revoke access**:
- Remove user from `portfolio-users` group
- User can no longer access Portfolio Manager

### Multiple Application Access

If you have Portfolio Manager + other services:

1. **Create application-specific groups**:
   - `portfolio-users` → Access to Portfolio Manager
   - `analytics-users` → Access to Analytics Dashboard
   - `admin-users` → Access to Admin Panel

2. **Assign users to relevant groups**:
   - Regular user: Add to `portfolio-users` only
   - Power user: Add to `portfolio-users` + `analytics-users`
   - Administrator: Add to all three groups

3. **Each application checks its group**:
   - Applications verify user is in required group
   - Users only see applications they have access to

### Naming Convention

Use clear, consistent group names:

**Good Examples**:
- `portfolio-users`
- `analytics-readers`
- `nextdoor-admins`
- `app-name-role`

**Bad Examples**:
- `users` (too generic)
- `group1` (meaningless)
- `PortfolioUsers` (mixed case - harder to type)

---

## Common Scenarios

### Scenario 1: Set Up Groups for Portfolio Manager

1. Create group `portfolio-users`
2. Create group `portfolio-admins` (optional, for admin features)
3. Add all Portfolio Manager users to `portfolio-users`
4. Add administrators to both groups

### Scenario 2: Multi-Organization Setup

For organization "NextDoorMarket":

1. Create parent group: `nextdoor-org`
2. Create child groups:
   - `nextdoor-admins` (parent: `nextdoor-org`)
   - `nextdoor-managers` (parent: `nextdoor-org`)
   - `nextdoor-users` (parent: `nextdoor-org`)
3. Add users to appropriate child groups
4. Configure applications to check these groups

For second organization "CornerStore":

1. Create parent group: `cornerstore-org`
2. Create child groups:
   - `cornerstore-admins`
   - `cornerstore-managers`
   - `cornerstore-users`
3. Assign users similarly

**Result**: Two isolated organizations, each with their own admin and user groups.

### Scenario 3: Role-Based Access Control

Create groups for different roles:

1. **Administrators**: `portfolio-admins`
   - Full access to all features
   - Can manage other users

2. **Managers**: `portfolio-managers`
   - Read and write access
   - Cannot manage users

3. **Users**: `portfolio-users`
   - Basic read and write access
   - Limited features

4. **Viewers**: `portfolio-viewers`
   - Read-only access
   - Cannot modify data

Assign users to the group matching their role.

---

## Tips and Best Practices

### Group Naming

- **Use lowercase**: Easier to type and remember
- **Use hyphens**: Separate words with hyphens (e.g., `portfolio-users`)
- **Be descriptive**: `analytics-readers` is better than `group2`
- **Include app name**: `portfolio-admins` clearly identifies the application

### Group Organization

- **Start simple**: Create only the groups you need now
- **Document your groups**: Keep a list of what each group does
- **Regular audits**: Review group membership quarterly
- **Consistent structure**: Use same patterns across all groups

### Access Control

- **Principle of least privilege**: Only give access needed for the job
- **Default to no access**: Users must be explicitly added to groups
- **Review regularly**: Remove users who no longer need access
- **Avoid individual permissions**: Use groups, not per-user settings

### Multi-Tenant Considerations

- **Prefix with organization**: `nextdoor-admins`, `cornerstore-admins`
- **Use consistent patterns**: All organizations follow same structure
- **Document conventions**: Write down your naming and structure rules
- **Plan for growth**: Design structure that scales to many organizations

---

## Troubleshooting

### User Cannot Access Application

1. **Verify group membership**:
   - Go to user profile → Groups tab
   - Check if user is in required group (e.g., `portfolio-users`)

2. **Check group name**:
   - Application looks for exact group name
   - Verify spelling and capitalization

3. **Add to correct group**:
   - Add user to required group
   - User may need to log out and log back in

### Group Not Appearing in Dropdown

- Refresh the page
- Check that group was created successfully
- Search for group in Directory → Groups

### Changes Not Taking Effect

- User may need to log out and log in again
- Clear browser cache
- Check application configuration

---

## Related Documentation

- [Creating Users](creating-users.md) - Create user accounts
- [User Approval Setup](user-approval-setup.md) - Require approval for new users
- [Application Access Control](application-access-control.md) - Control app access with groups
- [Authentik API Integration](authentik-api-integration.md) - Automate group management

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues).
