# Authentik Enrollment Flow Setup

This guide explains how to configure Authentik to allow users to self-register (enroll) in your Portfolio Manager application.

## ⚠️ CRITICAL: Username Field Requirement

**Common Issue:** Registration fails with "Aborting write to empty username" or "No user found and can't create new user"

**Root Cause:** The enrollment prompt stage is missing the **username** field.

**Quick Fix:** Jump to [Step 3: Add Username Field](#step-3-add-username-field-critical) below.

---

## Overview

By default, Authentik requires administrators to manually create user accounts. To allow users to register themselves, you need to:

1. Create or review the enrollment flow
2. **Add username field to the prompt stage** (CRITICAL!)
3. Configure the User Write stage to create users
4. Enable the enrollment flow on your brand
5. Optionally configure email verification and password policies

## Prerequisites

- Authentik is running and accessible at `http://localhost:9000`
- You have admin access to Authentik
- The OAuth2 provider and application are already configured (see [AUTHENTIK_QUICKSTART.md](./AUTHENTIK_QUICKSTART.md))

## Step 1: Review Default Enrollment Flow

Authentik comes with a default enrollment flow that's already configured. Let's review it:

1. **Login to Authentik** admin panel: `http://localhost:9000/`

2. Navigate to **Flows & Stages** → **Flows**

3. Look for a flow named `default-enrollment-flow` or `Welcome to authentik!`
   - If it exists, click on it to review
   - If it doesn't exist, proceed to "Creating a Custom Enrollment Flow" below

4. The default flow should include these stages:
   - **prompt-stage-enrollment** - Collects user information (username, name, email, password)
   - **user-write** - Creates the user in the database
   - **user-login** - Automatically logs the user in after registration

## Step 2: Enable Enrollment on Your Brand

1. In Authentik admin, navigate to **System** → **Brands**

2. Click on your brand (usually **authentik** or **default**)

3. Scroll to the **Flow settings** section

4. Configure the following:
   - **Enrollment flow**: Select `default-enrollment-flow` from the dropdown
   - **Recovery flow**: (Optional) Select `default-recovery-flow` for password reset
   - **Unenrollment flow**: (Optional) Select `default-unenrollment-flow` to allow users to delete accounts

5. Click **Update** at the bottom

## Step 3: Add Username Field (CRITICAL!)

**⚠️ This step is REQUIRED or registration will fail!**

### Option A: Add Username Prompt (Recommended)

1. **Navigate to Prompts:**
   - Go to **Flows & Stages** → **Prompts** (in the left sidebar)

2. **Check if username prompt exists:**
   - Look for a prompt with **Field Key** = `username`
   - If it exists, skip to step 4
   - If not, continue to step 3

3. **Create Username Prompt:**
   - Click **Create** button
   - Configure:
     - **Field Key**: `username` (must be exactly this!)
     - **Label**: `Username`
     - **Type**: `Text`
     - **Required**: ✅ **Checked**
     - **Placeholder**: `Choose a username`
     - **Order**: `0` (to show first)
     - **Help Text** (optional): `3-50 characters, letters and numbers only`
   - Click **Create**

4. **Add username to enrollment prompt stage:**
   - Navigate to **Flows & Stages** → **Stages**
   - Find and click on `enrollment-prompt` (or the prompt stage used in your enrollment flow)
   - In the **Fields** section, you'll see a multi-select list
   - **Add** the `username` field to the selected fields
   - **Order the fields** (drag or set order numbers):
     - Order 0: Username
     - Order 10: Email
     - Order 20: Name
     - Order 30: Password
     - Order 40: Password repeat
   - Click **Update**

5. **Verify the stage binding:**
   - Go to **Flows & Stages** → **Flows** → `default-enrollment-flow`
   - Click **Stage Bindings** tab
   - Ensure `enrollment-prompt` is bound with **Order 10** (before User Write stage)

### Option B: Use Email as Username (Alternative)

If you prefer users to login with email instead of a separate username:

1. **Navigate to User Write Stage:**
   - Go to **Flows & Stages** → **Stages**
   - Find and click on `default-user-settings-write` (or your enrollment user write stage)

2. **Check settings:**
   - Look for **"User Path Template"** or **"Username field"** settings
   - Some Authentik versions have **"Can create users"** checkbox - ensure it's checked
   - Some versions allow setting username source to `email` field

3. **Alternative approach - modify prompt:**
   - Instead of creating separate username field
   - Configure the User Write stage to use the `email` field as username
   - This requires custom stage configuration

**Note:** Option A (separate username) is recommended as it's more straightforward and standard.

## Step 4: Configure User Write Stage

**Ensure the User Write Stage can create new users:**

1. **Navigate to Stages:**
   - Go to **Flows & Stages** → **Stages**

2. **Find the User Write stage:**
   - Look for the stage used in your enrollment flow
   - Common names: `default-user-settings-write`, `enrollment-user-write`, `user-write`

3. **Edit the stage:**
   - Click on the stage name
   - **Verify settings:**
     - **Create users as inactive**: Should be **Unchecked** (users should be active immediately)
     - **User path template**: Should be `users` (default)
     - **Can create users**: Should be **enabled/checked** (if this option exists)

4. **If using wrong stage type:**
   - The `default-user-settings-write` stage might be configured for updating existing users only
   - **Solution**: Create a new User Write Stage specifically for enrollment:
     - Click **Create** → **User Write Stage**
     - Name: `enrollment-user-write`
     - **User creation mode**: Enabled
     - **Create users as inactive**: Unchecked
     - Click **Create**
   - Then update your enrollment flow to use this new stage instead

## Step 5: Test Enrollment

1. **Logout** from Authentik admin (or open an incognito window)

2. **Access the enrollment URL**: `http://localhost:9000/if/flow/default-enrollment-flow/`

3. You should see a registration form with fields like:
   - Username
   - Name
   - Email
   - Password
   - Password confirmation

4. Fill in the form and submit

5. If successful, you should:
   - Be automatically logged in
   - See the Authentik user dashboard
   - Be able to use those credentials to login to the Portfolio Manager app

## Step 4: Link Enrollment to Login Flow (Optional)

To show a "Create account" link on the login page:

1. Navigate to **Flows & Stages** → **Flows**

2. Find and click on `default-authentication-flow`

3. Scroll down to **Designation** section

4. Make sure:
   - **Designation**: `Authentication`
   - **Compatibility mode**: Unchecked (unless you have specific needs)

5. Navigate to **System** → **Brands** → Your brand

6. In **Flow settings**, verify:
   - **Authentication flow**: `default-authentication-flow`
   - **Enrollment flow**: `default-enrollment-flow`

7. Now when users visit the login page, they should see a "Create account" or "Sign up" link

## Step 5: Configure Email Verification (Recommended for Production)

### Create Email Stage

1. Navigate to **Flows & Stages** → **Stages**

2. Click **Create** → **Email Stage**

3. Configure:
   - **Name**: `enrollment-email-verification`
   - **From address**: `noreply@yourdomain.com`
   - **Subject**: `Verify your email address`
   - **Template**: `email/account_confirmation.html` (default)
   - **Token expiry**: `30` minutes
   - **Activate pending users**: ✅ Checked

4. Click **Create**

### Add Email Stage to Enrollment Flow

1. Navigate to **Flows & Stages** → **Flows**

2. Click on `default-enrollment-flow`

3. Click **Stage Bindings** tab

4. Click **Bind Stage**

5. Configure:
   - **Stage**: Select `enrollment-email-verification`
   - **Order**: Set to run after `prompt-stage-enrollment` but before `user-write`
   - **Re-evaluate policies**: ✅ Checked (optional)

6. Click **Create**

7. **Reorder stages** if needed:
   - Prompt Stage (collect user data)
   - Email Stage (verify email)
   - User Write Stage (create user)
   - User Login Stage (log user in)

### Configure Email Backend

For email verification to work, you need to configure an email backend:

1. Navigate to **System** → **Settings**

2. Scroll to **Email** section

3. Configure SMTP settings:
   - **Host**: Your SMTP server (e.g., `smtp.gmail.com`)
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your email username
   - **Password**: Your email password or app password
   - **Use TLS**: ✅ Checked
   - **From address**: `noreply@yourdomain.com`

4. Click **Test** to send a test email

5. Click **Update**

**Note**: For local development, you can use a service like [Mailhog](https://github.com/mailhog/MailHog) or skip email verification.

## Step 6: Configure Password Policy (Optional)

1. Navigate to **Policies** → **Create** → **Password Policy**

2. Configure:
   - **Name**: `strong-password-policy`
   - **Password field**: `password`
   - **Minimum length**: `8`
   - **Minimum amount of uppercase characters**: `1`
   - **Minimum amount of lowercase characters**: `1`
   - **Minimum amount of digits**: `1`
   - **Minimum amount of symbols**: `0`
   - **Check static rules**: ✅ Checked
   - **Check HaveIBeenPwned**: ✅ Checked (requires internet)

3. Click **Create**

### Apply Password Policy to Enrollment Flow

1. Navigate to **Flows & Stages** → **Flows** → `default-enrollment-flow`

2. Click **Policies** tab

3. Click **Bind Policy**

4. Configure:
   - **Policy**: Select `strong-password-policy`
   - **Order**: `0`
   - **Enabled**: ✅ Checked

5. Click **Create**

## Creating a Custom Enrollment Flow (Alternative)

If you want more control, create a custom enrollment flow:

### 1. Create Prompt Stage

1. Navigate to **Flows & Stages** → **Stages** → **Create** → **Prompt Stage**

2. Click **Create** to create a new Prompt Stage

3. Name it: `custom-enrollment-prompt`

4. Click **Create Prompt** to add fields:
   - **Field**: `username`, **Type**: Text, **Required**: ✅, **Placeholder**: `Choose a username`
   - **Field**: `email`, **Type**: Email, **Required**: ✅, **Placeholder**: `Your email address`
   - **Field**: `name`, **Type**: Text, **Required**: ✅, **Placeholder**: `Your full name`
   - **Field**: `password`, **Type**: Password, **Required**: ✅, **Placeholder**: `Choose a password`
   - **Field**: `password_repeat`, **Type**: Password, **Required**: ✅, **Placeholder**: `Confirm password`

5. Save the prompts

### 2. Create User Write Stage

1. Navigate to **Flows & Stages** → **Stages** → **Create** → **User Write Stage**

2. Configure:
   - **Name**: `custom-enrollment-user-write`
   - **Create users as inactive**: Unchecked (or checked if using email verification)
   - **User path template**: `users`

3. Click **Create**

### 3. Create User Login Stage

1. Navigate to **Flows & Stages** → **Stages** → **Create** → **User Login Stage**

2. Configure:
   - **Name**: `custom-enrollment-user-login`
   - **Session duration**: `seconds=0` (use default)

3. Click **Create**

### 4. Create the Flow

1. Navigate to **Flows & Stages** → **Flows** → **Create**

2. Configure:
   - **Name**: `custom-enrollment-flow`
   - **Title**: `Create your account`
   - **Slug**: `custom-enrollment`
   - **Designation**: `Enrollment`
   - **Compatibility mode**: Unchecked
   - **Layout**: Default

3. Click **Create**

### 5. Bind Stages to Flow

1. Click on the newly created `custom-enrollment-flow`

2. Click **Stage Bindings** tab

3. **Bind each stage** in this order:
   - Order `10`: `custom-enrollment-prompt`
   - Order `20`: `custom-enrollment-user-write`
   - Order `30`: `custom-enrollment-user-login`

4. Click **Update**

### 6. Set as Default Enrollment Flow

1. Navigate to **System** → **Brands** → Your brand

2. In **Flow settings**:
   - **Enrollment flow**: Select `custom-enrollment-flow`

3. Click **Update**

## Frontend Integration

The Portfolio Manager frontend already supports enrollment! When users click "Register" they'll be redirected to:

```
http://localhost:9000/if/flow/default-enrollment-flow/
```

After successful registration, they can:
1. Login using the credentials they created
2. Access the Portfolio Manager application

## Troubleshooting

### Enrollment URL shows 404

- **Check flow exists**: Navigate to Flows & Stages → Flows and verify `default-enrollment-flow` exists
- **Check designation**: Make sure the flow's designation is set to "Enrollment"
- **Check slug**: The URL uses the flow's slug, verify it's `default-enrollment-flow`

### Users can't see enrollment link on login page

- **Check brand settings**: System → Brands → Your brand → Enrollment flow must be set
- **Use direct URL**: Share `http://localhost:9000/if/flow/default-enrollment-flow/` directly

### Email verification not working

- **Check SMTP settings**: System → Settings → Email configuration
- **Test email**: Click "Test" button in email settings
- **Check logs**: `podman compose logs -f portfolio-authentik-server`
- **For development**: Consider skipping email verification or using Mailhog

### Password policy too strict

- **Edit policy**: Policies → Your password policy → Reduce requirements
- **Or remove policy**: Flows → Your enrollment flow → Policies tab → Delete binding

### Users are created but can't login to Portfolio Manager

- **Check scopes**: Make sure the OAuth2 provider has `openid`, `email`, `profile` scopes
- **Check application**: The application must be linked to the provider
- **Check client ID**: Must match `portfolio-manager`
- **Check backend logs**: `podman compose logs -f portfolio-backend`

## Testing Checklist

- [ ] Can access enrollment URL: `http://localhost:9000/if/flow/default-enrollment-flow/`
- [ ] Can see registration form with username, email, password fields
- [ ] Can submit form with valid data
- [ ] User is created in Authentik (verify in admin → Directory → Users)
- [ ] User is automatically logged in after registration
- [ ] Can logout and login again with the created credentials
- [ ] Can login to Portfolio Manager using the new account
- [ ] Registration validates password strength (if policy is configured)
- [ ] Email verification works (if configured)

## Additional Resources

- [Authentik Flows Documentation](https://goauthentik.io/docs/flow/)
- [Authentik Stages Documentation](https://goauthentik.io/docs/flow/stages/)
- [Authentik Email Configuration](https://goauthentik.io/docs/installation/configuration#authentik_email)
- [Password Policies](https://goauthentik.io/docs/policies/password/)

## Next Steps

After setting up enrollment:
1. Configure password recovery flow
2. Set up social login (Google, GitHub, etc.)
3. Enable 2FA for enhanced security
4. Customize branding and themes
5. Set up user groups and permissions
