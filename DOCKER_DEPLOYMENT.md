# Docker Deployment Guide

This guide covers Docker-specific deployment for the WhatsApp Monitoring Platform.

For general usage and API documentation, see [README.md](README.md).

---

## 📋 Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 20.x+ | `docker --version` |
| Docker Compose | 2.x+ | `docker-compose --version` |

**Install Docker (Ubuntu/Debian):**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd whatsapp-monitoring-platform

# 2. Create environment file
cp .env.example .env

# 3. Start services
docker-compose up -d

# 4. Verify
curl http://localhost:8001/api
```

Expected response:
```json
{"message":"WhatsApp Monitoring API v1.0"}
```

---

## 📦 What Gets Deployed

### Services

**backend** (Node.js + whatsapp-web.js)
- **Image:** Built from local Dockerfile
- **Port:** 8001 (HTTP API)
- **Restart:** Always (unless manually stopped)
- **Dependencies:** MongoDB

**mongodb** (MongoDB 7)
- **Image:** mongo:7 (official)
- **Port:** 27017 (internal only, not exposed to host)
- **Restart:** Always (unless manually stopped)

### Volumes

**whatsapp-sessions**
- **Purpose:** Stores WhatsApp authentication sessions
- **Location:** Docker managed volume
- **Persistence:** Survives container restarts and rebuilds

**mongodb-data**
- **Purpose:** Stores database files
- **Location:** Docker managed volume
- **Persistence:** Survives container restarts and rebuilds

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file before starting:

```env
# MongoDB (use service name in Docker)
MONGO_URL=mongodb://mongodb:27017
DB_NAME=whatsapp_monitor

# Server
CORS_ORIGINS=*

# Limits
MAX_WHATSAPP_ACCOUNTS=5

# Environment
NODE_ENV=production
```

**Important:**
- Use `mongodb://mongodb:27017` (service name) NOT `localhost`
- Changing `MAX_WHATSAPP_ACCOUNTS` requires restart: `docker-compose restart backend`

---

### Port Configuration

Default ports:

| Service | Internal | External | Description |
|---------|----------|----------|-------------|
| Backend | 8001 | 8001 | API server |
| MongoDB | 27017 | (not exposed) | Database |

**Change external port:**

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "9000:8001"  # Host:Container
```

Then access API at: http://localhost:9000/api

---

## 💾 Session Persistence

### How It Works

WhatsApp sessions are stored in Docker volume `whatsapp-sessions`.

```yaml
volumes:
  - whatsapp-sessions:/app/backend/whatsapp-sessions
```

This volume contains:
- Chrome profile data (cookies, local storage)
- WhatsApp authentication tokens
- Session metadata

### Persistence Matrix

| Action | Sessions Preserved? | QR Re-scan Required? |
|--------|---------------------|---------------------|
| `docker-compose restart` | ✅ Yes | ❌ No |
| `docker-compose stop` + `up` | ✅ Yes | ❌ No |
| `docker-compose down` | ✅ Yes | ❌ No |
| `docker-compose down -v` | ❌ No | ✅ Yes |
| `docker-compose up --build` | ✅ Yes | ❌ No |
| Host machine reboot | ✅ Yes | ❌ No |

**⚠️ Warning:** `docker-compose down -v` deletes ALL volumes including sessions.

---

## 🔄 Common Operations

### Start Services

```bash
docker-compose up -d
```

Flags:
- `-d` : Detached mode (run in background)
- `--build` : Force rebuild images

### Stop Services

```bash
# Stop (preserves data)
docker-compose down

# Stop and delete volumes (⚠️ deletes sessions)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Check Status

```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS    PORTS
whatsapp-monitor-backend  Up        0.0.0.0:8001->8001/tcp
whatsapp-monitor-db       Up        27017/tcp
```

### Execute Commands in Container

```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh whatsapp_monitor

# Check Chrome processes
docker-compose exec backend ps aux | grep chrome
```

---

