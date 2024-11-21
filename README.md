# Bregonci Notification

Sistema automatizado de monitoramento de disponibilidade de serviços no site prenotami.esteri.it.

## Descrição

Este projeto utiliza Playwright com TypeScript para automatizar a verificação de disponibilidade de agendamentos para serviços de cidadania no sistema do consulado italiano.

## Funcionalidades

- Login automático no sistema
- Verificação periódica de disponibilidade
- Notificação via webhook quando o serviço está disponível
- Simulação de comportamento humano para evitar bloqueios
- Sistema de logs e screenshots para debug

## Instalação

```bash
# Instalar dependências
npm install

# Preparar ambiente (instala browsers necessários)
npm run prepare
```

## Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run prod
```

## Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```plaintext
WEBHOOK_URL=sua-url-do-webhook
LOGIN_EMAIL=seu-email
LOGIN_PASSWORD=sua-senha
SITE_URL=https://seusite.com
CHECK_INTERVAL="*/15 * * * *"
```

