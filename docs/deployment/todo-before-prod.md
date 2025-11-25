# TODO Before Production Deployment

This checklist contains improvements and adjustments to make in the current development environment before deploying to a production server.

---

## 1. Error Logging ✅

### Status: Completed

- [x] Implement dedicated error logging middleware
- [x] Create separate log files for client and server errors
- [x] Add stack trace capture for 500 errors
- [x] Include file/line numbers in error logs
- [x] Configure log rotation (10MB, 30 backups, 90 days)

### Log Files Created
- `backend/errors/400s.log` - Client errors (400, 401, 403, 404, 422, etc.)
- `backend/errors/500s.log` - Server errors (500, 502, 503, etc.) with stack traces

### Verification
```bash
# Test error logging
# 1. Trigger a 404 error
curl http://localhost:8000/api/nonexistent

# 2. Check log file created
ls -lh backend/errors/400s.log

# 3. View log contents
tail -f backend/errors/400s.log | jq .

# 4. For 500 errors, trigger an error in the application
tail -f backend/errors/500s.log | jq .
```

---

## 2. Grafana Improvements ❌

### Status: Not Started

### Task 2.1: Grafana Authentik SSO Integration
- [ ] Try to configure Grafana to use Authentik for login (OAuth2/OIDC)
- [ ] If possible, enable SSO so users can log in with Authentik credentials
- [ ] If not possible or too complex, skip this task

**Resources**:
- Grafana OAuth2 documentation: https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/
- Authentik Provider configuration: http://localhost:9000/if/admin/#/core/providers

### Task 2.2: PostgreSQL Monitoring
- [ ] Connect PostgreSQL database to Grafana
- [ ] Add datasource for PostgreSQL connection metrics
- [ ] Create dashboard panels for:
  - Active connections
  - Idle connections
  - Connection pool usage
  - Query performance
  - Slow queries (>100ms)

**Implementation**:
```yaml
# Option 1: Use existing metrics from backend /metrics endpoint
# The backend already exposes database connection metrics:
# - database_connections{state="active"}
# - database_connections{state="idle"}
# - database_connections{state="in_use"}

# Option 2: Add postgres_exporter (if more detailed metrics needed)
# Add to docker-compose.yml:
# postgres-exporter:
#   image: prometheuscommunity/postgres-exporter
#   environment:
#     DATA_SOURCE_NAME: "postgresql://portfolio_user:${POSTGRES_PASSWORD}@portfolio-postgres:5432/portfolio_db?sslmode=disable"
#   ports:
#     - "9187:9187"
```

### Task 2.3: Error Rate Dashboards
- [ ] Add error rate panels to existing dashboards
- [ ] Create 4xx error rate chart
- [ ] Create 5xx error rate chart
- [ ] Add alerts for high error rates (>1% 5xx)

**Prometheus Queries**:
```promql
# 5xx error rate
rate(http_requests_total{status=~"5.."}[5m])

# 4xx error rate
rate(http_requests_total{status=~"4.."}[5m])

# Error rate by endpoint
rate(http_requests_total{status=~"[45].."}[5m]) by (path)
```

### Task 2.4: Fix Portfolio Count Metric
- [ ] Fix portfolio count metric to show per-user counts instead of global total

**Current Issue**:
The `portfolios_total` metric in `backend/internal/infrastructure/metrics/metrics.go:164` counts ALL portfolios globally:
```go
// Current (incorrect for per-user dashboards)
var portfolioCount int64
db.Table("portfolios").Count(&portfolioCount)
```

**Possible Solutions**:
- Option A: Remove this metric if not needed
- Option B: Add a separate metric for unique users with portfolios
- Option C: Rename to `portfolios_global_total` and add `portfolios_per_user` metric

---

## Verification Checklist

Before deploying to production, verify:

### Error Logging
- [ ] `backend/errors/400s.log` exists and captures client errors
- [ ] `backend/errors/500s.log` exists and captures server errors with stack traces
- [ ] Log rotation works (check after 10MB)
- [ ] Logs include: timestamp, status, error, file, line, stack_trace (5xx), request details

### Grafana (if implemented)
- [ ] Grafana login works (with or without Authentik SSO)
- [ ] PostgreSQL metrics visible in Grafana
- [ ] Error rate dashboards show 4xx and 5xx rates
- [ ] Portfolio count metric is accurate

---

## Notes

- All tasks in this document are for the **current development environment**
- These improvements help prepare the system for production deployment
- Security, performance tuning, and production hardening are **separate tasks** to be done after having a production server
- SSL/HTTPS, backups, and disaster recovery are **post-deployment** concerns

---

**Last Updated**: 2025-11-25
