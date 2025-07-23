# Docker Setup Guide

This guide provides comprehensive instructions for running Firecrawl Frontend with Docker.

## 🐳 Docker Files Overview

### Core Files
- **`Dockerfile`** - Multi-stage production-optimized container
- **`docker-compose.yml`** - Development environment with hot reloading
- **`docker-compose.prod.yml`** - Production environment with security hardening
- **`.dockerignore`** - Optimized build context
- **`.env.example`** - Environment variable template

## 🚀 Quick Start

### Development Environment
```bash
# Clone and setup
git clone <repository-url>
cd firecrawl-frontend
cp .env.example .env.local

# Start development with hot reloading
docker-compose up --build

# Access application
open http://localhost:3000
```

### Production Environment
```bash
# Build and run production container
docker-compose -f docker-compose.prod.yml up --build

# With custom API endpoint
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://your-api.com \
docker-compose -f docker-compose.prod.yml up --build
```

## 🏗️ Docker Architecture

### Multi-Stage Dockerfile

#### Stage 1: Dependencies (`deps`)
- Base: `node:18-alpine`
- Installs pnpm and project dependencies
- Optimized for layer caching

#### Stage 2: Builder (`builder`)
- Copies dependencies from deps stage
- Builds Next.js application with standalone output
- Sets production environment variables

#### Stage 3: Runner (`runner`)
- Minimal runtime environment
- Non-root user for security
- Health checks enabled
- Optimized for production

### Key Features
- **Multi-stage build** for minimal image size
- **Non-root user** for enhanced security
- **Health checks** for monitoring
- **Standalone output** for optimal performance
- **Layer caching** for faster builds

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=http://localhost:3002
```

#### Optional Variables
```env
NEXT_PUBLIC_MAX_JOBS=100
NEXT_PUBLIC_STORAGE_LIMIT=10485760
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

### Docker Compose Services

#### Development (`docker-compose.yml`)
- **Hot reloading** with volume mounts
- **Development optimizations**
- **Debug-friendly configuration**

#### Production (`docker-compose.prod.yml`)
- **Security hardening** with read-only filesystem
- **Resource constraints**
- **Health monitoring**
- **Optional nginx reverse proxy**

## 📋 Common Commands

### Development Commands
```bash
# Start development environment
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f firecrawl-frontend

# Stop containers
docker-compose down

# Rebuild from scratch
docker-compose up --build --force-recreate
```

### Production Commands
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up --build

# With nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up

# Scale application
docker-compose -f docker-compose.prod.yml up --scale firecrawl-frontend=3
```

### Maintenance Commands
```bash
# Remove containers and volumes
docker-compose down -v

# Build specific service
docker-compose build firecrawl-frontend

# Execute commands in container
docker-compose exec firecrawl-frontend npm run lint

# Check container health
docker-compose ps
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint
The application includes a health check endpoint at `/api/health`:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

### Docker Health Checks
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

### Monitoring Commands
```bash
# Check container status
docker-compose ps

# View health check logs
docker-compose logs firecrawl-frontend | grep health

# Monitor resource usage
docker stats firecrawl-frontend-prod
```

## 🔒 Security Features

### Production Security
- **Non-root user** (nextjs:nodejs)
- **Read-only filesystem** with tmpfs for cache
- **Dropped capabilities** (ALL) with minimal additions
- **No new privileges** flag
- **Security options** configured

### Network Security
- **Custom bridge network** for service isolation
- **Port exposure** limited to necessary ports
- **Optional nginx** reverse proxy for SSL termination

## 🚀 Production Deployment

### Basic Production Setup
```bash
# Create production environment file
cp .env.example .env.production

# Edit production variables
nano .env.production

# Deploy with production compose
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### With Nginx Reverse Proxy
```bash
# Create nginx configuration
mkdir -p nginx ssl

# Start with nginx profile
docker-compose -f docker-compose.prod.yml --profile nginx up -d
```

### Environment-Specific Deployment
```bash
# Staging environment
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://staging-api.com \
docker-compose -f docker-compose.prod.yml up -d

# Production environment
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://api.com \
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache firecrawl-frontend
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Rebuild containers
docker-compose up --build --force-recreate
```

#### Network Issues
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up
```

### Debug Commands
```bash
# Access container shell
docker-compose exec firecrawl-frontend sh

# Check container logs
docker-compose logs --tail=100 firecrawl-frontend

# Inspect container
docker inspect firecrawl-frontend-prod
```

## 📊 Performance Optimization

### Build Optimization
- **Multi-stage builds** reduce final image size
- **Layer caching** speeds up subsequent builds
- **Minimal base images** (Alpine Linux)
- **Dependency optimization** with pnpm

### Runtime Optimization
- **Standalone output** for minimal runtime
- **Health checks** for monitoring
- **Resource limits** in production
- **Read-only filesystem** for security

### Monitoring Performance
```bash
# Monitor resource usage
docker stats

# Check image sizes
docker images | grep firecrawl

# Analyze build layers
docker history firecrawl-frontend:latest
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t firecrawl-frontend .
      
      - name: Run tests
        run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
      
      - name: Deploy to production
        run: docker-compose -f docker-compose.prod.yml up -d
```

### Deployment Strategies
- **Blue-green deployment** with multiple containers
- **Rolling updates** with health checks
- **Canary releases** with traffic splitting

## 📚 Additional Resources

### Docker Documentation
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)

### Next.js Docker Resources
- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

This Docker setup provides a production-ready, secure, and scalable deployment solution for the Firecrawl Frontend application.
