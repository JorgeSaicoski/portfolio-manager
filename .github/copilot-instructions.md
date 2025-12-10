# Copilot Instructions for Portfolio Manager

## Project Overview

Portfolio Manager is a modern, secure portfolio management platform with a microservices-ready architecture. It serves as the central foundation for an extensible ecosystem with shared infrastructure (PostgreSQL, Authentik, Grafana).

### Architecture
- **Frontend**: SvelteKit with TypeScript (Port 3000)
- **Backend**: Go 1.21+ with Gin framework (Port 8000)
- **Database**: PostgreSQL 16
- **Authentication**: Authentik (OIDC/OAuth2 with PKCE)
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Podman (rootless containers)

## Technology Stack

### Backend (Go)
- **Framework**: Gin (HTTP router)
- **ORM**: GORM (database operations)
- **Auth**: JWT token validation, OIDC integration
- **Language Version**: Go 1.21+

### Frontend (TypeScript/Svelte)
- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Custom CSS with design system
- **Auth**: OAuth2/OIDC client with PKCE flow

## Coding Standards

### Go Backend Standards

1. **Follow Effective Go guidelines**
   - Use `gofmt` for formatting
   - Run `golint` and `go vet` before commits
   - Always handle errors explicitly

2. **Code Structure**
   ```go
   // Good - proper error handling
   func GetPortfolio(c *gin.Context) {
       id := c.Param("id")
       portfolio, err := service.GetPortfolio(id)
       if err != nil {
           c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
           return
       }
       c.JSON(http.StatusOK, portfolio)
   }
   ```

3. **Testing**
   - Write table-driven tests
   - Test edge cases and error conditions
   - Mock external dependencies
   - Maintain test independence

4. **Security**
   - Validate all user inputs
   - Use JWT for API authorization
   - Implement rate limiting
   - Sanitize database queries (use GORM properly)

### Frontend (TypeScript/Svelte) Standards

1. **TypeScript Usage**
   - Always use explicit types, avoid `any`
   - Define interfaces for all data structures
   - Use type safety throughout

2. **Component Structure**
   ```svelte
   <script lang="ts">
     // Imports
     import type { Portfolio } from '$lib/types';
     
     // Props
     export let portfolio: Portfolio;
     
     // Local state
     let isEditing = false;
     
     // Functions
     function handleEdit() {
       isEditing = true;
     }
   </script>
   
   <div class="component">
     <!-- Template -->
   </div>
   
   <style>
     /* Scoped styles */
   </style>
   ```

3. **Best Practices**
   - Follow Svelte best practices
   - Use Prettier for formatting
   - Keep components small and focused
   - Use reactive declarations appropriately

### General Best Practices

- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- Write self-documenting code
- Add comments only for complex logic
- Use meaningful variable names
- Keep functions small and focused

## Build and Test Commands

### Backend

```bash
cd backend

# Install dependencies
go mod download

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/application/services

# Build the application
go build -o bin/api ./cmd/api

# Run linter
golint ./...
go vet ./...

# Format code
gofmt -w .
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Using Makefile (Recommended)

The repository includes a comprehensive Makefile for common tasks:

```bash
# Setup environment
make setup

# Generate secure secrets
make generate-secrets

# Start all services
make start

# Stop all services
make stop

# Run backend tests
make test-backend

# Run frontend tests
make test-frontend

# Verify setup
make verify-setup

# Start monitoring stack
make monitoring-start
```

See `docs/MAKEFILE_GUIDE.md` for complete Makefile reference.

## Development Workflow

### 1. Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add PKCE support to OAuth flow

Implements PKCE flow for enhanced security.
Updates frontend OAuth client configuration.
Adds tests for PKCE validation.

Closes #123
```

### 3. Pull Request Process
- Fill out PR template completely
- Ensure all tests pass
- Update documentation if needed
- Get at least 1 approval from maintainer
- Keep branch up to date with main

## Security Guidelines

1. **Authentication & Authorization**
   - All API endpoints require JWT validation (except public endpoints)
   - Use Authentik for user authentication (OIDC/OAuth2)
   - Implement proper session management

2. **Input Validation**
   - Validate all user inputs on backend
   - Sanitize data before database operations
   - Use GORM parameterized queries

