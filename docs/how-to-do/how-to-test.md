# How to Test Portfolio Manager

Learn how to run tests, write new tests, and debug test failures.

**Time**: 45 minutes | **Difficulty**: Beginner

---

## 📋 What & Why

**What**: Run backend tests, write tests, fix failures, check coverage

**Why**:
- Catch bugs before production
- Ensure code quality
- Safe refactoring
- Documentation of behavior

---

## ✅ Prerequisites

- [ ] Project cloned locally
- [ ] Dependencies installed (`make setup`)
- [ ] Database running (`make start`)

---

## 📝 Running Tests

### Quick Test Run

```bash
# Run all backend tests
cd backend
go test ./...

# Run with verbose output
go test -v ./...

# Run specific test file
go test -v ./cmd/test/portfolio_test.go

# Run specific test function
go test -v -run TestPortfolio_Create
```

### With Coverage

```bash
# Generate coverage report
go test -coverprofile=coverage.out ./...

# View coverage in terminal
go tool cover -func=coverage.out

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# Open in browser
open coverage.html  # Mac
xdg-open coverage.html  # Linux
```

### Using Make Commands

```bash
# Run all CI tests (backend + frontend)
make ci-test

# Run with coverage
make ci-coverage

# Run all CI checks (tests + linting + security)
make ci-all
```

---

## 📝 Writing Tests

### Test File Structure

```go
// backend/cmd/test/feature_test.go
package main

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestFeature_Create(t *testing.T) {
    // Arrange - set up test data
    token := GetTestAuthToken()
    payload := map[string]interface{}{
        "title": "Test Feature",
    }

    // Act - perform the action
    resp := MakeRequest(t, "POST", "/api/features/own", payload, token)

    // Assert - verify the result
    AssertJSONResponse(t, resp, 201, func(body map[string]interface{}) {
        assert.Contains(t, body, "data")
        data := body["data"].(map[string]interface{})
        assert.Equal(t, "Test Feature", data["title"])
    })
}
```

### Table-Driven Tests

```go
func TestValidation(t *testing.T) {
    tests := []struct {
        name       string
        input      string
        wantError  bool
        errorMsg   string
    }{
        {"valid title", "My Portfolio", false, ""},
        {"empty title", "", true, "Title is required"},
        {"too long", strings.Repeat("a", 101), true, "Title too long"},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateTitle(tt.input)
            if tt.wantError {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.errorMsg)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### Testing CRUD Operations

```go
func TestPortfolio_CRUD(t *testing.T) {
    token := GetTestAuthToken()

    // CREATE
    t.Run("Create", func(t *testing.T) {
        payload := map[string]interface{}{
            "title": "Test Portfolio",
            "description": "Test Description",
        }
        resp := MakeRequest(t, "POST", "/api/portfolios/own", payload, token)
        AssertJSONResponse(t, resp, 201, func(body map[string]interface{}) {
            assert.Contains(t, body, "data")
        })
    })

    // READ
    t.Run("Read", func(t *testing.T) {
        resp := MakeRequest(t, "GET", "/api/portfolios/own?page=1&limit=10", nil, token)
        AssertJSONResponse(t, resp, 200, func(body map[string]interface{}) {
            assert.Contains(t, body, "data")
        })
    })

    // UPDATE
    t.Run("Update", func(t *testing.T) {
        // First create, then update
        createResp := CreateTestPortfolio(t, token, "Portfolio to Update")
        id := int(createResp["ID"].(float64))

        payload := map[string]interface{}{
            "title": "Updated Title",
        }
        resp := MakeRequest(t, "PUT", fmt.Sprintf("/api/portfolios/own/%d", id), payload, token)
        AssertJSONResponse(t, resp, 200, func(body map[string]interface{}) {
            data := body["data"].(map[string]interface{})
            assert.Equal(t, "Updated Title", data["title"])
        })
    })

    // DELETE
    t.Run("Delete", func(t *testing.T) {
        createResp := CreateTestPortfolio(t, token, "Portfolio to Delete")
        id := int(createResp["ID"].(float64))

        resp := MakeRequest(t, "DELETE", fmt.Sprintf("/api/portfolios/own/%d", id), nil, token)
        AssertJSONResponse(t, resp, 200, func(body map[string]interface{}) {
            assert.Contains(t, body, "message")
        })
    })
}
```

---

## 🔧 Debugging Failed Tests

### Read Error Messages

```bash
# Run with verbose output
go test -v ./cmd/test/portfolio_test.go

# Look for:
# FAIL: TestPortfolio_Create (0.05s)
#     Expected: 201
#     Got: 400
#     Error: {"error":"Title is required"}
```

### Common Failures

**1. Database connection error:**
```bash
# Check database is running
docker compose ps | grep postgres

# Restart database
docker compose restart portfolio-postgres
```

**2. Authentication error:**
```bash
# Check TESTING_MODE is enabled
echo $TESTING_MODE

# Set it
export TESTING_MODE=true
```

**3. Port already in use:**
```bash
# Find process using port
sudo lsof -i :8000

# Kill it
kill -9 PID
```

### Use Test Helpers

```go
// Helper to create test portfolio
func CreateTestPortfolio(t *testing.T, token string, title string) map[string]interface{} {
    payload := map[string]interface{}{
        "title": title,
    }
    resp := MakeRequest(t, "POST", "/api/portfolios/own", payload, token)

    var body map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&body)
    return body["data"].(map[string]interface{})
}
```

---

## ✔️ Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Handlers | 80%+ | Check with `make ci-coverage` |
| Models | 70%+ | |
| Validators | 90%+ | |
| Overall | 75%+ | |

---

## ➡️ Next Steps

- [How to Add a Feature](./how-to-add-a-feature.md) - Use tests in development
- [How to Investigate](./how-to-investigate.md) - Debug production issues
- [CI/CD Setup](../deployment/cicd-setup.md) - Automate testing

**Last Updated**: 2025-01-25
