# How to Monitor Portfolio Manager

Learn to use Grafana, check metrics, and stay ahead of problems.

**Time**: 30 minutes | **Difficulty**: Beginner | **Frequency**: Daily checks

---

## 📋 What & Why

**What**: Monitor application health, performance, and usage with Grafana/Prometheus

**Why**:
- Catch problems before users do
- Understand usage patterns
- Optimize performance
- Plan capacity
- Meet SLAs

---

## 📝 Quick Start (5 minutes)

### Access Grafana

```bash
# Open in browser
http://your-server-ip:3001

# Or with domain:
https://grafana.yourdomain.com

# Default login:
Username: admin
Password: admin

# Change password on first login!
```

### Key Dashboards

Portfolio Manager includes pre-configured dashboards:

1. **System Overview** - Server health (CPU, memory, disk)
2. **Application Metrics** - API requests, response times, errors
3. **Database Metrics** - Connections, query performance
4. **Business Metrics** - Users, portfolios, projects created

---

## 📝 Daily Health Check (5 minutes)

### Morning Routine

```bash
# 1. Check services are running
ssh deploy@your-server-ip
docker compose ps
# All should show "Up"

# 2. Check health endpoint
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# 3. Quick log check
docker compose logs --tail=50 backend | grep ERROR
# Should be empty or only expected errors

# 4. Open Grafana
# http://your-server-ip:3001
# Look at "System Overview" dashboard
```

**Green = Good!** ✅
**Red/Orange = Investigate!** ⚠️

---

## 📝 Key Metrics to Monitor

### 1. System Resources

**CPU Usage**
- **Good**: < 70%
- **Warning**: 70-85%
- **Critical**: > 85%

**Memory Usage**
- **Good**: < 80%
- **Warning**: 80-90%
- **Critical**: > 90%

**Disk Usage**
- **Good**: < 70%
- **Warning**: 70-85%
- **Critical**: > 85%

```bash
# Check from command line
ssh deploy@your-server-ip

# CPU and memory
htop

# Disk
df -h

# Docker stats
docker stats --no-stream
```

### 2. Application Health

**HTTP Request Rate**
- Normal: Varies by traffic (track baseline)
- Sudden spike: Traffic surge or attack
- Sudden drop: Service issue

**Response Time (P95)**
- **Good**: < 200ms
- **Warning**: 200-500ms
- **Critical**: > 500ms

**Error Rate**
- **Good**: < 0.1%
- **Warning**: 0.1-1%
- **Critical**: > 1%

```bash
# Check error rate in logs
docker compose logs backend --since 1h | \
  grep -c ERROR

# Should be very low (0-5 per hour is normal)
```

### 3. Database Performance

**Active Connections**
- **Good**: < 50
- **Warning**: 50-80
- **Critical**: > 80 (max is 100)

**Query Duration (P95)**
- **Good**: < 100ms
- **Warning**: 100-500ms
- **Critical**: > 500ms

```bash
# Check connections
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
docker compose logs portfolio-postgres | grep "duration:" | grep -v "duration: 0\."
```

### 4. Business Metrics

**Track growth:**
- New users per day
- Portfolios created
- Projects uploaded
- Active users

```bash
# Quick stats from database
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
-- Users created today
SELECT COUNT(*) as new_users_today
FROM users
WHERE DATE(created_at) = CURRENT_DATE;

-- Total portfolios
SELECT COUNT(*) as total_portfolios
FROM portfolios
WHERE deleted_at IS NULL;

-- Projects created this week
SELECT COUNT(*) as projects_this_week
FROM projects
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
EOF
```

---

## 📝 Setting Up Alerts

### Grafana Alert Rules

1. Go to Grafana → Alerting → Alert Rules
2. Click "New alert rule"

**Example: High CPU Alert**
```
Name: High CPU Usage
Condition: avg(cpu_usage) > 85 for 5 minutes
Notification: Email to ops@example.com
```

**Example: Error Rate Alert**
```
Name: High Error Rate
Condition: rate(http_errors) > 0.01 for 2 minutes
Notification: Slack #alerts channel
```

**Example: Disk Space Alert**
```
Name: Low Disk Space
Condition: disk_usage > 85%
Notification: Email + Slack
```

### Email Notifications

1. Grafana → Configuration → Notification channels
2. Add new channel:
   - **Type**: Email
   - **Addresses**: ops@example.com
   - **Send test**: Verify it works

