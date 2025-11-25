# How to Backup & Restore Portfolio Manager

Learn how to create backups and restore from them safely.

**Time**: 20 minutes | **Difficulty**: Beginner | **Frequency**: Daily

---

## 📋 What & Why

**What**: Backup database and uploaded files, test restore procedures

**Why**:
- Protect against data loss
- Recover from mistakes
- Compliance requirements
- Peace of mind

---

## 📝 Quick Backup (5 minutes)

```bash
# SSH to server
ssh deploy@your-server-ip

# Run backup (uses Makefile)
cd /opt/portfolio-manager
make db-backup

# Backups saved to: /opt/backups/portfolio-manager/
```

---

## 📝 Manual Backup

### Database Backup

```bash
# Create backup directory
ssh deploy@your-server-ip
mkdir -p /opt/backups/portfolio-manager

# Backup database
cd /opt/portfolio-manager
docker compose exec -T portfolio-postgres pg_dump \
  -U portfolio_user portfolio_db \
  | gzip > /opt/backups/portfolio-manager/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup exists
ls -lh /opt/backups/portfolio-manager/
```

### Uploaded Files Backup

```bash
# Backup uploads directory
docker compose exec -T portfolio-backend tar czf - /app/uploads \
  > /opt/backups/portfolio-manager/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz

# Verify
ls -lh /opt/backups/portfolio-manager/
```

### Complete System Backup

```bash
#!/bin/bash
# Save as: ~/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/portfolio-manager"
APP_DIR="/opt/portfolio-manager"

echo "🔄 Starting backup..."

# Database
echo "📦 Backing up database..."
cd $APP_DIR
docker compose exec -T portfolio-postgres pg_dump \
  -U portfolio_user portfolio_db \
  | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Uploads
echo "📦 Backing up uploads..."
docker compose exec -T portfolio-backend tar czf - /app/uploads \
  > $BACKUP_DIR/uploads_backup_$DATE.tar.gz

# Configuration
echo "📦 Backing up configuration..."
cp $APP_DIR/.env $BACKUP_DIR/env_backup_$DATE

# Audit logs
echo "📦 Backing up audit logs..."
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz $APP_DIR/backend/logs/

echo "✅ Backup complete!"
echo "📁 Location: $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$DATE*
```

**Make executable and run:**
```bash
chmod +x ~/backup.sh
~/backup.sh
```

---

## 📝 Automated Daily Backups

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1

# Or with Makefile (if available)
0 2 * * * cd /opt/portfolio-manager && make db-backup >> /home/deploy/backup.log 2>&1
```

### Backup Rotation (Keep Last 7 Days)

```bash
#!/bin/bash
# Add to backup.sh

# Keep only last 7 days of backups
find /opt/backups/portfolio-manager/ -name "*.gz" -mtime +7 -delete
find /opt/backups/portfolio-manager/ -name "env_backup_*" -mtime +7 -delete

echo "🧹 Old backups cleaned"
```

---

## 📝 Restore from Backup

### Restore Database

```bash
# SSH to server
ssh deploy@your-server-ip

# List available backups
ls -lh /opt/backups/portfolio-manager/db_backup_*.sql.gz

# Choose a backup file
BACKUP_FILE="/opt/backups/portfolio-manager/db_backup_20250125_020000.sql.gz"

# Stop application (important!)
cd /opt/portfolio-manager
docker compose stop backend frontend

# Drop existing database and recreate
docker compose exec portfolio-postgres psql -U portfolio_user -d postgres -c \
  "DROP DATABASE portfolio_db;"

docker compose exec portfolio-postgres psql -U portfolio_user -d postgres -c \
  "CREATE DATABASE portfolio_db OWNER portfolio_user;"

# Restore from backup
gunzip -c $BACKUP_FILE | \
  docker compose exec -T portfolio-postgres psql -U portfolio_user -d portfolio_db

