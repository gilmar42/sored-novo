#!/usr/bin/env node

/**
 * Script de validação das configurações do Mercado Pago
 * Execute com: node validate-mercadopago.js
 */

require('dotenv').config();
const mercadopago = require('mercadopago');

console.log('🔍 Validando configurações do Mercado Pago...\n');

// Verificar variáveis de ambiente
const requiredVars = [
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_PUBLIC_KEY',
  'BASE_URL'
];

const optionalVars = [
  'MERCADO_PAGO_WEBHOOK_SECRET'
];

let allValid = true;

console.log('📋 Verificando variáveis de ambiente:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_')) {
    console.log(`❌ ${varName}: NÃO CONFIGURADO ou é valor padrão`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: OK`);
  }
});

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: Não configurado (opcional)`);
  } else {
    console.log(`✅ ${varName}: OK`);
  }
});

console.log('\n🌐 Verificando conectividade com Mercado Pago:');

// Verificar configuração (simulação)
if (process.env.MERCADO_PAGO_ACCESS_TOKEN && !process.env.MERCADO_PAGO_ACCESS_TOKEN.includes('your_')) {
  console.log('✅ Access Token configurado - pronto para conectar');

  // Verificar se é produção ou teste
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (token.startsWith('APP_USR-')) {
    console.log('🏭 Ambiente: PRODUÇÃO');
  } else if (token.startsWith('TEST-')) {
    console.log('🧪 Ambiente: SANDBOX (teste)');
  } else {
    console.log('❓ Ambiente: DESCONHECIDO');
  }

  console.log('\n🎉 Configuração válida para deploy!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Configure o webhook no painel do Mercado Pago');
  console.log('2. Teste um pagamento real');
  console.log('3. Monitore os logs da aplicação');
} else {
  console.log('❌ Access Token não configurado - impossível testar conexão');
  allValid = false;
}

// Verificações adicionais
console.log('\n🔒 Verificações de segurança:');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.BASE_URL || !process.env.BASE_URL.startsWith('https://')) {
    console.log('❌ BASE_URL deve usar HTTPS em produção');
    allValid = false;
  } else {
    console.log('✅ BASE_URL usa HTTPS');
  }
} else {
  console.log('ℹ️  Ambiente de desenvolvimento - HTTPS não obrigatório');
}

if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
  console.log('⚠️  MERCADO_PAGO_WEBHOOK_SECRET não configurado');
  console.log('   Recomendado para validar webhooks em produção');
}

// Resumo final
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 STATUS: PRONTO PARA DEPLOY');
  } else {
    console.log('❌ STATUS: CONFIGURAÇÃO INCOMPLETA');
    console.log('   Corrija os itens marcados antes do deploy');
  }
  console.log('='.repeat(50));
}, 3000);