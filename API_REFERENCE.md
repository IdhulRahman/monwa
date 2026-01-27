# WhatsApp Monitoring Platform - API Reference

Base URL: `http://localhost:8001/api`

**Authentication:** None (add JWT before production)

---

## Complete API List

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api` | Health check | No |
| POST | `/api/accounts` | Create WhatsApp account | No |
| GET | `/api/accounts` | List all accounts | No |
| GET | `/api/accounts/{id}` | Get account details | No |
| PUT | `/api/accounts/{id}/webhook` | Update webhook URL | No |
| DELETE | `/api/accounts/{id}` | Delete account | No |
| GET | `/api/accounts/{id}/snapshot` | Capture snapshot | No |
| POST | `/api/accounts/{id}/messages/send` | Send message | No |

---

## Health Check

### GET /api
```bash
curl http://localhost:8001/api
```

**Response:**
```json
{
  "message": "WhatsApp Monitoring API v1.0"
}
```

---

## Accounts Management

### Create Account

```http
POST /api/accounts
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Customer Support Bot",
  "webhook_url": "https://your-server.com/webhook"
}
```

**Fields:**
- `name` (required, string): Display name for account
- `webhook_url` (optional, string): Endpoint to receive incoming messages

**Response (201):**
```json
{
  "id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "name": "Customer Support Bot",
  "webhook_url": "https://your-server.com/webhook",
  "status": "INIT",
  "phone_number": null,
  "qr_code": null,
  "last_snapshot": null,
  "snapshot_timestamp": null,
  "created_at": "2026-01-27T00:00:00.000Z",
  "updated_at": "2026-01-27T00:00:00.000Z",
  "last_seen": null
}
```

**Status Flow:**
```
INIT → QR → AUTH → READY
```

**Error (429):**
```json
{
  "error": "Maximum account limit reached",
  "error_code": "MAX_ACCOUNT_LIMIT_REACHED",
  "current": 5,
  "max": 5
}
```

Account limit enforced via `MAX_WHATSAPP_ACCOUNTS` environment variable (default: 5).

---

### List Accounts

```http
GET /api/accounts
```

**Response (200):**
```json
[
  {
    "id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
    "name": "Customer Support Bot",
    "status": "READY",
    "phone_number": "+1234567890",
    "webhook_url": "https://your-server.com/webhook",
    "qr_code": null,
    "created_at": "2026-01-27T00:00:00.000Z",
    "last_seen": "2026-01-27T01:00:00.000Z"
  }
]
```

**Status Values:**
- `INIT`: Client initializing
- `QR`: QR code ready for scanning
- `AUTH`: Authentication in progress
- `READY`: Session active, can send/receive
- `DISCONNECTED`: Session lost or manually disconnected

---

### Get Account Details

```http
GET /api/accounts/{accountId}
```

**Response (200):** Same as account object above

**Error (404):**
```json
{
  "error": "Account not found"
}
```

---

### Update Webhook URL

```http
PUT /api/accounts/{accountId}/webhook
Content-Type: application/json
```

**Request Body:**
```json
{
  "webhook_url": "https://new-webhook.com/endpoint"
}
```

**Response (200):** Updated account object

**Important:** 
- Does NOT restart WhatsApp session
- Applies immediately to future messages
- Session remains in READY state

**Error (400):**
```json
{
  "error": "Webhook URL is required"
}
```

---

### Delete Account

```http
DELETE /api/accounts/{accountId}
```

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Behavior:**
- Destroys WhatsApp client session
- Removes from database
- Deletes session files from disk
- Frees account slot (new account can be created)

**Error (404):**
```json
{
  "error": "Account not found"
}
```

---

## Snapshot System

### Capture Snapshot

```http
GET /api/accounts/{accountId}/snapshot
```

**Requirements:**
- Account status MUST be `READY`
- Uses existing WhatsApp Web page (no new tabs)
- Applies 2-4 second randomized delay before capture

**Response (200):**
```json
{
  "snapshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2026-01-27T01:30:00.000Z"
}
```

**Runtime Logs Emitted:**
```
[SNAPSHOT] using existing page
[SNAPSHOT] delay applied: 3.2s
[SNAPSHOT] size: 245kb
```

**Error (400):**
```json
{
  "error": "Account not ready"
}
```

**Error (404):**
```json
{
  "error": "Account not found or not initialized"
}
```

**Snapshot Behavior:**
- PNG format, base64-encoded
- Captures current WhatsApp Web UI state
- Size varies (typically 100-500KB)
- No caching (generates fresh screenshot each time)

---

## Send Messages

### Send Text Message

```http
POST /api/accounts/{accountId}/messages/send
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "1234567890",
  "message": "Hello from WhatsApp Monitor!"
}
```

**Fields:**
- `to` (required, string): Recipient phone number (international format without +)
- `message` (required if no media_url, string): Message text

**Response (200):**
```json
{
  "success": true,
  "message": "Text message sent",
  "to": "1234567890@c.us"
}
```

---

### Send Media Message

```http
POST /api/accounts/{accountId}/messages/send
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "1234567890",
  "media_url": "https://example.com/images/photo.jpg",
  "caption": "Check out this photo!"
}
```

**Fields:**
- `to` (required, string): Recipient phone number
- `media_url` (required if no message, string): URL to media file
- `caption` (optional, string): Caption for media (sent as `text` field in webhook)

**Supported Media Types:**
- `image/jpeg`
- `image/png`
- `application/pdf`

**Max File Size:** 10MB

**Response (200):**
```json
{
  "success": true,
  "message": "Media message sent",
  "to": "1234567890@c.us"
}
```

---

### Send Message Error Codes

**ACCOUNT_NOT_FOUND (404):**
```json
{
  "error": "Account not found or not initialized",
  "error_code": "ACCOUNT_NOT_FOUND"
}
```

**ACCOUNT_NOT_READY (400):**
```json
{
  "error": "Account not ready. Cannot send messages.",
  "error_code": "ACCOUNT_NOT_READY"
}
```

Account must be in `READY` status. Cannot send from:
- `INIT` state
- `QR` state (awaiting phone scan)
- `AUTH` state
- `DISCONNECTED` state

**MISSING_RECIPIENT (400):**
```json
{
  "error": "Recipient phone number required",
  "error_code": "MISSING_RECIPIENT"
}
```

**MISSING_CONTENT (400):**
```json
{
  "error": "Either message text or media_url required",
  "error_code": "MISSING_CONTENT"
}
```

**INVALID_MEDIA_TYPE (400):**
```json
{
  "error": "Unsupported media type: video/mp4",
  "error_code": "INVALID_MEDIA_TYPE",
  "allowed": ["image/jpeg", "image/png", "application/pdf"]
}
```

**MEDIA_SEND_FAILED (500):**
```json
{
  "error": "Failed to fetch or send media",
  "error_code": "MEDIA_SEND_FAILED",
  "details": "connect ETIMEDOUT"
}
```

Causes:
- Media URL unreachable
- File exceeds 10MB
- Invalid image format
- Network timeout (30 second limit)

**SEND_FAILED (500):**
```json
{
  "error": "Failed to send message",
  "error_code": "SEND_FAILED",
  "details": "Error message from whatsapp-web.js"
}
```

---

## Webhook Events

When `webhook_url` is configured, incoming WhatsApp messages are forwarded via HTTP POST.

**Request:**
```http
POST https://your-server.com/webhook
Content-Type: application/json
User-Agent: WhatsApp-Monitor/1.0
```

**Payload:** See [WEBHOOK_TEMPLATES.md](WEBHOOK_TEMPLATES.md) for complete payload structure.

**Timeout:** 5 seconds

**Retries:** None (fire-and-forget)

**Error Handling:** Webhook failure does NOT affect WhatsApp session (continues normally).

---

## Rate Limits

**None currently implemented.**

Recommendations for production:
- Add rate limiting per account
- Implement API authentication (JWT)
- Add request logging
- Monitor snapshot abuse (CPU-intensive)

---

## Environment Variables

Configure via `.env` file:

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_monitor

# Server
PORT=8001
CORS_ORIGINS=*

# Limits
MAX_WHATSAPP_ACCOUNTS=5

# Webhook (optional)
WEBHOOK_TIMEOUT=5000
```

