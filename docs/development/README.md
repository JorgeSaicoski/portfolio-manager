# Development Documentation

Guides for developers contributing to Portfolio Manager.

## Available Guides

### [Getting Started](getting-started.md)
Set up your development environment.

**Covers:**
- Prerequisites
- Repository setup
- Running services locally
- Development workflow

### [Frontend Development](frontend.md)
SvelteKit/TypeScript development guide.

**Topics:**
- Project structure
- Component development
- State management
- Styling guidelines
- Testing

### [Backend Development](backend.md)
Go/Gin API development guide.

**Covers:**
- Project structure
- Adding new endpoints
- Database migrations
- Error handling
- Testing

### [Testing Guide](testing.md)
Writing and running tests.

**Includes:**
- Unit testing
- Integration testing
- E2E testing
- Test coverage
- CI/CD integration

### [Architecture](architecture.md)
System architecture deep-dive.

**Explains:**
- Microservices architecture
- Data flow
- Authentication architecture
- Database schema
- API design

## Quick Start for Developers

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/portfolio-manager.git

# 2. Install dependencies
cd frontend && npm install
cd ../backend && go mod download

# 3. Start services
podman compose up -d

# 4. Run tests
cd backend && go test ./...
cd frontend && npm test
```

See [Getting Started](getting-started.md) for details.

---

**[⬅️ Back to Documentation](../README.md)**
