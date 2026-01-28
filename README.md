# WhatsApp Monitoring Platform

A production-grade system for monitoring multiple WhatsApp accounts through a single dashboard. Send and receive messages, capture snapshots, and forward webhooks — all without opening WhatsApp Web manually.

---

## 🎯 What This System Does

This platform allows you to:
- Monitor multiple WhatsApp accounts from one dashboard
- Authenticate accounts using QR codes (scan once, stays logged in)
- Capture screenshots of WhatsApp Web interface
- Receive incoming messages via webhooks
- Send text and media messages programmatically

**Key Philosophy:**
- **Snapshot-based:** View WhatsApp state on demand, not continuous streaming
- **Lightweight:** Uses existing WhatsApp Web pages, no new tabs per action
- **Multi-account:** Manage up to 5 accounts by default (configurable)
- **Session persistent:** Accounts stay logged in after server restarts

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Account Support** | Manage multiple WhatsApp accounts (limit set via ENV) |
| **Session Persistence** | Accounts stay logged in across restarts (no QR re-scan) |
| **Snapshot Capture** | Take screenshots of WhatsApp Web interface on demand |
| **Unified Webhooks** | Receive text and media messages in single payload format |
| **Send Messages** | Send text messages and images/PDFs programmatically |
| **Docker Ready** | One-command deployment with docker-compose |

---

## 🏗️ Architecture Overview

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
- **Backend:** Node.js with Express and whatsapp-web.js
- **Frontend:** React dashboard with Tailwind CSS
- **Database:** MongoDB (stores account metadata)
- **Browser:** Chrome via Puppeteer (managed by whatsapp-web.js)
- **Sessions:** LocalAuth saves WhatsApp login state to disk

---

## ⚙️ Environment Variables

All configuration is done via `.env` file:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | `mongodb://mongodb:27017` | Yes |
| `DB_NAME` | Database name | `whatsapp_monitor` | Yes |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` | No |
| `MAX_WHATSAPP_ACCOUNTS` | Maximum number of accounts | `5` | No |
| `NODE_ENV` | Node.js environment | `production` | No |

**Notes:**
- Use `mongodb://mongodb:27017` for Docker (service name)
- Use `mongodb://localhost:27017` for local development
- Changing `MAX_WHATSAPP_ACCOUNTS` requires server restart

---

## 🐳 Running with Docker (Recommended)

### Prerequisites

- Docker 20.x or later
- Docker Compose 2.x or later

### Step-by-Step

**1. Clone the repository**

```bash
git clone <repository-url>
cd whatsapp-monitoring-platform
```

**2. Create environment file**

```bash
cp .env.example .env
```

**3. Review and adjust settings (optional)**

```bash
nano .env
```

Change `MAX_WHATSAPP_ACCOUNTS` if needed. Default is 5.

**4. Start the system**

```bash
docker-compose up --build -d
```

This will:
- Build the backend Docker image
- Download MongoDB 7 image
- Create persistent volumes for sessions and database
- Start both containers in background

**5. Verify services are running**

```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS    PORTS
whatsapp-monitor-backend  Up        0.0.0.0:8001->8001/tcp
whatsapp-monitor-db       Up        27017/tcp
```

**6. Access the application**

- **Backend API:** http://localhost:8001/api
- **Frontend Dashboard:** http://localhost:3000 *(if frontend is built separately)*

**Health check:**

```bash
curl http://localhost:8001/api
```

Expected response:
```json
{"message":"WhatsApp Monitoring API v1.0"}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# MongoDB only
docker-compose logs -f mongodb
```

### Stop Services

```bash
# Stop (preserves sessions)
docker-compose down

# Stop and delete volumes (⚠️ deletes all sessions)
docker-compose down -v
```

---

## 💻 Running Locally (Optional)

### Prerequisites

- Node.js 18.x or 20.x
- MongoDB 7.x
- Chrome/Chromium (auto-installed by Puppeteer)

