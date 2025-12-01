# Docker / Podman Setup Guide

Guide for using Docker or Podman to run Portfolio Manager services.

## Overview

Portfolio Manager supports both Docker and Podman for container management. All services run in containers for consistent development and deployment environments.

## Installation

### Docker

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Mac:**
```bash
brew install --cask docker
```

**Windows:**
Download from https://www.docker.com/products/docker-desktop

### Podman (Recommended for Linux)

**Fedora/RHEL:**
```bash
sudo dnf install podman podman-compose
```

**Ubuntu/Debian:**
```bash
sudo apt install podman podman-compose
```

**Mac:**
```bash
brew install podman
podman machine init
podman machine start
```

## Configuration

### Rootless Podman (Recommended)

Podman can run without root privileges:

```bash
# Enable user namespaces
echo "user.max_user_namespaces=28633" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure subuid/subgid
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

### Docker Socket Permissions

If using Docker:

```bash
sudo chmod 666 /var/run/docker.sock
# OR better: add user to docker group (requires re-login)
sudo usermod -aG docker $USER
```

## Using the Makefile

The project Makefile automatically detects Docker or Podman:

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Restart service
make restart SERVICE=backend
```

## Manual Container Management

### Starting Services

**Docker:**
```bash
docker-compose up -d
```

**Podman:**
```bash
podman-compose up -d
```

### Viewing Containers

**Docker:**
```bash
docker ps
docker ps -a  # Include stopped containers
```

**Podman:**
```bash
podman ps
podman ps -a
```

### Viewing Logs

**Docker:**
```bash
docker logs backend
docker logs -f backend  # Follow logs
```

**Podman:**
```bash
podman logs backend
podman logs -f backend
```

### Executing Commands in Containers

**Docker:**
```bash
docker exec -it backend /bin/sh
docker exec backend make migrate
```

**Podman:**
```bash
podman exec -it backend /bin/sh
podman exec backend make migrate
```

### Stopping Services

**Docker:**
```bash
docker-compose down
docker-compose down -v  # Also remove volumes
```

**Podman:**
```bash
podman-compose down
podman-compose down -v
```

## Container Architecture

### Services

```
portfolio-manager/
├── backend          (Port 8000)  - Go API
├── frontend         (Port 3000)  - Svelte frontend
├── postgres         (Port 5432)  - Database
├── authentik-server (Port 9000)  - Auth server
├── authentik-worker              - Background tasks
├── redis            (Port 6379)  - Cache for Authentik
├── prometheus       (Port 9090)  - Metrics
└── grafana          (Port 3001)  - Dashboards
```

### Networks

All containers communicate on the `portfolio-net` network:

```bash
# Docker
docker network ls
docker network inspect portfolio-net

# Podman
podman network ls
podman network inspect portfolio-net
```

### Volumes

Persistent data stored in volumes:

- `postgres-data` - Database
- `authentik-media` - Authentik uploads
- `grafana-storage` - Grafana dashboards
- `prometheus-data` - Metrics data

```bash
# List volumes
docker volume ls  # OR podman volume ls

# Inspect volume
docker volume inspect postgres-data

# Remove volume (WARNING: deletes data)
docker volume rm postgres-data
```

## Troubleshooting

### Port Conflicts

Check what's using a port:

```bash
sudo lsof -i :8000
sudo netstat -tulpn | grep :8000
```

### Container Won't Start

```bash
# View container logs
docker logs backend
# OR
podman logs backend

# View all container events
docker events
# OR
podman events
```

### Out of Disk Space

```bash
# Docker: Clean up
docker system prune -a
docker volume prune

# Podman: Clean up
podman system prune -a
podman volume prune
```

### Permission Issues

```bash
# Docker: Check user in docker group
groups $USER

# Podman: Reset user namespaces
podman system migrate
```

### Container Networking Issues

```bash
# Recreate network
docker network rm portfolio-net
docker-compose up -d

# OR with Podman
podman network rm portfolio-net
podman-compose up -d
```

## Performance Optimization

### Docker

```bash
# Increase resources in Docker Desktop
# Settings → Resources → Advanced
# - CPUs: 4+
# - Memory: 8GB+
# - Swap: 2GB+
```

### Podman

```bash
# Increase VM resources (Mac only)
podman machine set --cpus 4 --memory 8192
podman machine restart
```

## Production Deployment

See [Production Deployment Guide](/docs/deployment/production.md) for:
- Production-specific configurations
- Security hardening
- Resource limits
- Health checks
- Restart policies

## Related Documentation

- [Local Development Setup](local-development.md)
- [Makefile Guide](makefile-guide.md)
- [Deployment Guide](/docs/deployment/)
- [How to Deploy Production](/docs/how-to-do/how-to-deploy-production.md)

## Switching Between Docker and Podman

The Makefile automatically detects which tool is available. To force a specific tool:

```bash
# Use Docker
export DOCKER_CMD=docker
make up

# Use Podman
export DOCKER_CMD=podman
make up
```

Or install `podman-docker` package to use Docker commands with Podman:

```bash
sudo dnf install podman-docker  # Fedora/RHEL
sudo apt install podman-docker  # Ubuntu/Debian
```