### Slack Notifications

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Grafana → Configuration → Notification channels
3. Add new channel:
   - **Type**: Slack
   - **Webhook URL**: (paste webhook)
   - **Channel**: #alerts
   - **Send test**: Verify it works

---

## 📝 Prometheus Queries

### Useful Queries

**HTTP request rate:**
```promql
rate(http_requests_total[5m])
```

**Error rate:**
```promql
rate(http_errors_total[5m]) / rate(http_requests_total[5m])
```

**Response time (P95):**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Database connections:**
```promql
pg_stat_activity_count
```

**CPU usage:**
```promql
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

---

## 📝 Custom Dashboards

### Create Your Own Dashboard

1. Grafana → Dashboards → New Dashboard
2. Add Panel
3. Choose visualization type (Graph, Gauge, Table)
4. Enter Prometheus query
5. Configure display options
6. Save dashboard

**Example panels:**
- Total users (Stat panel)
- Requests per minute (Graph)
- Top errors (Table)
- Response time distribution (Heatmap)

---

## 📝 Log Monitoring

### Real-time Log Monitoring

```bash
# Watch all logs
docker compose logs -f

# Watch backend only
docker compose logs -f backend

# Watch for errors
docker compose logs -f | grep ERROR

# Watch specific user
docker compose logs -f backend | grep "userID.*user123"

# Watch database queries
docker compose logs -f portfolio-postgres
```

### Log Analysis

```bash
# Count errors by type
docker compose logs backend --since 1h | \
  grep ERROR | \
  awk -F'"' '{print $4}' | \
  sort | uniq -c | sort -nr

# Find slowest requests
docker compose logs backend --since 1h | \
  grep "duration" | \
  sort -t: -k4 -nr | \
  head -10

# Most active users
docker compose logs backend --since 1h | \
  grep "userID" | \
  awk -F'"' '{print $8}' | \
  sort | uniq -c | sort -nr | \
  head -10
```

---

## 📝 Performance Monitoring

### Application Performance

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/portfolios/own

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
         time_total:  %{time_total}\n
EOF
```

### Database Performance

```bash
# Slow queries
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
EOF

# Table sizes
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db << 'EOF'
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF
```

---

## ✔️ Monitoring Checklist

**Daily:**
- [ ] Check Grafana dashboards (2 min)
- [ ] Review error logs (3 min)
- [ ] Check health endpoint (1 min)
- [ ] Verify backups ran successfully

**Weekly:**
- [ ] Review performance trends
- [ ] Check disk space growth
- [ ] Review database performance
- [ ] Check user growth metrics
- [ ] Test alerting (send test alert)

**Monthly:**
- [ ] Capacity planning (will we run out of resources?)
- [ ] Review and update alert thresholds
- [ ] Clean up old logs
- [ ] Update dashboards
- [ ] Performance optimization review

---

## 🔧 Troubleshooting

### Grafana Won't Load

```bash
# Check Grafana is running
docker compose ps | grep grafana

# Restart Grafana
docker compose restart grafana

# Check logs
docker compose logs grafana

# Access issue
sudo ufw allow 3001/tcp
```

### Prometheus Not Collecting Metrics

```bash
# Check Prometheus targets
# Open: http://your-server-ip:9090/targets
# All should show "UP"

# Restart Prometheus
docker compose restart prometheus

# Check configuration
docker compose exec prometheus cat /etc/prometheus/prometheus.yml
```

### Alerts Not Firing

```bash
# Check alert rules
# Grafana → Alerting → Alert Rules
# Should show all configured alerts

# Test notification channel
# Grafana → Notification channels → Test

# Check Grafana logs
docker compose logs grafana | grep alert
```

---

## ➡️ Next Steps

- [How to Investigate](./how-to-investigate.md) - When alerts fire
- [How to Audit](./how-to-audit.md) - Deep dive into logs
- [How to Rollback](./how-to-rollback.md) - Emergency response

---

## 🎓 What You Learned

- ✅ How to access and use Grafana
- ✅ Key metrics to monitor
- ✅ Setting up alerts
- ✅ Creating custom dashboards
- ✅ Log monitoring techniques
- ✅ Performance analysis
- ✅ Daily monitoring routine

**You can now proactively monitor your application!** 📊

---

**Last Updated**: 2025-01-25
**Recommended**: Set up alerts ASAP!
