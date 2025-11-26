# Portfolio Manager - Makefile
# Automates setup, development, testing, and deployment tasks
# Uses Podman as the container runtime (Podman v4.0+)

.DEFAULT_GOAL := help
.PHONY: help setup start stop restart status logs clean complete-start complete-stop complete-restart complete-update complete-down clean-images

# Colors for terminal output
BOLD := \033[1m
RESET := \033[0m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RED := \033[31m

# Project configuration
PROJECT_NAME := portfolio-manager
COMPOSE_FILE := docker-compose.yml
ENV_FILE := .env
ENV_EXAMPLE := .env.example

# Detect container runtime (docker or podman)
CONTAINER_CMD := $(shell command -v podman 2>/dev/null || command -v docker 2>/dev/null)

# Service names
SERVICES := portfolio-postgres portfolio-redis portfolio-authentik-server portfolio-authentik-worker portfolio-backend portfolio-frontend

##@ General Commands

help: ## Display this help message
	@echo "$(BOLD)Portfolio Manager - Available Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Quick Start:$(RESET)"
	@echo "  1. make setup              # Initial setup (generates secrets, creates .env)"
	@echo "  2. make start              # Start all services"
	@echo "  3. make authentik-guide    # Follow Authentik configuration steps"
	@echo "  4. make verify-setup       # Verify everything is working"
	@echo ""
	@echo "$(BLUE)Complete Stack Commands:$(RESET)"
	@echo "  make complete-start        # Start everything (core + monitoring + DB UI)"
	@echo "  make complete-stop         # Stop everything"
	@echo "  make complete-update       # Rebuild and update all services"
	@echo "  make complete-restart      # Restart all services"
	@echo ""
	@echo "$(YELLOW)Documentation:$(RESET) See docs/MAKEFILE_GUIDE.md for detailed usage"

##@ Setup Commands

setup: check-podman create-env generate-secrets-info network-create ## Complete initial setup (run this first)
	@echo "$(BOLD)$(GREEN)✓ Setup complete!$(RESET)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(RESET)"
	@echo "  1. Review and update .env file with your configuration"
	@echo "  2. Run: make start"
	@echo "  3. Configure Authentik: make authentik-guide"
	@echo ""

check-podman: ## Check if Podman is installed
	@echo "$(BLUE)Checking for Podman...$(RESET)"
	@command -v podman >/dev/null 2>&1 || { echo "$(RED)ERROR: Podman is not installed. See docs/deployment/podman.md$(RESET)"; exit 1; }
	@echo "$(GREEN)✓ Podman found:$(RESET) $$(podman --version)"

create-env: ## Create .env file from template (interactive)
	@if [ -f "$(ENV_FILE)" ]; then \
		echo "$(YELLOW)⚠ .env file already exists$(RESET)"; \
		echo "Backing up to .env.backup"; \
		cp $(ENV_FILE) .env.backup; \
	fi
	@if [ ! -f "$(ENV_EXAMPLE)" ]; then \
		echo "$(RED)ERROR: .env.example not found$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating .env file from template...$(RESET)"
	@cp $(ENV_EXAMPLE) $(ENV_FILE)
	@echo "$(GREEN)✓ .env file created$(RESET)"
	@echo "$(YELLOW)⚠ Remember to update AUTHENTIK_CLIENT_SECRET after configuring Authentik$(RESET)"

generate-secrets: ## Generate and display secure secrets (does not modify .env)
	@echo "$(BOLD)Generated Secrets:$(RESET)"
	@echo ""
	@echo "$(GREEN)AUTHENTIK_SECRET_KEY:$(RESET)"
	@openssl rand -base64 60
	@echo ""
	@echo "$(GREEN)POSTGRES_PASSWORD:$(RESET)"
	@openssl rand -base64 32
	@echo ""
	@echo "$(GREEN)PROMETHEUS_AUTH_PASSWORD:$(RESET)"
	@openssl rand -base64 24
	@echo ""
	@echo "$(YELLOW)⚠ Copy these values to your .env file$(RESET)"

generate-secrets-info: ## Display information about generating secrets
	@echo "$(YELLOW)⚠ Generate secure secrets after setup:$(RESET)"
	@echo "  Run: make generate-secrets"
	@echo "  Then copy the values to your .env file"

network-create: ## Create Podman network for services
	@echo "$(BLUE)Creating Podman network...$(RESET)"
	@podman network exists portfolio-network || podman network create portfolio-network
	@echo "$(GREEN)✓ Network ready$(RESET)"

##@ Service Management

start: ## Start all services in detached mode
	@echo "$(BLUE)Starting all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✓ Services started$(RESET)"
	@echo ""
	@echo "$(YELLOW)Check status with:$(RESET) make status"
	@echo "$(YELLOW)View logs with:$(RESET) make logs"

complete-start: ## Start everything (core services + monitoring + database UI)
	@echo "$(BOLD)$(BLUE)Starting Complete Portfolio Manager Stack$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 1/3: Starting core services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✓ Core services started$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 2/3: Starting monitoring (Prometheus + Grafana)...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring up -d
	@echo "$(GREEN)✓ Monitoring services started$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 3/3: Starting database UI (Adminer)...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile db-ui up -d
	@echo "$(GREEN)✓ Database UI started$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN)✓ Complete stack is now running!$(RESET)"
	@echo ""
	@echo "$(BOLD)Access URLs:$(RESET)"
	@echo "  $(BLUE)Frontend:$(RESET)        http://localhost:3000"
	@echo "  $(BLUE)Backend API:$(RESET)     http://localhost:8000"
	@echo "  $(BLUE)Authentik:$(RESET)       http://localhost:9000"
	@echo "  $(BLUE)Prometheus:$(RESET)      http://localhost:9090"
	@echo "  $(BLUE)Grafana:$(RESET)         http://localhost:3001 (admin/admin)"
	@echo "  $(BLUE)Adminer (DB):$(RESET)    http://localhost:8080"
	@echo ""
	@echo "$(YELLOW)Useful commands:$(RESET)"
	@echo "  make status              # Check all services"
	@echo "  make complete-stop       # Stop everything"
	@echo "  make complete-update     # Update all services"

stop: ## Stop all services (keeps containers)
	@echo "$(BLUE)Stopping all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)✓ Services stopped$(RESET)"

complete-stop: ## Stop everything (all services + monitoring + database UI)
	@echo "$(BOLD)$(BLUE)Stopping Complete Portfolio Manager Stack$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 1/3: Stopping database UI...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile db-ui stop
	@echo "$(GREEN)✓ Database UI stopped$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 2/3: Stopping monitoring services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring stop
	@echo "$(GREEN)✓ Monitoring stopped$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 3/3: Stopping core services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)✓ Core services stopped$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN)✓ All services stopped!$(RESET)"
	@echo "$(YELLOW)Tip: Use 'make complete-start' to start everything again$(RESET)"

down: ## Stop and remove all containers (keeps volumes/data)
	@echo "$(BLUE)Stopping and removing containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✓ Containers removed (volumes preserved)$(RESET)"
	@echo "$(YELLOW)Note: Use 'make clean' to also delete volumes and data$(RESET)"

complete-down: ## Stop and remove everything (all profiles, keeps volumes/data)
	@echo "$(BOLD)$(BLUE)Removing Complete Portfolio Manager Stack$(RESET)"
	@echo ""
	@echo "$(YELLOW)Stopping and removing all containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring --profile db-ui down
	@echo "$(GREEN)✓ All containers removed (volumes preserved)$(RESET)"
	@echo ""
	@echo "$(YELLOW)Note: Data is preserved. Use 'make clean' to delete volumes too$(RESET)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)✓ Services restarted$(RESET)"

complete-restart: ## Restart everything (all services + monitoring + database UI)
	@echo "$(BOLD)$(BLUE)Restarting Complete Portfolio Manager Stack$(RESET)"
	@echo ""
	@echo "$(YELLOW)Restarting all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring --profile db-ui restart
	@echo ""
	@echo "$(BOLD)$(GREEN)✓ All services restarted!$(RESET)"

restart-backend: ## Restart only backend service
	@echo "$(BLUE)Restarting backend...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart portfolio-backend
	@echo "$(GREEN)✓ Backend restarted$(RESET)"

restart-frontend: ## Restart only frontend service
	@echo "$(BLUE)Restarting frontend...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart portfolio-frontend
	@echo "$(GREEN)✓ Frontend restarted$(RESET)"

restart-authentik: ## Restart Authentik services
	@echo "$(BLUE)Restarting Authentik...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart portfolio-authentik-server portfolio-authentik-worker
	@echo "$(GREEN)✓ Authentik restarted$(RESET)"

update: ## Rebuild and restart all services with latest code changes
	@echo "$(BLUE)Updating all services with latest code...$(RESET)"
	@echo "$(YELLOW)Step 1/3: Stopping containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down
	@echo "$(YELLOW)Step 2/3: Building images...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(YELLOW)Step 3/3: Starting services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✓ All services updated and running with latest code$(RESET)"

complete-update: ## Rebuild and restart everything with latest code changes
	@echo "$(BOLD)$(BLUE)Updating Complete Portfolio Manager Stack$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 1/3: Stopping all containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring --profile db-ui down
	@echo "$(GREEN)✓ Containers stopped$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 2/3: Building all images (this may take a while)...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring --profile db-ui build --no-cache
	@echo "$(GREEN)✓ Images built$(RESET)"
	@echo ""
	@echo "$(YELLOW)Step 3/3: Starting all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring --profile db-ui up -d
	@echo "$(GREEN)✓ Services started$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN)✓ Complete stack updated and running with latest code!$(RESET)"
	@echo ""
	@echo "$(BOLD)Access URLs:$(RESET)"
	@echo "  $(BLUE)Frontend:$(RESET)        http://localhost:3000"
	@echo "  $(BLUE)Backend API:$(RESET)     http://localhost:8000"
	@echo "  $(BLUE)Authentik:$(RESET)       http://localhost:9000"
	@echo "  $(BLUE)Prometheus:$(RESET)      http://localhost:9090"
	@echo "  $(BLUE)Grafana:$(RESET)         http://localhost:3001 (admin/admin)"
	@echo "  $(BLUE)Adminer (DB):$(RESET)    http://localhost:8080"

update-backend: ## Rebuild and restart backend with latest code
	@echo "$(BLUE)Updating backend with latest code...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down portfolio-backend
	@podman compose -f $(COMPOSE_FILE) build --no-cache portfolio-backend
	@podman compose -f $(COMPOSE_FILE) up -d portfolio-backend
	@echo "$(GREEN)✓ Backend updated$(RESET)"

update-frontend: ## Rebuild and restart frontend with latest code
	@echo "$(BLUE)Updating frontend with latest code...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down portfolio-frontend
	@podman compose -f $(COMPOSE_FILE) build --no-cache portfolio-frontend
	@podman compose -f $(COMPOSE_FILE) up -d portfolio-frontend
	@echo "$(GREEN)✓ Frontend updated$(RESET)"

status: ## Show status of all services
	@echo "$(BOLD)Service Status:$(RESET)"
	@podman compose -f $(COMPOSE_FILE) ps

logs: ## Show logs from all services (follow mode)
	@podman compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Show backend logs
	@podman compose -f $(COMPOSE_FILE) logs -f portfolio-backend

logs-frontend: ## Show frontend logs
	@podman compose -f $(COMPOSE_FILE) logs -f portfolio-frontend

logs-authentik: ## Show Authentik logs
	@podman compose -f $(COMPOSE_FILE) logs -f portfolio-authentik-server

logs-db: ## Show database logs
	@podman compose -f $(COMPOSE_FILE) logs -f portfolio-postgres

##@ Health & Verification

verify-setup: ## Verify all services are healthy
	@echo "$(BOLD)Verifying Service Health:$(RESET)"
	@echo ""
	@echo "$(BLUE)Frontend (http://localhost:3000):$(RESET)"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 || echo "$(RED)✗ Not accessible$(RESET)"
	@echo ""
	@echo "$(BLUE)Backend Health (http://localhost:8000/health):$(RESET)"
	@curl -s http://localhost:8000/health | grep -q "healthy" && echo "$(GREEN)✓ Healthy$(RESET)" || echo "$(RED)✗ Unhealthy$(RESET)"
	@echo ""
	@echo "$(BLUE)Authentik (http://localhost:9000):$(RESET)"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:9000 || echo "$(RED)✗ Not accessible$(RESET)"
	@echo ""
	@echo "$(BLUE)Database:$(RESET)"
	@podman exec portfolio-postgres pg_isready -U portfolio_user -d portfolio_db > /dev/null 2>&1 && echo "$(GREEN)✓ Connected$(RESET)" || echo "$(RED)✗ Not connected$(RESET)"

health: verify-setup ## Alias for verify-setup

##@ Development

dev-backend: ## Start backend in development mode (local, not containerized)
	@echo "$(BLUE)Starting backend in development mode...$(RESET)"
	@cd backend && go run cmd/main.go

dev-frontend: ## Start frontend in development mode (local, not containerized)
	@echo "$(BLUE)Starting frontend in development mode...$(RESET)"
	@cd frontend && npm run dev

build: ## Build all container images
	@echo "$(BLUE)Building container images...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build-backend: ## Build backend container image
	@echo "$(BLUE)Building backend image...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) build portfolio-backend
	@echo "$(GREEN)✓ Backend image built$(RESET)"

build-frontend: ## Build frontend container image
	@echo "$(BLUE)Building frontend image...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) build portfolio-frontend
	@echo "$(GREEN)✓ Frontend image built$(RESET)"

##@ Audit Logs

audit-logs: ## View all audit logs in real-time (tail -f)
	@if [ -z "$(CONTAINER_CMD)" ]; then \
		echo "$(RED)Error: Neither docker nor podman found in PATH$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Tailing all audit logs... (Ctrl+C to exit)$(RESET)"
	@$(CONTAINER_CMD) exec portfolio-backend sh -c "tail -f /app/audit/create.log /app/audit/update.log /app/audit/delete.log" 2>/dev/null || echo "$(YELLOW)No audit logs found yet$(RESET)"

audit-export: ## Export audit and error logs to backend/audit-export/
	@if [ -z "$(CONTAINER_CMD)" ]; then \
		echo "$(RED)Error: Neither docker nor podman found in PATH$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Exporting audit and error logs...$(RESET)"
	@rm -rf backend/audit-export
	@mkdir -p backend/audit-export/audit backend/audit-export/errors
	@$(CONTAINER_CMD) cp portfolio-backend:/app/audit/. backend/audit-export/audit/ 2>&1 | grep -v "Error" || true
	@$(CONTAINER_CMD) cp portfolio-backend:/app/errors/. backend/audit-export/errors/ 2>&1 | grep -v "Error" || true
	@if [ -d backend/audit-export ] && [ -n "$$(ls -A backend/audit-export)" ]; then \
		echo "$(GREEN)✓ Logs exported to backend/audit-export/$(RESET)"; \
		echo ""; \
		echo "Audit logs:"; \
		ls -lh backend/audit-export/audit/ 2>/dev/null || echo "  (none)"; \
		echo ""; \
		echo "Error logs:"; \
		ls -lh backend/audit-export/errors/ 2>/dev/null || echo "  (none)"; \
	else \
		echo "$(YELLOW)Failed to export logs$(RESET)"; \
	fi

audit-view-create: ## View last 50 create operation logs
	@if [ -z "$(CONTAINER_CMD)" ]; then \
		echo "$(RED)Error: Neither docker nor podman found in PATH$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Last 50 CREATE operations:$(RESET)"
	@$(CONTAINER_CMD) exec portfolio-backend cat /app/audit/create.log 2>/dev/null | tail -50 || echo "$(YELLOW)No create logs found yet$(RESET)"

audit-view-delete: ## View last 50 delete operation logs
	@if [ -z "$(CONTAINER_CMD)" ]; then \
		echo "$(RED)Error: Neither docker nor podman found in PATH$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Last 50 DELETE operations:$(RESET)"
	@$(CONTAINER_CMD) exec portfolio-backend cat /app/audit/delete.log 2>/dev/null | tail -50 || echo "$(YELLOW)No delete logs found yet$(RESET)"

audit-view-update: ## View last 50 update operation logs
	@if [ -z "$(CONTAINER_CMD)" ]; then \
		echo "$(RED)Error: Neither docker nor podman found in PATH$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Last 50 UPDATE operations:$(RESET)"
	@$(CONTAINER_CMD) exec portfolio-backend cat /app/audit/update.log 2>/dev/null | tail -50 || echo "$(YELLOW)No update logs found yet$(RESET)"

##@ Testing

test: test-backend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(RESET)"
	@mkdir -p backend/audit
	@cd backend && go test ./cmd/test/... -v -race -coverprofile=audit/coverage.out
	@echo "$(GREEN)✓ Backend tests complete$(RESET)"

test-backend-coverage: ## Run backend tests with coverage report
	@echo "$(BLUE)Running backend tests with coverage...$(RESET)"
	@mkdir -p backend/audit
	@cd backend && go test ./cmd/test/... -v -race -coverprofile=audit/coverage.out
	@cd backend && go tool cover -html=audit/coverage.out -o audit/coverage.html
	@cd backend && go tool cover -func=audit/coverage.out
	@echo "$(GREEN)✓ Coverage report: backend/audit/coverage.html$(RESET)"

test-frontend: ## Run frontend tests (if configured)
	@echo "$(BLUE)Running frontend tests...$(RESET)"
	@cd frontend && npm test || echo "$(YELLOW)No tests configured$(RESET)"

test-fail-logs: ## Run tests, save full output to file, and show failures
	@echo "$(BLUE)Running tests and saving output...$(RESET)"
	@mkdir -p backend/audit
	@cd backend && go test ./cmd/test/... -v -race -coverprofile=audit/coverage.out 2>&1 | tee audit/test-output.txt
	@echo ""
	@echo "$(BLUE)Extracting failures...$(RESET)"
	@grep -E "(FAIL|Error:|Expected|Actual)" backend/audit/test-output.txt || echo "$(GREEN)No test failures found$(RESET)"
	@echo ""
	@echo "$(YELLOW)Full test output saved to: backend/audit/test-output.txt$(RESET)"

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run backend linter
	@echo "$(BLUE)Running backend linter...$(RESET)"
	@cd backend && go fmt ./...
	@cd backend && go vet ./...
	@echo "$(GREEN)✓ Backend linting complete$(RESET)"

lint-frontend: ## Run frontend linter
	@echo "$(BLUE)Running frontend linter...$(RESET)"
	@cd frontend && npm run lint || echo "$(YELLOW)Linter not configured$(RESET)"

##@ Database

db-create-test: ## Create test database (portfolio_test_db)
	@echo "$(BLUE)Creating test database...$(RESET)"
	@podman exec portfolio-postgres psql -U portfolio_user -d postgres -c "CREATE DATABASE portfolio_test_db OWNER portfolio_user;" 2>/dev/null || echo "$(YELLOW)Database already exists or connection failed$(RESET)"
	@echo "$(GREEN)✓ Test database ready$(RESET)"

db-migrate: ## Run database migrations (automatic on backend start)
	@echo "$(BLUE)Running database migrations...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart portfolio-backend
	@echo "$(GREEN)✓ Migrations run on backend startup$(RESET)"

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)WARNING: This will delete ALL data!$(RESET)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE)Resetting database...$(RESET)"; \
		podman compose -f $(COMPOSE_FILE) down -v; \
		podman compose -f $(COMPOSE_FILE) up -d portfolio-postgres; \
		sleep 5; \
		podman compose -f $(COMPOSE_FILE) up -d; \
		echo "$(GREEN)✓ Database reset complete$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled$(RESET)"; \
	fi

db-backup: ## Backup database with compression and retention (recommended)
	@./scripts/backup.sh

db-backup-simple: ## Simple backup to SQL file (old method)
	@echo "$(BLUE)Backing up database...$(RESET)"
	@mkdir -p backups
	@podman exec portfolio-postgres pg_dump -U portfolio_user portfolio_db > backups/portfolio_db_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backed up to backups/$(RESET)"

db-restore: ## Restore database from backup (usage: make db-restore BACKUP=timestamp)
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)Error: Please specify BACKUP=timestamp$(RESET)"; \
		echo "Example: make db-restore BACKUP=20250123_140530"; \
		echo "Or use: make db-restore BACKUP=latest"; \
		echo ""; \
		echo "Available backups:"; \
		./scripts/list-backups.sh; \
		exit 1; \
	fi
	@./scripts/restore.sh $(BACKUP)

