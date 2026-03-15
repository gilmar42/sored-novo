# Integração Mercado Pago - SORED

Este documento descreve a integração do Mercado Pago como gateway de pagamento no sistema SORED.

## Visão Geral

A integração permite processamento de pagamentos online com os seguintes métodos:
- PIX
- Cartão de crédito
- Cartão de débito
- Boleto

## Estrutura do Código

```
backend/src/
├── payments/
│   ├── controllers/
│   │   └── paymentController.ts     # Controladores da API
│   ├── services/
│   │   ├── paymentService.ts        # Lógica de negócio
│   │   └── mercadoPagoClient.ts     # Cliente Mercado Pago
│   └── repositories/
│       └── paymentRepository.ts     # Acesso aos dados
├── webhooks/
│   └── mercadoPagoWebhookHandler.ts # Handler de webhooks
├── models/
│   ├── Payment.ts                   # Modelo de pagamento
│   └── PaymentEvent.ts              # Modelo de eventos
└── routes/
    ├── payments.ts                  # Rotas de pagamentos
    └── webhooks.ts                  # Rotas de webhooks
```

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=your_access_token_here
MERCADO_PAGO_PUBLIC_KEY=your_public_key_here
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret_here
```

### Configuração no Mercado Pago

1. Acesse o [Painel do Desenvolvedor](https://www.mercadopago.com.br/developers/panel)
2. Vá para "Webhooks"
3. Adicione a URL: `https://api.seusistema.com/api/webhooks/mercadopago`

## Endpoints da API

### Criar Pagamento
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "12345",
  "amount": 100.00,
  "currency": "BRL",
  "paymentMethod": "credit_card",
  "description": "Pedido 12345"
}
```

**Resposta:**
```json
{
  "paymentId": "abc123",
  "checkoutUrl": "https://mercadopago.com/checkout/..."
}
```

### Consultar Pagamento
```http
GET /api/payments/:id
Authorization: Bearer <token>
```

### Reembolsar Pagamento
```http
POST /api/payments/:id/refund
Authorization: Bearer <token>
```

## Webhooks

### Endpoint
```http
POST /api/webhooks/mercadopago
```

O webhook processa automaticamente:
- Atualização de status de pagamentos
- Confirmação de pedidos
- Registro de eventos

## Status de Pagamento

| Mercado Pago | Sistema | Descrição |
|-------------|---------|-----------|
| approved    | pago    | Pagamento aprovado |
| pending     | pendente| Aguardando confirmação |
| rejected    | falhou  | Pagamento rejeitado |
| cancelled   | cancelado| Pagamento cancelado |

## Monitoramento

### Logs
- Criação de pagamentos
- Webhooks recebidos
- Falhas de API
- Reembolsos

### Métricas
- Taxa de aprovação
- Volume de pagamentos
- Falhas de webhook
- Tempo de confirmação

## Testes

### Ambiente Sandbox
Use as credenciais de teste do Mercado Pago para desenvolvimento.

### Testes Necessários
- Criação de pagamento
- Processamento de webhook
- Fluxo completo de pagamento
- Cenários de falha

## Segurança

- Autenticação obrigatória em todas as rotas
- Validação de webhooks
- HTTPS obrigatório
- Logs de auditoria

## Próximos Passos

- Implementar split de pagamentos
- Suporte a múltiplos gateways
- Antifraude
- Assinaturas recorrentes