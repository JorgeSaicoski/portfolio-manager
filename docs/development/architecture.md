# Portfolio Manager - System Architecture

## Overview

Portfolio Manager is designed as the **central foundation of a microservices ecosystem**. It serves as the starting point that provides shared infrastructure and services for future applications and microservices.

This document covers:
- The ecosystem vision and philosophy
- Current system architecture
- Shared services infrastructure
- How to integrate new microservices
- Scaling patterns and considerations

---

## The Ecosystem Vision

### Portfolio Manager as a Start Point

Portfolio Manager is **not just an application** - it's the **foundation of an extensible microservices ecosystem**. The architecture is designed with the following principles:

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL ECOSYSTEM                         │
│                 (Portfolio Manager Core)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Authentik   │  │   Grafana    │     │
│  │   Database   │  │    Auth      │  │  Monitoring  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                 ▲                  ▲              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          │                 │                  │
    ┌─────┴─────┬──────────┴────────┬─────────┴──────┐
    │           │                   │                 │
┌───▼───┐  ┌───▼────┐         ┌───▼────┐      ┌────▼─────┐
│Portfolio│ │Loyalty │         │Analytics│      │Future   │
│Manager │ │Points  │         │Service │      │Service N│
│  API   │ │System  │         │        │      │         │
└────────┘ └────────┘         └────────┘      └──────────┘
```

### Core Philosophy

1. **Shared Infrastructure** - Common services (database, auth, monitoring) are shared across all microservices
2. **Incremental Growth** - Start with Portfolio Manager, add services as needed
3. **Service Independence** - Each service can be deployed separately while sharing core infrastructure
4. **Flexible Deployment** - Services can run in same Docker Compose, separate compose, or external servers
5. **Security First** - Centralized authentication and monitoring for the entire ecosystem

### Example Use Cases

**Loyalty Points System:**
- Uses shared PostgreSQL database (new schema: `loyalty_db`)
- Authenticates users via shared Authentik
- Reports metrics to shared Grafana/Prometheus
- Can add MongoDB if needed (added to the ecosystem)

**Analytics Service:**
- Reads from shared PostgreSQL (read-only access to portfolio and loyalty data)
- Authenticates via Authentik
- May use its own ClickHouse database for analytics
- Exports metrics to shared monitoring

**Future Services:**
- Trading Bot
- Market Data Aggregator
- Risk Assessment Engine
- Social Trading Features
- All share the same core infrastructure

---

## Current Architecture

### System Components

```
┌──────────────────────────────────────────────────────────────┐
│                    DOCKER NETWORK                            │
│                   portfolio-network                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  FRONTEND LAYER                       │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │  React + TypeScript Frontend (Vite)         │     │  │
│  │  │  Port: 3000                                  │     │  │
│  │  │  - OAuth2/OIDC integration                   │     │  │
│  │  │  - Protected routes                          │     │  │
│  │  │  - API client                                │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐  │
│  │                 BACKEND LAYER                        │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Go Backend API (Gin Framework)              │    │  │
│  │  │  Port: 8000                                  │    │  │
│  │  │  - RESTful API endpoints                     │    │  │
│  │  │  - OAuth2 token validation                   │    │  │
│  │  │  - Business logic                            │    │  │
│  │  │  - Prometheus metrics (/metrics)             │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐  │
│  │              SHARED SERVICES LAYER                   │  │
│  │                                                        │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │  PostgreSQL    │  │      Redis Cache         │   │  │
│  │  │  Port: 5432    │  │      Port: 6379          │   │  │
│  │  │                │  │                          │   │  │
│  │  │  Databases:    │  │  - Session storage       │   │  │
│  │  │  - portfolio_db│  │  - Cache                 │   │  │
│  │  │  - authentik   │  │                          │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Authentik (Authentication & Authorization)    │  │  │
│  │  │  Port: 9000                                    │  │  │
│  │  │                                                │  │  │
│  │  │  - Server (authentik-server)                  │  │  │
│  │  │  - Worker (authentik-worker)                  │  │  │
│  │  │  - OAuth2/OIDC provider                       │  │  │
│  │  │  - User management                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          MONITORING LAYER (Optional Profile)         │  │
│  │                                                        │  │
│  │  ┌──────────────────┐  ┌───────────────────────┐    │  │
│  │  │   Prometheus     │  │      Grafana          │    │  │
│  │  │   Port: 9090     │  │      Port: 3001       │    │  │
│  │  │                  │  │                       │    │  │
│  │  │  - Metrics       │  │  - Dashboards         │    │  │
│  │  │    collection    │  │  - Visualization      │    │  │
│  │  │  - Time-series   │  │  - Alerting           │    │  │
│  │  │    database      │  │                       │    │  │
│  │  └──────────────────┘  └───────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- OAuth2/OIDC client integration
- Tailwind CSS for styling