db-list-backups: ## List all available database backups
	@./scripts/list-backups.sh

##@ Database UI

db-ui-start: ## Start Adminer database UI (http://localhost:8080)
	@echo "$(BLUE)Starting Adminer database UI...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile db-ui up -d
	@echo "$(GREEN)✓ Adminer started$(RESET)"
	@echo ""
	@echo "$(BOLD)Access Adminer:$(RESET)"
	@echo "  URL: $(BLUE)http://localhost:8080$(RESET)"
	@echo ""
	@echo "$(BOLD)Database Credentials:$(RESET)"
	@echo "  System: PostgreSQL"
	@echo "  Server: portfolio-postgres"
	@echo "  Username: portfolio_user"
	@echo "  Password: (from your .env file)"
	@echo "  Database: portfolio_db (or authentik)"
	@echo ""
	@echo "$(YELLOW)Quick Access:$(RESET) make db-ui-open"

db-ui-stop: ## Stop Adminer database UI
	@echo "$(BLUE)Stopping Adminer...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile db-ui down
	@echo "$(GREEN)✓ Adminer stopped$(RESET)"

db-ui-open: ## Open Adminer in browser
	@echo "$(BLUE)Opening Adminer in browser...$(RESET)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:8080 || \
	command -v open >/dev/null 2>&1 && open http://localhost:8080 || \
	echo "$(YELLOW)Please open manually: http://localhost:8080$(RESET)"

