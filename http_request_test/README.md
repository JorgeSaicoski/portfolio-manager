# HTTP Request Tests

This directory contains comprehensive API tests for the Portfolio Manager backend in multiple formats.

## Available Test Formats

### 1. **IntelliJ IDEA / GoLand / WebStorm HTTP Client** (`.http` files)

**Best for:** Quick testing during development in JetBrains IDEs

**Files:**
- `portfolio.http` - Portfolio CRUD operations (24 tests)
- `category.http` - Category CRUD operations (36 tests)
- `project.http` - Project CRUD operations + search (53 tests)
- `section.http` - Section CRUD operations + filtering (53 tests)
- `backend-health.http` - Health/metrics endpoints (11 tests)
- `auth.http` - Authentication service tests (32 tests)

**How to use:**
1. Open any `.http` file in IntelliJ IDEA, GoLand, or WebStorm
2. Update the `@authToken` variable after logging in
3. Click the ▶️ play button next to any request
4. View results in the HTTP Client tool window

---

### 2. **Postman** Collection

**Best for:** Team sharing, visual testing, non-developers

**File:** `Portfolio-Manager.postman.json`

**How to import:**
1. Open Postman
2. Click "Import" button (top left)
3. Select `Portfolio-Manager.postman.json`
4. Collection will appear in the sidebar

**Setup:**
1. Go to "Environments" (left sidebar)
2. Create new environment "Local"
3. Add variables:
   ```
   backendUrl: http://localhost:8000
   authUrl: http://localhost:8080
   authToken: <your-jwt-token-here>
   portfolioId: 1
   categoryId: 1
   projectId: 1
   sectionId: 1
   ```
4. Select "Local" environment (top right dropdown)
5. Get auth token from auth service first
6. Click "Send" on any request

**Included requests:**
- ✅ Health & Monitoring (3 requests)
- ✅ Portfolio CRUD (5 requests)
- ✅ Category CRUD (5 requests)
- ✅ Project CRUD + Search (7 requests)
- ✅ Section CRUD + Filtering (6 requests)

---

### 3. **Bruno** Collection

**Best for:** Git-friendly, open-source alternative to Postman

**Folder:** `bruno-collection/`

**How to use:**
1. Install Bruno from https://www.usebruno.com/
2. Click "Open Collection"
3. Navigate to `http_request_test/bruno-collection/`
4. All requests will be loaded automatically

**Setup:**
1. Open `environments/local.bru`
2. Update variables:
   ```
   backendUrl = http://localhost:8000
   authUrl = http://localhost:8080
   authToken = <your-jwt-token>
   portfolioId = 1
   categoryId = 1
   projectId = 1
   sectionId = 1
   ```
3. Select "local" environment (top right)
4. Click "Send" on any request

---

## Environment Variables

All test files use the following variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `backendUrl` | `http://localhost:8000` | Backend API base URL |
| `authUrl` | `http://localhost:8080` | Auth service base URL |
| `authToken` | *(empty)* | JWT Bearer token (get from login) |
| `portfolioId` | `1` | Test portfolio ID |
| `categoryId` | `1` | Test category ID |
| `projectId` | `1` | Test project ID |
| `sectionId` | `1` | Test section ID |

---

## Getting Started

### Step 1: Start the Services

```bash
# From project root
podman compose up
```

Wait for all services to be healthy.

### Step 2: Get Auth Token

**Option A: Using Postman/Bruno**
1. Use the auth service to register/login
2. Copy the token from the response

**Option B: Using curl**
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Copy the "token" from the response
```

### Step 3: Update Token in Your Tool

**IntelliJ/GoLand:**
- Edit `@authToken` variable at the top of `.http` files

**Postman:**
- Update `authToken` in environment variables

**Bruno:**
- Update `authToken` in `environments/local.bru`

### Step 4: Run Tests

Start with health check, then try CRUD operations!

---

## Test Coverage

### Backend API Endpoints

| Resource | Endpoints | Test Count |
|----------|-----------|------------|
| Health | 3 | 11 tests |
| Portfolio | 5 | 24 tests |
| Category | 5 | 36 tests |
| Project | 7 | 53 tests |
| Section | 6 | 53 tests |
| **Total** | **26 endpoints** | **177 tests** |

### Test Scenarios Covered

Each endpoint is tested for:
- ✅ Success cases (200/201)
- ✅ Validation errors (400)
- ✅ Authentication errors (401)
- ✅ Authorization errors (403)
- ✅ Not found errors (404)
- ✅ Edge cases (invalid IDs, pagination, etc.)

---

## API Documentation

For complete API documentation with request/response schemas, see:

**[Backend API Documentation](../backend/docs/API.md)**

---

## Tips

### IntelliJ/GoLand
- Use `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac) to run requests
- Results appear in the "Run" tool window
- Use `###` separators to run multiple requests in sequence

### Postman
- Use "Runner" to execute multiple requests in batch
- Save responses as examples for documentation
- Use "Tests" tab for automated assertions

### Bruno
- Git-friendly (each request is a file)
- Fast and lightweight
- No account required
- Open source

---

## Automated Testing

For CI/CD automated testing, see:
- `backend/cmd/test/` - Go automated tests
- `.github/workflows/test.yml` - GitHub Actions CI

---

## Troubleshooting

### "Connection refused"
- Ensure services are running: `podman compose ps`
- Check service logs: `podman compose logs backend`

### "401 Unauthorized"
- Token may be expired (24h expiry)
- Get a fresh token from auth service

### "404 Not Found"
- Check the resource ID exists
- Create resources first (Portfolio → Category → Project)

### "403 Forbidden"
- You're trying to access a resource you don't own
- Use resources created by your user

---

## Contributing

When adding new endpoints:
1. Add tests to appropriate `.http` file
2. Update `Portfolio-Manager.postman.json`
3. Add corresponding `.bru` file to `bruno-collection/`
4. Update test count in this README

---

## License

See main project LICENSE file.
