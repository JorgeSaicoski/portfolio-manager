# Production Deployment

Comprehensive guide for deploying Portfolio Manager to production infrastructure with proper security, monitoring, backups, and operational best practices.

## Table of Contents

- [Overview](#overview)
- [Deployment Patterns](#deployment-patterns)
  - [Kubernetes (Recommended for Scale)](#kubernetes-recommended-for-scale)
  - [Dedicated Host with Podman/Docker](#dedicated-host-with-podmandocker)
  - [Docker Compose for Small Deployments](#docker-compose-for-small-deployments)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Security Hardening](#security-hardening)
- [Database Setup](#database-setup)
- [Backup & Recovery](#backup--recovery)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Scripts](#deployment-scripts)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)

---

## Overview

Production deployment requires careful planning and implementation of security, reliability, and operational best practices. This guide covers multiple deployment patterns and provides comprehensive checklists for production readiness.

**Key Production Requirements:**
- ✅ HTTPS everywhere with valid TLS certificates
- ✅ Secure secret management
- ✅ Automated backups with tested restore procedures
- ✅ Monitoring and alerting
- ✅ Security hardening (firewall, fail2ban, rate limiting)
- ✅ High availability (for critical deployments)
- ✅ Disaster recovery plan
- ✅ Update and patching procedures

---

## Deployment Patterns

Choose the deployment pattern that best fits your infrastructure and scale requirements.

### Kubernetes (Recommended for Scale)

**Best for:**
- Production workloads requiring high availability
- Teams managing multiple microservices
- Environments needing auto-scaling
- Organizations already using Kubernetes

**Prerequisites:**
- Kubernetes cluster (1.24+) - EKS, GKE, AKS, or self-managed
- `kubectl` configured and authenticated
- Helm 3+ (optional, for easier management)
- Persistent Volume support for PostgreSQL
- Ingress controller (nginx-ingress, Traefik, or similar)
- Cert-manager for automatic TLS certificate management

**Key Components:**

```
Kubernetes Deployment Structure:
├── namespace: portfolio-production
├── deployments/
│   ├── backend (3 replicas)
│   ├── frontend (2 replicas)
│   ├── authentik-server (2 replicas)
│   └── authentik-worker (2 replicas)
├── statefulsets/
│   ├── postgresql (with persistent volume)
│   └── redis (with persistent volume)
├── services/
│   ├── backend-service (ClusterIP)
│   ├── frontend-service (ClusterIP)
│   ├── authentik-service (ClusterIP)
│   └── postgres-service (ClusterIP)
├── ingress/
│   ├── frontend-ingress (portfolio.example.com)
│   ├── api-ingress (api.portfolio.example.com)
│   └── auth-ingress (auth.portfolio.example.com)
├── configmaps/
│   └── app-config
├── secrets/
│   ├── db-credentials
│   ├── authentik-secrets
│   └── tls-certificates
└── persistentvolumes/
    ├── postgres-pv (100Gi)
    └── redis-pv (10Gi)
```

**Deployment Steps:**

1. **Create Namespace:**
   ```bash
   kubectl create namespace portfolio-production
   kubectl config set-context --current --namespace=portfolio-production
   ```

2. **Create Secrets:**
   ```bash
   # Database credentials
   kubectl create secret generic db-credentials \
     --from-literal=username=portfolio_user \
     --from-literal=password=$(openssl rand -base64 32) \
     --from-literal=database=portfolio

   # Authentik secrets
   kubectl create secret generic authentik-secrets \
     --from-literal=secret-key=$(openssl rand -base64 50) \
     --from-literal=bootstrap-password=$(openssl rand -base64 32)

   # TLS certificate (if not using cert-manager)
   kubectl create secret tls portfolio-tls \
     --cert=path/to/tls.crt \
     --key=path/to/tls.key
   ```

3. **Deploy PostgreSQL (StatefulSet):**
   ```yaml
   # postgres-statefulset.yaml
   apiVersion: apps/v1
   kind: StatefulSet
   metadata:
     name: postgres
   spec:
     serviceName: postgres
     replicas: 1
     selector:
       matchLabels:
         app: postgres
     template:
       metadata:
         labels:
           app: postgres
       spec:
         containers:
         - name: postgres
           image: postgres:16-alpine
           ports:
           - containerPort: 5432
           env:
           - name: POSTGRES_DB
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: database
           - name: POSTGRES_USER
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: username
           - name: POSTGRES_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: password
           volumeMounts:
           - name: postgres-storage
             mountPath: /var/lib/postgresql/data
     volumeClaimTemplates:
     - metadata:
         name: postgres-storage
       spec:
         accessModes: ["ReadWriteOnce"]
         storageClassName: "standard"
         resources:
           requests:
             storage: 100Gi
   ```

4. **Deploy Application Components:**
   ```bash
   kubectl apply -f k8s/
   ```

5. **Configure Ingress with TLS:**
   ```yaml
   # ingress.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: portfolio-ingress
     annotations:
       cert-manager.io/cluster-issuer: "letsencrypt-prod"
       nginx.ingress.kubernetes.io/ssl-redirect: "true"
   spec:
     ingressClassName: nginx
     tls:
     - hosts:
       - portfolio.example.com
       - api.portfolio.example.com
       - auth.portfolio.example.com
       secretName: portfolio-tls
     rules:
     - host: portfolio.example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: frontend
               port:
                 number: 3000
     - host: api.portfolio.example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: backend
               port:
                 number: 8000
     - host: auth.portfolio.example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: authentik
               port:
                 number: 9000
   ```

6. **Verify Deployment:**
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   kubectl logs -f deployment/backend
   ```

**High Availability Setup:**
- Use multiple replicas for stateless services (backend, frontend)
- Configure pod anti-affinity for distribution across nodes
- Set up horizontal pod autoscaling (HPA)
- Use ReadinessProbes and LivenessProbes
- Configure resource limits and requests

### Dedicated Host with Podman/Docker

**Best for:**
- Small to medium deployments
- Single VPS or dedicated server
- Teams preferring rootless containers (Podman)
- Cost-effective production setup

**Recommended Providers:**
- Vultr (guides available in repo)
- DigitalOcean Droplets
- Linode
- Hetzner Cloud
- AWS EC2
- Google Compute Engine

**Server Specifications (Minimum):**
- **Small**: 2 vCPU, 4GB RAM, 80GB SSD ($12-20/month)
- **Medium**: 4 vCPU, 8GB RAM, 160GB SSD ($24-40/month)
- **Large**: 8 vCPU, 16GB RAM, 320GB SSD ($50-80/month)

**Setup Using Automated Script:**

Portfolio Manager includes an automated setup script for Vultr/similar VPS providers:

```bash
# From your local machine
cd /path/to/portfolio-manager

# Set your production server IP
export PRODUCTION_HOST=YOUR_SERVER_IP

# Run automated setup (installs Docker/Podman, firewall, security tools)
make setup-vultr-production PRODUCTION_HOST=$PRODUCTION_HOST

# Or run the script directly
./scripts/setup-vultr-server.sh YOUR_SERVER_IP
```

This script will:
- ✅ Update system packages
- ✅ Install Docker or Podman (detects OS automatically)
- ✅ Configure firewall (UFW on Ubuntu, firewalld on RHEL)
- ✅ Install fail2ban for intrusion prevention
- ✅ Create deploy user with sudo access
- ✅ Configure swap space
- ✅ Apply security hardening

**Manual Deployment Steps:**

See the comprehensive step-by-step guide:
**[How to Deploy to Production](../how-to-do/how-to-deploy-production.md)**

This guide covers:
- Creating a Vultr/VPS account
- Server provisioning
- SSH key setup
- Running automated setup script
- Deploying the application
- Configuring Authentik
- Setting up domain and SSL (Let's Encrypt)
- Nginx reverse proxy configuration
- Monitoring setup

### Docker Compose for Small Deployments

**Best for:**
- Development teams (< 10 users)
- Internal tools and demos
- Quick production deployments
- Single-server setups

**Prerequisites:**
- Linux server with Docker/Podman installed
- Domain name pointing to server
- TLS certificates (Let's Encrypt recommended)

**Production Docker Compose Setup:**

1. **Clone repository on server:**
   ```bash
   ssh user@your-server
   cd /opt
   sudo mkdir portfolio-manager
   sudo chown $USER:$USER portfolio-manager
   cd portfolio-manager
   git clone https://github.com/YourUsername/portfolio-manager.git .
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update for production:
   ```bash
   # Production mode
   GIN_MODE=release
   LOG_LEVEL=info
   
   # Strong secrets (generate with: openssl rand -base64 32)
   POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
   AUTHENTIK_SECRET_KEY=YOUR_STRONG_SECRET_KEY
   AUTHENTIK_BOOTSTRAP_PASSWORD=YOUR_ADMIN_PASSWORD
   
   # Your domain
   DOMAIN=portfolio.example.com
   VITE_API_URL=https://api.portfolio.example.com
   VITE_AUTHENTIK_URL=https://auth.portfolio.example.com
   AUTHENTIK_ISSUER=https://auth.portfolio.example.com/application/o/portfolio-manager/
   
   # CORS and security
   ALLOWED_ORIGINS=https://portfolio.example.com,https://auth.portfolio.example.com
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker compose up -d
   
   # OR with Podman
   podman compose up -d
   ```

4. **Set up reverse proxy (Nginx) for HTTPS:**

   See [Production-like Local Guide](production-like-local.md#4-reverse-proxy-setup) for Nginx configuration.

   Then get SSL certificate:
   ```bash
   sudo certbot --nginx -d portfolio.example.com \
     -d api.portfolio.example.com \
     -d auth.portfolio.example.com
   ```

---

## Pre-Deployment Checklist

Use this checklist before deploying to production:

### Infrastructure
- [ ] Server/cluster provisioned and accessible
- [ ] Domain names configured and DNS propagated
- [ ] Firewall rules configured (allow 80, 443, 22 only)
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Backup storage configured
- [ ] Monitoring infrastructure ready

### Security
- [ ] All secrets generated with strong randomness (32+ characters)
- [ ] Secrets stored securely (Kubernetes Secrets, Vault, AWS Secrets Manager)
- [ ] TLS certificates obtained (Let's Encrypt or purchased)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting enabled
- [ ] fail2ban installed and configured
- [ ] Database access restricted (firewall rules, authentication)

### Application
- [ ] Latest stable version deployed
- [ ] Environment variables configured for production
- [ ] Database migrations executed
- [ ] Authentik configured with production URLs
- [ ] CORS settings match production domains
- [ ] Log level set to `info` or `warn` (not `debug`)
- [ ] Frontend built with production optimizations

### Database
- [ ] PostgreSQL 16+ installed
- [ ] Strong database password set
- [ ] Connection pooling configured
- [ ] Automated backups scheduled
- [ ] Backup restore tested successfully
- [ ] Database access restricted to application only

### Monitoring
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards configured
- [ ] Alerting rules configured
- [ ] Alert notifications working (email/Slack)
- [ ] Log aggregation configured (optional)

---

## Security Hardening

### Critical Security Checklist

- [ ] **HTTPS Everywhere**: All services use HTTPS with valid certificates
- [ ] **Secret Management**: Use secret management service (Vault, AWS Secrets Manager)
- [ ] **Secret Rotation**: Rotate all secrets regularly (every 90 days)
- [ ] **2FA Enabled**: Enable two-factor authentication in Authentik for admins
- [ ] **Firewall**: Only ports 80, 443, 22 exposed externally
- [ ] **fail2ban**: Configured to ban IPs after failed login attempts
- [ ] **SSH Hardening**: 
  - Disable root login
  - Disable password authentication
  - Use SSH keys only
  - Change default SSH port (optional)
- [ ] **Database Security**:
  - Strong passwords
  - Restrict network access
  - Enable SSL/TLS connections
  - Regular security patches
- [ ] **Container Security**:
  - Use rootless containers (Podman) if possible
  - Run containers as non-root user
  - Set resource limits (CPU, memory)
  - Keep images updated
- [ ] **Application Security**:
  - Input validation enabled
  - SQL injection protection (using GORM ORM)
  - XSS protection (Svelte automatic escaping)
  - CSRF protection (OAuth state parameter)
  - Rate limiting enabled
- [ ] **Security Updates**: Automated security patch installation
- [ ] **Audit Logging**: All authentication and critical operations logged
- [ ] **Backup Encryption**: Backups encrypted at rest

### Security Headers Configuration

Add these headers to your reverse proxy (Nginx/Caddy):

```nginx
# Nginx example
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

For complete security guidance, see [Security Overview](../security/overview.md).

---

## Database Setup

### Managed Database (Recommended for Production)

Using a managed PostgreSQL service provides automatic backups, scaling, and maintenance.

**Recommended Providers:**
- **AWS RDS** (PostgreSQL)
- **Google Cloud SQL** (PostgreSQL)
- **Azure Database** for PostgreSQL
- **DigitalOcean Managed Databases**
- **Heroku Postgres**
- **Supabase** (PostgreSQL with additional features)

**Setup Steps:**

1. **Create managed PostgreSQL instance**
2. **Configure connection in `.env`:**
   ```bash
   DB_HOST=your-managed-db-host.aws.com
   DB_PORT=5432
   DB_NAME=portfolio
   DB_USER=portfolio_user
   DB_PASSWORD=STRONG_PASSWORD_HERE
   DB_SSLMODE=require  # Enable SSL
   ```

3. **Run database initialization:**
   ```bash
   ./init-db.sh
   ```

### Self-Hosted PostgreSQL

If self-hosting PostgreSQL:

1. **Use persistent volumes** (critical for data persistence)
2. **Configure backups** (see Backup section)
3. **Set resource limits:**
   ```yaml
   # docker-compose.yml
   postgres:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 4G
         reservations:
           memory: 2G
   ```

4. **Enable connection pooling** (PgBouncer recommended for high traffic)

---

## Backup & Recovery

Automated backups are **critical** for production deployments.

### Automated Backup Script

Portfolio Manager includes a backup script: `scripts/backup.sh`

**Configure automated daily backups:**

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Test backup
./scripts/backup.sh

# Schedule daily backups via cron
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/portfolio-manager/scripts/backup.sh
```

**Backup script features:**
- ✅ PostgreSQL database dump
- ✅ Authentik configuration export
- ✅ Environment files backup
- ✅ Compression (gzip)
- ✅ Timestamp in filename
- ✅ Retention policy (keeps last 30 days)

### Backup Storage

Store backups in multiple locations:

1. **Local server** (immediate access)
2. **Remote storage** (S3, Google Cloud Storage, Backblaze B2)
3. **Offline backup** (periodic download to local machine)

**Example: Sync to S3**
```bash
# Install AWS CLI
apt install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3 (add to backup script)
aws s3 sync /opt/portfolio-manager/backups/ s3://your-bucket/portfolio-backups/ \
  --storage-class GLACIER --delete
```

### Test Restore Procedure

**Test your backups regularly!**

```bash
# Restore from backup
./scripts/restore.sh /path/to/backup-2025-12-11.tar.gz

# Verify data integrity
# - Log in to application
# - Check portfolios exist
# - Verify user accounts work
```

For detailed backup procedures, see [How to Backup](../how-to-do/how-to-backup.md).

---

## Monitoring & Observability

### Prometheus + Grafana Stack

Portfolio Manager includes built-in monitoring:

**Start monitoring stack:**
```bash
# In docker-compose
docker compose --profile monitoring up -d

# OR in Kubernetes
kubectl apply -f k8s/monitoring/
```

**Access Grafana:**
- URL: `http://your-server:3001` or `https://grafana.portfolio.example.com`
- Default credentials: `admin` / `admin` (change immediately!)

**Pre-configured Dashboards:**
- Application metrics (request rate, latency, errors)
- Database metrics (connections, query performance)
- Container metrics (CPU, memory, disk)
- Authentik metrics (login attempts, failures)

### Configure Alerts

Set up alerts in Grafana for:
- [ ] API error rate > 5%
- [ ] Database connection pool exhausted
- [ ] Disk usage > 80%
- [ ] Memory usage > 90%
- [ ] Failed login attempts spike
- [ ] Certificate expiration (< 30 days)

**Alert notification channels:**
- Email
- Slack
- PagerDuty
- Webhooks

For detailed monitoring setup, see [How to Monitor](../how-to-do/how-to-monitor.md).

### Logging

**Centralized logging** (optional but recommended for production):
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki + Grafana**
- **Cloud logging** (CloudWatch, Stackdriver, Azure Monitor)

**Enable structured logging:**
```bash
# Backend .env
LOG_FORMAT=json
LOG_LEVEL=info
```

---

## Deployment Scripts

Portfolio Manager provides deployment automation scripts in `scripts/`:

### Available Scripts

| Script | Purpose |
|--------|---------|
| `setup-vultr-server.sh` | Automated server setup (Vultr/VPS) |
| `deploy.sh` | Deploy/update application |
| `backup.sh` | Backup database and config |
| `restore.sh` | Restore from backup |
| `list-backups.sh` | List available backups |
| `cleanup-images.sh` | Clean up old container images |

### Using Deploy Script

```bash
# Initial deployment
./scripts/deploy.sh

# Update deployment (pulls latest code, rebuilds containers)
./scripts/deploy.sh --update

# Rollback to previous version
./scripts/deploy.sh --rollback
```

**Deploy script features:**
- ✅ Git pull latest code
- ✅ Build containers
- ✅ Run database migrations
- ✅ Restart services with zero-downtime
- ✅ Health check verification
- ✅ Rollback on failure

---

## Post-Deployment

### Verification Steps

After deployment, verify everything works:

1. **Check services are running:**
   ```bash
   docker compose ps
   # OR
   kubectl get pods
   ```

2. **Test endpoints:**
   ```bash
   # Backend health
   curl https://api.portfolio.example.com/health
   # Should return: {"status":"healthy"}
   
   # Frontend loads
   curl -I https://portfolio.example.com
   # Should return: 200 OK
   
   # Authentik health
   curl -I https://auth.portfolio.example.com/-/health/live/
   # Should return: 204 No Content
   ```

3. **Test authentication flow:**
   - Open `https://portfolio.example.com` in browser
   - Click "Login"
   - Complete OAuth flow
   - Verify successful login

4. **Create test portfolio:**
   - Log in
   - Create a new portfolio
   - Verify it's saved to database

5. **Check monitoring:**
   - Open Grafana
   - Verify metrics are being collected
   - Check dashboards display data

### Configure Authentik for Production

Complete Authentik setup:
1. Enable enrollment flow for user registration
2. Configure email provider for verification
3. Enable 2FA for admin accounts
4. Set up user groups and permissions
5. Configure branding and customization

See [Authentik Setup Guide](../authentication/authentik-setup.md).

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check monitoring alerts
- [ ] Review error logs
- [ ] Verify backup completed successfully

#### Weekly
- [ ] Review application metrics
- [ ] Check disk usage
- [ ] Review failed login attempts
- [ ] Test one backup restore

#### Monthly
- [ ] Update application to latest stable version
- [ ] Rotate secrets and credentials
- [ ] Review and update firewall rules
- [ ] Security patch application
- [ ] Review user access and permissions
- [ ] Prune old container images and volumes

#### Quarterly
- [ ] Full disaster recovery test
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Update SSL certificates (if not automated)
- [ ] Review and update documentation

### Update Procedure

```bash
# 1. Backup before update
./scripts/backup.sh

# 2. Pull latest code
git pull origin main

# 3. Review changelog
cat CHANGELOG.md

# 4. Update containers
docker compose pull
docker compose up -d --build

# 5. Run database migrations (if any)
make migrate

# 6. Verify deployment
curl https://api.portfolio.example.com/health

# 7. Monitor for issues
docker compose logs -f
```

For rollback procedures, see [How to Rollback](../how-to-do/how-to-rollback.md).

---

## Related Documentation

- **[Local Development](local-development.md)** - Development setup
- **[Production-like Local](production-like-local.md)** - Test production configs locally
- **[How to Deploy to Production](../how-to-do/how-to-deploy-production.md)** - Step-by-step Vultr deployment
- **[How to Backup](../how-to-do/how-to-backup.md)** - Backup procedures
- **[How to Monitor](../how-to-do/how-to-monitor.md)** - Monitoring setup
- **[How to Rollback](../how-to-do/how-to-rollback.md)** - Rollback procedures
- **[Security Overview](../security/overview.md)** - Security best practices
- **[Authentik Setup](../authentication/authentik-setup.md)** - Authentication configuration

---

## Getting Help

**Issues or Questions?**
- Review [Troubleshooting Guide](../authentication/troubleshooting.md)
- Check [How to Investigate](../how-to-do/how-to-investigate.md)
- Open an issue on GitHub
- Check community discussions

**Emergency Support:**
- Review deployment logs: `docker compose logs -f`
- Check monitoring dashboards for anomalies
- Consult [How to Rollback](../how-to-do/how-to-rollback.md) if needed

---

**Last Updated**: 2025-12-11  
**Tested On**: Ubuntu 22.04 LTS, Kubernetes 1.28, Rocky Linux 9
