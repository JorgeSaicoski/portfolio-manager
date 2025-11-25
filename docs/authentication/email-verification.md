# Authentik Email Verification Setup Guide

This guide explains how to configure email verification for user registrations in Authentik. Email verification ensures users provide valid email addresses and helps prevent spam registrations.

## Table of Contents

- [Why Email Verification?](#why-email-verification)
- [Prerequisites](#prerequisites)
- [Step 1: Configure Email Backend](#step-1-configure-email-backend)
- [Step 2: Create Email Verification Stage](#step-2-create-email-verification-stage)
- [Step 3: Add Stage to Enrollment Flow](#step-3-add-stage-to-enrollment-flow)
- [Step 4: Test Email Verification](#step-4-test-email-verification)
- [Customization Options](#customization-options)
- [Troubleshooting](#troubleshooting)
- [Production Best Practices](#production-best-practices)

## Why Email Verification?

Email verification provides several benefits:

**Security:**
- Confirms users own the email address they registered with
- Prevents registration with fake or mistyped email addresses
- Reduces spam and bot registrations

**Communication:**
- Ensures you can reach users for password resets
- Validates email for important notifications
- Maintains clean email list (no bounces)

**Compliance:**
- Demonstrates user consent (GDPR, CAN-SPAM)
- Provides audit trail of verified users
- Reduces liability from invalid contacts

**User Experience:**
- Prevents typos in email addresses
- Ensures users can recover their accounts
- Builds trust with professional process

## Prerequisites

- Authentik is running and accessible at `http://localhost:9000`
- You have admin access to Authentik
- **Email is configured** (SMTP, SES, or SendGrid)
  - If not, see [email-configuration.md](./email-configuration.md) first
- Enrollment flow is configured
  - If not, see [enrollment-setup.md](./enrollment-setup.md) first

## Step 1: Configure Email Backend

Before setting up verification, ensure email is working.

### 1.1 Verify Email Configuration

1. **Login to Authentik** admin: `http://localhost:9000/`
2. Navigate to **System** → **Settings**
3. Scroll to **Email** section
4. Verify these settings are filled in:
   - From address
   - Host
   - Port
   - Username
   - Password
   - Use TLS (usually checked)

### 1.2 Test Email Sending

1. In the Email section, click **Test** button
2. Check your inbox for the test email
3. If test fails, see [email-configuration.md](./email-configuration.md)

**✅ Email must be working before continuing!**

## Step 2: Create Email Verification Stage

Now we'll create a stage that sends verification emails.

### 2.1 Navigate to Stages

1. In Authentik admin, navigate to **Flows & Stages** → **Stages**
2. You'll see a list of existing stages
3. Click **Create** button (top right)

### 2.2 Select Stage Type

1. A dropdown will appear with stage types
2. Select **Email Stage**
3. The stage configuration form will open

### 2.3 Configure Email Stage

Fill in the following settings:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `enrollment-email-verification` | Descriptive name for this stage |
| **Subject** | `Verify your email address` | Email subject line |
| **Template** | `email/account_confirmation.html` | Built-in template |
| **Activate pending user** | ✅ Checked | **CRITICAL**: Enable user after verification |
| **Use global settings** | ✅ Checked | Use email config from System → Settings |
| **Token expiry** | `30` | Minutes before link expires |
| **From address** | (leave empty to use global) | Or override with specific address |

### 2.4 Understanding Key Settings

**Activate pending user:**
- **Checked**: User account created as inactive, activated after email verification
- **Unchecked**: User account active immediately, but email sent for confirmation
- **Recommended**: ✅ Checked (activate after verification)

**Token expiry:**
- How long the verification link remains valid
- **Too short**: Users might not verify in time
- **Too long**: Security risk if email compromised
- **Recommended**: 30 minutes to 24 hours (1440 minutes)

**Template:**
- `email/account_confirmation.html` - Default verification email
- You can create custom templates (see [Customization](#customization-options))

### 2.5 Create the Stage

1. **Review all settings**
2. Click **Create** button at the bottom
3. You should see the stage in the list

**✅ Email verification stage created!**

## Step 3: Add Stage to Enrollment Flow

Now we need to add this stage to the enrollment flow.

### 3.1 Navigate to Enrollment Flow

1. Navigate to **Flows & Stages** → **Flows**
2. Find your enrollment flow (usually `portfolio-enrollment`)
3. Click on the flow name

### 3.2 View Current Stage Bindings

1. Click the **Stage Bindings** tab
2. You should see existing stages like:
   - Order 10: `prompt-stage-enrollment` (collects user info)
   - Order 20: `user-write` (creates user)
   - Order 30: `user-login` (logs user in)

**Note:** Order numbers determine execution sequence (lower = earlier).

### 3.3 Determine Where to Insert Email Stage

**Option A: Verify Before Creating User (Recommended)**

```
Order 10: Prompt (collect email, password, etc.)
Order 15: Email Verification ← NEW
Order 20: User Write (create user after verification)
Order 30: User Login
```

**Pros:**
- Only creates user if email is valid
- No inactive users in database
- Cleaner user list

**Cons:**
- User must verify before account exists
- Can't login until verified

**Option B: Verify After Creating User (Alternative)**

```
Order 10: Prompt (collect email, password, etc.)
Order 20: User Write (create user as inactive)
Order 25: Email Verification ← NEW
Order 30: User Login (after activation)
```

**Pros:**
- User account exists immediately
- Can track unverified users
- Can resend verification emails

**Cons:**
- Creates inactive users in database
- Needs cleanup of never-verified accounts

**Recommendation:** Use Option A for new setups.

### 3.4 Add Email Stage Binding

1. On the **Stage Bindings** tab, click **Bind Stage** button

2. Configure the binding:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Stage** | `enrollment-email-verification` | Select from dropdown |
   | **Order** | `15` | Between prompt (10) and user-write (20) |
   | **Re-evaluate policies** | ✅ Checked (optional) | Re-check policies before this stage |
   | **Invalid response behavior** | `Retry` | What to do if stage fails |

3. Click **Create**

### 3.5 Adjust User Write Stage (Important!)

If using Option A (verify before user creation), the User Write stage should create active users.

1. On the **Stage Bindings** tab, find the **User Write** stage
2. Click on the stage name (e.g., `user-write`)
3. In the stage configuration:
   - **Create users as inactive**: ❌ **Unchecked**
   - (User will be created active after email verification)
4. Click **Update**

If using Option B (verify after user creation):

1. Find the **User Write** stage configuration
2. **Create users as inactive**: ✅ **Checked**
3. **Activate pending user** (in email stage): ✅ **Checked**

### 3.6 Review Final Flow

The flow should now look like this:

```
portfolio-enrollment
├── [10] prompt-stage-enrollment
│   └── Collect: username, email, password
├── [15] enrollment-email-verification ← NEW
│   └── Send verification email
├── [20] user-write
│   └── Create user account
└── [30] user-login
    └── Log user in
```

**✅ Email verification added to enrollment flow!**

## Step 4: Test Email Verification

Now let's test the complete flow.

### 4.1 Start Enrollment

1. **Logout** from Authentik (or open incognito window)

2. **Navigate to enrollment:**
   - Direct URL: `http://localhost:9000/if/flow/portfolio-enrollment/`
   - Or from Portfolio Manager: `http://localhost:3000` → Click "Register"

### 4.2 Fill Registration Form

1. Fill in the form:
   - **Username**: `testuser123`
   - **Email**: Use a real email you can check
   - **Name**: `Test User`
   - **Password**: (create a password)
   - **Password confirmation**: (same password)

2. Click **Sign up** or **Submit**

### 4.3 Check for Verification Email

1. **You should see a message:**
   ```
   A verification email has been sent to your email address.
   Please check your inbox and click the verification link.
   ```

2. **Check your email inbox** (including spam folder)

3. **You should receive an email:**
   - **From**: Your configured "from address"
   - **Subject**: "Verify your email address"
   - **Body**: Contains a verification link

4. **Click the verification link** in the email

### 4.4 Complete Verification

After clicking the link:

1. **You should be redirected** to Authentik
2. **You should see a success message:**
   ```
   Email verified successfully!
   ```
3. **You should be automatically logged in** (if flow continues)
4. **You should be redirected** to Portfolio Manager

### 4.5 Verify User is Active

1. **Login to Authentik** admin
2. Navigate to **Directory** → **Users**
3. Find the test user (`testuser123`)
4. Click on the user
5. **Verify**:
   - **Status**: Active (should have a green checkmark)
   - **Email**: Should be listed
   - **Last login**: Should show recent timestamp

**✅ If all steps worked, email verification is configured correctly!**

## Customization Options

### Custom Email Subject

Change the email subject line:

1. Navigate to **Flows & Stages** → **Stages**
2. Click on `enrollment-email-verification`
3. Change **Subject** field:
   - `Welcome to Portfolio Manager - Verify Your Email`
   - `Confirm your email for Portfolio Manager`
   - `[Portfolio Manager] Please verify your email`
4. Click **Update**

### Custom Token Expiry

Change how long verification links remain valid:

1. Edit the email stage
2. Change **Token expiry** field:
   - `10` = 10 minutes (fast verification required)
   - `60` = 1 hour (reasonable)
   - `1440` = 24 hours (relaxed)
   - `10080` = 7 days (very relaxed)
3. Click **Update**

**Recommendation**: 30-60 minutes for security, 24 hours for convenience.

### Custom Email Template

Create a custom verification email template:

#### Option 1: Override Default Template

1. **Create custom template file:**
   ```bash
   mkdir -p ./authentik-templates/email
   nano ./authentik-templates/email/account_confirmation.html
   ```

2. **Add custom HTML:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <meta charset="utf-8">
       <title>Verify your email</title>
       <style>
           body {
               font-family: Arial, sans-serif;
               line-height: 1.6;
               color: #333;
               max-width: 600px;
               margin: 0 auto;
               padding: 20px;
           }
           .header {
               background: #007bff;
               color: white;
               padding: 20px;
               text-align: center;
           }
           .content {
               padding: 20px;
               background: #f9f9f9;
           }
           .button {
               display: inline-block;
               padding: 12px 24px;
               background: #007bff;
               color: white;
               text-decoration: none;
               border-radius: 4px;
               margin: 20px 0;
           }
           .footer {
               font-size: 12px;
               color: #666;
               text-align: center;
               padding: 20px;
           }
       </style>
   </head>
   <body>
       <div class="header">
           <h1>Welcome to Portfolio Manager!</h1>
       </div>
       <div class="content">
           <p>Hi {{ username }},</p>
           <p>Thanks for signing up! We're excited to have you on board.</p>
           <p>To complete your registration, please verify your email address by clicking the button below:</p>
           <p style="text-align: center;">
               <a href="{{ url }}" class="button">Verify Email Address</a>
           </p>
           <p>Or copy and paste this link into your browser:</p>
           <p style="word-break: break-all; color: #007bff;">{{ url }}</p>
           <p><strong>This link will expire in {{ expires }} minutes.</strong></p>
           <p>If you didn't create an account with us, please ignore this email.</p>
       </div>
       <div class="footer">
           <p>&copy; 2024 Portfolio Manager. All rights reserved.</p>
           <p>This is an automated message, please do not reply.</p>
       </div>
   </body>
   </html>
   ```

3. **Mount template in docker-compose:**
   ```yaml
   services:
     portfolio-authentik-server:
       volumes:
         - ./authentik-templates:/templates:ro
   ```

4. **Restart Authentik:**
   ```bash
   podman compose restart portfolio-authentik-server
   ```

#### Option 2: Create New Template

1. Create new template: `./authentik-templates/email/custom_verification.html`
2. Mount templates (same as above)
3. Edit email stage:
   - Change **Template** to `email/custom_verification.html`
4. Restart and test

### Available Template Variables

Use these variables in your custom templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ username }}` | User's username | `johndoe` |
| `{{ user.email }}` | User's email | `john@example.com` |
| `{{ user.name }}` | User's full name | `John Doe` |
| `{{ url }}` | Verification URL | `http://localhost:9000/if/...` |
| `{{ expires }}` | Minutes until expiry | `30` |

### Custom From Address

Override the global email settings:

1. Edit the email stage
2. Uncheck **Use global settings**
3. Fill in **From address**: `verify@yourdomain.com`
4. Optionally configure separate SMTP settings
5. Click **Update**

**Use case**: Different sender for verification vs. notifications.

## Troubleshooting

### Verification Email Not Received

**Check spam folder:**
- Verification emails often flagged as spam
- Add sender to whitelist/safe senders

**Check email configuration:**
```bash
# View Authentik logs
podman compose logs portfolio-authentik-server | grep -i email
```

**Verify stage is in flow:**
1. Flows & Stages → Flows → Enrollment flow
2. Stage Bindings tab
3. Confirm email stage is listed and bound

**Test email sending:**
1. System → Settings → Email section
2. Click "Test" button
3. If test fails, fix email config first

### Verification Link Expired

**Cause**: Token expiry too short or user delayed verification.

**Solution:**

1. **Increase token expiry:**
   - Edit email stage
   - Set **Token expiry** to `1440` (24 hours)

2. **Resend verification email:**
   - Future enhancement: Add "Resend" button
   - For now: User must re-register

### Verification Link Returns 404

**Cause**: Invalid token or flow issue.

**Solutions:**

1. **Check Authentik logs:**
   ```bash
   podman compose logs portfolio-authentik-server
   ```

2. **Verify URL format:**
   - Should be: `http://localhost:9000/if/flow/portfolio-enrollment/?token=...`

3. **Check flow still exists:**
   - Flows & Stages → Flows
   - Confirm enrollment flow is active

### User Account Not Activated

**Cause**: "Activate pending user" not checked.

**Solution:**

1. Edit email stage
2. Enable **Activate pending user** ✅
3. Test with new registration

**Manually activate user:**
1. Directory → Users → Find user
2. Click Edit
3. Check **Is active** checkbox
4. Save

### Multiple Verification Emails Sent

**Cause**: Stage bound multiple times or flow loops.

**Solution:**

1. Check stage bindings:
   - Flows & Stages → Flows → Enrollment flow
   - Stage Bindings tab
   - Remove duplicate email stage bindings

2. Check flow doesn't loop back

### Verification Email in Wrong Language

**Cause**: User's browser language differs from desired language.

**Solution:**

Authentik uses browser language by default. To force a language:

1. **Set default language:**
   - System → Settings
   - Set **Default locale**

2. **Or use custom template** with hardcoded language

### Link Doesn't Auto-Login User

**Cause**: User Login stage not in flow or positioned incorrectly.

**Solution:**

1. Check flow has User Login stage:
   - Flows & Stages → Flows → Enrollment flow
   - Stage Bindings tab
   - Add User Login stage if missing

2. Ensure User Login is AFTER email verification

3. Check stage order:
   ```
   10: Prompt
   15: Email Verification
   20: User Write
   30: User Login ← Should be last
   ```

## Production Best Practices

### Token Expiry

- **Development**: 24 hours (1440 minutes) - convenient for testing
- **Production**: 30-60 minutes - better security
- **High security**: 10 minutes - very strict

### Email Content

- **Clear subject**: "Verify your email for [App Name]"
- **Include branding**: Logo, colors, company info
- **Plain text version**: For email clients that don't support HTML
- **Mobile friendly**: Responsive design
- **Clear CTA**: Big, obvious verification button

### Security

- **Use HTTPS** for verification URLs in production
- **Log verification attempts** for audit trail
- **Rate limit**: Prevent email bombing
- **Monitor bounces**: Track invalid email addresses

### User Experience

- **Show clear message** after registration
- **Provide support link** if email not received
- **Allow resend** verification email (future enhancement)
- **Auto-login** after successful verification
- **Remember devices** (optional) to skip re-verification

### Cleanup

**Remove unverified users** after a time period:

1. Create scheduled task to query inactive users
2. Delete users inactive > 7 days with unverified email
3. Or: Send reminder email, then delete after 14 days

### Monitoring

Track:
- **Verification rate**: % of users who verify
- **Time to verify**: How quickly users verify
- **Bounce rate**: Invalid email addresses
- **Expired tokens**: Users hitting expired links

### Compliance

- **GDPR**: Document email usage in privacy policy
- **Retention**: Don't keep emails of unverified/deleted users
- **Consent**: Email verification implies consent for transactional emails

## Next Steps

After setting up email verification:

1. **Test thoroughly** with multiple email providers (Gmail, Outlook, etc.)
2. **[Configure User Groups](./user-groups-permissions.md)** - Organize verified users
3. **Setup password reset flow** - Uses similar email stage
4. **Monitor verification rates** - Track how many users complete verification
5. **Customize email template** - Match your branding
6. **Add resend functionality** - Let users request new verification emails

## Additional Resources

- [Authentik Email Stage Docs](https://goauthentik.io/docs/flow/stages/email/)
- [Email Deliverability Best Practices](./email-configuration.md#production-best-practices)
- [Custom Email Templates](https://goauthentik.io/docs/customize/email-templates/)
- [Flow Configuration](https://goauthentik.io/docs/flow/)
