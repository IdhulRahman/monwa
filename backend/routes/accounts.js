const express = require('express');
const { randomUUID } = require('crypto');
const clientManager = require('../managers/ClientManager');
const { getDb } = require('../db');

const router = express.Router();

/**
 * GET /api/accounts
 * List all accounts
 */
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const accounts = await db.collection('whatsapp_accounts')
            .find({})
            .project({ _id: 0 })
            .toArray();
        
        res.json(accounts);
    } catch (error) {
        console.error('[API] Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

/**
 * POST /api/accounts
 * Create new account and initialize WhatsApp client
 */
router.post('/', async (req, res) => {
    try {
        const { name, webhook_url } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Account name is required' });
        }
        
        const accountId = randomUUID();
        const account = {
            id: accountId,
            name,
            webhook_url: webhook_url || null,
            status: 'INIT',
            phone_number: null,
            qr_code: null,
            last_snapshot: null,
            snapshot_timestamp: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_seen: null
        };
        
        const db = await getDb();
        await db.collection('whatsapp_accounts').insertOne({ ...account });
        
        const maxAccounts = parseInt(process.env.MAX_WHATSAPP_ACCOUNTS || '5', 10);
        const activeClients = clientManager.getAllClients();
        
        if (activeClients.length >= maxAccounts) {
            console.log(`[API] Account initialization blocked: limit ${maxAccounts} reached`);
            await db.collection('whatsapp_accounts').deleteOne({ id: accountId });
            return res.status(429).json({ 
                error: 'Maximum account limit reached',
                error_code: 'MAX_ACCOUNT_LIMIT_REACHED',
                current: activeClients.length,
                max: maxAccounts
            });
        }
        
        clientManager.initializeClient(accountId, webhook_url).catch(error => {
            console.error(`[API] Failed to initialize client for ${accountId}:`, error);
        });
        
        delete account._id;
        res.status(201).json(account);
    } catch (error) {
        console.error('[API] Error creating account:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

/**
 * GET /api/accounts/:id
 * Get account details
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const account = await db.collection('whatsapp_accounts')
            .findOne({ id: req.params.id }, { projection: { _id: 0 } });
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        res.json(account);
    } catch (error) {
        console.error('[API] Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

/**
 * GET /api/accounts/:id/qr
 * Get current QR code
 */
router.get('/:id/qr', async (req, res) => {
    try {
        const qrData = clientManager.getQRCode(req.params.id);
        
        if (!qrData) {
            return res.status(404).json({ error: 'QR code not available' });
        }
        
        res.json({
            qr_code: qrData.qr,
            timestamp: qrData.timestamp
        });
    } catch (error) {
        console.error('[API] Error fetching QR code:', error);
        res.status(500).json({ error: 'Failed to fetch QR code' });
    }
});

/**
 * PUT /api/accounts/:id/webhook
 * Update webhook URL (does NOT restart session)
 */
router.put('/:id/webhook', async (req, res) => {
    try {
        const { webhook_url } = req.body;
        
        if (!webhook_url) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }
        
        const db = await getDb();
        const result = await db.collection('whatsapp_accounts').updateOne(
            { id: req.params.id },
            {
                $set: {
                    webhook_url,
                    updated_at: new Date().toISOString()
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        await clientManager.updateWebhook(req.params.id, webhook_url);
        
        const account = await db.collection('whatsapp_accounts')
            .findOne({ id: req.params.id }, { projection: { _id: 0 } });
        
        res.json(account);
    } catch (error) {
        console.error('[API] Error updating webhook:', error);
        res.status(500).json({ error: 'Failed to update webhook' });
    }
});

/**
 * GET /api/accounts/:id/snapshot
 * Capture snapshot of WhatsApp page (reuses existing page)
 * Includes configurable delay (2-4 seconds) for realistic capture
 */
router.get('/:id/snapshot', async (req, res) => {
    try {
        const client = clientManager.getClient(req.params.id);
        
        if (!client) {
            return res.status(404).json({ error: 'Account not found or not initialized' });
        }
        
        if (!client.info) {
            return res.status(400).json({ error: 'Account not ready' });
        }
        
        console.log('[SNAPSHOT] using existing page');
        
        const delayMs = Math.floor(2000 + Math.random() * 2000);
        const delaySec = (delayMs / 1000).toFixed(1);
        console.log(`[SNAPSHOT] delay applied: ${delaySec}s`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        const snapshot = await clientManager.captureSnapshot(req.params.id);
        const timestamp = new Date().toISOString();
        
        const sizeKB = Math.round(snapshot.length / 1024);
        console.log(`[SNAPSHOT] size: ${sizeKB}kb`);
        
        const db = await getDb();
        await db.collection('whatsapp_accounts').updateOne(
            { id: req.params.id },
            {
                $set: {
                    last_snapshot: snapshot,
                    snapshot_timestamp: timestamp
                }
            }
        );
        
        res.json({ snapshot, timestamp });
    } catch (error) {
        console.error('[API] Error capturing snapshot:', error);
        res.status(500).json({ error: error.message || 'Failed to capture snapshot' });
    }
});

/**
 * POST /api/accounts/:id/send
 * Send message
 */
router.post('/:id/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ error: 'Both "to" and "message" are required' });
        }
        
        await clientManager.sendMessage(req.params.id, to, message);
        
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        console.error('[API] Error sending message:', error);
        res.status(500).json({ error: error.message || 'Failed to send message' });
    }
});

/**
 * DELETE /api/accounts/:id
 * Delete account and destroy session
 */
router.delete('/:id', async (req, res) => {
    try {
        await clientManager.destroyClient(req.params.id);
        
        const db = await getDb();
        const result = await db.collection('whatsapp_accounts')
            .deleteOne({ id: req.params.id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
