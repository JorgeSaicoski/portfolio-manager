# How to Audit Portfolio Manager

This guide shows you how to review audit logs, check for security issues, and ensure compliance with your policies.

**Time required**: 45 minutes
**Difficulty**: Beginner-friendly
**Frequency**: Weekly or after incidents

---

## 📋 What & Why

**What you'll accomplish:**
- Review audit logs for suspicious activity
- Find dangerous queries (like SELECT *)
- Detect unauthorized deletions
- Identify security issues
- Check user actions
- Generate compliance reports

**Why it matters:**
- **Security**: Catch unauthorized access attempts
- **Compliance**: Meet regulatory requirements
- **Troubleshooting**: Understand what happened
- **Performance**: Find inefficient queries
- **Accountability**: Track who did what

---

## ✅ Prerequisites

- [ ] SSH access to server
- [ ] Understanding of basic SQL
- [ ] Audit logging enabled (it is by default!)
- [ ] Access to server logs

**Verify audit logging is working:**
```bash
# SSH to server
ssh deploy@your-server-ip

# Check audit logs exist
ls -lh /opt/portfolio-manager/backend/logs/

# You should see files like:
# audit_create.log
# audit_read.log
# audit_update.log
# audit_delete.log
# app.log
```

---

## 📝 Audit Checklist

### Quick Daily Audit (5 minutes)

```bash
# SSH to server
ssh deploy@your-server-ip
cd /opt/portfolio-manager/backend/logs

# 1. Check for errors
tail -100 app.log | grep ERROR

# 2. Check recent deletions
tail -50 audit_delete.log

# 3. Check failed login attempts
docker compose logs portfolio-authentik-server | grep "failed"

# 4. Check for unusual activity
tail -100 app.log | grep -i "unauthorized\|forbidden\|suspicious"
```

### Weekly Security Audit (30 minutes)

Follow the complete guide below.

### Monthly Compliance Audit (2 hours)

Generate reports for:
- All user actions
- Data modifications
- Access patterns
- Security events

---

## 📝 Part 1: Review Audit Logs (20 minutes)

### Step 1.1: Access Server and Logs

```bash
# SSH to server
ssh deploy@your-server-ip

# Navigate to logs directory
cd /opt/portfolio-manager/backend/logs

# List all log files with sizes
ls -lh

# You'll see:
# audit_create.log    - All CREATE operations
# audit_read.log      - All READ operations
# audit_update.log    - All UPDATE operations
# audit_delete.log    - All DELETE operations
# app.log            - Application logs
```

### Step 1.2: Understand Log Format

```bash
# Look at a sample log entry
head -5 audit_create.log
```

**Log entry format:**
```json
{
  "level": "info",
  "operation": "CREATE_PORTFOLIO",
  "portfolioID": 123,
  "title": "My Portfolio",
  "userID": "user123",
  "time": "2025-01-25T10:30:45Z",
  "message": "Portfolio created successfully"
}
```

**Key fields:**
- `level`: info, warn, error
- `operation`: What happened
- `userID`: Who did it
- `time`: When it happened
- Additional context fields

---

## 🔍 Part 2: Check for Dangerous Queries (15 minutes)

### Step 2.1: Find SELECT * Queries

**Why this matters:** `SELECT *` queries fetch all columns, which is inefficient and can expose sensitive data.

```bash
# Search for SELECT * in logs
cd /opt/portfolio-manager/backend/logs

# Check application logs
grep -i "SELECT \*" app.log

# If you find any, note the:
# - Timestamp
# - Query context
# - Table name
```

**Example bad query:**
```
SELECT * FROM users WHERE email = 'user@example.com'
```

**Should be:**
```
SELECT id, email, username FROM users WHERE email = 'user@example.com'
```

### Step 2.2: Find Full Table Scans

```bash
# Look for queries without WHERE clause
grep -i "SELECT.*FROM.*;" app.log | grep -v "WHERE"

# These queries scan entire tables - very slow!
```

### Step 2.3: Check Database Query Logs

```bash
# Enable query logging in PostgreSQL (temporarily)
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db -c \
  "ALTER SYSTEM SET log_statement = 'all';"

docker compose restart portfolio-postgres

# Wait a few minutes, then check logs
docker compose logs portfolio-postgres | grep "SELECT"

# Disable after reviewing
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db -c \
  "ALTER SYSTEM SET log_statement = 'none';"

docker compose restart portfolio-postgres
```

### Step 2.4: Document Findings

**Create a findings document:**
```bash
# Create audit report
nano ~/audit_report_$(date +%Y%m%d).md
```

