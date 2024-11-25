// src/config/features.ts
export interface FeatureFlags {
    WEBHOOK_NOTIFICATION: boolean;
    EMAIL_NOTIFICATION: boolean;
    EMAIL_DAILY_REPORT: boolean;
}

export const Features: FeatureFlags = {
    WEBHOOK_NOTIFICATION: process.env.ENABLE_WEBHOOK_NOTIFICATION === 'true',
    EMAIL_NOTIFICATION: process.env.ENABLE_EMAIL_NOTIFICATION === 'true',
    EMAIL_DAILY_REPORT: process.env.ENABLE_EMAIL_DAILY_REPORT === 'true'
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
    return Features[feature] || false;
};