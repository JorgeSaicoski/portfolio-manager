# Portfolio Manager

A full-stack portfolio management application with microservices architecture.

## Architecture

- **Frontend**: Svelte/SvelteKit application
- **Backend**: Go API service
- **Auth Service**: Go authentication microservice
- **Database**: PostgreSQL
- **Containerization**: Podman

### Why Podman?

We use **Podman** as our container runtime:
- **🛡️ Security**: Rootless containers by default, no root daemon required
- **🆓 Freedom**: 100% free and open source, no licensing restrictions
- **⚡ Simplicity**: No background daemon needed, cleaner architecture
- **🔧 Native Compose**: Built-in `podman compose` support (no external dependencies)
- **🚀 Modern**: Actively developed with latest container standards

## Required Configuration Files

⚠️ **Important**: This project requires several configuration files that are not included in the repository for security reasons. You must create these files before running the application.

### 1. Root Environment File

Create `.env` in the project root directory:

```bash
# Database Configuration
POSTGRES_DB=portfolio_db
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secret for services (change this!)
JWT_SECRET=your_very_secure_jwt_secret_key_change_in_production

# NextAuth Configuration (for frontend)
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 2. Frontend Environment (Optional)

Create `frontend/.env` if you need to override default values:

```bash
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_API_URL=http://localhost:8080/api/auth
```

### 3. Backend Environment (Optional)

Create `backend/.env` if you need to override default values:

```bash
PORT=8000
DB_HOST=localhost
DB_PORT=5432
# ... other backend-specific variables
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone git@github.com:JorgeSaicoski/portfolio-manager.git
   cd portfolio-manager
   ```

2. **Create the required .env file**
   ```bash
   # Copy and modify the example above
   nano .env
   ```

3. **Start the application**
   ```bash
   podman compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Auth Service: http://localhost:8080
   - PostgreSQL: localhost:5432

## Monitoring & Observability

The application includes a comprehensive monitoring stack using Prometheus and Grafana.

### Starting the Monitoring Stack

To enable monitoring, start the services with the `monitoring` profile:

```bash
podman compose --profile monitoring up
```

Or to start all services including monitoring:

```bash
podman compose --profile monitoring up --build
```

### Accessing Monitoring Tools

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| Grafana | http://localhost:3001 | admin / admin | Visualization dashboards |
| Prometheus | http://localhost:9090 | - | Metrics storage & queries |

### Pre-configured Dashboards

Grafana comes with three pre-configured dashboards that auto-load on startup:

1. **System Overview** - High-level view of all services
   - Service health status (Backend, Auth)
   - Total request rates across all services
   - Overall error rates
   - Response time percentiles by service
   - HTTP status code distribution
   - Database connection pool usage
   - Business metrics (total users, portfolios)

2. **Backend API Dashboard** - Detailed metrics for the portfolio backend
   - HTTP request rates and patterns
   - Response time percentiles (p50, p95)
   - Status code distribution
   - Database connection pool metrics
   - Total portfolios count
   - Error rates and trends

3. **Auth Service Dashboard** - Authentication service monitoring
   - Authentication attempt rates (login/register)
   - Success vs failure rates
   - JWT token generation metrics
   - Active user counts
   - Response time analysis
   - Database connection health

### Available Metrics

Both services expose Prometheus metrics at the `/metrics` endpoint:

- **Backend API**: http://localhost:8000/metrics
- **Auth Service**: http://localhost:8080/metrics

**Key Metrics:**
- `http_requests_total` - Total HTTP requests by method, path, and status
- `http_request_duration_seconds` - Request duration histogram
- `database_connections` - DB connection pool stats (active, idle, in_use)
- `portfolios_total` - Total number of portfolios (Backend)
- `active_users_total` - Total registered users (Auth)
- `authentication_attempts_total` - Auth attempts by type and status
- `jwt_tokens_generated_total` - JWT tokens issued

### Customizing Dashboards

All dashboards are provisioned from JSON files and can be customized:

```
monitoring/
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/       # Prometheus datasource config
│   │   └── dashboards/        # Dashboard provider config
│   └── dashboards/
│       ├── backend-dashboard.json      # Backend API metrics
│       ├── auth-dashboard.json         # Auth service metrics
│       └── system-overview.json        # Overall system health
└── prometheus/
    └── prometheus.yml          # Prometheus scrape config
```

Dashboards refresh every 5 seconds by default and show the last 15 minutes of data.

