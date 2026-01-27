# WhatsApp Monitoring Platform - Docker Deployment

## Quick Start

```bash
docker-compose up -d
```

Access API: `http://localhost:8001/api`

## Session Persistence

WhatsApp sessions are stored in Docker volume `whatsapp-sessions`.

**Container restart:** Sessions persist, no QR re-scan required.

**Container rebuild with volume:** Sessions persist, no QR re-scan required.

**Volume deletion:** Sessions lost, QR re-scan required.

## Configuration

Edit `.env` or `docker-compose.yml`:

- `MAX_WHATSAPP_ACCOUNTS`: Maximum concurrent accounts (default: 5)
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name

## Logs

```bash
docker-compose logs -f backend
```

## Stop

```bash
docker-compose down
```

## Clean Restart (Delete Sessions)

```bash
docker-compose down -v
docker-compose up -d
```