**Backend:**
- Go 1.21+
- Gin web framework
- GORM for database ORM
- Prometheus client for metrics

**Authentication:**
- Authentik (self-hosted)
- OAuth2/OIDC protocol
- JWT token-based authentication

**Databases:**
- PostgreSQL 15 (primary data store)
- Redis (caching and sessions)

**Monitoring:**
- Prometheus (metrics collection)
- Grafana (visualization and dashboards)

---

## Shared Services Architecture

The ecosystem provides three core shared services that all microservices can leverage:

### 1. PostgreSQL Database

**Purpose:** Centralized relational data storage

**Design:**
- Single PostgreSQL instance with multiple databases/schemas
- Each service gets its own database or schema
- Services can share data through database views or APIs

**Current Databases:**
```sql
-- Existing databases
portfolio_db    -- Portfolio Manager data
authentik       -- Authentik authentication data

-- Future service databases (examples)
loyalty_db      -- Loyalty points system
analytics_db    -- Analytics service
trading_db      -- Trading bot service
```

**Access Patterns:**
- **Isolated**: Each service has its own database with full control
- **Shared Read**: Services can read from other databases (read-only users)
- **Shared Write**: Cross-service writes go through APIs, not direct database access

**Connection Example:**
```yaml
# Service connecting to shared PostgreSQL
environment:
  - DATABASE_HOST=portfolio-postgres
  - DATABASE_PORT=5432
  - DATABASE_NAME=loyalty_db
  - DATABASE_USER=loyalty_user
  - DATABASE_PASSWORD=${LOYALTY_DB_PASSWORD}
```

### 2. Authentik (Authentication & Authorization)

**Purpose:** Centralized authentication for all services

**Design:**
- Single Authentik instance
- Multiple OAuth2/OIDC applications (one per service)
- Shared user pool across all services
- Centralized user management

**Integration Pattern:**
```
User → Service Frontend → Authentik Login → Token → Service API
                                             ↓
                                    Token Validation
```

**Benefits:**
- Single Sign-On (SSO) across all services
- Unified user experience
- Centralized permission management
- Consistent authentication flow

**Per-Service Configuration:**
1. Create OAuth2/OIDC provider in Authentik
2. Configure redirect URIs for service
3. Obtain client ID and secret
4. Service validates JWT tokens with Authentik

### 3. Grafana & Prometheus (Monitoring)

**Purpose:** Centralized observability for all services

**Design:**
- Single Prometheus instance scrapes metrics from all services
- Single Grafana instance visualizes data from all services
- Each service exposes `/metrics` endpoint
- Dashboards organized by service

**Prometheus Scrape Config Pattern:**
```yaml
scrape_configs:
  - job_name: 'portfolio-backend'
    static_configs:
      - targets: ['portfolio-backend:8000']

  - job_name: 'loyalty-service'
    static_configs:
      - targets: ['loyalty-service:8080']

  - job_name: 'analytics-service'
    static_configs:
      - targets: ['analytics-service:9000']
```

**Benefits:**
- Single pane of glass for entire ecosystem
- Compare metrics across services
- Detect system-wide issues
- Unified alerting

---

## Service Integration Patterns

New microservices can integrate with the ecosystem in three ways:

