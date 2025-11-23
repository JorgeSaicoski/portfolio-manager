#!/bin/bash

# Portfolio Manager - Database Restore Script
# Restores portfolio and authentik databases from backup

set -e  # Exit on error

# Configuration
BACKUP_DIR="/home/bardockgaucho/GolandProjects/portfolio-manager/backups"
POSTGRES_CONTAINER="portfolio-postgres"
POSTGRES_USER="portfolio_user"

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

# Check arguments
if [ -z "$1" ]; then
    log_error "Usage: $0 <timestamp|latest> [portfolio|authentik|all]"
    echo ""
    echo "Examples:"
    echo "  $0 20250123_140530 all        # Restore both databases from specific backup"
    echo "  $0 latest portfolio           # Restore only portfolio from latest backup"
    echo "  $0 20250123_140530 authentik  # Restore only authentik from specific backup"
    echo ""
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR"/*.dump.gz 2>/dev/null | tail -10
    exit 1
fi

TIMESTAMP=$1
DATABASE=${2:-all}  # Default to "all" if not specified

# Check if PostgreSQL container is running
if ! podman ps | grep -q "$POSTGRES_CONTAINER"; then
    log_error "PostgreSQL container '$POSTGRES_CONTAINER' is not running"
    log_info "Start the container with: make start"
    exit 1
fi

# Resolve timestamp if "latest" is specified
if [ "$TIMESTAMP" == "latest" ]; then
    if [ ! -f "$BACKUP_DIR/portfolio_db_latest.dump.gz" ]; then
        log_error "No 'latest' backup symlink found"
        log_info "Run 'make db-backup' to create a backup first"
        exit 1
    fi
    # Extract timestamp from latest symlink
    LATEST_LINK=$(readlink "$BACKUP_DIR/portfolio_db_latest.dump.gz")
    TIMESTAMP=$(echo "$LATEST_LINK" | sed 's/portfolio_db_\(.*\)\.dump\.gz/\1/')
    log_info "Using latest backup: $TIMESTAMP"
fi

# Check if backup files exist
PORTFOLIO_BACKUP="$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump.gz"
AUTHENTIK_BACKUP="$BACKUP_DIR/authentik_$TIMESTAMP.dump.gz"

if [ "$DATABASE" == "all" ] || [ "$DATABASE" == "portfolio" ]; then
    if [ ! -f "$PORTFOLIO_BACKUP" ]; then
        log_error "Portfolio backup not found: $PORTFOLIO_BACKUP"
        exit 1
    fi
fi

if [ "$DATABASE" == "all" ] || [ "$DATABASE" == "authentik" ]; then
    if [ ! -f "$AUTHENTIK_BACKUP" ]; then
        log_error "Authentik backup not found: $AUTHENTIK_BACKUP"
        exit 1
    fi
fi

# Warning and confirmation
log_warning "╔═══════════════════════════════════════════════════════════════╗"
log_warning "║                    ⚠️  WARNING  ⚠️                              ║"
log_warning "║                                                               ║"
log_warning "║  This will OVERWRITE the current database(s) with the        ║"
log_warning "║  backup from $TIMESTAMP                            ║"
log_warning "║                                                               ║"
log_warning "║  All current data in the database(s) will be LOST!           ║"
log_warning "╚═══════════════════════════════════════════════════════════════╝"
echo ""
read -p "Are you sure you want to continue? Type 'yes' to proceed: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Stop services before restore
log_info "Stopping services..."
cd /home/bardockgaucho/GolandProjects/portfolio-manager
make stop > /dev/null 2>&1 || true

log_info "Starting PostgreSQL only..."
podman compose up -d portfolio-postgres
sleep 5  # Wait for PostgreSQL to be ready

# Restore portfolio database
if [ "$DATABASE" == "all" ] || [ "$DATABASE" == "portfolio" ]; then
    log_info "Restoring portfolio_db..."

    if gunzip -c "$PORTFOLIO_BACKUP" | podman exec -i "$POSTGRES_CONTAINER" pg_restore -U "$POSTGRES_USER" -d portfolio_db --clean --if-exists 2>&1 | grep -v "WARNING"; then
        log_success "Portfolio database restored successfully"
    else
        log_warning "Portfolio database restored with warnings (this is normal)"
    fi
fi

# Restore authentik database
if [ "$DATABASE" == "all" ] || [ "$DATABASE" == "authentik" ]; then
    log_info "Restoring authentik database..."

    if gunzip -c "$AUTHENTIK_BACKUP" | podman exec -i "$POSTGRES_CONTAINER" pg_restore -U "$POSTGRES_USER" -d authentik --clean --if-exists 2>&1 | grep -v "WARNING"; then
        log_success "Authentik database restored successfully"
    else
        log_warning "Authentik database restored with warnings (this is normal)"
    fi
fi

# Restart all services
log_info "Restarting all services..."
make start > /dev/null 2>&1

log_success "═══════════════════════════════════════════════════════════════"
log_success "Restore completed successfully!"
log_success "═══════════════════════════════════════════════════════════════"
echo ""
echo "Restored from backup: $TIMESTAMP"
echo "Database(s) restored: $DATABASE"
echo ""
log_info "Services are starting up..."
log_info "Wait a few seconds, then check: http://localhost:3000"
echo ""
log_warning "Note: You may need to log out and log back in"
