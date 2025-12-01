# Monitoring & Alerts Guide

Complete guide to monitoring dashboards and alert rules for Portfolio Manager.

## Overview

The monitoring stack includes:
- **Prometheus**: Collects metrics from backend and PostgreSQL
- **Grafana**: Visualizes metrics in dashboards
- **Alert Rules**: Notifies you of issues

## Dashboards

### 1. Backend Dashboard (`backend-dashboard.json`)

**Purpose**: Monitor API performance and technical metrics

**Panels**:
- HTTP Request Rate (by method, path, status)
- Total Request Rate (gauge with thresholds)
- Response Time Percentiles (p95 and p50)
- HTTP Status Code Distribution
- Active/Idle DB Connections
- Total Portfolios
- 5xx Error Rate
- Database Connection Pool Utilization

**When to Use**: Check API health, troubleshoot slow endpoints, identify errors

### 2. System Overview Dashboard (`system-overview.json`)

**Purpose**: High-level system health monitoring

**Panels**:
- Backend/Auth Service Status (UP/DOWN)
- Total Request Rate (all services)
- Overall Error Rate
- Request Rate by Service
- Response Time by Service
- HTTP Status Codes (all services)
- Database Connections
- Business Metrics (users, portfolios, auth rate)

**When to Use**: Quick health check, compare services, detect system-wide issues

### 3. Portfolio Metrics Dashboard (`portfolio-metrics.json`) ⭐ NEW

**Purpose**: Track business metrics and user activity

**Panels**:
- **Active Users**: Total users with portfolios
- **Total Portfolios**: Total portfolio count
- **Total Categories**: Categories across all portfolios
- **Total Projects**: Projects across all categories
- **Content Growth Over Time**: Line chart showing growth
- **Image Operations**: Uploads vs deletes
- **Authentication Attempts**: Success vs failure rate

**When to Use**:
- Track user adoption and growth
- Monitor content creation trends
- Identify authentication issues
- Understand usage patterns

**Refresh**: Every 30 seconds
**Time Range**: Last 6 hours (default)

## Alert Rules

Alert rules are defined in `/monitoring/prometheus/rules/alerts.yml`

### Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **critical** | Service down or critical issue | Immediate action needed |
| **warning** | Degraded performance or approaching limits | Investigate soon |
| **info** | Informational, no action needed | Awareness only |

### Service Health Alerts

#### BackendServiceDown
- **Severity**: Critical
- **Condition**: Backend service is not responding
- **Duration**: 2 minutes
- **Action**: Check backend logs, restart service if needed

#### PostgreSQLExporterDown
- **Severity**: Warning
- **Condition**: PostgreSQL metrics not being collected
- **Duration**: 1 minute
- **Action**: Check exporter logs, verify database connection

### Performance Alerts

#### HighErrorRate
- **Severity**: Warning
- **Condition**: Error rate > 5% for 5 minutes
- **Action**: Check logs for error causes, review recent deployments

#### CriticalErrorRate
- **Severity**: Critical
- **Condition**: Error rate > 15% for 2 minutes
- **Action**: Immediate investigation, possible rollback needed

#### SlowResponseTime
- **Severity**: Warning
- **Condition**: p95 response time > 2 seconds for 5 minutes
- **Action**: Check database queries, review slow endpoints

#### VerySlowResponseTime
- **Severity**: Critical
- **Condition**: p95 response time > 5 seconds for 2 minutes
- **Action**: Immediate investigation, possible database issues

### Database Alerts

#### HighDatabaseConnections
- **Severity**: Warning
- **Condition**: Active connections > 80 for 5 minutes
- **Action**: Review connection pool settings, check for leaks

#### DatabaseConnectionPoolExhausted
- **Severity**: Critical
- **Condition**: Active connections > 95 for 2 minutes
- **Action**: Immediate action, increase pool size or fix connection leaks

