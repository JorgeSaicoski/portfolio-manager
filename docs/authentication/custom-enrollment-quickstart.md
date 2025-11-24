# Custom Enrollment with Admin Approval - Quick Start Guide

Get your Portfolio Manager self-registration up and running with admin approval in 20 minutes!

## Table of Contents

- [What You'll Build](#what-youll-build)
- [Prerequisites](#prerequisites)
- [Step 1: Create the Enrollment Flow (5 min)](#step-1-create-the-enrollment-flow-5-min)
- [Step 2: Enable Admin Approval (3 min)](#step-2-enable-admin-approval-3-min)
- [Step 3: Set Up Email Notifications (5 min)](#step-3-set-up-email-notifications-5-min)
- [Step 4: Enable on Brand (2 min)](#step-4-enable-on-brand-2-min)
- [Step 5: Test the Flow (5 min)](#step-5-test-the-flow-5-min)
- [What Users Will Experience](#what-users-will-experience)
- [What Admins Will Do](#what-admins-will-do)
- [Next Steps](#next-steps)

---

## What You'll Build

**User-Friendly Self-Registration with Admin Approval**

```
┌─────────────────┐
│   User visits   │
│  localhost:3000 │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Clicks "Sign Up"    │
│ Fills registration  │
│ form (username,     │
│ email, password)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ ✅ Account created  │
│ ⏳ Status: INACTIVE │
│ 📧 Admin notified   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Admin reviews       │
│ Approves user       │
│ Adds to group       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ ✅ User can login   │
│ ✅ Access granted   │
└─────────────────────┘
```

**Key Features:**
- ✅ Users create their own accounts (no admin manual work)
- ✅ Accounts start INACTIVE (users can't login yet)
- ✅ Admin receives email notification
- ✅ Admin reviews and approves (1-click process)
- ✅ User gains access immediately after approval

---

## Prerequisites

Before starting, ensure:
- [ ] Authentik is running at `http://localhost:9000`
- [ ] You have admin access to Authentik
- [ ] OAuth2 provider is configured (Client ID: `portfolio-manager`)
- [ ] You have an admin email address for notifications

**⏱️ Time Required:** 20 minutes

---

## Step 1: Create the Enrollment Flow (5 min)

### 1.1 Navigate to Flows

1. Login to Authentik admin: `http://localhost:9000/`
2. Go to **Flows & Stages** → **Flows**
3. Click **Create** button

### 1.2 Configure the Flow

Fill in these exact values:

```yaml
Name: portfolio-enrollment
Title: Create your Portfolio Manager account
Slug: portfolio-enrollment
Designation: Enrollment
Compatibility mode: ❌ Unchecked
Layout: stacked
```

4. Click **Create**

### 1.3 Create Required Stages

We need 3 stages: Prompt, User Write, and Message

#### Stage 1: Prompt Stage (Collect User Info)

1. Go to **Flows & Stages** → **Stages**
2. Click **Create** → **Prompt Stage**
3. Configure:
   ```yaml
   Name: enrollment-prompt
   ```
4. Click **Create**

**Add Fields to Prompt:**

Now add these fields to the prompt stage (click "Add field" for each):

| Field Key | Label | Type | Required | Order | Placeholder |
|-----------|-------|------|----------|-------|-------------|
| `username` | Username | Text | ✅ Yes | 0 | Choose a username |
| `email` | Email | Email | ✅ Yes | 10 | your@email.com |
| `name` | Full Name | Text | ✅ Yes | 20 | John Doe |
| `password` | Password | Password | ✅ Yes | 30 | Create a password |
| `password_repeat` | Confirm Password | Password | ✅ Yes | 40 | Confirm your password |

**⚠️ CRITICAL:** The `username` field key MUST be exactly `username` (lowercase, no spaces). Otherwise registration will fail!

5. Click **Update** to save

#### Stage 2: User Write Stage (Create Inactive User)

1. Still in **Stages**, click **Create** → **User Write Stage**
2. Configure:
   ```yaml
   Name: enrollment-user-write
   Create users as inactive: ✅ CHECKED  ← This enables approval!
   User path template: users/pending
   ```
3. In **Groups** section:
   - Click "Add group"
   - Create or select: `pending-users`
   - (If doesn't exist, go to Directory → Groups → Create first)
4. Click **Create**

#### Stage 3: Message Stage (Tell User They Need Approval)

1. Click **Create** → **Message Stage**
2. Configure:
   ```yaml
   Name: pending-approval-message
   ```
3. In the **Message** field, enter:
   ```
   Your registration has been submitted!

   ✅ Your account has been created
   ⏳ Awaiting administrator approval

   What happens next?
   1. Our team will review your registration
   2. You'll receive an email once approved
   3. Then you can log in and start using Portfolio Manager

   ⏱️ This typically takes 1-2 business days

   Questions? Contact: admin@portfolio-manager.com
   ```
4. Click **Create**

### 1.4 Bind Stages to Flow

1. Go back to **Flows & Stages** → **Flows**
2. Click on **portfolio-enrollment**
3. Click **Stage Bindings** tab
4. Bind stages in this order:

**Binding 1:**
```yaml
Stage: enrollment-prompt
Order: 10
```

**Binding 2:**
```yaml
Stage: enrollment-user-write
Order: 20
```

**Binding 3:**
```yaml
Stage: pending-approval-message
Order: 30
```

5. Click **Create** for each binding

**✅ Step 1 Complete!** The enrollment flow is now configured.

---

## Step 2: Enable Admin Approval (3 min)

### 2.1 Create Pending Users Group (If Not Done Already)

1. Go to **Directory** → **Groups**
2. Check if `pending-users` group exists
3. If not:
   - Click **Create**
   - Name: `pending-users`
   - Click **Create**

### 2.2 Verify User Write Stage Configuration

1. Go to **Flows & Stages** → **Stages**
2. Click on `enrollment-user-write`
3. Verify:
   - ✅ **Create users as inactive** is CHECKED
   - ✅ **Groups** includes `pending-users`
4. If not, update and click **Save**

**✅ Step 2 Complete!** Users will now be created as inactive.

---

## Step 3: Set Up Email Notifications (5 min)

### 3.1 Create Email Stage

1. Go to **Flows & Stages** → **Stages**
2. Click **Create** → **Email Stage**
3. Configure:
   ```yaml
   Name: notify-admin-new-user
   Subject: New User Registration - Approval Required
   Template: Use the template below
   Timeout: 30
   From address: noreply@portfolio-manager.com
   ```

### 3.2 Email Template

Copy this template into the **Template** field:

```
New user registration requires your approval:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User Details:
• Name: {{ user.name }}
• Email: {{ user.email }}
• Username: {{ user.username }}
• Registration Date: {{ user.date_joined|date:"Y-m-d H:i" }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Approve this registration in Authentik:
👉 http://localhost:9000/if/admin/#/directory/users

How to Approve:
1. Click the link above
2. Find user: {{ user.username }}
3. Click on the username
4. Check "Is active" checkbox
5. Go to "Groups" tab
6. Add to "portfolio-users" group
7. Click "Update"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User will be able to log in immediately after approval.

---
🤖 Automated message from Portfolio Manager
Do not reply to this email
```

### 3.3 Set Recipient Email

In the **To** field, enter your admin email address:
```
admin@example.com
```

(Replace with your actual admin email)

4. Click **Create**

### 3.4 Add Email Stage to Flow

1. Go to **Flows & Stages** → **Flows**
2. Click on **portfolio-enrollment**
3. Click **Stage Bindings** tab
4. Click **Bind Stage**
5. Configure:
   ```yaml
   Stage: notify-admin-new-user
   Order: 25  (between user-write and message)
   ```
6. Click **Create**

**Your flow should now look like this:**

| Order | Stage | Purpose |
|-------|-------|---------|
| 10 | enrollment-prompt | Collect registration info |
| 20 | enrollment-user-write | Create inactive user |
| 25 | notify-admin-new-user | Send email to admin |
| 30 | pending-approval-message | Show confirmation to user |

**✅ Step 3 Complete!** Admins will now receive email notifications.

---

## Step 4: Enable on Brand (2 min)

### 4.1 Configure Brand Settings

1. Go to **System** → **Brands**
2. Click on your brand (usually **authentik**)
3. Scroll to **Flow settings** section
4. Set:
   ```yaml
   Enrollment flow: portfolio-enrollment
   ```
5. Click **Update**

**✅ Step 4 Complete!** The "Sign up" link will now appear on the login page!

---

## Step 5: Test the Flow (5 min)

### 5.1 Test User Registration

1. **Open incognito browser window** (or logout of Authentik)
2. Go to `http://localhost:3000`
3. Click **"Sign Up"** or **"Register"** button
4. Fill in the registration form:
   ```
   Username: test_user_123
   Email: test@example.com
   Name: Test User
   Password: TestPassword123!
   Confirm Password: TestPassword123!
   ```
5. Click **"Create Account"** or **"Submit"**

### 5.2 Expected Results

**User Sees:**
```
✅ Your registration has been submitted!
⏳ Awaiting administrator approval

What happens next?
1. Our team will review your registration
2. You'll receive an email once approved
3. Then you can log in and start using Portfolio Manager

⏱️ This typically takes 1-2 business days
```

**Admin Receives Email:**
```
Subject: New User Registration - Approval Required

New user registration requires your approval:
• Name: Test User
• Email: test@example.com
• Username: test_user_123
...
```

### 5.3 Verify User Created as Inactive

1. Login to Authentik admin panel
2. Go to **Directory** → **Users**
3. Look for `test_user_123`
4. Verify:
   - ✅ **Is active**: ❌ Unchecked (inactive)
   - ✅ **Groups**: `pending-users`

### 5.4 Try to Login (Should Fail)

1. Go to `http://localhost:3000`
2. Try to login with:
   - Username: `test_user_123`
   - Password: `TestPassword123!`
3. **Expected:** Login fails or shows "Account inactive" message

**✅ This confirms the approval workflow is working correctly!**

### 5.5 Test Approval Process

1. In Authentik admin, go to **Directory** → **Users**
2. Click on `test_user_123`
3. **Approve the user:**
   - Check **"Is active"** checkbox
   - Click **"Groups"** tab
   - Click **"Add to existing group"**
   - Select `portfolio-users` (create if doesn't exist)
   - Click **"Add"**
4. Click **"Update"**

### 5.6 Test Login Again (Should Succeed)

1. Go to `http://localhost:3000`
2. Login with:
   - Username: `test_user_123`
   - Password: `TestPassword123!`
3. **Expected:** ✅ Login succeeds, user is redirected to dashboard

**✅ Step 5 Complete!** The entire workflow is working!

---

## What Users Will Experience

### Registration Process

1. **User clicks "Sign Up" on homepage**
   - Redirected to: `http://localhost:9000/if/flow/portfolio-enrollment/`

2. **User fills registration form:**
   ```
   ┌──────────────────────────────────┐
   │ Create your Portfolio Manager    │
   │ account                          │
   ├──────────────────────────────────┤
   │ Username: [                    ] │
   │ Email:    [                    ] │
   │ Name:     [                    ] │
   │ Password: [                    ] │
   │ Confirm:  [                    ] │
   │                                  │
   │      [ Create Account ]          │
   └──────────────────────────────────┘
   ```

3. **User sees confirmation message:**
   ```
   ┌──────────────────────────────────┐
   │ ✅ Registration Submitted         │
   ├──────────────────────────────────┤
   │ Your account is pending approval │
   │                                  │
   │ You'll receive an email once     │
   │ your account is activated.       │
   │                                  │
   │ This typically takes 1-2         │
   │ business days.                   │
   └──────────────────────────────────┘
   ```

4. **User waits for approval email**

5. **After approval, user can login immediately**

### User Journey Timeline

```
Day 1, 2:00 PM  → User registers
Day 1, 2:01 PM  → Admin receives email
Day 1, 3:30 PM  → Admin approves user
Day 1, 3:31 PM  → User can login ✅
```

---

## What Admins Will Do

### Daily Approval Workflow

#### 1. Check Email for New Registrations

```
📧 Inbox:
   [New] New User Registration - Approval Required
   [New] New User Registration - Approval Required
   [New] New User Registration - Approval Required
```

#### 2. Review Pending Users in Authentik

1. Go to `http://localhost:9000/if/admin/#/directory/users`
2. Filter:
   ```
   Is active: No
   Groups: pending-users
   ```
3. Results:
   ```
   ┌───────────────┬──────────────────────┬──────────────┐
   │ Username      │ Email                │ Registered   │
   ├───────────────┼──────────────────────┼──────────────┤
   │ john_doe      │ john@company.com     │ 2 hours ago  │
   │ jane_smith    │ jane@startup.io      │ 5 hours ago  │
   │ bob_wilson    │ bob@gmail.com        │ 1 day ago    │
   └───────────────┴──────────────────────┴──────────────┘
   ```

#### 3. Approve Each User

For each user:

1. **Click on username** (e.g., `john_doe`)
2. **Review information:**
   - Email looks legitimate?
   - Name is real?
   - No suspicious patterns?
3. **Approve:**
   - Check ✅ **"Is active"** checkbox
   - Click **"Groups"** tab
   - Add to **"portfolio-users"** group
   - Click **"Update"**
4. **User can login immediately!**

#### 4. (Optional) Reject Users

If registration looks suspicious:

**Option 1: Delete user**
1. Scroll to bottom
2. Click **"Delete"**
3. Confirm

**Option 2: Keep inactive**
1. Leave **"Is active"** unchecked
2. Add note in **Attributes**:
   ```json
   {
     "rejection_reason": "Suspicious email domain"
   }
   ```

### Approval Decision Guidelines

**✅ Approve When:**
- Email from company domain (`@company.com`)
- Name looks legitimate
- No existing account with same email
- Form filled completely

**❌ Deny When:**
- Disposable email service
- Fake name or test data
- Duplicate registration
- Violates terms of service

**⚠️ Investigate When:**
- Personal email (Gmail, Yahoo) for B2B app
- Multiple registrations from same IP
- Unusual registration time (3 AM on weekend)
- Name/email mismatch

---

## Next Steps

### Essential

1. **Set Up Email Backend** (if not done)
   - See: [email-configuration.md](./email-configuration.md)
   - Required for admin notifications to work

2. **Create Required Groups**
   - `pending-users` - Holds users awaiting approval
   - `portfolio-users` - Approved users with access
   - See: [user-groups-permissions.md](./user-groups-permissions.md)

3. **Establish Approval Process**
   - Check pending users daily
   - Set response time goal (e.g., same day)
   - Document approval criteria

### Optional Enhancements

1. **Add Email Verification**
   - Verify email before creating account
   - See: [email-verification.md](./email-verification.md)

2. **Customize Approval Message**
   - Add company branding
   - Include contact information
   - Set realistic timeframes

3. **Configure Password Policy**
   - Enforce strong passwords
   - Check against HaveIBeenPwned
   - See: [enrollment-setup.md](./enrollment-setup.md#configure-password-policy-optional)

4. **Set Up User Welcome Email**
   - Send email after approval
   - Include getting started guide
   - Requires custom automation

5. **Automate Approval Based on Email Domain**
   - Auto-approve company email domains
   - Requires Authentik policies (advanced)

---

## Troubleshooting

### Issue: Registration Form Missing Username Field

**Error:** "Aborting write to empty username"

**Solution:**
1. Go to **Flows & Stages** → **Prompts**
2. Create prompt with Field Key: `username` (exactly)
3. Go to **Stages** → `enrollment-prompt`
4. Add `username` prompt to the stage
5. Save and test again

### Issue: Users Can Login Before Approval

**Check:**
1. User Write stage has **"Create users as inactive"** CHECKED
2. User's **"Is active"** field is UNCHECKED in their profile

### Issue: Admin Not Receiving Emails

**Check:**
1. Email backend is configured (System → Settings)
2. Email stage is in the enrollment flow
3. Admin email address is correct
4. Check spam/junk folder
5. Test email: System → Settings → Email → Send test email

### Issue: "Sign Up" Link Not Appearing

**Check:**
1. Brand has enrollment flow set (System → Brands)
2. Flow designation is "Enrollment" (Flows & Stages → Flows)
3. Flow slug is `portfolio-enrollment`

---

## Summary Checklist

Use this to verify your setup:

### Configuration
- [ ] Created `portfolio-enrollment` flow
- [ ] Created prompt stage with username field
- [ ] Created user write stage (creates users as inactive)
- [ ] Created pending-users group
- [ ] Created message stage
- [ ] Created email notification stage
- [ ] All stages bound to flow in correct order
- [ ] Flow set as enrollment flow in brand settings

### Testing
- [ ] Can access enrollment URL
- [ ] Registration form shows all fields
- [ ] Can submit registration
- [ ] User created as inactive
- [ ] User added to pending-users group
- [ ] Admin receives email notification
- [ ] User CANNOT login before approval
- [ ] Can approve user in Authentik
- [ ] User CAN login after approval
- [ ] User can access Portfolio Manager

**✅ If all checked, your custom enrollment with admin approval is working perfectly!**

---

## Related Documentation

- **[enrollment-setup.md](./enrollment-setup.md)** - Detailed enrollment flow setup
- **[user-approval-setup.md](./user-management/user-approval-setup.md)** - Advanced approval workflows
- **[email-configuration.md](./email-configuration.md)** - Configure email backend
- **[user-groups-permissions.md](./user-groups-permissions.md)** - Manage groups and permissions
- **[troubleshooting.md](./troubleshooting.md)** - Common issues and solutions

---

**Need Help?** Check the troubleshooting guide or open an issue on GitHub.
