# Makefile Guide

Complete reference for all `make` commands available in the Portfolio Manager project.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Command Reference](#command-reference)
3. [Common Workflows](#common-workflows)
4. [Troubleshooting](#troubleshooting)
5. [Advanced Usage](#advanced-usage)

---

## Quick Start

### First Time Setup

```bash
# 1. Initial setup (creates .env, generates secrets info, creates network)
make setup

# 2. Generate secure secrets
make generate-secrets
# Copy the output to your .env file

# 3. Start all services
make start

# 4. Follow Authentik configuration guide
make authentik-guide

# 5. Verify everything is working
make verify-setup
```

### Daily Development

```bash
# Start services
make start

# Check status
make status

# View logs
make logs

# Stop services
make stop
```

---

## Command Reference

### General Commands

#### `make help`
Display all available commands with descriptions.

```bash
make help
```

**Output**: Formatted list of all commands organized by category.

---

### Setup Commands

#### `make setup`
Complete initial setup for the project. Runs multiple setup tasks automatically.

```bash
make setup
```

**What it does**:
- ✅ Checks if Podman is installed
- ✅ Creates `.env` file from `.env.example`
- ✅ Displays instructions for generating secrets
- ✅ Creates Podman network
- ✅ Prints next steps

**When to use**: First time setting up the project on a new machine.

---

#### `make check-podman`
Verify that Podman is installed and accessible.

```bash
make check-podman
```

**Output**:
- ✅ Success: "✓ Podman found: podman version X.X.X"
- ❌ Error: "ERROR: Podman is not installed"

---

#### `make create-env`
Create `.env` file from `.env.example` template.

```bash
make create-env
```

**What it does**:
- Creates `.env` from `.env.example`
- Backs up existing `.env` to `.env.backup` if it exists
- Displays warning about setting `AUTHENTIK_CLIENT_SECRET`

**Note**: You must manually edit `.env` after creation to set proper values.

---

#### `make generate-secrets`
Generate secure random secrets for use in `.env` file.

```bash
make generate-secrets
```

**Output**:
```
Generated Secrets:

AUTHENTIK_SECRET_KEY:
aKKU5fS2l9UHiafks2SFLBC1PDnQAgwMLtnp84X97EJOUPySUmSRcsIQt1GJaqWO...

POSTGRES_PASSWORD:
8xJ2K9mN5vP7wQ4rT3sU1yX6zB0cD...

PROMETHEUS_AUTH_PASSWORD:
9fG8hJ7kL6mN5pQ4r...
```

**Action required**: Copy these values to your `.env` file.

---

#### `make network-create`
Create the Podman network for inter-container communication.

```bash
make network-create
```

**Network name**: `portfolio-network`

---

### Service Management

#### `make start`
Start all services in detached mode.

```bash
make start
```

**Services started**:
- PostgreSQL database
- Redis cache
- Authentik server + worker
- Backend API
- Frontend application

**What happens next**: Services run in background. Use `make status` to check health.

---

#### `make stop`
Stop all services (keeps containers).

```bash
make stop
```

**Note**: This only stops containers without removing them. Use `make down` to remove containers or `make clean` to remove everything.

---

#### `make down`
Stop and remove all containers (keeps volumes and data).

```bash
make down
```

**What it does**:
- Stops all running services
- Removes all containers
- Preserves volumes (database data)
- Preserves networks

**Use case**: Clean restart without losing data.

**Note**: To also delete volumes and data, use `make clean`.

---

#### `make restart`
Restart all services.

```bash
make restart
```

**Use case**: Apply configuration changes after editing `.env`.

---

#### `make restart-backend`
Restart only the backend service.

```bash
make restart-backend
```

**Use case**: After updating backend code or configuration.

---

#### `make restart-frontend`
Restart only the frontend service.

```bash
make restart-frontend
```

**Use case**: After updating frontend code or configuration.

---

#### `make restart-authentik`
Restart Authentik server and worker services.

```bash
make restart-authentik
```

**Use case**: After changing Authentik configuration in `.env`.

---

#### `make status`
Show the status of all services.

```bash
make status
```

**Output**: Table showing container names, status, and ports.

---

#### `make logs`
View logs from all services in follow mode (real-time).

```bash
make logs
```

**Tip**: Press `Ctrl+C` to exit log viewing.

---

#### `make logs-backend`
View only backend service logs.

```bash
make logs-backend
```

---

#### `make logs-frontend`
View only frontend service logs.

```bash
make logs-frontend
```

---

#### `make logs-authentik`
View Authentik server logs.

```bash
make logs-authentik
```

---

#### `make logs-db`
View PostgreSQL database logs.

```bash
make logs-db
```

---

### Health & Verification

#### `make verify-setup`
Run health checks on all services.

```bash
make verify-setup
```

**Checks performed**:
- Frontend accessibility (http://localhost:3000)
- Backend health endpoint (http://localhost:8000/health)
- Authentik accessibility (http://localhost:9000)
- Database connection

**Output**:
```
Verifying Service Health:

Frontend (http://localhost:3000):
Status: 200

Backend Health (http://localhost:8000/health):
✓ Healthy

Authentik (http://localhost:9000):
Status: 200

Database:
✓ Connected
```

---

#### `make health`
Alias for `make verify-setup`.

```bash
make health
```

---

### Development

#### `make dev-backend`
Start backend in development mode (runs locally, not in container).

```bash
make dev-backend
```

**Requirements**:
- Go 1.21+ installed
- Database running (`make start` only database)

**Use case**: Active backend development with hot reload.

---

#### `make dev-frontend`
Start frontend in development mode (runs locally, not in container).

```bash
make dev-frontend
```

**Requirements**:
- Node.js 18+ installed
- Backend and Authentik running

**Use case**: Active frontend development with hot reload.

---

#### `make build`
Build all container images.

```bash
make build
```

**When to use**: After changing Dockerfile or dependencies.

---

#### `make build-backend`
Build only the backend container image.

```bash
make build-backend
```

---

#### `make build-frontend`
Build only the frontend container image.

```bash
make build-frontend
```

---

### Testing

#### `make test`
Run all tests (currently runs backend tests).

```bash
make test
```

---

#### `make test-backend`
Run backend tests with race detection.

```bash
make test-backend
```

**Output**: Test results and coverage percentage.

---

#### `make test-backend-coverage`
Run backend tests and generate HTML coverage report.

```bash
make test-backend-coverage
```

**Output files**:
- `backend/coverage.out` - Raw coverage data
- `backend/coverage.html` - HTML coverage report (open in browser)

---

#### `make test-frontend`
Run frontend tests.

```bash
make test-frontend
```

**Note**: Shows message if tests are not configured.

---

#### `make lint`
Run linters for both backend and frontend.

```bash
make lint
```

---

#### `make lint-backend`
Run Go linters (gofmt, go vet).

```bash
make lint-backend
```

---

#### `make lint-frontend`
Run frontend linter (ESLint).

```bash
make lint-frontend
```

---

### Database

#### `make db-migrate`
Run database migrations.

```bash
make db-migrate
```

**Note**: Migrations run automatically when backend starts. This command restarts backend to trigger migrations.

---

#### `make db-reset`
**⚠️ DANGEROUS**: Reset database and delete all data.

```bash
make db-reset
```

**Confirmation required**: You must type `yes` to proceed.

**What it does**:
1. Stops all services
2. Removes all volumes (deletes data)
3. Restarts services with fresh database

---

#### `make db-backup`
Create a backup of the database.

```bash
make db-backup
```

**Output**: SQL dump file in `backups/portfolio_db_YYYYMMDD_HHMMSS.sql`

**Restore backup**:
```bash
cat backups/portfolio_db_20241026_143000.sql | \
  podman exec -i portfolio-postgres psql -U portfolio_user -d portfolio_db
```

---

### Database UI

#### `make db-ui-start`
Start Adminer database management interface.

```bash
make db-ui-start
```

**Access**: http://localhost:8080

**What you'll see**:
- URL and access instructions
- Database credentials
- Login details

**Login to Adminer**:
- System: PostgreSQL
- Server: portfolio-postgres
- Username: portfolio_user
- Password: (from your `.env` file)
- Database: portfolio_db or authentik

---

#### `make db-ui-stop`
Stop Adminer database UI.

```bash
make db-ui-stop
```

---

#### `make db-ui-open`
Open Adminer in your default browser.

```bash
make db-ui-open
```

**Shortcut**: Automatically opens http://localhost:8080

---

#### `make db-ui-restart`
Restart Adminer (useful after configuration changes).

```bash
make db-ui-restart
```

---

### Monitoring

#### `make monitoring-start`
Start Prometheus and Grafana monitoring services.

```bash
make monitoring-start
```

**Services started**:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

---

#### `make monitoring-stop`
Stop monitoring services.

```bash
make monitoring-stop
```

---

### Authentik Setup

#### `make authentik-guide`
Print step-by-step Authentik configuration guide.

```bash
make authentik-guide
```

**Output**: Detailed checklist for configuring Authentik OAuth2 provider.

**Use case**: Follow this guide after starting services for the first time.

---

#### `make open-authentik`
Open Authentik URL in your default browser.

```bash
make open-authentik
```

**URL opened**: http://localhost:9000

**Supported platforms**: Linux (xdg-open), macOS (open)

---

#### `make open-app`
Open Portfolio Manager in your default browser.

```bash
make open-app
```

**URL opened**: http://localhost:3000

---

### Cleanup

#### `make clean`
**⚠️ DANGEROUS**: Stop and remove all containers, volumes, and data.

```bash
make clean
```

**Confirmation required**: You must type `yes` to proceed.

**What gets deleted**:
- All containers
- All volumes (database data)
- All networks

---

#### `make clean-build`
Remove built container images.

```bash
make clean-build
```

**Use case**: Free up disk space or force rebuild from scratch.

---

#### `make clean-logs`
Clear all container logs.

```bash
make clean-logs
```

---

### Information

#### `make version`
Show version information for all tools.

```bash
make version
```

**Output**:
```
Version Information:
Podman: podman version 4.9.3
Go: go version go1.21.5 linux/amd64
Node: v20.10.0
npm: 10.2.3
```

---

#### `make env-check`
Validate `.env` file configuration.

```bash
make env-check
```

**Checks performed**:
- ✅ `.env` file exists
- ✅ `AUTHENTIK_SECRET_KEY` is set
- ⚠️ `AUTHENTIK_CLIENT_SECRET` needs configuration
- ✅ `POSTGRES_PASSWORD` is set

---

#### `make urls`
Display all service URLs.

```bash
make urls
```

**Output**:
```
Service URLs:
  Frontend:    http://localhost:3000
  Backend:     http://localhost:8000
  API Health:  http://localhost:8000/health
  Authentik:   http://localhost:9000
  Prometheus:  http://localhost:9090 (if monitoring enabled)
  Grafana:     http://localhost:3001 (if monitoring enabled)
```

---

## Common Workflows

### New Developer Setup

```bash
# Clone repository
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager

# Run initial setup
make setup

# Generate and add secrets to .env
make generate-secrets
# Copy values to .env file

# Start services
make start

# Open Authentik for configuration
make open-authentik

# Follow Authentik setup guide
make authentik-guide

# After Authentik configuration, restart services
make restart-backend restart-frontend

# Verify everything works
make verify-setup

# Open application
make open-app
```

**Time required**: 10-15 minutes

---

### Daily Development Workflow

```bash
# Morning: Start services
make start

# Check everything is healthy
make status

# Develop locally with hot reload
make dev-backend    # In terminal 1
make dev-frontend   # In terminal 2

# Watch logs if needed
make logs-backend   # In terminal 3

# Run tests before committing
make test
make lint

# Evening: Stop services
make stop           # Just stop (quick restart tomorrow)
# OR
make down          # Stop and remove containers (clean state)
```

---

### Fixing "Invalid client identifier" Error

```bash
# 1. Ensure services are running
make start

# 2. Open Authentik
make open-authentik

# 3. Follow setup guide
make authentik-guide

# 4. After creating provider, update .env with CLIENT_SECRET
nano .env

# 5. Restart services
make restart-backend restart-frontend

# 6. Verify fix
make verify-setup
make open-app
```

---

### Resetting Everything After Configuration Issues

```bash
# Option 1: Soft reset (keeps data)
make down
make start

# Option 2: Hard reset (deletes all data)
make clean
make setup
make start

# 3. Reconfigure Authentik (if needed)
make authentik-guide

# 4. Test
make verify-setup
```

---

### Running Tests in CI/CD

```bash
# Complete test suite with coverage
make test-backend-coverage

# Check linting
make lint

# Generate coverage report
cat backend/coverage.txt
```

---

### Deploying to Production

```bash
# Build production images
make build

# Check environment configuration
make env-check

# Start with production settings
make start

# Enable monitoring
make monitoring-start

# Verify health
make verify-setup

# View logs for issues
make logs
```

---

## Troubleshooting

### Services Won't Start

**Problem**: `make start` fails

**Solutions**:

```bash
# Check Podman is running
make check-podman

# View logs for errors
make logs

# Try stopping and starting again
make stop
make start

# Check for port conflicts
sudo lsof -i :3000  # or :8000, :9000, :5432

# Last resort: full cleanup
make clean
make setup
make start
```

---

### "Command not found" Errors

**Problem**: `make: command not found`

**Solution**:

```bash
# Ubuntu/Debian
sudo apt-get install make

# Fedora/RHEL
sudo dnf install make

# macOS
xcode-select --install
```

---

### Podman Network Issues

**Problem**: Containers can't communicate

**Solution**:

```bash
# Recreate network
podman network rm portfolio-network
make network-create

# Restart services
make restart
```

---

### Database Connection Errors

**Problem**: Backend can't connect to database

**Solutions**:

```bash
# Check database is running
make logs-db

# Verify database credentials in .env
make env-check

# Reset database
make db-reset

# Restart backend
make restart-backend
```

---

### Test Failures

**Problem**: `make test` fails

**Solutions**:

```bash
# Ensure services are running for integration tests
make start

# Check test logs
make test-backend 2>&1 | tee test-output.log

# Run specific test package
cd backend && go test ./cmd/test/section_test.go -v

# Reset test database
make db-reset
```

---

## Advanced Usage

### Custom Environment Files

```bash
# Use different .env file
podman compose --env-file .env.production up -d

# Or create custom make target in Makefile
```

---

### Running Individual Containers

```bash
# Start only database
podman compose up -d portfolio-postgres

# Start only Authentik
podman compose up -d portfolio-authentik-server portfolio-authentik-worker

# Start only application
podman compose up -d portfolio-backend portfolio-frontend
```

---

### Accessing Container Shells

```bash
# Backend container
podman exec -it portfolio-backend sh

# Database container
podman exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db

# Authentik container
podman exec -it portfolio-authentik-server bash
```

---

### Custom Makefile Targets

Add custom targets to `Makefile`:

```makefile
# Custom backup with timestamp
backup-with-timestamp:
	@echo "Creating timestamped backup..."
	@make db-backup
	@echo "Backup complete: backups/portfolio_db_$$(date +%Y%m%d_%H%M%S).sql"
```

---

## Best Practices

1. **Always run `make verify-setup`** after making configuration changes
2. **Use `make logs` liberally** when debugging issues
3. **Run `make test` before committing** code changes
4. **Backup database regularly** with `make db-backup` in production
5. **Never commit `.env` file** - use `.env.example` as template
6. **Use `make clean` sparingly** - it deletes all data
7. **Check `make env-check`** to validate configuration
8. **Run `make status`** to quickly see service health

---

## See Also

- [Setup Guide](../SETUP.md) - Detailed setup instructions
- [Contributing Guide](../CONTRIBUTING.md) - Contribution guidelines
- [Authentik Quickstart](authentication/authentik-quickstart.md) - Authentik setup
- [API Documentation](api/) - API reference

---

**Need help?** Run `make help` for a quick command reference.
