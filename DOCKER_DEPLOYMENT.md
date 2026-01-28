# Docker Deployment Guide

Docker-specific instructions for the WhatsApp Monitoring Platform.

For general usage, see [README.md](README.md).

---

## How Docker Reads Configuration

Docker Compose reads from the **single `.env` file** in the repository root.

```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env
```

All environment variables are passed to containers automatically.

### Configuration Flow

```
.env (root)
    │
    ├── docker-compose.yml (reads .env)
    │       │
    │       ├── backend container
    │       │   └── Uses: BACKEND_PORT, MONGO_URI, DB_NAME, etc.
    │       │
    │       └── mongodb container
    │           └── Uses: MONGO_PORT
    │
    └── frontend (reads same .env if needed)
```

---

## Services

| Service | Container Name | Port | Image |
|---------|----------------|------|-------|
| Frontend | whatsapp-monitor-frontend | `${FRONTEND_PORT}` | Built locally |
| Backend | whatsapp-monitor-backend | `${BACKEND_PORT}` | Built locally |
| MongoDB | whatsapp-monitor-db | `${MONGO_PORT}` | mongo:7 |

---

## Volume Usage

### whatsapp-sessions

**Purpose:** Stores WhatsApp authentication data

**Mount:** `/app/backend/whatsapp-sessions`

**Contains:**
- Chrome profile data
- WhatsApp session tokens
- LocalAuth files

**Persistence:**

| Action | Data Preserved |
|--------|----------------|
| `docker-compose restart` | ✅ Yes |
| `docker-compose down` | ✅ Yes |
| `docker-compose down -v` | ❌ No |
| `docker-compose up --build` | ✅ Yes |

### mongodb-data

**Purpose:** Stores MongoDB database files

**Mount:** `/data/db`

**Contains:**
- Account metadata
- Snapshot history
- Configuration

---

## Port Mapping

Default configuration:

| Service | Container Port | Host Port | ENV Variable |
|---------|----------------|-----------|--------------|
| Frontend | 3000 | 3000 | `FRONTEND_PORT` |
| Backend | 8001 | 8001 | `BACKEND_PORT` |
| MongoDB | 27017 | 27017 | `MONGO_PORT` |

### Changing Ports

Edit `.env`:

```env
FRONTEND_PORT=4000
BACKEND_PORT=9000
MONGO_PORT=27018
```

Restart:

```bash
docker-compose up -d
```

Access at new ports:
- Dashboard: http://localhost:4000
- API: http://localhost:9000/api
- MongoDB: localhost:27018

---

## MongoDB Container

### Connection String

**Inside Docker network:**
```
mongodb://mongodb:27017
```

**From host machine:**
```
mongodb://localhost:27017
```

### Accessing MongoDB Shell

```bash
docker-compose exec mongodb mongosh whatsapp_monitor
```

### Common Commands

```javascript
// List accounts
db.whatsapp_accounts.find()

// Count accounts
db.whatsapp_accounts.countDocuments()

// Find by status
db.whatsapp_accounts.find({status: "READY"})
```

---

## Common Operations

### Start Services

```bash
docker-compose up -d
```

### Start with Rebuild

```bash
docker-compose up --build -d
```

### Stop Services

```bash
# Keep data
docker-compose down

# Delete all data (⚠️)
docker-compose down -v
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

### Restart Services

```bash
docker-compose restart backend
```

### Check Status

```bash
docker-compose ps
```

---

## Backup & Restore

### Backup Sessions

```bash
docker run --rm \
  -v monwa_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/sessions.tar.gz -C /data .
```

### Restore Sessions

```bash
docker run --rm \
  -v monwa_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/sessions.tar.gz -C /data

docker-compose restart backend
```

### Backup Database

```bash
docker-compose exec mongodb mongodump --out=/dump --db=whatsapp_monitor
docker cp whatsapp-monitor-db:/dump ./mongodb-backup
```

---

## Common Docker Errors

### Port Already in Use

**Error:** `bind: address already in use`

**Fix:**
```bash
# Find process
sudo lsof -i :8001

# Change port in .env
BACKEND_PORT=9000
```

---

### Container Exits Immediately

**Debug:**
```bash
docker-compose logs backend
```

**Common causes:**
- Missing `.env` file
- Invalid MongoDB URI
- Chrome installation failed

---

### Volume Not Persisting

**Check volume exists:**
```bash
docker volume ls | grep whatsapp
```

**Inspect volume:**
```bash
docker volume inspect monwa_whatsapp-sessions
```

---

### MongoDB Connection Refused

**Check MongoDB is running:**
```bash
docker-compose ps mongodb
```

**Check connection string:**
```bash
# Inside Docker, must use service name
MONGO_URI=mongodb://mongodb:27017  ✅
MONGO_URI=mongodb://localhost:27017  ❌
```

---

### Out of Memory

**Check resources:**
```bash
docker stats
```

**Requirements:**
- Each account: ~200MB RAM
- 5 accounts: minimum 2GB RAM

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory

---

## Optional Configurations

### Health Checks

Add to `docker-compose.yml`:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/api"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Resource Limits

```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 4G
      reservations:
        memory: 2G
```

### Log Rotation

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

---

## Additional Resources

- [README.md](README.md) — Main documentation
- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file)
