# Portfolio Manager

A full-stack portfolio management application with microservices architecture.

## Architecture

- **Frontend**: Svelte/SvelteKit application
- **Backend**: Go API service 
- **Auth Service**: Go authentication microservice
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

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
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Auth Service: http://localhost:8080
   - PostgreSQL: localhost:5432

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web interface |
| Backend API | http://localhost:8000/api | Main API endpoints |
| Auth Service | http://localhost:8080/api/auth | Authentication |
| Database | localhost:5432 | PostgreSQL database |

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

## Development

### Prerequisites

- Docker & Docker Compose
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
docker-compose logs

# Specific service
docker-compose logs portfolio-backend
docker-compose logs portfolio-auth
docker-compose logs portfolio-frontend
```

## Security Notes

- Change all default passwords and secrets in production
- Use strong, unique values for `JWT_SECRET` and `NEXTAUTH_SECRET`
- Never commit `.env` files to version control
- Review and update dependencies regularly

## Contributing

1. Create your `.env` file (never commit it)
2. Make your changes
3. Test with `docker-compose up --build`
4. Submit a pull request

---

**Remember**: The application will not work without the proper `.env` configuration file!