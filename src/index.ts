require('dotenv').config()
// const CRON_PATTERN = '*/15 * * * *';
const cron = require('node-cron');
const { BrowserService } = require('./services/browser.service');
const { NotificationService } = require('./services/notification.service');
const { logger } = require('./services/logger');

export const CONFIG = {
    LOGIN_EMAIL: process.env.LOGIN_EMAIL,
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,
    WEBHOOK_URL: process.env.WEBHOOK_URL,
    SITE_URL: process.env.SITE_URL,
    CRON_PATTERN: process.env.CRON_PATTERN
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

// No arquivo index.ts
process.on('SIGINT', async () => {
    logger.info('Recebido sinal de encerramento, limpando recursos...');
    try {
        // Limpar browser service
        const browser = new BrowserService();
        await browser.cleanup();

        // Aguardar um pouco para garantir limpeza
        await new Promise(resolve => setTimeout(resolve, 1000));

        logger.info('Recursos limpos com sucesso');
        process.exit(0);
    } catch (error) {
        logger.error('Erro ao limpar recursos', error);
        process.exit(1);
    }
});

cron.schedule(CONFIG.CRON_PATTERN, checkAvailability);
checkAvailability();

logger.info('Service started', {
    checkInterval: CONFIG.CRON_PATTERN,
    webhookUrl: CONFIG.WEBHOOK_URL
});
