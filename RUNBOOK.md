# WhatsApp Monitoring Platform - Operations Runbook

Quick reference guide for system operators and QA.

---

## Quick Start

```bash
# Start system
docker-compose up -d

# Health check
curl http://localhost:8001/api
# Expected: {"message":"WhatsApp Monitoring API v1.0"}

# View logs
docker-compose logs -f backend

# Stop system
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

Save the returned `id`.

### 2. Get QR Code

```bash
curl http://localhost:8001/api/accounts/{ID}
```

Response includes `qr_code` (base64 PNG) and `status`.

### 3. Scan QR

1. Open WhatsApp on phone
2. Settings → Linked Devices → Link a Device
3. Scan QR code

### 4. Verify READY

```bash
curl http://localhost:8001/api/accounts/{ID}
```

Status progression: `INIT` → `QR` → `AUTH` → `READY`

---

## Common Operations

### List All Accounts

```bash
curl http://localhost:8001/api/accounts
```

### Get Account Status

```bash
curl http://localhost:8001/api/accounts/{ID}
```

### Capture Snapshot

```bash
curl http://localhost:8001/api/accounts/{ID}/snapshot -o snapshot.json
```

### Send Text Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","message":"Hello"}'
```

### Send Media Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","media_url":"https://example.com/image.jpg","caption":"Check this"}'
```

### Update Webhook

```bash
curl -X PUT http://localhost:8001/api/accounts/{ID}/webhook \
  -H "Content-Type: application/json" \
  -d '{"webhook_url":"https://new-webhook.com/endpoint"}'
```

### Delete Account

```bash
curl -X DELETE http://localhost:8001/api/accounts/{ID}
```

---

## Monitoring

### Check All Account Statuses

```bash
curl -s http://localhost:8001/api/accounts | \
  python3 -c "import sys,json;[print(f'{a[\"name\"]}: {a[\"status\"]}') for a in json.load(sys.stdin)]"
```

### Count Accounts

```bash
curl -s http://localhost:8001/api/accounts | \
  python3 -c "import sys,json;print(f'Total: {len(json.load(sys.stdin))}')"
```

### Check Chrome Processes

```bash
docker-compose exec backend ps aux | grep chrome | wc -l
```

Expected: 10-15 processes per account.

### Check Session Files

```bash
docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
```

---

## Troubleshooting

### Backend Not Responding

```bash
docker-compose restart backend
```

### Account Stuck in QR

1. Check logs: `docker-compose logs --tail=50 backend`
2. Delete and recreate:
   ```bash
   curl -X DELETE http://localhost:8001/api/accounts/{ID}
   ```

### Out of Memory

```bash
# Check usage
docker stats

# Each account uses ~200MB RAM
# For 5 accounts: need 2GB+ RAM
```

### Clean Restart (Deletes All Sessions)

```bash
docker-compose down -v
docker-compose up -d
```

---

## Emergency Recovery

### Backup Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/sessions-backup.tar.gz -C /data .
```

### Restore Sessions

```bash
docker run --rm \
  -v whatsapp-monitoring-platform_whatsapp-sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/sessions-backup.tar.gz -C /data

docker-compose restart backend
```

---

## QA Verification Checklist

1. ☐ Create account → Returns `id`
2. ☐ Get account → Shows `qr_code` and `status: QR`
3. ☐ Scan QR with phone
4. ☐ Poll status → Changes to `READY`
5. ☐ Capture snapshot → Returns base64 image
6. ☐ Send message → Appears on phone
7. ☐ Receive message → Webhook triggered
8. ☐ Restart backend → Account stays `READY`

---

For detailed documentation:
- [README.md](README.md) — Full system documentation
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) — Docker-specific guide
