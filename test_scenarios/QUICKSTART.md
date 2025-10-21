# Quick Start Guide - Performance Testing

## Current Service Status

Your services are running on:
- **Backend API**: http://localhost:8000
- **Auth Service**: http://localhost:8080

## Run Your First Test (Right Now!)

Since both services are running, you can run the load test immediately:

```bash
cd ~/GolandProjects/portfolio-manager
k6 run test_scenarios/load_test.js
```

## What to Expect

The test will:
1. ✅ Check backend health (port 8000)
2. ✅ Authenticate with auth service (port 8080)
3. 🔄 Simulate 5-15 users over 4 minutes
4. 📊 Report performance metrics

### Sample Output

```
✓ http_req_duration.............: p(95)<500ms
✓ http_req_failed...............: rate<0.01
✓ health check successful
✓ service is healthy
```

## All Available Tests

### 1. Load Test (4 minutes)
```bash
k6 run test_scenarios/load_test.js
```
Normal expected load - validates typical performance

### 2. Stress Test (17 minutes)
```bash
k6 run test_scenarios/stress_test.js
```
Gradually increases load to find breaking point

### 3. Spike Test (6 minutes)
```bash
k6 run test_scenarios/spike_test.js
```
Tests sudden traffic spikes and recovery

### 4. Soak Test (32 minutes)
```bash
k6 run test_scenarios/soak_test.js
```
Long-running test to find memory leaks

## Interactive Test Runner

For easier testing:

```bash
cd test_scenarios
./run_all_tests.sh
```

This will show you a menu to choose which tests to run.

## Quick Validation Test

Want to test quickly without waiting 4 minutes? Run a short version:

```bash
# 30 second test with 5 users
k6 run test_scenarios/load_test.js --duration 30s --vus 5
```

## Check Services Before Testing

```bash
# Backend
curl http://localhost:8000/health

# Auth
curl http://localhost:8080/health
```

Both should return status 200 and show "connected" database.

## Common Issues

### "command not found: k6"
Install k6 first:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6
```

### Tests fail with "connection refused"
Check if services are running:
```bash
# Check with docker/podman
podman ps
# or
docker ps

# You should see portfolio-backend and portfolio-auth running
```

### Authentication warnings
If auth service is having issues, you can skip it:
```bash
K6_SKIP_AUTH=true k6 run test_scenarios/load_test.js
```

## Understanding Results

### Good Performance
```
http_req_duration: avg=200ms p(95)=450ms  ✅
http_req_failed..: 0.12%                  ✅
```

### Performance Issues
```
http_req_duration: avg=1.5s p(95)=3.2s    ⚠️
http_req_failed..: 5.4%                    ⚠️
```

## Monitoring During Tests

While tests run, monitor:

1. **Grafana Dashboard**: http://localhost:3001
   - Username: admin
   - Password: admin

2. **Prometheus Metrics**: http://localhost:9090

3. **Backend Metrics**: http://localhost:8000/metrics

## Next Steps After First Test

1. ✅ Run load test
2. 📊 Document baseline performance
3. 🔄 Run after making changes to compare
4. 📈 Set up alerts in Grafana for regressions

## Pro Tips

**Save test results:**
```bash
k6 run test_scenarios/load_test.js --out json=results.json
```

**Generate HTML report:**
```bash
k6 run test_scenarios/load_test.js --out json=results.json
# Then convert to HTML with k6-reporter or similar tools
```

**Custom thresholds:**
```bash
k6 run test_scenarios/load_test.js \
  --threshold http_req_duration=p(95)<300
```

---

**Ready to test?** Run this now:
```bash
k6 run test_scenarios/load_test.js
```
