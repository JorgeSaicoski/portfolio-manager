# Portfolio Manager Documentation

Welcome to the Portfolio Manager documentation! This guide will help you find the information you need.

## 🚀 Quick Start

| I want to... | Go to... | Time |
|-------------|----------|------|
| Set up locally | [Setup Guide](setup/) | 10 min |
| Start developing | [Getting Started](development/getting-started.md) | 5 min |
| Deploy to production | [Production Deployment](deployment/production.md) | 30 min |
| Understand the API | [API Overview](/backend/API_OVERVIEW.md) | 15 min |
| Fix auth issues | [Auth Troubleshooting](authentication/troubleshooting.md) | Varies |
| Monitor the app | [Monitoring Setup](deployment/monitoring/) | 20 min |

## 📚 Documentation by Category

### 🚀 Getting Started

Perfect for first-time users and setting up your environment.

- **[Setup Guide](setup/)** - Complete setup instructions
  - [Local Development](setup/local-development.md) - Set up your dev environment (10 min)
  - [Docker/Podman Guide](setup/docker-podman.md) - Container setup and management
  - [Makefile Guide](setup/makefile-guide.md) - Automation commands reference
  - [Makefile Implementation](setup/makefile-implementation.md) - Technical details

**Quick Commands:**
```bash
make up      # Start all services
make health  # Check everything is running
make logs    # View all logs
make down    # Stop everything
```

---

### 👨‍💻 Development

For developers contributing to or extending Portfolio Manager.

- **[Getting Started](development/getting-started.md)** - Quick start for developers
- **[Frontend Guide](development/frontend-guide.md)** - SvelteKit/TypeScript development
- **[Architecture](development/architecture.md)** - System design and patterns
- **[Microservices Integration](development/microservices-integration.md)** - Adding new services
- **[Multi-Tenancy](development/multi-tenancy.md)** - Multi-tenant architecture

**Technology Stack:**
- Backend: Go 1.24.0 + Gin
- Frontend: SvelteKit + TypeScript
- Database: PostgreSQL + GORM
- Auth: OAuth2/OIDC via Authentik

---

### 🔧 Operations

Daily operations, monitoring, and maintenance.

- **[Operations Guide](operations/)** - Day-to-day operations
  - [Audit Logging](operations/audit-logging.md) - Audit system and emergency recovery
  - [Backup & Restore](operations/backup-restore.md) - Database backup procedures
- **[How-To Guides](how-to-do/)** - Step-by-step task guides
  - [Deploy to Production](how-to-do/how-to-deploy-production.md)
  - [Add a Feature](how-to-do/how-to-add-a-feature.md)
  - [Monitor the System](how-to-do/how-to-monitor.md)
  - [Investigate Issues](how-to-do/how-to-investigate.md)
  - [Audit Logs](how-to-do/how-to-audit.md)
  - [Backup Data](how-to-do/how-to-backup.md)
  - [Rollback Changes](how-to-do/how-to-rollback.md)
  - [Run Tests](how-to-do/how-to-test.md)

---

### 🚀 Deployment

Deploy Portfolio Manager to different environments.

- **[Production Deployment](deployment/production.md)** - Complete production guide
- **[CI/CD Setup](deployment/cicd-setup.md)** - Continuous integration/deployment
- **[CI/CD Quick Reference](deployment/cicd-quick-reference.md)** - Quick CI/CD commands
- **[Database UI](deployment/database-ui.md)** - Adminer database management
- **[Client Onboarding](deployment/client-onboarding.md)** - Onboarding procedures
- **[Pre-Production Checklist](deployment/todo-before-prod.md)** - Readiness checklist
- **[Monitoring](deployment/monitoring/)** - Observability and monitoring
  - [Prometheus & Grafana](deployment/monitoring/prometheus-grafana.md) - Monitoring stack setup
  - [Grafana SSO](deployment/monitoring/grafana-sso.md) - OAuth2/OIDC authentication
  - [Grafana SSO Quick Start](deployment/monitoring/grafana-sso-quickstart.md) - Quick reference
  - [Alerts Configuration](deployment/monitoring/alerts.md) - Alert rules and notifications

---

### 📡 API Documentation

Complete REST API reference and integration guides.

- **[API Overview](/backend/API_OVERVIEW.md)** - **For AI:** Complete endpoint reference
- **[API Guide](api/)** - **For Humans:** API documentation
  - [API Endpoints](api/endpoints.md) - Endpoint reference
  - [Authentication](api/authentication.md) - OAuth2/OIDC authentication flows
  - [Examples](api/examples.md) - curl/Bruno request examples
  - [Image API](api/images.md) - Image upload and management

**Quick API Reference:**
- Base URL: `http://localhost:8000/api`
- Auth: Bearer JWT tokens from Authentik
- 55 total endpoints (34 protected, 21 public)

---

### 🔐 Authentication

Everything about user authentication, OAuth2, and Authentik.

