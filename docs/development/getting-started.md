# Getting Started with Development

Quick start guide for developers contributing to Portfolio Manager.

## First Time Setup

### 1. Prerequisites

Install required tools:
- **Git** - Version control
- **Docker** or **Podman** - Container runtime
- **Make** - Build automation
- **IDE** - VS Code, GoLand, or WebStorm recommended

See [Local Development Setup](/docs/setup/local-development.md) for detailed installation instructions.

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager

# Create environment file
cp .env.example .env

# Start all services
make up

# Verify everything is running
make health
```

### 3. Understand the Architecture

Read [Architecture Overview](architecture.md) to understand:
- System components
- Data flow
- Technology stack
- Design patterns

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Backend: Edit Go files in `backend/`
   - Frontend: Edit Svelte files in `frontend/`

3. **Test your changes**
   ```bash
   make test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Running Services

```bash
# Start all services
make up

# Start specific service
make backend-up
make frontend-up

# Restart service after changes
make backend-restart
make frontend-restart
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
make backend-logs
make frontend-logs
make db-logs
```

## Technology Stack

### Backend
- **Language**: Go 1.24.0
- **Framework**: Gin (HTTP framework)
- **Database**: PostgreSQL with GORM ORM
- **Authentication**: OAuth2/OIDC via Authentik
- **Testing**: Go testing with testify

See [Backend Guide](backend.md) for detailed information.

### Frontend
- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest

See [Frontend Guide](frontend-guide.md) for detailed information.

### Infrastructure
- **Containers**: Docker/Podman
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Database UI**: Adminer

## Project Structure

```
portfolio-manager/
├── backend/                 # Go backend
│   ├── cmd/main/           # Application entry point
│   ├── internal/           # Internal packages
│   │   ├── application/    # Handlers and routers
│   │   ├── infrastructure/ # Database, repos, middleware
│   │   └── shared/         # Shared utilities
│   └── API_OVERVIEW.md     # API documentation (for AI)
├── frontend/               # Svelte frontend
│   ├── src/
│   │   ├── lib/           # Components and utilities
│   │   └── routes/        # SvelteKit routes
│   └── static/            # Static assets
├── docs/                  # Documentation (for humans)
│   ├── api/              # API guides
│   ├── authentication/   # Auth setup
│   ├── deployment/       # Deploy guides
│   ├── development/      # Dev guides
│   ├── how-to-do/       # Task guides
│   ├── operations/      # Ops guides
│   ├── security/        # Security docs
│   └── setup/           # Setup guides
├── docker-compose.yml   # Container orchestration
├── Makefile            # Automation commands
└── README.md           # Project overview
```

## Common Development Tasks

### Backend Development

```bash
# Run backend tests
make test-backend

# Run specific test
cd backend && go test ./internal/application/handler -run TestCreatePortfolio

# Add new dependency
cd backend && go get github.com/some/package

# Format code
cd backend && go fmt ./...

# Lint code
cd backend && golangci-lint run
```

### Frontend Development

```bash
# Run frontend tests
make test-frontend

# Install new dependency
cd frontend && npm install package-name

# Lint code
cd frontend && npm run lint

# Format code
cd frontend && npm run format
```

### Database Operations

```bash
# Access PostgreSQL shell
make db-shell

# Run migrations
make migrate

# Create migration
cd backend && goose create add_new_field sql

# Reset database (WARNING: deletes data)
make db-reset
```

## Code Quality

### Testing

- Write tests for all new features
- Maintain >80% code coverage
- Run tests before committing

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# View coverage report
make coverage-report
```

### Linting

```bash
# Lint backend
make lint-backend

# Lint frontend
make lint-frontend

# Lint all
make lint
```

### Formatting

Code must be properly formatted:

```bash
# Format backend (Go)
make format-backend

# Format frontend (Prettier)
make format-frontend
```

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### Commit Messages

Follow conventional commits:
```
feat: add project filtering by skills
fix: resolve category ordering issue
docs: update API authentication guide
refactor: simplify image upload handler
test: add unit tests for portfolio CRUD
```

### Pull Requests

1. Create descriptive PR title
2. Fill out PR template
3. Link related issues
4. Wait for CI checks to pass
5. Address review comments
6. Squash commits if requested

## Debugging

### Backend Debugging

```bash
# View backend logs
make backend-logs

# Enable debug logging
# In .env: LOG_LEVEL=debug

# Use Delve debugger (GoLand)
# Set breakpoints and run in debug mode
```

### Frontend Debugging

```bash
# View frontend logs
make frontend-logs

# Use browser DevTools
# Chrome: F12 → Sources → Set breakpoints

# View network requests
# Chrome: F12 → Network
```

### Database Debugging

```bash
# Check database contents
make db-shell
# Then: SELECT * FROM portfolios LIMIT 10;

# Use Adminer (web UI)
# http://localhost:8080

# View query logs
# In .env: DB_LOG_LEVEL=debug
```

## Helpful Resources

### Documentation
- [Architecture](architecture.md) - System design
- [Frontend Guide](frontend-guide.md) - Frontend development
- [API Documentation](/docs/api/) - API reference
- [How-To Guides](/docs/how-to-do/) - Specific tasks

### External Links
- [Go Documentation](https://go.dev/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [SvelteKit](https://kit.svelte.dev/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Authentik](https://goauthentik.io/docs/)

## Getting Help

1. Check existing documentation in `/docs`
2. Search GitHub issues
3. Ask in project discussions
4. Review [Troubleshooting Guide](/docs/authentication/troubleshooting.md)
5. Contact maintainers

## Next Steps

- Read [Architecture Overview](architecture.md)
- See [Frontend Guide](frontend-guide.md) or backend development
- Learn [Testing Procedures](testing.md)
- Review [How to Add a Feature](/docs/how-to-do/how-to-add-a-feature.md)

Happy coding! 🚀
