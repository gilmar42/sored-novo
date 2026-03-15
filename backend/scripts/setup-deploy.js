#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Configurando ambiente para deploy...');

// Verificar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'BASE_URL',
  'ALLOWED_ORIGINS'
];

const mercadoPagoVars = [
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_PUBLIC_KEY'
];

const optionalEnvVars = [
  'MERCADO_PAGO_WEBHOOK_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'NODE_ENV'
];

// Validar variáveis obrigatórias
let hasErrors = false;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variável obrigatória não configurada: ${varName}`);
    hasErrors = true;
  }
});

// Validar variáveis do Mercado Pago (sempre obrigatórias em produção)
if (process.env.NODE_ENV === 'production') {
  mercadoPagoVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ Variável do Mercado Pago obrigatória em produção: ${varName}`);
      hasErrors = true;
    }
  });
} else {
  console.log('🧪 Ambiente de desenvolvimento - Mercado Pago opcional');
}

if (hasErrors) {
  console.error('❌ Configure as variáveis de ambiente antes de continuar');
  process.exit(1);
}

// Criar arquivo .env para produção se não existir
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Criando arquivo .env para produção...');
  
  let envContent = '';
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  
  // Adicionar informações de deploy
  envContent += envExample;
  envContent += '\n';
  envContent += '\n# Configurações de Deploy\n';
  envContent += `NODE_ENV=production\n`;
  envContent += `# Atualizado em: ${new Date().toISOString()}\n`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso');
}

// Verificar configuração de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS;
if (allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  console.log('🌐 Origens permitidas:', origins);
}

// Configurações específicas por plataforma
const platformConfigs = {
  heroku: {
    port: process.env.PORT || 3001,
    database: {
      url: process.env.MONGODB_URI,
      ssl: true
    },
    mercadopago: {
      webhook_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    }
  },
  vercel: {
    port: process.env.PORT || 3001,
    database: {
      url: process.env.MONGODB_URI,
      ssl: true
    },
    mercadopago: {
      webhook_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    }
  },
  aws: {
    port: process.env.PORT || 3001,
    database: {
      url: process.env.MONGODB_URI,
      ssl: process.env.MONGODB_URI.includes('mongodb+srv')
    },
    mercadopago: {
      webhook_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    }
  },
  digitalocean: {
    port: process.env.PORT || 3001,
    database: {
      url: process.env.MONGODB_URI,
      ssl: true
    },
    mercadopago: {
      webhook_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    }
  },
  render: {
    port: process.env.PORT || 3001,
    database: {
      url: process.env.MONGODB_URI,
      ssl: true
    },
    mercadopago: {
      webhook_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`
    }
  }
};

// Detectar plataforma automaticamente
const detectedPlatform = 
  (process.env.HEROKU && 'heroku') ||
  (process.env.VERCEL && 'vercel') ||
  (process.env.AWS_REGION && 'aws') ||
  (process.env.DIGITALOCEAN && 'digitalocean') ||
  (process.env.RENDER && 'render') ||
  'default';

const config = platformConfigs[detectedPlatform] || platformConfigs.default;

console.log(`🎯 Plataforma detectada: ${detectedPlatform}`);
console.log('📋 Configurações aplicadas:');

Object.entries(config).forEach(([key, value]) => {
  if (typeof value === 'object') {
    console.log(`  ${key}:`);
    Object.entries(value).forEach(([subKey, subValue]) => {
      console.log(`    ${subKey}: ${subValue}`);
    });
  } else {
    console.log(`  ${key}: ${value}`);
  }
});

// Criar arquivo de configuração de deploy
const deployConfig = {
  platform: detectedPlatform,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  mercadopago: {
    configured: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    sandbox: process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('TEST-') || false
  },
  webhook: {
    url: `${process.env.BASE_URL}/api/webhooks/mercadopago`,
    secret_configured: !!process.env.MERCADO_PAGO_WEBHOOK_SECRET
  }
};

const deployConfigPath = path.join(__dirname, '..', 'deploy-config.json');
fs.writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2));

console.log('✅ Configuração de deploy salva em deploy-config.json');
console.log('🎉 Ambiente configurado com sucesso!');

// Exibir próximos passos
console.log('\n📋 Próximos passos:');
console.log('1. Configure as variáveis de ambiente na sua plataforma de hospedagem');
console.log('2. Configure o webhook do Mercado Pago para:', `${process.env.BASE_URL}/api/webhooks/mercadopago`);
console.log('3. Execute: npm run build');
console.log('4. Execute: npm start');
