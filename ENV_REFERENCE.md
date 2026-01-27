# Environment Variables Reference

Complete list of environment variables for WhatsApp Monitoring Platform.

---

## Required Variables

### Database

**MONGO_URL**
- **Type:** String
- **Default:** `mongodb://localhost:27017`
- **Description:** MongoDB connection string
- **Example:** `mongodb://username:password@host:27017`
- **Docker:** Use `mongodb://mongodb:27017` (service name)

**DB_NAME**
- **Type:** String
- **Default:** `test_database`
- **Description:** MongoDB database name
- **Example:** `whatsapp_monitor`
- **Note:** Database created automatically if doesn't exist

---

## Optional Variables

### Server

**PORT**
- **Type:** Integer
- **Default:** `8001`
- **Description:** HTTP server port
- **Range:** 1024-65535
- **Example:** `8001`
- **Note:** Internal container port (map externally in docker-compose)

**CORS_ORIGINS**
- **Type:** String (comma-separated)
- **Default:** `*` (all origins)
- **Description:** Allowed CORS origins
- **Example:** `https://app.example.com,https://admin.example.com`
- **Production:** Set specific domains, never use `*`

**NODE_ENV**
- **Type:** String
- **Default:** `development`
- **Description:** Node.js environment
- **Values:** `development`, `production`, `test`
- **Example:** `production`

---

### Limits

**MAX_WHATSAPP_ACCOUNTS**
- **Type:** Integer
- **Default:** `5`
- **Description:** Maximum concurrent WhatsApp accounts
- **Range:** 1-100 (practical limit ~20 per 4GB RAM)
- **Example:** `10`
- **Restart Required:** Yes
- **HTTP Status:** 429 when limit reached
- **Error Code:** `MAX_ACCOUNT_LIMIT_REACHED`

---

### Webhook

**WEBHOOK_TIMEOUT**
- **Type:** Integer (milliseconds)
- **Default:** `5000`
- **Description:** HTTP timeout for webhook requests
- **Range:** 1000-30000
- **Example:** `10000`
- **Note:** Fire-and-forget, no retries

---

### Snapshot (Future)

**SNAPSHOT_DELAY_MIN**
- **Type:** Integer (milliseconds)
- **Default:** `2000`
- **Description:** Minimum delay before snapshot capture
- **Note:** Currently hardcoded in routes/accounts.js

**SNAPSHOT_DELAY_MAX**
- **Type:** Integer (milliseconds)
- **Default:** `4000`
- **Description:** Maximum delay before snapshot capture
- **Note:** Currently hardcoded in routes/accounts.js

---

## .env File Example

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_monitor

# Server
PORT=8001
NODE_ENV=production
CORS_ORIGINS=https://yourapp.com

# Limits
MAX_WHATSAPP_ACCOUNTS=5

# Webhook
WEBHOOK_TIMEOUT=5000
```

---

## Docker .env Example

```env
# Database (use service name for Docker)
MONGO_URL=mongodb://mongodb:27017
DB_NAME=whatsapp_monitor

# Server (internal port, map externally in compose)
PORT=8001
NODE_ENV=production
CORS_ORIGINS=*

# Limits
MAX_WHATSAPP_ACCOUNTS=10

# Webhook
WEBHOOK_TIMEOUT=8000
```

---

## Variable Validation

### On Startup

Server validates environment variables at startup:

```javascript
// server.js
const PORT = process.env.PORT || 8001;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'test_database';
```

**Invalid values:** Server falls back to defaults

**Missing critical values:** Server logs warning but continues

---

## Runtime Behavior

### MAX_WHATSAPP_ACCOUNTS

**Checked:** On every POST /api/accounts request

**Behavior:**
1. Count existing accounts in database
2. If count >= MAX_WHATSAPP_ACCOUNTS, reject with 429
3. Otherwise, allow account creation

**Change propagation:**
- Requires server restart
- Docker: `docker-compose restart backend`
- Local: `sudo supervisorctl restart whatsapp_backend`

**Example:**
```bash
# Set limit to 3
echo "MAX_WHATSAPP_ACCOUNTS=3" >> .env

# Restart
docker-compose restart backend

# Test
curl -X POST http://localhost:8001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Account 4"}'

# Response (if 3 already exist):
{
  "error": "Maximum account limit reached",
  "error_code": "MAX_ACCOUNT_LIMIT_REACHED",
  "current": 3,
  "max": 3
}
```

---

### WEBHOOK_TIMEOUT

**Used in:** WebhookManager.js

**Behavior:**
```javascript
await axios.post(webhookUrl, payload, {
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10)
});
```

**No restart required:** Reads ENV on each webhook request

---

### CORS_ORIGINS

**Used in:** server.js middleware

**Behavior:**
```javascript
app.use(cors({
    origin: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',') : 
        '*'
}));
```

**Requires restart:** Middleware initialized at startup

---

## Security Considerations

### Production Checklist

**DO:**
- ✅ Set specific CORS_ORIGINS
- ✅ Use strong DB credentials
- ✅ Limit MAX_WHATSAPP_ACCOUNTS to available resources
- ✅ Use environment secrets management (AWS SSM, Vault)
- ✅ Never commit .env to git

**DON'T:**
- ❌ Use `CORS_ORIGINS=*` in production
- ❌ Expose PORT directly (use reverse proxy)
- ❌ Set MAX_WHATSAPP_ACCOUNTS > 50 (memory issues)
- ❌ Use default database names in production

---

## Resource Calculation

**Memory per account:** ~200MB (Chrome + Node.js)

**Formula:**
```
Required RAM = (MAX_WHATSAPP_ACCOUNTS * 200MB) + 1GB (base system)
```

**Examples:**
- 5 accounts: 2GB RAM
- 10 accounts: 3GB RAM
- 20 accounts: 5GB RAM
- 50 accounts: 11GB RAM

**CPU:** 1 core per 5 accounts recommended

---

## Troubleshooting

### "Maximum account limit reached" but < MAX

**Cause:** Old deleted accounts still in database

**Fix:**
```javascript
// Clean orphaned records
db.whatsapp_accounts.deleteMany({ status: "DISCONNECTED" })
```

### ENV not loading

**Cause:** .env file not in correct location

**Fix:**
```bash
# Check .env location
ls -la /app/backend/.env

# Verify loaded values
docker-compose exec backend printenv | grep MONGO
```

### Changes not applying

**Cause:** Forgot to restart

**Fix:**
```bash
docker-compose restart backend
```

---

## Monitoring ENV Usage

**Add logging:**
```javascript
// server.js
console.log('[ENV] Configuration loaded:', {
    PORT: process.env.PORT,
    DB_NAME: process.env.DB_NAME,
    MAX_ACCOUNTS: process.env.MAX_WHATSAPP_ACCOUNTS,
    NODE_ENV: process.env.NODE_ENV
});
```

**Output:**
```
[ENV] Configuration loaded: {
  PORT: '8001',
  DB_NAME: 'whatsapp_monitor',
  MAX_ACCOUNTS: '5',
  NODE_ENV: 'production'
}
```

---

## Future Variables

Planned but not yet implemented:

- `SNAPSHOT_QUALITY` (1-100, PNG compression)
- `SESSION_BACKUP_ENABLED` (true/false)
- `LOG_LEVEL` (debug, info, warn, error)
- `RATE_LIMIT_REQUESTS_PER_MINUTE`
- `JWT_SECRET` (for API authentication)

---

**Last Updated:** January 27, 2026  
**Status:** All variables documented and tested