db-ui-restart: ## Restart Adminer
	@echo "$(BLUE)Restarting Adminer...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile db-ui restart adminer
	@echo "$(GREEN)✓ Adminer restarted$(RESET)"

##@ Monitoring

monitoring-start: ## Start Prometheus and Grafana
	@echo "$(BLUE)Starting monitoring services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring up -d
	@echo "$(GREEN)✓ Monitoring started$(RESET)"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001 (admin/admin)"

monitoring-stop: ## Stop Prometheus and Grafana
	@echo "$(BLUE)Stopping monitoring services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring down
	@echo "$(GREEN)✓ Monitoring stopped$(RESET)"

monitoring-update: ## Rebuild and restart monitoring services with latest changes
	@echo "$(BLUE)Updating monitoring services...$(RESET)"
	@echo "$(YELLOW)Step 1/3: Stopping containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring down
	@echo "$(YELLOW)Step 2/3: Building images...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring build --no-cache
	@echo "$(YELLOW)Step 3/3: Starting services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) --profile monitoring up -d
	@echo "$(GREEN)✓ Monitoring updated$(RESET)"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001 (admin/admin)"

##@ Authentik Setup

authentik-guide: ## Print Authentik configuration guide
	@echo "$(BOLD)$(BLUE)Authentik Setup Guide$(RESET)"
	@echo ""
	@echo "$(YELLOW)⚠ These steps MUST be done manually via the Authentik web UI$(RESET)"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "$(BOLD)Step 1: Initial Setup$(RESET)"
	@echo "  URL: http://localhost:9000/if/flow/initial-setup/"
	@echo "  • Create the admin account with a strong password"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 2: Create OAuth2 Provider$(RESET)"
	@echo "  1. Log in to Authentik: http://localhost:9000/"
	@echo "  2. Go to: Applications → Providers → Create"
	@echo "  3. Select: OAuth2/OpenID Provider"
	@echo "  4. Configuration:"
	@echo "     $(RED)$(BOLD)CRITICAL:$(RESET) $(BOLD)Client Type: Public$(RESET) (NOT Confidential!)"
	@echo "     • Client ID: portfolio-manager"
	@echo "     • Redirect URIs:"
	@echo "       - http://localhost:3000/auth/callback"
	@echo "       - http://localhost:3000/"
	@echo "  5. Copy the Client Secret and save it for Step 8"
	@echo ""
	@echo "  $(YELLOW)⚠ Why Public?$(RESET) Browser-based apps must use 'Public' client type"
	@echo "  with PKCE security. 'Confidential' causes 'Client ID Error'."
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 3: Create Application$(RESET)"
	@echo "  1. Go to: Applications → Applications → Create"
	@echo "  2. Configuration:"
	@echo "     • Name: Portfolio Manager"
	@echo "     • Slug: portfolio-manager"
	@echo "     • Provider: Select the provider created in Step 2"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 4: Create Registration Prompts$(RESET)"
	@echo "  1. Go to: Flows & Stages → Prompts"
	@echo "  2. Click 'Create' and add these fields (mark all as Required):"
	@echo "     • Field Key: username   | Type: Text       | Label: Username"
	@echo "     • Field Key: email      | Type: Email      | Label: Email"
	@echo "     • Field Key: name       | Type: Text       | Label: Full Name"
	@echo "     • Field Key: password   | Type: Password   | Label: Password"
	@echo "  3. Save each prompt individually"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 5: Create Prompt Stage$(RESET)"
	@echo "  1. Go to: Flows & Stages → Stages → Create"
	@echo "  2. Select: Prompt Stage"
	@echo "  3. Configuration:"
	@echo "     • Name: enrollment-prompt"
	@echo "     • Fields: Select all 4 prompts created in Step 4"
	@echo "  4. Save the stage"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 6: Create or Edit Enrollment Flow$(RESET)"
	@echo "  1. Go to: Flows & Stages → Flows"
	@echo "  2. Find 'portfolio-enrollment' or create new flow:"
	@echo "     • Name: portfolio-enrollment"
	@echo "     • Title: Create your Portfolio Manager account"
	@echo "     • Slug: portfolio-enrollment"
	@echo "     • Designation: Enrollment"
	@echo "  3. Click on the flow to open it"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 7: Bind Stages to Enrollment Flow$(RESET)"
	@echo "  1. Open the 'Stage Bindings' tab in your enrollment flow"
	@echo "  2. Click 'Bind stage' and add these stages IN ORDER:"
	@echo ""
	@echo "     $(BOLD)Stage 1: Prompt Stage$(RESET)"
	@echo "     • Select: enrollment-prompt (created in Step 5)"
	@echo "     • Order: 10"
	@echo ""
	@echo "     $(BOLD)Stage 2: User Write Stage$(RESET)"
	@echo "     • Select: default-source-enrollment-write (or create new User Write Stage)"
	@echo "     • Enable: 'Can create users'"
	@echo "     • Optional: Add default group in 'Groups' field (e.g., 'users')"
	@echo "     • Order: 20"
	@echo ""
	@echo "     $(BOLD)Stage 3: User Login Stage$(RESET)"
	@echo "     • Select: default-source-enrollment-login (or create new User Login Stage)"
	@echo "     • Session duration: Configure as needed"
	@echo "     • Order: 30"
	@echo ""
	@echo "  3. Save all bindings"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 8: Connect Flow to Brand$(RESET)"
	@echo "  1. Go to: System → Brands"
	@echo "  2. Select your brand (usually 'authentik Default')"
	@echo "  3. Set 'Enrollment flow' to: portfolio-enrollment"
	@echo "  4. Save changes"
	@echo ""
	@echo "  $(GREEN)✓ Automatic Feature:$(RESET) When enrollment flow is configured,"
	@echo "  Authentik's login page will automatically show a '$(BOLD)Sign Up$(RESET)' link!"
	@echo "  Users can click this link to register without leaving Authentik."
	@echo ""
	@echo "  $(YELLOW)⚠ If 'Sign up' link doesn't appear:$(RESET)"
	@echo "  → Verify flow designation is 'Enrollment' (Flows & Stages → Flows)"
	@echo "  → Check brand enrollment flow is set (System → Brands)"
	@echo "  → Users can still register via homepage '$(BOLD)Sign Up$(RESET)' button!"
	@echo ""
	@echo "────────────────────────────────────────────────────────────────"
	@echo ""
	@echo "$(BOLD)Step 9: Update Environment and Restart$(RESET)"
	@echo "  1. Edit your .env file:"
	@echo "     AUTHENTIK_CLIENT_SECRET=<secret-from-step-2>"
	@echo "  2. Restart services:"
	@echo "     make restart-backend restart-frontend"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "$(BOLD)$(GREEN)✓ Setup Complete!$(RESET)"
	@echo ""
	@echo "$(BOLD)Test Your Setup:$(RESET)"
	@echo "  1. Open: http://localhost:3000"
	@echo "  2. Click '$(BOLD)Sign In$(RESET)' or '$(BOLD)Sign Up$(RESET)' button on homepage"
	@echo "  3. $(YELLOW)For Sign In:$(RESET) Authentik login page will show"
	@echo "     → Notice the '$(BOLD)Sign up$(RESET)' link at bottom (automatic!)"
	@echo "     → Existing users can login"
	@echo "  4. $(YELLOW)For Sign Up:$(RESET) Goes directly to Authentik enrollment"
	@echo "     → Fill in username, email, password, name"
	@echo "     → Submit to create account"
	@echo "  5. You should be automatically logged in after registration"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Common Issues & Solutions:$(RESET)"
	@echo ""
	@echo "  $(BOLD)Issue: 'Client ID Error' - client_id is missing or invalid$(RESET)"
	@echo "  → Solution: Set Client Type to 'Public' (NOT 'Confidential')"
	@echo "  → Location: Step 2, Applications → Providers → Edit Provider"
	@echo "  → Why: Browser apps require Public client type with PKCE security"
	@echo ""
	@echo "  $(BOLD)Issue: 'Aborting write to empty username'$(RESET)"
	@echo "  → Solution: Ensure 'username' prompt exists with Field Key exactly 'username'"
	@echo "  → Location: Step 4, verify the prompt was created correctly"
	@echo ""
	@echo "  $(BOLD)Issue: 'No stages bound to flow'$(RESET)"
	@echo "  → Solution: Complete Step 7, you must bind at least 3 stages"
	@echo "  → Check: Flow → Stage Bindings tab shows all 3 stages"
	@echo ""
	@echo "  $(BOLD)Issue: Users can't access the application$(RESET)"
	@echo "  → Solution: Add users to a group with proper permissions"
	@echo "  → Location: Step 7, Stage 2 - add 'users' group to User Write Stage"
	@echo ""
	@echo "  $(BOLD)Issue: Registration form doesn't show all fields$(RESET)"
	@echo "  → Solution: Check that all 4 prompts are added to the Prompt Stage"
	@echo "  → Location: Step 5, edit the prompt stage and verify fields"
	@echo ""
	@echo "  $(BOLD)Issue: OAuth redirect fails$(RESET)"
	@echo "  → Solution: Verify redirect URIs match exactly (including http:// and port)"
	@echo "  → Location: Step 2, check Provider → Redirect URIs"
	@echo ""
	@echo "  $(BOLD)Note: Users can access Authentik user interface$(RESET)"
	@echo "  → Normal users can view their account settings and active sessions"
	@echo "  → This is a built-in Authentik feature for user self-service"
	@echo "  → Users can logout from different devices via Sessions tab"
	@echo "  → To restrict access, use a reverse proxy or custom authentication policy"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "$(BOLD)$(BLUE)Additional Resources:$(RESET)"
	@echo "  • Detailed guides:"
	@echo "    - docs/authentication/authentik-quickstart.md"
	@echo "    - docs/authentication/enrollment-setup.md"
	@echo "  • Official Authentik documentation:"
	@echo "    - https://docs.goauthentik.io/docs/flows/"
	@echo "    - https://docs.goauthentik.io/docs/providers/oauth2/"
	@echo ""
	@echo "$(BOLD)$(BLUE)Optional Enhancements:$(RESET)"
	@echo "  • Create custom groups for role-based access control"
	@echo "  • Add email verification stage to enrollment flow"
	@echo "  • Configure password policies and complexity requirements"
	@echo "  • Set up multi-factor authentication (MFA)"
	@echo ""