### Pattern 1: Same Docker Compose (Tightly Coupled)

**Use Case:** Services developed together, deployed together

**Setup:**
```yaml
# Add to docker-compose.yml
services:
  loyalty-service:
    build: ./services/loyalty
    container_name: portfolio-loyalty
    environment:
      - DATABASE_HOST=portfolio-postgres
      - DATABASE_NAME=loyalty_db
      - AUTHENTIK_URL=http://portfolio-authentik-server:9000
    networks:
      - portfolio-network
    depends_on:
      - portfolio-postgres
      - portfolio-authentik-server
```

**Advantages:**
- Easy to develop and test locally
- Shared network by default
- Simple service discovery (use container names)

**Disadvantages:**
- All services restart together
- Harder to scale independently
- Tight coupling

### Pattern 2: Separate Docker Compose (Same Host)

**Use Case:** Independent deployment cycles, same server

**Setup:**
```yaml
# loyalty-service/docker-compose.yml
services:
  loyalty-service:
    build: .
    environment:
      - DATABASE_HOST=portfolio-postgres
      - DATABASE_NAME=loyalty_db
    networks:
      - portfolio-network  # Join existing network

networks:
  portfolio-network:
    external: true  # Use existing network
```

**Advantages:**
- Independent deployment
- Can restart without affecting other services
- Better separation of concerns

**Disadvantages:**
- Need to manage multiple compose files
- Slightly more complex networking

### Pattern 3: External Service (Different Host/Server)

**Use Case:** Service on different server, cloud deployment, high security

**Setup:**
```yaml
# On new server
services:
  loyalty-service:
    build: .
    environment:
      - DATABASE_HOST=10.0.1.50  # Portfolio Manager server IP
      - DATABASE_PORT=5432
      - DATABASE_NAME=loyalty_db
      - AUTHENTIK_URL=https://auth.example.com
    networks:
      - external-services

# Firewall rules needed on Portfolio Manager server
# Allow PostgreSQL: 5432 from loyalty server IP
# Allow Authentik: 9000 from loyalty server IP
# Allow Prometheus scraping: loyalty server exposes metrics
```

**Security Considerations:**
- **PostgreSQL**: Create firewall rule to allow specific IP
  ```bash
  # On Portfolio Manager server
  sudo ufw allow from 10.0.2.50 to any port 5432
  ```
- **Authentik**: Expose via reverse proxy with HTTPS
- **Monitoring**: Prometheus can scrape external targets

**Advantages:**
- True microservices architecture
- Physical separation
- Can scale to different infrastructure
- Security isolation

**Disadvantages:**
- Network latency
- More complex setup
- Need firewall/VPN configuration

---

## Adding a New Service: Complete Example

Let's walk through adding a **Loyalty Points System** to the ecosystem.

### Step 1: Define Service Requirements

**Loyalty Points System needs:**
- PostgreSQL database for storing points
- Authentik integration for user authentication
- Expose metrics for Grafana monitoring
- API to interact with Portfolio Manager

### Step 2: Database Setup

Create database and user:

```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost

-- Create database
CREATE DATABASE loyalty_db;

-- Create user
CREATE USER loyalty_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE loyalty_db TO loyalty_user;
```

Add to `.env`:
```bash
LOYALTY_DB_NAME=loyalty_db
LOYALTY_DB_USER=loyalty_user
LOYALTY_DB_PASSWORD=secure_password_here
```

### Step 3: Authentik Configuration

1. Go to Authentik UI: http://localhost:9000
2. Navigate to **Applications** → **Providers** → **Create**
3. Create OAuth2/OIDC Provider:
   - Name: `loyalty-service-provider`
   - Client Type: `Confidential`
   - Client ID: `loyalty-service`
   - Redirect URIs: `http://localhost:8080/auth/callback`
4. Copy the Client Secret
5. Create Application:
   - Name: `Loyalty Points System`
   - Slug: `loyalty-service`
   - Provider: Select the provider created above

Add to `.env`:
```bash
LOYALTY_AUTHENTIK_CLIENT_ID=loyalty-service
LOYALTY_AUTHENTIK_CLIENT_SECRET=<secret-from-authentik>
```

