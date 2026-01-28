const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment from root .env (single global config)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { getDb, closeDb } = require('./db');
const clientManager = require('./managers/ClientManager');
const accountsRouter = require('./routes/accounts');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 8001;

app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/api', (req, res) => {
    res.json({ message: 'WhatsApp Monitoring API v1.0' });
});

app.use('/api/accounts', accountsRouter);

app.use((err, req, res, next) => {
    console.error('[Server] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
    try {
        const db = await getDb();
        console.log('[Server] Database connected');
        
        const accounts = await db.collection('whatsapp_accounts').find({}).toArray();
        console.log(`[Server] Found ${accounts.length} existing accounts`);
        
        if (accounts.length > 0) {
            console.log('[Server] Restoring WhatsApp sessions...');
            await clientManager.restoreAllSessions(accounts);
        }
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Server] WhatsApp Monitoring API running on port ${PORT}`);
            console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    await closeDb();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    await closeDb();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
});

startServer();