3. **Secrets Management**
   - Never commit secrets to repository
   - Use `.env` files (git-ignored)
   - Use `make generate-secrets` for secure secret generation

4. **API Security**
   - Implement CORS properly
   - Use rate limiting
   - Implement request size limits
   - Add audit logging for all CRUD operations

## Key Directories

```
portfolio-manager/
├── backend/               # Go backend API
│   ├── cmd/              # Main applications
│   ├── internal/         # Private application code
│   │   ├── application/  # Business logic
│   │   ├── domain/       # Domain models
│   │   └── infrastructure/ # External dependencies
│   └── go.mod            # Go dependencies
├── frontend/             # SvelteKit frontend
│   ├── src/             # Source code
│   │   ├── lib/         # Shared libraries
│   │   ├── routes/      # Page routes
│   │   └── app.html     # HTML template
│   └── package.json     # Node dependencies
├── docs/                # Documentation
│   ├── api/            # API documentation
│   ├── authentication/ # Auth setup guides
│   ├── deployment/     # Deployment guides
│   └── development/    # Development guides
├── .github/            # GitHub configuration
│   └── workflows/      # CI/CD workflows
├── docker-compose.yml  # Container orchestration
├── Makefile           # Build automation
└── README.md          # Project overview
```

## Important Files

- **README.md** - Project overview and quick start
- **SETUP.md** - Detailed setup instructions
- **CONTRIBUTING.md** - Contribution guidelines
- **docs/MAKEFILE_GUIDE.md** - Makefile commands reference
- **.env.example** - Environment variables template
- **docker-compose.yml** - Service definitions

## Common Patterns

### Backend API Endpoint Pattern
```go
// Handler
func (h *Handler) GetPortfolio(c *gin.Context) {
    id := c.Param("id")
    portfolio, err := h.service.GetPortfolio(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
        return
    }
    c.JSON(http.StatusOK, portfolio)
}

// Service
func (s *Service) GetPortfolio(id string) (*Portfolio, error) {
    var portfolio Portfolio
    err := s.db.First(&portfolio, id).Error
    return &portfolio, err
}
```

### Frontend API Call Pattern
```typescript
// API client
export async function getPortfolio(id: string): Promise<Portfolio> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio');
  }
  
  return await response.json();
}
```

## Testing Guidelines

### Backend Tests
- Use table-driven tests
- Test happy path and error cases
- Mock external dependencies
- Maintain > 80% code coverage
- Include integration tests for critical flows

### Frontend Tests
- Test user interactions
- Test component rendering
- Test API integration
- Use meaningful test descriptions
- Mock API calls

## Authentication Flow

1. User clicks "Login" → Redirected to Authentik
2. User authenticates → Authentik returns authorization code
3. Frontend exchanges code for tokens (PKCE flow)
4. Access token stored securely
5. All API requests include JWT in Authorization header
6. Backend validates JWT on each request

## Audit Logging

- Every CREATE, UPDATE, DELETE operation is logged
- Logs include: timestamp, user, action, resource, changes
- Structured JSON format
- Used for compliance and recovery

## Monitoring

- Prometheus collects metrics (port 9090)
- Grafana visualizes metrics (port 3001)
- Backend exposes metrics at `/metrics`
- Monitor: request rates, error rates, latency, resource usage

## When Making Changes

1. **Understand the context** - Read related code and documentation
2. **Follow existing patterns** - Maintain consistency
3. **Write tests** - Cover new functionality and edge cases
4. **Update documentation** - Keep docs in sync with code
5. **Test locally** - Use `make verify-setup` to validate
6. **Review security** - Ensure no vulnerabilities introduced
7. **Keep it minimal** - Make smallest necessary changes

## Resources

- **API Documentation**: `docs/api/`
- **Authentication Guide**: `docs/authentication/`
- **Architecture Details**: `docs/development/architecture.md`
- **Deployment Guide**: `docs/deployment/`
- **Makefile Guide**: `docs/MAKEFILE_GUIDE.md`

## Questions to Ask Yourself

Before implementing changes:
- Does this follow project conventions?
- Are tests included?
- Is documentation updated?
- Are there security implications?
- Is error handling proper?
- Could this break existing functionality?
- Is this the minimal change needed?
