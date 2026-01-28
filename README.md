# WhatsApp Monitoring Platform

A production-grade system for monitoring multiple WhatsApp accounts through a single dashboard.

---

## 1. Project Overview

This platform enables you to:
- Connect and manage multiple WhatsApp accounts
- Authenticate using QR codes (scan once, stays logged in)
- Capture on-demand screenshots of WhatsApp Web
- Receive incoming messages via webhooks
- Send text and media messages programmatically

**Core Philosophy:**
- **Snapshot-based monitoring** — View WhatsApp state on demand, not continuous streaming
- **Lightweight** — Reuses existing browser pages, no new tabs per action
- **Multi-account** — Manage multiple accounts (limit configurable)
- **Session persistent** — Accounts stay logged in after server restarts
- **Single configuration** — One `.env` file controls everything

Inspired by WAHA, but designed for multi-account monitoring with a lighter footprint.

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| Multi-Account Support | Manage multiple WhatsApp accounts (ENV-limited) |
| Session Persistence | LocalAuth keeps accounts logged in across restarts |
| Snapshot Capture | On-demand screenshots of WhatsApp Web UI |
| Unified Webhooks | Text + media messages in single payload format |
| Send Message API | Send text, images, and PDFs programmatically |
| Docker-Ready | One-command deployment with docker-compose |
| Single Global ENV | All configuration in one `.env` file |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  User / Operator                    │
│              (Browser + Physical Phone)             │
└────────────────┬───────────────────┬────────────────┘
                 │                   │
                 │ HTTP              │ QR Scan
                 ↓                   ↓
         ┌───────────────┐   ┌──────────────┐
         │  React UI     │   │   WhatsApp   │
         │  (Dashboard)  │   │   Mobile App │
         │  Port 3000    │   └──────────────┘
         └───────┬───────┘
                 │
                 │ API Calls
                 ↓
         ┌───────────────────────────────────┐
         │   Node.js Backend (Port 8001)     │
         │                                   │
         │  ┌────────────────────────────┐  │
         │  │   whatsapp-web.js          │  │
         │  │   (WhatsApp Web Client)    │  │
         │  └──────────┬─────────────────┘  │
         │             │                     │
         │    ┌────────┴────────┐           │
         │    ↓                 ↓           │
         │  Chrome          Sessions        │
         │  (Puppeteer)     (LocalAuth)     │
         └────┬──────────────────┬──────────┘
              │                  │
              ↓                  ↓
         MongoDB          Docker Volume
      (Port 27017)      (Session Files)
```

**Components:**

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Node.js + Express | REST API server |
| WhatsApp Client | whatsapp-web.js | Connects to WhatsApp Web |
| Browser | Puppeteer + Chrome | Renders WhatsApp (headless) |
| Frontend | React + Tailwind | Dashboard UI |
| Database | MongoDB | Account metadata storage |
| Sessions | LocalAuth | Persists login state to disk |
| Configuration | Single `.env` | Shared by all services |

---

## 4. Environment Variables

⚠️ **All configuration is controlled via ONE `.env` file in the repository root.**

Copy `.env.example` to `.env` before starting:

```bash
cp .env.example .env
```

### Full Variable Reference

| Variable | Description | Default | Required | Affects |
|----------|-------------|---------|----------|---------|
| `BACKEND_PORT` | Backend API port | `8001` | Yes | Backend, Docker |
| `FRONTEND_PORT` | Dashboard UI port | `3000` | Yes | Frontend, Docker |
| `MONGO_PORT` | MongoDB port | `27017` | Yes | Database, Docker |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongodb:27017` | Yes | Backend |
| `DB_NAME` | Database name | `whatsapp_monitor` | Yes | Backend |
| `MAX_WHATSAPP_ACCOUNTS` | Maximum accounts allowed | `5` | No | Backend |
| `SNAPSHOT_DELAY_MIN` | Min snapshot delay (ms) | `2000` | No | Backend |
| `SNAPSHOT_DELAY_MAX` | Max snapshot delay (ms) | `4000` | No | Backend |
| `WEBHOOK_TIMEOUT` | Webhook HTTP timeout (ms) | `5000` | No | Backend |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | No | Backend |
| `NODE_ENV` | Environment mode | `production` | No | Backend |

### Notes