### Step 4: Add Service to Docker Compose

Choose your integration pattern. For same Docker Compose:

```yaml
# In docker-compose.yml
services:
  # ... existing services ...

  loyalty-service:
    build: ./services/loyalty
    container_name: portfolio-loyalty
    restart: unless-stopped
    environment:
      - DATABASE_HOST=portfolio-postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=${LOYALTY_DB_NAME}
      - DATABASE_USER=${LOYALTY_DB_USER}
      - DATABASE_PASSWORD=${LOYALTY_DB_PASSWORD}
      - AUTHENTIK_URL=http://portfolio-authentik-server:9000
      - AUTHENTIK_CLIENT_ID=${LOYALTY_AUTHENTIK_CLIENT_ID}
      - AUTHENTIK_CLIENT_SECRET=${LOYALTY_AUTHENTIK_CLIENT_SECRET}
      - REDIS_HOST=portfolio-redis
      - REDIS_PORT=6379
    ports:
      - "8080:8080"
    networks:
      - portfolio-network
    depends_on:
      - portfolio-postgres
      - portfolio-redis
      - portfolio-authentik-server
```

### Step 5: Add Monitoring

Add to `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  # ... existing jobs ...

  - job_name: 'loyalty-service'
    static_configs:
      - targets: ['portfolio-loyalty:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

Restart monitoring:
```bash
make monitoring-update
```

### Step 6: Create Grafana Dashboard

1. Open Grafana: http://localhost:3001
2. Create new dashboard
3. Add panels with queries:
   ```promql
   # Request rate
   rate(http_requests_total{job="loyalty-service"}[5m])

   # Points awarded
   rate(loyalty_points_awarded_total[5m])

   # Response time
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="loyalty-service"}[5m]))
   ```

### Step 7: Service Implementation Example

**Loyalty Service Structure:**
```
services/loyalty/
├── main.go                 # Entry point
├── handlers/               # HTTP handlers
├── models/                 # Database models
├── middleware/             # Auth middleware
├── metrics/                # Prometheus metrics
└── Dockerfile
```

**Example Auth Middleware (Go):**
```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get token from header
        authHeader := c.GetHeader("Authorization")
        token := strings.TrimPrefix(authHeader, "Bearer ")

        // Validate with Authentik
        authentikURL := os.Getenv("AUTHENTIK_URL")
        valid, err := validateToken(authentikURL, token)

        if !valid || err != nil {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

**Example Metrics Setup:**
```go
import "github.com/prometheus/client_golang/prometheus"

var (
    pointsAwarded = prometheus.NewCounter(
        prometheus.CounterOpts{
            Name: "loyalty_points_awarded_total",
            Help: "Total loyalty points awarded",
        },
    )
)

func init() {
    prometheus.MustRegister(pointsAwarded)
}

// In your handler
func AwardPoints(c *gin.Context) {
    // ... award points logic ...
    pointsAwarded.Inc()
}
```

### Step 8: Start the Service

```bash
# If added to main docker-compose.yml
docker compose up -d loyalty-service

# Or if separate compose file
cd services/loyalty
docker compose up -d
```

---

## Adding Service-Specific Databases

Some services may need their own database technology (e.g., MongoDB, Redis).

### Example: Adding MongoDB for Analytics Service

```yaml
# In docker-compose.yml or separate compose file
services:
  analytics-mongo:
    image: mongo:7
    container_name: portfolio-analytics-mongo
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=analytics_admin
      - MONGO_INITDB_ROOT_PASSWORD=${ANALYTICS_MONGO_PASSWORD}
    volumes:
      - analytics_mongo_data:/data/db
    networks:
      - portfolio-network
    ports:
      - "27017:27017"

  analytics-service:
    build: ./services/analytics
    environment:
      - MONGO_URI=mongodb://analytics_admin:${ANALYTICS_MONGO_PASSWORD}@analytics-mongo:27017
      - POSTGRES_URI=postgresql://portfolio-postgres:5432/portfolio_db  # Read-only access
    depends_on:
      - analytics-mongo
      - portfolio-postgres

volumes:
  analytics_mongo_data:
```

**Key Points:**
- New database added to same Docker network
- Can coexist with PostgreSQL
- Service can access both databases
- Each database has its own backup strategy

---

## Network Configuration

### Internal Docker Network

All services communicate via Docker network `portfolio-network`:

```bash
# Create network (done automatically by docker-compose)
docker network create portfolio-network

# View network
docker network inspect portfolio-network

# Services can reference each other by container name
# Example: http://portfolio-backend:8000
```

### External Access Security

When exposing services externally:

**PostgreSQL:**
```yaml
# Expose PostgreSQL to host (CAREFUL!)
ports:
  - "5432:5432"  # Accessible from host machine

# Then configure firewall
sudo ufw allow from 10.0.2.0/24 to any port 5432
sudo ufw deny 5432  # Deny from everywhere else
```

**Authentik (Recommended: Reverse Proxy):**
```yaml
# Don't expose directly - use nginx/traefik
nginx-proxy:
  image: nginx:alpine
  ports:
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
```

**Best Practice:** Use VPN or VPC for service-to-service communication across hosts.

---

## Scaling Patterns

### Horizontal Scaling

Each service can scale independently:

```yaml
# Scale loyalty service to 3 replicas
loyalty-service:
  deploy:
    replicas: 3
  # Add load balancer
```

### Database Scaling

**Read Replicas:**
```yaml
portfolio-postgres-replica:
  image: postgres:15
  environment:
    - POSTGRES_REPLICATION_MODE=slave
    - POSTGRES_MASTER_HOST=portfolio-postgres
```

**Connection Pooling:**
```yaml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    - DATABASES_HOST=portfolio-postgres
    - POOL_MODE=transaction
    - MAX_CLIENT_CONN=1000
```

### Authentik Scaling

Authentik can scale workers:
```yaml
portfolio-authentik-worker:
  deploy:
    replicas: 3
```

---

## Future Roadmap

### Planned Ecosystem Services

1. **Loyalty Points System** (Next)
   - Track user engagement
   - Award points for actions
   - Redeem points for features

2. **Analytics Service**
   - Data aggregation
   - Business intelligence
   - Performance metrics

3. **Trading Bot**
   - Automated trading
   - Strategy backtesting
   - Real-time execution

4. **Market Data Aggregator**
   - Real-time market data
   - Historical data storage
   - Data normalization

5. **Notification Service**
   - Email notifications
   - Push notifications
   - SMS alerts

### Infrastructure Enhancements

- **Message Queue** (RabbitMQ/Kafka) for async communication
- **API Gateway** for unified API access
- **Service Mesh** (Istio/Linkerd) for advanced networking
- **Distributed Tracing** (Jaeger/Zipkin)
- **Centralized Logging** (ELK Stack/Loki)

---

## Summary

Portfolio Manager is architected as a **central ecosystem** that provides:

✅ **Shared Infrastructure**
- PostgreSQL for data storage
- Authentik for authentication
- Grafana/Prometheus for monitoring

✅ **Flexible Integration**
- Same Docker Compose for tight coupling
- Separate Docker Compose for independent deployment
- External servers for distributed systems

✅ **Scalability**
- Add new services without disrupting existing ones
- Scale services independently
- Add service-specific databases as needed

✅ **Security**
- Centralized authentication
- Network isolation
- Firewall configuration for external access

This architecture allows the ecosystem to grow organically, starting with Portfolio Manager and expanding to include loyalty systems, analytics, trading bots, and more—all sharing the same robust infrastructure.

---

## Related Documentation

- **[Microservices Integration Guide](microservices-integration.md)** - Step-by-step guide for adding new services
- **[Monitoring Guide](../deployment/monitoring.md)** - Grafana and Prometheus setup
- **[Authentication Guide](../authentication/README.md)** - Authentik integration details
- **[API Documentation](../api/README.md)** - Portfolio Manager API reference
