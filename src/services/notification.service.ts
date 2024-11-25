const axios = require('axios');
import { logger } from './logger';
import { CONFIG } from '../index';
import { isFeatureEnabled } from '../config/features';
import { EmailService } from './email.services';

interface WebhookPayload {
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE';
    success: boolean;
    message: string;
    attempt: number;
}

class NotificationService {
    private static attempt = 0;
    private static dailyStats = {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        lastCheck: new Date().toISOString()
    };

    static async notify(isOnline: boolean, success: boolean, message: string) {
        this.attempt++;
        this.updateStats(success);
    
        // Se NOTIFY_ONLY_SUCCESS é true, só notifica se success for true
        if (process.env.NOTIFY_ONLY_SUCCESS === 'true' && !success) {
            logger.info('Notificação ignorada - configurado apenas para sucessos', { success, message });
            return;
        }
    
        const payload: any = {
            timestamp: new Date().toISOString(),
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            success,
            message,
            attempt: this.attempt
        };
    
        // Enviar webhook se habilitado
        if (isFeatureEnabled('WEBHOOK_NOTIFICATION')) {
            await this.sendWebhookNotification(payload);
        }
    
        // Enviar email se habilitado
        if (isFeatureEnabled('EMAIL_NOTIFICATION')) {
            await EmailService.sendNotification(payload);
        }
    }

    private static updateStats(success: boolean) {
        this.dailyStats.totalAttempts++;
        if (success) {
            this.dailyStats.successfulAttempts++;
        } else {
            this.dailyStats.failedAttempts++;
        }
        this.dailyStats.lastCheck = new Date().toISOString();
    }

    private static async sendWebhookNotification(payload: WebhookPayload) {
        try {
            if (!CONFIG.WEBHOOK_URL) {
                throw new Error('Webhook URL não configurada');
            }
            logger.info('Tentando enviar webhook para:', { url: CONFIG.WEBHOOK_URL });
            const response = await axios.post(CONFIG.WEBHOOK_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 7000 // 7 segundos de timeout
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
            // Mantido sem throw error para não crashar o app
        }
    }

    static async sendDailyReport() {
        if (isFeatureEnabled('EMAIL_DAILY_REPORT')) {
            await EmailService.sendDailyReport(this.dailyStats);
            // Reset stats após enviar relatório
            this.dailyStats = {
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

module.exports = { NotificationService };