# Pagamento PIX - SORED Backend

Este documento descreve como implementar e usar pagamentos via PIX no sistema SORED através da integração com Mercado Pago.

## 🚀 Funcionalidades PIX

### Implementadas
- ✅ Criação de pagamento PIX instantâneo
- ✅ Geração de QR Code PIX
- ✅ Chave de copiar e colar
- ✅ Consulta de status em tempo real
- ✅ Validação de dados do pagador
- ✅ Tratamento de expiração de pagamento
- ✅ Webhook para notificações

### API Endpoints PIX
- `POST /api/payments/pix/create` - Criar pagamento PIX
- `GET /api/payments/pix/qrcode/:paymentId` - Obter QR Code PIX
- `GET /api/payments/pix/status/:paymentId` - Consultar status PIX

## 📋 Requisitos

### Dados do Pagador
Para criar um pagamento PIX, são necessários os seguintes dados:

```json
{
  "orderId": "order-123",
  "amount": 100.00,
  "description": "Orçamento #123",
  "payerEmail": "cliente@exemplo.com",
  "payerFirstName": "João",
  "payerLastName": "Silva",
  "payerCpf": "123.456.789-01"
}
```

### Validações Aplicadas
- **Email**: Formato válido de email
- **CPF**: 11 dígitos numéricos, sem sequências repetidas
- **Nome**: Primeiro nome e sobrenome obrigatórios
- **Valor**: Maior que zero
- **Descrição**: Texto não vazio

## 🔧 Implementação

### 1. Criar Pagamento PIX

```javascript
const response = await fetch('/api/payments/pix/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: 'order-123',
    amount: 100.00,
    description: 'Orçamento #123',
    payerEmail: 'cliente@exemplo.com',
    payerFirstName: 'João',
    payerLastName: 'Silva',
    payerCpf: '12345678901'
  })
});

const { paymentId, status, transactionAmount, dateOfExpiration } = await response.json();
```

**Resposta:**
```json
{
  "paymentId": "12345678901",
  "status": "pending",
  "transactionAmount": 100.00,
  "dateOfExpiration": "2024-01-01T12:00:00.000Z"
}
```

### 2. Obter QR Code PIX

```javascript
const response = await fetch(`/api/payments/pix/qrcode/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { qrCode, qrCodeText, copyAndPasteKey, expirationDate, amount, status } = await response.json();
```

**Resposta:**
```json
{
  "qrCode": "iVBORw0KGgoAAAANSUhEUgAA...",
  "qrCodeText": "00020101021226830014br.gov.bcb.pix...",
  "copyAndPasteKey": "00020101021226830014br.gov.bcb.pix...",
  "expirationDate": "2024-01-01T12:00:00.000Z",
  "amount": 100.00,
  "status": "pending"
}
```

### 3. Consultar Status PIX

```javascript
const response = await fetch(`/api/payments/pix/status/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { paymentId, status, statusDetail, amount, dateCreated, dateApproved } = await response.json();
```

**Resposta:**
```json
{
  "paymentId": "12345678901",
  "status": "approved",
  "statusDetail": "accredited",
  "amount": 100.00,
  "dateCreated": "2024-01-01T10:00:00.000Z",
  "dateApproved": "2024-01-01T10:05:00.000Z",
  "qrCode": "00020101021226830014br.gov.bcb.pix...",
  "qrCodeBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "copyAndPasteKey": "00020101021226830014br.gov.bcb.pix..."
}
```

## 🎯 Status do Pagamento

| Status | Descrição | Ação |
|--------|-----------|------|
| `pending` | Pagamento aguardando pagamento | Exibir QR Code |
| `approved` | Pagamento aprovado | Confirmar pedido |
| `rejected` | Pagamento rejeitado | Informar cliente |
| `cancelled` | Pagamento cancelado | Permitir novo pagamento |

## 💻 Exemplo Frontend (React)

### Componente PIX Payment

```jsx
import React, { useState, useEffect } from 'react';

const PixPayment = ({ orderId, amount, description, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('pending');

  // Criar pagamento PIX
  const createPixPayment = async (payerData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          amount,
          description,
          ...payerData
        })
      });

      const payment = await response.json();
      setPaymentData(payment);
      
      // Obter QR Code
      await getQrCode(payment.paymentId);
      
      // Iniciar polling de status
      startStatusPolling(payment.paymentId);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Obter QR Code
  const getQrCode = async (paymentId) => {
    try {
      const response = await fetch(`/api/payments/pix/qrcode/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const qrData = await response.json();
      setQrCode(qrData);
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
    }
  };

  // Polling de status
  const startStatusPolling = (paymentId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/pix/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const statusData = await response.json();
        setStatus(statusData.status);

        if (statusData.status === 'approved') {
          clearInterval(interval);
          onSuccess(statusData);
        } else if (statusData.status === 'rejected' || statusData.status === 'cancelled') {
          clearInterval(interval);
          onError(new Error('Pagamento não aprovado'));
        }
      } catch (error) {
        console.error('Erro ao consultar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    // Limpar intervalo após 30 minutos
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  return (
    <div className="pix-payment">
      {!paymentData ? (
        <PixForm onSubmit={createPixPayment} loading={loading} />
      ) : (
        <PixDisplay 
          qrCode={qrCode}
          status={status}
          paymentData={paymentData}
        />
      )}
    </div>
  );
};

// Formulário de dados do pagador
const PixForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    payerEmail: '',
    payerFirstName: '',
    payerLastName: '',
    payerCpf: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.payerEmail}
          onChange={(e) => setFormData({...formData, payerEmail: e.target.value})}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Nome:</label>
          <input
            type="text"
            value={formData.payerFirstName}
            onChange={(e) => setFormData({...formData, payerFirstName: e.target.value})}
            required
          />
        </div>
        <div>
          <label>Sobrenome:</label>
          <input
            type="text"
            value={formData.payerLastName}
            onChange={(e) => setFormData({...formData, payerLastName: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <label>CPF:</label>
        <input
          type="text"
          value={formData.payerCpf}
          onChange={(e) => setFormData({...formData, payerCpf: e.target.value})}
          placeholder="123.456.789-01"
          required
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? 'Gerando pagamento...' : 'Gerar PIX'}
      </button>
    </form>
  );
};