open-authentik: ## Open Authentik URLs in browser
	@echo "$(BLUE)Opening Authentik URLs...$(RESET)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:9000 || \
	command -v open >/dev/null 2>&1 && open http://localhost:9000 || \
	echo "$(YELLOW)Please open manually: http://localhost:9000$(RESET)"

open-app: ## Open application in browser
	@echo "$(BLUE)Opening Portfolio Manager...$(RESET)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000 || \
	command -v open >/dev/null 2>&1 && open http://localhost:3000 || \
	echo "$(YELLOW)Please open manually: http://localhost:3000$(RESET)"

##@ Cleanup

clean: ## Stop and remove all containers and volumes (WARNING: deletes data)
	@echo "$(RED)WARNING: This will delete ALL containers, volumes, and data!$(RESET)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE)Cleaning up...$(RESET)"; \
		podman compose -f $(COMPOSE_FILE) down -v; \
		podman volume prune -f; \
		echo "$(GREEN)✓ Cleanup complete$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled$(RESET)"; \
	fi

clean-build: ## Remove built images
	@echo "$(BLUE)Removing built images...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down --rmi local
	@echo "$(GREEN)✓ Images removed$(RESET)"

clean-logs: ## Clear all container logs
	@echo "$(BLUE)Clearing container logs...$(RESET)"
	@for container in $(SERVICES); do \
		podman logs --tail 0 $$container 2>/dev/null || true; \
	done
	@echo "$(GREEN)✓ Logs cleared$(RESET)"

