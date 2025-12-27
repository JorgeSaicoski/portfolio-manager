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

### Exporting Logs Locally

The easiest way to access logs is to export them to your local machine:

```bash
# Export all audit and error logs from container to backend/audit-export/
make audit-export
```

This command will:
1. Create `backend/audit-export/audit/` directory with all audit logs:
   - `create.log` - All successful CREATE operations
   - `update.log` - All successful UPDATE operations
   - `delete.log` - All successful DELETE operations
2. Create `backend/audit-export/errors/` directory with all error logs:
   - `error.log` - All errors from any operation
3. Display a summary of exported files with sizes

After export, you can analyze logs locally:
```bash
cd backend/audit-export/audit
ls -lh
```

**Note**: The `backend/audit-export/` directory is git-ignored and will be recreated each time you run the export command.

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

---

## Emergency Database Recovery

### Overview: Audit Logs as Event Sourcing

Portfolio Manager's audit logging system serves dual purposes:
1. **Primary**: Troubleshooting, compliance, and security monitoring
2. **Secondary**: Emergency database reconstruction

**Event Sourcing Principle:**
Every CREATE, UPDATE, and DELETE operation is logged with complete context. In catastrophic scenarios where backups are unavailable or corrupted, audit logs can rebuild the database to its last known state.

**This is a unique capability** - most applications only use logs for debugging. Portfolio Manager's structured audit logs with full operation context enable database reconstruction through event replay.

### When to Use Audit Log Recovery

✅ **Use audit log recovery when:**
- Database corruption beyond repair
- Backup files are corrupted or inaccessible
- Backups are outdated but recent audit logs exist
- Ransomware attack (if audit logs were protected separately from DB)
- Need to prove exact data state at specific timestamp (legal/compliance)
- Partial data recovery needed (specific tables only)

⚠️ **Limitations:**
- **Time-consuming**: 2-8 hours vs 5-10 minutes for backup restore
- **Requires complete logs**: Must have all logs from beginning or known checkpoint
- **Cannot recover reads**: GET operations aren't logged (by design)
- **Manual verification required**: Need to spot-check recovered data
- **Complex process**: Requires technical expertise and careful execution

> **⚠️ CRITICAL**: Always prefer backup restoration. Use audit log reconstruction **only** when backups fail or are unavailable. See [backup-restore.md](backup-restore.md) for standard recovery procedures.

### Prerequisites for Recovery

Before attempting audit log recovery, verify:

#### 1. Audit Log Completeness

```bash
# Check audit logs exist and cover the needed timeframe
cd /app/audit/
ls -lh *.log

# Check first and last entries
echo "First CREATE:" && head -1 create.log | jq '.time'
echo "Last CREATE:" && tail -1 create.log | jq '.time'

# Verify no gaps in timestamps (important!)
jq -r '.time' create.log | sort | uniq -c | awk '$1 > 100 {print "Possible burst at", $2}'
```

#### 2. Required Tools

- `jq` - JSON processing
- `docker`/`podman` - Container access
- `psql` - Database client
- Sufficient disk space (3x current DB size recommended)
- 4-8 hours of dedicated time

#### 3. Clean Database State

You'll need either:
- Fresh empty database, OR
- Known checkpoint to start from

### Recovery Procedure

#### Phase 1: Preparation (30-60 minutes)

**Step 1.1: Backup audit logs FIRST**

```bash
# THIS IS CRITICAL - Don't skip!
mkdir -p /backup/audit-recovery-$(date +%Y%m%d-%H%M%S)
cp /app/audit/*.log /backup/audit-recovery-$(date +%Y%m%d-%H%M%S)/
cd /backup/audit-recovery-$(date +%Y%m%d-%H%M%S)/

# Verify backup
ls -lh
```

**Step 1.2: Assess recovery scope**

```bash
# Count operations to understand scope
echo "CREATE operations:" && jq -s 'length' create.log
echo "UPDATE operations:" && jq -s 'length' update.log
echo "DELETE operations:" && jq -s 'length' delete.log

# Estimate time: ~1000 operations per hour
TOTAL_OPS=$(($(jq -s 'length' create.log) + $(jq -s 'length' update.log) + $(jq -s 'length' delete.log)))
ESTIMATED_HOURS=$((TOTAL_OPS / 1000 + 1))
echo "Estimated recovery time: $ESTIMATED_HOURS hours"
```