// Display do QR Code e status
const PixDisplay = ({ qrCode, status, paymentData }) => {
  if (!qrCode) return <div>Carregando QR Code...</div>;

  return (
    <div className="text-center space-y-4">
      <h3>Pagamento PIX</h3>
      
      {/* QR Code */}
      <div className="inline-block p-4 bg-white rounded-lg shadow">
        <img 
          src={`data:image/png;base64,${qrCode.qrCode}`} 
          alt="QR Code PIX"
          className="w-64 h-64"
        />
      </div>
      
      {/* Chave de copiar e colar */}
      <div className="bg-gray-100 p-3 rounded">
        <p className="text-sm text-gray-600 mb-2">Chave PIX (copiar e colar):</p>
        <code className="text-xs break-all">{qrCode.copyAndPasteKey}</code>
        <button 
          onClick={() => navigator.clipboard.writeText(qrCode.copyAndPasteKey)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          📋 Copiar
        </button>
      </div>
      
      {/* Status */}
      <div className={`inline-block px-4 py-2 rounded-full ${
        status === 'approved' ? 'bg-green-100 text-green-800' :
        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        Status: {status === 'approved' ? 'Aprovado ✅' :
                status === 'pending' ? 'Aguardando pagamento ⏳' :
                'Não aprovado ❌'}
      </div>
      
      {/* Informações */}
      <div className="text-sm text-gray-600">
        <p>Valor: R$ {qrCode.amount.toFixed(2)}</p>
        <p>Expira em: {new Date(qrCode.expirationDate).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default PixPayment;
```

## 🔍 Testes

### Testar Integração PIX

1. **Criar pagamento PIX:**
```bash
curl -X POST http://localhost:3001/api/payments/pix/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": "test-pix-123",
    "amount": 10.00,
    "description": "Teste PIX",
    "payerEmail": "test@exemplo.com",
    "payerFirstName": "Test",
    "payerLastName": "User",
    "payerCpf": "12345678901"
  }'
```

2. **Obter QR Code:**
```bash
curl -X GET http://localhost:3001/api/payments/pix/qrcode/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Consultar status:**
```bash
curl -X GET http://localhost:3001/api/payments/pix/status/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 Tratamento de Erros

### Erros Comuns

1. **Dados inválidos**
   - Verifique formato do email e CPF
   - Confirme todos os campos obrigatórios

2. **Pagamento expirado**
   - Verifique `dateOfExpiration`
   - Permita gerar novo pagamento

3. **Status não encontrado**
   - Verifique se `paymentId` está correto
   - Confirme se o pagamento foi criado

### Logs Importantes
- Criação de pagamento PIX
- Geração de QR Code
- Mudanças de status
- Erros de validação

## 📱 Fluxo Completo PIX

1. **Cliente** preenche dados → `POST /api/payments/pix/create`
2. **Backend** cria pagamento no Mercado Pago → retorna `paymentId`
3. **Backend** gera QR Code → `GET /api/payments/pix/qrcode/:paymentId`
4. **Cliente** escaneia QR Code ou copia chave
5. **Cliente** realiza pagamento no app bancário
6. **Mercado Pago** envia webhook → `POST /api/webhooks/mercadopago`
7. **Backend** atualiza status → notifica frontend
8. **Frontend** confirma pagamento → redireciona para sucesso

## ⚡ Performance

### Recomendações
- Cache de QR Codes por 5 minutos
- Polling de status a cada 5 segundos
- Limpar polling após 30 minutos
- Compressão de imagens QR Code

### Monitoramento
- Tempo de geração de QR Code
- Taxa de conversão PIX
- Erros por tipo
- Latência de status

---

🎉 **Pagamento PIX totalmente integrado e pronto para uso!**

Para usar, basta chamar os endpoints da API PIX conforme documentado. O sistema cuidará do resto!
