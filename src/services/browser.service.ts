const { chromium } = require('playwright');
const { logger } = require('./logger');
const { CONFIG } = require('../config/environment');
import fs from 'fs';
import path from 'path';

// Criar diretório de logs se não existir
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

export class BrowserService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async init() {
        try {
            this.browser = await chromium.launch({
                headless: false,  // Para ver o que está acontecendo
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            });
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
    
            // 1. Acessar página inicial
            await this.page.goto(CONFIG.SITE_URL);
            logger.info('Navegou para a página inicial');
                
            // 2. Verificar se formulário de login está presente
            const emailInput = await this.page.waitForSelector('input[type="email"]');
            const passwordInput = await this.page.waitForSelector('input[type="password"]');
            const loginButton = await this.page.waitForSelector('button[type="submit"].button.primary');
    
            if (!emailInput || !passwordInput || !loginButton) {
                logger.error('Formulário de login não encontrado completamente');
                return false;
            }
            logger.info('Formulário de login encontrado');
    
            // 3. Preencher credenciais
            await emailInput.fill(email);
            await passwordInput.fill(password);
            logger.info('Credenciais preenchidas');
    
            // 4. Clicar e aguardar resposta do servidor
            try {
                await Promise.all([
                    this.page.waitForLoadState('networkidle'),
                    this.page.waitForLoadState('domcontentloaded'),
                    loginButton.click()
                ]);
                logger.info('Clique realizado e aguardando resposta do servidor');
    
                const currentUrl = await this.page.url();
                logger.info(`Página atual após login: ${currentUrl}`);
                
                const screenshotsDir = path.join(__dirname, '..', 'screenshots');
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir);
                }
                
                await this.page.screenshot({ 
                    path: path.join(screenshotsDir, `login-debug-${Date.now()}.png`) 
                });
                logger.info('Screenshot salvo para debug');
    
                // 5. Verificar login
                const isLoggedIn = await this.page.waitForSelector('nav.app-menu')
                    .then(() => true)
                    .catch(() => false);
    
                if (isLoggedIn) {
                    logger.info('Login successful');
                    return true;
                } else {
                    logger.error('Login failed - Menu não encontrado');
                    return false;
                }
    
            } catch (error) {
                logger.error('Erro ao clicar no botão ou aguardar resposta', error);
                return false;
            }
    
        } catch (error) {
            logger.error('Erro geral no processo de login', error);
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
    
            // Esperar página carregar completamente
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            logger.info('Aguardando página estabilizar');
    
            // Procura pelo link Reservar e espera ele ficar realmente clicável
            const reservarLink = await this.page.waitForSelector('a[href="/Services"]', {
                state: 'visible',
                timeout: 10000
            });
            
            await this.page.waitForTimeout(1000 + Math.random() * 2000);
            logger.info('Link Reservar encontrado, preparando para clicar');
    
            await reservarLink.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(5000);
            logger.info('Navegou para página de serviços');
    
            // Aguardar a tabela carregar
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            logger.info('Aguardando tabela de serviços carregar');
    
            // Aqui está a correção principal - usando page.locator diretamente
            await this.page.waitForSelector('tr:has-text("CIDADANIA")');
            const reservarButton = await this.page.locator('tr:has-text("CIDADANIA") a[href="/Services/Booking/4689"] button');
            
            await this.page.waitForTimeout(2000 + Math.random() * 2000);
            logger.info('Botão Reservar encontrado, preparando para clicar');
    
            await reservarButton.click();
            logger.info('Clicou no botão Reservar da Cidadania');
    
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
    
            try {
                // Primeira verificação - procura pelo texto específico
                const messageDivExists = await this.page.locator('div.jconfirm-content:has-text("Sorry, all appointments for this service are currently booked")').isVisible()
                    .then(visible => visible)
                    .catch(() => false);
    
                // Segunda verificação - procura pela estrutura do modal
                const modalExists = await this.page.locator('div.jconfirm-box-container').isVisible()
                    .then(visible => visible)
                    .catch(() => false);
    
                // Sistema está offline se ambas as condições são verdadeiras
                if (messageDivExists && modalExists) {
                    logger.info('Sistema offline - Confirmado por: Modal e Mensagem encontrados');
                    return {
                        success: true,
                        isOnline: false,
                        message: 'Sistema offline - Agendamentos não disponíveis'
                    };
                }
    
                // Se chegou aqui, não encontrou as marcações de indisponibilidade
                logger.info('Sistema online - Modal de indisponibilidade não encontrado');
                return {
                    success: true,
                    isOnline: true,
                    message: 'Sistema online - Agendamentos disponíveis!'
                };
    
            } catch (error) {
                logger.error('Erro ao verificar disponibilidade', error);
                return {
                    success: false,
                    isOnline: false,
                    message: `Erro na verificação: ${error.message}`
                };
            }
    
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