#!/bin/bash

# Portfolio Manager - Database Backup Script
# Performs automated backup of portfolio and authentik databases with compression and retention

set -e  # Exit on error

# Configuration
BACKUP_DIR="/home/bardockgaucho/GolandProjects/portfolio-manager/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
POSTGRES_CONTAINER="portfolio-postgres"
POSTGRES_USER="portfolio_user"
BACKEND_CONTAINER="portfolio-backend"
UPLOADS_PATH="/app/uploads"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
if ! podman ps | grep -q "$POSTGRES_CONTAINER"; then
    log_error "PostgreSQL container '$POSTGRES_CONTAINER' is not running"
    log_info "Start the container with: make start"
    exit 1
fi

log_info "Starting database backup..."

# Backup portfolio database
log_info "Backing up portfolio_db..."
if podman exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -F c portfolio_db > "$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump"; then
    log_success "Portfolio database dumped successfully"
else
    log_error "Failed to dump portfolio database"
    exit 1
fi

# Backup authentik database
log_info "Backing up authentik database..."
if podman exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -F c authentik > "$BACKUP_DIR/authentik_$TIMESTAMP.dump"; then
    log_success "Authentik database dumped successfully"
else
    log_error "Failed to dump authentik database"
    exit 1
fi

# Backup uploaded images
log_info "Backing up uploaded images..."
if podman ps | grep -q "$BACKEND_CONTAINER"; then
    if podman exec "$BACKEND_CONTAINER" tar -czf - -C "$UPLOADS_PATH" . > "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" 2>/dev/null; then
        UPLOADS_SIZE=$(du -h "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" | cut -f1)
        log_success "Uploaded images backed up successfully ($UPLOADS_SIZE)"
    else
        log_warning "No uploaded images found or uploads directory is empty"
        # Create empty archive to maintain consistent backup structure
        tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -T /dev/null 2>/dev/null || true
        UPLOADS_SIZE="0"
    fi
else
    log_warning "Backend container not running, skipping image backup"
    # Create empty archive to maintain consistent backup structure
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -T /dev/null 2>/dev/null || true
    UPLOADS_SIZE="0"
fi

# Compress database backups
log_info "Compressing database backups..."
gzip "$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump"
gzip "$BACKUP_DIR/authentik_$TIMESTAMP.dump"

# Calculate sizes
PORTFOLIO_SIZE=$(du -h "$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump.gz" | cut -f1)
AUTHENTIK_SIZE=$(du -h "$BACKUP_DIR/authentik_$TIMESTAMP.dump.gz" | cut -f1)

log_success "Backups compressed:"
echo "  - portfolio_db_$TIMESTAMP.dump.gz ($PORTFOLIO_SIZE)"
echo "  - authentik_$TIMESTAMP.dump.gz ($AUTHENTIK_SIZE)"
echo "  - uploads_$TIMESTAMP.tar.gz ($UPLOADS_SIZE)"

# Delete old backups (older than RETENTION_DAYS)
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" \( -name "*.dump.gz" -o -name "uploads_*.tar.gz" \) -mtime +$RETENTION_DAYS -type f -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_success "Deleted $DELETED_COUNT old backup(s)"
else
    log_info "No old backups to delete"
fi

# Show backup summary
log_success "Backup completed successfully!"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Timestamp: $TIMESTAMP"
echo "Retention: $RETENTION_DAYS days"
echo ""
log_info "Available backups:"
ls -lh "$BACKUP_DIR"/*.dump.gz | tail -5

# Create a "latest" symlink for easy access
ln -sf "portfolio_db_$TIMESTAMP.dump.gz" "$BACKUP_DIR/portfolio_db_latest.dump.gz"
ln -sf "authentik_$TIMESTAMP.dump.gz" "$BACKUP_DIR/authentik_latest.dump.gz"
ln -sf "uploads_$TIMESTAMP.tar.gz" "$BACKUP_DIR/uploads_latest.tar.gz"

log_success "Latest backup symlinks created"
echo ""
log_info "To restore this backup, run: make db-restore BACKUP=$TIMESTAMP"
