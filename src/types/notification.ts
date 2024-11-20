export interface NotificationPayload {
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE';
    success: boolean;
    message: string;
    attempt: number;
}