# Authentik Enrollment Flow Setup

This comprehensive guide explains how to configure Authentik to allow users to self-register (enroll) in your Portfolio Manager application with complete step-by-step instructions.

## Table of Contents

- [Common Issues - Quick Fixes](#common-issues---quick-fixes)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Review Default Enrollment Flow](#step-1-review-default-enrollment-flow)
- [Step 2: Enable Enrollment on Your Brand](#step-2-enable-enrollment-on-your-brand)
- [Step 3: Add Username Field (CRITICAL!)](#step-3-add-username-field-critical)
- [Step 4: Configure User Write Stage](#step-4-configure-user-write-stage)
- [Step 5: Auto-Assign Users to Groups](#step-5-auto-assign-users-to-groups)
- [Step 6: Test Enrollment Flow](#step-6-test-enrollment-flow)
- [Optional Enhancements](#optional-enhancements)
- [Troubleshooting](#troubleshooting)

## Common Issues - Quick Fixes

### ⚠️ CRITICAL: Username Field Missing

**Issue:** Registration fails with "Aborting write to empty username" or "No user found and can't create new user"

**Root Cause:** The enrollment prompt stage is missing the **username** field.

**Quick Fix:** Jump to [Step 3: Add Username Field](#step-3-add-username-field-critical) below.

### Issue: New Users Can't Access Application

**Root Cause:** Users not assigned to required groups.

**Quick Fix:** Jump to [Step 5: Auto-Assign Users to Groups](#step-5-auto-assign-users-to-groups) below.

---

## Overview

By default, Authentik requires administrators to manually create user accounts. To allow users to register themselves, you need to:

1. ✅ Review or create the enrollment flow
2. ✅ Enable enrollment flow on your brand
3. ✅ **Add username field to the prompt stage** (CRITICAL!)
4. ✅ Configure the User Write stage to create users
5. ✅ **Auto-assign new users to default groups** (NEW!)
6. ✅ Test the complete registration flow
7. ⚙️ Optionally add email verification, password policies, etc.

**Estimated Time:** 15-20 minutes

## Prerequisites

- Authentik is running and accessible at `http://localhost:9000`
- You have admin access to Authentik
- The OAuth2 provider and application are configured
  - If not, see [provider-application-setup.md](./provider-application-setup.md)
- You have created user groups (optional but recommended)
  - If not, see [user-groups-permissions.md](./user-groups-permissions.md)

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

### ✨ Automatic "Sign Up" Link Feature

**When you configure the enrollment flow in your brand settings, Authentik automatically adds a "Sign up" link to the bottom of the login page!**

This means users who arrive at the Authentik login page will see:
- Login fields (username/email + password)
- A "Sign up" link at the bottom

**No additional configuration needed** - this link appears automatically once the enrollment flow is set in the brand settings.

**User Experience:**
- User clicks "Sign In" on your Portfolio Manager homepage
- Redirects to Authentik login page
- User sees "Sign up" link and clicks it
- Goes directly to the enrollment flow
- Registers and is automatically logged in

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

The User Write stage is responsible for actually creating user accounts in the database.

### 4.1 Find the User Write Stage

1. **Navigate to Stages:**
   - Go to **Flows & Stages** → **Stages**

2. **Find the User Write stage:**
   - Look for the stage used in your enrollment flow
   - Common names: `default-user-settings-write`, `enrollment-user-write`, `user-write`
   - You can also check from: Flows → default-enrollment-flow → Stage Bindings tab

### 4.2 Verify User Write Configuration

1. **Click on the User Write stage** to edit it

2. **Verify these critical settings:**

   | Setting | Recommended Value | Why? |
   |---------|-------------------|------|
   | **Create users as inactive** | ❌ Unchecked | Users active immediately (unless using email verification) |
   | **User path template** | `users` | Where users are stored in Authentik's directory |
   | **Can create users** | ✅ Enabled | Stage can create new users (if option exists) |

### 4.3 If Using Email Verification

If you plan to add email verification ([email-verification.md](./email-verification.md)):

- **Create users as inactive**: ✅ **Checked**
- Email stage will activate users after verification

### 4.4 Create New User Write Stage (If Needed)

If the existing stage doesn't work or is misconfigured:

1. **Create a new User Write Stage:**
   - Click **Create** → **User Write Stage**

2. **Configure the stage:**
   - **Name**: `enrollment-user-write`
   - **Create users as inactive**: ❌ Unchecked (or ✅ if using email verification)
   - **User path template**: `users`

3. **Click Create**

4. **Update enrollment flow to use new stage:**
   - Go to **Flows & Stages** → **Flows** → `default-enrollment-flow`
   - Click **Stage Bindings** tab
   - Find the old User Write stage binding
   - Click **Edit** and change to `enrollment-user-write`
   - Or delete old binding and create new one

**✅ User Write stage configured!**

## Step 5: Auto-Assign Users to Groups

**NEW!** This critical step ensures new users are automatically added to default groups so they can access your application.

### 5.1 Why This Matters

Without group assignment:
- ❌ New users may not be able to access Portfolio Manager
- ❌ You'll need to manually add each user to groups
- ❌ Users get confused why they can't login

With auto-assignment:
- ✅ New users immediately get appropriate access
- ✅ Automatic onboarding - no manual work
- ✅ Better user experience

### 5.2 Prerequisites: Create User Groups

First, ensure you have groups created (if not done already):

1. **Navigate to** **Directory** → **Groups**

2. **Create a "users" group** (if not exists):
   - Click **Create**
   - **Name**: `users`
   - **Label**: `Standard Users`
   - Click **Create**

For more details on groups, see [user-groups-permissions.md](./user-groups-permissions.md).

### 5.3 Configure User Write Stage to Assign Groups

Now configure the User Write stage to automatically add new users to groups:

1. **Navigate to** **Flows & Stages** → **Stages**

2. **Click on your User Write stage** (e.g., `user-write` or `enrollment-user-write`)

3. **Scroll down to the "Groups" section**

4. **Click "Add Group" or select from dropdown**:
   - Select `users` (or your default group)
   - You can add multiple groups if needed

5. **Click "Update"** to save

### 5.4 Verify Configuration

1. Go to **Flows & Stages** → **Flows** → `default-enrollment-flow`
2. Click **Stage Bindings** tab
3. Click on the User Write stage
4. Verify **Groups** section shows `users` (or your group)

**✅ Auto-assignment configured!** New users will automatically be added to the `users` group.

## Step 6: Test Enrollment Flow

Now let's test the complete enrollment process to verify everything works.

### 6.1 Access Enrollment Page

1. **Logout** from Authentik admin (or open an incognito window)

2. **Access the enrollment URL**:
   - Direct: `http://localhost:9000/if/flow/default-enrollment-flow/`
   - Or via Portfolio Manager: `http://localhost:3000` → Click "Register"

### 6.2 Fill Registration Form

You should see a registration form with these fields:

- ✅ **Username** (if you completed Step 3)
- ✅ **Email**
- ✅ **Name** (full name)
- ✅ **Password**
- ✅ **Password confirmation**

**Fill in test data:**
```
Username: testuser123
Email: your-email@example.com (use a real email you can check)
Name: Test User
Password: TestPassword123!
Password confirmation: TestPassword123!
```

### 6.3 Submit Registration

1. **Click** "Sign up" or "Submit" button

2. **Expected result:**
   - ✅ No errors
   - ✅ Redirected to success page or auto-logged in
   - ✅ See Authentik user dashboard or Portfolio Manager app

### 6.4 Verify User Was Created

1. **Login** to Authentik admin panel

2. **Navigate to** **Directory** → **Users**

3. **Find** the test user (`testuser123`)

4. **Click** on the user to view details

5. **Verify:**
   - ✅ **Status**: Active (green checkmark)
   - ✅ **Username**: `testuser123`
   - ✅ **Email**: matches what you entered
   - ✅ **Groups** tab: Shows `users` group (if you configured Step 5)

**✅ If you see the user with active status and in the correct group, enrollment is working!**

### 6.5 Test Login to Portfolio Manager

1. **Go to** `http://localhost:3000`

2. **Click** "Login"

3. **Enter credentials:**
   - Username: `testuser123`
   - Password: `TestPassword123!`

4. **Expected result:**
   - ✅ Redirected to Authentik login
   - ✅ Successfully authenticated
   - ✅ Redirected back to Portfolio Manager
   - ✅ Logged in and can access the application

**✅ Complete enrollment and authentication flow working!**

## Optional Enhancements

After basic enrollment is working, consider these enhancements:

### Link Enrollment to Login Flow

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

### Configure Email Verification (Recommended for Production)

Email verification ensures users provide valid email addresses and helps prevent spam.

**See the complete guide:** [email-verification.md](./email-verification.md)

**Quick setup:**

1. Configure email backend ([email-configuration.md](./email-configuration.md))
2. Create Email Stage with "Activate pending user" checked
3. Add Email Stage to enrollment flow (between prompt and user-write)
4. Set User Write stage to "Create users as inactive"
5. Test registration - users receive verification email

### Configure Password Policy (Optional)

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

### Error: "Aborting write to empty username"

**Cause:** Username field not included in prompt stage.

**Solution:** Follow [Step 3: Add Username Field](#step-3-add-username-field-critical) carefully.

### Error: "No user found and can't create new user"

**Cause:** User Write stage not configured to create users.

**Solution:**
1. Check User Write stage settings (Step 4)
2. Ensure "Can create users" is enabled
3. Or create new User Write stage specifically for enrollment

### New Users Can't Access Portfolio Manager

**Cause:** Users not assigned to required groups.

**Solution:**
1. Follow [Step 5: Auto-Assign Users to Groups](#step-5-auto-assign-users-to-groups)
2. Or manually add users to groups: Directory → Users → [user] → Groups tab

### Registration Form Missing Username Field

**Cause:** Username prompt not added to enrollment prompt stage.

**Solution:**
1. Flows & Stages → Prompts → Create username prompt (field key: `username`)
2. Flows & Stages → Stages → enrollment-prompt → Add username field
3. Save and test again

### Enrollment URL shows 404

- **Check flow exists**: Navigate to Flows & Stages → Flows and verify `default-enrollment-flow` exists
- **Check designation**: Make sure the flow's designation is set to "Enrollment"
- **Check slug**: The URL uses the flow's slug, verify it's `default-enrollment-flow`

### Users can't see "Sign up" link on Authentik login page

**Issue:** The automatic "Sign up" link doesn't appear at the bottom of the Authentik login page.

**Root Cause:** The enrollment flow is not properly configured in the Brand settings, or the flow designation is incorrect.

**Solution - Verify Brand Configuration:**

1. **Check Brand Settings:**
   - Navigate to: **System** → **Brands**
   - Click on your brand (usually "authentik" or "default")
   - Scroll to **Flow settings** section
   - Verify **Enrollment flow** is set to: `default-enrollment-flow`
   - Click **Update** if you made changes

2. **Verify Flow Designation:**
   - Navigate to: **Flows & Stages** → **Flows**
   - Find `default-enrollment-flow`
   - Click on it to edit
   - Verify **Designation** is set to: `Enrollment`
   - Click **Update** if needed

3. **Test the Login Page:**
   - Logout if currently logged in
   - Visit: `http://localhost:9000/if/flow/default-authentication-flow/`
   - The "Sign up" link should now appear at the bottom

**Workaround - Use Homepage Sign Up Button:**

Even if the automatic link doesn't appear, users can still register via the **Sign Up** button on your Portfolio Manager homepage (`http://localhost:3000`). This button goes directly to the enrollment flow, bypassing the need for the Authentik login page link.

**Alternative - Direct URL:**

You can also share the enrollment URL directly: `http://localhost:9000/if/flow/default-enrollment-flow/`

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

## Complete Testing Checklist

Use this checklist to verify your enrollment setup:

### Basic Enrollment
- [ ] Can access enrollment URL: `http://localhost:9000/if/flow/default-enrollment-flow/`
- [ ] Registration form shows all required fields:
  - [ ] Username field (CRITICAL!)
  - [ ] Email field
  - [ ] Name field
  - [ ] Password field
  - [ ] Password confirmation field
- [ ] Can submit form with valid data
- [ ] No errors during submission

### User Creation
- [ ] User is created in Authentik (Directory → Users)
- [ ] User status is "Active" (green checkmark)
- [ ] User email matches what was entered
- [ ] User is automatically logged in after registration
- [ ] Can logout and login again with the created credentials

### Group Assignment
- [ ] New user is automatically added to `users` group
- [ ] Check: Directory → Users → [username] → Groups tab
- [ ] Group membership appears immediately (not requiring manual assignment)

### Application Access
- [ ] Can login to Portfolio Manager using the new account
- [ ] No "access denied" or "insufficient permissions" errors
- [ ] Can access protected features/pages

### Optional Features (if configured)
- [ ] Registration validates password strength (if policy configured)
- [ ] Email verification works (if configured)
- [ ] Receives verification email
- [ ] Can click verification link
- [ ] User activated after verification

**✅ If all checked, enrollment is fully configured and working!**

## Additional Resources

- [Authentik Flows Documentation](https://goauthentik.io/docs/flow/)
- [Authentik Stages Documentation](https://goauthentik.io/docs/flow/stages/)
- [Authentik Email Configuration](https://goauthentik.io/docs/installation/configuration#authentik_email)
- [Password Policies](https://goauthentik.io/docs/policies/password/)

## Next Steps

After setting up enrollment:

1. **[Configure Email Verification](./email-verification.md)**
   - Send verification emails to new users
   - Ensure valid email addresses
   - Prevent spam registrations

2. **[Setup Email Configuration](./email-configuration.md)**
   - Configure SMTP, Amazon SES, or SendGrid
   - Required for email verification and password reset

3. **[Configure User Groups & Permissions](./user-groups-permissions.md)**
   - Organize users by role
   - Control access to features
   - Already done if you followed Step 5!

4. **Configure password recovery flow**
   - Allow users to reset forgotten passwords
   - Uses similar email stage setup

5. **Optional enhancements:**
   - Set up social login (Google, GitHub, etc.)
   - Enable 2FA for enhanced security
   - Customize branding and themes
   - Add custom fields to registration form