#### PostgreSQLHighConnections
- **Severity**: Warning
- **Condition**: PostgreSQL connections > 90 for 5 minutes
- **Action**: Review application connection usage

#### LowCacheHitRatio
- **Severity**: Warning
- **Condition**: Cache hit ratio < 90% for 10 minutes
- **Action**: Consider increasing shared_buffers, review query patterns

#### HighDatabaseTransactionRollbacks
- **Severity**: Warning
- **Condition**: Rollback rate > 10/second for 5 minutes
- **Action**: Investigate application errors causing rollbacks

### Authentication Alerts

#### HighAuthenticationFailureRate
- **Severity**: Warning
- **Condition**: Failure rate > 20% for 5 minutes
- **Action**: Check Authentik logs, possible credential issues

#### CriticalAuthenticationFailureRate
- **Severity**: Critical
- **Condition**: Failure rate > 50% for 2 minutes
- **Action**: Possible attack or Authentik service issue, immediate investigation

#### NoAuthenticationAttempts
- **Severity**: Info
- **Condition**: No auth attempts for 30 minutes
- **Action**: Normal during off-hours, awareness only

### Business Logic Alerts

#### NoNewPortfolios
- **Severity**: Info
- **Condition**: No portfolios created in 48 hours
- **Action**: Awareness of low activity, check if expected

#### HighImageUploadRate
- **Severity**: Info
- **Condition**: Image uploads > 10/second for 10 minutes
- **Action**: Monitor storage usage, possible bulk upload

### Resource Alerts

#### PrometheusScrapeFailing
- **Severity**: Critical
- **Condition**: Prometheus can't scrape itself
- **Action**: Check Prometheus logs and configuration

#### PrometheusScrapeSlowTarget
- **Severity**: Warning
- **Condition**: Scraping takes > 1 second for 5 minutes
- **Action**: Check target health, possible network issues

## Viewing Alerts

### In Prometheus

1. **Navigate to**: `http://localhost:9090/alerts`
2. **View States**:
   - **Inactive** (green): Alert condition not met
   - **Pending** (yellow): Condition met, waiting for duration
   - **Firing** (red): Alert is active

3. **Alert Details**: Click alert to see:
   - Current value
   - When it started firing
   - Labels and annotations

### In Grafana (Optional - requires Alerting setup)

Grafana can also display Prometheus alerts:
1. Navigate to **Alerting** → **Alert Rules**
2. Configure contact points for notifications

## Setting Up Alert Notifications

Currently, alerts fire in Prometheus but don't send notifications. To receive notifications:

### Option 1: Alertmanager (Recommended)

1. **Add Alertmanager to docker-compose.yml**:
   ```yaml
   alertmanager:
     image: prom/alertmanager:latest
     container_name: portfolio-alertmanager
     restart: unless-stopped
     profiles:
       - monitoring
     ports:
       - "9093:9093"
     volumes:
       - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro,Z
     networks:
       - portfolio-network
   ```

2. **Create Alertmanager config** (`monitoring/alertmanager/alertmanager.yml`):
   ```yaml
   global:
     resolve_timeout: 5m

   route:
     group_by: ['alertname', 'severity']
     group_wait: 10s
     group_interval: 10s
     repeat_interval: 12h
     receiver: 'default'

   receivers:
     - name: 'default'
       # Add your notification method here
       webhook_configs:
         - url: 'http://your-webhook-url'
       # OR email:
       email_configs:
         - to: 'you@example.com'
           from: 'alertmanager@example.com'
           smarthost: 'smtp.gmail.com:587'
           auth_username: 'your-email@gmail.com'
           auth_password: 'your-app-password'
   ```

3. **Update Prometheus config** (`monitoring/prometheus/prometheus.yml`):
   ```yaml
   alerting:
     alertmanagers:
       - static_configs:
           - targets: ['alertmanager:9093']
   ```

4. **Restart monitoring stack**

### Option 2: Grafana Alerting

Use Grafana's built-in alerting with contact points (email, Slack, PagerDuty, etc.)

