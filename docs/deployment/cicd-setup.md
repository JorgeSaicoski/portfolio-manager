# CI/CD Setup Guide for Gitea + Vultr

This guide walks you through setting up a complete CI/CD pipeline for Portfolio Manager using **Gitea Actions** (GitHub Actions compatible) and deploying to **Vultr** servers.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Gitea Actions Setup](#gitea-actions-setup)
4. [Vultr Server Setup](#vultr-server-setup)
5. [Deployment Configuration](#deployment-configuration)
6. [Workflows](#workflows)
7. [Secrets Management](#secrets-management)
8. [Deployment Process](#deployment-process)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### CI/CD Architecture

```
┌─────────────┐
│   Gitea     │
│  Repository │
└──────┬──────┘
       │
       │ Push/PR
       ▼
┌─────────────────────────────────┐
│     Gitea Actions Runners       │
│  (Running on Vultr or locally)  │
└──────┬──────────────────────────┘
       │
       ├─── Test Workflow (.gitea/workflows/test.yml)
       │    ├─ Backend tests
       │    ├─ Frontend type checking
       │    ├─ Security scanning
       │    └─ Linting
       │
       ├─── Build & Push Workflow (.gitea/workflows/build-and-push.yml)
       │    ├─ Build Docker images
       │    └─ Push to registry
       │
       ├─── Deploy Staging (.gitea/workflows/deploy-staging.yml)
       │    └─ Auto-deploy on develop branch
       │
       └─── Deploy Production (.gitea/workflows/deploy-production.yml)
            └─ Manual deploy on version tags
```

### Deployment Environments

| Environment | Branch/Trigger | Server Path | Auto-Deploy |
|-------------|----------------|-------------|-------------|
| **Staging** | `develop` | `/opt/portfolio-manager-staging` | ✅ Yes |
| **Production** | `v*` tags | `/opt/portfolio-manager` | ❌ Manual approval |

---

## Prerequisites

### Local Requirements

- Git
- Make
- SSH access to Vultr servers
- Docker (for local builds)

### Vultr Account

- 1-2 Vultr instances (staging + production)
- **OS Options**: Ubuntu 22.04 LTS OR Rocky Linux 9, AlmaLinux 9, Fedora Server (RHEL-based with Podman)
- Minimum specs:
  - **Staging**: 2 vCPU, 4GB RAM, 80GB SSD
  - **Production**: 4 vCPU, 8GB RAM, 160GB SSD

**Note**: All deployment commands work with both Docker and Podman. Podman comes pre-installed on RHEL-based distributions.

### Gitea Requirements

- Gitea v1.20+ (with Actions support)
- Admin access to configure Actions

---

## Gitea Actions Setup

### Step 1: Enable Gitea Actions

Edit your Gitea `app.ini` configuration:

```ini
[actions]
ENABLED = true
DEFAULT_ACTIONS_URL = https://github.com
```

Restart Gitea:

```bash
systemctl restart gitea
```

### Step 2: Setup Actions Runner

You can run the Actions runner on:
1. A dedicated Vultr instance
2. Your Vultr staging/production servers
3. Your local machine (for testing)

#### Install Runner

```bash
# Download Gitea Actions runner
cd /opt
wget https://dl.gitea.com/act_runner/0.2.6/act_runner-0.2.6-linux-amd64
chmod +x act_runner-0.2.6-linux-amd64
mv act_runner-0.2.6-linux-amd64 /usr/local/bin/act_runner

# Create runner directory
mkdir -p /opt/gitea-runner
cd /opt/gitea-runner
```

#### Register Runner

1. Get registration token from Gitea:
   - Go to your repository → Settings → Actions → Runners
   - Click "Create new Runner"
   - Copy the registration token

2. Register the runner:

```bash
act_runner register --instance https://gitea.yourdomain.com \
  --token YOUR_REGISTRATION_TOKEN \
  --name "portfolio-runner-1" \
  --labels "ubuntu-latest:docker://node:20-bullseye,ubuntu-22.04:docker://catthehacker/ubuntu:act-22.04"
```

3. Create systemd service:

```bash
sudo tee /etc/systemd/system/gitea-runner.service > /dev/null <<EOF
[Unit]
Description=Gitea Actions Runner
After=network.target

[Service]
Type=simple
User=gitea
WorkingDirectory=/opt/gitea-runner
ExecStart=/usr/local/bin/act_runner daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

4. Start the runner:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitea-runner
sudo systemctl start gitea-runner
sudo systemctl status gitea-runner
```

### Step 3: Verify Runner

In Gitea UI:
- Go to Repository → Settings → Actions → Runners
- You should see your runner listed with status "Idle"

---

## Vultr Server Setup

### Quick Setup (Automated)

Use the provided setup script:

```bash
# For staging server
make setup-vultr-staging STAGING_HOST=your-staging-ip

# For production server
make setup-vultr-production PRODUCTION_HOST=your-production-ip
```

### Manual Setup

If you prefer manual setup:

#### 1. Create Vultr Instance

1. Log in to Vultr dashboard
2. Deploy New Instance
3. Choose:
   - **Location**: Closest to your users
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: See prerequisites above
4. Add SSH key
5. Deploy

#### 2. Initial Server Configuration

SSH into your server:

```bash
ssh root@your-server-ip
```

Run the setup script:

```bash
# Copy script to server
scp scripts/setup-vultr-server.sh root@your-server-ip:/tmp/

# Execute
ssh root@your-server-ip "bash /tmp/setup-vultr-server.sh staging"
```

This script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Create `deploy` user
- ✅ Configure firewall (UFW)
- ✅ Setup fail2ban
- ✅ Create deployment directories
- ✅ Configure swap space
- ✅ Apply security hardening

#### 3. Add SSH Key for Deploy User

On your **local machine**, generate a deployment SSH key (if you don't have one):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "portfolio-deploy"
```

Copy the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server-ip
```

Test the connection:

```bash
ssh -i ~/.ssh/deploy_key deploy@your-server-ip
```

#### 4. Clone Repository on Server

```bash
# SSH as deploy user
ssh -i ~/.ssh/deploy_key deploy@your-server-ip

# Clone repository
cd /opt/portfolio-manager-staging  # or /opt/portfolio-manager for production
git clone https://gitea.yourdomain.com/username/portfolio-manager.git .

# Copy environment file
cp .env.example .env

# Edit .env with production values
vim .env
```

---

## Deployment Configuration

### Environment Variables

Add these to your local environment or CI/CD secrets:

#### Staging Environment

```bash
export STAGING_HOST="staging.yourdomain.com"
export STAGING_URL="https://staging.yourdomain.com"
export STAGING_SSH_KEY_PATH="~/.ssh/deploy_key"
```

#### Production Environment

```bash
export PRODUCTION_HOST="yourdomain.com"
export PRODUCTION_URL="https://yourdomain.com"
export PRODUCTION_SSH_KEY_PATH="~/.ssh/deploy_key"
```

### Container Registry

You have two options:

#### Option 1: Use Gitea Container Registry

```bash
# In .gitea/workflows/build-and-push.yml
env:
  REGISTRY: gitea.yourdomain.com
```

Login to Gitea registry on your servers:

```bash
docker login gitea.yourdomain.com
```

#### Option 2: Use GitHub Container Registry (GHCR)

```bash
# In .gitea/workflows/build-and-push.yml
env:
  REGISTRY: ghcr.io
```

Login to GHCR on your servers:

```bash
docker login ghcr.io
```

---

## Workflows

### 1. Test Workflow (`.gitea/workflows/test.yml`)

**Trigger**: Every push and pull request

**Jobs**:
- Backend tests with PostgreSQL
- Backend linting (golangci-lint)
- Backend security scan (gosec)
- Frontend type checking
- Dependency vulnerability scan (Trivy)

**Usage**:
```bash
# Runs automatically on every push
git push origin feature-branch
```

### 2. Build & Push Workflow (`.gitea/workflows/build-and-push.yml`)

**Trigger**: Push to `main` or `develop`, version tags

**Jobs**:
- Build backend Docker image
- Build frontend Docker image
- Push to container registry
- Tag with branch name, commit SHA, and version

**Usage**:
```bash
# Automatically builds on push to main/develop
git push origin main
```

### 3. Deploy Staging Workflow (`.gitea/workflows/deploy-staging.yml`)

**Trigger**: Push to `develop` branch

**Jobs**:
- Pull latest code
- Pull Docker images
- Deploy to staging server
- Run health checks

**Usage**:
```bash
# Auto-deploys when you push to develop
git push origin develop
```

### 4. Deploy Production Workflow (`.gitea/workflows/deploy-production.yml`)

**Trigger**: Push version tags (e.g., `v1.0.0`)

**Jobs**:
- Create database backup
- Pull specific version
- Deploy with zero-downtime rolling update
- Run migrations
- Health checks
- Automatic rollback on failure

**Usage**:
```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Or use manual workflow dispatch in Gitea UI
```

---

## Secrets Management

### Add Secrets to Gitea

**Text-based navigation to find secrets in Gitea:**
1. Navigate to your repository page (e.g., `https://gitea.yourdomain.com/username/portfolio-manager`)
2. Click on the **"Settings"** link in the top navigation bar (between "Code" and "Issues")
3. In the left sidebar menu, scroll down to find the **"Secrets"** section
4. Under "Secrets", click on **"Actions"**
5. You'll see a page titled "Actions Secrets" with an **"Add Secret"** button
6. Click **"Add Secret"** to create a new secret

**Steps to add each secret:**
1. Enter the secret name (e.g., `STAGING_HOST`)
2. Enter the secret value in the text area
3. Click the **"Add Secret"** button at the bottom
4. Repeat for all required secrets listed below

### Required Secrets to Add

#### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Staging server IP/domain | `staging.example.com` |
| `STAGING_SSH_KEY` | SSH private key for staging | Contents of `~/.ssh/deploy_key` |
| `STAGING_URL` | Staging application URL | `https://staging.example.com` |
| `PRODUCTION_HOST` | Production server IP/domain | `example.com` |
| `PRODUCTION_SSH_KEY` | SSH private key for production | Contents of `~/.ssh/deploy_key` |
| `PRODUCTION_URL` | Production application URL | `https://example.com` |
| `VITE_API_URL` | Frontend API URL | `https://example.com/api` |
| `VITE_AUTHENTIK_URL` | Authentik URL | `https://auth.example.com` |

#### Optional Secrets (if using Gitea registry)

| Secret Name | Description |
|-------------|-------------|
| `GITEA_USERNAME` | Gitea username for registry |
| `GITEA_TOKEN` | Gitea personal access token |

### Adding SSH Key Secret

```bash
# Copy your SSH private key
cat ~/.ssh/deploy_key

# Paste the entire contents (including BEGIN/END lines) into Gitea secret
```

---

## Deployment Process

### Deploying to Staging

#### Automatic (via CI/CD)

```bash
# 1. Make your changes
git checkout develop
git add .
git commit -m "feat: new feature"

# 2. Push to develop - this triggers automatic deployment
git push origin develop

# 3. Check workflow status in Gitea UI
# Repository → Actions → Workflows
```

#### Manual (via Makefile)

```bash
# Deploy directly from your machine
make deploy-staging STAGING_HOST=your-staging-ip
```

### Deploying to Production

#### Via Git Tags (Recommended)

```bash
# 1. Merge to main
git checkout main
git merge develop
git push origin main

# 2. Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. Workflow runs automatically
# Monitor in Gitea → Actions
```

#### Manual Deployment

```bash
make deploy-production PRODUCTION_HOST=your-production-ip
```

### Rollback

If deployment fails, the production workflow automatically rolls back to the previous version.

Manual rollback:

```bash
# SSH to server
ssh deploy@your-production-ip

# Go to deployment directory
cd /opt/portfolio-manager

# Checkout previous tag
git tag  # List all tags
git checkout v1.0.0  # Previous working version

# Restart services
docker compose up -d backend frontend
```

---

## Monitoring Deployments

### Check Deployment Status

#### Via Gitea UI
1. Go to Repository → Actions
2. Click on the workflow run
3. View logs for each step

#### Via Command Line

```bash
# SSH to server
ssh deploy@your-server-ip

# Check running containers
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Check service health
curl http://localhost:8000/health
```

### Monitoring Stack

Access Grafana on your server:

```
http://your-server-ip:3001
Username: admin
Password: admin (change on first login)
```

---

## Makefile Commands Reference

### CI/CD Commands

```bash
# Run all tests (like CI)
make ci-test

# Run linters
make ci-lint

# Run security scans
make ci-security

# Generate coverage report
make ci-coverage

# Run all CI checks
make ci-all

# Build Docker images locally
make docker-build

# Push images to registry
REGISTRY=ghcr.io/username make docker-push

# Deploy to staging
make deploy-staging STAGING_HOST=your-ip

# Deploy to production
make deploy-production PRODUCTION_HOST=your-ip

# Setup Vultr servers
make setup-vultr-staging STAGING_HOST=your-ip
make setup-vultr-production PRODUCTION_HOST=your-ip
```

---

## Troubleshooting

### Workflow Fails on Test Step

**Error**: Tests fail in CI

**Solution**:
```bash
# Run tests locally first
make ci-test

# Fix any failing tests
# Then commit and push
```

### SSH Connection Failed

**Error**: `Permission denied (publickey)`

**Solution**:
```bash
# Verify SSH key is added to server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server-ip

# Verify secret in Gitea contains correct private key
cat ~/.ssh/deploy_key
# Copy entire contents to Gitea secret
```

### Docker Image Pull Failed

**Error**: `unauthorized: authentication required`

**Solution**:
```bash
# SSH to server
ssh deploy@your-server-ip

# Login to registry
docker login gitea.yourdomain.com
# OR
docker login ghcr.io

# Verify credentials work
docker pull your-image-name
```

### Health Check Failed After Deployment

**Error**: Health check returns 500 or timeout

**Solution**:
```bash
# SSH to server
ssh deploy@your-server-ip
cd /opt/portfolio-manager

# Check service logs
docker compose logs backend
docker compose logs frontend

# Check database connection
docker compose exec backend /app/backend --version

# Restart services
docker compose restart backend frontend
```

### Deployment Stuck or Slow

**Issue**: Deployment takes too long

**Solution**:
```bash
# Check server resources
ssh deploy@your-server-ip
htop  # Check CPU/memory
df -h  # Check disk space

# If low on resources, scale down during deployment
docker compose stop grafana prometheus
# Deploy
# Then start monitoring again
```

### Cannot Access Deployed Application

**Error**: `ERR_CONNECTION_REFUSED`

**Solution**:
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check if services are running
docker compose ps

# Check if port is accessible
nc -zv localhost 8000
nc -zv localhost 3000
```

---

## Best Practices

### 1. Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

### 2. Version Tagging

Use semantic versioning:
- `v1.0.0` - Major release
- `v1.1.0` - Minor feature
- `v1.1.1` - Patch/bugfix

### 3. Testing Before Deploy

Always test in staging first:

```bash
# 1. Merge feature to develop
git checkout develop
git merge feature/new-feature
git push origin develop

# 2. Verify in staging
# Visit https://staging.yourdomain.com

# 3. If good, merge to main and tag
git checkout main
git merge develop
git tag v1.1.0
git push origin main v1.1.0
```

### 4. Database Migrations

Production workflow automatically runs migrations, but test them in staging:

```bash
# SSH to staging
ssh deploy@staging-ip
docker compose exec portfolio-backend /app/backend migrate
```

### 5. Secrets Rotation

Rotate secrets regularly:
- SSH keys every 90 days
- Database passwords every 180 days
- API tokens as needed

### 6. Backup Strategy

Automated backups before production deployments. Manual backups:

```bash
# On server
cd /opt/portfolio-manager
make db-backup

# Backups stored in /opt/backups/portfolio-manager/
```

---

## Next Steps

1. ✅ Setup Gitea Actions runner
2. ✅ Configure Vultr servers
3. ✅ Add secrets to Gitea
4. ✅ Test staging deployment
5. ✅ Setup SSL certificates (Let's Encrypt)
6. ✅ Configure domain DNS
7. ✅ Test production deployment
8. ✅ Setup monitoring alerts

---

## Support

For issues specific to:
- **Gitea Actions**: https://docs.gitea.io/en-us/usage/actions/overview/
- **Vultr**: https://www.vultr.com/docs/
- **Portfolio Manager**: See main [README.md](../../README.md)

---

**Last Updated**: 2025-01-25
**Version**: 1.0.0
