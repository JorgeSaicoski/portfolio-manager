#!/bin/bash
set -e

# Portfolio Manager Deployment Script
# This script deploys the application to a Vultr server

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH_STAGING="/opt/portfolio-manager-staging"
DEPLOY_PATH_PRODUCTION="/opt/portfolio-manager"

# Set deployment path based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_PATH="$DEPLOY_PATH_PRODUCTION"
    DEPLOY_HOST="${PRODUCTION_HOST}"
    DEPLOY_KEY="${PRODUCTION_SSH_KEY_PATH:-~/.ssh/id_rsa}"
else
    DEPLOY_PATH="$DEPLOY_PATH_STAGING"
    DEPLOY_HOST="${STAGING_HOST}"
    DEPLOY_KEY="${STAGING_SSH_KEY_PATH:-~/.ssh/id_rsa}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Portfolio Manager Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Host: ${YELLOW}${DEPLOY_HOST}${NC}"
echo -e "Path: ${YELLOW}${DEPLOY_PATH}${NC}"
echo ""

# Validate inputs
if [ -z "$DEPLOY_HOST" ]; then
    echo -e "${RED}Error: DEPLOY_HOST is not set${NC}"
    echo "Set STAGING_HOST or PRODUCTION_HOST environment variable"
    exit 1
fi

if [ ! -f "$DEPLOY_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at ${DEPLOY_KEY}${NC}"
    exit 1
fi

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# Function to execute remote commands
remote_exec() {
    ssh -i "$DEPLOY_KEY" -o StrictHostKeyChecking=no "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"
}

# Function to copy files
remote_copy() {
    scp -i "$DEPLOY_KEY" -o StrictHostKeyChecking=no "$@"
}

# Step 1: Create backup (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    remote_exec << 'ENDSSH'
        set -e
        cd ${DEPLOY_PATH}

        BACKUP_DIR="/opt/backups/portfolio-manager"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mkdir -p ${BACKUP_DIR}

        # Backup database
        docker compose exec -T portfolio-postgres pg_dump \
            -U ${POSTGRES_USER} ${POSTGRES_DB} \
            | gzip > ${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz

        # Backup uploads
        docker compose exec -T portfolio-backend tar czf - /app/uploads \
            > ${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz

        echo "Backup created at ${BACKUP_DIR}"
ENDSSH
    echo -e "${GREEN}✓ Backup completed${NC}"
    echo ""
fi

# Step 2: Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
BRANCH="${DEPLOY_BRANCH:-main}"
if [ "$ENVIRONMENT" = "staging" ]; then
    BRANCH="develop"
fi

remote_exec << ENDSSH
    set -e
    cd ${DEPLOY_PATH}

    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}

    echo "Current commit: \$(git rev-parse --short HEAD)"
ENDSSH
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 3: Pull Docker images
echo -e "${YELLOW}🐳 Pulling Docker images...${NC}"
remote_exec << 'ENDSSH'
    set -e
    cd ${DEPLOY_PATH}

    docker compose pull backend frontend
ENDSSH
echo -e "${GREEN}✓ Images pulled${NC}"
echo ""

# Step 4: Deploy services
echo -e "${YELLOW}🚀 Deploying services...${NC}"
remote_exec << 'ENDSSH'
    set -e
    cd ${DEPLOY_PATH}

    # Restart services
    docker compose up -d backend frontend

    # Wait for services to start
    sleep 10
ENDSSH
echo -e "${GREEN}✓ Services deployed${NC}"
echo ""

# Step 5: Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"
sleep 5

HEALTH_URL="http://${DEPLOY_HOST}:8000/health"
if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="${PRODUCTION_URL:-http://${DEPLOY_HOST}}/api/health"
elif [ "$ENVIRONMENT" = "staging" ]; then
    HEALTH_URL="${STAGING_URL:-http://${DEPLOY_HOST}:8000}/health"
fi

for i in {1..5}; do
    if curl -sf "$HEALTH_URL" > /dev/null; then
        echo -e "${GREEN}✓ Health check passed${NC}"
        break
    fi
    echo "Waiting for service... ($i/5)"
    sleep 5
done

# Step 6: Cleanup
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
remote_exec << 'ENDSSH'
    docker image prune -af --filter "until=48h"
ENDSSH
echo -e "${GREEN}✓ Cleanup completed${NC}"
echo ""

# Deployment summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Host: ${YELLOW}${DEPLOY_HOST}${NC}"
echo -e "Time: ${YELLOW}$(date)${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the application at ${HEALTH_URL}"
echo "2. Check logs: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd ${DEPLOY_PATH} && docker compose logs -f'"
echo "3. Monitor metrics in Grafana"
echo ""
