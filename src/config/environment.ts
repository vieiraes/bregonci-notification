export const CONFIG = {
    WEBHOOK_URL: process.env.WEBHOOK_URL || '',
    CHECK_INTERVAL: process.env.CHECK_INTERVAL || '*/15 * * * *',
    LOGIN_URL: 'https://prenotami.esteri.it',
    LOGIN_EMAIL: process.env.LOGIN_EMAIL || '',
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD || '',
    SITE_URL: process.env.SITE_URL || 'https://prenotami.esteri.it',
}