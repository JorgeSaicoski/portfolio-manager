# Portfolio Manager

**Central ecosystem foundation for microservices** - Modern, secure portfolio management platform with shared infrastructure (PostgreSQL, Authentik, Grafana) designed as the starting point for an extensible microservices architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)](https://go.dev/)
[![Node Version](https://img.shields.io/badge/Node-18+-339933?logo=node.js)](https://nodejs.org/)
[![Podman](https://img.shields.io/badge/Podman-4.0+-892CA0?logo=podman)](https://podman.io/)

## ✨ Features

- **🔐 Enterprise Authentication** - OIDC/OAuth2 via [Authentik](https://goauthentik.io/)
  - Secure login with PKCE flow
  - Self-service user registration
  - Token-based API authorization
  - Session management

- **📊 Portfolio Management** - Full CRUD operations for portfolios, projects, and sections
  - Create and manage multiple portfolios
  - Organize projects by categories
  - Rich content sections with customizable layouts
  - Public/private portfolio visibility

- **🎨 Modern UI/UX** - Built with SvelteKit
  - Responsive design
  - Real-time updates
  - Intuitive navigation
  - Professional aesthetics

- **🚀 Cloud-Ready** - Containerized architecture
  - Rootless containers with Podman
  - PostgreSQL database
  - Prometheus & Grafana monitoring
  - Easy scaling

- **🛡️ Security First** - Production-ready security
  - JWT token validation
  - CORS protection
  - Rate limiting
  - Input sanitization
  - Secure password policies

- **📊 Comprehensive Audit Logging** - Complete operational transparency
  - Every CREATE, UPDATE, DELETE operation logged
  - Structured JSON logs with full context
  - User tracking and change history
  - Emergency database recovery capability
  - Compliance-ready audit trails

## 🚀 Quick Start

### Using Makefile (Recommended - 5-10 minutes)

Automated setup with `make` commands:

```bash
# 1. Clone the repository
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager

# 2. Run automated setup
make setup

# 3. Generate secure secrets
make generate-secrets
# Copy output to .env file

# 4. Start all services
make start

# 5. Configure Authentik (follow the guide)
make authentik-guide

# 6. Verify everything works
make verify-setup

# Optional: Start monitoring (Prometheus + Grafana)
make monitoring-start

# Optional: Start database UI (Adminer)
make db-ui-start
```

📖 **Makefile Reference**: See [docs/MAKEFILE_GUIDE.md](docs/MAKEFILE_GUIDE.md) for all available commands.

### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/JorgeSaicoski/portfolio-manager.git
cd portfolio-manager

# 2. Create environment configuration
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
podman compose up -d

# 4. Configure Authentik (see SETUP.md for details)
# Access: http://localhost:9000/if/flow/initial-setup/
```

**Next steps:** Follow the complete [Setup Guide](SETUP.md) to configure authentication and create your first user.

## 🔐 Custom User Enrollment with Admin Approval

Portfolio Manager supports **self-service user registration with administrator approval** - allowing users to create their own accounts while giving you control over who gains access.

### Why Use Custom Enrollment?

**Perfect for:**
- 🏢 B2B applications requiring account verification
- 🔒 Controlled access environments
- ✅ Compliance requirements for user vetting
- 🛡️ Preventing spam registrations
- 👥 Professional onboarding workflows

### How It Works

```
User registers → Account created (INACTIVE) → Admin reviews → Approval → User gains access ✅
```

**User Experience:**
1. User visits your app and clicks "Sign Up"
2. Fills registration form (username, email, password)
3. Sees confirmation: "Registration submitted! Awaiting approval..."
4. Receives email when approved
5. Can login immediately after approval

**Admin Experience:**
1. Receives email notification for each new registration
2. Reviews user details in Authentik admin panel
3. One-click approval: Check "Is active" + Add to group
4. User gains access instantly

### Quick Setup (20 minutes)

Follow our step-by-step guide with practical examples:

**📖 [Custom Enrollment Quickstart Guide](docs/authentication/custom-enrollment-quickstart.md)**

The guide includes:
- ✅ Complete configuration examples
- ✅ Real workflow scenarios
- ✅ Email templates ready to use
- ✅ Approval decision guidelines
- ✅ Troubleshooting tips

**Also see:**
- **[Enrollment Setup](docs/authentication/enrollment-setup.md)** - Detailed enrollment configuration
- **[User Approval Setup](docs/authentication/user-management/user-approval-setup.md)** - Advanced approval workflows
- **[User Management](docs/authentication/user-management/)** - Complete user lifecycle management

### Key Features

**For Users:**
- ✅ Self-registration (no waiting for admin to create account)
- ✅ Simple registration form
- ✅ Clear status communication
- ✅ Fast approval process

**For Admins:**
- ✅ Email notifications for new registrations
- ✅ Review user details before approval
- ✅ One-click approval process
- ✅ Reject suspicious registrations
- ✅ Track pending users easily

**Security:**
- ✅ Users start INACTIVE (can't login until approved)
- ✅ Admin reviews before granting access
- ✅ Email verification (optional)
- ✅ Strong password policies (optional)

### Configuration Example

Your enrollment flow will look like this:

| Stage | Purpose | User Sees |
|-------|---------|-----------|
| 1. Prompt | Collect info | Registration form |
| 2. User Write | Create inactive user | - |
| 3. Email Admin | Notify admin | - |
| 4. Message | Confirm submission | "Awaiting approval..." |

**Environment Variable:**
```env
ENROLLMENT_FLOW=portfolio-enrollment
```

The frontend automatically uses this flow when users click "Sign Up".

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[Setup Guide](SETUP.md)** | Complete installation and configuration |
| **[Makefile Guide](docs/MAKEFILE_GUIDE.md)** | Automated commands reference |
| **[Contributing](CONTRIBUTING.md)** | How to contribute to the project |
| **[Authentication](docs/authentication/)** | Authentik setup, OAuth2, user registration |
| **[API Reference](docs/api/)** | Complete REST API documentation |
| **[Deployment](docs/deployment/)** | Podman, production deployment, monitoring |
| **[Operations](docs/operations/)** | Daily operations, audit logging, backup & restore |
| **[Development](docs/development/)** | Development environment, testing, architecture |
| **[Security](docs/security/)** | Security best practices, audit reports |

## 🏗️ Architecture

### Ecosystem Vision

Portfolio Manager is the **central foundation** of a microservices ecosystem. It provides shared infrastructure that future services can leverage:

- **Shared PostgreSQL** - Multiple databases/schemas for different services
- **Shared Authentik** - Centralized authentication for all services
- **Shared Grafana/Prometheus** - Unified monitoring across the ecosystem

```
┌────────────────────────────────────────────────────────────┐
│                    CENTRAL ECOSYSTEM                        │
│                 (Portfolio Manager Core)                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │  Authentik   │  │   Grafana    │    │
│  │   Database   │  │    Auth      │  │  Monitoring  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ▲                 ▲                  ▲             │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          │                 │                  │
    ┌─────┴─────┬──────────┴────────┬─────────┴──────┐
    │           │                   │                 │
┌───▼───┐  ┌───▼────┐         ┌───▼────┐      ┌────▼─────┐
│Portfolio│ │ Your   │         │ Your   │      │  Your    │
│Manager │ │Service │         │Service │      │ Service  │
│  API   │ │   A    │         │   B    │      │    N     │
└────────┘ └────────┘         └────────┘      └──────────┘
 (Active)   (Example)          (Example)        (Example)
```

> **Note:** Services shown in the diagram above (besides Portfolio Manager) are **examples** to illustrate the extensible architecture. You can integrate any microservice you need: e-commerce cart, product catalog, loyalty programs, analytics, etc.

**See [Architecture Documentation](docs/development/architecture.md) for detailed ecosystem design and [Microservices Integration Guide](docs/development/microservices-integration.md) for adding new services.**

### Current Architecture (Portfolio Manager)

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ HTTPS/HTTP
         ▼
┌─────────────────────────┐
│  Frontend (SvelteKit)   │
│  Port: 3000             │
│  - UI Components        │
│  - OAuth2 Client        │
│  - State Management     │
└────────┬────────────────┘
         │
         │ REST API + JWT
         ▼
┌──────────────────────────┐
│  Backend API (Go/Gin)    │
│  Port: 8000              │
│  - Business Logic        │
│  - Token Validation      │
│  - Data Access Layer     │
└────────┬─────────────────┘
         │
         │ SQL
         ▼
┌─────────────────────────┐       ┌──────────────────┐
│  PostgreSQL Database    │       │  Authentik       │
│  Port: 5432             │       │  Port: 9000      │
│  - portfolio_db         │◄──────┤  OIDC Provider   │
│  - authentik            │       │  User Management │
└─────────────────────────┘       └──────────────────┘
         │
         │ Metrics
         ▼
┌─────────────────────────┐
│  Monitoring Stack       │
│  - Prometheus (9090)    │
│  - Grafana (3001)       │
└─────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Fast, modern web framework
- **Language**: TypeScript - Type-safe JavaScript
- **Styling**: Custom CSS with design system
- **Auth**: OAuth2/OIDC client with PKCE

### Backend
- **Language**: [Go 1.21+](https://go.dev/) - High-performance, concurrent
- **Framework**: [Gin](https://gin-gonic.com/) - Fast HTTP router
- **ORM**: [GORM](https://gorm.io/) - Type-safe database access
- **Auth**: JWT token validation, OIDC integration

### Infrastructure
- **Container Runtime**: [Podman](https://podman.io/) - Secure, daemonless containers
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) - Reliable, ACID-compliant
- **Authentication**: [Authentik](https://goauthentik.io/) - Open-source identity provider
- **Monitoring**: Prometheus + Grafana - Metrics and visualization
- **Caching**: Redis - Session storage

## 📋 Prerequisites

- **Podman** 4.0+ ([installation guide](docs/deployment/podman.md))
- **Go** 1.21+ (for backend development)
- **Node.js** 18+ (for frontend development)
- **PostgreSQL** 16+ (or use Docker/Podman image)

## 🌐 Services & Ports

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend | 3000 | http://localhost:3000 | SvelteKit application |
| Backend API | 8000 | http://localhost:8000 | REST API endpoints |
| Authentik | 9000 | http://localhost:9000 | Authentication provider |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache/sessions |
| Prometheus (optional) | 9090 | http://localhost:9090 | Metrics collection |
| Grafana (optional) | 3001 | http://localhost:3001 | Metrics visualization |
| Adminer (optional) | 8080 | http://localhost:8080 | Database management UI |

## 🚧 Project Status

**Current Version**: 1.0.0-beta

**Status**: Active Development

### Completed Features
- ✅ User authentication via Authentik (OIDC)
- ✅ Portfolio CRUD operations
- ✅ Project and section management
- ✅ Public portfolio sharing
- ✅ Responsive UI
- ✅ API documentation
- ✅ Containerized deployment
- ✅ Monitoring stack

### In Progress
- 🔄 Enhanced search and filtering
- 🔄 Image upload and management
- 🔄 Export/import functionality
- 🔄 Activity logging

### Planned Features
- 📅 Social sharing integrations
- 📅 Advanced analytics
- 📅 Template marketplace
- 📅 Multi-language support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Pull request process
- Coding standards
- Testing requirements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Authentik](https://goauthentik.io/) - Amazing open-source identity provider
- [Podman](https://podman.io/) - Secure container runtime
- [SvelteKit](https://kit.svelte.dev/) - Excellent web framework
- [Go](https://go.dev/) - Reliable backend language

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/JorgeSaicoski/portfolio-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JorgeSaicoski/portfolio-manager/discussions)

## 🔗 Links

- **Repository**: https://github.com/JorgeSaicoski/portfolio-manager
- **Documentation**: [docs/](docs/)
- **API Docs**: [docs/api/](docs/api/)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

**Made with ❤️ by the Portfolio Manager Team**
