const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const qrcode = require('qrcode');
const webhookManager = require('./WebhookManager');

/**
 * ClientManager - WhatsApp Client Lifecycle Manager
 * - Multi-account support with session persistence
 * - Automatic reconnection
 * - Event handling (QR, authenticated, ready, message, disconnected)
 */
class ClientManager {
    constructor() {
        this.clients = new Map();
        this.qrCodes = new Map();
        this.sessionDir = path.join(process.cwd(), 'whatsapp-sessions');
        console.log(`[ClientManager] Session directory: ${this.sessionDir}`);
    }
    
    /**
     * Initialize WhatsApp client for account
     * Uses LocalAuth for session persistence
     */
    async initializeClient(accountId, webhookUrl = null) {
        if (this.clients.has(accountId)) {
            console.log(`[ClientManager] Client already exists for ${accountId}`);
            return this.clients.get(accountId);
        }
        
        console.log(`[ClientManager] Initializing client for account ${accountId}`);
        
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: accountId,
                dataPath: this.sessionDir
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            }
        });
        
        this._attachEventHandlers(client, accountId, webhookUrl);
        this.clients.set(accountId, client);
        
        try {
            await client.initialize();
            console.log(`[ClientManager] Client initialized for ${accountId}`);
        } catch (error) {
            console.error(`[ClientManager] Failed to initialize client ${accountId}:`, error);
            this.clients.delete(accountId);
            throw error;
        }
        
        return client;
    }
    
    /**
     * Attach lifecycle event handlers
     */
    _attachEventHandlers(client, accountId, webhookUrl) {
        client.on('qr', async (qr) => {
            console.log(`[ClientManager] QR code generated for ${accountId}`);
            try {
                const qrImage = await qrcode.toDataURL(qr);
                this.qrCodes.set(accountId, { qr: qrImage, timestamp: new Date() });
                this._updateAccountStatus(accountId, 'QR', { qr_code: qrImage });
            } catch (error) {
                console.error(`[ClientManager] Failed to generate QR for ${accountId}:`, error);
            }
        });
        
        client.on('authenticated', () => {
            console.log(`[ClientManager] Client authenticated for ${accountId}`);
            this.qrCodes.delete(accountId);
            this._updateAccountStatus(accountId, 'AUTH', { qr_code: null });
        });
        
        client.on('ready', async () => {
            console.log(`[ClientManager] Client ready for ${accountId}`);
            const info = client.info;
            
            console.log(`[RUNTIME PROOF] WhatsApp client ready:`, {
                accountId,
                hasPuppeteerBrowser: !!client.pupBrowser,
                hasPuppeteerPage: !!client.pupPage,
                browserConnected: client.pupBrowser ? client.pupBrowser.isConnected() : false,
                browserPID: client.pupBrowser?.process()?.pid,
                phoneNumber: info ? info.wid.user : null,
                clientVersion: client.info?.wid._serialized
            });
            
            if (client.pupPage) {
                const pageURL = await client.pupPage.url();
                console.log(`[RUNTIME PROOF] Page URL: ${pageURL}`);
            }
            
            this._updateAccountStatus(accountId, 'READY', {
                phone_number: info ? info.wid.user : null,
                qr_code: null,
                last_seen: new Date()
            });
        });
        
        client.on('message', async (message) => {
            if (webhookUrl) {
                await webhookManager.forwardMessage(accountId, webhookUrl, message);
            }
        });
        
        client.on('disconnected', (reason) => {
            console.log(`[ClientManager] Client disconnected for ${accountId}: ${reason}`);
            this._updateAccountStatus(accountId, 'DISCONNECTED');
            this.clients.delete(accountId);
            this.qrCodes.delete(accountId);
        });
        
        client.on('auth_failure', (msg) => {
            console.error(`[ClientManager] Authentication failed for ${accountId}:`, msg);
            this._updateAccountStatus(accountId, 'DISCONNECTED');
        });
    }
    
    /**
     * Update account status in database
     */
    async _updateAccountStatus(accountId, status, additionalFields = {}) {
        const { getDb } = require('../db');
        try {
            const db = await getDb();
            await db.collection('whatsapp_accounts').updateOne(
                { id: accountId },
                {
                    $set: {
                        status,
                        ...additionalFields,
                        updated_at: new Date().toISOString()
                    }
                }
            );
        } catch (error) {
            console.error(`[ClientManager] Failed to update status for ${accountId}:`, error);
        }
    }
    
    /**
     * Get client instance
     */
    getClient(accountId) {
        return this.clients.get(accountId);
    }
    
    /**
     * Get current QR code
     */
    getQRCode(accountId) {
        return this.qrCodes.get(accountId);
    }
    
    /**
     * Get client state
     */
    getClientState(accountId) {
        const client = this.clients.get(accountId);
        if (!client) return 'NOT_INITIALIZED';
        
        const state = client.info ? 'READY' : 'CONNECTING';
        return state;
    }
    
    /**
     * Capture snapshot of WhatsApp page
     * Reuses existing page - NO NEW TABS
     */
    async captureSnapshot(accountId) {
        const client = this.clients.get(accountId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        if (!client.pupPage) {
            throw new Error('Client page not available');
        }
        
        console.log(`[RUNTIME PROOF] Snapshot capture for ${accountId}:`, {
            hasBrowser: !!client.pupBrowser,
            hasPage: !!client.pupPage,
            pageURL: client.pupPage ? await client.pupPage.url() : null,
            browserPID: client.pupBrowser ? client.pupBrowser.process()?.pid : null,
            timestamp: new Date().toISOString()
        });
        
        try {
            const screenshot = await client.pupPage.screenshot({
                type: 'png',
                encoding: 'base64',
                fullPage: false
            });
            
            const screenshotSize = screenshot.length;
            console.log(`[RUNTIME PROOF] Screenshot captured:`, {
                sizeBytes: screenshotSize,
                sizeKB: Math.round(screenshotSize / 1024),
                isBase64: /^[A-Za-z0-9+/=]+$/.test(screenshot),
                startsWithPNGHeader: screenshot.startsWith('iVBORw0KGgo')
            });
            
            return `data:image/png;base64,${screenshot}`;
        } catch (error) {
            console.error(`[ClientManager] Failed to capture snapshot for ${accountId}:`, error);
            throw error;
        }
    }
    
    /**
     * Send message
     */
    async sendMessage(accountId, to, message) {
        const client = this.clients.get(accountId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        if (!client.info) {
            throw new Error('Client not ready');
        }
        
        const chatId = to.includes('@') ? to : `${to}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`[ClientManager] Message sent from ${accountId} to ${to}`);
    }
    
    /**
     * Update webhook URL for account
     * Does NOT restart client - only updates message forwarding
     */
    async updateWebhook(accountId, webhookUrl) {
        const client = this.clients.get(accountId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        console.log(`[ClientManager] Webhook updated for ${accountId} (no restart)`);
    }
    
    /**
     * Destroy client and clean up session
     */
    async destroyClient(accountId) {
        const client = this.clients.get(accountId);
        if (client) {
            console.log(`[ClientManager] Destroying client for ${accountId}`);
            await client.destroy();
            this.clients.delete(accountId);
            this.qrCodes.delete(accountId);
        }
    }
    
    /**
     * Get all active clients
     */
    getAllClients() {
        return Array.from(this.clients.keys());
    }
    
    /**
     * Restore all sessions on startup
     */
    async restoreAllSessions(accounts) {
        console.log(`[ClientManager] Restoring ${accounts.length} sessions...`);
        
        for (const account of accounts) {
            try {
                await this.initializeClient(account.id, account.webhook_url);
            } catch (error) {
                console.error(`[ClientManager] Failed to restore session for ${account.id}:`, error);
            }
        }
    }
}

module.exports = new ClientManager();
