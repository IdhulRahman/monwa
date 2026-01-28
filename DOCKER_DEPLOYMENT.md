# Docker Deployment Guide

This guide covers Docker-specific deployment details for the WhatsApp Monitoring Platform.

For general usage, API documentation, and troubleshooting, see [README.md](README.md).

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 20.x+ | `docker --version` |
| Docker Compose | 2.x+ | `docker-compose --version` |

---

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd whatsapp-monitoring-platform

# 2. Create environment file
cp .env.example .env

# 3. Start services
docker-compose up --build -d

# 4. Verify
curl http://localhost:8001/api
```

Expected response:
```json
{"message":"WhatsApp Monitoring API v1.0"}
```

---

## What Gets Deployed

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `backend` | Built locally | 8001 | Node.js API + WhatsApp clients |
| `mongodb` | mongo:7 | 27017 (internal) | Account metadata storage |

### Volumes

| Volume | Mount Path | Purpose |
|--------|------------|---------|
| `whatsapp-sessions` | `/app/backend/whatsapp-sessions` | WhatsApp authentication sessions |
| `mongodb-data` | `/data/db` | MongoDB database files |

---

## Volume Persistence

WhatsApp sessions are stored in the `whatsapp-sessions` Docker volume.

### What's Stored

- Chrome profile data (cookies, local storage)
- WhatsApp authentication tokens
- Session metadata

### Persistence Behavior

| Action | Sessions Preserved | QR Re-scan Required |
|--------|-------------------|---------------------|
| `docker-compose restart` | ✅ Yes | ❌ No |
| `docker-compose stop` then `up` | ✅ Yes | ❌ No |
| `docker-compose down` | ✅ Yes | ❌ No |
| `docker-compose down -v` | ❌ No | ✅ Yes |
| `docker-compose up --build` | ✅ Yes | ❌ No |
| Host machine reboot | ✅ Yes | ❌ No |

⚠️ **Warning:** `docker-compose down -v` deletes ALL volumes including sessions and database.

---

## Port Configuration

Default port mapping:

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Backend | 8001 | 8001 |
| MongoDB | 27017 | 27017 |

### Changing the Backend Port

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "9000:8001"  # Host:Container
```

Access API at: http://localhost:9000/api

---

## Common Operations

### Starting Services

```bash
# Start in background
docker-compose up -d

# Start and rebuild images
docker-compose up --build -d
```

### Stopping Services

```bash
# Stop (preserves data)
docker-compose down

# Stop and delete volumes (⚠️ deletes sessions)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Checking Status

```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS    PORTS
whatsapp-monitor-backend  Up        0.0.0.0:8001->8001/tcp
whatsapp-monitor-db       Up        0.0.0.0:27017->27017/tcp
```

### Executing Commands in Container

```bash
# Open shell in backend container
docker-compose exec backend sh

# Open MongoDB shell
docker-compose exec mongodb mongosh whatsapp_monitor

# Check Chrome processes
docker-compose exec backend ps aux | grep chrome
```

---

## Backup & Restore

### Backup Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/sessions-backup.tar.gz -C /data .
```

Creates `sessions-backup.tar.gz` in current directory.

### Restore Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/sessions-backup.tar.gz -C /data
```

Then restart:
```bash
docker-compose restart backend
```

### Backup Database

```bash
docker-compose exec mongodb mongodump --out=/dump --db=whatsapp_monitor
docker cp whatsapp-monitor-db:/dump ./mongodb-backup
```

### Restore Database

```bash
docker cp ./mongodb-backup whatsapp-monitor-db:/dump
docker-compose exec mongodb mongorestore --db=whatsapp_monitor /dump/whatsapp_monitor
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common causes:**
- Port 8001 already in use → Change port in `docker-compose.yml`
- Missing `.env` file → Copy from `.env.example`
- MongoDB not ready → Wait and restart backend

---

### Chrome Not Launching

**Symptom:** Backend logs show Puppeteer errors.

**Solution:**
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

---

### Session Not Restoring

**Symptom:** Account requires QR re-scan after restart.

**Check volume exists:**
```bash
docker volume ls | grep whatsapp-sessions
```

**Verify mount:**
```bash
docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
```

Should show session directories for each account.

---

### MongoDB Connection Failed

**Check MongoDB status:**
```bash
docker-compose logs mongodb
```

**Verify connection string in `.env`:**
```env
MONGO_URL=mongodb://mongodb:27017
```

Must use `mongodb` (service name), not `localhost`.

---

### Out of Memory

**Check resource usage:**
```bash
docker stats
```

**Resource requirements:**
- Each WhatsApp account uses ~200MB RAM
- For 5 accounts: minimum 2GB RAM, recommended 4GB RAM

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory

---

### Port Conflict

**Find process using port:**
```bash
sudo lsof -i :8001
```

**Options:**
1. Stop the conflicting process
2. Change port in `docker-compose.yml`

---

## Resource Limits (Optional)

Add to `docker-compose.yml`:

```yaml
services:
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

---

## Log Rotation (Optional)

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Health Checks (Optional)

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Clean Restart

⚠️ **Warning:** This deletes ALL data including sessions and database.

```bash
docker-compose down -v
docker-compose up --build -d
```

All accounts will need QR re-scan.

---

## Additional Resources

- **Main Documentation:** [README.md](README.md)
- **Docker Documentation:** https://docs.docker.com
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file