**Template:**
```markdown
# Audit Report - 2025-01-25

## Dangerous Queries Found

### 1. SELECT * in user authentication
- **File**: app.log line 1234
- **Time**: 2025-01-25 10:30:45
- **Query**: SELECT * FROM users WHERE email = '...'
- **Risk**: Exposes password hashes
- **Action**: Refactor to select specific columns

### 2. Full table scan on portfolios
- **File**: app.log line 5678
- **Time**: 2025-01-25 11:15:22
- **Query**: SELECT * FROM portfolios;
- **Risk**: Slow performance, potential DoS
- **Action**: Add WHERE clause or pagination
```

---

## 🗑️ Part 3: Check for Unauthorized Deletions (10 minutes)

### Step 3.1: Review All Deletions

```bash
cd /opt/portfolio-manager/backend/logs

# Show all deletions in the last 7 days
tail -500 audit_delete.log | less

# Or with pretty formatting
tail -500 audit_delete.log | jq '.'
```

### Step 3.2: Find Suspicious Deletions

**Red flags:**
- Deletions outside business hours
- Bulk deletions (many in short time)
- Deletions by unexpected users
- Important data deleted

```bash
# Find deletions by specific user
grep '"userID":"user123"' audit_delete.log

# Find bulk deletions (10+ in 1 hour)
# First, extract timestamps and count
awk '{print $1}' audit_delete.log | uniq -c | awk '$1 > 10'

# Find deletions of important entities
grep -i "DELETE_PORTFOLIO\|DELETE_PROJECT" audit_delete.log

# Find deletions outside business hours (example: 6PM - 6AM)
grep audit_delete.log | awk '{
  split($2, time, ":");
  hour = time[1];
  if (hour < 6 || hour > 18) print;
}'
```

### Step 3.3: Verify Cascade Deletes Work Correctly

**What to check:** When a portfolio is deleted, all related data should be deleted too.

```bash
# Find portfolio deletion
grep '"operation":"DELETE_PORTFOLIO"' audit_delete.log | tail -1

# Note the portfolioID (example: 123)

# Check database for orphaned records
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
-- Check for orphaned projects
SELECT COUNT(*) as orphaned_projects
FROM projects
WHERE portfolio_id = 123;  -- Should be 0

-- Check for orphaned categories
SELECT COUNT(*) as orphaned_categories
FROM categories
WHERE portfolio_id = 123;  -- Should be 0
EOF
```

**If counts are NOT 0:** There's a bug in cascade delete logic!

### Step 3.4: Check Soft vs Hard Deletes

```bash
# Portfolio Manager uses soft deletes (sets deleted_at timestamp)
# Verify data isn't fully removed

docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
-- Check soft-deleted portfolios
SELECT id, title, deleted_at
FROM portfolios
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 10;
EOF
```

---

## 👤 Part 4: Review User Actions (15 minutes)

### Step 4.1: Track Specific User Activity

```bash
cd /opt/portfolio-manager/backend/logs

# Find all actions by a specific user
USER_ID="user123"  # Replace with actual user ID

# Create comprehensive user report
grep "\"userID\":\"$USER_ID\"" audit_*.log | \
  jq -r '[.time, .operation, .message] | @tsv' | \
  column -t -s $'\t'

# Example output:
# 2025-01-25T10:00:00Z  CREATE_PORTFOLIO  Portfolio created
# 2025-01-25T10:05:00Z  UPDATE_PORTFOLIO  Portfolio updated
# 2025-01-25T10:10:00Z  CREATE_PROJECT    Project created
```

### Step 4.2: Find Users Who Modified Specific Data

```bash
# Who modified portfolio ID 123?
PORTFOLIO_ID=123

grep "\"portfolioID\":$PORTFOLIO_ID" audit_*.log | \
  jq '{time, operation, userID, message}'

# Who deleted project ID 456?
PROJECT_ID=456

grep "\"projectID\":$PROJECT_ID" audit_delete.log | jq '.'
```

### Step 4.3: Identify Unusual Access Patterns

```bash
# Find users with excessive read operations (potential scraping)
grep '"operation":"READ_' audit_read.log | \
  jq -r '.userID' | \
  sort | uniq -c | sort -nr | head -10

# Output shows count and user ID:
# 1000 user123    <- Suspicious! 1000 reads
#   50 user456
#   30 user789

# Check what user123 was reading
grep '"userID":"user123"' audit_read.log | \
  jq -r '[.time, .operation] | @tsv' | tail -20
```

