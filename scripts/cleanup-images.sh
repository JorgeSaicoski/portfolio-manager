#!/bin/bash

# Portfolio Manager - Image Cleanup Script
# Removes orphaned image files that no longer have database references

set -e  # Exit on error

# Configuration
BACKEND_CONTAINER="portfolio-backend"
POSTGRES_CONTAINER="portfolio-postgres"
POSTGRES_USER="portfolio_user"
POSTGRES_DB="portfolio_db"
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

# Check if containers are running
if ! podman ps | grep -q "$BACKEND_CONTAINER"; then
    log_error "Backend container '$BACKEND_CONTAINER' is not running"
    log_info "Start the container with: make start"
    exit 1
fi

if ! podman ps | grep -q "$POSTGRES_CONTAINER"; then
    log_error "PostgreSQL container '$POSTGRES_CONTAINER' is not running"
    log_info "Start the container with: make start"
    exit 1
fi

log_info "Starting image cleanup process..."

# Get list of all image files from filesystem
log_info "Scanning filesystem for uploaded images..."
FILESYSTEM_IMAGES=$(podman exec "$BACKEND_CONTAINER" find "$UPLOADS_PATH" -type f -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" 2>/dev/null || echo "")

if [ -z "$FILESYSTEM_IMAGES" ]; then
    log_info "No images found in filesystem"
    exit 0
fi

TOTAL_FILES=$(echo "$FILESYSTEM_IMAGES" | wc -l)
log_info "Found $TOTAL_FILES image files"

# Get list of all image filenames from database
log_info "Querying database for registered images..."
DB_IMAGES=$(podman exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -c "SELECT file_name FROM images WHERE deleted_at IS NULL" 2>/dev/null || echo "")

if [ -z "$DB_IMAGES" ]; then
    log_warning "No images found in database"
    log_warning "All filesystem images might be orphaned!"
fi

# Find orphaned files
ORPHANED_COUNT=0
ORPHANED_SIZE=0

log_info "Checking for orphaned files..."

echo "$FILESYSTEM_IMAGES" | while read -r filepath; do
    if [ -z "$filepath" ]; then
        continue
    fi

    # Extract just the filename from the full path
    filename=$(basename "$filepath")

    # Check if filename exists in database
    if ! echo "$DB_IMAGES" | grep -q "^$filename$"; then
        # File is orphaned
        file_size=$(podman exec "$BACKEND_CONTAINER" stat -c%s "$filepath" 2>/dev/null || echo "0")

        log_warning "Orphaned file: $filename ($(numfmt --to=iec $file_size 2>/dev/null || echo "${file_size}B"))"

        # Delete the orphaned file
        if podman exec "$BACKEND_CONTAINER" rm -f "$filepath"; then
            ORPHANED_COUNT=$((ORPHANED_COUNT + 1))
            ORPHANED_SIZE=$((ORPHANED_SIZE + file_size))
        else
            log_error "Failed to delete: $filepath"
        fi
    fi
done

# Summary
if [ "$ORPHANED_COUNT" -gt 0 ]; then
    ORPHANED_SIZE_HUMAN=$(numfmt --to=iec $ORPHANED_SIZE 2>/dev/null || echo "${ORPHANED_SIZE} bytes")
    log_success "Cleanup completed: Removed $ORPHANED_COUNT orphaned file(s) ($ORPHANED_SIZE_HUMAN freed)"
else
    log_success "No orphaned files found. All images are properly referenced in the database."
fi

# Also clean up soft-deleted images older than 90 days
log_info "Checking for soft-deleted images older than 90 days..."
SOFT_DELETED=$(podman exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -c "
    SELECT file_name, url, thumbnail_url
    FROM images
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days'
" 2>/dev/null || echo "")

if [ -n "$SOFT_DELETED" ]; then
    SOFT_DELETED_COUNT=0

    echo "$SOFT_DELETED" | while IFS='|' read -r filename url thumbnail_url; do
        if [ -z "$filename" ]; then
            continue
        fi

        log_info "Removing soft-deleted image: $filename"

        # Delete the actual files
        if [ -n "$url" ]; then
            url_path=$(echo "$url" | sed 's|^/uploads/||')
            podman exec "$BACKEND_CONTAINER" rm -f "$UPLOADS_PATH/$url_path" 2>/dev/null || true
        fi

        if [ -n "$thumbnail_url" ]; then
            thumb_path=$(echo "$thumbnail_url" | sed 's|^/uploads/||')
            podman exec "$BACKEND_CONTAINER" rm -f "$UPLOADS_PATH/$thumb_path" 2>/dev/null || true
        fi

        # Hard delete from database
        podman exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            DELETE FROM images WHERE file_name = '$filename' AND deleted_at IS NOT NULL
        " &>/dev/null

        SOFT_DELETED_COUNT=$((SOFT_DELETED_COUNT + 1))
    done

    if [ "$SOFT_DELETED_COUNT" -gt 0 ]; then
        log_success "Permanently removed $SOFT_DELETED_COUNT soft-deleted image(s) older than 90 days"
    fi
else
    log_info "No old soft-deleted images to clean up"
fi

log_success "Image cleanup process completed!"
