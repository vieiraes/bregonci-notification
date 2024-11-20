// src/services/browser.service.ts
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { logger } from './logger';
import { CONFIG } from '../config/environment';

export class BrowserService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async init() {
        try {
            this.browser = await chromium.launch({ headless: true });
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
            logger.info('Browser initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize browser', error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            if (!this.page) throw new Error('Browser not initialized');

            await this.page.goto(CONFIG.SITE_URL);

            // Preencher formulário de login
            await this.page.fill('input[type="email"]', email);
            await this.page.fill('input[type="password"]', password);
            await this.page.click('button:has-text("AVANÇAR")');

            // Aguardar navegação e verificar se login foi bem sucedido
            await this.page.waitForLoadState('networkidle');

            // Verificar se está logado (procurar por elemento que só existe após login)
            const isLoggedIn = await this.page.isVisible('text=Meus agendamentos');

            if (isLoggedIn) {
                logger.info('Login successful');
                return true;
            } else {
                logger.error('Login failed - unable to confirm successful login');
                return false;
            }

        } catch (error) {
            logger.error('Login failed with error', error);
            return false;
        }
    }

    async checkCitizenshipAvailability(): Promise<{
        success: boolean;
        isOnline: boolean;
        message: string;
    }> {
        try {
            if (!this.page) throw new Error('Browser not initialized');

            // Navegar para a página de reservas
            await this.page.click('text=Reservar');
            await this.page.waitForLoadState('networkidle');

            // Localizar e clicar no botão de reserva de cidadania
            const citizenshipRow = await this.page.locator('tr', {
                has: this.page.locator('text=CIDADANIA')
            });
            await citizenshipRow.locator('button:has-text("RESERVAR")').click();

            // Aguardar possível popup de indisponibilidade
            try {
                // Tentar encontrar o popup de erro
                const errorPopup = await this.page.locator('text=Sorry, all appointments').waitFor({ timeout: 5000 });
                if (await errorPopup.isVisible()) {
                    return {
                        success: true,
                        isOnline: false,
                        message: 'Sistema offline - Agendamentos não disponíveis'
                    };
                }
            } catch {
                // Se não encontrou o popup, sistema está online
                return {
                    success: true,
                    isOnline: true,
                    message: 'Sistema online - Agendamentos disponíveis!'
                };
            }

            return {
                success: true,
                isOnline: false,
                message: 'Status verificado com sucesso'
            };

        } catch (error) {
            logger.error('Failed to check citizenship availability', error);
            return {
                success: false,
                isOnline: false,
                message: `Erro ao verificar disponibilidade: ${error.message}`
            };
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.context = null;
                this.page = null;
                logger.info('Browser cleaned up successfully');
            }
        } catch (error) {
            logger.error('Failed to cleanup browser', error);
        }
    }
}