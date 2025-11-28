# Database Backup & Restore Guide

Complete guide for backing up and restoring Portfolio Manager databases (portfolio_db and authentik).

## Table of Contents

- [Quick Start](#quick-start)
- [Manual Backup](#manual-backup)
- [Restore from Backup](#restore-from-backup)
- [List Available Backups](#list-available-backups)
- [Automated Backups](#automated-backups)
- [Disaster Recovery](#disaster-recovery)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Create a Backup

```bash
make db-backup
```

This creates compressed backups of both `portfolio_db` and `authentik` databases with automatic retention (30 days).

### Restore from Latest Backup

```bash
make db-restore BACKUP=latest
```

### List All Backups

```bash
make db-list-backups
```

---

## Manual Backup

### Creating a Backup

Run the backup command:

```bash
make db-backup
```

**What happens:**
1. Connects to running PostgreSQL container
2. Dumps `portfolio_db` using pg_dump (custom format)
3. Dumps `authentik` database using pg_dump (custom format)
4. Compresses both dumps with gzip
5. Deletes backups older than 30 days
6. Creates "latest" symlinks for easy access

**Output example:**

```
[INFO] Starting database backup...
[INFO] Backing up portfolio_db...
[SUCCESS] Portfolio database dumped successfully
[INFO] Backing up authentik database...
[SUCCESS] Authentik database dumped successfully
[INFO] Compressing backups...
[SUCCESS] Backups compressed:
  - portfolio_db_20250123_140530.dump.gz (2.3M)
  - authentik_20250123_140530.dump.gz (1.8M)
[INFO] Cleaning up backups older than 30 days...
[SUCCESS] Deleted 2 old backup(s)
[SUCCESS] Backup completed successfully!

Backup location: /home/bardockgaucho/GolandProjects/portfolio-manager/backups
Timestamp: 20250123_140530
Retention: 30 days

[INFO] To restore this backup, run: make db-restore BACKUP=20250123_140530
```

### Backup Files Created

For each backup, two files are created:

- `portfolio_db_YYYYMMDD_HHMMSS.dump.gz` - Portfolio Manager database
- `authentik_YYYYMMDD_HHMMSS.dump.gz` - Authentik authentication database

**Symlinks for latest backup:**

- `portfolio_db_latest.dump.gz` → most recent portfolio backup
- `authentik_latest.dump.gz` → most recent authentik backup

### Backup Location

All backups are stored in:

```
/home/bardockgaucho/GolandProjects/portfolio-manager/backups/
```

This directory is excluded from git (see `.gitignore`).

---

## Restore from Backup

### Restore from Specific Timestamp

```bash
make db-restore BACKUP=20250123_140530
```

Replace `20250123_140530` with your desired backup timestamp.

### Restore from Latest Backup

```bash
make db-restore BACKUP=latest
```

### Selective Restore

The restore script supports restoring specific databases:

**Restore only portfolio database:**

```bash
./scripts/restore.sh 20250123_140530 portfolio
```

**Restore only authentik database:**

```bash
./scripts/restore.sh 20250123_140530 authentik
```

**Restore both (default):**

```bash
./scripts/restore.sh 20250123_140530 all
```

Or using Makefile:

```bash
make db-restore BACKUP=20250123_140530
```

### What Happens During Restore

1. **Confirmation prompt**: You must type "yes" to confirm
2. **Services stop**: All running services are stopped
3. **PostgreSQL starts**: Only PostgreSQL container starts
4. **Database restore**: Data is restored from backup files
5. **Services restart**: All services start back up
6. **Completion**: You see success message

**Warning displayed:**

```
╔═══════════════════════════════════════════════════════════════╗
║                    ⚠️  WARNING  ⚠️                              ║
║                                                               ║
║  This will OVERWRITE the current database(s) with the        ║
║  backup from 20250123_140530                                 ║
║                                                               ║
║  All current data in the database(s) will be LOST!           ║
╚═══════════════════════════════════════════════════════════════╝

Are you sure you want to continue? Type 'yes' to proceed:
```

### Important Notes

- **Data loss warning**: Current database data will be completely replaced
- **Service downtime**: Services are stopped during restore (30-60 seconds typically)
- **User sessions**: Users will need to log out and log back in after restore
- **Backup verification**: Always verify backup exists before restoring

---

## List Available Backups

### View All Backups

```bash
make db-list-backups
```

**Output example:**

```
Portfolio Manager - Available Database Backups
===============================================

Latest Backup:
  Timestamp: 20250123_140530
  Created:   2025-01-23 14:05:30
  Portfolio: 2.3M
  Authentik: 1.8M

All Available Backups:
Timestamp        Created              Portfolio  Authentik
----------------------------------------------------------------
20250123_140530  2025-01-23 14:05:30  2.3M       1.8M
20250122_093015  2025-01-22 09:30:15  2.1M       1.7M
20250121_183045  2025-01-21 18:30:45  2.0M       1.6M
20250120_120000  2025-01-20 12:00:00  1.9M       1.5M

Total backups: 4

Usage Examples:
  make db-restore BACKUP=20250123_140530  # Restore from specific backup
  make db-restore BACKUP=latest           # Restore from latest backup
```

### Check Backup File Sizes

```bash
ls -lh backups/*.dump.gz
```

### Verify Backup Integrity

Test that a backup file is valid:

```bash
gunzip -t backups/portfolio_db_20250123_140530.dump.gz
```

No output = file is valid. Error message = file is corrupted.

---

## Automated Backups

### Setting Up Cron Jobs

For production environments, schedule automatic backups using cron.

#### Daily Backup at 2 AM

Edit crontab:

```bash
crontab -e
```

Add this line:

```cron
0 2 * * * cd /home/bardockgaucho/GolandProjects/portfolio-manager && make db-backup >> /var/log/portfolio-backup.log 2>&1
```

**What this does:**
- Runs backup every day at 2:00 AM
- Changes to project directory
- Executes backup command
- Logs output to `/var/log/portfolio-backup.log`

#### Multiple Backups Per Day

**Every 6 hours:**

```cron
0 */6 * * * cd /home/bardockgaucho/GolandProjects/portfolio-manager && make db-backup >> /var/log/portfolio-backup.log 2>&1
```

**Twice daily (2 AM and 2 PM):**

```cron
0 2,14 * * * cd /home/bardockgaucho/GolandProjects/portfolio-manager && make db-backup >> /var/log/portfolio-backup.log 2>&1
```

### Monitoring Automated Backups

**Check cron logs:**

```bash
tail -f /var/log/portfolio-backup.log
```

**Verify backups are being created:**

```bash
make db-list-backups
```

**Check cron is running:**

```bash
systemctl status cron  # Ubuntu/Debian
systemctl status crond # RHEL/CentOS/Fedora
```

### Backup Retention

The backup script automatically deletes backups older than **30 days**.

**To change retention period**, edit `scripts/backup.sh`:

```bash
# Change this line (line 11):
RETENTION_DAYS=30

# To keep backups for 60 days:
RETENTION_DAYS=60
```

---

## Disaster Recovery

### Complete System Loss

If you lose the entire system but have backup files:

**Step 1: Restore infrastructure**

```bash
cd /home/bardockgaucho/GolandProjects/portfolio-manager
make start
```

Wait for all services to start (2-3 minutes).

**Step 2: Restore databases**

```bash
make db-restore BACKUP=latest
```

Or restore from specific timestamp:

```bash
make db-restore BACKUP=20250123_140530
```

**Step 3: Verify restoration**

1. Check services are running:

```bash
podman ps
```

2. Access application: http://localhost:3000
3. Test user login
4. Verify portfolio data is present

### Partial Data Loss

If only some data is lost (e.g., one user's portfolios):

**Option 1: Full restore from backup**

Use the restore process above to restore all data.

**Option 2: Manual data recovery**

For advanced users who want to recover specific data:

1. Extract backup file:

```bash
cd backups
gunzip -c portfolio_db_20250123_140530.dump.gz > /tmp/backup.dump
```

2. Use `pg_restore` with selective restore:

```bash
podman exec -i portfolio-postgres pg_restore \
  -U portfolio_user \
  -d portfolio_db \
  -t portfolios \
  -t categories \
  --data-only \
  < /tmp/backup.dump
```

**Warning**: Manual recovery requires PostgreSQL knowledge and can cause data conflicts.

### Audit Logs as Backup Alternative

**Portfolio Manager's audit logging system provides an alternative recovery method** when backups are unavailable or corrupted.

#### When to Use Audit Logs for Recovery

✅ **Use audit log recovery when:**
- Backup files are corrupted or inaccessible
- Backups are outdated but recent audit logs exist
- Need to prove exact data state at a specific timestamp
- Partial data recovery needed (specific tables only)
- Combining with older backup for incremental recovery

❌ **Limitations:**
- Time-consuming (2-8 hours vs 5-10 min for backup restore)
- Requires complete audit logs from beginning or checkpoint
- Cannot recover read operations (GET requests)
- Requires manual verification

#### Comparison: Backup vs Audit Recovery

| Aspect | Traditional Backup | Audit Log Recovery | Combined Approach |
|--------|-------------------|-------------------|-------------------|
| **Speed** | 5-10 minutes | 2-8 hours | 30-60 minutes |
| **Complexity** | Simple | Complex | Moderate |
| **Data completeness** | Full snapshot | CREATE/UPDATE/DELETE only | Full + recent changes |
| **When to use** | Regular recovery | Backup failure | Backup exists but is old |
| **Prerequisites** | Backup files | Complete audit logs | Both |

#### Combined Approach (Recommended for Critical Recovery)

The most reliable recovery strategy combines both methods:

1. **Restore from last good backup** (even if days/weeks old)
2. **Replay recent audit logs** to catch up to current state

**Example scenario:**
- Last backup: 5 days ago
- Database corrupted: today
- Solution: Restore 5-day-old backup + replay last 5 days of audit logs

**Benefits:**
- Faster than full audit log recovery
- More complete than backup alone
- Minimizes data loss window

#### How to Use Audit Logs for Recovery

For complete audit log recovery procedures, see:

**[Emergency Database Recovery](audit-logging.md#emergency-database-recovery)** - Complete guide including:
- Step-by-step recovery procedures
- Scripts for extracting and replaying operations
- Verification procedures
- Best practices for recovery-ready logging

#### Protecting Audit Logs

To ensure audit logs are available for recovery:

1. **Separate storage** - Store logs on different disk/volume from database
2. **Remote replication** - Copy logs to remote server or cloud storage
3. **Retention policy** - Keep logs for at least 90 days (longer for compliance)
4. **Monitoring** - Alert on log write failures

**Example: Sync audit logs to S3:**

```bash
# Add to cron for hourly sync
aws s3 sync /app/audit/ s3://your-bucket/audit-logs/ \
  --exclude "*.log.lock"
```

### Off-Site Backup Storage

**Critical for production**: Store backups off-site in case of hardware failure or disasters.

**Options:**

1. **Cloud storage (recommended):**

```bash
# Upload to AWS S3
aws s3 sync backups/ s3://your-bucket/portfolio-backups/

# Upload to Google Cloud Storage
gsutil -m rsync -r backups/ gs://your-bucket/portfolio-backups/
```

2. **Remote server via rsync:**

```bash
rsync -avz backups/ user@backup-server:/path/to/backups/
```

3. **Network attached storage (NAS):**

```bash
# Mount NAS
mount -t nfs backup-nas:/backups /mnt/nas-backups

# Copy backups
rsync -avz backups/ /mnt/nas-backups/portfolio/
```

### Automated Off-Site Backup

Add to cron after daily backup:

```cron
# Daily backup at 2 AM
0 2 * * * cd /home/bardockgaucho/GolandProjects/portfolio-manager && make db-backup >> /var/log/portfolio-backup.log 2>&1

# Upload to S3 at 3 AM (after backup completes)
0 3 * * * aws s3 sync /home/bardockgaucho/GolandProjects/portfolio-manager/backups/ s3://your-bucket/portfolio-backups/ >> /var/log/portfolio-backup.log 2>&1
```

---

## Best Practices

### Before Major Changes

**Always backup before:**
- Upgrading database schema
- Running migrations
- Changing authentication configuration
- Bulk data imports/updates
- Testing new features in production

**Example workflow:**

```bash
# 1. Create backup
make db-backup

# 2. Note the timestamp from output
# Example: 20250123_140530

# 3. Perform risky operation
make migrate-up  # or whatever change you're making

# 4. If something goes wrong, restore:
make db-restore BACKUP=20250123_140530
```

### Backup Testing

**Test backups regularly** to ensure they work when needed.

**Monthly backup test procedure:**

1. Create a test backup:

```bash
make db-backup
```

2. Note the timestamp (e.g., `20250123_140530`)

3. Make a small change (create a test portfolio)

4. Restore from backup:

```bash
make db-restore BACKUP=20250123_140530
```

5. Verify the test portfolio is gone (confirms restore worked)

6. Create another backup:

```bash
make db-backup
```

**Document the test**: Keep a log of successful backup tests.

### Backup Before User Deletion

The system has a known issue with orphaned data when users are deleted from Authentik.

**Before deleting a user from Authentik:**

```bash
# 1. Create backup
make db-backup

# 2. Delete user in Authentik UI

# 3. If data issues occur, restore:
make db-restore BACKUP=latest
```

### Production Backup Strategy

**Recommended backup frequency for production:**

- **Daily full backups**: Keep for 30 days
- **Weekly backups**: Keep for 90 days (3 months)
- **Monthly backups**: Keep for 1 year
- **Off-site storage**: Upload all backups to cloud storage

**Cron setup for production:**

```cron
# Daily backup at 2 AM (kept for 30 days automatically)
0 2 * * * cd /path/to/portfolio-manager && make db-backup >> /var/log/portfolio-backup.log 2>&1

# Weekly backup on Sunday at 3 AM (copy to long-term storage)
0 3 * * 0 cp /path/to/backups/portfolio_db_latest.dump.gz /path/to/weekly-backups/portfolio_db_$(date +\%Y\%m\%d).dump.gz

# Monthly backup on 1st of month at 4 AM
0 4 1 * * cp /path/to/backups/portfolio_db_latest.dump.gz /path/to/monthly-backups/portfolio_db_$(date +\%Y\%m).dump.gz

# Upload to S3 at 5 AM
0 5 * * * aws s3 sync /path/to/backups/ s3://your-bucket/daily/ >> /var/log/portfolio-backup.log 2>&1
0 6 * * 0 aws s3 sync /path/to/weekly-backups/ s3://your-bucket/weekly/ >> /var/log/portfolio-backup.log 2>&1
0 7 1 * * aws s3 sync /path/to/monthly-backups/ s3://your-bucket/monthly/ >> /var/log/portfolio-backup.log 2>&1
```

---

## Troubleshooting

### Error: "PostgreSQL container is not running"

**Problem**: Backup/restore script cannot find the PostgreSQL container.

**Solution**:

```bash
# Check if containers are running
podman ps

# If not running, start them
make start

# Wait 30 seconds for PostgreSQL to be ready
sleep 30

# Try backup again
make db-backup
```

### Error: "No 'latest' backup symlink found"

**Problem**: Trying to restore from latest but no backups exist.

**Solution**:

```bash
# Check if any backups exist
make db-list-backups

# If no backups, you cannot restore
# If backups exist but symlink is missing, restore from specific timestamp:
make db-restore BACKUP=20250123_140530
```

### Error: "Backup not found"

**Problem**: Specified timestamp does not exist.

**Solution**:

```bash
# List available backups
make db-list-backups

# Use an existing timestamp from the list
make db-restore BACKUP=20250122_093015
```

### Restore Hangs or Times Out

**Problem**: Restore process appears stuck.

**Solution**:

1. **Check PostgreSQL logs:**

```bash
podman logs portfolio-postgres
```

2. **Check if PostgreSQL is running:**

```bash
podman ps | grep postgres
```

3. **Restart PostgreSQL if needed:**

```bash
podman restart portfolio-postgres
sleep 10  # Wait for it to be ready
```

4. **Try restore again:**

```bash
make db-restore BACKUP=20250123_140530
```

### Corrupted Backup File

**Problem**: Backup file is corrupted or incomplete.

**Solution**:

1. **Test backup file integrity:**

```bash
gunzip -t backups/portfolio_db_20250123_140530.dump.gz
```

2. **If corrupted, use an older backup:**

```bash
make db-list-backups  # Find an older backup
make db-restore BACKUP=20250122_093015
```

3. **Prevent future corruption:**

- Ensure sufficient disk space during backup
- Verify backups are uploaded to off-site storage successfully
- Test backups regularly

### Disk Space Issues

**Problem**: Backup fails due to insufficient disk space.

**Solution**:

1. **Check available space:**

```bash
df -h /home/bardockgaucho/GolandProjects/portfolio-manager/backups
```

2. **Delete old backups manually:**

```bash
# Delete backups older than 7 days
find backups/ -name "*.dump.gz" -mtime +7 -delete
```

3. **Reduce retention period:**

Edit `scripts/backup.sh` and change:

```bash
RETENTION_DAYS=30  # Change to 7 or 14
```

4. **Move old backups to external storage:**

```bash
# Upload to S3 and delete local copies
aws s3 sync backups/ s3://your-bucket/backups/
rm -f backups/*.dump.gz
```

### Permission Denied Errors

**Problem**: Cannot execute backup/restore scripts.

**Solution**:

```bash
# Make scripts executable
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
chmod +x scripts/list-backups.sh

# Try again
make db-backup
```

### Restore Warnings

**Problem**: See warnings during restore like "role does not exist" or "schema already exists".

**Solution**: These warnings are **normal** and expected. The restore process uses `--clean --if-exists` flags which attempt to drop objects before restoring them.

Common warnings you can ignore:

- `WARNING: errors ignored on restore: X`
- `ERROR: role "postgres" does not exist`
- `ERROR: schema "public" already exists`

**When to worry**: If the final message is not "SUCCESS" or if application doesn't work after restore.

---

## Advanced Usage

### Backup Only Portfolio Database

```bash
./scripts/backup.sh
```

Then manually delete authentik backup if not needed:

```bash
rm backups/authentik_TIMESTAMP.dump.gz
```

### Restore Without Stopping Services

**Not recommended**, but possible for advanced users:

```bash
# Manually restore (services must be stopped first for safety)
podman exec portfolio-postgres pg_restore \
  -U portfolio_user \
  -d portfolio_db \
  --clean --if-exists \
  < backups/portfolio_db_20250123_140530.dump.gz
```

### Export Backup to SQL (Human-Readable)

```bash
# Decompress and convert to SQL
gunzip -c backups/portfolio_db_20250123_140530.dump.gz | \
  podman exec -i portfolio-postgres pg_restore -f /tmp/backup.sql
```

### Import Backup from Another Instance

If you have a backup from a different Portfolio Manager instance:

1. Copy backup files to `backups/` directory
2. Ensure filenames match pattern: `portfolio_db_TIMESTAMP.dump.gz`
3. Restore normally:

```bash
make db-restore BACKUP=TIMESTAMP
```

---

## Related Documentation

- [Client Onboarding](../deployment/client-onboarding.md) - User provisioning and setup
- [Multi-Tenancy Architecture](../development/multi-tenancy.md) - Data isolation design
- [Deployment Guide](../deployment/) - Production deployment procedures
- [Troubleshooting](../authentication/troubleshooting.md) - Authentication issues

---

**Questions or issues?** Check the [main troubleshooting guide](../authentication/troubleshooting.md) or open an issue on GitHub.
