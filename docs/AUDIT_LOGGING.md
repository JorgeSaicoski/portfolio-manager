# Audit Logging System

## Purpose

The audit logging system exists to quickly study cases where:
- A client complains they created something and lost the data
- A bug happened and we don't know if we recovered every single creation
- We need to trace CREATE, UPDATE, DELETE operations for debugging
- We need to investigate errors and failed requests

**Audit logs are NOT for monitoring successful GET requests** - use Grafana for that.

## Log Files

All logs are stored in `/app/audit/` directory:

### 1. `create.log`
**Purpose**: Track all successful CREATE operations (POST requests that create new resources)

**Contains**:
- User ID who created the resource
- Resource type and ID
- Timestamp
- All relevant data fields

**Example**:
```json
{
  "level": "info",
  "operation": "CREATE_IMAGE",
  "userID": "user123",
  "imageID": 42,
  "entityType": "project",
  "entityID": 15,
  "filename": "photo.jpg",
  "time": "2025-11-27T12:00:00Z",
  "msg": "Image uploaded successfully"
}
```

### 2. `update.log`
**Purpose**: Track all successful UPDATE operations (PUT/PATCH requests)

**Contains**:
- User ID who made the update
- Resource type and ID
- Changes made (before/after values)
- Timestamp

**Example**:
```json
{
  "level": "info",
  "operation": "UPDATE_IMAGE",
  "userID": "user123",
  "imageID": 42,
  "changes": {
    "alt": {"from": "old text", "to": "new text"},
    "is_main": {"from": false, "to": true}
  },
  "time": "2025-11-27T12:05:00Z",
  "msg": "Image updated successfully"
}
```

### 3. `delete.log`
**Purpose**: Track all successful DELETE operations

**Contains**:
- User ID who deleted the resource
- Resource type and ID
- Timestamp
- Important metadata (for potential recovery)

**Example**:
```json
{
  "level": "info",
  "operation": "DELETE_IMAGE",
  "userID": "user123",
  "imageID": 42,
  "filename": "photo.jpg",
  "entityType": "project",
  "entityID": 15,
  "time": "2025-11-27T12:10:00Z",
  "msg": "Image deleted successfully"
}
```

### 4. `error.log`
**Purpose**: Track ALL errors (validation, not found, forbidden, internal errors) from ALL operations

**Contains**:
- Operation that failed
- Error type and message
- File and function where error occurred
- All relevant context (IDs, user info)
- Timestamp

**Examples**:
```json
{
  "level": "warning",
  "operation": "GET_IMAGE_BY_ID_NOT_FOUND",
  "where": "backend/internal/application/handler/image.go",
  "function": "GetImageByID",
  "imageID": 999,
  "error": "record not found",
  "time": "2025-11-27T12:15:00Z",
  "msg": "Image not found"
}
```

```json
{
  "level": "error",
  "operation": "UPLOAD_IMAGE_SAVE_ERROR",
  "where": "backend/internal/application/handler/image.go",
  "function": "UploadImage",
  "userID": "user123",
  "filename": "photo.jpg",
  "error": "permission denied",
  "time": "2025-11-27T12:20:00Z",
  "msg": "Failed to save image"
}
```

### 5. `audit.log`
**Purpose**: Main application log - should only contain startup messages and critical system events

**IMPORTANT**: This log should NOT be filled with successful GET requests!

**Contains**:
- Server startup/shutdown messages
- Database connection status
- Critical system errors
- Configuration changes

## What Gets Logged

### ✅ ALWAYS LOG:
- **All CREATE operations** (successful) → `create.log`
- **All UPDATE operations** (successful) → `update.log`
- **All DELETE operations** (successful) → `delete.log`
- **All errors from any operation** → `error.log`
  - Validation errors (400)
  - Not found errors (404)
  - Forbidden errors (403)
  - Internal server errors (500)
  - Database errors
  - File operation errors

### ❌ NEVER LOG:
- **Successful GET requests** - use Grafana for monitoring
- **Health check requests** (`/health`)
- **Metrics endpoint requests** (`/metrics`)

## Implementation

### In Handlers

Every handler function follows this pattern:

```go
func (h *Handler) CreateResource(c *gin.Context) {
    userID := c.GetString("userID")

    // Parse request
    var req dto.CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // LOG ERROR
        audit.GetErrorLogger().WithFields(logrus.Fields{
            "operation": "CREATE_RESOURCE_BAD_REQUEST",
            "where":     "backend/internal/application/handler/resource.go",
            "function":  "CreateResource",
            "userID":    userID,
            "error":     err.Error(),
        }).Warn("Invalid request data")
        response.BadRequest(c, err.Error())
        return
    }

    // Create resource
    resource := &models.Resource{...}
    if err := h.repo.Create(resource); err != nil {
        // LOG ERROR
        audit.GetErrorLogger().WithFields(logrus.Fields{
            "operation": "CREATE_RESOURCE_DB_ERROR",
            "where":     "backend/internal/application/handler/resource.go",
            "function":  "CreateResource",
            "userID":    userID,
            "error":     err.Error(),
        }).Error("Failed to create resource")
        response.InternalError(c, "Failed to create resource")
        return
    }

    // LOG SUCCESS
    audit.GetCreateLogger().WithFields(logrus.Fields{
        "operation": "CREATE_RESOURCE",
        "userID":    userID,
        "resourceID": resource.ID,
        // ... all relevant data
    }).Info("Resource created successfully")

    response.Created(c, "resource", resource, "Success")
}
```

