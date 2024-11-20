// src/services/notification.service.ts
import axios from 'axios';
import { logger } from './logger';
import { CONFIG } from '../config/environment';

interface WebhookPayload {
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE';
    success: boolean;
    message: string;
    attempt: number;
}

export class NotificationService {
    private static attempt = 0;

    static async notify(isOnline: boolean, success: boolean, message: string) {
        this.attempt++;

        const payload: WebhookPayload = {
            timestamp: new Date().toISOString(),
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            success,
            message,
            attempt: this.attempt
        };

        try {
            await axios.post(CONFIG.WEBHOOK_URL, payload);
            logger.info('Webhook notification sent', { payload });
        } catch (error) {
            logger.error('Failed to send webhook notification', { error, payload });
            throw error;
        }
    }
}