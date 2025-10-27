# API Documentation

Complete REST API reference for Portfolio Manager.

## Quick Reference

- **Base URL**: `http://localhost:8000/api`
- **Authentication**: Bearer token (JWT from Authentik)
- **Content-Type**: `application/json`

## Available Guides

### [API Endpoints](endpoints.md)
Complete reference of all available endpoints with request/response examples.

**Covers:**
- Portfolio CRUD operations
- Project management
- Section management
- Category operations
- User profile endpoints

### [Authentication](authentication.md) *(Coming Soon)*
API authentication flows and token management.

### [Examples](examples.md) *(Coming Soon)*
Common use cases with curl and Bruno examples.

## Quick Start

### 1. Get Access Token

Login via frontend to get a token, or use Authentik's token endpoint:

```bash
curl -X POST http://localhost:9000/application/o/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=your-username" \
  -d "password=your-password" \
  -d "client_id=portfolio-manager"
```

### 2. Make Authenticated Request

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/portfolios/own
```

## Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/portfolios/own` | GET | Get user's portfolios |
| `/api/portfolios` | POST | Create portfolio |
| `/api/portfolios/{id}` | GET | Get portfolio by ID |
| `/api/portfolios/{id}` | PUT | Update portfolio |
| `/api/portfolios/{id}` | DELETE | Delete portfolio |

See [endpoints.md](endpoints.md) for complete reference.

---

**[⬅️ Back to Documentation](../README.md)**