### Step 4.4: Check Failed Operations

```bash
# Find all errors related to user actions
grep '"level":"error"' app.log | \
  jq 'select(.userID != null) | {time, userID, error, operation}'

# Common error patterns to investigate:
# - Repeated authorization failures (user trying to access others' data)
# - Validation errors (possible injection attempts)
# - Resource not found (fishing for data)
```

---

## 🔐 Part 5: Security Audit (20 minutes)

### Step 5.1: Check for Failed Authentication Attempts

```bash
# Check Authentik logs for failed logins
docker compose logs portfolio-authentik-server | \
  grep -i "failed\|unauthorized\|forbidden" | \
  tail -50

# Count failed attempts per IP
docker compose logs portfolio-authentik-server | \
  grep "failed" | \
  awk '{print $(NF-1)}' | \
  sort | uniq -c | sort -nr

# If one IP has many failures, possible brute force attack!
```

### Step 5.2: Check for SQL Injection Attempts

```bash
# Look for suspicious patterns in logs
cd /opt/portfolio-manager/backend/logs

# Common SQL injection patterns
grep -iE "'; DROP|UNION SELECT|OR 1=1|<script>" app.log

# Check for escaped SQL in request payloads
grep -i "\\'" app.log | grep -i "SELECT\|UPDATE\|DELETE"

# If found, these are attack attempts! Check if they were blocked.
```

### Step 5.3: Check for Path Traversal Attempts

```bash
# Look for directory traversal attempts
grep -i "\.\./\|\.\.\\\\|/etc/passwd|/etc/shadow" app.log

# Check file upload attempts with suspicious names
grep -i "file.*upload" app.log | grep -E "\.\./|\.\.\\\\|\.exe|\.sh"
```

### Step 5.4: Review Authorization Failures

```bash
# Find all "Access denied" or "Forbidden" events
grep -i "forbidden\|access denied\|unauthorized" audit_*.log | \
  jq '{time, userID, operation, resource}' | \
  head -20

# Questions to ask:
# - Is this user trying to access others' data?
# - Are there bugs in permission checks?
# - Is this a compromised account?
```

### Step 5.5: Check for Privilege Escalation

```bash
# Find users who gained admin access
grep -i "role.*admin\|permission.*grant" audit_*.log

# Check who can create/modify users
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
SELECT id, email, is_admin, created_at, updated_at
FROM users
WHERE is_admin = true
ORDER BY updated_at DESC;
EOF
```

---

## 📊 Part 6: Generate Reports (20 minutes)

### Step 6.1: Daily Activity Report

```bash
#!/bin/bash
# Save as: ~/audit_scripts/daily_report.sh

DATE=$(date +%Y-%m-%d)
cd /opt/portfolio-manager/backend/logs

echo "Daily Audit Report - $DATE"
echo "================================"
echo ""

echo "Total Operations:"
echo "  Creates: $(grep -c '"operation":"CREATE_' audit_create.log)"
echo "  Reads:   $(grep -c '"operation":"READ_' audit_read.log)"
echo "  Updates: $(grep -c '"operation":"UPDATE_' audit_update.log)"
echo "  Deletes: $(grep -c '"operation":"DELETE_' audit_delete.log)"
echo ""

echo "Top 5 Active Users:"
grep -h '"userID"' audit_*.log | \
  jq -r '.userID' | \
  sort | uniq -c | sort -nr | head -5
echo ""

echo "Recent Errors:"
tail -50 app.log | grep -i error | head -10
echo ""

echo "Recent Deletions:"
tail -10 audit_delete.log | jq -r '[.time, .operation, .userID] | @tsv'
```

**Run it:**
```bash
chmod +x ~/audit_scripts/daily_report.sh
~/audit_scripts/daily_report.sh
```

### Step 6.2: Security Events Report

```bash
#!/bin/bash
# Save as: ~/audit_scripts/security_report.sh

DATE=$(date +%Y-%m-%d)
cd /opt/portfolio-manager/backend/logs

echo "Security Audit Report - $DATE"
echo "=============================="
echo ""

echo "Failed Authentication Attempts:"
docker compose logs portfolio-authentik-server | \
  grep -c "failed"
echo ""

echo "Authorization Failures:"
grep -c "forbidden\|access denied" app.log
echo ""

echo "Suspicious Patterns:"
grep -ciE "'; DROP|UNION SELECT|OR 1=1|\.\./|/etc/passwd" app.log
echo ""

echo "Unusual Access (>100 reads/user):"
grep '"operation":"READ_' audit_read.log | \
  jq -r '.userID' | \
  sort | uniq -c | awk '$1 > 100 {print}'
```