### Backend Setup

**1. Install MongoDB**

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**2. Navigate to backend**

```bash
cd backend
```

**3. Install dependencies**

```bash
yarn install
```

**4. Install Puppeteer Chrome**

```bash
npx puppeteer browsers install chrome
```

**5. Create environment file**

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

**6. Start backend**

```bash
node server.js
```

Expected output:
```
[DB] Connected to MongoDB
[Server] WhatsApp Monitoring API running on port 8001
```

### Frontend Setup (Optional)

If you want to use the React dashboard:

**1. Navigate to frontend**

```bash
cd frontend
```

**2. Install dependencies**

```bash
yarn install
```

**3. Create environment file**

```bash
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

**4. Start frontend**

```bash
yarn start
```

Dashboard opens at: http://localhost:3000

---

## 📡 API Overview

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts` | Create new WhatsApp account |
| GET | `/api/accounts` | List all accounts |
| GET | `/api/accounts/{id}` | Get account details |
| PUT | `/api/accounts/{id}/webhook` | Update webhook URL |
| DELETE | `/api/accounts/{id}` | Delete account |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/{id}/snapshot` | Capture WhatsApp screenshot |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts/{id}/messages/send` | Send text or media message |

### Examples

**Create Account:**

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support",
    "webhook_url": "https://your-webhook.com/whatsapp"
  }'
```

**Send Text Message:**

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "message": "Hello from API"
  }'
```

**Capture Snapshot:**

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}/snapshot -o snapshot.json
```

---

## 🪝 Webhook Overview

### How Webhooks Work

When you configure a `webhook_url` for an account, incoming WhatsApp messages are automatically forwarded to your endpoint via HTTP POST.

**Unified Payload Format:**

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

**For media messages, `media` object contains:**

```json
"media": {
  "mimetype": "image/jpeg",
  "filename": "photo.jpg",
  "size": 245680,
  "media_url": "https://storage.com/file.jpg",
  "duration": null
}
```

### Key Features

- **Text in media:** Caption is stored in `text` field (not separate)
- **Unified format:** One payload structure for all message types
- **No restart required:** Updating webhook URL does NOT restart WhatsApp session
- **Fire-and-forget:** 5-second timeout, no retries

### Testing Webhooks

Use [webhook.site](https://webhook.site) for testing:

1. Get a free webhook URL from webhook.site
2. Use it when creating an account
3. Send a message to your WhatsApp account
4. View the payload in webhook.site inspector

---

## ✅ Human QA Checklist

Follow these steps to verify the system works end-to-end:

### Step 1: Create Account

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Account",
    "webhook_url": "https://webhook.site/YOUR-ID"
  }'
```

Save the returned `id` value.

### Step 2: Get QR Code

Wait 5-10 seconds, then:

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

Response contains `qr_code` field with base64 PNG image.

### Step 3: Scan QR with Phone

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code (display on screen or save as image)

### Step 4: Wait for READY State

Poll account status:

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

Wait until `status` changes from `QR` → `AUTH` → `READY` (10-30 seconds).

### Step 5: Test Snapshot

```bash
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}/snapshot -o snapshot.json
```

Extract image:

```bash
cat snapshot.json | python3 -c "import sys, json, base64; s=json.load(sys.stdin)['snapshot'].split(',')[1]; open('whatsapp.png','wb').write(base64.b64decode(s))"
```

Open `whatsapp.png` — should show real WhatsApp Web interface.

### Step 6: Send Message from Phone

On your phone, send a message to any contact.

Check webhook.site — you should see the message payload within 5 seconds.

### Step 7: Send Message via API

```bash
curl -X POST http://localhost:8001/api/accounts/{ACCOUNT_ID}/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_PHONE_NUMBER",
    "message": "Test from API"
  }'
```

Message should appear on your phone within 10 seconds.

### Step 8: Test Session Persistence

