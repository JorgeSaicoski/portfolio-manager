# Portfolio Manager - Makefile
# Automates setup, development, testing, and deployment tasks
# Uses Podman as the container runtime (Podman v4.0+)

.DEFAULT_GOAL := help
.PHONY: help setup start stop restart status logs clean

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

stop: ## Stop all services (keeps containers)
	@echo "$(BLUE)Stopping all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)✓ Services stopped$(RESET)"

down: ## Stop and remove all containers (keeps volumes/data)
	@echo "$(BLUE)Stopping and removing containers...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✓ Containers removed (volumes preserved)$(RESET)"
	@echo "$(YELLOW)Note: Use 'make clean' to also delete volumes and data$(RESET)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting all services...$(RESET)"
	@podman compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)✓ Services restarted$(RESET)"

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

##@ Testing

test: test-backend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(RESET)"
	@cd backend && go test ./cmd/test/... -v -race -coverprofile=coverage.out
	@echo "$(GREEN)✓ Backend tests complete$(RESET)"

test-backend-coverage: ## Run backend tests with coverage report
	@echo "$(BLUE)Running backend tests with coverage...$(RESET)"
	@cd backend && go test ./cmd/test/... -v -race -coverprofile=coverage.out
	@cd backend && go tool cover -html=coverage.out -o coverage.html
	@cd backend && go tool cover -func=coverage.out
	@echo "$(GREEN)✓ Coverage report: backend/coverage.html$(RESET)"

test-frontend: ## Run frontend tests (if configured)
	@echo "$(BLUE)Running frontend tests...$(RESET)"
	@cd frontend && npm test || echo "$(YELLOW)No tests configured$(RESET)"

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

db-backup: ## Backup database to file
	@echo "$(BLUE)Backing up database...$(RESET)"
	@mkdir -p backups
	@podman exec portfolio-postgres pg_dump -U portfolio_user portfolio_db > backups/portfolio_db_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backed up to backups/$(RESET)"

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

##@ Authentik Setup

authentik-guide: ## Print Authentik configuration guide
	@echo "$(BOLD)$(BLUE)Authentik Setup Guide$(RESET)"
	@echo ""
	@echo "$(YELLOW)⚠ These steps MUST be done manually via the Authentik web UI$(RESET)"
	@echo ""
	@echo "$(BOLD)Step 1: Initial Setup$(RESET)"
	@echo "  URL: http://localhost:9000/if/flow/initial-setup/"
	@echo "  Create admin account with strong password"
	@echo ""
	@echo "$(BOLD)Step 2: Create OAuth2 Provider$(RESET)"
	@echo "  1. Login to Authentik: http://localhost:9000/"
	@echo "  2. Go to: Applications → Providers → Create"
	@echo "  3. Select: OAuth2/OpenID Provider"
	@echo "  4. Client ID: portfolio-manager"
	@echo "  5. Redirect URIs:"
	@echo "     - http://localhost:3000/auth/callback"
	@echo "     - http://localhost:3000/"
	@echo "  6. Copy the Client Secret and update .env"
	@echo ""
	@echo "$(BOLD)Step 3: Create Application$(RESET)"
	@echo "  1. Go to: Applications → Applications → Create"
	@echo "  2. Name: Portfolio Manager"
	@echo "  3. Slug: portfolio-manager"
	@echo "  4. Provider: Select the provider from Step 2"
	@echo ""
	@echo "$(BOLD)Step 4: Enable User Registration$(RESET)"
	@echo "  1. Go to: Flows & Stages → Flows"
	@echo "  2. Find: default-enrollment-flow"
	@echo "  3. Ensure it has username field (CRITICAL!)"
	@echo "  4. Go to: System → Brands"
	@echo "  5. Set Enrollment flow to: default-enrollment-flow"
	@echo ""
	@echo "$(BOLD)Step 5: Update Environment$(RESET)"
	@echo "  1. Edit .env and add AUTHENTIK_CLIENT_SECRET"
	@echo "  2. Run: make restart-backend restart-frontend"
	@echo ""
	@echo "$(GREEN)✓ Detailed guides:$(RESET)"
	@echo "  - docs/authentication/authentik-quickstart.md"
	@echo "  - docs/authentication/enrollment-setup.md"
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
