# 🚀 Setup Guide

Quick start guide for setting up the Portfolio Manager development environment.

## Quick Start

**Time Required:** 10-15 minutes

### Prerequisites

- Docker or Podman installed
- Git installed
- Terminal access

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/JorgeSaicoski/portfolio-manager.git
   cd portfolio-manager
   ```

2. **Set up local environment**
   - See [Local Development Setup](local-development.md)

3. **Start services with Docker/Podman**
   - See [Docker/Podman Guide](docker-podman.md)

4. **Use Makefile commands**
   - See [Makefile Guide](makefile-guide.md) for all available commands

## Documentation in This Section

| Document | Purpose | Time |
|----------|---------|------|
| [Local Development](local-development.md) | Set up your local development environment | 10 min |
| [Docker/Podman Guide](docker-podman.md) | Container setup and management | 5 min |
| [Makefile Guide](makefile-guide.md) | Complete reference for make commands | Reference |
| [Makefile Implementation](makefile-implementation.md) | Technical details of makefile automation | Reference |

## Common Tasks

### Start Development Environment
```bash
make up
```

### Run Tests
```bash
make test
```

### View Logs
```bash
make logs
```

### Stop Everything
```bash
make down
```

## Next Steps

After setup, see:
- [Development Guide](/docs/development/) - Start developing
- [API Documentation](/docs/api/) - Understand the API
- [How-To Guides](/docs/how-to-do/) - Step-by-step task guides

## Troubleshooting

If you encounter issues:
1. Check [Authentication Troubleshooting](/docs/authentication/troubleshooting.md)
2. Verify Docker/Podman is running
3. Ensure ports 8000, 3000, 5432 are available
4. Review logs with `make logs`

## Related Documentation

- [Main Documentation](/docs/README.md)
- [Deployment](/docs/deployment/)
- [Operations](/docs/operations/)