### Step 6.3: Compliance Report (GDPR/SOC2)

```bash
# User data access report (GDPR Article 15)
USER_EMAIL="user@example.com"

# Find user ID
USER_ID=$(docker compose exec -T portfolio-postgres psql -U portfolio_user -d portfolio_db -t -c \
  "SELECT id FROM users WHERE email = '$USER_EMAIL';")

echo "Data Access Report for $USER_EMAIL"
echo "===================================="
echo ""

# All operations by this user
echo "User Actions:"
grep "\"userID\":\"$USER_ID\"" /opt/portfolio-manager/backend/logs/audit_*.log | \
  jq -r '[.time, .operation] | @tsv' | \
  tail -50
echo ""

# Who accessed this user's data
echo "Who Accessed This User's Data:"
grep -r "$USER_ID" /opt/portfolio-manager/backend/logs/audit_*.log | \
  jq -r 'select(.userID != "'"$USER_ID"'") | [.time, .userID, .operation] | @tsv'
```

### Step 6.4: Export Reports

```bash
# Generate all reports and save
cd ~
mkdir -p audit_reports/$(date +%Y-%m)

# Daily report
./audit_scripts/daily_report.sh > audit_reports/$(date +%Y-%m)/daily_$(date +%Y%m%d).txt

# Security report
./audit_scripts/security_report.sh > audit_reports/$(date +%Y-%m)/security_$(date +%Y%m%d).txt

# Compress and archive
tar -czf audit_reports/archive_$(date +%Y%m).tar.gz audit_reports/$(date +%Y-%m)/

# Download to local machine
# On your local computer:
# scp deploy@server-ip:~/audit_reports/archive_*.tar.gz ~/Downloads/
```

---

## ✔️ Verification Checklist

After completing audit:

- [ ] Reviewed all deletion logs
- [ ] No SELECT * queries found (or documented)
- [ ] No unauthorized deletions detected
- [ ] No suspicious user activity
- [ ] No failed authentication spikes
- [ ] No SQL injection attempts (or all blocked)
- [ ] No path traversal attempts
- [ ] Cascade deletes working correctly
- [ ] Reports generated and archived
- [ ] Action items created for findings

---

## 🔧 Troubleshooting

### Problem: No Audit Logs Found

**Solution:**
```bash
# Check if audit logging is enabled
docker compose logs backend | grep "audit logger"

# Restart backend to reinitialize logging
docker compose restart backend

# Check logs are being written
docker compose exec backend ls -la /app/logs/
```

### Problem: Logs Too Large to View

**Solution:**
```bash
# Use tail to see recent entries
tail -1000 audit_create.log | less

# Rotate logs
cd /opt/portfolio-manager/backend/logs
gzip audit_*.log.1  # Compress old logs
# Lumberjack automatically rotates at 10MB
```

### Problem: Can't Parse JSON Logs

**Solution:**
```bash
# Install jq if not available
sudo apt install jq

# Pretty print log
cat audit_create.log | jq '.'

# Filter specific fields
cat audit_create.log | jq '{time, userID, operation}'
```

---

## ➡️ Next Steps

**After your audit:**

1. **Address Findings**:
   - Create issues for problems found
   - Fix SELECT * queries
   - Investigate suspicious activity
   - Update security policies

2. **Automate Auditing**:
   - Schedule daily/weekly reports with cron
   - Set up alerts for suspicious patterns
   - Create dashboards in Grafana

3. **Improve Logging**:
   - Add more context to logs
   - Log additional security events
   - Implement log aggregation (ELK stack)

4. **Document Policies**:
   - Create audit procedures document
   - Define what's "suspicious"
   - Set retention policies

---

## 📚 Related Guides

- [How to Investigate Issues](./how-to-investigate.md) - Deep dive into debugging
- [How to Monitor](./how-to-monitor.md) - Proactive monitoring
- [How to Backup](./how-to-backup.md) - Protect audit logs
- [Security Documentation](../security/) - Security best practices

---

## 🎓 What You Learned

- ✅ How to read and interpret audit logs
- ✅ How to find dangerous SQL queries
- ✅ How to detect unauthorized deletions
- ✅ How to track user activity
- ✅ How to identify security threats
- ✅ How to generate compliance reports
- ✅ How to automate auditing tasks

**You can now confidently audit your application!** 🔍

---

**Last Updated**: 2025-01-25
**Difficulty**: Beginner
**Recommended Frequency**: Weekly
