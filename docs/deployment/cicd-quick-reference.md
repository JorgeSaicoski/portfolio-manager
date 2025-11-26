# CI/CD Quick Reference Guide

Quick commands and cheat sheet for Portfolio Manager CI/CD operations.

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Setup Vultr servers
export STAGING_HOST="your-staging-ip"
export PRODUCTION_HOST="your-production-ip"

make setup-vultr-staging STAGING_HOST=$STAGING_HOST
make setup-vultr-production PRODUCTION_HOST=$PRODUCTION_HOST

# 2. Add SSH keys to Gitea secrets
# Repository → Settings → Secrets → Actions
# Add: STAGING_SSH_KEY, PRODUCTION_SSH_KEY, etc.

# 3. Deploy to staging
git checkout develop
git push origin develop
# Automatic deployment triggered!

# 4. Deploy to production
git checkout main
git merge develop
git tag v1.0.0
git push origin main v1.0.0
# Automatic deployment triggered!
```

---

## 📝 Common Commands

### Local Testing (Before Push)

```bash
# Run all tests
make ci-test

# Run linters
make ci-lint

# Run security scans
make ci-security

# Run everything
make ci-all

# Build Docker images locally
make docker-build
```

### Deployment

```bash
# Deploy to staging (manual)
make deploy-staging STAGING_HOST=your-ip

# Deploy to production (manual)
make deploy-production PRODUCTION_HOST=your-ip

# Deploy via CI/CD (automatic)
# Staging: push to develop
# Production: push version tag
```

### Server Management

```bash
# SSH to servers
ssh deploy@$STAGING_HOST
ssh deploy@$PRODUCTION_HOST

# Check service status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart backend frontend

# Update code
git pull origin develop  # or main

# Rebuild and restart
docker compose up -d --build backend frontend
```

---

## 🔄 Workflow Triggers

| Workflow | Trigger | Action |
|----------|---------|--------|
| **Test** | Any push/PR | Run tests, linting, security scans |
| **Build** | Push to main/develop | Build & push Docker images |
| **Deploy Staging** | Push to `develop` | Auto-deploy to staging |
| **Deploy Production** | Push tag `v*` | Deploy to production (with approval) |

---

## 🏷️ Version Tagging

```bash
# Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# List all tags
git tag

# Delete tag (if mistake)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### Semantic Versioning

- `v1.0.0` → Major release (breaking changes)
- `v1.1.0` → Minor release (new features)
- `v1.1.1` → Patch release (bug fixes)

---

## 🔐 Secrets Required

Add these in Gitea → Repository → Settings → Secrets:

### Mandatory
- `STAGING_HOST` - Staging server IP/domain
- `STAGING_SSH_KEY` - SSH private key (entire file)
- `STAGING_URL` - https://staging.yourdomain.com
- `PRODUCTION_HOST` - Production server IP/domain
- `PRODUCTION_SSH_KEY` - SSH private key (entire file)
- `PRODUCTION_URL` - https://yourdomain.com

### Optional (Frontend build)
- `VITE_API_URL` - API endpoint URL
- `VITE_AUTHENTIK_URL` - Authentik URL

---

## 🐳 Docker Commands

```bash
# View running containers
docker compose ps

# View images
docker images

# Clean up old images
docker image prune -af

# View container logs
docker compose logs -f [service-name]

# Execute command in container
docker compose exec backend sh
docker compose exec postgres psql -U portfolio_user

# Rebuild specific service
docker compose up -d --build backend

# Pull latest images
docker compose pull
```

---

## 📊 Monitoring

```bash
# Check health
curl http://localhost:8000/health

# Check services
systemctl status docker

# View resource usage
docker stats

# Monitor logs in real-time
docker compose logs -f --tail=100

# Access Grafana
http://your-server-ip:3001
# Login: admin/admin
```

---

## 🔧 Troubleshooting Commands

### Service Won't Start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check if port is in use
sudo netstat -tlnp | grep :8000

# Restart everything
docker compose down
docker compose up -d

# Nuclear option - rebuild everything
docker compose down -v
docker compose up -d --build
```

### Database Issues

```bash
# Access database
docker compose exec portfolio-postgres psql -U portfolio_user portfolio_db

# Backup database
make db-backup

# Restore database
make db-restore BACKUP_FILE=backup.sql.gz