- **For Docker:** Use `MONGO_URI=mongodb://mongodb:27017` (service name)
- **For Local:** Use `MONGO_URI=mongodb://localhost:27017`
- **Changing ports:** Update `.env` and restart services
- **Account limit:** Requires server restart to take effect

---

## 5. Running with Docker (Recommended)

### Prerequisites

- Docker 20.x or later
- Docker Compose 2.x or later

### Step-by-Step

**Step 1: Clone the repository**

```bash
git clone <repository-url>
cd whatsapp-monitoring-platform
```

**Step 2: Create environment file**

```bash
cp .env.example .env
```

Or copy from the visible text file:

```bash
cp .env.example.txt .env
```

**Step 3: Adjust settings (optional)**

```bash
nano .env
```

Common changes:
- `MAX_WHATSAPP_ACCOUNTS=10` — increase account limit
- `BACKEND_PORT=9000` — change API port

**Step 4: Start the system**

```bash
docker-compose up --build -d
```

This will:
1. Build the backend Docker image
2. Download MongoDB 7 image
3. Create persistent volumes
4. Start all services

**Step 5: Verify services**

```bash
docker-compose ps
```

Expected output:

```
NAME                        STATUS    PORTS
whatsapp-monitor-backend    Up        0.0.0.0:8001->8001/tcp
whatsapp-monitor-frontend   Up        0.0.0.0:3000->3000/tcp
whatsapp-monitor-db         Up        0.0.0.0:27017->27017/tcp
```

**Step 6: Test the API**

```bash
curl http://localhost:8001/api
```

Expected response:

```json
{"message":"WhatsApp Monitoring API v1.0"}
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | React UI |
| **Backend API** | http://localhost:8001/api | REST API endpoints |
| **MongoDB** | localhost:27017 | Database (internal use) |

### View Logs

```bash
# All services
docker-compose logs -f

# Frontend only
docker-compose logs -f frontend

# Backend only
docker-compose logs -f backend
```

For more Docker details, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

---

## 6. Running Locally (Optional)

### Prerequisites

- Node.js 18.x or 20.x
- MongoDB 7.x running locally
- Chrome (auto-installed by Puppeteer)

### Step-by-Step

**Step 1: Create environment file**

```bash
cp .env.example .env
```

**Step 2: Update MongoDB URI for local**

Edit `.env`:

```env
MONGO_URI=mongodb://localhost:27017
```

**Step 3: Start MongoDB**

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS (Homebrew)
brew services start mongodb-community
```

**Step 4: Install backend dependencies**

```bash
cd backend
yarn install
npx puppeteer browsers install chrome
```

**Step 5: Start the backend**

```bash
node server.js
```

Expected output:

```
[DB] Connecting to MongoDB: mongodb://localhost:27017/whatsapp_monitor
[DB] Connected to MongoDB
[Server] WhatsApp Monitoring API running on port 8001
```

**Step 6: Install frontend dependencies**

```bash
cd frontend
yarn install
```

**Step 7: Start the frontend**

```bash
yarn start
```

### Access Points (Local)

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:8001/api |
| **Dashboard** | http://localhost:3000 |

---

## 7. API Overview

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts` | Create new account |
| `GET` | `/api/accounts` | List all accounts |
| `GET` | `/api/accounts/{id}` | Get account details |
| `GET` | `/api/accounts/{id}/qr` | Get QR code only |
| `PUT` | `/api/accounts/{id}/webhook` | Update webhook URL |
| `DELETE` | `/api/accounts/{id}` | Delete account |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts/{id}/snapshot` | Capture screenshot |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts/{id}/messages/send` | Send message |

---

## 8. Webhook Overview

### How It Works

When you set a `webhook_url` for an account, incoming WhatsApp messages are automatically forwarded via HTTP POST.

### Unified Payload Format

Both text and media messages use the same structure:

```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "uuid",
  "message_id": "whatsapp_id",
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "body": "Message text or caption",
  "type": "chat",
  "timestamp": 1706400000,
  "has_media": false
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `event` | Always `message` |
| `direction` | Always `inbound` for received messages |
| `account_id` | Your WhatsApp account UUID |
| `from` | Sender phone number |
| `to` | Recipient (your account) |
| `body` | Message text or media caption |
| `type` | Message type (chat, image, document) |
| `timestamp` | Unix timestamp |
| `has_media` | Boolean indicating media attachment |

