# Deployment Documentation

Guides for deploying Portfolio Manager in various environments.

## Available Guides

### [Production Deployment](production.md)
Deploy Portfolio Manager to production.

**Covers:**
- HTTPS configuration (reverse proxy)
- Environment variables for production
- Database backups
- Scaling strategies
- Security hardening
- Monitoring setup

### [Monitoring](monitoring/)
Set up Prometheus and Grafana for metrics and monitoring.

**Includes:**
- [Prometheus & Grafana Setup](monitoring/prometheus-grafana.md) - Complete monitoring stack
- [Grafana SSO](monitoring/grafana-sso.md) - OAuth2/OIDC authentication for Grafana
- [Grafana SSO Quick Start](monitoring/grafana-sso-quickstart.md) - 5-minute reference
- [Alerts Configuration](monitoring/alerts.md) - Alert rules and notifications

See [Monitoring Documentation](monitoring/) for complete guides.

## Operations & Maintenance

### [Operations Documentation](../operations/)
Daily operations, audit logging, and maintenance procedures.

**Key Topics:**
- [Audit Logging](../operations/audit-logging.md) - Track all system operations and enable emergency recovery
- [Backup & Restore](../operations/backup-restore.md) - Database backup and restore procedures
- [How-To Guides](../how-to-do/) - Step-by-step operational tasks

### [Database UI](database-ui.md)
Manage databases with Adminer web interface.

**Includes:**
- Adminer setup and access
- Managing multiple databases (portfolio_db, authentik, future services)
- Running SQL queries
- Import/export data
- User and permission management
- Security best practices

## Quick Deployment

### Local Development
```bash
podman compose up -d
```

### Production (Basic)
```bash
# With monitoring
podman compose --profile monitoring up -d
```

See the guides above for detailed instructions.

---

**[⬅️ Back to Documentation](../README.md)**
