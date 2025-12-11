# Local Development Setup

Complete guide to setting up your local development environment for Portfolio Manager.

## Overview

This guide provides **three ways** to run and develop Portfolio Manager, depending on your needs:

1. **[Quick Dev](#quick-dev-minimal-setup)** - Minimal setup to start coding (recommended for beginners)
2. **[Production-like Local](#production-like-local)** - Run with production settings locally (HTTPS, external DB, reverse proxy)
3. **[Production](#production)** - Deploy to real infrastructure (Kubernetes, VPS, or cloud)

## Table of Contents

- [Quick Dev (Minimal Setup)](#quick-dev-minimal-setup)
  - [Prerequisites](#prerequisites)
  - [Setup Steps](#setup-steps)
  - [Configure Authentik](#configure-authentik)
  - [Start Coding](#start-coding)
  - [Using Bruno for API Testing](#using-bruno-for-api-testing)
  - [Common Issues](#common-issues)
- [Production-like Local](#production-like-local)
- [Production](#production)

---

## Quick Dev (Minimal Setup)

Get up and running in 5-10 minutes with minimal configuration. Perfect for starting development quickly.

### Prerequisites

#### Required Software

-  **Git** - Version control
  ```bash
  git --version  # Should be 2.x+
  ```

- **Docker** or **Podman** - Container runtime
  ```bash
  docker --version  # Should be 20.x+
  # OR
  podman --version  # Should be 4.x+
  ```

- **Make** - Build automation (usually pre-installed on Linux/Mac)
  ```bash
  make --version
  ```

#### Optional Tools

- **Bruno** or **Postman** - API testing
- **pgAdmin** or **DBeaver** - Database management
- **VS Code** - Recommended IDE

### Setup Steps

#### 1. Clone Repository

```bash
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager
```

#### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

#### 3. Start All Services

```bash
make up
```

This starts:
- Backend API (port 8000)
- Frontend (port 3000)
- PostgreSQL database (port 5432)
- Authentik (ports 9000, 9443)
- Prometheus & Grafana (ports 9090, 3001)

#### 4. Watch Service Logs

Open two terminal windows to monitor backend and frontend:

```bash
# Terminal 1: Backend logs
make backend-logs

# Terminal 2: Frontend logs
make frontend-logs
```

#### 5. Verify Services

```bash
make health
```

Expected output:
```
✓ Backend: http://localhost:8000/health
✓ Frontend: http://localhost:3000
✓ Database: PostgreSQL running
✓ Authentik: http://localhost:9000
```

### Configure Authentik

Before you can log in to the frontend, you need to configure Authentik (the authentication service).

#### Step 1: Access Authentik Initial Setup

1. Open browser: `http://localhost:9000/if/flow/initial-setup/`
2. Create admin account:
   - Email: `admin@example.com` (or your email)
   - Username: `admin`
   - Password: (choose a strong password)

#### Step 2: Create OAuth2/OIDC Provider

1. Log in to Authentik: `http://localhost:9000/`
2. Navigate to **Applications** → **Providers** → **Create**
3. Select **OAuth2/OpenID Provider**
4. Fill in the following:

   **Basic Settings:**
   - **Name**: `Portfolio Manager Provider`
   - **Authentication flow**: `default-authentication-flow`
   - **Authorization flow**: `default-provider-authorization-explicit-consent`

   **Protocol Settings:**
   - **Client type**: `Public` ⚠️ **CRITICAL: Must be Public, NOT Confidential!**
   - **Client ID**: `portfolio-manager` (must match exactly)

   **Redirect URIs** (click "+ Add" for each):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/
   ```

   **Advanced Settings:**
   - **Signing Key**: `authentik Self-signed Certificate`
   - **Include claims in id_token**: ✅ Checked

   **Scopes**: Add these (should be available by default):
   - `openid`
   - `email`
   - `profile`

5. Click **Create**

#### Step 3: Create Application

1. Navigate to **Applications** → **Applications** → **Create**
2. Fill in:
   - **Name**: `Portfolio Manager`
   - **Slug**: `portfolio-manager` (must match exactly)
   - **Provider**: `Portfolio Manager Provider` (the one you just created)
   - **Launch URL**: `http://localhost:3000`

3. Click **Create**

#### Step 4: Verify Configuration

Your configuration should match these values:

| Setting | Value |
|---------|-------|
| Authentik URL | `http://localhost:9000` |
| Client ID | `portfolio-manager` |
| Redirect URI | `http://localhost:3000/auth/callback` |
| Issuer | `http://localhost:9000/application/o/portfolio-manager/` |
| Frontend Callback Page | `/auth/callback` (file: `frontend/src/routes/auth/callback/+page.svelte`) |

**Note**: The frontend callback route is defined at `frontend/src/routes/auth/callback/+page.svelte`.

For more detailed Authentik setup, see:
- [Authentik Quick Start Guide](../authentication/authentik-quickstart.md)
- [Authentik Complete Setup](../authentication/authentik-setup.md)
- [Troubleshooting Guide](../authentication/troubleshooting.md)

### Start Coding

You're now ready to start developing! Here are the essential commands:

#### Run Development Servers

```bash
# Backend (if not using containers)
cd backend
go run cmd/api/main.go

# Frontend (if not using containers)
cd frontend
npm install
npm run dev
```

**Note**: When using `make up`, backend and frontend are already running in containers. Use the commands above only if developing outside containers.

#### Run Tests

```bash
# All tests
make test

# Backend only
make test-backend

# Frontend only
make test-frontend

# With coverage
make test-coverage
```

#### Hot Reload

- **Frontend**: Automatically reloads on file changes (via SvelteKit)
- **Backend**: Restart with `make backend-restart` after code changes

For backend hot reload during development, see `backend/README.md` for development mode.

#### Code Quality

```bash
# Lint backend
make lint-backend

# Lint frontend
make lint-frontend

# Format code
make format
```

### Using Bruno for API Testing

Bruno is a lightweight API testing tool (alternative to Postman).

#### Import Bruno Collection

1. Install Bruno from [https://www.usebruno.com/](https://www.usebruno.com/)
2. Open Bruno
3. Click **"Import Collection"**
4. Navigate to your repository and select:
   ```
   http_request_test/bruno-collection/bruno.json
   ```
5. Set environment variables in Bruno:
   - `baseUrl`: `http://localhost:8000`
   - `authUrl`: `http://localhost:9000`

6. Start making API requests!

**API Endpoints to Try:**
- `GET /health` - Backend health check
- `GET /api/portfolios/own` - Get user's portfolios (requires auth token)

For manual testing with curl:

```bash
# Health check
curl http://localhost:8000/health

# Get portfolios (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/portfolios/own
```

### Common Issues

Here's a checklist of common issues and how to fix them:

#### ❌ "Invalid client identifier" or Login Errors

**Cause**: Authentik OAuth2 client not configured or mismatched client ID.

**Fix**:
- [ ] Verify **Client ID** in Authentik Provider is exactly `portfolio-manager`
- [ ] Verify **Application Slug** in Authentik Application is exactly `portfolio-manager`
- [ ] Ensure both redirect URIs are added: `http://localhost:3000/auth/callback` and `http://localhost:3000/`
- [ ] Restart backend/frontend: `make backend-restart && make frontend-restart`

#### ❌ Redirect URI Mismatch

**Cause**: Redirect URI in Authentik doesn't match frontend callback URL.

**Fix**:
- [ ] Exact redirect URI must be: `http://localhost:3000/auth/callback` (no trailing slash)
- [ ] Check frontend `.env` has `VITE_REDIRECT_URI=http://localhost:3000/auth/callback`
- [ ] Update in Authentik: **Applications** → **Providers** → **Portfolio Manager Provider** → **Redirect URIs**

#### ❌ Issuer URL Mismatch

**Cause**: Backend `.env` issuer doesn't match Authentik application slug.

**Fix**:
- [ ] Backend `.env` should have: `AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/`
- [ ] Ensure slug is `portfolio-manager` (not `portfolio` or anything else)
- [ ] Restart backend: `make backend-restart`

#### ❌ CORS Errors

**Cause**: Backend not allowing requests from frontend origin.

**Fix**:
- [ ] Check backend `.env` has: `ALLOWED_ORIGINS=http://localhost:3000`
- [ ] Verify Authentik is accessible from frontend
- [ ] Restart backend: `make backend-restart`

#### ❌ Client Secret Issues (Public Client)

**Note**: Public clients (browser apps) should NOT use client secrets. If you set Client Type to "Confidential" by mistake:

**Fix**:
- [ ] In Authentik Provider, change **Client type** to `Public`
- [ ] Remove `AUTHENTIK_CLIENT_SECRET` from backend `.env` (not needed for Public clients with PKCE)
- [ ] Restart backend: `make backend-restart`

#### ❌ Authentik Containers Not Healthy

**Cause**: Authentik services failed to start properly.

**Fix**:
```bash
# Check container status
docker ps | grep authentik
# OR
podman ps | grep authentik

# View Authentik logs
make authentik-logs

# Restart Authentik
make authentik-restart

# If still failing, check database
make db-logs
```

For more troubleshooting, see:
- [Authentication Troubleshooting Guide](../authentication/troubleshooting.md)
- [How to Investigate Issues](../how-to-do/how-to-investigate.md)

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:8000 | N/A (JWT auth) |
| API Docs | http://localhost:8000/api | N/A |
| Frontend | http://localhost:3000 | Via Authentik |
| Authentik | http://localhost:9000 | See setup docs |
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | None |
| Database (Adminer) | http://localhost:8080 | postgres/postgres |

## Production-like Local

Run Portfolio Manager locally with production-like settings including HTTPS, local domain, and production configuration. This helps catch production issues early in development.

**When to use this mode:**
- Testing production configurations locally
- Debugging HTTPS-related issues
- Testing with production-like security settings
- Validating deployment before going to production

For detailed step-by-step instructions, see the dedicated guide:
**[Production-like Local Setup Guide →](production-like-local.md)**

### Quick Overview

Production-like local setup includes:
- **HTTPS/TLS**: Self-signed certificates or mkcert for local HTTPS
- **Local Domain**: Custom domain (e.g., `portfolio.local`) via `/etc/hosts`
- **Production Compose**: Use `podman-compose.prod.yml` or `docker-compose.prod.yml` overlays
- **Reverse Proxy**: Nginx or Caddy for routing and TLS termination
- **External Database**: Optional managed PostgreSQL instance
- **Production Settings**: Environment variables match production configuration

### Example Command

```bash
# Using production compose overlay
podman compose -f podman-compose.yml -f podman-compose.prod.yml up -d

# OR with Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Key Differences from Quick Dev

| Aspect | Quick Dev | Production-like Local |
|--------|-----------|----------------------|
| Protocol | HTTP | HTTPS (TLS) |
| Domain | localhost | Custom domain (e.g., portfolio.local) |
| Certificates | None | Self-signed or mkcert |
| Reverse Proxy | None | Nginx or Caddy |
| Environment | Development defaults | Production flags enabled |
| Database | Local container | Can use external/managed DB |
| Authentik URLs | http://localhost:9000 | https://auth.portfolio.local |

See **[production-like-local.md](production-like-local.md)** for complete setup instructions.

---

## Production

Deploy Portfolio Manager to real production infrastructure with proper security, monitoring, and backup procedures.

**When to use this mode:**
- Deploying to cloud providers (AWS, GCP, Azure, DigitalOcean, Vultr)
- Setting up on dedicated servers
- Kubernetes deployments
- Production-ready infrastructure

For comprehensive deployment guidance, see:
**[Production Deployment Guide →](production.md)**

### Quick Overview

Production deployments support multiple patterns:
- **Kubernetes**: Scalable orchestration (recommended for large deployments)
- **Dedicated Host**: Podman/Docker on VPS or dedicated server
- **Docker Compose**: Simple deployments for small teams

### Critical Production Checklist

- [ ] **HTTPS Everywhere**: Valid TLS certificates (Let's Encrypt)
- [ ] **Secret Management**: Secure secret storage, regular rotation
- [ ] **Database Backups**: Automated daily backups, tested restore
- [ ] **Monitoring**: Prometheus + Grafana with alerting
- [ ] **Security Hardening**: Firewall, fail2ban, 2FA enabled
- [ ] **Resource Limits**: CPU/memory limits configured
- [ ] **Logging**: Centralized logging and audit trail
- [ ] **Updates**: Security patches applied regularly

### Production Resources

- **Deployment Script**: `scripts/deploy.sh`
- **Backup Script**: `scripts/backup.sh`
- **Database Init**: `init-db.sh`
- **Security Guide**: [docs/security/overview.md](../security/overview.md)

### Example Deployment Guides

- [How to Deploy to Production](../how-to-do/how-to-deploy-production.md) - Step-by-step Vultr deployment
- [Production Deployment Patterns](production.md) - Kubernetes, VPS, and Docker Compose
- [How to Backup](../how-to-do/how-to-backup.md) - Backup and restore procedures
- [How to Monitor](../how-to-do/how-to-monitor.md) - Monitoring setup

See **[production.md](production.md)** for complete production deployment documentation.

---

## Additional Development Resources

### Backend Development

```bash
# Watch backend logs
make backend-logs

# Restart backend only
make backend-restart

# Run backend tests
make test-backend

# Access backend shell
make backend-shell
```

### Frontend Development

```bash
# Watch frontend logs
make frontend-logs

# Restart frontend only
make frontend-restart

# Run frontend tests
make test-frontend

# Install frontend dependencies
make frontend-install
```

### Database Operations

```bash
# View database logs
make db-logs

# Access PostgreSQL shell
make db-shell

# Run migrations
make migrate

# Reset database (WARNING: deletes all data)
make db-reset
```

## Common Development Tasks

### Running Tests

```bash
# All tests
make test

# Backend only
make test-backend

# Frontend only
make test-frontend

# With coverage
make test-coverage
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
make backend-logs
make frontend-logs
make db-logs
make authentik-logs
```

### Code Quality

```bash
# Lint backend
make lint-backend

# Lint frontend
make lint-frontend

# Format code
make format
```

## Troubleshooting

### Port Already in Use

If ports are already in use:

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

Common ports to check: 8000, 3000, 5432, 9000, 9090, 3001

### Database Connection Refused

```bash
# Restart database
make db-restart

# Check database is running
docker ps | grep postgres
# OR
podman ps | grep postgres

# View database logs
make db-logs
```

### Authentication Issues

```bash
# Restart Authentik
make authentik-restart

# Check Authentik logs
make authentik-logs

# Reset Authentik (WARNING: loses users)
make authentik-reset
```

### Services Won't Start

```bash
# Stop everything
make down

# Clean volumes (WARNING: deletes data)
make clean

# Start fresh
make up
```

## IDE Setup

### VS Code

Recommended extensions:
- **Go** - For backend development
- **Svelte** - For frontend development
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **REST Client** - API testing
- **Database Client** - Database management

### GoLand / WebStorm

JetBrains IDEs work great with this project. Import as Go/Node.js project respectively.

## Environment Variables

Key variables in `.env`:

```bash
# Backend
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=postgres

# Authentik
AUTHENTIK_URL=http://localhost:9000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio/

# Frontend
VITE_API_URL=http://localhost:8000
VITE_AUTHENTIK_URL=http://localhost:9000
```

## IDE Setup

### VS Code

Recommended extensions:
- **Go** - For backend development
- **Svelte** - For frontend development
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **REST Client** - API testing
- **Database Client** - Database management

### GoLand / WebStorm

JetBrains IDEs work great with this project. Import as Go/Node.js project respectively.

## Environment Variables

Key variables in `.env`:

```bash
# Backend
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=postgres

# Authentik
AUTHENTIK_URL=http://localhost:9000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/

# Frontend
VITE_API_URL=http://localhost:8000
VITE_AUTHENTIK_URL=http://localhost:9000
```

## Database Access

### Using Adminer (Web UI)

1. Go to http://localhost:8080
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: portfolio

### Using psql (Command Line)

```bash
make db-shell
```

Then run SQL:
```sql
\dt                    -- List tables
SELECT * FROM portfolios LIMIT 10;
\q                     -- Quit
```

## Next Steps

- See [Development Guide](../development/) for architecture details
- See [API Documentation](../api/) for endpoint reference
- See [Authentication Setup](../authentication/) for configuring Authentik
- See [How-To Guides](../how-to-do/) for specific tasks
- See [Production-like Local Setup](production-like-local.md) for testing with production settings
- See [Production Deployment](production.md) for deploying to real infrastructure

## Getting Help

- Check [Troubleshooting Guide](../authentication/troubleshooting.md)
- Review [How to Investigate](../how-to-do/how-to-investigate.md)
- Open an issue on GitHub
- Check existing documentation in `/docs`