### Important Notes

- **Webhook update does NOT restart session** — Safe to change anytime
- **Timeout configurable** — Set `WEBHOOK_TIMEOUT` in `.env`
- **Fire-and-forget** — No automatic retries on failure

### Testing Webhooks

1. Go to [webhook.site](https://webhook.site)
2. Copy your unique webhook URL
3. Use it when creating an account
4. Send a message to your WhatsApp
5. View payload in webhook.site

---

## 9. Human QA Checklist

Follow these steps to verify the system end-to-end.

### Step 1: Create Account

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Account","webhook_url":"https://webhook.site/YOUR-ID"}'
```

Save the returned `id`.

### Step 2: Get QR Code

Wait 5-10 seconds, then:

```bash
curl http://localhost:8001/api/accounts/{ID}
```

Response contains `qr_code` (base64 PNG).

### Step 3: Scan QR with Phone

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code

### Step 4: Wait for READY

Poll status:

```bash
curl http://localhost:8001/api/accounts/{ID}
```

Status progression: `INIT` → `QR` → `AUTH` → `READY`

### Step 5: Capture Snapshot

```bash
curl http://localhost:8001/api/accounts/{ID}/snapshot -o snapshot.json
```

Extract image:

```bash
cat snapshot.json | python3 -c "import sys,json,base64;s=json.load(sys.stdin)['snapshot'].split(',')[1];open('whatsapp.png','wb').write(base64.b64decode(s))"
```

### Step 6: Send Text Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"PHONE_NUMBER","message":"Hello from API"}'
```

### Step 7: Send Media Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"PHONE_NUMBER","media_url":"https://example.com/image.jpg","caption":"Check this"}'
```

### Step 8: Test Webhook

Send a message TO your WhatsApp from another phone.

Check webhook.site for the payload.

### Step 9: Test Session Persistence

```bash
docker-compose restart backend
# Wait 20 seconds
curl http://localhost:8001/api/accounts/{ID}
```

Account should still be `READY`.

✅ **All tests passed** — System is fully functional.

---

## 10. Troubleshooting

### QR Stuck State

**Problem:** Account status stays at `QR` after scanning.

**Solutions:**
1. Check logs: `docker-compose logs backend`
2. Verify Chrome: `docker-compose exec backend ps aux | grep chrome`
3. Delete and recreate account

---

### Chrome Not Launching

**Problem:** Puppeteer errors in logs.

**Docker:**
```bash
docker-compose down
docker-compose up --build -d
```

**Local:**
```bash
cd backend
npx puppeteer browsers install chrome
```

---

### Snapshot Returns ACCOUNT_NOT_READY

**Problem:** Snapshot API returns error.

**Solution:**
- Account must be in `READY` state
- Complete QR scan first
- Check: `curl http://localhost:8001/api/accounts/{ID}`

---

### Port Conflict

**Problem:** Service fails to start due to port in use.

**Solution:**

1. Find what's using the port:
   ```bash
   sudo lsof -i :8001
   ```

2. Change port in `.env`:
   ```env
   BACKEND_PORT=9000
   ```

3. Restart:
   ```bash
   docker-compose up -d
   ```

---

### Docker Volume Permission Issues

**Problem:** Session files not persisting.

**Solution:**

1. Check volume:
   ```bash
   docker volume ls | grep whatsapp-sessions
   ```

2. Inspect permissions:
   ```bash
   docker-compose exec backend ls -la /app/backend/whatsapp-sessions/
   ```

3. If needed, recreate volume:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

---

### Session Lost After Restart

**Problem:** Account requires QR re-scan.

**Cause:** Volume deleted or not mounted.

**Solution:**
- Never use `docker-compose down -v` in production
- Verify volume mount in `docker-compose.yml`

---

## Additional Resources

- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) — Docker-specific guide
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) — WhatsApp client library
- [Puppeteer](https://pptr.dev) — Browser automation

---

## License

MIT License — Use freely for commercial or personal projects.

---

## Disclaimer

This project is NOT affiliated with WhatsApp or Meta.

Use responsibly and respect WhatsApp Terms of Service.

Automated messaging may result in account bans.

---

**Version:** 1.0
