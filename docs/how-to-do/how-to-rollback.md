# How to Rollback a Deployment

Emergency procedures to quickly rollback when something goes wrong.

**Time**: 10 minutes | **Difficulty**: Beginner | **When**: Production issues after deployment

---

## 📋 What & Why

**What**: Revert to previous working version

**Why**:
- Fix production issues quickly
- Minimize user impact
- Buy time to fix properly
- Restore service

---

**Note**: All `docker compose` commands below work with `podman compose` as well. Podman is pre-installed on RHEL-based distros (Rocky Linux, AlmaLinux, Fedora).

---

## 🚨 Quick Rollback (5 minutes)

### Step 1: Identify Previous Version

```bash
# SSH to server
ssh deploy@your-server-ip
cd /opt/portfolio-manager

# List recent tags (versions)
git tag --sort=-version:refname | head -10

# Example output:
# v1.2.0  ← Current (broken)
# v1.1.0  ← Previous (last known good)
# v1.0.0
```

### Step 2: Rollback Code

```bash
# Checkout previous version
git checkout v1.1.0

# Verify
git describe --tags
# Should show: v1.1.0
```

### Step 3: Rollback Services

```bash
# Restart with previous version (docker or podman)
docker compose down
docker compose up -d

# Or rebuild if needed
docker compose up -d --build

# Wait 30 seconds for services to start
sleep 30
```

### Step 4: Verify

```bash
# Check health
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Check all services
docker compose ps
# All should show "Up"

# Test in browser
# https://yourdomain.com
```

**Done! Service restored!** ✅

---

## 📝 Partial Rollback

### Rollback Backend Only

```bash
cd /opt/portfolio-manager

# Checkout previous backend code
git checkout v1.1.0 -- backend/

# Rebuild and restart backend only
docker compose up -d --build backend

# Frontend stays on current version
```

### Rollback Frontend Only

```bash
# Checkout previous frontend code
git checkout v1.1.0 -- frontend/

# Rebuild and restart frontend only
docker compose up -d --build frontend

# Backend stays on current version
```

---

## 📝 Rollback with Database Migration

⚠️ **WARNING**: If new version added database migrations, rolling back code is NOT enough!

### Step 1: Check for Migrations

```bash
# Check recent commits for migration files
git log --since="1 day ago" --name-only | grep migration

# Or check database
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db -c \
  "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### Step 2: Backup Database First!

```bash
# ALWAYS backup before migration rollback (docker or podman)
docker compose exec -T portfolio-postgres pg_dump -U portfolio_user portfolio_db | gzip > /opt/backups/portfolio-manager/pre_rollback_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Step 3: Rollback Migration

**If migration added a column:**
```sql
-- Connect to database
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db

-- Remove the column
ALTER TABLE projects DROP COLUMN IF EXISTS new_column;

-- Exit
\q
```

**If migration added a table:**
```sql
DROP TABLE IF EXISTS new_table CASCADE;
```

**If migration changed data:**
```bash
# Restore from backup taken before problematic deployment (docker or podman)
gunzip -c /opt/backups/portfolio-manager/db_backup_BEFORE_DEPLOY.sql.gz | docker compose exec -T portfolio-postgres psql -U portfolio_user -d portfolio_db
```

### Step 4: Rollback Code

```bash
# After database is rolled back
git checkout v1.1.0
docker compose up -d --build
```

---

## 📝 CI/CD Automatic Rollback

If using CI/CD (see [cicd-setup.md](../deployment/cicd-setup.md)):

### Trigger Automatic Rollback

The production workflow includes automatic rollback on failure!

**Manual trigger:**
1. Go to Gitea → Repository → Actions
2. Find failed deployment workflow
3. Check logs to see if rollback succeeded
4. If rollback failed, use manual steps above

---

## 📝 Rollback Checklist

Before rollback:
- [ ] Identify previous working version
- [ ] Create database backup
- [ ] Check if migrations need rollback
- [ ] Notify team/users

During rollback:
- [ ] Checkout previous version
- [ ] Handle database migrations
- [ ] Restart services
- [ ] Verify health

After rollback:
- [ ] Test critical functionality
- [ ] Check logs for errors
- [ ] Monitor metrics
- [ ] Document incident
- [ ] Fix issue in develop branch
- [ ] Plan proper fix and redeploy

---

## 🔧 Troubleshooting

### Rollback Fails - Services Won't Start

```bash
# Check logs (docker or podman)
docker compose logs backend
docker compose logs frontend

# Common issues:
# 1. Port conflict
docker compose down
docker compose up -d

# 2. Database incompatible
# Restore database to matching version
```

### Can't Find Previous Version

```bash
# List all tags with dates
git log --tags --simplify-by-decoration --pretty="format:%ai %d"

# Find commit before problem
git log --oneline -10

# Checkout specific commit
git checkout COMMIT_HASH
```

### Database Restore Fails

```bash
# Check backup file
gunzip -t /opt/backups/portfolio-manager/db_backup_*.sql.gz

# If corrupted, use older backup
ls -lt /opt/backups/portfolio-manager/

# Restore from older backup (docker or podman)
gunzip -c /opt/backups/portfolio-manager/db_backup_OLDER.sql.gz | docker compose exec -T portfolio-postgres psql -U portfolio_user -d portfolio_db
```

---

## 📝 Post-Rollback Actions

### 1. Verify Everything Works

```bash
# Run smoke tests
make verify-setup

# Or manual tests:
# - Can users log in?
# - Can users create portfolios?
# - Can users view projects?
# - Are images loading?
```

### 2. Document Incident

```markdown
## Incident Report: Rollback to v1.1.0

**Date**: 2025-01-25
**Duration**: 15 minutes
**Impact**: All users couldn't create portfolios

### Timeline
- 10:00 - Deployed v1.2.0
- 10:05 - Users report errors
- 10:10 - Decided to rollback
- 10:15 - Rolled back to v1.1.0
- 10:15 - Service restored

### Root Cause
- New featured flag migration had syntax error
- Database migration failed silently
- Backend couldn't query projects table

### Actions Taken
- Rolled back code to v1.1.0
- Rolled back database migration
- Restarted services
- Verified health

### Follow-up
- [ ] Fix migration in develop
- [ ] Add migration tests
- [ ] Test thoroughly in staging
- [ ] Redeploy with fix
```

### 3. Fix and Redeploy

```bash
# On your local machine
git checkout develop

# Fix the issue
# ... make changes ...

# Test locally
make ci-all

# Push to staging
git push origin develop

# Test in staging
# ... manual testing ...

# Create new version
git checkout main
git merge develop
git tag v1.2.1
git push origin main v1.2.1

# Deploy automatically via CI/CD
# Or manually if needed
```

---

## ➡️ Next Steps

- [How to Investigate](./how-to-investigate.md) - Find root cause
- [How to Backup](./how-to-backup.md) - Ensure backups are current
- [How to Monitor](./how-to-monitor.md) - Detect issues faster

---

## 🎓 What You Learned

- ✅ Quick rollback procedure (5 minutes)
- ✅ How to handle database migrations
- ✅ Partial rollback (backend or frontend only)
- ✅ Automatic vs manual rollback
- ✅ Post-rollback verification
- ✅ Incident documentation

**You can now confidently rollback when needed!** ⏮️

---

**Last Updated**: 2025-01-25
**Emergency Contact**: Keep this guide bookmarked!
