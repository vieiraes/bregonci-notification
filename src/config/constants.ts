// src/config/constants.ts
export const CONFIG = {
    SITE_URL: 'https://prenotami.esteri.it',
    LOGIN_EMAIL: 'ricardo.thenu@gmail.com',
    LOGIN_PASSWORD: 'Teste#2024',
    WEBHOOK_URL: 'https://webhook.site/0d5ade98-5f61-44ba-a3d3-e54bb6762567',
    CRON_PATTERN: '*/15 * * * *'
} as const;

module.exports = CONFIG;