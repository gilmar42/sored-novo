# Integração Mercado Pago - SORED Backend

Este documento descreve como configurar e usar a integração com o Mercado Pago no sistema SORED.

## 🚀 Funcionalidades Implementadas

### Gateway de Pagamento
- ✅ Criação de preferências de pagamento
- ✅ Processamento de webhooks
- ✅ Consulta de status de pagamentos
- ✅ Reembolso de pagamentos
- ✅ Validação de assinatura de webhook
- ✅ Suporte para ambiente de sandbox e produção

### API Endpoints
- `POST /api/payments/checkout` - Criar sessão de checkout
- `GET /api/payments/status/:paymentId` - Consultar status do pagamento
- `GET /api/payments/public-key` - Obter chave pública do Mercado Pago
- `POST /api/webhooks/mercadopago` - Webhook do Mercado Pago

### Segurança
- ✅ Validação de token de acesso
- ✅ Verificação de assinatura de webhook
- ✅ Tratamento de erros
- ✅ Logging detalhado

## 📋 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Mercado Pago - Produção
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI
MERCADO_PAGO_PUBLIC_KEY=SUA_CHAVE_PUBLICA_AQUI

# Mercado Pago - Webhook (opcional)
MERCADO_PAGO_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_AQUI

# URL base da aplicação
BASE_URL=https://seu-dominio.com

# Origens permitidas para CORS
ALLOWED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

### Configuração de Desenvolvimento

Para testes, use as credenciais de sandbox:

```bash
MERCADO_PAGO_ACCESS_TOKEN=TEST-123456789012345678901234567890123456
MERCADO_PAGO_PUBLIC_KEY=TEST-12345678-1234-1234-123456789012
```

## 🔧 Scripts de Deploy

### Validação da Configuração
```bash
npm run validate-mercadopago
```

### Setup de Deploy
```bash
npm run setup-deploy
```

## 🌐 Plataformas Suportadas

### Heroku
1. Configure as variáveis de ambiente no painel do Heroku
2. Use o arquivo `deploy/heroku.json` como referência
3. Deploy automático via GitHub Actions

### Vercel
1. Configure as variáveis de ambiente no painel da Vercel
2. Use o arquivo `deploy/vercel.json.example` como referência (exemplo)
   - Observação: este backend é um servidor Express (não serverless). Para Vercel funcionar, é necessário adaptar para funções serverless/Edge. Em VPS/Docker costuma ser mais simples.
3. Deploy automático via GitHub Actions

### Docker
1. Build da imagem:
```bash
docker build -f docker/Dockerfile.prod -t sored-backend .
```

2. Execute com docker-compose:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Kubernetes
1. Configure os secrets no cluster:
```bash
kubectl create secret generic sored-secrets \
  --from-literal=mongodb-uri=$MONGODB_URI \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=base-url=$BASE_URL \
  --from-literal=allowed-origins=$ALLOWED_ORIGINS \
  --from-literal=mercado-pago-access-token=$MERCADO_PAGO_ACCESS_TOKEN \
  --from-literal=mercado-pago-public-key=$MERCADO_PAGO_PUBLIC_KEY
```

2. Deploy:
```bash
kubectl apply -f k8s/deployment.yaml
```

## 💻 Exemplos de Uso

### Criar Sessão de Checkout

```javascript
const response = await fetch('/api/payments/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: 'order-123',
    amount: 100.00,
    description: 'Orçamento #123',
    returnUrl: 'https://seu-dominio.com/sucesso'
  })
});

const { preferenceId, initPoint, sandbox } = await response.json();
```

### Consultar Status do Pagamento

