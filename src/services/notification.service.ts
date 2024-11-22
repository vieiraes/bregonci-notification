const axios = require('axios');
import { logger } from './logger';
import { CONFIG } from '../index'

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
            if (!CONFIG.WEBHOOK_URL) {
                throw new Error('Webhook URL não configurada');
            }
            logger.info('Tentando enviar webhook para:', { url: CONFIG.WEBHOOK_URL });
            const response = await axios.post(CONFIG.WEBHOOK_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 7000 // 5 segundos de timeout
            });
            logger.info('Webhook enviado com sucesso', { 
                status: response.status,
                statusText: response.statusText,
                payload 
            });
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                logger.error('Erro no envio do webhook', {
                    message: error.message,
                    url: CONFIG.WEBHOOK_URL,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    payload
                });
            } else {
                logger.error('Erro desconhecido ao enviar webhook', {
                    error,
                    payload
                });
            }
            // Removido o throw error para não crashar o app
        }
    }
}

module.exports = { NotificationService };