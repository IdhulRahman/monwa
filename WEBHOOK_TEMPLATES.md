# Webhook Templates - WhatsApp Monitoring Platform

## Unified Webhook Contract

All WhatsApp events (incoming messages, outgoing confirmations, media) follow a single unified schema.

---

## Inbound Webhook (Message Received)

Your webhook endpoint receives HTTP POST when a message arrives.

### Text Message
```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E5C",
  "timestamp": 1706400000,
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "from_me": false,
  "is_group": false,
  "type": "text",
  "text": "Hello, this is a text message",
  "media": null
}
```

### Image Message with Caption
```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E5D",
  "timestamp": 1706400060,
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "from_me": false,
  "is_group": false,
  "type": "image",
  "text": "Check out this photo!",
  "media": {
    "mimetype": "image/jpeg",
    "filename": "IMG_20260127.jpg",
    "size": 245680,
    "media_url": "https://your-storage.com/media/xyz123.jpg",
    "duration": null
  }
}
```

### Audio Message
```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E5E",
  "timestamp": 1706400120,
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "from_me": false,
  "is_group": false,
  "type": "audio",
  "text": null,
  "media": {
    "mimetype": "audio/ogg; codecs=opus",
    "filename": "audio.ogg",
    "size": 58230,
    "media_url": "https://your-storage.com/media/audio123.ogg",
    "duration": 15
  }
}
```

### Document Message
```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E5F",
  "timestamp": 1706400180,
  "from": "1234567890@c.us",
  "to": "0987654321@c.us",
  "from_me": false,
  "is_group": false,
  "type": "document",
  "text": "Here's the contract",
  "media": {
    "mimetype": "application/pdf",
    "filename": "contract.pdf",
    "size": 1024000,
    "media_url": "https://your-storage.com/media/doc456.pdf",
    "duration": null
  }
}
```

### Group Message
```json
{
  "event": "message",
  "direction": "inbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E60",
  "timestamp": 1706400240,
  "from": "1234567890@c.us",
  "to": "120363024567890123@g.us",
  "from_me": false,
  "is_group": true,
  "type": "text",
  "text": "Message in group chat",
  "media": null
}
```

---

## Outbound Webhook (Message Sent Confirmation)

Optional: Configure a separate endpoint to receive delivery confirmations.

### Successful Send
```json
{
  "event": "message_sent",
  "direction": "outbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": "3EB0B430B6F8F1D0E053AC120E0A9E61",
  "timestamp": 1706400300,
  "to": "1234567890@c.us",
  "type": "text",
  "status": "sent",
  "error_code": null
}
```

### Failed Send
```json
{
  "event": "message_sent",
  "direction": "outbound",
  "account_id": "3f4de3d8-d789-4aff-921f-ad16ce48115e",
  "message_id": null,
  "timestamp": 1706400360,
  "to": "invalid_number@c.us",
  "type": "text",
  "status": "failed",
  "error_code": "INVALID_RECIPIENT"
}
```

---

## Webhook Configuration

Set webhook URL when creating account:

```bash
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support",
    "webhook_url": "https://your-server.com/webhooks/whatsapp"
  }'
```

Update webhook URL without restarting session:

```bash
curl -X PUT http://localhost:8001/api/accounts/{accountId}/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://new-endpoint.com/webhook"
  }'
```

---

## Webhook Delivery Behavior

- **Timeout:** 5 seconds (configurable via WEBHOOK_TIMEOUT)
- **Retries:** None (fire-and-forget)
- **HTTP Method:** POST
- **Content-Type:** application/json
- **User-Agent:** WhatsApp-Monitor/1.0

If webhook fails, error is logged but WhatsApp session continues normally.

---

## Webhook Testing

Use [webhook.site](https://webhook.site) for testing:

1. Create temporary webhook URL
2. Set as webhook_url in account
3. Send message to WhatsApp account
4. View payload in webhook.site inspector

---

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type: `message` or `message_sent` |
| `direction` | string | `inbound` or `outbound` |
| `account_id` | string | UUID of WhatsApp account |
| `message_id` | string | WhatsApp message ID |
| `timestamp` | integer | Unix timestamp (seconds) |
| `from` | string | Sender JID (e.g., `1234567890@c.us`) |
| `to` | string | Recipient JID |
| `from_me` | boolean | Message sent by account owner |
| `is_group` | boolean | Message in group chat |
| `type` | string | `text`, `image`, `video`, `audio`, `document`, `sticker` |
| `text` | string/null | Message text or caption |
| `media` | object/null | Media metadata |
| `media.mimetype` | string | MIME type |
| `media.filename` | string | Original filename |
| `media.size` | integer | File size in bytes |
| `media.media_url` | string | URL to download media |
| `media.duration` | integer/null | Duration in seconds (audio/video) |
| `status` | string | `sent` or `failed` (outbound only) |
| `error_code` | string/null | Error code if failed |

---

## Notes

- WhatsApp groups use format: `{groupId}@g.us`
- Individual contacts use: `{phoneNumber}@c.us`
- Media URLs require authentication if served from your storage
- `text` field contains caption for media messages
- `media` is `null` for text-only messages
