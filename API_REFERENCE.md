# WhatsApp Monitoring Platform - API Reference

Base URL: `http://localhost:8001/api`

---

## Accounts

### Create Account
```http
POST /accounts
Content-Type: application/json

{
  "name": "Customer Support",
  "webhook_url": "https://your-webhook.com/whatsapp" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Customer Support",
  "status": "INIT",
  "webhook_url": "https://your-webhook.com/whatsapp",
  "phone_number": null,
  "qr_code": null,
  "created_at": "2026-01-27T00:00:00.000Z"
}
```

**Status:** `INIT` → `QR` → `AUTH` → `READY`

**Error (429):**
```json
{
  "error": "Maximum account limit reached",
  "error_code": "MAX_ACCOUNT_LIMIT_REACHED",
  "current": 5,
  "max": 5
}
```

---

### List Accounts
```http
GET /accounts
```

**Response:** Array of account objects

---

### Get Account
```http
GET /accounts/{accountId}
```

---

### Update Webhook
```http
PUT /accounts/{accountId}/webhook
Content-Type: application/json

{
  "webhook_url": "https://new-webhook.com/endpoint"
}
```

**Note:** Does NOT restart WhatsApp session

---

### Delete Account
```http
DELETE /accounts/{accountId}
```

Destroys WhatsApp session and removes from database.

---

## Snapshot

### Capture Snapshot
```http
GET /accounts/{accountId}/snapshot
```

**Requirements:**
- Account status MUST be `READY`
- Uses existing WhatsApp page (no new tabs)
- Applies 2-4 second delay before capture

**Response:**
```json
{
  "snapshot": "data:image/png;base64,...",
  "timestamp": "2026-01-27T00:00:00.000Z"
}
```

**Error (400):**
```json
{
  "error": "Account not ready"
}
```

---

## Send Message

### Send Text Message
```http
POST /accounts/{accountId}/messages/send
Content-Type: application/json

{
  "to": "1234567890",
  "message": "Hello from WhatsApp Monitor"
}
```

### Send Media Message
```http
POST /accounts/{accountId}/messages/send
Content-Type: application/json

{
  "to": "1234567890",
  "media_url": "https://example.com/image.jpg",
  "caption": "Optional caption"
}
```

**Supported Media Types:**
- `image/jpeg`
- `image/png`
- `application/pdf`

**Max File Size:** 10MB

**Requirements:**
- Account status MUST be `READY`
- One request = one message (no bulk, no retries)

**Response:**
```json
{
  "success": true,
  "message": "Text message sent",
  "to": "1234567890@c.us"
}
```

**Error Codes:**
- `ACCOUNT_NOT_FOUND` (404)
- `ACCOUNT_NOT_READY` (400)
- `MISSING_RECIPIENT` (400)
- `MISSING_CONTENT` (400)
- `INVALID_MEDIA_TYPE` (400)
- `MEDIA_SEND_FAILED` (500)
- `SEND_FAILED` (500)

---

## Webhook Events

When `webhook_url` is configured, incoming messages are forwarded via HTTP POST:

```json
{
  "account_id": "uuid",
  "message_id": "msg_id",
  "from": "1234567890@c.us",
  "to": "your_number@c.us",
  "body": "Message text",
  "type": "chat",
  "timestamp": 1706400000,
  "has_media": false,
  "is_forwarded": false
}
```

**Note:** Webhook URL can be updated without restarting session

---

## Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_monitor
MAX_WHATSAPP_ACCOUNTS=5
CORS_ORIGINS=*
```

**Restart required** after changing ENV values
