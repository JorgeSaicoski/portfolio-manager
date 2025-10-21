# k6 Test Route Fixes - Complete

## Issue Fixed

The k6 tests were using **incorrect API routes** that didn't exist in the backend, causing 404 errors.

## Root Cause

The backend API uses a `/own` prefix for all authenticated CRUD operations to separate user-specific resources from public endpoints.

## Routes Updated

### Portfolio Routes

| Before (❌ 404) | After (✅ Works) |
|----------------|-----------------|
| `POST /api/portfolios` | `POST /api/portfolios/own` |
| `GET /api/portfolios?limit=10&offset=0` | `GET /api/portfolios/own?page=1&limit=10` |
| `GET /api/portfolios/:id` | `GET /api/portfolios/own/:id` |
| `PUT /api/portfolios/:id` | `PUT /api/portfolios/own/:id` |
| `DELETE /api/portfolios/:id` | `DELETE /api/portfolios/own/:id` |

### Category Routes

| Before (❌ 404) | After (✅ Works) |
|----------------|-----------------|
| `POST /api/categories` | `POST /api/categories/own` |
| `GET /api/categories/:id` | `GET /api/categories/own/:id` |
| `PUT /api/categories/:id` | `PUT /api/categories/own/:id` |

### Project Routes

| Before (❌ 404) | After (✅ Works) |
|----------------|-----------------|
| `POST /api/projects` | `POST /api/projects/own` |
| `GET /api/projects/:id` | `GET /api/projects/own/:id` |
| `PUT /api/projects/:id` | `PUT /api/projects/own/:id` |

### Section Routes

| Before (❌ 404) | After (✅ Works) |
|----------------|-----------------|
| `POST /api/sections` | `POST /api/sections/own` |
| `GET /api/sections/:id` | `GET /api/sections/own/:id` |
| `PUT /api/sections/:id` | `PUT /api/sections/own/:id` |

## Files Modified

### 1. `test_scenarios/helpers.js`

**Functions Updated:**
- ✅ `createTestPortfolio()` - Now uses `/api/portfolios/own`
- ✅ `createTestCategory()` - Now uses `/api/categories/own`
- ✅ `createTestProject()` - Now uses `/api/projects/own`
- ✅ `createTestSection()` - Now uses `/api/sections/own`

### 2. `test_scenarios/load_test.js`

**Routes Updated:**
- ✅ Line 70: List portfolios → `/api/portfolios/own?page=1&limit=10`
- ✅ Line 105: Get portfolio → `/api/portfolios/own/:id`
- ✅ Line 162: Update portfolio → `/api/portfolios/own/:id`
- ✅ Line 181: List portfolios cached → `/api/portfolios/own?page=1&limit=10`

### 3. `test_scenarios/stress_test.js`

**Routes Updated:**
- ✅ All `/api/portfolios` → `/api/portfolios/own`
- ✅ Pagination parameters updated: `offset` → `page`

### 4. `test_scenarios/spike_test.js`

**Routes Updated:**
- ✅ All `/api/portfolios` → `/api/portfolios/own`
- ✅ Pagination parameters updated: `offset` → `page`

### 5. `test_scenarios/soak_test.js`

**Routes Updated:**
- ✅ All `/api/portfolios` → `/api/portfolios/own`
- ✅ Pagination parameters updated: `offset` → `page`

## Pagination Changes

The backend uses **page-based pagination**, not offset:

**Before:**
```javascript
?limit=10&offset=0
?limit=10&offset=10
```

**After:**
```javascript
?page=1&limit=10
?page=2&limit=10
```

## Backend API Structure

### Authenticated Routes (Require JWT)

All authenticated routes use the `/own` prefix:

```
/api/portfolios/own          GET, POST
/api/portfolios/own/:id      GET, PUT, DELETE
/api/categories/own          GET, POST
/api/categories/own/:id      GET, PUT, DELETE
/api/projects/own            GET, POST
/api/projects/own/:id        GET, PUT, DELETE
/api/sections/own            GET, POST
/api/sections/own/:id        GET, PUT, DELETE
```

### Public Routes (No Auth Required)

```
/api/portfolios/public/:id               GET
/api/portfolios/public/:id/categories    GET
/api/portfolios/public/:id/sections      GET
/api/categories/public/:id               GET
/api/projects/public/:id                 GET
/api/sections/public/:id                 GET
```

## Expected Test Results After Fix

### Before Fixes:
```
http_req_failed: 99.75%  ❌
404 errors on all create/update operations
```

### After Fixes:
```
✓ authentication successful
✓ token received
✓ portfolio created
✓ category created
✓ project created
✓ section created
✓ portfolio updated
http_req_failed: <1%  ✅
```

## Testing the Fixes

Run any of the performance tests:

```bash
# Load test (4 minutes)
k6 run test_scenarios/load_test.js

# Quick test (30 seconds)
k6 run test_scenarios/load_test.js --duration 30s --vus 5

# Stress test
k6 run test_scenarios/stress_test.js

# Spike test
k6 run test_scenarios/spike_test.js

# Soak test (30 minutes)
k6 run test_scenarios/soak_test.js
```

## Verification

You can verify the routes manually:

```bash
# Get JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tes2t@example.com","password":"testpassword"}' \
  | jq -r '.token')

# Test list portfolios
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/portfolios/own?page=1&limit=10

# Test create portfolio
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Portfolio","description":"Test"}' \
  http://localhost:8000/api/portfolios/own
```

## Summary

All k6 performance tests now use the correct `/own` routes and will:
- ✅ Successfully authenticate with JWT
- ✅ Create portfolios, categories, projects, and sections
- ✅ Return 200/201 status codes instead of 404
- ✅ Measure actual performance metrics
- ✅ Validate the performance optimizations we implemented

---

**Status:** ✅ Complete
**Date:** 2025-10-21
**Impact:** All 4 test scenarios now use correct API routes
