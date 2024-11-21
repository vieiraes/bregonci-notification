const axios = require('axios');
import { logger } from './logger';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://webhook.site/0d5ade98-5f61-44ba-a3d3-e54bb6762567';


interface WebhookPayload {
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE';
    success: boolean;
    message: string;
    attempt: number;
}


class NotificationService {
    private static attempt = 0;

    static async notify(isOnline: boolean, success: boolean, message: string) {
        this.attempt++;

        const payload = {
            timestamp: new Date().toISOString(),
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            success,
            message,
            attempt: this.attempt
        };

        try {
            if (!WEBHOOK_URL) {
                throw new Error('Webhook URL não configurada');
            }
            await axios.post(WEBHOOK_URL, payload);
            logger.info('Webhook notification sent', { payload });
        } catch (error) {
            logger.error('Failed to send webhook notification', { error, payload });
            throw error;
        }
    }
}

module.exports = { NotificationService };