**Step 1.3: Prepare clean database**

```bash
# Create recovery database
docker exec -it portfolio-postgres psql -U postgres << 'EOF'
CREATE DATABASE portfolio_db_recovery;
\c portfolio_db_recovery

-- Create schema (run your migrations)
-- IMPORTANT: Database must have exact same schema as production
EOF

# Verify schema
docker exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery -c "\dt"
```

#### Phase 2: Reconstruction (2-6 hours)

**Step 2.1: Sort operations chronologically**

```bash
# Combine all operations and sort by timestamp
jq -s '.[]' create.log update.log delete.log | \
  jq -s 'sort_by(.time)' > operations_sorted.json

# Verify sorting
head -5 operations_sorted.json | jq -r '.time'
tail -5 operations_sorted.json | jq -r '.time'
```

**Step 2.2: Generate SQL from CREATE operations**

```bash
# Extract portfolio creation SQL
jq -r '.[] | select(.operation == "CREATE_PORTFOLIO") |
"INSERT INTO portfolios (id, title, description, owner_id, is_public, created_at)
 VALUES (\(.portfolioID), '\''\(.title)'\'', '\''\(.description // "")'\'',
         '\''\(.userID)'\'', \(.isPublic // false), '\''\(.time)'\'');"' \
operations_sorted.json > recovery_portfolios.sql

# Similar for projects
jq -r '.[] | select(.operation == "CREATE_PROJECT") |
"INSERT INTO projects (id, title, description, portfolio_id, category_id, created_at)
 VALUES (\(.projectID), '\''\(.title)'\'', '\''\(.description // "")'\'',
         \(.portfolioID), \(.categoryID), '\''\(.time)'\'');"' \
operations_sorted.json > recovery_projects.sql

# Repeat for all entities: categories, sections, images, etc.
```

**Step 2.3: Apply CREATE operations**

```bash
# Execute in dependency order (parents before children)
docker exec -i portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery \
  < recovery_portfolios.sql

docker exec -i portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery \
  < recovery_projects.sql

# Continue for all entities...

# Check progress
docker exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery << 'EOF'
SELECT 'portfolios' as table_name, COUNT(*) FROM portfolios
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;
EOF
```

**Step 2.4: Apply UPDATE operations**

```bash
# Generate UPDATE SQL
jq -r '.[] | select(.operation == "UPDATE_PORTFOLIO") |
"UPDATE portfolios SET
 title = '\''\(.title)'\'',
 description = '\''\(.description // "")'\'',
 is_public = \(.isPublic // false),
 updated_at = '\''\(.time)'\''
 WHERE id = \(.portfolioID);"' \
operations_sorted.json > recovery_portfolio_updates.sql

# Apply updates
docker exec -i portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery \
  < recovery_portfolio_updates.sql
```

**Step 2.5: Handle DELETE operations**

**Decision point**: Do you want to replay deletions?

- **YES**: If recovering to exact historical state
- **NO**: If recovering maximum data (ignore user deletions)

```bash
# If YES - apply deletions
jq -r '.[] | select(.operation == "DELETE_PORTFOLIO") |
"DELETE FROM portfolios WHERE id = \(.portfolioID);"' \
operations_sorted.json > recovery_deletes.sql

docker exec -i portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery \
  < recovery_deletes.sql
```

#### Phase 3: Verification (1-2 hours)

**Step 3.1: Count verification**

```bash
# Compare record counts between logs and database
echo "Expected vs Actual:"

# Portfolios
EXPECTED=$(jq '[.[] | select(.operation == "CREATE_PORTFOLIO")] | length' operations_sorted.json)
ACTUAL=$(docker exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery -t \
  -c "SELECT COUNT(*) FROM portfolios")
echo "Portfolios: Expected=$EXPECTED, Actual=$ACTUAL"

# Repeat for all tables
```

**Step 3.2: Spot check critical data**

```bash
# Check recent portfolios
docker exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery << 'EOF'
SELECT id, title, owner_id, created_at
FROM portfolios
ORDER BY created_at DESC
LIMIT 10;
EOF

# Verify relationships (foreign keys)
docker exec -it portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery << 'EOF'
-- Find orphaned projects (should be 0)
SELECT COUNT(*) as orphaned_projects
FROM projects p
LEFT JOIN portfolios po ON p.portfolio_id = po.id
WHERE po.id IS NULL;
EOF
```

