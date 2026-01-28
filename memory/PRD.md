# WhatsApp Monitoring Platform - Product Requirements Document

## Original Problem Statement

Build a modern, clean, and professional web UI for a production-grade WhatsApp monitoring platform. Requirements:

- Real WhatsApp client using `whatsapp-web.js`
- Multi-account support with persistent sessions
- Snapshot-based UI monitoring (on-demand screenshots)
- Scalable, efficient architecture
- Platform-safe (Linux/Windows compatible)
- Monitoring and observability focus (not a chatbot framework)

## Core Requirements

1. **Multi-Account Management** - Support multiple WhatsApp accounts with ENV-configurable limit
2. **Session Persistence** - LocalAuth for session storage across restarts
3. **QR Authentication** - Display QR codes for phone linking
4. **Snapshot Capture** - On-demand screenshots of WhatsApp Web UI
5. **Message Webhook** - Forward incoming messages to user-specified URL
6. **Send Message API** - Send text and media messages programmatically
7. **Docker Deployment** - One-command deployment with docker-compose

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express.js |
| Frontend | React + Tailwind CSS |
| WhatsApp Client | whatsapp-web.js + Puppeteer |
| Database | MongoDB |
| Deployment | Docker + Docker Compose |

## What's Been Implemented

### Phase 1: Core Infrastructure ✅
- [x] Node.js/Express backend setup
- [x] MongoDB integration for account metadata
- [x] whatsapp-web.js client management
- [x] Session persistence with LocalAuth

### Phase 2: API Development ✅
- [x] Account CRUD operations
- [x] QR code generation and retrieval
- [x] Snapshot capture endpoint
- [x] Send message API (text + media)
- [x] Webhook management (update without restart)

### Phase 3: Frontend ✅
- [x] React dashboard
- [x] Account management UI
- [x] QR code display

### Phase 4: Deployment ✅
- [x] Dockerfile
- [x] docker-compose.yml with volumes
- [x] Environment configuration

### Phase 5: Documentation ✅ (Completed Dec 2025)
- [x] README.md - Primary documentation
- [x] DOCKER_DEPLOYMENT.md - Docker-specific guide
- [x] RUNBOOK.md - Operations quick reference
- [x] .env.example - Environment template

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | Health check |
| POST | `/api/accounts` | Create account |
| GET | `/api/accounts` | List accounts |
| GET | `/api/accounts/{id}` | Get account details |
| GET | `/api/accounts/{id}/qr` | Get QR code |
| PUT | `/api/accounts/{id}/webhook` | Update webhook |
| GET | `/api/accounts/{id}/snapshot` | Capture screenshot |
| POST | `/api/accounts/{id}/messages/send` | Send message |
| DELETE | `/api/accounts/{id}` | Delete account |

## Current Status

**Phase:** Human QA / Production Ready

**Blocker:** Manual QR code scan required to verify full end-to-end flow

## Backlog / Future Enhancements

### P0 (Critical)
- None - Core features complete

### P1 (High Priority)
- [ ] API authentication layer
- [ ] Rate limiting
- [ ] HTTPS/TLS support

### P2 (Medium Priority)
- [ ] Message history storage
- [ ] Webhook retry logic
- [ ] Admin dashboard metrics

### P3 (Low Priority)
- [ ] Group message support
- [ ] Scheduled messages
- [ ] Message templates

## Key Files Reference

| File | Purpose |
|------|---------|
| `/app/backend/server.js` | Backend entry point |
| `/app/backend/managers/ClientManager.js` | WhatsApp client management |
| `/app/backend/routes/accounts.js` | API route handlers |
| `/app/docker-compose.yml` | Docker service definitions |
| `/app/README.md` | Primary documentation |
| `/app/RUNBOOK.md` | Operations guide |

## Notes

- Each WhatsApp account uses ~200MB RAM
- QR codes expire every 60 seconds (auto-refreshed)
- Changing MAX_WHATSAPP_ACCOUNTS requires server restart
- Sessions persist across restarts via Docker volume

---

Last Updated: December 2025
