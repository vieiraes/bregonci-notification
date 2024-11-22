// src/index.ts
const CRON_PATTERN = '*/15 * * * *';
const cron = require('node-cron');
const { BrowserService } = require('./services/browser.service');
const { NotificationService } = require('./services/notification.service');
const { logger } = require('./services/logger');
// import { CONFIG } from './config/constants';

// src/index.ts
const CONFIG = {
    LOGIN_EMAIL: 'ricardo.thenu@gmail.com',
    LOGIN_PASSWORD: 'Teste#2024',
    WEBHOOK_URL: 'https://webhook.site/9dd118e9-b2b6-4b0b-adc7-bf9334f05913'
};


async function checkAvailability() {
    const browser = new BrowserService();
    try {
        await browser.init();
        const loginSuccess = await browser.login(String(CONFIG.LOGIN_EMAIL), String(CONFIG.LOGIN_PASSWORD));
        if (!loginSuccess) {
            await NotificationService.notify(false, false, 'Falha no login');
            return;
        }
        const result = await browser.checkCitizenshipAvailability();
        await NotificationService.notify(
            result.isOnline,
            result.success,
            result.message
        );
    } catch (error: any) {
        logger.error('Error in availability check', error);
        await NotificationService.notify(
            false,
            false,
            `Erro na verificação: ${error?.message || 'Erro desconhecido'}`
        );
    } finally {
        await browser.cleanup();
    }
}

cron.schedule(CRON_PATTERN, checkAvailability);
checkAvailability();

logger.info('Service started', {
    checkInterval: CRON_PATTERN,
    webhookUrl: CONFIG.WEBHOOK_URL
});