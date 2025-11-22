# Database UI - Adminer

Adminer is a lightweight, web-based database management tool for the Portfolio Manager ecosystem. It provides an intuitive interface to manage PostgreSQL databases and supports multiple database systems for future microservices.

## Table of Contents

1. [Why Adminer?](#why-adminer)
2. [Quick Start](#quick-start)
3. [Accessing Adminer](#accessing-adminer)
4. [Managing Databases](#managing-databases)
5. [Common Tasks](#common-tasks)
6. [Customization](#customization)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Why Adminer?

### Key Benefits

**Lightweight & Fast**
- Docker image: only 12 MB (vs pgAdmin's 543 MB)
- Memory usage: ~256 MB (vs pgAdmin's 2.6 GB)
- 45x smaller than pgAdmin

**Multi-Database Support**
- PostgreSQL (portfolio_db, authentik, future services)
- MySQL/MariaDB
- MongoDB
- SQLite, MS SQL, Oracle, and more
- Perfect for the microservices ecosystem

**Simple Integration**
- Single container, no dependencies
- Optional Docker Compose profile (like monitoring)
- Follows existing Makefile automation pattern
- Works seamlessly with Podman

**Feature-Rich**
- Visual query builder
- Table structure viewer
- Data import/export (SQL, CSV, JSON)
- User and permission management
- Real-time query execution

### Comparison with Alternatives

| Feature | Adminer | pgAdmin | DBeaver |
|---------|---------|---------|---------|
| Docker Size | 12 MB | 543 MB | N/A |
| Memory Usage | 256 MB | 2.6 GB | N/A |
| Multi-DB Support | ✓ | PostgreSQL only | ✓ |
| Web-based | ✓ | ✓ | ✗ |
| Container-native | ✓ | ✓ | ✗ |
| Setup Complexity | Very Simple | Moderate | Complex |

---

## Quick Start

### Starting Adminer

```bash
# Start Adminer database UI
make db-ui-start

# Open in browser (automatic)
make db-ui-open
```

**Access**: http://localhost:8080

### Stopping Adminer

```bash
# Stop Adminer
make db-ui-stop
```

### Available Commands

```bash
make db-ui-start    # Start Adminer
make db-ui-stop     # Stop Adminer
make db-ui-open     # Open in browser
make db-ui-restart  # Restart Adminer
```

---

## Accessing Adminer

### Login Screen

When you open http://localhost:8080, you'll see the Adminer login screen:

**Connection Details:**

1. **System**: Select `PostgreSQL`
2. **Server**: `portfolio-postgres` (auto-filled)
3. **Username**: `portfolio_user` (from `.env`)
4. **Password**: Your PostgreSQL password (from `.env` - `POSTGRES_PASSWORD`)
5. **Database**: `portfolio_db` or `authentik`

**Example:**
```
System:   PostgreSQL
Server:   portfolio-postgres
Username: portfolio_user
Password: your_password_from_env
Database: portfolio_db
```

### First Login

After logging in successfully:
- You'll see the database schema
- Left sidebar shows all tables
- Top navigation for queries, exports, etc.

---

## Managing Databases

### Accessing Different Databases

The Portfolio Manager ecosystem has multiple databases:

#### 1. portfolio_db (Application Database)

**Contains:**
- Users table
- Portfolios
- Projects
- Sections
- Categories
- Application data

**Access:**
- Login with `portfolio_user` credentials
- Select `portfolio_db` as the database

#### 2. authentik (Authentication Database)

**Contains:**
- Authentik user accounts
- OAuth2/OIDC configurations
- Authentication flows
- User sessions

**Access:**
- Login with `authentik` user credentials (if needed)
- Or use `portfolio_user` with read permissions
- Select `authentik` as the database

**Note**: Be careful modifying authentik database - it can break authentication!

#### 3. Future Microservice Databases

As you add services to the ecosystem (loyalty points, analytics, etc.):

**Access:**
- Each service will have its own database/schema
- Use the service's database credentials
- Select the appropriate database name

**Example - Loyalty System:**
```
Database: loyalty_db
Username: loyalty_user
Password: loyalty_password
```

### Switching Between Databases

**Method 1: Logout and Login**
1. Click **Logout** (top right)
2. Login again with different database name

**Method 2: Use Database Selector**
1. Click current database name (top left)
2. Select from dropdown
3. If database not listed, may need different credentials

---

## Common Tasks

### Viewing Table Structure

1. Click on a table name in the left sidebar
2. You'll see:
   - **Columns**: Field names, types, constraints
   - **Indexes**: Primary keys, unique constraints, indexes
   - **Foreign keys**: Relationships with other tables

**Example - View Users Table:**
- Navigate to: `portfolio_db` → `users`
- See columns: id, email, username, created_at, etc.

### Browsing Table Data

1. Click on table name
2. Click **Select data** tab (or just the table name)
3. View rows with pagination

**Features:**
- Filter data
- Sort by column
- Edit individual rows
- Delete rows
- Export data

### Running SQL Queries

#### Method 1: SQL Command

1. Click **SQL command** (left sidebar)
2. Write your query:
   ```sql
   SELECT * FROM users WHERE created_at > '2024-01-01';
   ```
3. Click **Execute** (or press Ctrl+Enter)

#### Method 2: Visual Query Builder

1. Click **Select** (left sidebar)
2. Choose table
3. Select columns
4. Add WHERE conditions
5. Preview generated SQL
6. Execute query

**Example Query:**
```sql
-- Get all portfolios for a specific user
SELECT p.id, p.title, p.description, p.created_at
FROM portfolios p
JOIN users u ON p.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY p.created_at DESC;
```

### Inserting Data

**Method 1: Manual Insert**
1. Navigate to table
2. Click **New item**
3. Fill in fields
4. Click **Save**

**Method 2: SQL INSERT**
1. Click **SQL command**
2. Write INSERT statement:
   ```sql
   INSERT INTO categories (name, description)
   VALUES ('Web Development', 'Projects related to web development');
   ```

### Updating Data

**Method 1: Edit Row**
1. Click on table
2. Click **edit** link next to a row
3. Modify fields
4. Click **Save**

**Method 2: SQL UPDATE**
```sql
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1;
```

**⚠️ Warning**: Always use WHERE clause to avoid updating all rows!

### Deleting Data

**Method 1: Delete Row**
1. Navigate to table data
2. Check checkbox next to row(s)
3. Select **Delete** from action dropdown
4. Confirm deletion

**Method 2: SQL DELETE**
```sql
DELETE FROM sessions
WHERE expired_at < NOW();
```

**⚠️ Warning**: Always backup before deleting! Use WHERE clause!

### Exporting Data

#### Export Entire Database

1. Click database name (top left)
2. Click **Export** (left sidebar)
3. Choose format:
   - **SQL** - Full database dump
   - **CSV** - Comma-separated values
   - **CSV;** - Semicolon-separated
4. Select options:
   - Tables to export
   - Include DROP statements
   - Include data
5. Click **Export**

#### Export Single Table

1. Navigate to table
2. Click **Export** (left sidebar)
3. Choose format and options
4. Download file

**Example - Export Users as CSV:**
```
Table: users
Format: CSV
Options: Include headers
```

### Importing Data

#### Import SQL File

1. Click database name
2. Click **Import** (left sidebar)
3. Choose file or paste SQL
4. Set options:
   - Encoding
   - Execute queries
5. Click **Execute**

**Example - Import Backup:**
```sql
-- Restore from backup
-- File: backups/portfolio_db_20240101_120000.sql
```

#### Import CSV

1. Navigate to table
2. Click **Import** (left sidebar)
3. Upload CSV file
4. Map columns
5. Click **Import**

### Managing Users & Permissions

#### View Database Users

1. Click **Privileges** (left sidebar)
2. See all database users
3. View their permissions

#### Create New User

1. Click **Privileges** → **Create user**
2. Fill in:
   ```
   Username: new_service_user
   Password: secure_password_here
   ```
3. Grant permissions:
   - **All privileges** (for service owners)
   - **SELECT only** (for read-only access)
4. Click **Save**

**Example - Create Read-Only User:**
```sql
CREATE USER analytics_reader WITH PASSWORD 'secure_pass';
GRANT CONNECT ON DATABASE portfolio_db TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;
```

#### Modify User Permissions

1. Click **Privileges**
2. Click on username
3. Modify permissions
4. Click **Save**

### Database Maintenance

#### Analyze Tables (Update Statistics)

```sql
-- Analyze single table
ANALYZE users;

-- Analyze entire database
ANALYZE;
```

#### Vacuum (Reclaim Storage)

```sql
-- Vacuum single table
VACUUM users;

-- Vacuum entire database
VACUUM;

-- Full vacuum (reclaim more space, takes longer)
VACUUM FULL;
```

#### Check Table Sizes

```sql
-- Size of all tables
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Customization

### Themes

Adminer supports multiple themes. Change in `.env`:

```bash
ADMINER_DESIGN=nette  # Default theme
```

**Available Themes:**

1. **nette** (default) - Clean, professional
2. **pepa-linha** - Colorful, modern
3. **pepa-linha-dark** - Dark mode
4. **price** - Minimal, fast
5. **hydra** - Modern, sleek

**Apply Theme:**
1. Edit `.env`
2. Change `ADMINER_DESIGN` value
3. Restart: `make db-ui-restart`

### Custom Port

Change Adminer port in `.env`:

```bash
ADMINER_PORT=9090  # Use different port
```

Then restart: `make db-ui-restart`

---

## Security Considerations

### Development Use Only

**⚠️ Important**: Adminer is designed for **development and administration**, not production use.

**Why?**
- Direct database access
- No audit logging
- No rate limiting
- No advanced access control

### Best Practices

#### 1. Local Access Only

**Current setup**: Adminer binds to `localhost:8080`
- Only accessible from your machine
- Not exposed to internet
- Safe for development

#### 2. Stop When Not Needed

```bash
# Start only when you need it
make db-ui-start

# Stop when done
make db-ui-stop
```

#### 3. Production Recommendations

If you MUST use Adminer in production:

**Option A: VPN Access**
```yaml
# Don't expose port publicly
# Access via VPN only
```

**Option B: Reverse Proxy with Auth**
```yaml
# Use nginx with basic auth
# SSL/TLS required
# IP whitelist
```

**Option C: SSH Tunnel**
```bash
# SSH tunnel to production server
ssh -L 8080:localhost:8080 user@production-server
# Access via http://localhost:8080
```

#### 4. Read-Only Mode

For production safety, use read-only PostgreSQL user:

```sql
-- Create read-only user
CREATE USER admin_readonly WITH PASSWORD 'secure_pass';
GRANT CONNECT ON DATABASE portfolio_db TO admin_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO admin_readonly;

-- Use this user in Adminer for production access
```

### Credentials Security

**Never commit credentials!**
- `.env` file is gitignored
- Use strong passwords
- Rotate passwords regularly
- Use different passwords per environment

---

## Troubleshooting

### Cannot Access http://localhost:8080

**Check if Adminer is running:**
```bash
# Check status
podman ps | grep adminer

# Should show: portfolio-adminer ... Up
```

**If not running:**
```bash
# Start it
make db-ui-start
```

**Still not working?**
```bash
# Check logs
podman logs portfolio-adminer

# Restart
make db-ui-restart
```

### Cannot Connect to Database

**Error: "Connection refused"**

**Check PostgreSQL is running:**
```bash
podman ps | grep postgres
```

**Check credentials:**
- Verify username/password in `.env`
- Ensure using `portfolio-postgres` as server (not `localhost`)

**Test connection from Adminer container:**
```bash
podman exec -it portfolio-adminer sh
# Inside container:
ping portfolio-postgres
```

### Error: "Access denied"

**Possible causes:**
1. Wrong username/password
2. User doesn't have permission to database
3. Database doesn't exist

**Solution:**
```bash
# Check user permissions
podman exec -it portfolio-postgres psql -U postgres -c "\du"

# Grant permissions
podman exec -it portfolio-postgres psql -U postgres
# Then:
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;
```

### Port 8080 Already in Use

**Change port in `.env`:**
```bash
ADMINER_PORT=9090  # Use different port
```

**Restart:**
```bash
make db-ui-restart
```

### Adminer Shows Empty/No Tables

**Check you're in correct database:**
- Click database name (top left)
- Select `portfolio_db`
- Should see tables in left sidebar

**If still empty:**
- Database might be empty
- Run migrations: `make db-migrate`
- Or you need different user permissions

### Cannot Execute Queries

**Error: "Permission denied"**

**Check user has query permission:**
```sql
-- Grant query permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO portfolio_user;
```

### Theme Not Changing

**After editing `.env`:**
```bash
# Must restart container
make db-ui-restart

# Clear browser cache
# Hard refresh: Ctrl+Shift+R
```

---

## Advanced Usage

### Multiple Database Connections

Adminer can connect to multiple databases simultaneously:

1. Open Adminer in multiple browser tabs
2. Each tab can connect to different database
3. Useful for comparing data or migrations

**Example:**
- Tab 1: portfolio_db (application data)
- Tab 2: authentik (auth data)
- Tab 3: loyalty_db (future service)

### Bookmarked Queries

Save frequently used queries:

1. Write your query
2. Add comment at top:
   ```sql
   -- Query: Active Users Last 30 Days
   SELECT COUNT(*) FROM users
   WHERE last_login > NOW() - INTERVAL '30 days';
   ```
3. Save as `.sql` file locally
4. Import when needed

### Database Comparison

Compare two databases:

1. Export schema from database A
2. Export schema from database B
3. Use diff tool to compare

**Or use SQL:**
```sql
-- Compare table counts
SELECT 'portfolio_db' as db, COUNT(*) FROM users
UNION ALL
SELECT 'loyalty_db', COUNT(*) FROM loyalty.users;
```

---

## Integration with Ecosystem

### Using with Microservices

As you add microservices (per [Architecture Guide](../development/architecture.md)):

**Each service's database is accessible:**
```bash
# Login to Adminer
# System: PostgreSQL
# Server: portfolio-postgres
# Database: [service_name]_db
# User: [service_name]_user
# Password: from .env
```

**Example - Loyalty Service:**
```
Database: loyalty_db
Username: loyalty_user
Password: ${LOYALTY_DB_PASSWORD}
```

### Multi-Database Management

Adminer supports switching between database types:

**PostgreSQL** (current)
- portfolio_db
- authentik
- future_service_db

**MongoDB** (if added)
- Change System to "MongoDB"
- Connect to MongoDB container
- Manage document collections

**MySQL** (if added)
- Change System to "MySQL"
- Connect to MySQL container
- Manage tables

---

## Related Documentation

- **[Architecture Overview](../development/architecture.md)** - Ecosystem design
- **[Microservices Integration](../development/microservices-integration.md)** - Adding services
- **[Makefile Guide](../MAKEFILE_GUIDE.md)** - All make commands
- **[Monitoring Guide](monitoring.md)** - Grafana and Prometheus

---

## Summary

Adminer provides a lightweight, powerful database management interface for the Portfolio Manager ecosystem:

✅ **45x smaller** than pgAdmin (12 MB vs 543 MB)
✅ **Multi-database support** for future microservices
✅ **Simple Makefile commands** (`make db-ui-start`)
✅ **Visual and SQL interfaces** for all skill levels
✅ **Import/Export capabilities** for backups and migrations
✅ **Optional deployment** via Docker Compose profile

**Quick Reference:**
```bash
make db-ui-start   # Start Adminer
make db-ui-open    # Open browser
make db-ui-stop    # Stop Adminer
```

**Access**: http://localhost:8080
**Login**: Use credentials from `.env` file