## Customizing Alerts

### Adjusting Thresholds

Edit `/monitoring/prometheus/rules/alerts.yml`:

```yaml
# Example: Change high error rate threshold from 5% to 10%
- alert: HighErrorRate
  expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.10  # Changed from 0.05
  for: 5m
```

### Adding New Alerts

Add to `/monitoring/prometheus/rules/alerts.yml`:

```yaml
- alert: YourCustomAlert
  expr: your_metric > threshold
  for: duration
  labels:
    severity: warning
    service: your-service
  annotations:
    summary: "Brief description"
    description: "Detailed description with {{ $value }}"
```

### Reload Configuration

After editing alert rules:
```bash
# Reload Prometheus without restart
curl -X POST http://localhost:9090/-/reload

# OR restart Prometheus
podman compose restart prometheus
```

## Testing Alerts

### Trigger Test Alert

1. **Stop Backend** to trigger `BackendServiceDown`:
   ```bash
   podman compose stop portfolio-backend
   ```

2. **Wait 2 minutes** - alert will go to Pending then Firing

3. **Check in Prometheus**: `http://localhost:9090/alerts`

4. **Restart Backend**:
   ```bash
   podman compose start portfolio-backend
   ```

5. **Alert resolves automatically**

### Simulate High Error Rate

Temporarily break an endpoint to generate 5xx errors, or use load testing tool.

## Best Practices

### For Alerts

1. **Don't Over-Alert**: Too many alerts cause alert fatigue
2. **Actionable Only**: Alerts should require action
3. **Clear Descriptions**: Include remediation steps
4. **Appropriate Severity**: Reserve "critical" for real emergencies
5. **Test Regularly**: Ensure alerts fire as expected

### For Dashboards

1. **Start Simple**: Don't overcomplicate panels
2. **Consistent Time Ranges**: Use same range across related panels
3. **Color Coding**: Green=good, Yellow=warning, Red=critical
4. **Labels**: Clear panel titles and axes labels
5. **Organize**: Group related metrics together

### For Metrics

1. **Cardinality**: Don't create metrics with high cardinality (unique label combinations)
2. **Naming**: Follow Prometheus naming conventions
3. **Units**: Use consistent units (seconds, bytes, etc.)
4. **Documentation**: Document custom metrics

## Troubleshooting

### Alerts Not Firing

**Check**:
1. Prometheus is scraping metrics: `http://localhost:9090/targets`
2. Metric exists: Query in Prometheus
3. Rule syntax is correct: Check `/etc/prometheus/rules/alerts.yml`
4. Reload Prometheus after rule changes

### Dashboard Shows No Data

**Check**:
1. Prometheus is up: `http://localhost:9090`
2. Data source configured in Grafana
3. Metrics are being collected (check Prometheus)
4. Time range is appropriate

### Metrics Missing

**Check**:
1. Backend is exporting metrics: `curl http://localhost:8000/metrics`
2. PostgreSQL exporter is up: `curl http://localhost:9187/metrics`
3. Prometheus is scraping (check targets)
4. No authentication issues (check basic auth credentials)

## Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| Grafana | http://localhost:3001 | View dashboards |
| Prometheus | http://localhost:9090 | Query metrics, view alerts |
| Prometheus Targets | http://localhost:9090/targets | Check scrape health |
| Prometheus Alerts | http://localhost:9090/alerts | View alert status |
| Backend Metrics | http://localhost:8000/metrics | Raw metrics (requires auth) |
| PostgreSQL Metrics | http://localhost:9187/metrics | Database metrics |

## Next Steps

1. ✅ Review dashboards in Grafana
2. ✅ Check alerts in Prometheus
3. ⚠️ Set up Alertmanager for notifications (optional)
4. ⚠️ Customize alert thresholds for your needs
5. ⚠️ Create custom dashboards for specific use cases
6. ⚠️ Document your alert response procedures

## Additional Resources

- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