```javascript
const response = await fetch(`/api/payments/status/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const payment = await response.json();
```

### Obter Chave Pública

```javascript
const response = await fetch('/api/payments/public-key', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { publicKey } = await response.json();
```

## 🔗 Integração Frontend

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const MercadoPagoCheckout = ({ orderId, amount, description, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    // Obter chave pública do Mercado Pago
    fetch('/api/payments/public-key')
      .then(res => res.json())
      .then(data => setPublicKey(data.publicKey));
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          amount,
          description,
          returnUrl: window.location.origin + '/pagamento/sucesso'
        })
      });

      const { initPoint } = await response.json();
      
      // Redirecionar para o checkout do Mercado Pago
      window.location.href = initPoint;
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePayment}
        disabled={loading || !publicKey}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? 'Processando...' : 'Pagar com Mercado Pago'}
      </button>
    </div>
  );
};

export default MercadoPagoCheckout;
```

## 📱 Webhook Configuration

Configure o webhook no painel do Mercado Pago:

**URL do Webhook:**
```
https://seu-dominio.com/api/webhooks/mercadopago
```

**Importante (produção):**
- A URL acima precisa ser **HTTPS** e publicamente acessível pelo Mercado Pago.
- Configure `BASE_URL` para apontar para a mesma origem que atende `/api/webhooks/mercadopago`.
- Se `MERCADO_PAGO_WEBHOOK_SECRET` estiver configurado, o backend valida a assinatura via headers `x-signature` e `x-request-id` e rejeita com `401` se for inválida.
- Opcional: ajuste `MERCADO_PAGO_WEBHOOK_TOLERANCE_MS` (padrão `600000`) para tolerância do timestamp `ts` (anti-replay).

**Eventos:**
- `payment`
- `merchant_order`

## 🔍 Testes

### Testar Integração

1. Inicie o backend:
```bash
npm run dev
```

2. Valide a configuração:
```bash
npm run validate-mercadopago
```

3. Teste os endpoints:
```bash
# Criar preferência
curl -X POST http://localhost:3001/api/payments/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": "test-123",
    "amount": 100.00,
    "description": "Teste de integração",
    "returnUrl": "http://localhost:3000/sucesso"
  }'

# Consultar status
curl -X GET http://localhost:3001/api/payments/status/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obter chave pública
curl -X GET http://localhost:3001/api/payments/public-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 Monitoramento e Logs

### Logs Importantes
- Configuração do Mercado Pago
- Criação de preferências
- Processamento de webhooks
- Erros de autenticação
- Falhas de pagamento

### Métricas
- Tempo de resposta da API
- Taxa de sucesso de pagamentos
- Erros por tipo

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Token Inválido**
   - Verifique se `MERCADO_PAGO_ACCESS_TOKEN` está correto
   - Confirme se está usando o token do ambiente correto (sandbox/produção)

2. **CORS Bloqueado**
   - Verifique `ALLOWED_ORIGINS` no `.env`
   - Confirme a URL no frontend

3. **Webhook Não Recebido**
   - Verifique se a URL está correta e acessível
   - Confirme se o firewall permite acesso externo

4. **Pagamento Não Processado**
   - Verifique os logs do webhook
   - Confirme se a external_reference está correta

### Debug Mode

Para habilitar debug mode:
```bash
DEBUG=mercadopago:* npm run dev
```

## 📞 Suporte

- **Documentação Mercado Pago**: https://www.mercadopago.com.br/developers/
- **Status da API**: https://status.mercadopago.com.br/
- **Repositório SORED**: https://github.com/sua-org/sored-novo

---

## 🔄 Fluxo Completo

1. **Cliente** solicita criação de pagamento → `/api/payments/checkout`
2. **Backend** cria preferência no Mercado Pago → retorna URL de checkout
3. **Cliente** é redirecionado para o checkout do Mercado Pago
4. **Cliente** realiza pagamento no ambiente do Mercado Pago
5. **Mercado Pago** envia webhook → `/api/webhooks/mercadopago`
6. **Backend** processa webhook e atualiza status do pagamento
7. **Cliente** consulta status → `/api/payments/status/:paymentId`

🎉 **Integração completa e pronta para produção!**
