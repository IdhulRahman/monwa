# WhatsApp Monitoring Platform - Operations Runbook

**Quick Reference Guide for System Operators**

---

## 🚀 Quick Start Commands

### Docker (Recommended)

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Restart
docker-compose restart backend
```

### Health Check

```bash
curl http://localhost:8001/api
```

Expected: `{"message":"WhatsApp Monitoring API v1.0"}`

---

## 📋 Common Operations

### Create Account

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Support Bot","webhook_url":"https://webhook.site/xxx"}'
```

### List Accounts

```bash
curl http://localhost:8001/api/accounts
```

### Get Account Status

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

### Capture Snapshot

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}/snapshot -o snapshot.json
```

### Send Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","message":"Test message"}'
```

### Delete Account

```bash
curl -X DELETE http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

---

## 🔍 Troubleshooting

### Check Container Status

```bash
docker-compose ps
```

### View Backend Logs

```bash
docker-compose logs --tail=50 backend
```

### Check Chrome Processes

```bash
docker-compose exec backend ps aux | grep chrome | wc -l
```

Expected: 10-15 per account

### Check Session Files

```bash
docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
```

### Clean Restart (⚠️ Deletes Sessions)

```bash
docker-compose down -v
docker-compose up -d
```

---

## 📞 Emergency Procedures

### Backend Not Responding

```bash
docker-compose restart backend
```

### Out of Memory

```bash
# Check usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory: 4GB+
```

### Account Stuck in QR

```bash
# Delete and recreate account
curl -X DELETE http://localhost:8001/api/accounts/{ACCOUNT_ID}

# Create new account
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"New Account"}'
```

---

## 📊 Monitoring

### Check Account Statuses

```bash
curl -s http://localhost:8001/api/accounts | \
  python3 -c "import sys, json; [print(f'{a[\"name\"]}: {a[\"status\"]}') for a in json.load(sys.stdin)]"
```

### Count Active Accounts

```bash
curl -s http://localhost:8001/api/accounts | \
  python3 -c "import sys, json; print(f'Total: {len(json.load(sys.stdin))}')"
```

---

For detailed documentation, see:
- [README.md](README.md) - Full system documentation
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker guide

**Version:** 1.0
