# 📊 Monitoring & Observability

Complete guide to monitoring the Portfolio Manager application with Prometheus and Grafana.

## Overview

The monitoring stack includes:
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Alert Manager** - Alert routing and notifications
- **Backend Metrics** - Custom application metrics

## Quick Links

| Guide | Purpose | Time |
|-------|---------|------|
| [Prometheus & Grafana Setup](prometheus-grafana.md) | Set up monitoring stack | 15 min |
| [Grafana SSO Setup](grafana-sso.md) | Configure OAuth2/OIDC authentication | 30 min |
| [Grafana SSO Quick Start](grafana-sso-quickstart.md) | Quick reference for SSO | 5 min |
| [Alerts Configuration](alerts.md) | Configure alerting rules and notifications | 20 min |

## Quick Start

### 1. Start Monitoring Stack

```bash
make monitoring-up
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Alert Manager**: http://localhost:9093

### 3. View Metrics

- **Backend Metrics**: http://localhost:8000/metrics
- **Health Check**: http://localhost:8000/health

## Available Dashboards

### Application Dashboards
- **API Performance** - Request rates, latency, error rates
- **Database Performance** - Query performance, connections
- **Business Metrics** - User activity, portfolio/project counts

### Infrastructure Dashboards
- **System Overview** - CPU, memory, disk usage
- **Container Metrics** - Docker/Podman resource usage
- **Network Traffic** - Bandwidth, connections

## Common Monitoring Tasks

### Check System Health
```bash
make monitoring-health
```

### View Prometheus Targets
```bash
curl http://localhost:9090/api/v1/targets
```

### Reload Prometheus Configuration
```bash
make monitoring-reload
```

### Export Grafana Dashboards
```bash
make grafana-export
```

## Metrics Available

### Backend Metrics
- `http_requests_total` - Total HTTP requests by endpoint
- `http_request_duration_seconds` - Request duration histogram
- `portfolio_count` - Total portfolios
- `project_count` - Total projects
- `active_users` - Currently active users

### Database Metrics
- `db_connections_active` - Active database connections
- `db_query_duration_seconds` - Query execution time
- `db_errors_total` - Database errors

## Alert Rules

### Critical Alerts
- API response time > 1s for 5 minutes
- Error rate > 5% for 5 minutes
- Database connections > 80% of pool
- Disk usage > 90%

### Warning Alerts
- API response time > 500ms for 10 minutes
- Error rate > 1% for 10 minutes
- Memory usage > 80%

See [Alerts Configuration](alerts.md) for complete alert rules and setup.

## Authentication

### SSO with Authentik

To enable single sign-on for Grafana:
1. Follow [Grafana SSO Setup](grafana-sso.md) - Detailed configuration
2. Or use [Grafana SSO Quick Start](grafana-sso-quickstart.md) - Quick reference

Benefits:
- Unified authentication across services
- No separate Grafana passwords
- Role-based access control
- Audit trail for logins

## Troubleshooting

### Grafana Won't Start
```bash
# Check logs
make grafana-logs

# Reset Grafana data
make grafana-reset
```

### Missing Metrics
```bash
# Verify Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

# Check backend metrics endpoint
curl http://localhost:8000/metrics
```

### Alerts Not Firing
```bash
# Check Alert Manager status
curl http://localhost:9093/api/v1/status

# Verify alert rules
curl http://localhost:9090/api/v1/rules
```

## Related Documentation

- [Deployment Guide](/docs/deployment/)
- [Operations Guide](/docs/operations/)
- [How to Monitor](/docs/how-to-do/how-to-monitor.md)
- [Backup & Restore](/docs/operations/backup-restore.md)

## External Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alert Manager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
