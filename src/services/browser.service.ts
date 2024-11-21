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

            // Dentro do método checkCitizenshipAvailability, após a navegação para a página de serviços

            // Aguardar a tabela carregar completamente
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            logger.info('Aguardando tabela de serviços carregar');

            // Localizar especificamente a linha da CIDADANIA
            const citizenshipRow = await this.page.waitForSelector('tr:has(td:text("Cidadania por descendência"))', {
                state: 'visible',
                timeout: 10000
            });

            // Verificar se encontrou a linha correta
            const rowText = await citizenshipRow.textContent();
            logger.info(`Linha encontrada: ${rowText}`);

            // Delay aleatório antes de clicar
            await this.page.waitForTimeout(2000 + Math.random() * 2000);

            // Clicar especificamente no botão desta linha usando o link específico
            await this.page.click('a[href="/Services/Booking/4689"] button.button.primary');
            logger.info('Clicou no botão Reservar da Cidadania');

            // Aguardar possível resposta
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);


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
                    // Aguarda requisição de rede completar
                    this.page.waitForLoadState('networkidle'),
                    // Aguarda carregamento do DOM
                    this.page.waitForLoadState('domcontentloaded'),
                    // Clica no botão
                    loginButton.click()
                ]);
                logger.info('Clique realizado e aguardando resposta do servidor');

                await this.page.screenshot({
                    path: path.join(screenshotsDir, `login-debug-${Date.now()}.png`)
                });

                const currentUrl = await this.page.url();
                logger.info(`Página atual após login: ${currentUrl}`);

                await this.page.screenshot({ path: 'login-debug.png' });
                logger.info('Screenshot salvo para debug');

                // Continua com o resto do código...
                const appMenu = await this.page.waitForSelector('nav.app-menu');
            } catch (error) {
                logger.error('Erro ao clicar no botão ou aguardar resposta', error);
                return false;
            }

            // 5. Verificar resultado do login
            try {
                // Primeiro verifica se tem mensagem de erro de login
                const hasError = await this.page.locator('text="Usuário ou senha inválidos"').isVisible()
                    .then(visible => visible)
                    .catch(() => false);

                if (hasError) {
                    logger.error('Login falhou - Credenciais inválidas');
                    return false;
                }

                // Se não tem erro, aguarda o menu aparecer (sem timeout)
                const appMenu = await this.page.waitForSelector('nav.app-menu');
                const isLoggedIn = await appMenu.isVisible();

                if (isLoggedIn) {
                    // Verifica se o menu tem o texto esperado
                    const reservarLink = await this.page.locator('a[href="/Services"]').isVisible();
                    if (reservarLink) {
                        logger.info('Login realizado com sucesso - Menu completo encontrado');
                        return true;
                    }
                }

                logger.error('Login falhou - Página pós-login não carregou corretamente');
                return false;

            } catch (error) {
                logger.error('Erro ao verificar resultado do login', error);
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
            await this.page.waitForTimeout(3000); // Espera 3 segundos
            logger.info('Aguardando página estabilizar');

            // Procura pelo link Reservar e espera ele ficar realmente clicável
            const reservarLink = await this.page.waitForSelector('a[href="/Services"]', {
                state: 'visible',
                timeout: 10000
            });

            // Delay aleatório como humano (entre 1 e 3 segundos)
            await this.page.waitForTimeout(1000 + Math.random() * 2000);
            logger.info('Link Reservar encontrado, preparando para clicar');

            // Clicar e esperar carregamento completo
            await reservarLink.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(5000); // Espera 5 segundos após navegação
            logger.info('Navegou para página de serviços');

            // Debug
            const currentUrl = await this.page.url();
            logger.info(`URL atual: ${currentUrl}`);
            await this.page.screenshot({
                path: path.join(__dirname, '..', 'screenshots', `reservar-debug-${Date.now()}.png`)
            });

            // Procurar e aguardar a linha da CIDADANIA
            const citizenshipRow = await this.page.waitForSelector('tr:has-text("CIDADANIA")', {
                state: 'visible',
                timeout: 10000
            });

            // Mais um delay aleatório antes de clicar
            await this.page.waitForTimeout(1000 + Math.random() * 2000);
            logger.info('Encontrou linha da CIDADANIA, preparando para clicar');

            // Clicar no botão RESERVAR
            await citizenshipRow.locator('button:has-text("RESERVAR")').click();
            logger.info('Clicou no botão Reservar da Cidadania');

            // Esperar possível popup de indisponibilidade
            try {
                const errorPopup = await this.page.locator('text=Sorry, all appointments').waitFor({
                    state: 'visible',
                    timeout: 5000
                });

                if (await errorPopup.isVisible()) {
                    logger.info('Sistema offline - Popup de indisponibilidade encontrado');
                    return {
                        success: true,
                        isOnline: false,
                        message: 'Sistema offline - Agendamentos não disponíveis'
                    };
                }
            } catch {
                logger.info('Sistema online - Nenhum popup de indisponibilidade encontrado');
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