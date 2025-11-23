# Microservices Integration Guide

> **Important:** This guide provides a **generic template** for integrating **any** new microservice into the Portfolio Manager ecosystem. Whether you're building a loyalty system, shopping cart, product catalog, analytics service, or custom business logic—follow these patterns for consistent integration.

Complete step-by-step guide for integrating new microservices into the Portfolio Manager ecosystem.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Integration Checklist](#integration-checklist)
3. [Connecting to PostgreSQL](#connecting-to-postgresql)
4. [Integrating with Authentik](#integrating-with-authentik)
5. [Adding Prometheus Metrics](#adding-prometheus-metrics)
6. [Network Configuration](#network-configuration)
7. [Deployment Patterns](#deployment-patterns)
8. [Testing Your Integration](#testing-your-integration)
9. [Production Considerations](#production-considerations)

---

## Prerequisites

Before integrating a new service, ensure you have:

- [ ] Portfolio Manager core services running
- [ ] Understanding of the [architecture](architecture.md)
- [ ] Service requirements documented
- [ ] Development environment set up

**Check core services are running:**
```bash
# List all running containers
docker ps

# Expected containers:
# - portfolio-postgres
# - portfolio-redis
# - portfolio-authentik-server
# - portfolio-authentik-worker
# - portfolio-prometheus (if monitoring enabled)
# - portfolio-grafana (if monitoring enabled)
```

---

## Integration Checklist

Use this checklist when adding a new service:

### Planning Phase
- [ ] Define service purpose and scope
- [ ] Identify data storage requirements
- [ ] Determine authentication needs
- [ ] Plan API endpoints
- [ ] Choose deployment pattern (same compose / separate / external)

### Database Setup
- [ ] Create database/schema in PostgreSQL
- [ ] Create database user with appropriate permissions
- [ ] Add connection credentials to `.env`
- [ ] Test database connection

### Authentication Setup
- [ ] Create OAuth2/OIDC provider in Authentik
- [ ] Create application in Authentik
- [ ] Configure redirect URIs
- [ ] Add client credentials to `.env`
- [ ] Implement token validation in service

### Monitoring Setup
- [ ] Implement `/metrics` endpoint
- [ ] Define custom metrics
- [ ] Add service to Prometheus scrape config
- [ ] Create Grafana dashboard
- [ ] Test metrics collection

### Networking
- [ ] Add service to Docker network
- [ ] Configure ports (internal/external)
- [ ] Set up service dependencies
- [ ] Configure firewall rules (if external)

### Documentation
- [ ] Document service API
- [ ] Update architecture diagrams
- [ ] Add troubleshooting guide
- [ ] Document environment variables

---

## Connecting to PostgreSQL

### Step 1: Create Database and User

Connect to PostgreSQL:
```bash
# Using docker exec
docker exec -it portfolio-postgres psql -U postgres

# Or from host (if port 5432 is exposed)
psql -h localhost -U postgres
```

Create your service's database:
```sql
-- Create database
CREATE DATABASE your_service_db;

-- Create user
CREATE USER your_service_user WITH PASSWORD 'secure_password_here';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE your_service_db TO your_service_user;

-- Connect to the new database
\c your_service_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO your_service_user;

-- Optional: Grant read access to portfolio_db for data sharing
GRANT CONNECT ON DATABASE portfolio_db TO your_service_user;
-- Then within portfolio_db:
\c portfolio_db
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_service_user;
```

### Step 2: Add Credentials to Environment

Add to `.env` file:
```bash
# Your Service Database Configuration
YOUR_SERVICE_DB_NAME=your_service_db
YOUR_SERVICE_DB_USER=your_service_user
YOUR_SERVICE_DB_PASSWORD=generate_secure_password_here

# Use 'make generate-secrets' to generate secure passwords
```

### Step 3: Configure Service Connection

**For Go services:**
```go
import (
    "fmt"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func ConnectDatabase() (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
        os.Getenv("DATABASE_HOST"),      // portfolio-postgres
        os.Getenv("DATABASE_USER"),      // your_service_user
        os.Getenv("DATABASE_PASSWORD"),  // from .env
        os.Getenv("DATABASE_NAME"),      // your_service_db
        os.Getenv("DATABASE_PORT"),      // 5432
    )

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    return db, nil
}
```

**For Node.js services:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DATABASE_HOST || 'portfolio-postgres',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

module.exports = pool;
```

**For Python services:**
```python
import psycopg2
import os

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST', 'portfolio-postgres'),
        port=os.getenv('DATABASE_PORT', '5432'),
        database=os.getenv('DATABASE_NAME'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD')
    )
    return conn
```

### Step 4: Docker Compose Configuration

```yaml
your-service:
  build: ./services/your-service
  container_name: portfolio-your-service
  environment:
    - DATABASE_HOST=portfolio-postgres
    - DATABASE_PORT=5432
    - DATABASE_NAME=${YOUR_SERVICE_DB_NAME}
    - DATABASE_USER=${YOUR_SERVICE_DB_USER}
    - DATABASE_PASSWORD=${YOUR_SERVICE_DB_PASSWORD}
  networks:
    - portfolio-network
  depends_on:
    - portfolio-postgres
```

### Step 5: Test Connection

```bash
# Start your service
docker compose up -d your-service

# Check logs
docker logs portfolio-your-service

# Test database connection from service container
docker exec -it portfolio-your-service sh
# Then inside container:
psql -h portfolio-postgres -U your_service_user -d your_service_db
```

---

## Integrating with Authentik

### Step 1: Create OAuth2 Provider

1. Access Authentik UI: http://localhost:9000
2. Log in with admin credentials
3. Navigate to **Applications** → **Providers** → **Create**
4. Select **OAuth2/OpenID Connect Provider**
5. Configure:
   - **Name**: `your-service-provider`
   - **Authorization flow**: `default-provider-authorization-explicit-consent`
   - **Client type**:
     - `Confidential` for backend services
     - `Public` for frontend/SPA services
   - **Client ID**: `your-service` (or auto-generate)
   - **Redirect URIs**: Add all callback URLs:
     ```
     http://localhost:YOUR_PORT/auth/callback
     http://localhost:YOUR_PORT/
     ```
6. **Save** and **copy the Client Secret** (you won't see it again!)

### Step 2: Create Application

1. Navigate to **Applications** → **Applications** → **Create**
2. Configure:
   - **Name**: `Your Service Name`
   - **Slug**: `your-service`
   - **Provider**: Select the provider created in Step 1
3. **Save**

### Step 3: Add to Environment

```bash
# In .env file
YOUR_SERVICE_AUTHENTIK_CLIENT_ID=your-service
YOUR_SERVICE_AUTHENTIK_CLIENT_SECRET=<secret-from-step-1>
AUTHENTIK_URL=http://portfolio-authentik-server:9000
```

### Step 4: Implement Authentication

**Backend Service (Go example):**

```go
package middleware

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
)

type AuthentikUserInfo struct {
    Sub               string   `json:"sub"`
    Email             string   `json:"email"`
    Name              string   `json:"name"`
    PreferredUsername string   `json:"preferred_username"`
    Groups            []string `json:"groups"`
}

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        if token == authHeader {
            c.JSON(401, gin.H{"error": "Bearer token required"})
            c.Abort()
            return
        }

        // Validate token with Authentik
        userInfo, err := validateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        // Store user info in context
        c.Set("user", userInfo)
        c.Next()
    }
}

func validateToken(token string) (*AuthentikUserInfo, error) {
    authentikURL := os.Getenv("AUTHENTIK_URL")
    userinfoURL := fmt.Sprintf("%s/application/o/userinfo/", authentikURL)

    req, _ := http.NewRequest("GET", userinfoURL, nil)
    req.Header.Set("Authorization", "Bearer "+token)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("invalid token")
    }

    var userInfo AuthentikUserInfo
    if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
        return nil, err
    }

    return &userInfo, nil
}
```

**Frontend Service (React/TypeScript example):**

```typescript
// authConfig.ts
export const authConfig = {
    authority: import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:9000/application/o/your-service/',
    client_id: import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'your-service',
    redirect_uri: window.location.origin + '/auth/callback',
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: window.location.origin,
};

// Use react-oidc-context or similar library
import { AuthProvider } from 'react-oidc-context';

function App() {
    return (
        <AuthProvider {...authConfig}>
            <YourApp />
        </AuthProvider>
    );
}
```

### Step 5: Test Authentication

```bash
# Test userinfo endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:9000/application/o/userinfo/

# Expected response:
# {
#   "sub": "...",
#   "email": "user@example.com",
#   "name": "User Name",
#   ...
# }
```

---

## Adding Prometheus Metrics

### Step 1: Implement /metrics Endpoint

**Go (using Prometheus client):**

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )

    // Custom business metrics (examples - customize for your service)
    customBusinessMetric = prometheus.NewCounter(
        prometheus.CounterOpts{
            Name: "service_specific_operations_total",
            Help: "Total number of service-specific operations",
        },
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal)
    prometheus.MustRegister(httpRequestDuration)
    prometheus.MustRegister(customBusinessMetric)
}

func setupMetrics(router *gin.Engine) {
    // Expose /metrics endpoint
    router.GET("/metrics", gin.WrapH(promhttp.Handler()))

    // Middleware to track all requests
    router.Use(metricsMiddleware())
}

func metricsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        timer := prometheus.NewTimer(httpRequestDuration.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
        ))
        defer timer.ObserveDuration()

        c.Next()

        httpRequestsTotal.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
            fmt.Sprintf("%d", c.Writer.Status()),
        ).Inc()
    }
}
```

**Node.js (using prom-client):**

```javascript
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'endpoint', 'status'],
    registers: [register]
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Middleware to track requests
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestsTotal.labels(req.method, req.path, res.statusCode).inc();
    });
    next();
});
```

### Step 2: Add to Prometheus Configuration

Edit `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  # Existing jobs...

  - job_name: 'your-service'
    static_configs:
      - targets: ['portfolio-your-service:8080']  # Service container name and port
    metrics_path: '/metrics'
    scrape_interval: 15s
    # Add authentication if your /metrics endpoint requires it
    # basic_auth:
    #   username: 'metrics'
    #   password: 'password'
```

### Step 3: Restart Prometheus

```bash
make monitoring-update
```

### Step 4: Verify Metrics Collection

1. Open Prometheus: http://localhost:9090
2. Go to **Status** → **Targets**
3. Find your service job - should show as "UP" (green)
4. Go to **Graph** and test a query:
   ```promql
   rate(http_requests_total{job="your-service"}[5m])
   ```

### Step 5: Create Grafana Dashboard

1. Open Grafana: http://localhost:3001
2. **Dashboards** → **New** → **Import**
3. Create panels with queries like:
   ```promql
   # Request Rate
   sum(rate(http_requests_total{job="your-service"}[5m])) by (endpoint)

   # Error Rate
   sum(rate(http_requests_total{job="your-service",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="your-service"}[5m]))

   # 95th Percentile Latency
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="your-service"}[5m]))
   ```

---

## Network Configuration

### Same Docker Compose Network

Services in the same `docker-compose.yml` automatically share a network:

```yaml
services:
  your-service:
    # ...
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
```

**Service Discovery:** Use container names as hostnames
- PostgreSQL: `portfolio-postgres:5432`
- Redis: `portfolio-redis:6379`
- Authentik: `portfolio-authentik-server:9000`
- Backend API: `portfolio-backend:8000`

### Separate Docker Compose (Same Host)

Join the existing network:

```yaml
# your-service/docker-compose.yml
services:
  your-service:
    # ...
    networks:
      - portfolio-network

networks:
  portfolio-network:
    external: true  # Use existing network from main compose
```

### External Server (Different Host)

**On Portfolio Manager server**, expose necessary services:

```yaml
# Expose PostgreSQL (CAREFUL - security risk!)
services:
  portfolio-postgres:
    ports:
      - "5432:5432"  # Bind to all interfaces
    # Or bind to specific IP:
    # ports:
    #   - "10.0.1.50:5432:5432"
```

**Configure firewall:**
```bash
# Allow your service's server IP
sudo ufw allow from 10.0.2.50 to any port 5432
sudo ufw allow from 10.0.2.50 to any port 9000  # Authentik

# Deny from everywhere else
sudo ufw deny 5432
sudo ufw deny 9000
```

**On your service's server:**
```yaml
services:
  your-service:
    environment:
      - DATABASE_HOST=10.0.1.50  # Portfolio Manager server IP
      - AUTHENTIK_URL=http://10.0.1.50:9000
```

---

## Deployment Patterns

### Pattern 1: Development (Same Docker Compose)

**Use case:** Local development, testing

```yaml
# Add to main docker-compose.yml
services:
  your-service:
    build: ./services/your-service
    container_name: portfolio-your-service
    restart: unless-stopped
    environment:
      - DATABASE_HOST=portfolio-postgres
      - AUTHENTIK_URL=http://portfolio-authentik-server:9000
    ports:
      - "8080:8080"
    networks:
      - portfolio-network
    depends_on:
      - portfolio-postgres
      - portfolio-redis
```

**Start:**
```bash
docker compose up -d your-service
```

### Pattern 2: Separate Compose (Same Host)

**Use case:** Independent deployment, production-like staging

```bash
# Create service directory
mkdir -p services/your-service
cd services/your-service

# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  your-service:
    build: .
    container_name: portfolio-your-service
    restart: unless-stopped
    env_file:
      - ../../.env  # Use shared .env
    environment:
      - DATABASE_HOST=portfolio-postgres
      - DATABASE_NAME=\${YOUR_SERVICE_DB_NAME}
    networks:
      - portfolio-network
    ports:
      - "8080:8080"

networks:
  portfolio-network:
    external: true
EOF
```

**Start:**
```bash
# Ensure main services are running
cd ../../
make start

# Start your service
cd services/your-service
docker compose up -d
```

### Pattern 3: External Server

**Use case:** Production, multi-server setup

**Prerequisites:**
- VPN or secure network between servers
- Firewall rules configured
- Domain names or static IPs

**On your service server:**
```yaml
services:
  your-service:
    build: .
    environment:
      - DATABASE_HOST=portfolio-db.internal  # Use internal DNS
      - DATABASE_PORT=5432
      - AUTHENTIK_URL=https://auth.your-domain.com
    networks:
      - your-service-network
    deploy:
      replicas: 3  # Scale as needed
```

---

## Testing Your Integration

### 1. Database Connectivity

```bash
# From service container
docker exec -it portfolio-your-service sh

# Test PostgreSQL connection
psql -h portfolio-postgres -U your_service_user -d your_service_db -c "SELECT 1;"

# Should return: 1
```

### 2. Authentication Flow

```bash
# Get access token (replace with your client credentials)
curl -X POST http://localhost:9000/application/o/token/ \
  -d "grant_type=client_credentials" \
  -d "client_id=your-service" \
  -d "client_secret=YOUR_SECRET"

# Use token to call your service
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/protected-endpoint
```

### 3. Metrics Collection

```bash
# Check metrics endpoint
curl http://localhost:8080/metrics

# Should return Prometheus format metrics

# Check in Prometheus UI
# http://localhost:9090 → Graph → Query:
# up{job="your-service"}
# Should return: 1
```

### 4. End-to-End Test

Create a test script:

```bash
#!/bin/bash

echo "Testing Your Service Integration..."

# Test health endpoint
echo "1. Health check..."
curl -f http://localhost:8080/health || exit 1

# Test database
echo "2. Database connectivity..."
docker exec portfolio-your-service psql -h portfolio-postgres -U your_service_user -d your_service_db -c "SELECT 1;" || exit 1

# Test metrics
echo "3. Metrics endpoint..."
curl -f http://localhost:8080/metrics | grep "http_requests_total" || exit 1

# Test authentication
echo "4. Authentication (requires valid token)..."
# Add your auth test here

echo "✓ All tests passed!"
```

---

## Production Considerations

### Security

**1. Secrets Management:**
```bash
# Use Docker secrets or external secret managers
# Don't commit secrets to git
echo ".env" >> .gitignore

# Rotate credentials regularly
make generate-secrets
```

**2. Network Security:**
```yaml
# Use internal networks for sensitive services
services:
  your-service:
    networks:
      - portfolio-network
      - your-service-internal

networks:
  your-service-internal:
    internal: true  # No external access
```

**3. Database Security:**
```sql
-- Use least privilege principle
REVOKE ALL ON DATABASE your_service_db FROM your_service_user;
GRANT CONNECT ON DATABASE your_service_db TO your_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_service_user;
-- Don't grant DROP, CREATE, etc. in production
```

### Performance

**1. Connection Pooling:**
```go
// Configure database connection pool
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
sqlDB.SetConnMaxLifetime(time.Hour)
```

**2. Caching:**
```yaml
# Use Redis for caching
services:
  your-service:
    environment:
      - REDIS_HOST=portfolio-redis
      - REDIS_PORT=6379
      - CACHE_TTL=3600
```

**3. Resource Limits:**
```yaml
services:
  your-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Monitoring & Alerting

**Create alerts in Grafana:**
```yaml
# Example alert rule
- name: HighErrorRate
  expr: |
    sum(rate(http_requests_total{job="your-service",status=~"5.."}[5m]))
    /
    sum(rate(http_requests_total{job="your-service"}[5m]))
    > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate on your-service"
```

### Backup & Recovery

**Database backups:**
```bash
# Backup service database
docker exec portfolio-postgres pg_dump -U your_service_user your_service_db > backup.sql

# Restore
cat backup.sql | docker exec -i portfolio-postgres psql -U your_service_user -d your_service_db

# Automate with cron
```

### Documentation

Update these files after integration:
- [ ] `docs/development/architecture.md` - Add service to architecture diagram
- [ ] `docs/api/endpoints.md` - Document API endpoints
- [ ] `README.md` - Update service list
- [ ] `CHANGELOG.md` - Add entry for new service
- [ ] Create service-specific README: `services/your-service/README.md`

---

## Common Issues & Solutions

### Issue: "Connection refused" to PostgreSQL

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check network
docker network inspect portfolio-network

# Verify service is on same network
docker inspect portfolio-your-service | grep NetworkMode
```

### Issue: Authentik returns "Invalid client"

**Solution:**
- Verify Client ID matches exactly
- Check Client Secret is correct
- Ensure redirect URIs are configured
- Check client type (Public vs Confidential)

### Issue: Prometheus not scraping metrics

**Solution:**
```bash
# Check Prometheus config
cat monitoring/prometheus/prometheus.yml

# Check targets in Prometheus UI
# http://localhost:9090 → Status → Targets

# Verify /metrics endpoint works
curl http://localhost:8080/metrics

# Check Prometheus logs
docker logs portfolio-prometheus
```

### Issue: Service can't resolve container names

**Solution:**
```bash
# Ensure service is on correct network
docker-compose.yml:
services:
  your-service:
    networks:
      - portfolio-network

# Check DNS resolution
docker exec portfolio-your-service nslookup portfolio-postgres
```

---

## Next Steps

After integrating your service:

1. **Monitor it:** Create Grafana dashboard
2. **Test it:** Write integration tests
3. **Document it:** Update API docs
4. **Scale it:** Configure horizontal scaling if needed
5. **Secure it:** Review security checklist
6. **Share it:** Update team documentation

## Related Documentation

- **[Architecture Overview](architecture.md)** - Understand the ecosystem
- **[Monitoring Guide](../deployment/monitoring.md)** - Grafana and Prometheus
- **[Authentication Guide](../authentication/README.md)** - Authentik details
- **[API Documentation](../api/README.md)** - Portfolio Manager API

---

Need help? Check the [GitHub Issues](https://github.com/your-repo/portfolio-manager/issues) or join our discussion forum.