### Stopping Monitoring

To stop only monitoring services:

```bash
podman compose stop prometheus grafana
```

To stop all services:

```bash
podman compose down
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web interface |
| Backend API | http://localhost:8000/api | Main API endpoints |
| Auth Service | http://localhost:8080/api/auth | Authentication |
| Database | localhost:5432 | PostgreSQL database |
| Grafana | http://localhost:3001 | Monitoring dashboards (monitoring profile) |
| Prometheus | http://localhost:9090 | Metrics & queries (monitoring profile) |

## API Documentation

Comprehensive API documentation is available for the backend service:

**[Backend API Documentation](./backend/docs/API.md)**

The documentation includes:
- Complete endpoint reference for all resources (Portfolios, Categories, Projects, Sections)
- Request/Response schemas with examples
- Authentication requirements
- Data Transfer Objects (DTOs) validation rules
- HTTP status codes and error responses
- Query parameters for pagination and filtering

## Performance Optimization & Testing

The backend includes several performance optimizations and a comprehensive performance testing suite.

### Performance Features

**Database Optimizations:**
- Indexed foreign keys (portfolio_id, category_id, section_id, etc.)
- Composite indexes for common query patterns
- Optimized connection pooling with configurable parameters

**HTTP Optimizations:**
- Gzip compression for responses > 1KB (40-60% bandwidth reduction)
- ETag support for HTTP caching with 304 Not Modified responses
- Cache-Control headers for optimal browser caching

**Connection Pool Configuration:**

Environment variables for database connection tuning:
```bash
DB_MAX_IDLE_CONNS=10          # Maximum idle connections
DB_MAX_OPEN_CONNS=100         # Maximum open connections
DB_CONN_MAX_LIFETIME=1h       # Maximum connection lifetime
DB_CONN_MAX_IDLE_TIME=10m     # Maximum idle time before closing
```

### Performance Testing

The project includes comprehensive k6 performance tests to validate system behavior under various conditions.

**Test Scenarios:**
- **Load Test** - Validates performance under normal expected load (4 min)
- **Stress Test** - Finds breaking points under extreme load (17 min)
- **Spike Test** - Tests resilience to sudden traffic spikes (6 min)
- **Soak Test** - Identifies memory leaks and degradation over time (32 min)

**Quick Start:**
```bash
# Install k6
brew install k6  # macOS
# or see test_scenarios/README.md for other platforms

# Run load test
k6 run test_scenarios/load_test.js

# Run with custom configuration
K6_BASE_URL=http://localhost:8080 k6 run test_scenarios/load_test.js
```

**📚 Full Documentation:** [Performance Testing Guide](./test_scenarios/README.md)

The testing guide includes:
- Detailed test scenario explanations
- Performance baseline metrics
- Troubleshooting common issues
- CI/CD integration examples
- Best practices for performance testing

## Development

### Prerequisites

- **Podman** v4.0+ (with native compose support)
  - [Installation Guide](https://podman.io/getting-started/installation)
- Git

### Environment Variables

The application uses environment variables for configuration. All sensitive values (passwords, secrets) must be set in the `.env` file.

**Never commit the `.env` file to version control!**

### File Structure

```
portfolio-manager/
├── .env                    # ← YOU MUST CREATE THIS
├── docker-compose.yml      # Main orchestration
├── frontend/              # Svelte application
├── backend/               # Go API service
├── infra/
│   └── auth/             # Go auth service
└── README.md
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure `.env` file exists with correct database credentials
   - Check that PostgreSQL container is running

2. **Services can't communicate**
   - Verify all services are in the same Docker network
   - Check service names in docker-compose.yml match environment variables

3. **Frontend can't reach API**
   - Confirm API URLs in frontend environment use `localhost` (not internal Docker names)
   - Ensure backend services are running and healthy

### Logs

View logs for specific services:
```bash
# All services
podman compose logs

# Specific service
podman compose logs portfolio-backend
podman compose logs portfolio-auth
podman compose logs portfolio-frontend
```

## Security Notes

- Change all default passwords and secrets in production
- Use strong, unique values for `JWT_SECRET` and `NEXTAUTH_SECRET`
- Never commit `.env` files to version control
- Review and update dependencies regularly

## Contributing

1. Create your `.env` file (never commit it)
2. Make your changes
3. Test with `podman compose up --build`
4. Submit a pull request

---

**Remember**: The application will not work without the proper `.env` configuration file!