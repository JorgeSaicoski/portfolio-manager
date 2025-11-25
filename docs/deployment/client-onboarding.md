# Client Onboarding Workflow

Complete guide for deploying and configuring the system for a new client organization.

## Table of Contents

- [Overview](#overview)
- [Pre-Onboarding Checklist](#pre-onboarding-checklist)
- [Step 1: Infrastructure Setup](#step-1-infrastructure-setup)
- [Step 2: Database Configuration](#step-2-database-configuration)
- [Step 3: Authentik Configuration](#step-3-authentik-configuration)
- [Step 4: Create Admin Account](#step-4-create-admin-account)
- [Step 5: Configure Services](#step-5-configure-services)
- [Step 6: Testing](#step-6-testing)
- [Step 7: Handoff to Client](#step-7-handoff-to-client)

---

## Overview

This workflow guides you through deploying the loyalty points system for a new client.

**Example Client:** NextDoorMarket
**Deployment Type:** Multi-tenant (shared infrastructure) OR Single-tenant (isolated)

**Timeline:** 2-4 hours for first deployment, 1-2 hours for subsequent clients

---

## Pre-Onboarding Checklist

Before starting, gather this information:

### Client Information

```yaml
Organization:
  name: "NextDoorMarket"
  slug: "nextdoor"  # Lowercase, no spaces, used in group names
  country: "US"
  timezone: "America/New_York"

Admin Contact:
  name: "Jane Smith"
  email: "jane.smith@nextdoormarket.com"
  phone: "+1 555-123-4567"
  language: "en-US"

Business Details:
  plan: "basic" | "premium"
  deployment_type: "multi-tenant" | "single-tenant"
  contract_start: "2025-01-01"
  users_estimate: 100  # Number of expected users

Technical:
  custom_domain: "app.nextdoormarket.com" # Optional
  smtp_provider: "sendgrid" | "ses" | "smtp"
  backup_schedule: "daily" | "weekly"
```

### Server Requirements

**Multi-Tenant (Shared):**
- No additional servers needed
- Uses existing Portfolio Manager infrastructure

**Single-Tenant (Isolated):**
- 1 VPS: 2 CPU, 4GB RAM minimum
- 50GB storage
- Ubuntu 24.04 LTS

---

## Step 1: Infrastructure Setup

### Multi-Tenant Deployment

**1.1. No additional infrastructure needed**

Loyalty service connects to existing:
- PostgreSQL (portfolio-postgres)
- Authentik (portfolio-authentik-server)
- Monitoring (Grafana/Prometheus)

**1.2. Add loyalty service to docker-compose.yml:**

```yaml
services:
  loyalty-service:
    build: ./services/loyalty
    container_name: portfolio-loyalty
    environment:
      - DATABASE_HOST=portfolio-postgres
      - DATABASE_NAME=loyalty_db
      - AUTHENTIK_URL=http://portfolio-authentik-server:9000
    networks:
      - portfolio-network
    depends_on:
      - portfolio-postgres
      - portfolio-authentik-server
    ports:
      - "8080:8080"
```

**1.3. Start services:**

```bash
podman compose up -d loyalty-service
```

### Single-Tenant Deployment

**For premium clients who want isolated infrastructure:**

See: [Single-Tenant Deployment Guide](./single-tenant-deployment.md)

---

## Step 2: Database Configuration

### 2.1. Create Organization Database Schema

```bash
# Connect to PostgreSQL
podman exec -it portfolio-postgres psql -U postgres -d loyalty_db
```

```sql
-- Create organization record
INSERT INTO organizations (
    id,
    name,
    slug,
    authentik_group_prefix,
    status,
    plan,
    created_at
) VALUES (
    gen_random_uuid(),
    'NextDoorMarket',
    'nextdoor',
    'nextdoor',
    'active',
    'basic',
    NOW()
);

-- Get organization ID for reference
SELECT id, name, slug FROM organizations WHERE slug = 'nextdoor';
```

### 2.2. Create Database User (Optional)

For stricter isolation, create organization-specific database user:

```sql
-- Create user
CREATE USER nextdoor_db_user WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT CONNECT ON DATABASE loyalty_db TO nextdoor_db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nextdoor_db_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO nextdoor_db_user;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nextdoor_db_user;
```

---

## Step 3: Authentik Configuration

### 3.1. Create Organization Groups

**Option A: Via Authentik UI**

1. Login to Authentik: `http://localhost:9000/`
2. Navigate: **Directory** → **Groups**
3. Create these groups:
   - `nextdoor-admins` (Label: "NextDoor Administrators")
   - `nextdoor-cashiers` (Label: "NextDoor Cashiers")
   - `nextdoor-customers` (Label: "NextDoor Customers")

**Option B: Via API (Recommended)**

```bash
# Run onboarding script
go run scripts/onboard-client.go \
    --name "NextDoor Market" \
    --slug "nextdoor" \
    --admin-email "jane.smith@nextdoor.com" \
    --admin-name "Jane Smith"
```

This will:
- Create the three groups
- Create admin user
- Assign admin to `nextdoor-admins` group
- Output credentials

### 3.2. Configure OAuth Application (if not shared)

If client has dedicated OAuth app:

1. **Applications** → **Providers** → **Create**
2. Select: **OAuth2/OpenID Provider**
3. Configure:
   - Name: `NextDoor Loyalty Provider`
   - Client ID: `nextdoor-loyalty`
   - Redirect URIs: `https://loyalty.nextdoor.com/auth/callback`
4. **Applications** → **Applications** → **Create**
5. Link to provider

---

## Step 4: Create Admin Account

### 4.1. Using API (Recommended)

See: [Authentik API Integration](../authentication/user-management/authentik-api-integration.md)

```go
// Example using our onboarding tool
err := onboardNewClient(
    "NextDoor Market",  // Organization name
    "nextdoor",                 // Organization slug
    "jane.smith@nextdoor.com", // Admin email
    "Jane Smith",           // Admin name
)
```

### 4.2. Manual Creation (Alternative)

1. Login to Authentik admin
2. **Directory** → **Users** → **Create**
3. Fill in:
   - Username: `nextdoor_admin`
   - Name: `Jane Smith`
   - Email: `jane.smith@nextdoor.com`
   - Password: Generate secure password
   - Is active: ✓
4. Click **Create**
5. Go to **Groups** tab
6. Add to `nextdoor-admins` group

### 4.3. Record Credentials Securely

```yaml
# Store in password manager or secure vault
Organization: NextDoor Market
Username: nextdoor_admin
Email: jane.smith@nextdoor.com
Password: [GENERATED_PASSWORD]
Login URL: http://localhost:9000/
Admin Panel: http://localhost:8080/admin
```

---

## Step 5: Configure Services

### 5.1. Update Environment Variables

Add to `.env`:

```bash
# NextDoor Market Configuration
EXP_ORGANIZATION_ID=<from_step_2>
EXP_ADMIN_EMAIL=jane.smith@nextdoor.com
EXP_SMTP_FROM=noreply@nextdoor.com

# Optional: Client-specific database user
EXP=nextdoor_db_user
EXP_DB_PASSWORD=secure_password_here
```

### 5.2. Configure SMTP (for notifications)

**Using SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid_api_key>
SMTP_FROM=noreply@nextdoor.com
```

**Using AWS SES:**
```bash
SMTP_HOST=email-smtp.sa-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<ses_smtp_user>
SMTP_PASSWORD=<ses_smtp_password>
SMTP_FROM=noreply@nextdoor.com
```

### 5.3. Restart Services

```bash
podman compose restart loyalty-service
```

---

## Step 6: Testing

### 6.1. Test Admin Login

1. Open: `http://localhost:9000/`
2. Login with admin credentials
3. Verify you're redirected to loyalty system
4. Check admin dashboard loads

### 6.2. Test User Creation

**Via Admin Panel:**

1. Login as `nextdoor_admin`
2. Navigate to "Users" → "Create Cashier"
3. Fill in test cashier:
   - Username: `cashier_test`
   - Name: `Test Cashier`
   - Email: `test.cashier@nextdoor.com`
4. Verify user created in Authentik
5. Verify user in `nextdoor-cashiers` group

### 6.3. Test Customer Registration (Optional)

If self-registration is enabled:

1. Open enrollment flow: `http://localhost:9000/if/flow/portfolio-enrollment/`
2. Register test customer
3. Verify user in `nextdoor-customers` group
4. Verify user can login to loyalty system

### 6.4. Test Points System

1. Login as test cashier
2. Create test purchase
3. Award points to test customer
4. Login as test customer
5. Verify points appear in balance

### 6.5. Test Monitoring

1. Open Grafana: `http://localhost:3001/`
2. Navigate to "Loyalty System" dashboard
3. Verify metrics appear:
   - Active users
   - Points awarded
   - API response times

---

## Step 7: Handoff to Client

### 7.1. Prepare Client Documentation

**Create client-specific document: `nextdoor-system-guide.pdf`**

Include:
- Login URL and credentials
- Admin panel guide
- How to create cashiers
- How to manage customers
- Support contact information
- FAQ

### 7.2. Credentials Delivery

**Secure delivery methods:**

1. **Password-protected PDF** sent via email
2. **1Password/LastPass** shared vault
3. **Encrypted message** via Signal/WhatsApp
4. **Video call** + client changes password immediately

**Never send:**
- Plain text passwords via email
- Screenshots of passwords
- Passwords in Slack/Discord

### 7.3. Client Walkthrough (30-60 minutes)

Schedule video call to:

1. Demo admin panel (15 min)
2. Create first real cashier together (10 min)
3. Test customer registration (10 min)
4. Show reporting features (10 min)
5. Q&A (15 min)

### 7.4. Post-Handoff Checklist

- [ ] Client changed admin password
- [ ] Client created first real cashier account
- [ ] Test purchase completed successfully
- [ ] Client knows how to contact support
- [ ] Client has documentation
- [ ] Monitoring alerts configured
- [ ] Backup schedule confirmed
- [ ] Contract/invoice sent

---

## Deployment Variations

### Option A: Multi-Tenant (Most Common)

**Characteristics:**
- Shared infrastructure
- Lower cost
- Single Authentik instance
- Organization isolation via groups
- Shared database with tenant filtering

**Best for:**
- Small-medium businesses
- Standard plan clients
- Quick deployment

### Option B: Single-Tenant (Premium)

**Characteristics:**
- Dedicated infrastructure
- Higher cost
- Isolated Authentik instance
- Dedicated database
- Custom domain

**Best for:**
- Large enterprises
- Clients requiring data isolation
- Compliance requirements (LGPD, GDPR)

See: [Single-Tenant Deployment](./single-tenant-deployment.md)

---

## Troubleshooting

### Admin can't login

**Check:**
- User exists in Authentik
- User is in `{slug}-admins` group
- User is active
- Password is correct
- OAuth application is configured

### Users not appearing in system

**Check:**
- Organization ID is correct in database
- Authentik group names match `{slug}-*` pattern
- User created with correct group assignment
- Backend is reading Authentik groups correctly

### Points not being awarded

**Check:**
- Cashier has correct permissions
- Database connection is working
- Organization is active
- Customer exists in system

---

## Database Backup During Onboarding

### Create Backup Before Client Onboarding

**Always create a backup before onboarding a new client** to ensure you can rollback if something goes wrong.

```bash
# Create backup
make db-backup
```

This creates compressed backups of both `portfolio_db` and `authentik` databases with timestamp.

**Output example:**
```
[INFO] Starting database backup...
[SUCCESS] Portfolio database dumped successfully
[SUCCESS] Authentik database dumped successfully
[SUCCESS] Backups compressed:
  - portfolio_db_20250123_140530.dump.gz (2.3M)
  - authentik_20250123_140530.dump.gz (1.8M)

Backup location: /home/bardockgaucho/GolandProjects/portfolio-manager/backups
Timestamp: 20250123_140530
```

### Verify Backup Was Created

```bash
make db-list-backups
```

### Rollback if Needed

If something goes wrong during onboarding, restore from backup:

```bash
# Restore from latest backup
make db-restore BACKUP=latest

# Or restore from specific timestamp
make db-restore BACKUP=20250123_140530
```

**Warning:** This will overwrite current database with backup data. All changes since backup will be lost.

### Post-Onboarding Backup

**After successfully onboarding a client**, create another backup:

```bash
make db-backup
```

This creates a known-good state with the new client configured.

### Backup Best Practices for Onboarding

1. **Before onboarding:** Create backup
2. **Test client access:** Verify login works
3. **After successful onboarding:** Create backup
4. **Keep onboarding backups:** For at least 30 days

**Example workflow:**

```bash
# Step 1: Backup before onboarding
make db-backup
# Note timestamp: 20250123_140530

# Step 2: Onboard client
./scripts/onboard-client.go --name "NextDoor Market" --slug "nextdoor" ...

# Step 3: Test client login
# Visit http://localhost:3000 and test login

# Step 4: If something went wrong, rollback
make db-restore BACKUP=20250123_140530

# Step 5: If successful, create post-onboarding backup
make db-backup
```

See **[Backup & Restore Guide](../operations/backup-restore.md)** for complete backup documentation.

---

## Related Documentation

- **[Admin User Creation](../authentication/admin-user-creation.md)** - Create org admins
- **[Multi-Tenancy Architecture](../development/multi-tenancy.md)** - How isolation works
- **[Authentik Groups](../authentication/user-groups-permissions.md)** - Group management

---

## Appendix: Onboarding Script

**File:** `scripts/onboard-client.go`

```go
// See admin-user-creation.md for complete implementation
func main() {
    // Parse command-line args
    name := flag.String("name", "", "Organization name")
    slug := flag.String("slug", "", "Organization slug")
    adminEmail := flag.String("admin-email", "", "Admin email")
    adminName := flag.String("admin-name", "", "Admin name")
    flag.Parse()
    
    // Validate inputs
    // Create organization in database
    // Create Authentik groups
    // Create admin user
    // Assign to group
    // Output credentials
}
```

**Usage:**
```bash
go run scripts/onboard-client.go \
    --name "NextDoor Market" \
    --slug "nextdoor" \
    --admin-email "admin@nextdoor.com" \
    --admin-name "Jane Smith"
```

