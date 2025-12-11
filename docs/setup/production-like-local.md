# Production-like Local Setup

Run Portfolio Manager locally with production-like settings including HTTPS, custom domain, and production configuration. This setup helps you catch production issues during development and test production configurations before deploying.

## Table of Contents

- [When to Use This Mode](#when-to-use-this-mode)
- [Prerequisites](#prerequisites)
- [Setup Steps](#setup-steps)
  - [1. TLS Certificate Setup](#1-tls-certificate-setup)
  - [2. Local Domain Configuration](#2-local-domain-configuration)
  - [3. Production Environment Configuration](#3-production-environment-configuration)
  - [4. Reverse Proxy Setup](#4-reverse-proxy-setup)
  - [5. Authentik Production Configuration](#5-authentik-production-configuration)
  - [6. Start Services](#6-start-services)
- [Verification](#verification)
- [Differences from Quick Dev](#differences-from-quick-dev)
- [Troubleshooting](#troubleshooting)

---

## When to Use This Mode

Use production-like local setup when you need to:

- **Test production configurations** locally before deploying
- **Debug HTTPS-related issues** (mixed content, secure cookies, CSP)
- **Test with production-like security settings** (CORS, HSTS, CSP headers)
- **Validate deployment configurations** without touching production
- **Test OAuth flows** with production-like URLs
- **Develop features** that require HTTPS (webcam, geolocation, service workers)

## Prerequisites

- Completed [Quick Dev Setup](local-development.md#quick-dev-minimal-setup) at least once
- Basic understanding of TLS/SSL certificates
- Admin/sudo access on your machine
- **mkcert** (recommended) or **openssl** for generating certificates

### Install mkcert (Recommended)

mkcert creates locally-trusted development certificates automatically.

**macOS:**
```bash
brew install mkcert
mkcert -install
```

**Linux:**
```bash
# Install certutil first (needed by mkcert)
sudo apt install libnss3-tools  # Debian/Ubuntu
# OR
sudo yum install nss-tools      # Fedora/RHEL

# Install mkcert
brew install mkcert  # If using Homebrew on Linux
# OR download from: https://github.com/FiloSottile/mkcert/releases

mkcert -install
```

**Windows:**
```powershell
choco install mkcert
mkcert -install
```

---

## Setup Steps

### 1. TLS Certificate Setup

Choose between **mkcert** (easier, recommended) or **self-signed certificates** (manual).

#### Option A: Using mkcert (Recommended)

```bash
cd /path/to/portfolio-manager

# Create certs directory
mkdir -p certs

# Generate certificates for your local domains
mkcert -cert-file certs/portfolio.local.crt \
       -key-file certs/portfolio.local.key \
       portfolio.local \
       "*.portfolio.local" \
       localhost \
       127.0.0.1 \
       ::1

# Verify certificates were created
ls -la certs/
# Should show:
# portfolio.local.crt
# portfolio.local.key
```

#### Option B: Using Self-Signed Certificates (Manual)

```bash
cd /path/to/portfolio-manager
mkdir -p certs

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/portfolio.local.key \
  -out certs/portfolio.local.crt \
  -subj "/CN=portfolio.local" \
  -addext "subjectAltName=DNS:portfolio.local,DNS:*.portfolio.local,DNS:localhost"

# Trust the certificate (macOS)
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/portfolio.local.crt

# Trust the certificate (Linux)
sudo cp certs/portfolio.local.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Trust the certificate (Windows)
# Import certs/portfolio.local.crt to "Trusted Root Certification Authorities" via certmgr.msc
```

### 2. Local Domain Configuration

Add local domain entries to `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows).

```bash
# Edit hosts file (requires sudo)
sudo nano /etc/hosts
```

Add these entries:

```
127.0.0.1   portfolio.local
127.0.0.1   auth.portfolio.local
127.0.0.1   api.portfolio.local
127.0.0.1   grafana.portfolio.local
```

Save and exit (Ctrl+X, Y, Enter).

**Verify DNS resolution:**

```bash
ping portfolio.local
# Should respond from 127.0.0.1
```

### 3. Production Environment Configuration

Create a production-like `.env` file.

```bash
# Backup your development .env
cp .env .env.dev.backup

# Create production-like .env
cp .env.example .env.prod
```

Edit `.env.prod` with production-like settings:

```bash
# Backend
GIN_MODE=release
LOG_LEVEL=info
PORT=8000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Allowed Origins (important for CORS)
ALLOWED_ORIGINS=https://portfolio.local,https://auth.portfolio.local

# Authentik
AUTHENTIK_URL=https://auth.portfolio.local
AUTHENTIK_ISSUER=https://auth.portfolio.local/application/o/portfolio-manager/
AUTHENTIK_CLIENT_ID=portfolio-manager

# Frontend
VITE_API_URL=https://api.portfolio.local/api
VITE_AUTHENTIK_URL=https://auth.portfolio.local
VITE_REDIRECT_URI=https://portfolio.local/auth/callback

# Security Headers (enable in production)
ENABLE_HSTS=true
ENABLE_CSP=true

# TLS (for services if needed)
TLS_CERT_FILE=/certs/portfolio.local.crt
TLS_KEY_FILE=/certs/portfolio.local.key
```

**Note**: You can use a managed PostgreSQL instance instead of the containerized one. Update `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` accordingly.

### 4. Reverse Proxy Setup

Set up Nginx or Caddy as a reverse proxy to handle HTTPS and route traffic to services.

#### Option A: Using Nginx

Create Nginx configuration:

```bash
mkdir -p nginx
nano nginx/nginx.conf
```

Add this configuration:

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

    # Frontend - portfolio.local
    server {
        listen 443 ssl http2;
        server_name portfolio.local;

        ssl_certificate /etc/nginx/certs/portfolio.local.crt;
        ssl_certificate_key /etc/nginx/certs/portfolio.local.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://portfolio-frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend API - api.portfolio.local
    server {
        listen 443 ssl http2;
        server_name api.portfolio.local;

        ssl_certificate /etc/nginx/certs/portfolio.local.crt;
        ssl_certificate_key /etc/nginx/certs/portfolio.local.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;

        location / {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://portfolio-backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Authentik - auth.portfolio.local
    server {
        listen 443 ssl http2;
        server_name auth.portfolio.local;

        ssl_certificate /etc/nginx/certs/portfolio.local.crt;
        ssl_certificate_key /etc/nginx/certs/portfolio.local.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        location / {
            limit_req zone=auth_limit burst=10 nodelay;
            
            proxy_pass http://portfolio-authentik-server:9000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Grafana - grafana.portfolio.local
    server {
        listen 443 ssl http2;
        server_name grafana.portfolio.local;

        ssl_certificate /etc/nginx/certs/portfolio.local.crt;
        ssl_certificate_key /etc/nginx/certs/portfolio.local.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://grafana:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Redirect HTTP to HTTPS for all domains
    server {
        listen 80;
        server_name portfolio.local api.portfolio.local auth.portfolio.local grafana.portfolio.local;
        return 301 https://$host$request_uri;
    }
}
```

Save the file.

#### Option B: Using Caddy (Simpler Alternative)

Create Caddyfile:

```bash
mkdir -p caddy
nano caddy/Caddyfile
```

Add this configuration:

```
# Frontend
https://portfolio.local {
    tls /certs/portfolio.local.crt /certs/portfolio.local.key
    reverse_proxy portfolio-frontend:3000
}

# Backend API
https://api.portfolio.local {
    tls /certs/portfolio.local.crt /certs/portfolio.local.key
    reverse_proxy portfolio-backend:8000
}

# Authentik
https://auth.portfolio.local {
    tls /certs/portfolio.local.crt /certs/portfolio.local.key
    reverse_proxy portfolio-authentik-server:9000
}

# Grafana
https://grafana.portfolio.local {
    tls /certs/portfolio.local.crt /certs/portfolio.local.key
    reverse_proxy grafana:3001
}
```

Save the file.

### 5. Authentik Production Configuration

#### Step 1: Update Docker Compose for Production-like Mode

Create a production override file `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: portfolio-nginx
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - portfolio-frontend
      - portfolio-backend
      - portfolio-authentik-server
    networks:
      - portfolio-network
    restart: unless-stopped

  # Override frontend environment for production URLs
  portfolio-frontend:
    environment:
      - VITE_API_URL=https://api.portfolio.local/api
      - VITE_AUTHENTIK_URL=https://auth.portfolio.local
      - VITE_REDIRECT_URI=https://portfolio.local/auth/callback

  # Override backend environment for production URLs
  portfolio-backend:
    environment:
      - GIN_MODE=release
      - ALLOWED_ORIGINS=https://portfolio.local,https://auth.portfolio.local
      - AUTHENTIK_ISSUER=https://auth.portfolio.local/application/o/portfolio-manager/
```

If using Caddy instead of Nginx, replace the `nginx` service with:

```yaml
  caddy:
    image: caddy:alpine
    container_name: portfolio-caddy
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - ./certs:/certs:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - portfolio-frontend
      - portfolio-backend
      - portfolio-authentik-server
    networks:
      - portfolio-network
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

#### Step 2: Configure Authentik with Production URLs

1. Start services first (we'll configure Authentik next):

```bash
# Use production compose overlay
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# OR with Podman
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. Access Authentik at `https://auth.portfolio.local`

3. Log in with admin credentials (or create admin if first time)

4. Update OAuth2 Provider:
   - Navigate to **Applications** → **Providers** → **Portfolio Manager Provider**
   - Update **Redirect URIs**:
     ```
     https://portfolio.local/auth/callback
     https://portfolio.local/
     ```
   - Click **Update**

5. Verify **Issuer URL** in application matches:
   ```
   https://auth.portfolio.local/application/o/portfolio-manager/
   ```

### 6. Start Services

Start all services with production configuration:

```bash
# Stop any running development containers
make down

# Start with production overlay
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# OR with Podman
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f
# OR
podman compose logs -f
```

---

## Verification

### 1. Check Services are Running

```bash
docker compose ps
# OR
podman compose ps

# All services should show "Up" or "healthy"
```

### 2. Test HTTPS Endpoints

```bash
# Frontend
curl -k https://portfolio.local
# Should return HTML (200 OK)

# Backend API health
curl -k https://api.portfolio.local/health
# Should return: {"status":"healthy"}

# Authentik
curl -k https://auth.portfolio.local/-/health/live/
# Should return HTTP 204 (no content)
```

### 3. Test Authentication Flow

1. Open browser: `https://portfolio.local`
2. Click "Login"
3. Should redirect to `https://auth.portfolio.local`
4. Login with test account
5. Should redirect back to `https://portfolio.local/auth/callback`
6. Should be logged in successfully

### 4. Verify TLS Certificate

In browser:
1. Go to `https://portfolio.local`
2. Click lock icon in address bar
3. View certificate details
4. Should show "portfolio.local" and be trusted (if using mkcert)

---

## Differences from Quick Dev

| Aspect | Quick Dev | Production-like Local |
|--------|-----------|----------------------|
| **Protocol** | HTTP | HTTPS (TLS) |
| **Domain** | localhost | Custom domain (portfolio.local) |
| **Certificates** | None | mkcert or self-signed |
| **Reverse Proxy** | None | Nginx or Caddy |
| **Environment Mode** | Development | Release/Production |
| **Security Headers** | Disabled | Enabled (HSTS, CSP, etc.) |
| **CORS Settings** | Permissive | Production-like strict |
| **Database** | Container (ephemeral) | Can use external/managed DB |
| **Rate Limiting** | Disabled | Enabled |
| **Logging Level** | Debug | Info/Warn |
| **Authentik URLs** | http://localhost:9000 | https://auth.portfolio.local |
| **Frontend URL** | http://localhost:3000 | https://portfolio.local |
| **Backend URL** | http://localhost:8000 | https://api.portfolio.local |

---

## Troubleshooting

### Certificate Not Trusted

**Problem**: Browser shows "Your connection is not private" warning.

**Solution**:
```bash
# If using mkcert, reinstall root CA
mkcert -install

# If using self-signed, manually trust the certificate (see Step 1)

# Restart browser after trusting certificate
```

### Cannot Resolve Domain

**Problem**: `ping portfolio.local` fails or doesn't resolve to 127.0.0.1.

**Solution**:
```bash
# Verify /etc/hosts has the entries
cat /etc/hosts | grep portfolio

# Should show:
# 127.0.0.1   portfolio.local
# 127.0.0.1   auth.portfolio.local
# ...

# On macOS, flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# On Linux
sudo systemd-resolve --flush-caches
```

### Nginx/Caddy Won't Start

**Problem**: Reverse proxy container fails to start.

**Solution**:
```bash
# Check if ports 80/443 are already in use
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting services
sudo systemctl stop nginx  # If system nginx is running
sudo systemctl stop apache2

# Check Nginx logs
docker compose logs nginx
# OR
podman compose logs caddy

# Verify certificate files exist
ls -la certs/
```

### Authentik Redirect Loop

**Problem**: Login keeps redirecting, never completes.

**Solution**:
- Verify redirect URIs in Authentik exactly match: `https://portfolio.local/auth/callback`
- Check issuer URL: `https://auth.portfolio.local/application/o/portfolio-manager/`
- Verify frontend `.env` has correct `VITE_REDIRECT_URI`
- Clear browser cookies and try again
- Check backend logs for token validation errors

### CORS Errors in Browser Console

**Problem**: "Access to fetch at ... has been blocked by CORS policy"

**Solution**:
```bash
# Update backend .env
ALLOWED_ORIGINS=https://portfolio.local,https://auth.portfolio.local

# Restart backend
docker compose restart portfolio-backend

# Verify CORS headers in response
curl -I -H "Origin: https://portfolio.local" https://api.portfolio.local/health
# Should include: Access-Control-Allow-Origin: https://portfolio.local
```

### Mixed Content Warnings

**Problem**: Browser console shows "Mixed Content" errors (HTTP resources on HTTPS page).

**Solution**:
- Ensure all URLs in frontend `.env` use `https://`
- Check for hardcoded `http://` URLs in code
- Verify reverse proxy is forwarding `X-Forwarded-Proto: https` header
- Enable Content Security Policy to enforce HTTPS

### Database Connection Issues

**Problem**: Backend can't connect to external/managed database.

**Solution**:
```bash
# Test database connectivity from backend container
docker exec -it portfolio-backend sh
apk add postgresql-client
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d portfolio

# Verify firewall allows connection from your IP
# Check database credentials in .env match managed DB

# For containerized DB, ensure network connectivity
docker compose exec portfolio-backend ping postgres
```

---

## Revert to Quick Dev

To switch back to simple development mode:

```bash
# Stop production services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Restore development .env
cp .env.dev.backup .env

# Start development services
make up
```

---

## Next Steps

- **Test production configurations** thoroughly before deploying
- **Set up monitoring** with Grafana dashboards
- **Review security settings** in reverse proxy configuration
- **Test backup and restore** procedures with production-like data
- **Deploy to production** following [Production Deployment Guide](production.md)

## Related Documentation

- [Local Development (Quick Dev)](local-development.md)
- [Production Deployment](production.md)
- [Authentik Setup](../authentication/authentik-setup.md)
- [Security Overview](../security/overview.md)
- [How to Deploy Production](../how-to-do/how-to-deploy-production.md)

---

**Last Updated**: 2025-12-11
