# Bregonci Service Monitor

Um serviço automatizado para monitorar a disponibilidade de agendamentos no sistema Prenotami do consulado italiano.

## Descrição

Este projeto utiliza Playwright com TypeScript para automatizar a verificação de disponibilidade de agendamentos para serviços de cidadania no sistema Prenotami. O serviço realiza verificações periódicas e envia notificações via webhook quando o serviço está disponível.

## Funcionalidades

- Login automático no sistema Prenotami
- Verificação periódica de disponibilidade de agendamentos
- Notificações via webhook
- Sistema de logs detalhados
- Screenshots de debug
- Limpeza automática de recursos
- Tratamento de encerramento gracioso

## Requisitos

- Node.js 20+
- NPM ou Yarn
- Sistema operacional compatível com Playwright

## Instalação

```bash
# Clonar o repositório
git clone [url-do-repositorio]

# Instalar dependências
npm install

# Preparar ambiente Playwright
npm run prepare
```

## Configuração

Criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
SITE_URL=https://prenotami.esteri.it
LOGIN_EMAIL=seu-email@exemplo.com
LOGIN_PASSWORD=sua-senha
WEBHOOK_URL=sua-url-webhook
CRON_PATTERN="*/15 * * * *"
```

### Variáveis de Ambiente

- `SITE_URL`: URL base do sistema Prenotami
- `LOGIN_EMAIL`: Email de acesso ao sistema
- `LOGIN_PASSWORD`: Senha de acesso
- `WEBHOOK_URL`: URL para envio das notificações
- `CRON_PATTERN`: Padrão cron para intervalo de verificações (padrão: a cada 15 minutos)

## Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run prod
```

## Estrutura do Projeto

```
src/
  ├── services/
  │   ├── browser.service.ts    # Serviço de automação com Playwright
  │   ├── notification.service.ts# Serviço de notificações
  │   └── logger.ts            # Configuração de logs
  ├── config/
  │   └── environment.ts       # Configurações do ambiente
  └── index.ts                 # Ponto de entrada da aplicação
```

## Notificações

O sistema envia notificações via webhook com o seguinte formato:

```json
{
  "timestamp": "2024-11-22T12:00:00.000Z",
  "status": "ONLINE|OFFLINE",
  "success": true|false,
  "message": "Mensagem detalhada",
  "attempt": 1
}
```

## Logs

O sistema mantém logs detalhados de todas as operações, incluindo:
- Inicialização do serviço
- Tentativas de login
- Verificações de disponibilidade
- Envios de notificações
- Erros e exceções

## Manutenção

O sistema inclui:
- Limpeza automática de recursos do browser
- Tratamento de sinais de encerramento (SIGINT)
- Screenshots para debug
- Gerenciamento de sessões

## Licença

MIT License - Veja o arquivo LICENSE para detalhes

## Autor

Bruno Vieira - [GitHub](https://github.com/vieiraes)
```
