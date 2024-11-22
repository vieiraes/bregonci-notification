const { chromium } = require('playwright');
const { logger } = require('./logger');
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../index'
import { execSync } from 'child_process';


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

            const delay = 1000 + Math.floor(Math.random() * 4000);
            await new Promise(resolve => setTimeout(resolve, delay));

            this.browser = await chromium.launch({
                headless: false,  // Para ver o que está acontecendo, false = liga o navegador visualmente
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                viewport: { width: 1366, height: 768 }

            });
            this.page = await this.context.newPage();
            logger.info('Browser inicializado');
        } catch (error) {
            logger.error('Failed ao inicializar browser', error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            if (!this.page) throw new Error('Browser not initialized');

            // Configurar timeout maior para navegação
            await this.page.setDefaultNavigationTimeout(60000); // 60 segundos

            // Tentar até 3 vezes em caso de página unavailable
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await this.page.goto(CONFIG.SITE_URL);
                    logger.info(`Tentativa ${attempt}: Navegou para a página inicial`);

                    // Verificar se a página carregou corretamente
                    const unavailable = await this.page.locator('text=Unavailable').isVisible()
                        .then(visible => visible)
                        .catch(() => false);

                    if (unavailable) {
                        logger.warn(`Tentativa ${attempt}: Página indisponível, tentando novamente em 5 segundos`);
                        await this.page.waitForTimeout(5000);
                        continue;
                    }

                    // 2. Verificar se formulário de login está presente
                    const emailInput = await this.page.waitForSelector('input[type="email"]');
                    const passwordInput = await this.page.waitForSelector('input[type="password"]');
                    const loginButton = await this.page.waitForSelector('button[type="submit"].button.primary');

                    if (!emailInput || !passwordInput || !loginButton) {
                        logger.error('Formulário de login não encontrado completamente');
                        continue; // Tenta novamente se não encontrar o formulário
                    }
                    logger.info('Formulário de login encontrado');

                    // 3. Preencher credenciais
                    await emailInput.fill(email);
                    await passwordInput.fill(password);
                    logger.info('Credenciais preenchidas');

                    // 4. Clicar e aguardar resposta do servidor
                    await Promise.all([
                        this.page.waitForLoadState('networkidle'),
                        this.page.waitForLoadState('domcontentloaded'),
                        loginButton.click()
                    ]);
                    logger.info('Clique realizado e aguardando resposta do servidor');

                    const currentUrl = await this.page.url();
                    logger.info(`Página atual após login: ${currentUrl}`);

                    await this.page.screenshot({
                        path: path.join(screenshotsDir, `login-debug-${Date.now()}.png`)
                    });
                    logger.info('Screenshot salvo para debug');

                    // 5. Verificar login
                    const isLoggedIn = await this.page.waitForSelector('nav.app-menu', { timeout: 10000 })
                        .then(() => true)
                        .catch(() => false);

                    if (isLoggedIn) {
                        logger.info('Login successful');
                        return true;
                    }

                    logger.error('Login failed - Menu não encontrado');
                    if (attempt < 3) await this.page.waitForTimeout(5000);

                } catch (error) {
                    logger.error(`Erro na tentativa ${attempt}`, error);
                    if (attempt < 3) await this.page.waitForTimeout(5000);
                }
            }

            return false;

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
            logger.info('Iniciando limpeza dos recursos do browser');

            if (this.page) {
                // Limpar cookies e storage da página atual
                await this.context?.clearCookies();
                await this.page.evaluate(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                }).catch(e => logger.warn('Erro ao limpar storage:', e));

                await this.page.close();
                this.page = null;
                logger.info('Página e dados de sessão limpos');
            }

            if (this.context) {
                await this.context.close();
                this.context = null;
                logger.info('Contexto fechado');
            }

            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                logger.info('Browser fechado');
            }

            // Forçar limpeza de processos do Playwright
            const { execSync } = require('child_process');
            try {
                execSync('pkill -f chromium');
                logger.info('Processos chromium finalizados');
            } catch (error) {
                logger.warn('Nenhum processo chromium encontrado para finalizar');
            }

            logger.info('Limpeza concluída com sucesso');
        } catch (error) {
            logger.error('Falha ao limpar recursos do browser', error);
            throw error;
        }
    }

    async checkActiveBrowsers() {
        try {
            const result = execSync('ps aux | grep chromium').toString();
            logger.info('Processos chromium ativos:', result);
        } catch (error) {
            logger.info('Nenhum processo chromium ativo');
        }
    }

}