clean-images: ## Remove orphaned uploaded images
	@echo "$(BLUE)Cleaning up orphaned images...$(RESET)"
	@./scripts/cleanup-images.sh

##@ Information

version: ## Show version information
	@echo "$(BOLD)Version Information:$(RESET)"
	@echo "Podman: $$(podman --version)"
	@echo "Go: $$(go version 2>/dev/null || echo 'Not installed')"
	@echo "Node: $$(node --version 2>/dev/null || echo 'Not installed')"
	@echo "npm: $$(npm --version 2>/dev/null || echo 'Not installed')"

env-check: ## Validate .env configuration
	@echo "$(BOLD)Checking .env configuration:$(RESET)"
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)✗ .env file not found$(RESET)"; \
		echo "  Run: make create-env"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ .env file exists$(RESET)"
	@grep -q "AUTHENTIK_SECRET_KEY=.*[A-Za-z0-9]" $(ENV_FILE) && echo "$(GREEN)✓ AUTHENTIK_SECRET_KEY set$(RESET)" || echo "$(YELLOW)⚠ AUTHENTIK_SECRET_KEY needs to be generated$(RESET)"
	@grep -q "AUTHENTIK_CLIENT_SECRET=.*[A-Za-z0-9]" $(ENV_FILE) && echo "$(GREEN)✓ AUTHENTIK_CLIENT_SECRET set$(RESET)" || echo "$(YELLOW)⚠ AUTHENTIK_CLIENT_SECRET needs to be set after Authentik setup$(RESET)"
	@grep -q "POSTGRES_PASSWORD=.*[A-Za-z0-9]" $(ENV_FILE) && echo "$(GREEN)✓ POSTGRES_PASSWORD set$(RESET)" || echo "$(YELLOW)⚠ POSTGRES_PASSWORD should be changed$(RESET)"

