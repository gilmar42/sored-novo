# 🚀 Guia de Deploy - Mercado Pago Integration

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

1. ✅ **Conta Mercado Pago** criada e verificada
2. ✅ **Aplicação** configurada no painel do desenvolvedor
3. ✅ **Chaves de produção** obtidas
4. ✅ **Webhook URL** configurada
5. ✅ **Certificado SSL** válido para produção

## 🔧 Configuração das Chaves

### 1. Obter Credenciais

Acesse [developers.mercadopago.com.br](https://developers.mercadopago.com.br):

#### Para Desenvolvimento/Testes:
```bash
# Credenciais de teste (sandbox)
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_PUBLIC_KEY=TEST-...
```

#### Para Produção:
```bash
# Credenciais de produção
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Configurar Webhook

No painel do Mercado Pago > Webhooks:
- **URL**: `https://api.seusistema.com/api/webhooks/mercadopago`
- **Eventos**: `payment`

## 🌐 Deploy por Plataforma

### Heroku

```bash
# Instalar Heroku CLI e fazer login
heroku login

# Criar app (se não existir)
heroku create your-app-name

# Configurar variáveis
heroku config:set MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... --app your-app-name
heroku config:set MERCADO_PAGO_PUBLIC_KEY=APP_USR-... --app your-app-name
heroku config:set MERCADO_PAGO_WEBHOOK_SECRET=your_secret --app your-app-name
heroku config:set NODE_ENV=production --app your-app-name
heroku config:set BASE_URL=https://your-app-name.herokuapp.com --app your-app-name

# Deploy
git push heroku main
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Configurar variáveis
vercel env add MERCADO_PAGO_ACCESS_TOKEN
vercel env add MERCADO_PAGO_PUBLIC_KEY
vercel env add MERCADO_PAGO_WEBHOOK_SECRET

# Deploy
vercel --prod
```

### Railway

```bash
# No dashboard do Railway:
# Project > Variables

MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_secret
NODE_ENV=production
BASE_URL=https://your-project.railway.app
```

### DigitalOcean App Platform

```bash
# No dashboard > Apps > your-app > Settings > Environment variables

MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_secret
NODE_ENV=production
BASE_URL=https://your-app.ondigitalocean.app
```

### Render

```bash
# Conectar repositório Git
# No dashboard > Service > Environment

MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_secret
NODE_ENV=production
BASE_URL=https://your-service.onrender.com
```

### AWS Elastic Beanstalk

```bash
# Criar arquivo .ebextensions/environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    MERCADO_PAGO_ACCESS_TOKEN: APP_USR-...
    MERCADO_PAGO_PUBLIC_KEY: APP_USR-...
    MERCADO_PAGO_WEBHOOK_SECRET: your_secret
    NODE_ENV: production
    BASE_URL: https://your-app.elasticbeanstalk.com

# Deploy
eb deploy
```

## 🧪 Validação Pré-Deploy

### Executar Validação Automática

```bash
# Configurar variáveis no .env
cp .env.example .env
# Editar .env com suas chaves

# Executar validação
node validate-mercadopago.js
```

### Checklist Manual

- [ ] Access Token começa com `APP_USR-` (produção)
- [ ] Public Key começa com `APP_USR-` (produção)
- [ ] BASE_URL usa HTTPS em produção
- [ ] Webhook URL acessível externamente
- [ ] Certificado SSL válido

## 🔒 Segurança em Produção

### 1. Variáveis de Ambiente
- ✅ Nunca commite chaves no código
- ✅ Use diferentes chaves por ambiente
- ✅ Rotacione chaves periodicamente

### 2. Webhook Security
- ✅ Implemente validação de assinatura
- ✅ Configure rate limiting
- ✅ Monitore logs de webhook

### 3. Monitoramento
```bash
# Configurar alertas para:
- Falhas de webhook
- Taxa de erro de API
- Tempo de resposta
```

## 🚨 Troubleshooting

### Problema: Webhook não chega
```bash
# Verificar se URL está acessível
curl -X POST https://api.seusistema.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Problema: Pagamentos falham
```bash
# Verificar logs da aplicação
heroku logs --tail --app your-app-name

# Verificar status da conta Mercado Pago
# Acesse: https://www.mercadopago.com.br/activities
```

### Problema: Invalid Token
- ✅ Verifique se está usando chaves de produção
- ✅ Confirme se a aplicação está ativa
- ✅ Valide permissões da conta

## 📊 Monitoramento Pós-Deploy

### Métricas Importantes
- Taxa de aprovação de pagamentos
- Tempo médio de processamento
- Taxa de falha de webhooks
- Volume de transações

### Logs Essenciais
```javascript
// Monitorar estes eventos:
- payment.created
- payment.approved
- payment.failed
- webhook.received
- webhook.processed
```

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Teste real** com valor mínimo
2. **Configure alertas** no Mercado Pago
3. **Monitore dashboards** por 24-48h
4. **Documente** procedimentos de rollback
5. **Planeje** rotação de chaves

## 📞 Suporte

- **Mercado Pago**: [developers.mercadopago.com.br](https://developers.mercadopago.com.br)
- **Documentação**: Ver `PAYMENT_INTEGRATION.md`
- **Logs**: Verifique logs da plataforma de hospedagem

---

## 📝 Scripts Úteis

```bash
# Validar configuração
node validate-mercadopago.js

# Gerar comandos para plataforma específica
node setup-deploy.js heroku

# Verificar saúde da API
curl https://api.seusistema.com/api/health
```

**Lembre-se**: Teste sempre em sandbox antes de produção! 🧪