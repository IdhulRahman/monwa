# Monwa - WhatsApp Monitoring Platform PRD

## Original Problem Statement

Build a modern, production-grade WhatsApp monitoring platform with:
- Real WhatsApp client using `whatsapp-web.js`
- Multi-account support with persistent sessions
- Snapshot-based UI monitoring (on-demand screenshots)
- Scalable, efficient architecture
- Single global configuration file

Inspired by WAHA but designed for multi-account monitoring with a lighter footprint.

---

## What's Been Implemented

### Core Features ✅
- [x] Multi-account WhatsApp management
- [x] QR code authentication
- [x] Session persistence (LocalAuth)
- [x] On-demand screenshot capture
- [x] Unified webhook system
- [x] Send message API (text + media)
- [x] Docker deployment

### Configuration ✅ (Dec 2025)
- [x] Single global `.env` file
- [x] Configurable ports (BACKEND_PORT, FRONTEND_PORT, MONGO_PORT)
- [x] Configurable limits (MAX_WHATSAPP_ACCOUNTS)
- [x] Configurable delays (SNAPSHOT_DELAY_MIN/MAX)
- [x] Configurable timeouts (WEBHOOK_TIMEOUT)

### Documentation ✅ (Dec 2025)
- [x] README.md with 10-section structure
- [x] DOCKER_DEPLOYMENT.md
- [x] RUNBOOK.md for operators
- [x] .env.example

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express |
| Frontend | React + Tailwind |
| WhatsApp | whatsapp-web.js + Puppeteer |
| Database | MongoDB |
| Config | Single .env file |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| BACKEND_PORT | 8001 | API server port |
| FRONTEND_PORT | 3000 | Dashboard port |
| MONGO_PORT | 27017 | Database port |
| MONGO_URI | mongodb://mongodb:27017 | Connection string |
| DB_NAME | whatsapp_monitor | Database name |
| MAX_WHATSAPP_ACCOUNTS | 5 | Account limit |
| SNAPSHOT_DELAY_MIN | 2000 | Min delay (ms) |
| SNAPSHOT_DELAY_MAX | 4000 | Max delay (ms) |
| WEBHOOK_TIMEOUT | 5000 | HTTP timeout (ms) |
| CORS_ORIGINS | * | Allowed origins |
| NODE_ENV | production | Environment |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api | Health check |
| POST | /api/accounts | Create account |
| GET | /api/accounts | List accounts |
| GET | /api/accounts/{id} | Get account |
| GET | /api/accounts/{id}/qr | Get QR code |
| PUT | /api/accounts/{id}/webhook | Update webhook |
| GET | /api/accounts/{id}/snapshot | Take screenshot |
| POST | /api/accounts/{id}/messages/send | Send message |
| DELETE | /api/accounts/{id} | Delete account |

---

## Current Status

**Phase:** Human QA / Production Ready

**Blocker:** Manual QR scan required (expected behavior)

---

## Backlog

### P1 (High Priority)
- [ ] API authentication layer
- [ ] Rate limiting

### P2 (Medium Priority)
- [ ] Message history storage
- [ ] Webhook retry logic

### P3 (Low Priority)
- [ ] Group message support
- [ ] Scheduled messages

---

## Key Files

| File | Purpose |
|------|---------|
| /app/.env | Global configuration |
| /app/README.md | Main documentation |
| /app/DOCKER_DEPLOYMENT.md | Docker guide |
| /app/RUNBOOK.md | Operations guide |
| /app/backend/server.js | Backend entry |
| /app/backend/managers/ClientManager.js | WhatsApp clients |

---

Last Updated: December 2025
