# Authentik Email Configuration Guide

This comprehensive guide covers configuring email in Authentik for sending verification emails, password reset emails, and notifications using SMTP, Amazon SES, or SendGrid.

## Table of Contents

- [Why Configure Email?](#why-configure-email)
- [Prerequisites](#prerequisites)
- [Option 1: SMTP (Gmail, Outlook, etc.)](#option-1-smtp-gmail-outlook-etc)
- [Option 2: Amazon SES](#option-2-amazon-ses)
- [Option 3: SendGrid](#option-3-sendgrid)
- [Step 4: Test Email Configuration](#step-4-test-email-configuration)
- [Troubleshooting](#troubleshooting)
- [Email Templates](#email-templates)
- [Production Best Practices](#production-best-practices)

## Why Configure Email?

Authentik needs email configured to send:

- **Email verification** links for new user registrations
- **Password reset** links when users forget passwords
- **Security notifications** (new device, password change, etc.)
- **Admin notifications** (new user signups, failed logins, etc.)

Without email configured, these features won't work.

## Prerequisites

- Authentik is running and accessible
- You have admin access to Authentik
- You have credentials for one of the following:
  - SMTP server (Gmail, Outlook, company mail server)
  - Amazon SES account with verified domain
  - SendGrid account with API key

## Option 1: SMTP (Gmail, Outlook, etc.)

SMTP is the simplest option for development and small deployments.

### 1.1 Choose Your SMTP Provider

**Gmail:**
- Good for: Development, small deployments
- Sending limit: 500 emails/day (free account), 2000/day (Workspace)
- Requires: App-specific password (not your regular Gmail password)

**Outlook/Office 365:**
- Good for: Development, business deployments
- Sending limit: 300 emails/day (Outlook.com), 10,000/day (Microsoft 365)
- Requires: App password or account password

**Company Mail Server:**
- Good for: Enterprise deployments
- Sending limit: Depends on your server
- Requires: SMTP credentials from IT department

**Other SMTP providers:**
- Mailgun, Postmark, SMTP2GO, etc.

### 1.2 Get SMTP Credentials

#### Gmail Setup

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (enter "Authentik")
   - Click **Generate**
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

3. **Note your settings:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: (app password from step 2)
   TLS: Enabled
   ```

#### Outlook/Hotmail Setup

1. **Enable SMTP** (usually enabled by default)

2. **Note your settings:**
   ```
   Host: smtp-mail.outlook.com
   Port: 587
   Username: your-email@outlook.com
   Password: (your Outlook password or app password)
   TLS: Enabled
   ```

#### Office 365 Setup

1. **Get SMTP settings from IT** or use:
   ```
   Host: smtp.office365.com
   Port: 587
   Username: your-email@company.com
   Password: (your Office 365 password or app password)
   TLS: Enabled
   ```

### 1.3 Configure SMTP in Authentik

1. **Login to Authentik** admin: `http://localhost:9000/`

2. Navigate to **System** → **Settings**

3. Scroll down to the **Email** section

4. Fill in the following settings:

   | Field | Value (Example: Gmail) | Notes |
   |-------|------------------------|-------|
   | **From address** | `noreply@yourdomain.com` | Email sender address |
   | **Host** | `smtp.gmail.com` | SMTP server hostname |
   | **Port** | `587` | Use 587 for TLS, 465 for SSL |
   | **Username** | `your-email@gmail.com` | SMTP username (usually email) |
   | **Password** | `abcd efgh ijkl mnop` | SMTP password or app password |
   | **Use TLS** | ✅ Checked | Enable for port 587 |
   | **Use SSL** | ❌ Unchecked | Use for port 465 instead of TLS |
   | **Timeout** | `10` | Seconds to wait for connection |

5. **Click "Test"** button to send a test email

6. **Check your inbox** for the test email

7. If successful, click **Update** to save

**✅ SMTP configured!**

### 1.4 Common SMTP Settings

| Provider | Host | Port | TLS/SSL |
|----------|------|------|---------|
| Gmail | smtp.gmail.com | 587 | TLS |
| Outlook | smtp-mail.outlook.com | 587 | TLS |
| Office 365 | smtp.office365.com | 587 | TLS |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS |
| iCloud | smtp.mail.me.com | 587 | TLS |
| Mailgun | smtp.mailgun.org | 587 | TLS |
| SendGrid (SMTP) | smtp.sendgrid.net | 587 | TLS |

## Option 2: Amazon SES

Amazon SES (Simple Email Service) is excellent for production with high email volume.

### 2.1 Why Amazon SES?

**Pros:**
- Very cheap: $0.10 per 1,000 emails
- High deliverability
- Scalable (up to 50,000 emails/day initially)
- Integrated with AWS ecosystem
- Good reputation management

**Cons:**
- Requires AWS account
- Starts in "sandbox mode" (limited sending)
- Requires domain verification
- More complex setup than basic SMTP

### 2.2 Create AWS Account

1. Go to https://aws.amazon.com/
2. Click **Create an AWS Account**
3. Follow the signup process (requires credit card)
4. Sign in to AWS Console

### 2.3 Set Up Amazon SES

#### Step 1: Verify Your Email Address

1. **Open SES Console:**
   - Go to https://console.aws.amazon.com/ses/
   - Select your region (e.g., `us-east-1`)

2. **Verify an email address:**
   - In left sidebar, click **Verified identities**
   - Click **Create identity**
   - Select **Email address**
   - Enter your email: `your-email@example.com`
   - Click **Create identity**

3. **Check your email inbox**
   - You'll receive a verification email from Amazon SES
   - Click the verification link
   - Go back to SES console - status should be "Verified"

**Note:** In sandbox mode, you can only send TO verified email addresses. You'll need to request production access to send to any email.

#### Step 2: Verify Your Domain (Recommended)

For production, verify your domain instead of individual emails:

1. **In SES Console:**
   - Click **Verified identities** → **Create identity**
   - Select **Domain**
   - Enter your domain: `yourdomain.com`
   - Enable **Use a custom MAIL FROM domain** (optional)
   - Click **Create identity**

2. **Add DNS records:**
   - SES will show DNS records to add
   - Add these records to your domain DNS (Route53, Cloudflare, etc.)
   - **DKIM records** (3 CNAME records)
   - **MX record** (if using custom MAIL FROM)
   - **SPF record** (TXT record)

3. **Wait for verification**
   - Can take up to 72 hours
   - Usually completes within 30 minutes

#### Step 3: Request Production Access

To send emails to any address (not just verified ones):

1. **In SES Console:**
   - Click **Account dashboard** in left sidebar
   - Look for "Sending status" - should say "Sandbox"
   - Click **Request production access** button

2. **Fill out the request form:**
   - **Mail type**: Transactional
   - **Website URL**: `https://yourdomain.com`
   - **Use case description**:
     ```
     We use Amazon SES to send transactional emails for our Portfolio Manager application:
     - Email verification links for new user registrations
     - Password reset emails
     - Security notifications (login from new device, password changes)

     We do not send marketing emails or newsletters.
     Average volume: 100-500 emails per day
     All recipients have explicitly signed up for our service.
     ```
   - **Process for bounces/complaints**:
     ```
     We monitor bounce and complaint rates in SES console.
     Users can unsubscribe from notifications in account settings.
     We automatically process bounce notifications to remove invalid addresses.
     ```
   - **Compliance**: Confirm you comply with AWS policies

3. **Submit and wait**
   - Usually approved within 24 hours
   - Check your email for approval notification

#### Step 4: Create SMTP Credentials

1. **In SES Console:**
   - Click **SMTP settings** in left sidebar
   - Note the **SMTP endpoint** (e.g., `email-smtp.us-east-1.amazonaws.com`)
   - Click **Create SMTP credentials** button

2. **Create IAM user:**
   - Enter username: `authentik-ses-smtp`
   - Click **Create user**

3. **Download credentials:**
   - **IMPORTANT:** Click **Download credentials** or copy them now
   - You'll see:
     - SMTP Username (e.g., `AKIAIOSFODNN7EXAMPLE`)
     - SMTP Password (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   - **Save these securely** - you cannot retrieve them later!

### 2.4 Configure SES in Authentik

1. **Login to Authentik** admin: `http://localhost:9000/`

2. Navigate to **System** → **Settings**

3. Scroll to **Email** section

4. Fill in Amazon SES SMTP settings:

   | Field | Value | Example |
   |-------|-------|---------|
   | **From address** | `noreply@yourdomain.com` | Must be verified in SES |
   | **Host** | `email-smtp.{region}.amazonaws.com` | `email-smtp.us-east-1.amazonaws.com` |
   | **Port** | `587` | Use TLS |
   | **Username** | (SMTP Username from Step 4) | `AKIAIOSFODNN7EXAMPLE` |
   | **Password** | (SMTP Password from Step 4) | `wJalrX...` |
   | **Use TLS** | ✅ Checked | Required |
   | **Use SSL** | ❌ Unchecked | Use TLS instead |

5. Click **Test** to send test email

6. If successful, click **Update**

**✅ Amazon SES configured!**

### 2.5 Monitor SES Usage

1. **View sending statistics:**
   - SES Console → **Account dashboard**
   - See sent, bounced, and complaint metrics

2. **Set up CloudWatch alarms** (optional):
   - Monitor bounce rate
   - Monitor complaint rate
   - Alert if rates exceed thresholds

3. **Review reputation metrics:**
   - Keep bounce rate < 5%
   - Keep complaint rate < 0.1%

## Option 3: SendGrid

SendGrid is a popular email API service with generous free tier.

### 3.1 Why SendGrid?

**Pros:**
- Free tier: 100 emails/day forever
- Easy setup (no AWS complexity)
- Great deliverability
- Nice dashboard and analytics
- Generous paid tiers if you grow

**Cons:**
- Free tier limited to 100 emails/day
- Requires account verification
- Need to verify sender domain for production

### 3.2 Create SendGrid Account

1. **Sign up:**
   - Go to https://signup.sendgrid.com/
   - Enter email, password
   - Complete captcha
   - Click **Create Account**

2. **Verify email:**
   - Check your inbox for verification email
   - Click verification link

3. **Complete onboarding:**
   - Answer questions about your use case
   - Select "SMTP Relay" or "Web API"
   - Skip integration tutorials for now

### 3.3 Create API Key

1. **Navigate to API Keys:**
   - Click **Settings** → **API Keys** in left sidebar
   - Click **Create API Key** button

2. **Configure API key:**
   - **Name**: `authentik-smtp`
   - **Permissions**: Select **Restricted Access**
   - Enable **Mail Send** → **Full Access**
   - All other permissions: No Access
   - Click **Create & View**

3. **Copy API Key:**
   - You'll see the API key (starts with `SG.`)
   - **Copy it immediately** - you cannot view it again!
   - Example: `SG.abc123xyz789...`

**⚠️ Save this API key securely!**

### 3.4 Verify Sender Identity

SendGrid requires sender verification.

#### Option A: Single Sender Verification (Quick)

For development/testing:

1. **Navigate to Sender Authentication:**
   - Settings → **Sender Authentication**
   - Click **Verify a Single Sender**

2. **Fill in sender details:**
   - **From Name**: `Portfolio Manager`
   - **From Email**: `noreply@yourdomain.com` (or your email)
   - **Reply To**: `support@yourdomain.com`
   - **Company Name**: `Your Company`
   - **Address, City, State, etc.**: Your information

3. **Click Create**

4. **Verify email:**
   - Check inbox for verification email
   - Click verification link
   - Return to SendGrid - should show "Verified"

#### Option B: Domain Authentication (Recommended for Production)

For production deployments:

1. **Navigate to Sender Authentication:**
   - Settings → **Sender Authentication**
   - Click **Authenticate Your Domain**

2. **Select DNS host:**
   - Choose your DNS provider (Route53, Cloudflare, etc.)
   - Or select "Other" if not listed

3. **Enter domain:**
   - Domain: `yourdomain.com`
   - Choose "No" for branded links (or "Yes" if you want them)
   - Click **Next**

4. **Add DNS records:**
   - SendGrid shows DNS records to add
   - Add these CNAME records to your domain:
     ```
     em1234.yourdomain.com → u1234.wl.sendgrid.net
     s1._domainkey.yourdomain.com → s1.domainkey.u1234.wl.sendgrid.net
     s2._domainkey.yourdomain.com → s2.domainkey.u1234.wl.sendgrid.net
     ```

5. **Verify DNS:**
   - After adding records, click **Verify**
   - May take up to 48 hours, usually 10-30 minutes

### 3.5 Configure SendGrid in Authentik

SendGrid can be used via SMTP or API. We'll use SMTP for simplicity.

1. **Login to Authentik** admin: `http://localhost:9000/`

2. Navigate to **System** → **Settings**

3. Scroll to **Email** section

4. Fill in SendGrid SMTP settings:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **From address** | `noreply@yourdomain.com` | Must match verified sender |
   | **Host** | `smtp.sendgrid.net` | SendGrid SMTP server |
   | **Port** | `587` | Use TLS |
   | **Username** | `apikey` | Literally the word "apikey" |
   | **Password** | `SG.abc123xyz789...` | Your API key from Step 3.3 |
   | **Use TLS** | ✅ Checked | Required |
   | **Use SSL** | ❌ Unchecked | Use TLS instead |

**Important:** The username is literally `apikey` (not your actual API key).

5. Click **Test** to send test email

6. If successful, click **Update**

**✅ SendGrid configured!**

### 3.6 Monitor SendGrid Usage

1. **View activity:**
   - SendGrid Dashboard → **Activity**
   - See delivered, bounced, blocked emails

2. **Check statistics:**
   - Dashboard → **Stats**
   - See delivery rates, opens, clicks

3. **Monitor free tier usage:**
   - Free tier: 100 emails/day
   - Paid tier starts at $19.95/month for 50,000 emails

## Step 4: Test Email Configuration

Regardless of which option you chose, test your email configuration.

### 4.1 Test via Authentik UI

1. In Authentik admin, go to **System** → **Settings**
2. Scroll to **Email** section
3. Click **Test** button
4. Check the inbox of the email address configured in Authentik
5. You should receive a test email

**If successful:** You'll see "Test email sent successfully"

### 4.2 Test via User Registration

Test the full enrollment flow:

1. **Logout** from Authentik (or use incognito mode)

2. **Start enrollment:**
   - Go to `http://localhost:9000/if/flow/default-enrollment-flow/`
   - Or go to `http://localhost:3000` and click "Register"

3. **Fill in registration form**

4. **Check email** for verification email (if email verification is configured)

5. **Click verification link** in email

6. **Complete registration**

**If you receive the email, configuration is working!**

### 4.3 Test Password Reset

Test password reset emails:

1. **Logout** from Authentik

2. **Go to login page:** `http://localhost:9000/`

3. **Click "Forgot password?"** or similar link

4. **Enter email address**

5. **Check email** for password reset link

6. **Click link** and reset password

**If you receive the email, configuration is working!**

## Troubleshooting

### Test Email Not Received

**Check spam folder:**
- Email might be flagged as spam
- Add sender to safe senders list

**Check Authentik logs:**
```bash
podman compose logs portfolio-authentik-server | grep -i email
```

**Verify configuration:**
- Double-check host, port, username, password
- Ensure TLS/SSL settings match provider requirements

### Error: "Connection refused" or "Timeout"

**Cause:** Cannot connect to SMTP server.

**Solutions:**

1. **Check firewall:**
   - Ensure outbound connections on port 587 are allowed
   - Some hosting providers block SMTP ports

2. **Try different port:**
   - Port 587 (TLS) - most common
   - Port 465 (SSL) - alternative
   - Port 25 (unencrypted) - often blocked

3. **Verify host is correct:**
   - Check for typos
   - Ping the host: `ping smtp.gmail.com`

### Error: "Authentication failed" (Gmail)

**Cause:** Using regular password instead of app password.

**Solution:**

1. Enable 2-Step Verification
2. Create App Password (see [Gmail Setup](#gmail-setup))
3. Use app password, not regular password

### Error: "Must issue a STARTTLS command first"

**Cause:** TLS not enabled or using wrong port.

**Solution:**

1. Enable **Use TLS** checkbox
2. Use port 587 (not 465 or 25)
3. Ensure **Use SSL** is unchecked

### Amazon SES: Still in Sandbox

**Cause:** SES account in sandbox mode (can only send to verified addresses).

**Solution:**

1. Request production access (see [Step 3](#step-3-request-production-access))
2. Or verify recipient email addresses:
   - SES Console → Verified identities
   - Create identity → Email address
   - Verify each test email

### SendGrid: "Sender identity not verified"

**Cause:** Sender email not verified.

**Solution:**

1. Settings → Sender Authentication
2. Verify Single Sender or Domain
3. Check email for verification link
4. Ensure **From address** in Authentik matches verified sender

### Emails Going to Spam

**Cause:** Poor sender reputation or missing authentication records.

**Solutions:**

1. **Set up SPF record:**
   ```
   TXT record: v=spf1 include:_spf.sendgrid.net ~all
   ```
   Or for SES:
   ```
   TXT record: v=spf1 include:amazonses.com ~all
   ```

2. **Set up DKIM:**
   - Already done if you verified domain in SES/SendGrid
   - Check DNS records are propagated

3. **Set up DMARC:**
   ```
   TXT record (_dmarc.yourdomain.com): v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

4. **Use verified domain:**
   - Don't use `@gmail.com` as from address
   - Use your own domain you control

5. **Warm up sending:**
   - Start with low volume
   - Gradually increase over days/weeks

## Email Templates

Authentik uses templates for email content. You can customize them.

### Default Templates Location

Authentik includes these built-in templates:
- `email/account_confirmation.html` - Email verification
- `email/password_reset.html` - Password reset
- `email/event_notification.html` - Event notifications

### Customize Email Templates

1. **Create custom templates** in Docker volume:
   ```bash
   podman volume inspect portfolio-manager_authentik_templates
   ```

2. **Mount custom templates:**
   - Edit `docker-compose.yml`
   - Add volume mount:
     ```yaml
     volumes:
       - ./custom-templates:/templates:ro
     ```

3. **Restart Authentik:**
   ```bash
   podman compose restart portfolio-authentik-server
   ```

### Template Variables

Templates can use these variables:
- `{{ username }}` - User's username
- `{{ url }}` - Verification/reset URL
- `{{ expires }}` - Link expiration time
- `{{ user.email }}` - User's email
- `{{ user.name }}` - User's full name

**Example custom template:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify your email</title>
</head>
<body>
    <h1>Welcome to Portfolio Manager, {{ username }}!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="{{ url }}">Verify Email</a></p>
    <p>This link expires in {{ expires }}.</p>
    <p>If you didn't create an account, please ignore this email.</p>
</body>
</html>
```

## Production Best Practices

### Use a Dedicated Email Service

**Don't use:**
- Personal Gmail account
- Shared company email

**Do use:**
- Amazon SES
- SendGrid
- Mailgun
- Postmark
- Other professional email service

### Verify Your Domain

- Set up SPF, DKIM, DMARC records
- Improves deliverability
- Reduces spam classification

### Monitor Email Metrics

Track:
- **Delivery rate** (should be > 95%)
- **Bounce rate** (should be < 5%)
- **Complaint rate** (should be < 0.1%)

### Handle Bounces

- Monitor bounce notifications
- Remove hard-bounced addresses
- Retry soft bounces with backoff

### Secure Credentials

- Store SMTP credentials in environment variables
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials periodically
- Never commit credentials to git

### Rate Limiting

- Respect provider limits (Gmail: 500/day, etc.)
- Implement rate limiting in application
- Use queue for bulk emails

### Compliance

- Include unsubscribe links (for non-transactional emails)
- Honor unsubscribe requests
- Comply with CAN-SPAM, GDPR

## Next Steps

After configuring email:

1. **[Setup Email Verification](./email-verification.md)** - Add email verification to enrollment flow
2. **[Configure Password Reset](./enrollment-setup.md)** - Enable password recovery
3. **[Setup User Groups](./user-groups-permissions.md)** - Organize users with groups
4. **Test all email flows** - Registration, password reset, notifications
5. **Monitor email deliverability** - Check bounce and complaint rates

## Additional Resources

- [Authentik Email Settings](https://goauthentik.io/docs/installation/configuration#authentik_email)
- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Email Deliverability Guide](https://www.validity.com/resource-center/email-deliverability-guide/)
- [SPF, DKIM, DMARC Guide](https://www.dmarcanalyzer.com/dmarc/dmarc-guide/)
