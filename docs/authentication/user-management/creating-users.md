# Creating Users in Authentik

Step-by-step guide for creating and managing users through the Authentik web interface.

## Table of Contents

- [Accessing Authentik Admin Panel](#accessing-authentik-admin-panel)
- [Creating a Regular User](#creating-a-regular-user)
- [Creating an Admin User](#creating-an-admin-user)
- [Setting User Passwords](#setting-user-passwords)
- [Activating and Deactivating Users](#activating-and-deactivating-users)
- [Editing User Information](#editing-user-information)
- [Deleting Users](#deleting-users)

---

## Accessing Authentik Admin Panel

1. Open your web browser
2. Navigate to: `http://localhost:9000` (or your Authentik URL)
3. Click **Login** or go to: `http://localhost:9000/if/flow/initial-setup/`
4. Enter your admin credentials
5. You'll be redirected to the Authentik admin dashboard

---

## Creating a Regular User

### Step 1: Navigate to Users Section

1. In the Authentik admin panel, click **Directory** in the left sidebar
2. Click **Users** from the submenu
3. Click the **Create** button (top right)

### Step 2: Fill in User Information

1. **Username**: Enter the user's username (e.g., `john.doe`)
   - Must be unique
   - Cannot be changed later
   - Use lowercase, no spaces

2. **Name**: Enter the user's full name (e.g., `John Doe`)
   - This is the display name
   - Can be changed later

3. **Email**: Enter the user's email address (e.g., `john.doe@example.com`)
   - Must be valid email format
   - Used for password resets and notifications

4. **Is active**: Check this box
   - Checked = User can log in
   - Unchecked = User account is disabled

5. **Path** (optional): Leave blank or set organizational path (e.g., `users/portfolio`)
   - Used for organizing users in large deployments
   - Not required for most setups

### Step 3: Set Initial Password (Optional)

1. Scroll down to **Set password** section
2. Enter a temporary password in both fields
3. Or leave blank - user will set password on first login

### Step 4: Create the User

1. Click **Create** button at the bottom
2. User is now created and will appear in the users list

---

## Creating an Admin User

Follow the same steps as creating a regular user, then:

### Step 1: Make User a Superuser

1. After creating the user, find them in the users list
2. Click on the username to open their profile
3. Scroll down to **Properties** section
4. Check the box for **Is superuser**
5. Click **Update** at the bottom

### Step 2: Assign to Admin Group

1. While still on the user's profile page
2. Click the **Groups** tab at the top
3. Click **Add to existing group**
4. Select `admins` or `authentik Admins` from the dropdown
5. Click **Add**

**Note**: Superuser status gives full Authentik admin access. Assign carefully.

---

## Setting User Passwords

### Option 1: Set Password During User Creation

1. When creating a new user (see above)
2. Fill in the **Set password** fields
3. User can log in with this password immediately

### Option 2: Set Password for Existing User

1. Go to **Directory** → **Users**
2. Click on the username
3. Scroll to **Actions** section
4. Click **Set password**
5. Enter new password twice
6. Click **Update**

### Option 3: Send Password Reset Email

1. Go to **Directory** → **Users**
2. Click on the username
3. Click **Send recovery link** button
4. User receives email with password reset link
5. User clicks link and sets their own password

**Note**: Email must be configured in Authentik for option 3 to work.

---

## Activating and Deactivating Users

### Deactivate a User (Disable Login)

1. Go to **Directory** → **Users**
2. Click on the username
3. Uncheck **Is active** checkbox
4. Click **Update**

**Result**: User cannot log in, but account data is preserved.

### Reactivate a User (Enable Login)

1. Go to **Directory** → **Users**
2. Filter for inactive users if needed
3. Click on the username
4. Check **Is active** checkbox
5. Click **Update**

**Use Case**: Temporarily disable access without deleting the account.

---

## Editing User Information

### Step 1: Find the User

1. Go to **Directory** → **Users**
2. Use the search box to find the user (search by username, name, or email)
3. Click on the username to open their profile

### Step 2: Edit Information

1. You can edit:
   - **Name**: Change display name
   - **Email**: Update email address
   - **Is active**: Enable/disable account
   - **Path**: Change organizational path

2. Make your changes
3. Click **Update** at the bottom

### Editing Groups

1. On the user's profile page
2. Click the **Groups** tab
3. To add to group: Click **Add to existing group**, select group, click **Add**
4. To remove from group: Click the trash icon next to the group name

### Viewing User Activity

1. On the user's profile page
2. Click the **User events** tab
3. See login history, actions, and authentication events

---

## Deleting Users

### Permanently Delete a User

1. Go to **Directory** → **Users**
2. Click on the username
3. Scroll to the bottom
4. Click **Delete** button
5. Confirm deletion in the popup

**Warning**: This action cannot be undone. All user data and history will be permanently deleted.

### Alternative: Deactivate Instead

If you might need the user account later:
1. Deactivate the user instead of deleting (see above)
2. User cannot log in, but data is preserved
3. Can be reactivated later if needed

---

## Common Scenarios

### Scenario 1: Create User for Portfolio Manager Access

1. Create user (see [Creating a Regular User](#creating-a-regular-user))
2. Add user to `portfolio-users` group (see [Managing Groups](managing-groups.md))
3. Set initial password or send recovery link
4. User can now log in to Portfolio Manager

### Scenario 2: Create Admin for Client Organization

1. Create user with username like `nextdoor_admin`
2. Set email to client's admin email
3. Add to organization-specific group (e.g., `nextdoor-admins`)
4. Send password reset link to client
5. Client sets their own password

### Scenario 3: Onboard Multiple Users

1. Create first user manually to test
2. For bulk users, consider:
   - Creating them through Authentik API (see [Authentik API Integration](authentik-api-integration.md))
   - Enabling self-registration (see [Enrollment Setup](../enrollment-setup.md))
   - Importing from CSV (Authentik feature)

---

## Tips and Best Practices

### Username Conventions

- Use consistent format: `firstname.lastname` or `first.last`
- Keep lowercase
- No spaces or special characters except `.`, `_`, `-`
- Cannot be changed later - choose carefully

### Email Requirements

- Must be valid and deliverable for password resets
- Should be unique per user
- Consider using work emails for accountability

### Account Security

- Require strong passwords (configure in password policies)
- Enable email verification for new accounts
- Regularly review and deactivate unused accounts
- Use groups to manage permissions, not individual user settings

### Organizing Users

- Use **Path** field for large deployments (e.g., `users/nextdoor/staff`)
- Create naming conventions for admin users (e.g., `orgname_admin`)
- Document your user management procedures

---

## Troubleshooting

### User Cannot Log In

1. **Check if account is active**:
   - Go to user profile
   - Verify **Is active** is checked

2. **Verify password is set**:
   - Send password reset link
   - Ask user to set new password

3. **Check group membership**:
   - User must be in `portfolio-users` group for Portfolio Manager access
   - See [Managing Groups](managing-groups.md)

### Cannot Create User - Username Already Exists

- Usernames must be unique
- Search existing users to find conflict
- Choose a different username

### User Not Receiving Emails

- Verify email address is correct
- Check email configuration in Authentik (see [Email Configuration](../email-configuration.md))
- Check spam/junk folders

---

## Related Documentation

- [Managing Groups](managing-groups.md) - Assign users to groups
- [User Approval Setup](user-approval-setup.md) - Require admin approval for new users
- [Application Access Control](application-access-control.md) - Control which apps users can access
- [Authentik API Integration](authentik-api-integration.md) - Automate user creation via code

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues).