**Step 3.3: Manual verification**

Pick 5-10 known data points to verify manually:

1. Your own portfolio (you know the data)
2. Recent user signups (check authentication DB)
3. Recently uploaded images (check file existence)
4. Important client data (if applicable)

#### Phase 4: Cutover (30 minutes)

**Step 4.1: Final backup before cutover**

```bash
# Backup both old (corrupted) and new (recovered) databases
docker exec portfolio-postgres pg_dump -U portfolio_user portfolio_db \
  -F custom > /backup/corrupted_db_$(date +%Y%m%d).dump

docker exec portfolio-postgres pg_dump -U portfolio_user portfolio_db_recovery \
  -F custom > /backup/recovered_db_$(date +%Y%m%d).dump
```

**Step 4.2: Rename databases (cutover)**

```bash
# Stop application first!
docker compose stop backend frontend

# Rename databases
docker exec -it portfolio-postgres psql -U postgres << 'EOF'
-- Disconnect all clients
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'portfolio_db'
  AND pid <> pg_backend_pid();

-- Rename old database to _old
ALTER DATABASE portfolio_db RENAME TO portfolio_db_corrupted;

-- Rename recovery database to production name
ALTER DATABASE portfolio_db_recovery RENAME TO portfolio_db;
EOF

# Restart application
docker compose start backend frontend
```

**Step 4.3: Post-recovery verification**

```bash
# Test application
curl http://localhost:8000/health

# Test login and data access
# Manually verify in browser: http://localhost:3000
```

### Recovery Scripts and Tools

#### Script 1: Audit Log Analyzer

```bash
#!/bin/bash
# audit-log-analyzer.sh - Analyze audit log completeness

echo "Audit Log Analysis Report"
echo "========================="
echo ""

cd /app/audit/

for log in create.log update.log delete.log error.log; do
  if [ -f "$log" ]; then
    echo "File: $log"
    echo "  Total entries: $(jq -s 'length' $log)"
    echo "  First entry: $(head -1 $log | jq -r '.time')"
    echo "  Last entry: $(tail -1 $log | jq -r '.time')"
    echo "  File size: $(du -h $log | cut -f1)"
    echo ""
  fi
done

# Check for gaps in timestamps
echo "Checking for timestamp gaps..."
jq -r '.time' create.log | sort | uniq -c | awk '$1 > 100 {print "  Possible burst: " $2 " (" $1 " ops)"}'

echo "Analysis complete!"
```

#### Script 2: SQL Generator

```bash
#!/bin/bash
# generate-recovery-sql.sh - Generate SQL from audit logs

echo "Generating recovery SQL..."

# Sort operations
jq -s 'sort_by(.time)' create.log update.log delete.log > operations_sorted.json

# Generate SQL for each entity type
for entity in PORTFOLIO PROJECT CATEGORY SECTION IMAGE; do
  echo "Processing $entity..."
  # Add your SQL generation logic here
done

echo "SQL generation complete!"
```

#### Script 3: Verification Tool

```bash
#!/bin/bash
# verify-recovery.sh - Verify recovery accuracy

echo "Recovery Verification"
echo "===================="

# Count verification
docker exec portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery << 'EOF'
SELECT
  'Portfolios' as entity,
  COUNT(*) as count
FROM portfolios
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections
UNION ALL
SELECT 'Images', COUNT(*) FROM images;
EOF

# Orphan check
docker exec portfolio-postgres psql -U portfolio_user -d portfolio_db_recovery << 'EOF'
SELECT 'Orphaned projects' as issue, COUNT(*) as count
FROM projects p
LEFT JOIN portfolios po ON p.portfolio_id = po.id
WHERE po.id IS NULL;
EOF

echo "Verification complete!"
```

### Best Practices for Recovery-Ready Logging

To ensure audit logs can be used for recovery, follow these practices:

#### 1. Log Retention

**Minimum**: 90 days
**Recommended**: 1 year for compliance
**Critical systems**: 7 years (legal requirements)

```bash
# Configure log rotation in logger.go (example)
# Keep logs for 90 days before rotation
MaxAge: 90 * 24 * time.Hour
```

#### 2. Separate Storage

**Never store audit logs on same disk/volume as database!**

