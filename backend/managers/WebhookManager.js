const axios = require('axios');

/**
 * WebhookManager - Message Forwarding
 * Forwards incoming WhatsApp messages to configured webhook URLs
 */
class WebhookManager {
    /**
     * Forward message to webhook
     */
    async forwardMessage(accountId, webhookUrl, message) {
        if (!webhookUrl) return;
        
        try {
            const payload = {
                event: 'message',
                direction: 'inbound',
                account_id: accountId,
                message_id: message.id.id,
                from: message.from,
                to: message.to,
                body: message.body,
                type: message.type,
                timestamp: message.timestamp,
                has_media: message.hasMedia,
                is_forwarded: message.isForwarded,
                is_status: message.isStatus,
                is_starred: message.isStarred,
                broadcast: message.broadcast
            };
            
            console.log(`[WebhookManager] Forwarding message from ${accountId} to ${webhookUrl}`);
            
            // Configurable webhook timeout
            const timeout = parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10);
            
            await axios.post(webhookUrl, payload, {
                timeout: timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WhatsApp-Monitor/1.0'
                }
            });
            
            console.log(`[WebhookManager] Message forwarded successfully`);
        } catch (error) {
            console.error(`[WebhookManager] Failed to forward message:`, error.message);
        }
    }
}

module.exports = new WebhookManager();