```bash
# Stop backend
docker-compose restart backend

# Wait 20 seconds, then check
curl http://localhost:8001/api/accounts/{ACCOUNT_ID}
```

Account should be `READY` without QR re-scan.

✅ **All tests passed:** System is fully functional.

---

## 🔧 Troubleshooting

### Account Stuck in QR State

**Problem:** Account status doesn't change from `QR` after scanning.

**Solution:**
1. Check backend logs: `docker-compose logs backend`
2. Verify Chrome processes: `docker-compose exec backend ps aux | grep chrome`
3. If no Chrome processes, rebuild: `docker-compose up --build`

---

### Snapshot Returns "Account not ready"

**Problem:** Snapshot API returns error.

**Solution:**
- Account must be in `READY` state
- Check: `curl http://localhost:8001/api/accounts/{ACCOUNT_ID}`
- If status is `QR` or `INIT`, complete QR scan first

---

### Chrome Not Starting

**Problem:** Backend logs show "Chrome not found" or Puppeteer errors.

**Docker Solution:**
```bash
docker-compose down
docker-compose up --build
```

**Local Solution:**
```bash
cd backend
npx puppeteer browsers install chrome
```

---

### Port Already in Use

**Problem:** `docker-compose up` fails with port conflict.

**Solution:**

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "9000:8001"  # Change 8001 to 9000 (or any free port)
```

Then access API at: http://localhost:9000/api

---

### Session Lost After Restart

**Problem:** Account requires QR re-scan after restart.

**Cause:** Docker volume deleted or not mounted.

**Solution:**
1. Check volume exists: `docker volume ls | grep whatsapp-sessions`
2. Verify mount in docker-compose.yml:
   ```yaml
   volumes:
     - whatsapp-sessions:/app/backend/whatsapp-sessions
   ```
3. Never use `docker-compose down -v` in production (deletes volumes)

---

### Webhook Not Received

**Problem:** Messages sent to WhatsApp but webhook not triggered.

**Solution:**
1. Test webhook URL in browser (should be reachable)
2. Check webhook.site for request logs
3. Verify `webhook_url` in account: `curl http://localhost:8001/api/accounts/{ACCOUNT_ID}`
4. Send message from different contact (not yourself)

---

## 🚨 Important Notes

### Production Considerations

- **Add authentication:** This system has NO built-in API authentication
- **Limit CORS:** Change `CORS_ORIGINS=*` to specific domain
- **Use reverse proxy:** Put Nginx/Caddy in front for HTTPS
- **Monitor resources:** Each account uses ~200MB RAM
- **Backup sessions:** Regularly backup `/app/backend/whatsapp-sessions/`

### WhatsApp Limitations

- **QR expires:** QR codes expire every 60 seconds (new QR auto-generated)
- **Session revocation:** WhatsApp may revoke sessions if suspicious activity detected
- **Rate limits:** WhatsApp has undocumented rate limits on messages
- **Phone required:** Physical phone must stay online for WhatsApp to work

### System Limitations

- **Single server:** Cannot horizontally scale (Puppeteer sessions tied to process)
- **No browser reuse:** Each account = separate Chrome instance (by whatsapp-web.js design)
- **Manual QR:** Initial QR scan requires human intervention
- **No automation:** This is a monitoring tool, not a chatbot framework

---

## 📚 Additional Resources

- **Docker Deployment Guide:** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **whatsapp-web.js Documentation:** https://github.com/pedroslopez/whatsapp-web.js
- **Puppeteer Documentation:** https://pptr.dev

---

## 📝 License

MIT License - Use freely for commercial or personal projects.

---

## ⚠️ Disclaimer

This project is NOT affiliated with WhatsApp or Meta.

Use responsibly and respect WhatsApp Terms of Service.

Automated messaging may result in account bans.

---

**Status:** Production-ready | Requires QR scan for initial setup

**Version:** 1.0
