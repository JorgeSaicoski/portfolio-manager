#!/bin/bash

# Portfolio Manager - List Backups Script
# Displays all available database backups with detailed information

# Configuration
BACKUP_DIR="/home/bardockgaucho/GolandProjects/portfolio-manager/backups"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo "═══════════════════════════════════════════════════════════════"
echo "  Portfolio Manager - Available Database Backups"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "No backup directory found at: $BACKUP_DIR"
    log_info "Create your first backup with: make db-backup"
    exit 0
fi

# Count backups
PORTFOLIO_COUNT=$(ls "$BACKUP_DIR"/portfolio_db_*.dump.gz 2>/dev/null | wc -l)
AUTHENTIK_COUNT=$(ls "$BACKUP_DIR"/authentik_*.dump.gz 2>/dev/null | wc -l)

if [ "$PORTFOLIO_COUNT" -eq 0 ] && [ "$AUTHENTIK_COUNT" -eq 0 ]; then
    log_info "No backups found in: $BACKUP_DIR"
    log_info "Create your first backup with: make db-backup"
    exit 0
fi

echo "Backup directory: $BACKUP_DIR"
echo "Portfolio backups: $PORTFOLIO_COUNT"
echo "Authentik backups: $AUTHENTIK_COUNT"
echo ""

# Show latest backup first
if [ -L "$BACKUP_DIR/portfolio_db_latest.dump.gz" ]; then
    echo "───────────────────────────────────────────────────────────────"
    echo -e "${GREEN}LATEST BACKUP:${NC}"
    LATEST_LINK=$(readlink "$BACKUP_DIR/portfolio_db_latest.dump.gz")
    TIMESTAMP=$(echo "$LATEST_LINK" | sed 's/portfolio_db_\(.*\)\.dump\.gz/\1/')

    PORTFOLIO_FILE="$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump.gz"
    AUTHENTIK_FILE="$BACKUP_DIR/authentik_$TIMESTAMP.dump.gz"

    if [ -f "$PORTFOLIO_FILE" ]; then
        PORTFOLIO_SIZE=$(du -h "$PORTFOLIO_FILE" | cut -f1)
        PORTFOLIO_DATE=$(stat -c %y "$PORTFOLIO_FILE" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  Portfolio: $TIMESTAMP ($PORTFOLIO_SIZE) - Created: $PORTFOLIO_DATE"
    fi

    if [ -f "$AUTHENTIK_FILE" ]; then
        AUTHENTIK_SIZE=$(du -h "$AUTHENTIK_FILE" | cut -f1)
        AUTHENTIK_DATE=$(stat -c %y "$AUTHENTIK_FILE" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  Authentik: $TIMESTAMP ($AUTHENTIK_SIZE) - Created: $AUTHENTIK_DATE"
    fi

    echo ""
    echo "  Restore: make db-restore BACKUP=latest"
    echo "───────────────────────────────────────────────────────────────"
    echo ""
fi

# List all portfolio backups
echo -e "${BLUE}ALL BACKUPS (newest first):${NC}"
echo ""
echo "Timestamp            | Database  | Size   | Created"
echo "─────────────────────|-----------|--------|─────────────────────"

# Get unique timestamps from both portfolio and authentik backups
TIMESTAMPS=$(ls "$BACKUP_DIR"/*.dump.gz 2>/dev/null | sed 's/.*_\([0-9_]*\)\.dump\.gz/\1/' | sort -r | uniq)

for TIMESTAMP in $TIMESTAMPS; do
    # Portfolio backup
    PORTFOLIO_FILE="$BACKUP_DIR/portfolio_db_$TIMESTAMP.dump.gz"
    if [ -f "$PORTFOLIO_FILE" ]; then
        SIZE=$(du -h "$PORTFOLIO_FILE" | cut -f1)
        DATE=$(stat -c %y "$PORTFOLIO_FILE" | cut -d' ' -f1,2 | cut -d'.' -f1)
        printf "%-20s | %-9s | %-6s | %s\n" "$TIMESTAMP" "portfolio" "$SIZE" "$DATE"
    fi

    # Authentik backup
    AUTHENTIK_FILE="$BACKUP_DIR/authentik_$TIMESTAMP.dump.gz"
    if [ -f "$AUTHENTIK_FILE" ]; then
        SIZE=$(du -h "$AUTHENTIK_FILE" | cut -f1)
        DATE=$(stat -c %y "$AUTHENTIK_FILE" | cut -d' ' -f1,2 | cut -d'.' -f1)
        printf "%-20s | %-9s | %-6s | %s\n" "$TIMESTAMP" "authentik" "$SIZE" "$DATE"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}USAGE:${NC}"
echo "  To restore a backup:"
echo "    make db-restore BACKUP=<timestamp>"
echo "    make db-restore BACKUP=latest"
echo ""
echo "  To create a new backup:"
echo "    make db-backup"
echo ""
echo "  Examples:"
echo "    make db-restore BACKUP=20250123_140530  # Restore both databases"
echo "    make db-restore BACKUP=latest            # Restore from latest"
echo ""
