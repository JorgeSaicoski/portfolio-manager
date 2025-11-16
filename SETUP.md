# Portfolio Manager - Setup Guide

Complete setup guide to get Portfolio Manager running on your local machine.

**⏱️ Estimated time:** 15-20 minutes (5-10 with Makefile automation)

## 🚀 Quick Start (Recommended)

**Using Makefile automation** - fastest way to get started:

```bash
# 1. Clone repository
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager

# 2. Run automated setup
make setup

# 3. Generate secure secrets
make generate-secrets
# Copy the output to your .env file

# 4. Start all services
make start

# 5. Follow Authentik configuration guide
make authentik-guide

# 6. Verify everything works
make verify-setup
```

**Time saved:** ~10 minutes with automated commands!

📖 **Full Makefile reference:** [docs/MAKEFILE_GUIDE.md](docs/MAKEFILE_GUIDE.md)

---

## Manual Setup (Step by Step)

Prefer to understand each step? Follow the detailed instructions below.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Starting Services](#starting-services)
5. [Configure Authentication](#configure-authentication)
6. [Verify Installation](#verify-installation)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Podman 4.0+** - Container runtime
  - **Installation:** See [docs/deployment/podman.md](docs/deployment/podman.md)
  - **Verify:** `podman --version`
  - **Why Podman?** Rootless, secure, daemonless container runtime

### Optional (for development)

- **Go 1.21+** - Backend development
  - Download: https://go.dev/dl/
  - Verify: `go version`

- **Node.js 18+** - Frontend development
  - Download: https://nodejs.org/
  - Verify: `node --version`

### System Requirements

- **OS:** Linux, macOS, or Windows (with WSL2)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 10GB free space
- **Network:** Internet connection for initial setup

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager
```

### Step 2: Create Environment File

**Option A: Using Makefile (Automated)**

```bash
make create-env
```

This automatically creates `.env` from `.env.example` and backs up any existing file.

**Option B: Manual Creation**

Create a `.env` file in the project root:

```bash
# Copy from .env in the repo or create manually
cp .env .env.backup  # Backup existing if any
nano .env
```

**Minimal `.env` configuration:**

```env
# Database Configuration
POSTGRES_DB=portfolio_db
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=your_secure_password_here_change_this

# Authentik Configuration
AUTHENTIK_SECRET_KEY=generate_with_openssl_rand_base64_60
AUTHENTIK_DB_NAME=authentik
AUTHENTIK_LOG_LEVEL=info

# Authentik OAuth2 (will be configured in step 5)
AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager
AUTHENTIK_CLIENT_SECRET=will_be_generated_by_authentik

# Backend Configuration
PORT=8000
LOG_LEVEL=info
GIN_MODE=release
ALLOWED_ORIGINS=http://localhost:3000

# Frontend will use defaults
```

**Generate secure secrets:**

**Option A: Using Makefile (Automated)**

```bash
make generate-secrets
```

This generates all required secrets in one command. Copy the output to your `.env` file.

**Option B: Manual Generation**

```bash
# Generate AUTHENTIK_SECRET_KEY
openssl rand -base64 60

# Generate strong passwords
openssl rand -base64 32
```

---

## Configuration

### Network Setup (Optional)

**Option A: Using Makefile (Automated)**

```bash
make network-create
```

**Option B: Manual Creation**

If using custom networks or running on a server:

```bash
# Create custom network (optional)
podman network create portfolio-network
```

### Database Initialization

The database will be automatically initialized on first start. Two databases are created:
- `portfolio_db` - Application data
- `authentik` - Authentication data

---

## Starting Services

### Start All Services

**Option A: Using Makefile (Recommended)**

```bash
# Start all services
make start

# Check status
make status

# View logs
make logs
```

**Option B: Manual Command**

```bash
# Start in detached mode (recommended)
podman compose up -d

# Or with logs visible (for debugging)
podman compose up
```

**Expected output:**

```
[+] Running 6/6
 ✔ Container portfolio-postgres        Started
 ✔ Container portfolio-redis           Started
 ✔ Container portfolio-authentik-worker Started
 ✔ Container portfolio-authentik-server Started
 ✔ Container portfolio-backend         Started
 ✔ Container portfolio-frontend        Started
```

### Verify Services are Running

**Using Makefile:**

```bash
make status
```

**Manual command:**

```bash
podman compose ps
```

All services should show status `Up` or `healthy`.

### Check Service Logs

**Using Makefile:**

```bash
# All services
make logs

# Specific services
make logs-backend
make logs-frontend
make logs-authentik
make logs-db
```

**Manual commands:**

```bash
# All services
podman compose logs

# Specific service
podman compose logs portfolio-backend
podman compose logs portfolio-authentik-server

# Follow logs in real-time
podman compose logs -f
```

---

## Configure Authentication

**⚠️ CRITICAL STEP** - Without this, you cannot login!

Authentik provides OAuth2/OIDC authentication but requires manual configuration.

### Quick Reference

**Using Makefile:**

```bash
# Print step-by-step configuration guide
make authentik-guide

# Open Authentik in browser
make open-authentik
```

### Step 5.1: Access Authentik Setup

1. **Open your browser** and navigate to:
   ```
   http://localhost:9000/if/flow/initial-setup/
   ```

2. **Create Admin Account:**
   - Email: `your-email@example.com`
   - Username: `admin`
   - Password: Choose a strong password

3. **Login to Authentik:**
   ```
   http://localhost:9000/
   ```

### Step 5.2: Create OAuth2 Provider

**Quick setup (5 minutes):**

📖 **Follow:** [docs/authentication/authentik-quickstart.md](docs/authentication/authentik-quickstart.md)

**Summary:**
1. Applications → Providers → Create
2. Select "OAuth2/OpenID Provider"
3. Set Client ID: `portfolio-manager`
4. Set Redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/`
5. Copy the generated **Client Secret**
6. Update `.env` with the client secret

### Step 5.3: Create Application

1. Applications → Applications → Create
2. Name: `Portfolio Manager`
3. Slug: `portfolio-manager`
4. Link to the provider created above

### Step 5.4: Enable User Registration

**Allow users to self-register (5 minutes):**

📖 **Follow:** [docs/authentication/enrollment-setup.md](docs/authentication/enrollment-setup.md)

**⚠️ Important:** Don't forget to add the **username field** to the enrollment prompt! See the enrollment guide for details.

**Summary:**
1. Create enrollment flow with username field
2. System → Brands → Set Enrollment flow
3. Test at `http://localhost:9000/if/flow/default-enrollment-flow/`

### Step 5.5: Update Environment & Restart

**Using Makefile:**

```bash
# Edit .env and add the client secret from step 5.2
nano .env

# Update AUTHENTIK_CLIENT_SECRET=<paste-secret-here>

# Restart services to pick up new configuration
make restart-backend restart-frontend
```

**Manual commands:**

```bash
# Edit .env and add the client secret from step 5.2
nano .env

# Update AUTHENTIK_CLIENT_SECRET=<paste-secret-here>

# Restart backend to pick up new configuration
podman compose restart portfolio-backend portfolio-frontend
```

---

## Verify Installation

### Automated Health Check

**Using Makefile (Recommended):**

```bash
make verify-setup
```

This automatically tests all service endpoints and displays their status.

**View all service URLs:**

```bash
make urls
```

### Manual Verification

Test each service:

| Service | URL | Expected Result |
|---------|-----|-----------------|
| **Frontend** | http://localhost:3000 | Portfolio Manager homepage |
| **Backend Health** | http://localhost:8000/health | `{"status":"healthy"}` |
| **Authentik** | http://localhost:9000 | Authentik login page |
| **Prometheus** | http://localhost:9090 | Prometheus UI (if enabled) |
| **Grafana** | http://localhost:3001 | Grafana dashboard (if enabled) |

### Test Authentication Flow

1. **Register a user:**
   - Go to http://localhost:3000/auth/register
   - Fill in username, email, name, password
   - Submit - you'll be redirected to Authentik
   - Complete registration

2. **Login:**
   - Go to http://localhost:3000/auth/login
   - You'll be redirected to Authentik
   - Login with your credentials
   - You should be redirected back to the app

3. **Access API:**
   ```bash
   # After logging in, your frontend will have a token
   # Test an authenticated endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/portfolios/own
   ```

---

## Troubleshooting

### Services Won't Start

**Using Makefile:**

```bash
# Check service status
make status

# View logs for errors
make logs-backend
make logs-authentik

# Common fixes:
make stop
make start
```

**Manual commands:**

```bash
# Check service status
podman compose ps

# View logs for errors
podman compose logs portfolio-backend
podman compose logs portfolio-authentik-server

# Common fixes:
podman compose down
podman compose up -d
```

### "Invalid client identifier" Error

**Cause:** OAuth2 provider not created in Authentik

**Fix:** Follow Step 5.2 above to create the provider

📖 **Detailed fix:** [docs/authentication/authentik-quickstart.md](docs/authentication/authentik-quickstart.md)

### Registration Fails with "Aborting write to empty username"

**Cause:** Enrollment flow missing username field

**Fix:** Add username prompt to enrollment flow

📖 **Detailed fix:** [docs/authentication/enrollment-setup.md](docs/authentication/enrollment-setup.md#add-username-field)

### Backend Returns 401 Unauthorized

**Causes:**
- Token expired
- Client secret mismatch
- AUTHENTIK_ISSUER incorrect

**Fixes:**
1. Verify `.env` has correct `AUTHENTIK_CLIENT_SECRET`
2. Check `AUTHENTIK_ISSUER=http://localhost:9000/application/o/portfolio-manager/`
3. Check configuration: `make env-check`
4. Restart backend: `make restart-backend` or `podman compose restart portfolio-backend`

### Database Connection Errors

```bash
# Check if PostgreSQL is running
podman compose ps portfolio-postgres

# View database logs
podman compose logs portfolio-postgres

# Verify connection string in .env
# DB_HOST should be 'localhost' (not 'portfolio-postgres' unless in container)
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :3000  # or :8000, :9000, :5432

# Kill the process or change port in docker-compose.yml
```

### Clear All Data and Restart

**Using Makefile:**

```bash
# WARNING: This deletes all data!
make clean
make start
```

**Manual commands:**

```bash
# WARNING: This deletes all data!
podman compose down -v
podman volume prune
podman compose up -d
```

---

## Next Steps

### For Users

1. **Create your first portfolio**
   - Login to http://localhost:3000
   - Click "New Portfolio"
   - Add projects and sections

2. **Explore the API**
   - API Documentation: [docs/api/](docs/api/)
   - Try the endpoints with Bruno or curl

### For Developers

1. **Set up development environment**
   - See [docs/development/getting-started.md](docs/development/getting-started.md)
   - Frontend guide: [docs/development/frontend.md](docs/development/frontend.md)
   - Backend guide: [docs/development/backend.md](docs/development/backend.md)

2. **Run tests**
   - `make test` - Run all tests
   - `make test-backend-coverage` - Generate coverage report
   - Testing guide: [docs/development/testing.md](docs/development/testing.md)

3. **Contribute**
   - Read [CONTRIBUTING.md](CONTRIBUTING.md)
   - Check open issues on GitHub

### For Production Deployment

📖 **Production Guide:** [docs/deployment/production.md](docs/deployment/production.md)

**Key considerations:**
- Use HTTPS (configure reverse proxy)
- Set strong secrets
- Enable monitoring
- Configure backups
- Use external database (optional)
- Set up CI/CD

---

## 🔧 Troubleshooting

### Cannot Login / Authentication Fails

**Problem:** Clicking "Sign In with Authentik" shows errors or doesn't work.

**Solution:** Run the verification command first:
```bash
make verify-config
```

This will check your setup and identify the problem. Common issues:

1. **"Invalid client secret"** error (MOST COMMON)
   - **Symptom**: Login works, but callback fails after authorization
   - **Cause**: OAuth2 provider set to "Confidential" instead of "Public"
   - **Fix**:
     1. Open Authentik: http://localhost:9000/
     2. Go to: Applications → Providers → Edit your provider
     3. Change: Client type from `Confidential` to `Public`
     4. Save and test login again
   - **Why**: Frontend uses PKCE (for public clients), not client_secret
   - **See**: [docs/authentication/troubleshooting.md](docs/authentication/troubleshooting.md#error-invalid-client-secret)

2. **"Invalid client identifier"** error
   - OAuth2 provider not created in Authentik
   - Fix: Follow `make authentik-guide` Step 2

3. **"Connection refused"** to Authentik
   - Authentik service not running
   - Fix: `make start` or `podman compose up -d`

4. **Frontend can't reach backend**
   - Missing `frontend/.env` file
   - Fix: `cp frontend/.env.example frontend/.env`
   - Then restart: `cd frontend && npm run dev`

5. **Backend rejects valid tokens**
   - `AUTHENTIK_CLIENT_SECRET` still has placeholder value
   - Fix: Update `.env` with real secret from Authentik provider
   - Then: `make restart-backend`

### User Registration Not Working

**Problem:** Registration flow errors or users can't sign up.

**Most Common Issue: No Logs Appear in Authentik (404 Error)**

**Symptoms:**
- Click "Continue to Registration" → Authentik shows 404 error
- OR: Nothing happens after clicking registration button
- Authentik logs show NO registration activity (only health checks)

**Cause:** Enrollment flow `default-enrollment-flow` doesn't exist yet.

**Quick Check:**
1. Test URL directly: `http://localhost:9000/if/flow/default-enrollment-flow/`
   - 404 = Flow doesn't exist (need to create it)
   - Registration form = Flow exists (different issue)

2. Check logs for activity:
   ```bash
   podman compose logs portfolio-authentik-server | grep -i enrollment
   # Empty = Flow doesn't exist
   ```

**Solution:**
```bash
make authentik-guide
```
Follow Steps 4-8 carefully to create the enrollment flow:
- Step 4: Create username prompt with Field Key exactly `username`
- Step 5: Create User Write Stage
- Step 6: Create User Login Stage
- Step 7: Bind all 3 stages to enrollment flow (order 10, 20, 30)
- Step 8: Link flow to Brand

**Alternative (Quick Fix):**
Create users manually in Authentik:
1. Go to: http://localhost:9000/ → Directory → Users → Create
2. Set: Username, Email, Password, Active=Yes
3. User can login at: http://localhost:3000/auth/login

**Full Details:** See [docs/authentication/troubleshooting.md](docs/authentication/troubleshooting.md#error-registration-shows-404-or-no-logs-appear-in-authentik)

**Other Registration Issues:**
- Missing username field → Field Key must be exactly `username`
- Users not auto-assigned to groups → Add `users` group in User Write Stage

### Services Won't Start

**Problem:** `make start` fails or services crash.

**Check:**
```bash
# View logs
make logs

# Check specific service
podman compose logs portfolio-backend
podman compose logs portfolio-authentik-server
```

**Common issues:**
- Port already in use (stop other services on ports 3000, 8000, 9000, 5432)
- Missing .env file (`make create-env`)
- Database not initialized (wait 30s for first-time startup)

### Frontend Build Warnings

**Warning:** `Cannot find base config file "./.svelte-kit/tsconfig.json"`
- **Normal** on first run, auto-resolves after build
- Not a blocker

**Warning:** `Component has unused export property 'onLoginSuccess'`
- **Minor code quality** issue, not blocking
- Component still works fine

### Database Connection Failed

**Problem:** Backend logs show "failed to connect to database".

**Solution:**
```bash
# Check PostgreSQL is running
podman compose ps portfolio-postgres

# Check database health
podman compose exec portfolio-postgres pg_isready -U portfolio_user

# View database logs
podman compose logs portfolio-postgres
```

If database is unhealthy:
```bash
podman compose restart portfolio-postgres
```

### Quick Diagnostics

Run these commands to diagnose issues:

```bash
# 1. Verify configuration
make verify-config

# 2. Check all services
make status

# 3. View recent logs
make logs

# 4. Test service endpoints
curl http://localhost:9000/-/health/live/  # Authentik
curl http://localhost:8000/health          # Backend
curl http://localhost:3000                  # Frontend
```

### Still Having Issues?

1. Check detailed troubleshooting: [docs/authentication/troubleshooting.md](docs/authentication/troubleshooting.md)
2. View service logs: `make logs`
3. Restart all services: `make restart`
4. Try clean setup: `make clean && make setup && make start`

---

## Additional Resources

- **[Makefile Guide](docs/MAKEFILE_GUIDE.md)** - Complete automation reference
- **[API Reference](docs/api/)** - Complete API documentation
- **[Authentication Guide](docs/authentication/)** - Detailed auth setup
- **[Deployment Guide](docs/deployment/)** - Production deployment
- **[Security Guide](docs/security/)** - Security best practices
- **[Troubleshooting Guide](docs/authentication/troubleshooting.md)** - Common issues

---

## Getting Help

If you encounter issues not covered here:

1. **Check the documentation** in [docs/](docs/)
2. **Search existing issues** on GitHub
3. **Create a new issue** with:
   - Detailed problem description
   - Steps to reproduce
   - Logs from `podman compose logs`
   - Your environment (OS, Podman version, etc.)

---

**🎉 Congratulations!** You now have Portfolio Manager running locally.

**Happy portfolio building!**
