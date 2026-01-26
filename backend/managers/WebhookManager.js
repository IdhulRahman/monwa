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
            
            await axios.post(webhookUrl, payload, {
                timeout: 5000,
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
