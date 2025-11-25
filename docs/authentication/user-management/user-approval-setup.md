# User Approval Setup in Authentik

Step-by-step guide for configuring Authentik to require administrator approval before users can access Portfolio Manager.

## Table of Contents

- [What is User Approval?](#what-is-user-approval)
- [When to Use User Approval](#when-to-use-user-approval)
- [Setup Overview](#setup-overview)
- [Step 1: Create Pending Users Group](#step-1-create-pending-users-group)
- [Step 2: Modify Enrollment Flow](#step-2-modify-enrollment-flow)
- [Step 3: Configure Email Notifications](#step-3-configure-email-notifications)
- [Step 4: Test the Approval Workflow](#step-4-test-the-approval-workflow)
- [Approving Users](#approving-users)
- [Rejecting Users](#rejecting-users)

---

## What is User Approval?

User approval requires an administrator to manually approve new user registrations before they can access Portfolio Manager.

**Normal Registration** (without approval):
1. User registers → Account created → User can log in immediately

**With Approval** (this guide):
1. User registers → Account created as **inactive** → Admin approves → User can log in

---

## When to Use User Approval

**Use approval when**:
- Running B2B application (business clients only)
- Need to verify user identity before granting access
- Want to control who can access your application
- Compliance requires manual verification
- Preventing spam or unwanted registrations

**Don't use approval when**:
- Public application open to anyone
- Want frictionless user experience
- Have other verification methods (email verification)
- Self-service registration is desired

---

## Setup Overview

**What we'll configure**:

1. **Pending users group** - Holds users awaiting approval
2. **Modified enrollment flow** - Creates users as inactive
3. **Email notifications** - Notifies admins of new registrations
4. **Approval process** - How admins activate users

**Time required**: 15-20 minutes

---

## Configuration Examples

### Example 1: User Write Stage Configuration for Approval

**Before (immediate access):**
```
Name: enrollment-user-write
Create users as inactive: ❌ Unchecked
User path template: users
Groups: [users]
```

**After (requires approval):**
```
Name: enrollment-user-write
Create users as inactive: ✅ Checked  ← This is the key change!
User path template: users/pending
Groups: [pending-users]  ← Assign to pending group instead
```

### Example 2: Complete Approval Workflow

**Step 1: User Registers**
```
User visits: http://localhost:3000
Clicks: "Register"
Fills form:
  Username: sarah_johnson
  Email: sarah@example.com
  Name: Sarah Johnson
  Password: SecurePass123!
Submits registration
```

**Step 2: System Response**
```
✅ Account created as INACTIVE
✅ Added to "pending-users" group
✅ User sees message: "Registration submitted! Awaiting approval..."
✅ Admin receives email notification
❌ User CANNOT log in yet
```

**Step 3: Admin Approval**
```
Admin clicks link in email → Goes to Authentik
Navigates to: Directory → Users
Finds: sarah_johnson (Is active: ❌)
Reviews: Email, name, registration date
Decision: APPROVE

Actions:
1. Checks "Is active" checkbox
2. Adds to "portfolio-users" group
3. Removes from "pending-users" group (optional)
4. Clicks "Update"

Result: ✅ User can now log in
```

**Step 4: User Logs In**
```
Sarah receives approval email (if configured)
Goes to: http://localhost:3000
Clicks: "Login"
Enters credentials
✅ Successfully logs in
✅ Can access Portfolio Manager
```

### Example 3: Email Notification Template

**Subject:** `New User Registration - Approval Required`

**Body:**
```
New user registration requires your approval:

Name: Sarah Johnson
Email: sarah@example.com
Username: sarah_johnson
Registration Date: 2024-01-15 14:30:22

Please review and approve this registration:
http://localhost:9000/if/admin/#/directory/users

Approval Steps:
1. Click the link above
2. Find user: sarah_johnson
3. Click on the username
4. Check "Is active" checkbox
5. Go to Groups tab
6. Add to "portfolio-users" group
7. Click "Update"

User will be able to log in immediately after approval.

---
Automated message from Portfolio Manager
Do not reply to this email
```

### Example 4: Pending Approval Message Stage

**Stage Configuration:**
```
Name: pending-approval-message
Stage Type: Message Stage

Title: Registration Submitted Successfully

Message:
╔════════════════════════════════════════════╗
║   Your registration has been submitted!    ║
╚════════════════════════════════════════════╝

✅ Your account has been created
⏳ Awaiting administrator approval

What happens next?
1. Our team will review your registration
2. You'll receive an email once approved
3. Then you can log in and start using Portfolio Manager

⏱️  This typically takes 1-2 business days

Questions? Contact: admin@portfolio-manager.com
```

### Example 5: Enrollment Flow with Approval

**Flow: portfolio-enrollment**
```
Stage Bindings (in order):

Order 10: enrollment-prompt
  ├─ Collects: username, email, name, password
  └─ Purpose: User fills registration form

Order 20: enrollment-user-write
  ├─ Create users as inactive: ✅ Checked
  ├─ Groups: [pending-users]
  └─ Purpose: Creates INACTIVE user

Order 25: notify-admin-new-user
  ├─ Type: Email Stage
  ├─ To: admin@example.com
  └─ Purpose: Notifies admin of new registration

Order 30: pending-approval-message
  ├─ Type: Message Stage
  └─ Purpose: Tells user they need approval

Order 40: enrollment-user-login (DISABLED for approval flow)
  └─ Remove this stage - users can't login until approved
```

### Example 6: Admin Dashboard Filter for Pending Users

**Finding Pending Users:**
```
Navigate to: Directory → Users

Apply filters:
┌─────────────────────────────┐
│ Filters                     │
├─────────────────────────────┤
│ Is active: ❌ No            │
│ Groups: pending-users       │
│ Is superuser: ❌ No         │
└─────────────────────────────┘

Results show only users awaiting approval:
┌──────────────────┬─────────────────────┬────────────┐
│ Username         │ Email               │ Joined     │
├──────────────────┼─────────────────────┼────────────┤
│ sarah_johnson    │ sarah@example.com   │ 2 days ago │
│ mike_chen        │ mike@company.com    │ 1 day ago  │
│ alice_wong       │ alice@startup.io    │ 3 hours ago│
└──────────────────┴─────────────────────┴────────────┘
```

### Example 7: Approval Decision Matrix

**When to Approve:**
```
✅ Email from company domain (@company.com)
✅ Name looks legitimate (not "Test User" or "asdf")
✅ No existing user with same email
✅ Registration form filled completely
✅ No suspicious patterns (multiple registrations)
```

**When to Deny:**
```
❌ Email from disposable email service
❌ Fake name or invalid information
❌ Duplicate email address
❌ Registration violates terms of service
❌ Suspicious activity pattern
```

**When to Investigate:**
```
⚠️ Personal email (gmail, yahoo) for B2B app
⚠️ International email domain (requires verification)
⚠️ Unusual registration time (3 AM on weekend)
⚠️ Multiple registrations from same IP
⚠️ Name/email mismatch
```

---

## Step 1: Create Pending Users Group

### Create the Group

1. Go to **Directory** → **Groups**
2. Click **Create**
3. Fill in:
   - **Name**: `pending-users`
   - **Parent**: (leave blank)
4. Click **Create**

**Purpose**: This group will contain all users awaiting approval.

---

## Step 2: Modify Enrollment Flow

### Find the Enrollment Flow

1. Go to **Flows & Stages** → **Flows**
2. Find your enrollment flow (named `portfolio-enrollment`)
3. Click on the flow name

### Modify User Write Stage

1. In the flow, find the **User Write** stage
2. Click on the stage name to edit it
3. Configure these settings:

**Critical Settings**:
- **Create users as inactive**: ✓ **Check this box**
  - This prevents users from logging in until approved
- **Create users group**: Select `pending-users`
  - Adds new users to pending group automatically
- **User path template**: `users/pending` (optional - helps organize)

4. Click **Update** to save

### Add Denial Stage (Optional but Recommended)

Create a stage to inform users they're pending approval:

1. Go to **Flows & Stages** → **Stages**
2. Click **Create**
3. Select **Prompt Stage**
4. Configure:
   - **Name**: `pending-approval-message`
   - **Message**:
     ```
     Your registration has been submitted!

     Your account is pending administrator approval.
     You will receive an email once your account is activated.

     This typically takes 1-2 business days.
     ```
5. Click **Create**

### Add Stage to Enrollment Flow

1. Go back to **Flows & Stages** → **Flows**
2. Click on your enrollment flow
3. Click **Bind Stage** (or **Stage Bindings** tab)
4. Add the `pending-approval-message` stage
5. Set **Order**: Place it after the User Write stage
6. Click **Create**

**Result**: Users see this message after registering, explaining they need approval.

---

## Step 3: Configure Email Notifications

### Create Email Stage for Admin Notification

1. Go to **Flows & Stages** → **Stages**
2. Click **Create**
3. Select **Email Stage**
4. Configure:
   - **Name**: `notify-admin-new-user`
   - **Subject**: `New User Registration - Approval Required`
   - **Template**: `Custom` (select from dropdown)

### Email Template

Use this template:

```
New user registration requires your approval:

Name: {{ user.name }}
Email: {{ user.email }}
Username: {{ user.username }}
Registration Date: {{ user.date_joined }}

Please approve or deny this registration in the Authentik admin panel:
http://localhost:9000/if/admin/#/directory/users

Instructions:
1. Find the user in Directory → Users
2. Check "Is active" to approve
3. Add to "portfolio-users" group
4. User will be able to log in

---
Automated message from Portfolio Manager
```

5. **To**: Enter admin email address (e.g., `admin@example.com`)
   - Or select an admin group if configured

6. Click **Create**

### Add Email Stage to Enrollment Flow

1. Go to **Flows & Stages** → **Flows**
2. Click on your enrollment flow
3. Click **Bind Stage**
4. Select `notify-admin-new-user` stage
5. Set **Order**: Place it after User Write stage, before or after the message stage
6. Click **Create**

**Result**: Admins receive email when someone registers.

---

## Step 4: Test the Approval Workflow

### Test Registration

1. Open an incognito/private browser window
2. Navigate to Portfolio Manager: `http://localhost:3000`
3. Click **Register** or **Sign Up**
4. Fill in registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Name: `Test User`
   - Password: (create password)
5. Submit registration

### Expected Results

1. **User sees**: "Your registration has been submitted! Awaiting approval..." message
2. **Admin receives**: Email notification about new registration
3. **In Authentik**:
   - New user exists in Directory → Users
   - User **Is active** is **unchecked** (inactive)
   - User is in `pending-users` group

### Test Login Before Approval

1. Try to log in with the test account
2. **Expected**: Login should fail or show "Account inactive" message

**This confirms approval is working correctly.**

---

## Approving Users

### Step-by-Step Approval Process

1. **Receive notification**:
   - Admin gets email about new registration

2. **Review user in Authentik**:
   - Go to **Directory** → **Users**
   - Filter by **Is active = No** to see pending users
   - Click on the username

3. **Verify user information**:
   - Check email address is legitimate
   - Verify name matches expected format
   - Review any custom fields collected

4. **Activate the account**:
   - Check the **Is active** checkbox
   - Click **Update**

5. **Add to required group**:
   - Click the **Groups** tab
   - Click **Add to existing group**
   - Select `portfolio-users` (or appropriate group)
   - Click **Add**

6. **Remove from pending group** (optional):
   - On Groups tab, find `pending-users`
   - Click trash icon to remove
   - Or leave them in both groups

7. **Notify user** (optional):
   - Send email to user informing them they're approved
   - User can now log in to Portfolio Manager

### Bulk Approval

To approve multiple users at once:

1. Go to **Directory** → **Users**
2. Filter for inactive users
3. For each user:
   - Open profile
   - Check **Is active**
   - Add to `portfolio-users` group
   - Click **Update**

**Note**: Authentik doesn't have bulk actions in UI. For many users, consider using Authentik API (see [Authentik API Integration](authentik-api-integration.md)).

---

## Rejecting Users

If you need to deny a registration:

### Option 1: Delete the User

1. Go to **Directory** → **Users**
2. Click on the username
3. Scroll to bottom
4. Click **Delete**
5. Confirm deletion

**Result**: User account is permanently deleted.

### Option 2: Keep Inactive

1. Leave user inactive (don't check **Is active**)
2. Add note in user's **Attributes** field (optional):
   - Key: `rejection_reason`
   - Value: `Reason for denial`
3. User remains in system but cannot log in

**Use when**: You might reconsider later or need to keep records.

### Optional: Notify User of Rejection

If you want to inform user:

1. Note their email address
2. Send manual email explaining the rejection
3. Authentik doesn't have automatic rejection emails

---

## Common Scenarios

### Scenario 1: Approve User for Portfolio Manager

1. User registers
2. Admin receives email
3. Admin goes to Authentik
4. Finds user in pending list
5. Activates account
6. Adds to `portfolio-users` group
7. User can now log in

### Scenario 2: Conditional Approval Based on Email Domain

**Manual process**:
1. Check user's email domain
2. If domain is on approved list (e.g., `@company.com`):
   - Approve immediately
3. If domain is public (e.g., `@gmail.com`):
   - Deny or require additional verification

**Note**: Domain filtering can be automated with Authentik policies (advanced topic).

### Scenario 3: Multi-Step Approval

For high-security environments:

1. **First approval** - Verify identity:
   - Check email is valid
   - Activate account
   - Add to `verified-users` group (not `portfolio-users` yet)

2. **Second approval** - Grant access:
   - After additional verification (phone call, ID check, etc.)
   - Add to `portfolio-users` group
   - User can now access application

---

## Tips and Best Practices

### Admin Workflow

- **Check emails regularly**: Don't leave users waiting days
- **Document approval criteria**: Write down what you check before approving
- **Respond promptly**: Aim for same-day approval during business hours
- **Keep records**: Note why users were approved or rejected

### User Communication

- **Set expectations**: Tell users approval takes 1-2 business days
- **Provide contact**: Give email/phone if users have questions
- **Send confirmation**: Email users when approved
- **Explain rejection**: If denying, briefly explain why (if appropriate)

### Security Considerations

- **Verify email domains**: Be suspicious of free email providers for B2B apps
- **Check for duplicates**: Search for existing users with same email
- **Review registration patterns**: Watch for suspicious bulk registrations
- **Limit admin access**: Only trusted admins should approve users

### Monitoring

- **Track pending users**: Check pending list daily
- **Set up reminders**: Use calendar to review pending users weekly
- **Audit approvals**: Periodically review who was approved and why
- **Monitor bounce rate**: If many users are denied, review your signup process

---

## Troubleshooting

### Users Not Appearing as Inactive

**Check**:
1. Go to enrollment flow → User Write stage
2. Verify **Create users as inactive** is checked
3. Save and test again

### Admin Not Receiving Emails

**Check**:
1. Email stage is added to enrollment flow
2. Email configuration is working (see [Email Configuration](../email-configuration.md))
3. Admin email address is correct in stage settings
4. Check spam/junk folder

### Users Can Log In Before Approval

**Check**:
1. User Write stage has **Create users as inactive** checked
2. User's **Is active** field is unchecked in their profile
3. Application is checking user active status

### Can't Find Pending Users

**Filter users**:
1. Go to **Directory** → **Users**
2. Click filter icon
3. Set **Is active** to **No**
4. Click **Apply**

---

## Related Documentation

- [Creating Users](creating-users.md) - Manual user creation
- [Managing Groups](managing-groups.md) - Group management
- [Application Access Control](application-access-control.md) - Control app access
- [Email Configuration](../email-configuration.md) - Set up email for notifications

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues).
