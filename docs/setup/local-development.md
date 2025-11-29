# Local Development Setup

Complete guide to setting up your local development environment for Portfolio Manager.

## Prerequisites

### Required Software

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

### Optional Tools

- **Bruno** or **Postman** - API testing
- **pgAdmin** or **DBeaver** - Database management
- **VS Code** - Recommended IDE

## Quick Setup (5 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 3. Start All Services

```bash
make up
```

This starts:
- Backend API (port 8000)
- Frontend (port 3000)
- PostgreSQL database (port 5432)
- Authentik (ports 9000, 9443)
- Prometheus & Grafana (ports 9090, 3001)

### 4. Verify Services

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

## Development Workflow

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

## Hot Reload

Both frontend and backend support hot reload:

- **Frontend**: Automatically reloads on file changes
- **Backend**: Restart with `make backend-restart` after code changes

To enable backend hot reload, see development mode in backend README.

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

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Get portfolios (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/portfolios/own
```

### Using Bruno

1. Install Bruno from https://www.usebruno.com/
2. Import collection from `docs/api/bruno-collection.json` (if available)
3. Set environment variables
4. Start making requests

## Next Steps

- See [Development Guide](/docs/development/) for architecture details
- See [API Documentation](/docs/api/) for endpoint reference
- See [Authentication Setup](/docs/authentication/) for configuring Authentik
- See [How-To Guides](/docs/how-to-do/) for specific tasks

## Getting Help

- Check [Troubleshooting Guide](/docs/authentication/troubleshooting.md)
- Review [How to Investigate](/docs/how-to-do/how-to-investigate.md)
- Open an issue on GitHub
- Check existing documentation in `/docs`
