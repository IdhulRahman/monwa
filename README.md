# WhatsApp Monitoring Platform

## 1. Project Overview

This is a production-grade system for monitoring multiple WhatsApp accounts through a single dashboard.

**What this system does:**
- Connect and manage multiple WhatsApp accounts
- Authenticate using QR codes (scan once, stays logged in)
- Capture on-demand screenshots of WhatsApp Web
- Receive incoming messages via webhooks
- Send text and media messages programmatically

**Core Philosophy:**
- **Snapshot-based monitoring** — View WhatsApp state on demand, not continuous streaming
- **Lightweight** — Reuses existing WhatsApp Web pages, no new browser tabs per action
- **Multi-account** — Manage up to 5 accounts by default (configurable via environment variable)
- **Session persistent** — Accounts stay logged in after server restarts (no QR re-scan)

**Technology:**
- WhatsApp Web integration via [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- Headless Chrome managed internally by Puppeteer

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Account Support** | Manage multiple WhatsApp accounts (limit configurable via ENV) |
| **Session Persistence** | Accounts stay logged in across restarts using LocalAuth |
| **Snapshot Capture** | Take screenshots of WhatsApp Web interface on demand |
| **Unified Webhooks** | Receive text and media messages in a single payload format |
| **Send Message API** | Send text messages and media (images, PDFs) programmatically |
| **Docker-Ready** | One-command deployment with docker-compose |

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
         └───────┬───────┘   └──────────────┘
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
              │                  │ Persist
              ↓                  ↓
         MongoDB          Docker Volume
      (Accounts DB)     (Session Files)
```

**Components:**

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Node.js + Express | REST API server |
| WhatsApp Client | whatsapp-web.js | Connects to WhatsApp Web |
| Browser | Puppeteer + Chrome | Renders WhatsApp Web (headless) |
| Frontend | React + Tailwind CSS | Dashboard UI |
| Database | MongoDB | Stores account metadata |
| Sessions | LocalAuth | Saves login state to disk |

---

## 4. Environment Variables

All configuration is done via `.env` file.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | `mongodb://mongodb:27017` | Yes |
| `DB_NAME` | Database name | `whatsapp_monitor` | Yes |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` | No |
| `MAX_WHATSAPP_ACCOUNTS` | Maximum number of accounts allowed | `5` | No |
| `NODE_ENV` | Node.js environment | `production` | No |

**Notes:**
- For Docker: use `mongodb://mongodb:27017` (service name)
- For local development: use `mongodb://localhost:27017`
- Changing `MAX_WHATSAPP_ACCOUNTS` requires a server restart to take effect

---

## 5. Running with Docker (Recommended)

### Prerequisites

- Docker 20.x or later
- Docker Compose 2.x or later

### Step-by-Step Instructions

**Step 1: Clone the repository**

```bash
git clone <repository-url>
cd whatsapp-monitoring-platform
```

**Step 2: Create the environment file**

```bash
cp .env.example .env
```

**Step 3: (Optional) Adjust settings**

Open `.env` and modify values if needed:

```bash
nano .env
```

Common changes:
- `MAX_WHATSAPP_ACCOUNTS=10` — increase account limit

**Step 4: Start the system**

```bash
docker-compose up --build -d
```

This command will:
1. Build the backend Docker image
2. Download MongoDB 7 image
3. Create persistent volumes for sessions and database
4. Start both containers in background

**Step 5: Verify services are running**

```bash
docker-compose ps
```

Expected output:

```
NAME                      STATUS    PORTS
whatsapp-monitor-backend  Up        0.0.0.0:8001->8001/tcp
whatsapp-monitor-db       Up        0.0.0.0:27017->27017/tcp
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

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8001/api |
| Frontend Dashboard | http://localhost:3000 (if running separately) |

### Common Docker Commands

```bash
# View logs (all services)
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Stop services (preserves sessions)
docker-compose down

# Stop and delete all data (⚠️ deletes sessions)
docker-compose down -v
```

For detailed Docker instructions, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

---

## 6. Running Locally (Optional)

### Prerequisites

- Node.js 18.x or 20.x
- MongoDB 7.x running locally
- Chrome/Chromium (auto-installed by Puppeteer)

### Backend Setup

**Step 1: Start MongoDB**

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS (Homebrew)
brew services start mongodb-community
```

**Step 2: Navigate to backend folder**

```bash
cd backend
```

**Step 3: Install dependencies**

```bash
yarn install
```

**Step 4: Install Chrome for Puppeteer**

```bash
npx puppeteer browsers install chrome
```

**Step 5: Create environment file**

```bash
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_monitor
PORT=8001
CORS_ORIGINS=*
MAX_WHATSAPP_ACCOUNTS=5
NODE_ENV=production
EOF
```

**Step 6: Start the backend**

```bash
node server.js
```

Expected output:

```
[Server] Database connected
[Server] Found 0 existing accounts
[Server] WhatsApp Monitoring API running on port 8001
```

### Frontend Setup (Optional)

**Step 1: Navigate to frontend folder**

```bash
cd frontend
```

**Step 2: Install dependencies**

```bash
yarn install
```

**Step 3: Create environment file**

```bash
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

**Step 4: Start the frontend**

```bash
yarn start
```

Dashboard opens at: http://localhost:3000

---

## 7. API Overview

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts` | Create new WhatsApp account |
| `GET` | `/api/accounts` | List all accounts |
| `GET` | `/api/accounts/{id}` | Get account details (includes QR code) |
| `PUT` | `/api/accounts/{id}/webhook` | Update webhook URL |
| `DELETE` | `/api/accounts/{id}` | Delete account and session |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts/{id}/snapshot` | Capture WhatsApp Web screenshot |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts/{id}/messages/send` | Send text or media message |

### Quick Examples

**Create an account:**

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Support Account", "webhook_url": "https://webhook.site/your-id"}'
```

**Get account details (includes QR code):**

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

**Capture snapshot:**

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}/snapshot
```

**Send text message:**

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to": "1234567890", "message": "Hello from API"}'
```

**Send media message:**

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to": "1234567890", "media_url": "https://example.com/image.jpg", "caption": "Check this out"}'
```

---

## 8. Webhook Overview

### How Webhooks Work

When you set a `webhook_url` for an account, incoming WhatsApp messages are automatically forwarded to your endpoint via HTTP POST.

### Unified Payload Format

Both text and media messages use the same structure:

```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "uuid",
  "message_id": "whatsapp_message_id",
  "timestamp": 1706400000,
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "from_me": false,
  "is_group": false,
  "type": "text",
  "text": "Message text or caption",
  "media": null
}
```

### Media Messages

For media messages, the `media` field contains:

```json
{
  "media": {
    "mimetype": "image/jpeg",
    "filename": "photo.jpg",
    "size": 245680,
    "media_url": "https://storage.com/file.jpg",
    "duration": null
  }
}
```

### Key Points

- **Caption in text field** — Media captions are stored in the `text` field
- **Unified format** — One payload structure for all message types
- **No restart required** — Updating webhook URL does NOT restart the WhatsApp session
- **Fire-and-forget** — 5-second timeout, no automatic retries

### Testing Webhooks

1. Go to [webhook.site](https://webhook.site) and get a free webhook URL
2. Use that URL when creating an account
3. Send a message to your WhatsApp account
4. View the payload in webhook.site inspector

---

## 9. Human QA Checklist

Follow these steps to verify the system works end-to-end.

### Step 1: Create an Account

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Account", "webhook_url": "https://webhook.site/YOUR-ID"}'
```

Save the returned `id` value.

### Step 2: Get the QR Code

Wait 5-10 seconds for the WhatsApp client to initialize, then:

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

The response contains `qr_code` field with a base64-encoded PNG image.

### Step 3: Scan QR with Your Phone

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code

### Step 4: Wait for READY Status

Poll the account status:

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

Wait until `status` changes: `QR` → `AUTH` → `READY` (takes 10-30 seconds)

### Step 5: Test Snapshot

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}/snapshot -o snapshot.json
```

Extract the image:

```bash
cat snapshot.json | python3 -c "import sys, json, base64; s=json.load(sys.stdin)['snapshot'].split(',')[1]; open('whatsapp.png','wb').write(base64.b64decode(s))"
```

Open `whatsapp.png` — you should see the real WhatsApp Web interface.

### Step 6: Test Webhook (Receive Message)

From your phone, send a message to any contact.

Check webhook.site — you should see the message payload within 5 seconds.

### Step 7: Test Send Message

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to": "YOUR_PHONE_NUMBER", "message": "Test from API"}'
```

The message should appear on your phone within 10 seconds.

### Step 8: Test Session Persistence

```bash
# Restart the backend
docker-compose restart backend

# Wait 20 seconds, then check status
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

Account should still be `READY` without requiring a QR re-scan.

✅ **All tests passed** — System is fully functional.

---

## 10. Troubleshooting

### Account Stuck in QR State

**Problem:** Account status doesn't change from `QR` after scanning.

**Solution:**
1. Check backend logs: `docker-compose logs backend`
2. Verify Chrome is running: `docker-compose exec backend ps aux | grep chrome`
3. If no Chrome processes, rebuild: `docker-compose up --build -d`

---

### Snapshot Returns "Account not ready"

**Problem:** Snapshot API returns `ACCOUNT_NOT_READY` error.

**Solution:**
- Account must be in `READY` state before taking snapshots
- Check status: `curl http://localhost:8001/api/accounts/{ACCOUNT_ID}`
- If status is `QR` or `INIT`, complete the QR scan first

---

### Chrome Not Starting

**Problem:** Backend logs show "Chrome not found" or Puppeteer errors.

**Docker Solution:**
```bash
docker-compose down
docker-compose up --build -d
```

**Local Solution:**
```bash
cd backend
npx puppeteer browsers install chrome
```

---

### Port Already in Use

**Problem:** `docker-compose up` fails with "port already allocated".

**Solution:**

1. Find what's using the port:
   ```bash
   sudo lsof -i :8001
   ```

2. Either stop that process, or change the port in `docker-compose.yml`:
   ```yaml
   services:
     backend:
       ports:
         - "9000:8001"  # Change external port to 9000
   ```

3. Access API at: http://localhost:9000/api

---

### Session Lost After Restart

**Problem:** Account requires QR re-scan after restart.

**Cause:** Docker volume was deleted.

**Solution:**
1. Check volume exists: `docker volume ls | grep whatsapp-sessions`
2. Never use `docker-compose down -v` in production (this deletes volumes)
3. Verify volume mount in `docker-compose.yml`:
   ```yaml
   volumes:
     - whatsapp-sessions:/app/backend/whatsapp-sessions
   ```

---

### Webhook Not Received

**Problem:** Messages sent to WhatsApp but webhook not triggered.

**Solution:**
1. Verify webhook URL is accessible from the server
2. Check webhook.site for request logs
3. Verify `webhook_url` is set: `curl http://localhost:8001/api/accounts/{ACCOUNT_ID}`
4. Send message from a different contact (not yourself)

---

## Additional Resources

- **Docker Deployment Guide:** [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **whatsapp-web.js Documentation:** https://github.com/pedroslopez/whatsapp-web.js
- **Puppeteer Documentation:** https://pptr.dev

---

## Important Notes

### Production Considerations

- **Add authentication** — This system has NO built-in API authentication
- **Limit CORS** — Change `CORS_ORIGINS=*` to your specific domain
- **Use reverse proxy** — Put Nginx/Caddy in front for HTTPS
- **Monitor resources** — Each account uses ~200MB RAM
- **Backup sessions** — Regularly backup the `whatsapp-sessions` volume

### WhatsApp Limitations

- **QR expires** — QR codes expire every 60 seconds (new QR auto-generated)
- **Session revocation** — WhatsApp may revoke sessions if suspicious activity detected
- **Rate limits** — WhatsApp has undocumented rate limits on messages
- **Phone required** — Physical phone must stay online for WhatsApp Web to work

### System Limitations

- **Single server** — Cannot horizontally scale (Puppeteer sessions tied to process)
- **One Chrome per account** — Each account runs a separate Chrome instance
- **Manual QR** — Initial QR scan requires human intervention
- **Monitoring only** — This is a monitoring tool, not a chatbot framework

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
