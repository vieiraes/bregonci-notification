// src/index.ts
import cron from 'node-cron';
import { BrowserService } from './services/browser.service';
import { NotificationService } from './services/notification.service';
import { logger } from './services/logger';
import { CONFIG } from './config/environment';

async function checkAvailability() {
    const browser = new BrowserService();

    try {
        await browser.init();
        const loginSuccess = await browser.login(CONFIG.LOGIN_EMAIL, CONFIG.LOGIN_PASSWORD);

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

    } catch (error) {
        logger.error('Error in availability check', error);
        await NotificationService.notify(
            false,
            false,
            `Erro na verificação: ${error.message}`
        );
    } finally {
        await browser.cleanup();
    }
}

// Inicia o cronograma de verificações
cron.schedule(CONFIG.CHECK_INTERVAL, checkAvailability);

// Primeira verificação imediata
checkAvailability();

logger.info('Service started', {
    checkInterval: CONFIG.CHECK_INTERVAL,
    webhookUrl: CONFIG.WEBHOOK_URL
});