```go
func (h *Handler) GetResource(c *gin.Context) {
    idStr := c.Param("id")

    id, err := strconv.Atoi(idStr)
    if err != nil {
        // LOG ERROR
        audit.GetErrorLogger().WithFields(logrus.Fields{
            "operation": "GET_RESOURCE_INVALID_ID",
            "where":     "backend/internal/application/handler/resource.go",
            "function":  "GetResource",
            "idStr":     idStr,
            "error":     err.Error(),
        }).Warn("Invalid resource ID")
        response.BadRequest(c, "Invalid ID")
        return
    }

    resource, err := h.repo.GetByID(uint(id))
    if err != nil {
        // LOG ERROR
        audit.GetErrorLogger().WithFields(logrus.Fields{
            "operation": "GET_RESOURCE_NOT_FOUND",
            "where":     "backend/internal/application/handler/resource.go",
            "function":  "GetResource",
            "resourceID": id,
            "error":     err.Error(),
        }).Warn("Resource not found")
        response.NotFound(c, "Resource not found")
        return
    }

    // NO LOGGING FOR SUCCESSFUL GET
    response.OK(c, "resource", resource, "Success")
}
```

### Log Levels

- **`.Info()`**: Successful operations (CREATE, UPDATE, DELETE)
- **`.Warn()`**: Client errors (400, 404, 403)
- **`.Error()`**: Server errors (500, database errors, file errors)

### Required Fields

Every audit log entry MUST include:
- `operation`: Descriptive operation name (e.g., "CREATE_IMAGE", "GET_USER_NOT_FOUND")
- `where`: File path (e.g., "backend/internal/application/handler/image.go")
- `function`: Function name (e.g., "UploadImage")
- `error`: Error message (when error exists)
- Plus all relevant context: userID, resource IDs, etc.

## Middleware

### error_logging.go
Automatically logs ALL HTTP errors (4xx and 5xx) with full context.

**Important**: This middleware runs AFTER handler execution, so it catches all errors even if the handler doesn't explicitly log them.

### loggingMiddleware() in server.go
**DISABLED** - Previously logged every HTTP request, causing audit.log to fill up.

Now returns empty string to prevent logging successful requests.

## Common Patterns

### Foreign Key Constraint Errors
```go
if strings.Contains(err.Error(), "violates foreign key constraint") {
    audit.GetErrorLogger().WithFields(logrus.Fields{
        "operation": "CREATE_RESOURCE_FK_ERROR",
        // ... context
        "error": err.Error(),
    }).Warn("Foreign key constraint violation")
    response.BadRequest(c, "Invalid parent resource")
    return
}
```

### Duplicate Entry Errors
```go
if strings.Contains(err.Error(), "duplicate key") {
    audit.GetErrorLogger().WithFields(logrus.Fields{
        "operation": "CREATE_RESOURCE_DUPLICATE",
        // ... context
        "error": err.Error(),
    }).Warn("Duplicate resource")
    response.BadRequest(c, "Resource already exists")
    return
}
```

### Permission Errors
```go
if resource.OwnerID != userID {
    audit.GetErrorLogger().WithFields(logrus.Fields{
        "operation": "UPDATE_RESOURCE_FORBIDDEN",
        "where":     "handler/resource.go",
        "function":  "UpdateResource",
        "resourceID": id,
        "ownerID":   resource.OwnerID,
        "userID":    userID,
    }).Warn("Permission denied")
    response.Forbidden(c, "Permission denied")
    return
}
```

## Querying Logs

### Find all creates by user
```bash
grep '"userID":"user123"' audit/create.log | jq .
```

### Find all errors in last hour
```bash
grep '"time":"2025-11-27T12:' audit/error.log | jq .
```

### Find specific operation failures
```bash
grep '"operation":"CREATE_IMAGE"' audit/error.log | jq .
```

### Count errors by operation
```bash
cat audit/error.log | jq -r .operation | sort | uniq -c | sort -rn
```

## Troubleshooting

### audit.log is growing too large
**Cause**: Successful requests are being logged to audit.log
**Fix**: Ensure loggingMiddleware() in server.go returns empty string

### Missing audit logs for operation
**Cause**: Forgot to add audit logging in handler
**Fix**: Add `audit.GetCreateLogger()` / `GetUpdateLogger()` / `GetDeleteLogger()` calls

### Error not being logged
**Cause**: Handler returns without logging
**Fix**: Add `audit.GetErrorLogger()` before every error response

### Duplicate error logs
**Cause**: Both handler AND middleware logging the same error
**Fix**: This is intentional! Handler logs provide detailed context, middleware logs provide HTTP-level context

## Best Practices

1. **Always log errors with full context**: Include all IDs, error messages, and relevant data
2. **Never log sensitive data**: Don't log passwords, tokens, or sensitive user data
3. **Use descriptive operation names**: Make it easy to search logs
4. **Include file and function locations**: Makes debugging easier
5. **Don't log successful GETs**: Only log CREATE, UPDATE, DELETE successes
6. **Log before response**: Ensure log entry exists even if response fails
7. **Use appropriate log levels**: Info for success, Warn for client errors, Error for server errors