- **[Authentication Guide](authentication/)** - Complete authentication docs
  - [Authentik Quickstart](authentication/authentik-quickstart.md) - Fix errors in 5 minutes
  - [Authentik Setup](authentication/authentik-setup.md) - Complete configuration
  - [Provider & Application Setup](authentication/provider-application-setup.md) - OAuth2/OIDC config
  - [Enrollment Setup](authentication/enrollment-setup.md) - User self-registration
  - [Custom Enrollment Quickstart](authentication/custom-enrollment-quickstart.md) - 20-minute setup
  - [Email Configuration](authentication/email-configuration.md) - SMTP/SES/SendGrid
  - [Email Verification](authentication/email-verification.md) - Email verification flow
  - [User Groups & Permissions](authentication/user-groups-permissions.md) - RBAC
  - [Troubleshooting](authentication/troubleshooting.md) - Common issues
- **[User Management](authentication/user-management/)** - Managing users
  - [Creating Users](authentication/user-management/creating-users.md)
  - [Managing Groups](authentication/user-management/managing-groups.md)
  - [User Approval Setup](authentication/user-management/user-approval-setup.md)
  - [Application Access Control](authentication/user-management/application-access-control.md)
  - [Authentik API Integration](authentication/user-management/authentik-api-integration.md)

---

### 🛡️ Security

Security best practices, audits, and vulnerability management.

- **[Security Guide](security/)** - Security documentation
  - [Security Overview](security/overview.md) - Best practices and checklist
  - [Audit Summary](security/audit-summary.md) - Security audit results
  - [Vulnerabilities](security/vulnerabilities.md) - Known issues and mitigations

**Security Checklist:**
- [ ] HTTPS enabled
- [ ] Strong passwords configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Regular backups running
- [ ] Audit logging enabled

---

## 🎯 Common Tasks

### For New Users

1. **Set up locally**
   ```bash
   git clone https://github.com/JorgeSaicoski/portfolio-manager.git
   cd portfolio-manager
   make up
   ```

2. **Configure authentication**
   - Follow [Authentik Quickstart](authentication/authentik-quickstart.md)

3. **Create your first portfolio**
   - Access frontend at http://localhost:3000
   - Login with Authentik credentials
   - Create portfolio via UI or API

### For Developers

1. **Start developing**
   - Read [Getting Started](development/getting-started.md)
   - Check [Architecture](development/architecture.md)
   - See [Frontend Guide](development/frontend-guide.md)

2. **Make changes**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   make test
   git commit -m "feat: add feature"
   ```

3. **Submit PR**
   - Push branch
   - Create pull request
   - Wait for CI checks

### For Operators

1. **Deploy to production**
   - Follow [Production Deployment](deployment/production.md)
   - Set up [Monitoring](deployment/monitoring/)
   - Configure [Backups](operations/backup-restore.md)

2. **Monitor system**
   - Check Grafana dashboards
   - Review [Audit Logs](operations/audit-logging.md)
   - Set up alerts

3. **Troubleshoot issues**
   - Check [How to Investigate](how-to-do/how-to-investigate.md)
   - Review [Troubleshooting Guide](authentication/troubleshooting.md)
   - Check service logs

---

## 📖 External Resources

- **Authentik**: https://goauthentik.io/docs/
- **SvelteKit**: https://kit.svelte.dev/docs
- **Go**: https://go.dev/doc/
- **Gin**: https://gin-gonic.com/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Podman**: https://docs.podman.io/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/

---

## 🆘 Getting Help

### Documentation

- Search this documentation first
- Check [Troubleshooting Guide](authentication/troubleshooting.md)
- Review [How-To Guides](how-to-do/)

### Community

- **GitHub Issues**: https://github.com/JorgeSaicoski/portfolio-manager/issues
- **GitHub Discussions**: https://github.com/JorgeSaicoski/portfolio-manager/discussions

### Reporting Issues

When reporting issues, include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Relevant logs (`make logs`)
- Environment details

---

## 📝 Contributing

Want to improve the documentation?

1. Fork the repository
2. Make your changes
3. Submit a pull request
4. See [Contributing Guide](../CONTRIBUTING.md)

**Documentation Improvements Welcome:**
- Fixing typos or unclear explanations
- Adding missing information
- Creating new guides
- Improving examples

---

## 📋 Documentation Index

Quick alphabetical index of all major topics:

- [API](api/) | [Architecture](development/architecture.md) | [Audit Logging](operations/audit-logging.md) | [Authentication](authentication/)
- [Backup & Restore](operations/backup-restore.md)
- [CI/CD](deployment/cicd-setup.md)
- [Deployment](deployment/) | [Development](development/)
- [Frontend](development/frontend-guide.md)
- [Getting Started](development/getting-started.md) | [Grafana](deployment/monitoring/)
- [How-To Guides](how-to-do/)
- [Makefile](setup/makefile-guide.md) | [Monitoring](deployment/monitoring/)
- [Operations](operations/)
- [Production](deployment/production.md) | [Prometheus](deployment/monitoring/)
- [Security](security/) | [Setup](setup/)
- [Testing](how-to-do/how-to-test.md) | [Troubleshooting](authentication/troubleshooting.md)

---

**[⬅️ Back to Main README](../README.md)**
