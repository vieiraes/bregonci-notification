// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailPayload {
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE';
    success: boolean;
    message: string;
    attempt: number;
}

export class EmailService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    static async sendNotification(payload: EmailPayload) {
        try {
            const subject = payload.status === 'ONLINE'
                ? '🟢 Sistema Disponível!'
                : '🔴 Sistema Indisponível';

            const emailList = process.env.EMAIL_TO?.split(',').map(email => email.trim());

            const html = `
                <h2>${subject}</h2>
                <p><strong>Status:</strong> ${payload.status}</p>
                <p><strong>Mensagem:</strong> ${payload.message}</p>
                <p><strong>Tentativa:</strong> ${payload.attempt}</p>
                <p><strong>Horário:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
            `;

            logger.info('Tentando enviar email para:', {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject
            });


            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: emailList?.join(','),
                subject,
                html
            });

            logger.info('Email enviado com sucesso', {
                messageId: info.messageId,
                status: 'sent',
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject,
                timestamp: new Date().toISOString(),
                payload
            });

        } catch (error: any) {
            logger.error('Falha ao enviar email', {
                error: error.message,
                code: error.code,
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                payload
            });
        }
    }

    static async sendDailyReport(stats: {
        totalAttempts: number;
        successfulAttempts: number;
        failedAttempts: number;
        lastCheck: string;
    }) {
        try {
            const subject = '📊 Relatório Diário de Monitoramento';
            const html = `
                <h2>Relatório Diário de Monitoramento</h2>
                <p><strong>Total de verificações:</strong> ${stats.totalAttempts}</p>
                <p><strong>Verificações bem sucedidas:</strong> ${stats.successfulAttempts}</p>
                <p><strong>Verificações falhas:</strong> ${stats.failedAttempts}</p>
                <p><strong>Última verificação:</strong> ${stats.lastCheck}</p>
            `;

            logger.info('Tentando enviar relatório diário para:', {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject
            });

            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject,
                html
            });

            logger.info('Relatório diário enviado com sucesso', {
                messageId: info.messageId,
                status: 'sent',
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject,
                timestamp: new Date().toISOString(),
                stats
            });

        } catch (error: any) {
            logger.error('Falha ao enviar relatório diário', {
                error: error.message,
                code: error.code,
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                stats
            });
        }
    }
}