```bash
# Mount separate volume for audit logs
docker run -v /mnt/audit-logs:/app/audit/ ...

# Or use network storage
mount -t nfs backup-server:/audit-logs /app/audit/
```

#### 3. Remote Replication

```bash
# Hourly sync to S3 (add to cron)
0 * * * * aws s3 sync /app/audit/ s3://your-bucket/audit-logs/ \
  --exclude "*.log.lock"

# Or to backup server
0 * * * * rsync -avz /app/audit/ backup-server:/audit-logs/portfolio-manager/
```

#### 4. Monitoring and Alerts

```bash
# Alert on log write failures
# Add to monitoring system:

if [ ! -w "/app/audit/create.log" ]; then
  send_alert "Audit log not writable!"
fi

# Alert on missing log entries (5 min threshold)
LAST_LOG=$(tail -1 /app/audit/create.log | jq -r '.time')
AGE=$(( $(date +%s) - $(date -d "$LAST_LOG" +%s) ))
if [ $AGE -gt 300 ]; then
  send_alert "No audit logs for 5 minutes!"
fi
```

#### 5. Regular Recovery Drills

**Schedule monthly recovery drills:**

```bash
# Recovery drill procedure (monthly)
1. Copy audit logs to test environment
2. Attempt recovery to test database
3. Verify data integrity
4. Document time taken and issues found
5. Update recovery procedures
```

#### 6. Combined Approach (Backup + Audit Logs)

**Most reliable strategy** for critical systems:

```
┌─────────────────────────────────────────────┐
│  Combined Recovery Strategy                  │
├─────────────────────────────────────────────┤
│                                              │
│  1. Daily backups (fast recovery)           │
│  2. Continuous audit logging (complete)     │
│  3. Recovery: Backup + recent logs          │
│                                              │
│  Example:                                    │
│  - Last backup: 18 hours ago                │
│  - Database lost: now                       │
│  - Solution:                                │
│    a) Restore 18-hour-old backup (5 min)   │
│    b) Replay last 18 hours of logs (30 min)│
│  - Total time: 35 minutes                   │
│  - Data loss: ZERO                          │
│                                              │
└─────────────────────────────────────────────┘
```

**Implementation:**

```bash
#!/bin/bash
# combined-recovery.sh

# Step 1: Restore latest backup
make db-restore BACKUP=latest

# Step 2: Get backup timestamp
BACKUP_TIME=$(docker exec portfolio-postgres psql -U portfolio_user \
  -d portfolio_db -t -c "SELECT MAX(created_at) FROM portfolios")

# Step 3: Replay logs since backup
jq --arg since "$BACKUP_TIME" \
  '.[] | select(.time > $since)' \
  /app/audit/create.log > recent_operations.json

# Step 4: Apply recent operations
# (use SQL generation scripts from above)
```

### Troubleshooting Recovery

#### Issue: SQL syntax errors during replay

```bash
# Check for special characters in data
jq '.[] | select(.title | test("['\\''\"]"))' operations_sorted.json

# Solution: Proper escaping in SQL generation
# Use parameterized queries or escape quotes
```

#### Issue: Foreign key violations

```bash
# Check dependency order
# Parents must be created before children

# Correct order:
# 1. portfolios
# 2. categories
# 3. projects
# 4. sections
# 5. images
```

#### Issue: Duplicate key violations

```bash
# Check for duplicate CREATE operations
jq '[.[] | select(.operation == "CREATE_PORTFOLIO")] |
    group_by(.portfolioID) |
    map(select(length > 1))' operations_sorted.json

# Solution: Use UPSERT (INSERT ... ON CONFLICT)
```

#### Issue: Missing audit logs

```bash
# Identify gaps in audit logs
jq -r '.time' create.log | sort > timestamps.txt
# Manually review for suspicious gaps
# Check error.log for logging system failures
```

### When Recovery is Not Possible

If audit log recovery fails, consider:

1. **Data import from exports**: If users exported their data
2. **Cache reconstruction**: If Redis cache has recent data
3. **Browser storage**: Some data might be in users' browsers
4. **Third-party integrations**: Data might exist in connected services

---

## Related Documentation

- **[Backup & Restore](backup-restore.md)** - Standard backup/restore procedures
- **[How to Audit](../how-to-do/how-to-audit.md)** - Operational auditing guide
- **[Security Audit Summary](../security/audit-summary.md)** - Security implementation

---

**Last Updated**: 2025-11-27
