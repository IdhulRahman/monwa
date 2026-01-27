# WhatsApp Monitoring Platform - Docker Deployment

Production-ready containerized deployment with session persistence.

---

## Quick Start

```bash
# Clone and navigate
cd whatsapp-monitoring-platform

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Access API
curl http://localhost:8001/api
```

---

## Architecture

**Services:**
- `backend`: Node.js + Express + whatsapp-web.js
- `mongodb`: MongoDB 7

**Volumes:**
- `whatsapp-sessions`: WhatsApp session data (persists across restarts)
- `mongodb-data`: Database files

---

## Configuration

### Environment Variables

Create `.env` file (or use `.env.example`):

```env
# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=whatsapp_monitor

# Server
PORT=8001
CORS_ORIGINS=*

# Limits
MAX_WHATSAPP_ACCOUNTS=5

# Optional
WEBHOOK_TIMEOUT=5000
```

### Port Configuration

All ports are configurable via environment variables:

| Service | Port | ENV Variable | Description |
|---------|------|--------------|-------------|
| Backend | 8001 | `PORT` | API server port |
| MongoDB | 27017 | - | Database port (internal) |

**Change backend port:**

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "9000:8001"  # External:Internal
    environment:
      - PORT=8001    # Keep internal port at 8001
```

External clients connect to `http://localhost:9000`, container listens on `8001` internally.

---

## Session Persistence

WhatsApp sessions are stored in Docker volume `whatsapp-sessions`.

### Behavior Matrix

| Scenario | Sessions Persist? | QR Re-scan Required? |
|----------|-------------------|---------------------|
| Container restart (`docker-compose restart`) | ✅ Yes | ❌ No |
| Container stop/start (`down` + `up`) | ✅ Yes | ❌ No |
| Container rebuild with volume (`up --build`) | ✅ Yes | ❌ No |
| Volume deletion (`down -v`) | ❌ No | ✅ Yes |
| Host machine reboot (volume persists) | ✅ Yes | ❌ No |

**Volume Location:**

```bash
# Inspect volume
docker volume inspect whatsapp-monitoring-platform_whatsapp-sessions

# Backup sessions
docker run --rm -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup alpine tar czf /backup/sessions-backup.tar.gz /data

# Restore sessions
docker run --rm -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup alpine tar xzf /backup/sessions-backup.tar.gz -C /
```

---

## Dockerfile Explained

```dockerfile
FROM node:18-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    fonts-liberation libasound2 \
    ...

# Install Node dependencies
WORKDIR /app/backend
COPY backend/package.json backend/yarn.lock* ./
RUN yarn install --frozen-lockfile

# Install Chrome for Puppeteer
RUN npx puppeteer browsers install chrome

# Copy application code
COPY backend/ ./

EXPOSE 8001
CMD ["node", "server.js"]
```

**Key Points:**
- Node.js 18 (LTS)
- Chrome dependencies installed
- Puppeteer Chrome downloaded at build time
- Production-optimized layers

---

## Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=whatsapp_monitor
      - MAX_WHATSAPP_ACCOUNTS=5
    volumes:
      - whatsapp-sessions:/app/backend/whatsapp-sessions
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:7
    volumes:
      - mongodb-data:/data/db
    restart: unless-stopped

volumes:
  whatsapp-sessions:
  mongodb-data:
```

**restart: unless-stopped:**
- Container restarts automatically on failure
- Does NOT restart if manually stopped
- Starts on host reboot

---

## Commands

### Start Services

```bash
docker-compose up -d
```

**Flags:**
- `-d`: Detached mode (background)
- `--build`: Force rebuild

### Stop Services

```bash
docker-compose down
```

**Flags:**
- `-v`: Remove volumes (DELETES sessions)

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Single Service

```bash
docker-compose restart backend
```

### Execute Commands

```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh whatsapp_monitor
```

---

## Scaling

**NOT SUPPORTED** for multi-container backend.

WhatsApp sessions are bound to single Puppeteer instance per account.

For high availability:
1. Run multiple deployments (separate domains)
2. Each deployment manages own set of accounts
3. Load balance at application level

Do NOT use:
- Docker Swarm
- Kubernetes horizontal scaling
- Multiple backend replicas

---

## Security

**Production Recommendations:**

1. **Add API authentication:**
```yaml
environment:
  - JWT_SECRET=your-secret-key
```

2. **Restrict CORS:**
```yaml
environment:
  - CORS_ORIGINS=https://your-domain.com
```

3. **Use secrets for MongoDB:**
```yaml
mongodb:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD_FILE=/run/secrets/mongo_password
  secrets:
    - mongo_password
```

4. **Enable firewall:**
```bash
# Allow only necessary ports
ufw allow 8001/tcp
ufw enable
```

5. **Use reverse proxy:**
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

---

## Monitoring

### Health Checks

Add to `docker-compose.yml`:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/api"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### Resource Limits

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        cpus: '1'
        memory: 2G
```

### Logs

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

---

## Troubleshooting

**Chrome not launching:**

```bash
# Rebuild with --no-cache
docker-compose build --no-cache backend
docker-compose up -d
```

**Permission errors:**

```bash
# Fix volume permissions
docker-compose exec backend chown -R node:node /app/backend/whatsapp-sessions
```

**MongoDB connection failed:**

```bash
# Check MongoDB status
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Out of memory:**

```bash
# Check container memory
docker stats

# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 4GB+
```

**Session not restoring:**

```bash
# Verify volume exists
docker volume ls | grep sessions

# Check volume contents
docker run --rm -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  alpine ls -la /data
```

---

## Clean Restart (Delete All Data)

**WARNING:** Deletes all WhatsApp sessions and database.

```bash
docker-compose down -v
docker-compose up -d
```

All accounts will need QR re-scan.

---

## Backup & Restore

### Backup

```bash
# Sessions
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/sessions.tar.gz -C /data .

# Database
docker-compose exec mongodb mongodump \
  --out=/dump --db=whatsapp_monitor

docker cp $(docker-compose ps -q mongodb):/dump ./mongodb-backup
```

### Restore

```bash
# Sessions
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/sessions.tar.gz -C /data

# Database
docker cp ./mongodb-backup $(docker-compose ps -q mongodb):/dump

docker-compose exec mongodb mongorestore \
  --db=whatsapp_monitor /dump/whatsapp_monitor
```

---

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure `CORS_ORIGINS`
- [ ] Add MongoDB authentication
- [ ] Enable HTTPS (reverse proxy)
- [ ] Set resource limits
- [ ] Configure log rotation
- [ ] Enable health checks
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure automated backups
- [ ] Test session restore
- [ ] Document QR scan process for ops team

---

## Environment Variables Reference

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `MONGO_URL` | string | `mongodb://localhost:27017` | Yes | MongoDB connection string |
| `DB_NAME` | string | `test_database` | Yes | Database name |
| `PORT` | integer | `8001` | No | Backend HTTP port |
| `CORS_ORIGINS` | string | `*` | No | Allowed CORS origins |
| `MAX_WHATSAPP_ACCOUNTS` | integer | `5` | No | Max concurrent accounts |
| `WEBHOOK_TIMEOUT` | integer | `5000` | No | Webhook timeout (ms) |
| `NODE_ENV` | string | `production` | No | Node environment |

---

**Status:** Production-ready | Session persistence verified

For API documentation, see [API_REFERENCE.md](API_REFERENCE.md)