# Check database connection
docker compose exec backend sh
# Inside container:
psql -h portfolio-postgres -U portfolio_user -d portfolio_db
```

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/deploy_key deploy@your-server-ip

# Check SSH key permissions
chmod 600 ~/.ssh/deploy_key

# Add SSH key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server-ip

# Debug SSH
ssh -vvv -i ~/.ssh/deploy_key deploy@your-server-ip
```

### Deployment Failed

```bash
# Check workflow logs in Gitea UI
# Repository → Actions → Click on failed run

# Manual rollback
ssh deploy@your-server-ip
cd /opt/portfolio-manager
git checkout v1.0.0  # previous working version
docker compose up -d backend frontend
```

---

## 🚨 Emergency Procedures

### Emergency Rollback

```bash
# Quick rollback to previous version
ssh deploy@$PRODUCTION_HOST
cd /opt/portfolio-manager

# Find previous working version
git tag

# Checkout and restart
git checkout v1.0.0
docker compose up -d backend frontend

# Verify
curl http://localhost:8000/health
```

### Service Down - Quick Restart

```bash
ssh deploy@$PRODUCTION_HOST
cd /opt/portfolio-manager
docker compose restart backend frontend
```

### Database Recovery

```bash
# Find latest backup
ls -lth /opt/backups/portfolio-manager/

# Restore backup
cd /opt/portfolio-manager
gunzip -c /opt/backups/portfolio-manager/db_backup_TIMESTAMP.sql.gz | \
  docker compose exec -T portfolio-postgres psql -U portfolio_user portfolio_db
```

---

## 📦 Backup Commands

```bash
# Manual backup
make db-backup

# Backup with custom name
docker compose exec -T portfolio-postgres pg_dump \
  -U portfolio_user portfolio_db | \
  gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup uploads
docker compose exec -T portfolio-backend tar czf - /app/uploads \
  > uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz

# Restore uploads
cat uploads_backup.tar.gz | \
  docker compose exec -T portfolio-backend tar xzf - -C /
```

---

## 🔍 Debugging

### Check Environment Variables

```bash
# On server
ssh deploy@your-server-ip
cat .env | grep -v PASSWORD | grep -v SECRET

# In container
docker compose exec backend env
```

### Check Network

```bash
# Test backend from server
curl http://localhost:8000/health

# Test frontend from server
curl http://localhost:3000

# Test from outside
curl http://your-server-ip:8000/health

# Check firewall
sudo ufw status
```

### Check Resources

```bash
# CPU and memory
htop

# Disk usage
df -h

# Docker disk usage
docker system df

# Clean up disk space
docker system prune -af
```

---

## 📁 Important Paths

### On Server

```
/opt/portfolio-manager              # Production
/opt/portfolio-manager-staging      # Staging
/opt/backups/portfolio-manager/     # Backups
/opt/gitea-runner/                  # Gitea Actions runner
/var/lib/docker/volumes/            # Docker volumes
```

### In Repository

```
.gitea/workflows/                   # CI/CD workflows
scripts/deploy.sh                   # Deployment script
scripts/setup-vultr-server.sh       # Server setup script
docs/deployment/cicd-setup.md       # Full guide
```

---

## 🎯 Quick Health Check

```bash
# One-liner health check
curl -f http://your-server-ip:8000/health && \
curl -f http://your-server-ip:3000 && \
echo "✅ All services healthy"

# Detailed check
ssh deploy@your-server-ip << 'EOF'
  cd /opt/portfolio-manager
  echo "=== Services ==="
  docker compose ps
  echo ""
  echo "=== Health ==="
  curl -s http://localhost:8000/health | jq
  echo ""
  echo "=== Resources ==="
  docker stats --no-stream
EOF
```

---

## 📚 References

- **Full Guide**: [docs/deployment/cicd-setup.md](./cicd-setup.md)
- **Makefile**: [Makefile](../../Makefile) - Run `make help`
- **Workflows**: [.gitea/workflows/](.gitea/workflows/)
- **Gitea Actions Docs**: https://docs.gitea.io/en-us/usage/actions/overview/

---

**Tips:**
- Always test in staging first
- Tag every production release
- Keep backups before major changes
- Monitor Grafana dashboards
- Check logs when something goes wrong

**Last Updated**: 2025-01-25
