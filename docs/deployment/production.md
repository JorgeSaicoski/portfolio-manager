# Production Deployment Guide

Complete guide for deploying Portfolio Manager to production.

## Prerequisites

Before deploying to production, ensure you have:

- ✅ Domain name configured
- ✅ SSL/TLS certificates (Let's Encrypt recommended)
- ✅ Server with Docker/Podman installed
- ✅ Database backup strategy
- ✅ Monitoring configured
- ✅ All environment variables set

See [Pre-Production Checklist](todo-before-prod.md) for complete requirements.

## Production Architecture

```
Internet
    ↓
Load Balancer / Reverse Proxy (Nginx/Caddy)
    ↓
┌─────────────────────────────────────┐
│  Docker/Podman Host                 │
│  ├── Frontend (port 3000)           │
│  ├── Backend (port 8000)            │
│  ├── PostgreSQL (port 5432)         │
│  ├── Authentik (ports 9000, 9443)   │
│  ├── Redis (port 6379)              │
│  ├── Prometheus (port 9090)         │
│  └── Grafana (port 3001)            │
└─────────────────────────────────────┘
```

## Quick Deployment

### 1. Clone Repository

```bash
ssh user@your-server.com
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager
```

### 2. Configure Environment

```bash
cp .env.example .env.production
nano .env.production
```

**Critical variables:**
```bash
# Application
PORT=8000
GIN_MODE=release
NODE_ENV=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=portfolio_prod
DB_USER=portfolio_user
DB_PASSWORD=<strong-password>
DB_SSLMODE=require

# Authentik
AUTHENTIK_URL=https://auth.yourdomain.com
AUTHENTIK_ISSUER=https://auth.yourdomain.com/application/o/portfolio/

# Security
ALLOWED_ORIGINS=https://yourdomain.com
JWT_SECRET=<generate-secure-secret>

# Monitoring (optional)
PROMETHEUS_AUTH_USER=admin
PROMETHEUS_AUTH_PASSWORD=<strong-password>

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### 3. Deploy Services

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or with Make
make prod-deploy
```

### 4. Run Migrations

```bash
make migrate
```

### 5. Verify Deployment

```bash
# Check all services are running
docker ps

# Check health
curl https://yourdomain.com/health

# Check logs
docker logs backend
docker logs frontend
```

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

Using Caddy (automatic HTTPS):

```caddyfile
# Caddyfile
yourdomain.com {
    reverse_proxy frontend:3000
}

api.yourdomain.com {
    reverse_proxy backend:8000
}

auth.yourdomain.com {
    reverse_proxy authentik-server:9000
}
```

### Option 2: Nginx with Certbot

```nginx
# /etc/nginx/sites-available/portfolio
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Generate certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Configuration

### PostgreSQL Production Settings

Create production database:

```sql
-- Create database and user
CREATE DATABASE portfolio_prod;
CREATE USER portfolio_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE portfolio_prod TO portfolio_user;

-- Enable required extensions
\c portfolio_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Connection Pooling

Configure in `.env.production`:

```bash
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=300
```

### Backup Strategy

Set up automated backups:

```bash
# Add to cron
0 2 * * * /opt/portfolio-manager/scripts/backup-db.sh

# Or use Make
make backup
```

See [Backup & Restore](/docs/operations/backup-restore.md) for details.

## Security Hardening

### 1. Environment Variables

Never commit `.env` files:
```bash
# Ensure .env is in .gitignore
echo ".env*" >> .gitignore
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 3. Docker Security

```yaml
# docker-compose.prod.yml
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
```

### 4. Rate Limiting

Configure in `.env.production`:
```bash
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### 5. CORS Configuration

Strict CORS in production:
```bash
ALLOWED_ORIGINS=https://yourdomain.com
```

See [Security Overview](/docs/security/overview.md) for complete guide.

## Monitoring Setup

### Prometheus + Grafana

1. Configure Prometheus targets
2. Set up Grafana dashboards
3. Configure alerts

See [Monitoring Guide](/docs/deployment/monitoring/) for details.

### Application Metrics

Backend exposes metrics at `/metrics`:
```bash
curl https://api.yourdomain.com/metrics
```

### Health Checks

Configure uptime monitoring:
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

Monitor endpoints:
- `https://yourdomain.com/health`
- `https://api.yourdomain.com/health`
- `https://auth.yourdomain.com/health`

## Performance Optimization

### Backend

```bash
# Enable production optimizations in .env
GIN_MODE=release
LOG_LEVEL=warn
```

### Frontend

```bash
# Build optimized frontend
cd frontend
npm run build
```

### Database

```sql
-- Create indexes for frequent queries
CREATE INDEX idx_portfolios_owner ON portfolios(owner_id);
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_categories_portfolio ON categories(portfolio_id);
```

### Caching

Consider adding:
- Redis for session caching
- CDN for static assets
- HTTP caching headers

## Scaling

### Horizontal Scaling

Run multiple backend instances:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

Add load balancer (Nginx/HAProxy).

### Vertical Scaling

Increase resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Maintenance

### Zero-Downtime Deployments

```bash
# Pull new images
docker-compose pull

# Recreate services with no downtime
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

### Database Migrations

```bash
# Test migration in staging first
make migrate-dry-run

# Run migration
make migrate

# Rollback if needed
make migrate-rollback
```

### Backup Verification

Regularly test restores:
```bash
# Restore to test environment
make restore-test BACKUP=20250129_020000
```

## Troubleshooting Production Issues

### Service Won't Start

```bash
# Check logs
docker logs backend --tail 100

# Check resource usage
docker stats

# Check disk space
df -h
```

### High Memory Usage

```bash
# Restart service
docker restart backend

# Check for memory leaks
docker stats backend
```

### Database Connection Issues

```bash
# Check database is running
docker ps | grep postgres

# Check connections
docker exec postgres psql -U portfolio_user -c "SELECT count(*) FROM pg_stat_activity;"

# Check max connections
docker exec postgres psql -U portfolio_user -c "SHOW max_connections;"
```

### Performance Issues

```bash
# Check slow queries
docker exec postgres psql -U portfolio_user -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Enable query logging
# In .env: DB_LOG_LEVEL=debug
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop new version
docker-compose down

# 2. Checkout previous version
git checkout <previous-commit>

# 3. Deploy previous version
docker-compose up -d

# 4. Restore database if needed
make restore BACKUP=<backup-before-deploy>
```

See [How to Rollback](/docs/how-to-do/how-to-rollback.md) for detailed steps.

## Monitoring Checklist

After deployment, verify:

- [ ] All services running (`docker ps`)
- [ ] Health checks passing
- [ ] SSL certificates valid
- [ ] Monitoring dashboards showing data
- [ ] Alerts configured
- [ ] Backups running
- [ ] Logs being collected
- [ ] Error tracking configured

## Related Documentation

- [Pre-Production Checklist](todo-before-prod.md)
- [Monitoring Setup](/docs/deployment/monitoring/)
- [Backup & Restore](/docs/operations/backup-restore.md)
- [How to Deploy Production](/docs/how-to-do/how-to-deploy-production.md)
- [Security Guide](/docs/security/)

## Support

For production support:
- Check [Operations Guide](/docs/operations/)
- Review [How-To Guides](/docs/how-to-do/)
- Open GitHub issue for bugs
- Contact maintainers for critical issues