## 📤 Backup & Restore

### Backup Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/whatsapp-sessions-backup.tar.gz -C /data .
```

Creates `whatsapp-sessions-backup.tar.gz` in current directory.

### Restore Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/whatsapp-sessions-backup.tar.gz -C /data
```

Then restart backend:

```bash
docker-compose restart backend
```

### Backup Database

```bash
docker-compose exec mongodb mongodump \
  --out=/dump \
  --db=whatsapp_monitor

docker cp whatsapp-monitor-db:/dump ./mongodb-backup
```

### Restore Database

```bash
docker cp ./mongodb-backup whatsapp-monitor-db:/dump

docker-compose exec mongodb mongorestore \
  --db=whatsapp_monitor \
  /dump/whatsapp_monitor
```

---

## 🛠️ Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker-compose logs backend
```

**Common causes:**
- Port 8001 already in use (change in docker-compose.yml)
- MongoDB not ready (add healthcheck)
- Missing .env file (copy from .env.example)

---

### Chrome Not Launching

**Symptom:** Backend logs show Puppeteer errors.

**Solution:**

```bash
# Rebuild with no cache
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

---

### Session Not Restoring

**Symptom:** Account requires QR re-scan after restart.

**Check volume:**

```bash
docker volume ls | grep whatsapp-sessions
```

If missing, volume was deleted. Create account again and scan QR.

**Verify mount:**

```bash
docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
```

Should show session directories.

---

### MongoDB Connection Failed

**Symptom:** Backend can't connect to database.

**Check MongoDB status:**

```bash
docker-compose logs mongodb
```

**Verify connection string in .env:**

```env
MONGO_URL=mongodb://mongodb:27017
```

Must use `mongodb` (service name), not `localhost`.

---

### Out of Memory

**Symptom:** Containers crash or freeze.

**Check resource usage:**

```bash
docker stats
```

**Solution:**

Each WhatsApp account uses ~200MB RAM. For 5 accounts:

- Minimum: 2GB RAM
- Recommended: 4GB RAM

Increase Docker memory limit:
- Docker Desktop → Settings → Resources → Memory

---

### Port Conflict

**Symptom:** `docker-compose up` fails with "port already allocated".

**Solution:**

```bash
# Find process using port 8001
sudo lsof -i :8001

# Kill process or change port in docker-compose.yml
```

Edit `docker-compose.yml`:

```yaml
ports:
  - "9000:8001"
```

---

## 🔒 Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change `CORS_ORIGINS` from `*` to specific domain
- [ ] Add reverse proxy (Nginx/Caddy) with HTTPS
- [ ] Set up MongoDB authentication
- [ ] Enable Docker resource limits
- [ ] Configure log rotation
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Create automated backups
- [ ] Document QR scan process for team

### Example: Adding MongoDB Authentication

**1. Create MongoDB user:**

```bash
docker-compose exec mongodb mongosh whatsapp_monitor

# In MongoDB shell:
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "whatsapp_monitor" }]
})
```

**2. Update .env:**

```env
MONGO_URL=mongodb://admin:secure_password@mongodb:27017/whatsapp_monitor
```

**3. Restart backend:**

```bash
docker-compose restart backend
```

### Example: Adding Reverse Proxy

**1. Create nginx.conf:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**2. Add to docker-compose.yml:**

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
```

---

## 📊 Monitoring

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

Add to `docker-compose.yml`:

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

### Log Rotation

Add to `docker-compose.yml`:

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

---

## 🗑️ Clean Restart

**⚠️ Warning:** This deletes ALL data including sessions and database.

```bash
docker-compose down -v
docker-compose up --build -d
```

All accounts will need QR re-scan.

---

## 📚 Additional Resources

- **Main Documentation:** [README.md](README.md)
- **Docker Documentation:** https://docs.docker.com
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file

---

**Last Updated:** January 27, 2026  
**Docker Version:** 20.10+  
**Compose Version:** 2.x
