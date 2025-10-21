# Performance Testing with k6

This directory contains comprehensive performance test scenarios for the Portfolio Manager API using [k6](https://k6.io/).

## Overview

Performance testing validates that the API performs well under various load conditions. This suite includes four types of tests:

1. **Load Test** - Validates performance under expected load
2. **Stress Test** - Finds breaking points under extreme conditions
3. **Spike Test** - Tests behavior during sudden traffic spikes
4. **Soak Test** - Identifies issues over extended periods (memory leaks, degradation)

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows (Chocolatey):**
```powershell
choco install k6
```

For other platforms, see the [k6 installation guide](https://k6.io/docs/getting-started/installation/).

## Configuration

### Environment Variables

Configure tests using environment variables:

```bash
# API Base URL (default: http://localhost:8000)
export K6_BASE_URL=http://localhost:8000

# Auth Service URL (default: http://localhost:8080)
export K6_AUTH_URL=http://localhost:8080

# Test User Credentials
export K6_TEST_USERNAME=test@example.com
export K6_TEST_PASSWORD=testpassword

# Optional: Skip authentication (useful when auth service is not running)
export K6_SKIP_AUTH=true
```

### Running Without Auth Service

If the auth service is not running, you can still run tests by skipping authentication:

```bash
K6_SKIP_AUTH=true k6 run test_scenarios/load_test.js
```

**Note:** Some endpoints require authentication and will return 401 errors when auth is skipped. This is expected behavior.

### Test Configuration

All tests share common configuration from `config.js`, including:
- Base URLs
- Performance thresholds
- Authentication settings
- Common headers

## Running Tests

### 1. Load Test (Normal Load)

Tests the API under expected normal conditions.

**Duration:** ~4 minutes
**Max VUs:** 15 concurrent users
**Use Case:** Validate normal operation performance

```bash
k6 run load_test.js
```

**Expected Results:**
- p95 response time < 500ms
- Error rate < 1%
- Successful completion of all test stages

### 2. Stress Test (Find Breaking Point)

Gradually increases load to find the system's breaking point.

**Duration:** ~17 minutes
**Max VUs:** 200 concurrent users
**Use Case:** Identify maximum capacity and degradation patterns

```bash
k6 run stress_test.js
```

**Expected Results:**
- p95 response time < 2000ms (relaxed for stress test)
- Error rate < 5%
- Identify at what load the system starts degrading

**Key Metrics to Monitor:**
- Database connection pool utilization
- CPU usage
- Memory consumption
- Response time trends

### 3. Spike Test (Traffic Spikes)

Tests the system's ability to handle sudden traffic increases.

**Duration:** ~6 minutes
**Max VUs:** 150 concurrent users (in spikes)
**Use Case:** Validate resilience to sudden traffic changes

```bash
k6 run spike_test.js
```

**Expected Results:**
- System remains stable during spikes
- Quick recovery after spike ends
- No cascading failures
- Error rate < 10% during spikes

**Key Metrics to Monitor:**
- Recovery time after spike
- Error patterns during spike
- Database connection behavior
- Request queuing

### 4. Soak Test (Endurance Test)

Runs sustained load for 30 minutes to identify long-term issues.

**Duration:** ~32 minutes
**Max VUs:** 20 concurrent users (sustained)
**Use Case:** Detect memory leaks, connection leaks, performance degradation

```bash
k6 run soak_test.js
```

**Expected Results:**
- Stable performance throughout test duration
- No memory leaks
- No connection pool exhaustion
- Response times remain consistent

**Key Metrics to Monitor:**
- Memory usage over time
- Database connection count trends
- Response time comparison (early vs late)
- Goroutine count (for Go apps)
- File descriptor count

## Test Scenarios Explained

### Load Test Workflow

Each virtual user (VU) performs:
1. List portfolios (most common operation)
2. Create a portfolio
3. Get portfolio details
4. Create category
5. Create project
6. Create section
7. Update portfolio
8. List portfolios again (test caching)

### Stress Test Workflow

Each VU performs:
1. Heavy read operations (multiple list queries)
2. Rapid resource creation
3. Mixed read/write operations
4. Database-intensive paginated queries

### Spike Test Workflow

Users are split into three groups:
- **33% Read-Heavy:** Perform multiple read operations
- **33% Write-Heavy:** Create multiple resources
- **34% Mixed:** Balance of reads and writes

### Soak Test Workflow

Simulates realistic user sessions:
1. Browse portfolios
2. Create portfolio
3. View portfolio details
4. Add sections
5. Create categories
6. Add projects
7. Update portfolio
8. Browse portfolios again
9. Health checks every 10 iterations

## Understanding Results

### Key Metrics

**Response Time:**
- `p(50)` - Median response time
- `p(95)` - 95th percentile (95% of requests faster than this)
- `p(99)` - 99th percentile
- `max` - Maximum response time observed

**HTTP Metrics:**
- `http_req_duration` - Total request duration
- `http_req_waiting` - Time waiting for response (TTFB)
- `http_req_failed` - Percentage of failed requests
- `http_reqs` - Total requests per second

### Interpreting Results

**Good Performance:**
```
✓ http_req_duration..............: avg=245ms  p(95)=450ms
✓ http_req_failed................: 0.15%
✓ http_reqs......................: 125/s
```

**Performance Issues:**
```
✗ http_req_duration..............: avg=1.2s   p(95)=3.5s
✗ http_req_failed................: 5.25%
✓ http_reqs......................: 45/s
```

## Performance Optimization Features

The API includes several performance optimizations tested by these scenarios:

### 1. Database Indexes
- Foreign key indexes (portfolio_id, category_id, etc.)
- Composite indexes for common queries
- Position-based ordering indexes

**Impact:** 30-50% faster on list queries

### 2. Response Compression
- Gzip compression for responses > 1KB
- Automatic based on Accept-Encoding header

**Impact:** 40-60% bandwidth reduction

### 3. HTTP Caching
- ETag support for conditional requests
- Cache-Control headers for public resources
- 304 Not Modified responses

**Impact:** Near-instant response for unchanged resources

### 4. Connection Pooling
- Configurable via environment variables:
  - `DB_MAX_IDLE_CONNS` (default: 10)
  - `DB_MAX_OPEN_CONNS` (default: 100)
  - `DB_CONN_MAX_LIFETIME` (default: 1h)
  - `DB_CONN_MAX_IDLE_TIME` (default: 10m)

**Impact:** Better handling of concurrent requests

## Troubleshooting

### Common Issues

**"Authentication failed" or "Authentication error"**
- **Quick fix:** Run with `K6_SKIP_AUTH=true` to bypass authentication
- Ensure auth service is running on configured port: `curl http://localhost:8081/health`
- Verify test credentials exist in database
- Check `K6_AUTH_URL` environment variable
- Tests will continue without auth but some endpoints may return 401 errors

**"Connection refused"**
- Verify API is running: `curl http://localhost:8080/health`
- Check `K6_BASE_URL` environment variable
- Ensure no firewall blocking connections

**High error rates**
- Check database is running and accessible
- Review API logs for errors
- Verify database connection pool settings
- Check available resources (CPU, memory, connections)

**Slow response times**
- Verify performance indexes are applied
- Check database query plans
- Monitor database connection pool utilization
- Review application logs for slow queries

## Best Practices

### Before Running Tests

1. **Clean Test Environment:** Use a dedicated test database
2. **Baseline Metrics:** Run tests on known-good state to establish baseline
3. **Monitor Resources:** Have monitoring tools ready (database, CPU, memory)
4. **Clear Data:** Clean up test data between runs for consistent results

### During Tests

1. **Single Test at a Time:** Don't run multiple tests simultaneously
2. **Monitor Logs:** Watch application and database logs
3. **Resource Monitoring:** Track CPU, memory, database connections
4. **Network Stability:** Ensure stable network connection

### After Tests

1. **Review All Metrics:** Don't just look at pass/fail
2. **Compare Results:** Track trends over time
3. **Investigate Failures:** Review logs for failed requests
4. **Clean Up:** Remove test data if needed

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 10
      - name: Run load test
        run: k6 run test_scenarios/load_test.js
        env:
          K6_BASE_URL: http://localhost:8080
          K6_AUTH_URL: http://localhost:8081
```

## Performance Baseline

After running tests on a fresh deployment, document your baseline metrics here:

### Example Baseline (Update with your results)

**Load Test:**
- p95 response time: ___ ms
- p99 response time: ___ ms
- Error rate: ___%
- Throughput: ___ req/s

**Stress Test:**
- Breaking point: ___ VUs
- Max throughput: ___ req/s
- Error rate at max load: ___%

**Spike Test:**
- Response time during spike: ___ ms
- Recovery time: ___ seconds
- Error rate during spike: ___%

**Soak Test:**
- Response time degradation: ___%
- Memory growth: ___ MB
- Final response time: ___ ms

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Grafana k6 Cloud](https://k6.io/cloud/) - For advanced metrics visualization

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review k6 documentation
3. Check application logs
4. Open an issue in the repository
