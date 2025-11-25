# How to Investigate Issues

Debug errors, read logs, and find the root cause of problems.

**Time**: 30 minutes | **Difficulty**: Beginner

---

## 📋 What & Why

**What**: Debug errors, analyze logs, find root causes

**Why**:
- Fix bugs quickly
- Understand system behavior
- Prevent future issues
- Improve reliability

---

## 📝 Investigation Process

### 1. Gather Information (5 min)

**Questions to ask:**
- What went wrong?
- When did it start?
- What changed recently?
- Can you reproduce it?
- Who is affected?

**Document:**
```markdown
## Issue Report
- **Date**: 2025-01-25 10:30
- **Reporter**: user@example.com
- **Symptom**: Can't create portfolio
- **Error**: "500 Internal Server Error"
- **Recent Changes**: Deployed v1.2.0 yesterday
- **Reproducible**: Yes, every time
```

### 2. Check Service Health (2 min)

```bash
# SSH to server
ssh deploy@your-server-ip

# Check all services
cd /opt/portfolio-manager
docker compose ps

# All should show "Up" or "healthy"
# If not:
docker compose up -d SERVICE_NAME
```

### 3. Check Backend Logs (10 min)

```bash
# Real-time logs
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Search for errors
docker compose logs backend | grep ERROR

# Check specific time
docker compose logs backend --since 2025-01-25T10:00:00

# Find specific error
docker compose logs backend | grep "portfolio"
```

**Look for:**
```
ERROR: Database connection failed
ERROR: Validation error: Title is required
PANIC: runtime error: nil pointer dereference
ERROR: Failed to connect to Authentik
```

### 4. Check Frontend Logs (5 min)

```bash
# Frontend container logs
docker compose logs frontend

# Frontend access logs (Nginx if applicable)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Browser console (ask user)
# Press F12 in browser → Console tab
```

### 5. Check Database (10 min)

```bash
# Access database
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

# Check database size
SELECT pg_size_pretty(pg_database_size('portfolio_db'));

# Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Exit
\q
```

---

## 📝 Common Issues

### Issue: 500 Internal Server Error

**Check backend logs:**
```bash
docker compose logs backend | grep ERROR | tail -20
```

**Common causes:**
- Database connection lost
- Nil pointer dereference
- Missing environment variable
- Disk full

**Solutions:**
```bash
# Restart backend
docker compose restart backend

# Check .env file
cat .env | grep -v PASSWORD | grep -v SECRET

# Check disk space
df -h
```

### Issue: Cannot Login / Auth Errors

**Check Authentik:**
```bash
# Check Authentik is running
docker compose ps portfolio-authentik-server

# Check logs
docker compose logs portfolio-authentik-server | tail -50

# Check client secret matches
cat .env | grep AUTHENTIK_CLIENT_SECRET
# Compare with Authentik admin panel
```

### Issue: Slow Performance

**Check resource usage:**
```bash
# CPU and memory
docker stats

# Disk I/O
iotop  # or: docker stats

# Database connections
docker compose exec portfolio-postgres psql -U portfolio_user -d portfolio_db -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
docker compose logs portfolio-postgres | grep "duration:"
```

### Issue: Database Errors

**Check database logs:**
```bash
docker compose logs portfolio-postgres | grep ERROR

# Common errors:
# - "too many connections" → Increase max_connections
# - "disk full" → Clean up space
# - "deadlock detected" → Application bug
```

### Issue: Can't Connect to API

**Check network:**
```bash
# Test from server
curl http://localhost:8000/health

# Test from outside
curl http://your-server-ip:8000/health

# Check firewall
sudo ufw status | grep 8000

# Check port is listening
sudo netstat -tlnp | grep :8000
```

---

## 📝 Debugging Tools

### View Structured Logs

```bash
# Pretty print JSON logs
docker compose logs backend | grep -o '{.*}' | jq '.'

# Filter by level
docker compose logs backend | grep '"level":"error"'

# Filter by user
docker compose logs backend | grep '"userID":"user123"'
```

### Trace Specific Request

```bash
# Find request in logs
docker compose logs backend | grep "POST /api/portfolios"

# Follow the request ID through logs
# (if request IDs are implemented)
docker compose logs backend | grep "request_id=abc123"
```

### Check Configuration

```bash
# Environment variables
docker compose exec backend env

# Database connection
docker compose exec backend sh
# Inside container:
echo $DB_HOST
echo $DB_NAME
exit
```

---

## 📝 Investigation Checklist

When investigating an issue:

1. **Reproduce**
   - [ ] Can you make it happen again?
   - [ ] What are the exact steps?

2. **Logs**
   - [ ] Backend logs checked
   - [ ] Frontend logs checked
   - [ ] Database logs checked
   - [ ] Authentik logs checked

3. **Health**
   - [ ] All services running
   - [ ] Health endpoint returns OK
   - [ ] Database accessible

4. **Resources**
   - [ ] Disk space sufficient
   - [ ] Memory usage normal
   - [ ] CPU usage normal

5. **Recent Changes**
   - [ ] What was deployed recently?
   - [ ] Any config changes?
   - [ ] Database migrations?

6. **Root Cause**
   - [ ] Identified in logs
   - [ ] Reproducible
   - [ ] Understood

7. **Fix**
   - [ ] Solution tested
   - [ ] Deployed to production
   - [ ] Verified working
   - [ ] Documented

---

## ✔️ Document Findings

```markdown
## Investigation Report

**Issue**: Can't create portfolio
**Date**: 2025-01-25 10:30
**Duration**: 2 hours
**Affected Users**: All users

### Symptoms
- Error: "500 Internal Server Error"
- Happens when clicking "Create Portfolio"

### Root Cause
- Database connection pool exhausted
- Max connections set to 20
- 25 concurrent users trying to create portfolios

### Evidence
- Backend logs: "pq: sorry, too many clients already"
- Database: `SELECT count(*) FROM pg_stat_activity;` returned 20
- Started after marketing campaign brought traffic spike

### Solution
1. Increased max_connections to 100 in PostgreSQL
2. Restarted database
3. Verified with load test

### Prevention
- Monitor database connections in Grafana
- Add alert when connections > 80
- Consider connection pooling improvements

### Follow-up
- [ ] Create Grafana alert
- [ ] Load test with 100 concurrent users
- [ ] Document in runbook
```

---

## ➡️ Next Steps

- [How to Rollback](./how-to-rollback.md) - If investigation shows need to rollback
- [How to Audit](./how-to-audit.md) - Check audit logs for clues
- [How to Monitor](./how-to-monitor.md) - Prevent issues proactively

---

## 🎓 What You Learned

- ✅ Systematic investigation process
- ✅ Reading Docker logs effectively
- ✅ Database debugging techniques
- ✅ Common issues and solutions
- ✅ Root cause analysis
- ✅ Documentation practices

**You can now confidently debug issues!** 🔍

---

**Last Updated**: 2025-01-25
