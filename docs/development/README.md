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

### [Frontend Guide](frontend-guide.md)
Complete SvelteKit/TypeScript development guide.

**Topics:**
- Project structure
- Component development
- State management
- Styling guidelines
- Testing
- API integration

**Note**: This guide covers frontend development in detail. For backend-specific development, see backend source code and [Architecture](architecture.md).

### [Architecture](architecture.md)
System architecture and ecosystem design.

**Explains:**
- Ecosystem vision (Portfolio Manager as central foundation)
- Shared services architecture (PostgreSQL, Authentik, Grafana)
- Current microservices architecture
- Service integration patterns
- Data flow and authentication architecture
- Database schema and scaling patterns

### [Microservices Integration](microservices-integration.md)
Complete guide for adding new services to the ecosystem.

**Explains:**
- How to connect to shared PostgreSQL
- Integrating with Authentik authentication
- Adding Prometheus metrics for monitoring
- Network configuration (same compose, separate compose, external servers)
- Deployment patterns with examples
- Security and production considerations

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