urls: ## Show all service URLs
	@echo "$(BOLD)Service URLs:$(RESET)"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend:     http://localhost:8000"
	@echo "  API Health:  http://localhost:8000/health"
	@echo "  Authentik:   http://localhost:9000"
	@echo "  Prometheus:  http://localhost:9090 (if monitoring enabled)"
	@echo "  Grafana:     http://localhost:3001 (if monitoring enabled)"

verify-config: ## Verify setup configuration and diagnose issues
	@echo "$(BOLD)$(BLUE)Portfolio Manager Setup Verification$(RESET)"
	@echo ""
	@echo "$(BOLD)Checking Environment Files...$(RESET)"
	@if [ -f "$(ENV_FILE)" ]; then \
		echo "$(GREEN)✓ Root .env file exists$(RESET)"; \
	else \
		echo "$(RED)✗ Root .env file missing$(RESET)"; \
		echo "  Fix: make create-env"; \
		exit 1; \
	fi
	@if [ -f "frontend/.env" ]; then \
		echo "$(GREEN)✓ Frontend .env file exists$(RESET)"; \
	else \
		echo "$(RED)✗ Frontend .env file missing$(RESET)"; \
		echo "  Fix: cp frontend/.env.example frontend/.env"; \
		echo "  Then restart frontend: cd frontend && npm run dev"; \
	fi
	@echo ""
	@echo "$(BOLD)Checking Configuration Values...$(RESET)"
	@if grep -q "AUTHENTIK_CLIENT_SECRET=your-client-secret-from-authentik" $(ENV_FILE) 2>/dev/null; then \
		echo "$(RED)✗ AUTHENTIK_CLIENT_SECRET is still placeholder$(RESET)"; \
		echo "  Action Required:"; \
		echo "  1. Create OAuth2 provider in Authentik (Applications → Providers)"; \
		echo "  2. Copy the Client Secret"; \
		echo "  3. Update .env with real secret"; \
		echo "  4. Restart backend: make restart-backend"; \
	else \
		echo "$(GREEN)✓ AUTHENTIK_CLIENT_SECRET is configured$(RESET)"; \
	fi
	@if grep -q "AUTHENTIK_SECRET_KEY=change-me" $(ENV_FILE) 2>/dev/null; then \
		echo "$(YELLOW)⚠ AUTHENTIK_SECRET_KEY is default value$(RESET)"; \
		echo "  Recommendation: make generate-secrets"; \
	else \
		echo "$(GREEN)✓ AUTHENTIK_SECRET_KEY is set$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)Checking Services...$(RESET)"
	@if command -v curl >/dev/null 2>&1; then \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/-/health/live/ | grep -q "204\|301\|302"; then \
			echo "$(GREEN)✓ Authentik is running and accessible$(RESET)"; \
		else \
			echo "$(RED)✗ Authentik is not accessible$(RESET)"; \
			echo "  Fix: make start (or docker/podman compose up -d)"; \
		fi; \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then \
			echo "$(GREEN)✓ Backend is running and healthy$(RESET)"; \
		else \
			echo "$(YELLOW)⚠ Backend is not accessible$(RESET)"; \
			echo "  Fix: make start-backend"; \
		fi; \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then \
			echo "$(GREEN)✓ Frontend is running$(RESET)"; \
		else \
			echo "$(YELLOW)⚠ Frontend is not accessible$(RESET)"; \
			echo "  Fix: cd frontend && npm run dev"; \
		fi; \
	else \
		echo "$(YELLOW)⚠ curl not found, skipping service checks$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)Common Issues Checklist:$(RESET)"
	@echo "  $(YELLOW)Cannot login?$(RESET)"
	@echo "    → Check: OAuth2 provider created in Authentik"
	@echo "    → Check: Client ID = 'portfolio-manager'"
	@echo "    → Check: Redirect URI = 'http://localhost:3000/auth/callback'"
	@echo "    → Check: AUTHENTIK_CLIENT_SECRET in .env is real (not placeholder)"
	@echo "    → Check: Frontend .env file exists with correct values"
	@echo ""
	@echo "  $(YELLOW)User registration not working?$(RESET)"
	@echo "    → Check: Enrollment flow configured (make authentik-guide)"
	@echo "    → Check: Username field added to prompt stage"
	@echo "    → Check: Users auto-assigned to 'users' group"
	@echo ""
	@echo "$(BOLD)Next Steps:$(RESET)"
	@echo "  1. If services not running: make start"
	@echo "  2. If Authentik not configured: make authentik-guide"
	@echo "  3. If frontend .env missing: cp frontend/.env.example frontend/.env"
	@echo "  4. Test login: Open http://localhost:3000/auth/login"
	@echo ""

