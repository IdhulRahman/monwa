# WhatsApp Monitoring Platform

Production-grade WhatsApp monitoring system with multi-account support, snapshot capture, webhook forwarding, and message sending capabilities.

**Status:** Engineering Complete | Blocked by Manual QR Scan for Full Verification

---

## 🎯 Overview

A lightweight, self-hosted WhatsApp monitoring platform built with:
- **Backend:** Node.js + Express + whatsapp-web.js
- **Frontend:** React + shadcn/ui + Tailwind CSS
- **Database:** MongoDB
- **Browser Automation:** Puppeteer + Chromium

Monitor multiple WhatsApp accounts, capture snapshots, receive webhooks for incoming messages, and send messages programmatically.

---

## ✨ Features

### Core Capabilities
- ✅ **Multi-Account Management** (ENV-based limit, default 5)
- ✅ **QR Code Authentication** (scan with phone, session persists)
- ✅ **Session Persistence** (survives server restart, no re-auth required)
- ✅ **Snapshot Capture** (screenshot existing WhatsApp page, 2-4s delay)
- ✅ **Webhook Forwarding** (inbound messages to your endpoint)
- ✅ **Send Messages** (text + media: image/pdf)
- ✅ **Docker Support** (single-container deployment)
- ✅ **Real WhatsApp Web Client** (not mock, uses whatsapp-web.js)

### Architecture Highlights
- **Session Persistence:** LocalAuth strategy saves WhatsApp sessions to disk
- **Browser Reuse:** Each account reuses its own Puppeteer page (no new tabs for snapshots)
- **Webhook Isolation:** Update webhook URL without restarting WhatsApp session
- **Multi-Account Limit:** Enforced at database level via MAX_WHATSAPP_ACCOUNTS
- **Snapshot Delay:** Artificial 2-4 second delay before capture for realistic timing

---

## 🚀 Quick Start

### Local Development

```bash
# Start MongoDB
sudo systemctl start mongodb

# Install backend dependencies
cd backend
yarn install
npx puppeteer browsers install chrome

# Start backend
node server.js
```

Backend runs on `http://localhost:8001`

### Docker Deployment

```bash
docker-compose up -d
```

Access API: `http://localhost:8001/api`

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for details.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts` | Create new WhatsApp account |
| GET | `/api/accounts` | List all accounts |
| GET | `/api/accounts/{id}` | Get account details |
| PUT | `/api/accounts/{id}/webhook` | Update webhook URL |
| DELETE | `/api/accounts/{id}` | Delete account + session |
| GET | `/api/accounts/{id}/snapshot` | Capture WhatsApp screenshot |
| POST | `/api/accounts/{id}/messages/send` | Send text/media message |

Full API documentation: [API_REFERENCE.md](API_REFERENCE.md)

---

## 🔐 Account Lifecycle

```
INIT → QR → AUTH → READY
```

1. **INIT:** Account created, WhatsApp client initializing
2. **QR:** QR code generated, scan with phone required
3. **AUTH:** Authentication in progress
4. **READY:** Session active, can send/receive messages

**Session Restoration:**
After server restart, accounts with saved sessions skip QR and go directly to READY.

---

## 📸 Snapshot System

**How it works:**
- Captures screenshot from **existing** WhatsApp Web page
- NO new browser tabs created
- 2-4 second randomized delay before capture
- Only works when account status = READY

**Example:**
```bash
curl http://localhost:8001/api/accounts/{accountId}/snapshot
```

Returns base64-encoded PNG image.

---

## 🪝 Webhook Integration

Configure webhook URL to receive incoming WhatsApp messages:

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "webhook_url": "https://your-server.com/webhook"
  }'
```

**Webhook receives:**
- Text messages
- Media messages (image, audio, video, document)
- Group messages
- Message metadata (sender, timestamp, type)

See [WEBHOOK_TEMPLATES.md](WEBHOOK_TEMPLATES.md) for payload structure.

---

## 💬 Send Messages

### Text Message
```bash
curl -X POST http://localhost:8001/api/accounts/{accountId}/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "message": "Hello from WhatsApp Monitor"
  }'
```