**Variable Reference:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MONGO_URL` | string | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | string | `test_database` | Database name |
| `PORT` | integer | `8001` | HTTP server port |
| `CORS_ORIGINS` | string | `*` | Allowed CORS origins (comma-separated) |
| `MAX_WHATSAPP_ACCOUNTS` | integer | `5` | Max concurrent WhatsApp accounts |
| `WEBHOOK_TIMEOUT` | integer | `5000` | Webhook HTTP timeout (milliseconds) |

**Note:** Server restart required after changing ENV variables.

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "details": "Optional additional context"
}
```

**Common HTTP Status Codes:**
- `400` Bad Request - Invalid input or precondition failed
- `404` Not Found - Account doesn't exist
- `429` Too Many Requests - Account limit reached
- `500` Internal Server Error - Unexpected server error

---

## Best Practices

1. **Check account status** before sending messages (must be `READY`)
2. **Handle webhook failures** gracefully (5 second timeout)
3. **Validate media URLs** before sending (check size/type)
4. **Monitor QR expiration** (regenerates every ~60 seconds if not scanned)
5. **Backup session directory** (`/app/backend/whatsapp-sessions/`)
6. **Add authentication** before production deployment
7. **Implement rate limiting** to prevent abuse

---

## Testing

**Test webhook locally** with ngrok:

```bash
# Terminal 1: Start local webhook server
python3 -m http.server 8080

# Terminal 2: Expose via ngrok
ngrok http 8080

# Use ngrok URL as webhook_url
```

**Test with webhook.site:**

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "webhook_url": "https://webhook.site/YOUR-UNIQUE-ID"
  }'
```

Send message to account, view payload at webhook.site.

---

## Changelog

**v1.0.0** (Jan 2026)
- Initial release
- Multi-account support
- Snapshot capture with delay
- Webhook forwarding
- Send message API (text + media)
- Docker support
- Session persistence

---

**Engineering Status:** Complete | Blocked by QR scan for full runtime verification

For implementation details, see [PROGRESS_AUDIT.md](PROGRESS_AUDIT.md)