##@ CI/CD Commands

ci-test: ## Run all tests (CI mode)
	@echo "$(BOLD)$(BLUE)Running CI Tests$(RESET)"
	@echo "$(YELLOW)Running backend tests...$(RESET)"
	@cd backend && go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
	@echo "$(GREEN)✓ Backend tests passed$(RESET)"
	@echo ""
	@echo "$(YELLOW)Running frontend type checking...$(RESET)"
	@cd frontend && npm run check
	@echo "$(GREEN)✓ Type checking passed$(RESET)"
	@echo ""

ci-lint: ## Run all linters (CI mode)
	@echo "$(BOLD)$(BLUE)Running Linters$(RESET)"
	@echo "$(YELLOW)Running backend linter...$(RESET)"
	@cd backend && golangci-lint run --timeout=5m
	@echo "$(GREEN)✓ Backend linting passed$(RESET)"
	@echo ""

ci-security: ## Run security scans (CI mode)
	@echo "$(BOLD)$(BLUE)Running Security Scans$(RESET)"
	@echo "$(YELLOW)Running Gosec...$(RESET)"
	@cd backend && gosec -fmt=json -out=gosec-report.json ./...
	@echo "$(GREEN)✓ Security scan complete$(RESET)"
	@echo ""

ci-coverage: ## Generate test coverage report
	@echo "$(BOLD)$(BLUE)Generating Coverage Report$(RESET)"
	@cd backend && go test -coverprofile=coverage.out ./...
	@cd backend && go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)✓ Coverage report generated: backend/coverage.html$(RESET)"