### Image Message
```bash
curl -X POST http://localhost:8001/api/accounts/{accountId}/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "media_url": "https://example.com/image.jpg",
    "caption": "Check this out"
  }'
```

**Supported Media:**
- `image/jpeg`, `image/png`
- `application/pdf`
- Max 10MB file size

---

## ⚙️ Configuration

Environment variables (`.env`):

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_monitor
MAX_WHATSAPP_ACCOUNTS=5
CORS_ORIGINS=*
PORT=8001
```

**MAX_WHATSAPP_ACCOUNTS:**
- Limits concurrent WhatsApp accounts
- HTTP 429 returned when limit reached
- Delete account to free slot
- Requires server restart to apply changes

---

## 🐳 Docker

Session persistence via volume mount:

```yaml
volumes:
  - whatsapp-sessions:/app/backend/whatsapp-sessions
```

**Behavior:**
- **Container restart:** Sessions persist, no QR re-scan ✅
- **Container rebuild (with volume):** Sessions persist ✅
- **Volume deletion:** Sessions lost, QR re-scan required ✅

---

## 🔒 Security Notes

- **No authentication:** Add API authentication (JWT) before production
- **No rate limiting:** Protect endpoints from abuse
- **Webhook timeout:** 5 seconds (fire-and-forget, no retries)
- **Session storage:** Keep `/app/backend/whatsapp-sessions/` secure

---

## 📊 System Requirements

**Minimum:**
- 2GB RAM (multiple WhatsApp clients + Chrome)
- 2 CPU cores
- 10GB disk space

**Recommended:**
- 4GB RAM
- 4 CPU cores
- 20GB disk space

---

## 🧪 Testing Status

| Feature | Runtime Verified | Blocked By |
|---------|------------------|------------|
| Multi-account limit | ✅ Yes | - |
| QR code generation | ✅ Yes | - |
| Chrome/Puppeteer launch | ✅ Yes | - |
| Session persistence | ✅ Yes | - |
| Session restoration | ✅ Yes | - |
| Snapshot API | ⏸️ No | QR scan required |
| Webhook forwarding | ⏸️ No | QR scan + incoming message |
| Send message | ⏸️ No | QR scan required |

**Why Blocked:**
Requires physical phone to scan QR code and reach READY state.

See [PROGRESS_AUDIT.md](PROGRESS_AUDIT.md) for detailed audit report.

---

## 📚 Documentation

- [API Reference](API_REFERENCE.md) - Full API documentation
- [Webhook Templates](WEBHOOK_TEMPLATES.md) - Inbound/outbound webhook payloads
- [Docker Deployment](DOCKER_DEPLOYMENT.md) - Container setup guide
- [Progress Audit](PROGRESS_AUDIT.md) - Engineering completion report

---

## 🚫 What This Is NOT

- ❌ Chatbot framework
- ❌ Bulk messaging platform
- ❌ Message scheduler
- ❌ Auto-responder
- ❌ CRM system

This is a **monitoring and observability platform** for WhatsApp Web.

---

## 🛠️ Troubleshooting

**Chrome not found:**
```bash
cd /app/backend
npx puppeteer browsers install chrome
```

**MongoDB connection failed:**
```bash
sudo systemctl start mongodb
```

**Account stuck in QR state:**
- Expected behavior - scan QR with phone
- QR expires after ~60 seconds, new QR generated automatically

**Session lost after restart:**
- Check volume mount in docker-compose.yml
- Verify `/app/backend/whatsapp-sessions/` directory exists

---

## 📝 License

MIT License - use freely for commercial or personal projects.

---

## 🤝 Contributing

This is a production system. No new features accepted at this stage.

For issues related to:
- whatsapp-web.js → https://github.com/pedroslopez/whatsapp-web.js
- Puppeteer → https://github.com/puppeteer/puppeteer

---

## ⚠️ Disclaimer

This project is NOT affiliated with WhatsApp or Meta.

Use responsibly. Respect WhatsApp Terms of Service.

Automated messaging may result in account bans.

---

**Status:** Engineering Complete | Ready for Human QA after QR scan
