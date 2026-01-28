# Operations Runbook

Quick reference for operators and QA.

---

## Access Points

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8001/api |

---

## Quick Start

```bash
# Start all services
docker-compose up -d

# Health check
curl http://localhost:8001/api

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Account Lifecycle

### 1. Create Account

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"My Account","webhook_url":"https://webhook.site/xxx"}'
```

### 2. Get QR Code

```bash
curl http://localhost:8001/api/accounts/{ID}
```

### 3. Scan QR

1. WhatsApp → Settings → Linked Devices
2. Scan QR code

### 4. Verify READY

```bash
curl http://localhost:8001/api/accounts/{ID}
```

Status: `INIT` → `QR` → `AUTH` → `READY`

---

## API Quick Reference

| Action | Command |
|--------|---------|
| List accounts | `curl http://localhost:8001/api/accounts` |
| Get account | `curl http://localhost:8001/api/accounts/{ID}` |
| Snapshot | `curl http://localhost:8001/api/accounts/{ID}/snapshot` |
| Send text | `curl -X POST .../messages/send -d '{"to":"NUM","message":"Hi"}'` |
| Delete | `curl -X DELETE http://localhost:8001/api/accounts/{ID}` |

---

## Monitoring

### Account Statuses

```bash
curl -s http://localhost:8001/api/accounts | \
  python3 -c "import sys,json;[print(f'{a[\"name\"]}: {a[\"status\"]}') for a in json.load(sys.stdin)]"
```

### Chrome Processes

```bash
docker-compose exec backend ps aux | grep chrome | wc -l
```

Expected: 10-15 per account

### Session Files

```bash
docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend not responding | `docker-compose restart backend` |
| Account stuck in QR | Delete and recreate account |
| Out of memory | Check `docker stats`, increase RAM |
| Session lost | Check volume: `docker volume ls` |

### Clean Restart (Deletes Sessions)

```bash
docker-compose down -v
docker-compose up -d
```

---

## QA Checklist

- [ ] Create account → Returns ID
- [ ] Get account → Shows QR code
- [ ] Scan QR → Phone linked
- [ ] Status → Changes to READY
- [ ] Snapshot → Returns image
- [ ] Send message → Appears on phone
- [ ] Receive message → Webhook triggered
- [ ] Restart → Account stays READY

---

## Access Points

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8001/api |
| Dashboard | http://localhost:3000 |

---

See [README.md](README.md) for full documentation.