docker-build: ## Build Docker images locally
	@echo "$(BOLD)$(BLUE)Building Docker Images$(RESET)"
	@echo "$(YELLOW)Building backend image...$(RESET)"
	@docker build -t portfolio-manager-backend:local ./backend
	@echo "$(GREEN)✓ Backend image built$(RESET)"
	@echo "$(YELLOW)Building frontend image...$(RESET)"
	@docker build -t portfolio-manager-frontend:local ./frontend
	@echo "$(GREEN)✓ Frontend image built$(RESET)"
	@echo ""

docker-push: ## Push Docker images to registry (requires REGISTRY env var)
	@if [ -z "$(REGISTRY)" ]; then \
		echo "$(RED)Error: REGISTRY environment variable not set$(RESET)"; \
		echo "Usage: REGISTRY=ghcr.io/username make docker-push"; \
		exit 1; \
	fi
	@echo "$(BOLD)$(BLUE)Pushing to $(REGISTRY)$(RESET)"
	@docker tag portfolio-manager-backend:local $(REGISTRY)/portfolio-manager-backend:latest
	@docker tag portfolio-manager-frontend:local $(REGISTRY)/portfolio-manager-frontend:latest
	@docker push $(REGISTRY)/portfolio-manager-backend:latest
	@docker push $(REGISTRY)/portfolio-manager-frontend:latest
	@echo "$(GREEN)✓ Images pushed to registry$(RESET)"

deploy-staging: ## Deploy to staging server
	@echo "$(BOLD)$(BLUE)Deploying to Staging$(RESET)"
	@if [ -z "$(STAGING_HOST)" ]; then \
		echo "$(RED)Error: STAGING_HOST environment variable not set$(RESET)"; \
		exit 1; \
	fi
	@./scripts/deploy.sh staging
	@echo "$(GREEN)✓ Deployed to staging$(RESET)"

deploy-production: ## Deploy to production server (requires confirmation)
	@echo "$(BOLD)$(YELLOW)⚠️  WARNING: Deploying to PRODUCTION$(RESET)"
	@if [ -z "$(PRODUCTION_HOST)" ]; then \
		echo "$(RED)Error: PRODUCTION_HOST environment variable not set$(RESET)"; \
		exit 1; \
	fi
	@./scripts/deploy.sh production
	@echo "$(GREEN)✓ Deployed to production$(RESET)"

setup-vultr-staging: ## Setup Vultr server for staging
	@echo "$(BOLD)$(BLUE)Setting up Vultr Staging Server$(RESET)"
	@if [ -z "$(STAGING_HOST)" ]; then \
		echo "$(RED)Error: STAGING_HOST environment variable not set$(RESET)"; \
		exit 1; \
	fi
	@scp scripts/setup-vultr-server.sh root@$(STAGING_HOST):/tmp/
	@ssh root@$(STAGING_HOST) "bash /tmp/setup-vultr-server.sh staging"
	@echo "$(GREEN)✓ Staging server setup complete$(RESET)"

setup-vultr-production: ## Setup Vultr server for production
	@echo "$(BOLD)$(BLUE)Setting up Vultr Production Server$(RESET)"
	@if [ -z "$(PRODUCTION_HOST)" ]; then \
		echo "$(RED)Error: PRODUCTION_HOST environment variable not set$(RESET)"; \
		exit 1; \
	fi
	@scp scripts/setup-vultr-server.sh root@$(PRODUCTION_HOST):/tmp/
	@ssh root@$(PRODUCTION_HOST) "bash /tmp/setup-vultr-server.sh production"
	@echo "$(GREEN)✓ Production server setup complete$(RESET)"

ci-all: ci-lint ci-test ci-security ci-coverage ## Run all CI checks
	@echo "$(BOLD)$(GREEN)✓ All CI checks passed!$(RESET)"


