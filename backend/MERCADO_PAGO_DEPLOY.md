# 🔐 Configuração de Chaves Mercado Pago para Deploy

## 📋 Chaves Necessárias

### 1. Access Token (Obrigatório)
- **Variável**: `MERCADO_PAGO_ACCESS_TOKEN`
- **Tipo**: Produção ou Teste
- **Uso**: Autenticação para todas as operações da API

### 2. Public Key (Opcional, mas recomendado)
- **Variável**: `MERCADO_PAGO_PUBLIC_KEY`
- **Tipo**: Produção ou Teste
- **Uso**: Tokenização de cartões no frontend

### 3. Webhook Secret (Recomendado para produção)
- **Variável**: `MERCADO_PAGO_WEBHOOK_SECRET`
- **Tipo**: Produção
- **Uso**: Validação de webhooks

## 🚀 Como Obter as Chaves

### Passo 1: Criar Conta no Mercado Pago
1. Acesse [mercadopago.com.br](https://www.mercadopago.com.br)
2. Crie uma conta de vendedor
3. Complete a verificação de identidade

### Passo 2: Acessar Painel do Desenvolvedor
1. Vá para [developers.mercadopago.com.br](https://developers.mercadopago.com.br)
2. Clique em "Suas integrações" > "Nova aplicação"
3. Configure:
   - **Nome**: SORED - Sistema de Orçamentos
   - **Tipo**: Online payments
   - **Site**: URL do seu domínio

### Passo 3: Obter Credenciais

#### Para Testes (Sandbox):
```bash
# No painel do desenvolvedor > Credenciais de teste
MERCADO_PAGO_ACCESS_TOKEN=TEST-123456789012345678901234567890123456
MERCADO_PAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789012
```

#### Para Produção:
```bash
# No painel do desenvolvedor > Credenciais de produção
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-123456789012345678901234567890123456
MERCADO_PAGO_PUBLIC_KEY=APP_USR-12345678-1234-1234-1234-123456789012
```

## 🔒 Configuração por Plataforma

### Heroku

#### Método 1: Dashboard
```bash
# No dashboard do Heroku > App > Settings > Config Vars
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

#### Método 2: CLI
```bash
heroku config:set MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... --app your-app-name
heroku config:set MERCADO_PAGO_PUBLIC_KEY=APP_USR-... --app your-app-name
heroku config:set MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret --app your-app-name
```

### Vercel

#### Método 1: Dashboard
```bash
# No dashboard do Vercel > Project > Settings > Environment Variables
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

#### Método 2: CLI
```bash
vercel env add MERCADO_PAGO_ACCESS_TOKEN
vercel env add MERCADO_PAGO_PUBLIC_KEY
vercel env add MERCADO_PAGO_WEBHOOK_SECRET
```

### Railway

#### Método 1: Dashboard
```bash
# No dashboard do Railway > Project > Variables
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

### AWS (EC2/EB/Lambda)

#### Environment Variables no .env
```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

#### Ou via AWS CLI
```bash
aws elasticbeanstalk update-environment \
  --environment-name your-env \
  --option-settings '[
    {"Namespace": "aws:elasticbeanstalk:application:environment",
     "OptionName": "MERCADO_PAGO_ACCESS_TOKEN",
     "Value": "APP_USR-..."}
  ]'
```

### DigitalOcean App Platform

#### Método 1: Dashboard
```bash
# No dashboard > Apps > your-app > Settings > Environment variables
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

### Render

#### Método 1: Dashboard
```bash
# No dashboard > Service > Environment
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

## 🌐 Configuração do Webhook

### URL do Webhook
```
https://api.seusistema.com/api/webhooks/mercadopago
```

### Como Configurar
1. No painel do Mercado Pago > Developers
2. Vá para "Webhooks"
3. Clique em "Adicionar webhook"
4. Configure:
   - **URL**: `https://api.seusistema.com/api/webhooks/mercadopago`
   - **Eventos**: Marque "payment"

### Verificação de Segurança
O webhook inclui validação básica. Para produção, considere implementar:
- Verificação de assinatura HMAC
- Validação de IP do Mercado Pago
- Rate limiting

## 🔄 Ambiente de Testes vs Produção

### Sandbox (Testes)
```env
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_PUBLIC_KEY=TEST-...
NODE_ENV=development
BASE_URL=http://localhost:3001
```

### Produção
```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=your_secret
NODE_ENV=production
BASE_URL=https://api.seusistema.com
```

## ⚠️ Considerações de Segurança

### 1. Nunca commite chaves no código
```bash
# Adicione ao .gitignore
.env
.env.local
.env.production
```

### 2. Use diferentes chaves para cada ambiente
- **Sandbox**: Para desenvolvimento e testes
- **Produção**: Para ambiente live

### 3. Rotacione chaves periodicamente
- Gere novas chaves a cada 6-12 meses
- Atualize em todos os ambientes

### 4. Monitore uso das chaves
- Configure alertas no Mercado Pago
- Monitore logs de erro

## 🧪 Testes de Configuração

### Teste Básico
```bash
# Verificar se as variáveis estão carregadas
node -e "console.log(process.env.MERCADO_PAGO_ACCESS_TOKEN ? '✅ Access Token OK' : '❌ Access Token faltando')"
```

### Teste de Conectividade
```javascript
// test-mercadopago.js
const mercadopago = require('mercadopago');
require('dotenv').config();

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

mercadopago.preferences.create({
  items: [{
    title: "Teste",
    quantity: 1,
    currency_id: "BRL",
    unit_price: 1.00
  }]
}).then(result => {
  console.log('✅ Conexão OK:', result.body.id);
}).catch(error => {
  console.log('❌ Erro:', error.message);
});
```

## 📊 Checklist para Deploy

- [ ] Conta Mercado Pago criada e verificada
- [ ] Aplicação criada no painel do desenvolvedor
- [ ] Chaves de produção obtidas
- [ ] Webhook URL configurada
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] Testes realizados em sandbox
- [ ] Certificado SSL válido
- [ ] Logs de monitoramento configurados

## 🚨 Troubleshooting

### Erro: "invalid_token"
- Verifique se o Access Token está correto
- Confirme se é token de produção/teste adequado

### Erro: "invalid_scope"
- Verifique permissões da aplicação no Mercado Pago

### Webhook não chega
- Confirme URL HTTPS
- Verifique firewall/antivirus
- Teste com ferramentas como ngrok para desenvolvimento

### Pagamentos não processam
- Verifique se a conta está verificada
- Confirme limites de valor por transação