# Restart application
docker compose up -d backend frontend

# Verify
curl http://localhost:8000/health
```

### Restore Uploads

```bash
# Choose backup
BACKUP_FILE="/opt/backups/portfolio-manager/uploads_backup_20250125_020000.tar.gz"

# Restore
cat $BACKUP_FILE | \
  docker compose exec -T portfolio-backend tar xzf - -C /

# Verify
docker compose exec portfolio-backend ls -la /app/uploads/
```

### Test Restore (Recommended Before Production)

```bash
# Create test database
docker compose exec portfolio-postgres psql -U portfolio_user -d postgres -c \
  "CREATE DATABASE portfolio_db_test;"

# Restore to test database
gunzip -c $BACKUP_FILE | \
  docker compose exec -T portfolio-postgres psql -U portfolio_user -d portfolio_db_test

# Verify data
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db_test -c \
  "SELECT COUNT(*) FROM portfolios;"

# If looks good, proceed with real restore
# Drop test database
docker compose exec portfolio-postgres psql -U portfolio_user -d postgres -c \
  "DROP DATABASE portfolio_db_test;"
```

---

## 📝 Off-Site Backups

### Download to Local Machine

```bash
# On your LOCAL computer
# Download today's backups
scp deploy@your-server-ip:/opt/backups/portfolio-manager/*$(date +%Y%m%d)* ~/backups/

# Download all backups
scp -r deploy@your-server-ip:/opt/backups/portfolio-manager/* ~/backups/
```

### Upload to Cloud Storage (S3, Backblaze, etc.)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure (one time)
aws configure

# Upload backups to S3
aws s3 sync /opt/backups/portfolio-manager/ s3://your-bucket/portfolio-manager-backups/

# Add to backup.sh
echo "☁️  Uploading to S3..."
aws s3 sync /opt/backups/portfolio-manager/ s3://your-bucket/portfolio-manager-backups/
echo "✅ Cloud backup complete"
```

---

## ✔️ Backup Checklist

**Weekly Verification:**
- [ ] Backups are running automatically
- [ ] Backup files exist and aren't empty
- [ ] Test restore on staging server
- [ ] Off-site backups are working
- [ ] Old backups are being rotated
- [ ] Backup logs checked for errors

**Monthly:**
- [ ] Full restore test on separate server
- [ ] Document restore time (RTO)
- [ ] Verify all data is recoverable
- [ ] Update backup procedures

---

## 🔧 Troubleshooting

### Backup Fails - Disk Full

```bash
# Check disk space
df -h

# Clean up old backups manually
cd /opt/backups/portfolio-manager
rm -f *202501[01-15]*  # Delete Jan 1-15

# Clean Docker images
docker system prune -af
```

### Restore Fails - Permission Denied

```bash
# Check file permissions
ls -l /opt/backups/portfolio-manager/

# Fix ownership
sudo chown deploy:deploy /opt/backups/portfolio-manager/*

# Fix permissions
chmod 600 /opt/backups/portfolio-manager/*
```

### Backup File Corrupted

```bash
# Test backup integrity
gunzip -t /opt/backups/portfolio-manager/db_backup_*.sql.gz

# If corrupted, use previous backup
ls -lt /opt/backups/portfolio-manager/
```

---

## ➡️ Next Steps

- [How to Rollback](./how-to-rollback.md) - Use backups to rollback
- [How to Deploy](./how-to-deploy-production.md) - Include backup in deployment
- [How to Monitor](./how-to-monitor.md) - Monitor backup success

---

## 🎓 What You Learned

- ✅ How to manually backup database and files
- ✅ How to automate daily backups with cron
- ✅ How to restore from backup safely
- ✅ How to test backups
- ✅ How to manage backup rotation
- ✅ How to use off-site backups

**Your data is now protected!** 💾

---

**Last Updated**: 2025-01-25
**Recommended**: Daily automated backups + monthly restore tests
