#!/usr/bin/env node

const mercadopago = require('mercadopago');
require('dotenv').config();

console.log('🔍 Validando configuração do Mercado Pago...');

// Verificar se as variáveis de ambiente estão configuradas
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

if (!accessToken) {
  console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não está configurado');
  process.exit(1);
}

if (!publicKey) {
  console.error('❌ MERCADO_PAGO_PUBLIC_KEY não está configurado');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente configuradas');

// Validar formato do token
if (accessToken.startsWith('TEST-')) {
  console.log('🧪 Usando credenciais de TESTE (Sandbox)');
} else {
  console.log('🚀 Usando credenciais de PRODUÇÃO');
}

// Testar configuração básica
try {
  mercadopago.configurations.setAccessToken(accessToken);
  
  // Criar uma preferência de teste para validar a conexão
  const testPreference = {
    items: [{
      title: 'Teste de Validação',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: 1
    }],
    notification_url: 'https://example.com/webhook',
    external_reference: 'test_validation_' + Date.now()
  };

  const result = await mercadopago.preferences.create(testPreference);
  
  if (result && result.body && result.body.id) {
    console.log('✅ Configuração do Mercado Pago validada com sucesso');
    console.log(`📝 ID da preferência de teste: ${result.body.id}`);
    
    // Limpar preferência de teste
    try {
      await mercadopago.preferences.update(result.body.id, {
        status: 'cancelled'
      });
    } catch (error) {
      console.warn('⚠️ Não foi possível cancelar preferência de teste:', error.message);
    }
  } else {
    throw new Error('Resposta inválida da API');
  }
  
} catch (error) {
  console.error('❌ Erro ao validar configuração do Mercado Pago:', error.message);
  
  if (error.response && error.response.status === 401) {
    console.error('❌ Token de acesso inválido ou expirado');
  }
  
  process.exit(1);
}

console.log('🎉 Mercado Pago está pronto para uso!');
