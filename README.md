# Bregonci Service Monitor

Sistema automatizado de monitoramento de disponibilidade de agendamentos no sistema Prenotami do consulado italiano, com suporte a múltiplas formas de notificação.

## Descrição

Este projeto utiliza Playwright com TypeScript para automatizar a verificação de disponibilidade de agendamentos para serviços de cidadania no sistema Prenotami. O serviço realiza verificações periódicas e pode enviar notificações via webhook e/ou email quando o serviço está disponível.

## Funcionalidades

- Login automático no sistema
- Verificação periódica de disponibilidade
- Sistema de notificações flexível:
  - Notificações via webhook
  - Notificações por email (suporte a múltiplos destinatários)
  - Relatórios diários por email
- Feature flags para controle de notificações
- Sistema de logs detalhados
- Controle de sucesso/falha nas notificações

## Requisitos

- Node.js 20+
- NPM ou Yarn
- Conta Gmail para envio de emails
- Senha de App do Gmail configurada

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
# Configurações Básicas
SITE_URL=https://prenotami.esteri.it
LOGIN_EMAIL=seu-email@exemplo.com
LOGIN_PASSWORD=sua-senha
WEBHOOK_URL=sua-url-webhook
CRON_PATTERN="*/15 * * * *"

# Feature Flags
ENABLE_WEBHOOK_NOTIFICATION=true
ENABLE_EMAIL_NOTIFICATION=true
ENABLE_EMAIL_DAILY_REPORT=true

# Configuração de Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app-gmail
EMAIL_TO=destinatario1@email.com,destinatario2@email.com

# Regras de Notificação
NOTIFY_ONLY_SUCCESS=false
```

### Variáveis de Ambiente

#### Configurações Básicas
- `SITE_URL`: URL base do sistema Prenotami
- `LOGIN_EMAIL`: Email de acesso ao sistema
- `LOGIN_PASSWORD`: Senha de acesso
- `WEBHOOK_URL`: URL para envio das notificações webhook
- `CRON_PATTERN`: Padrão cron para intervalo de verificações

#### Feature Flags
- `ENABLE_WEBHOOK_NOTIFICATION`: Ativa/desativa notificações webhook
- `ENABLE_EMAIL_NOTIFICATION`: Ativa/desativa notificações por email
- `ENABLE_EMAIL_DAILY_REPORT`: Ativa/desativa relatório diário por email

#### Configuração de Email
- `EMAIL_USER`: Email Gmail que enviará as notificações
- `EMAIL_PASSWORD`: Senha de app do Gmail
- `EMAIL_TO`: Lista de emails destinatários (separados por vírgula)

#### Regras de Notificação
- `NOTIFY_ONLY_SUCCESS`: Se true, notifica apenas sucessos. Se false, notifica todas as tentativas

## Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run prod
```


## Notificações

### Webhook
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

### Email
O sistema suporta dois tipos de notificações por email:
1. Notificações de disponibilidade (instantâneas)
2. Relatórios diários com estatísticas

## Logs

O sistema mantém logs detalhados de todas as operações, incluindo:
- Inicialização do serviço
- Tentativas de login
- Verificações de disponibilidade
- Envios de notificações (webhook e email)
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