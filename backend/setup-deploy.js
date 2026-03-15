#!/usr/bin/env node

/**
 * Script auxiliar para configurar variáveis de ambiente
 * para diferentes plataformas de deploy
 */

const fs = require('fs');
const path = require('path');

const platforms = {
  heroku: {
    name: 'Heroku',
    commands: (vars) => vars.map(v => `heroku config:set ${v.name}="${v.value}" --app your-app-name`).join('\n')
  },
  vercel: {
    name: 'Vercel',
    commands: (vars) => {
      const envContent = vars.map(v => `${v.name}="${v.value}"`).join('\n');
      return `# Criar arquivo .env.local com:\n${envContent}\n\n# Ou usar Vercel CLI:\n${vars.map(v => `vercel env add ${v.name}`).join('\n')}`;
    }
  },
  railway: {
    name: 'Railway',
    commands: (vars) => `No dashboard do Railway, adicione estas variáveis:\n${vars.map(v => `${v.name}=${v.value}`).join('\n')}`
  },
  render: {
    name: 'Render',
    commands: (vars) => `No dashboard do Render > Service > Environment:\n${vars.map(v => `${v.name}=${v.value}`).join('\n')}`
  },
  'digital-ocean': {
    name: 'DigitalOcean App Platform',
    commands: (vars) => `No dashboard > Apps > your-app > Settings > Environment variables:\n${vars.map(v => `${v.name}=${v.value}`).join('\n')}`
  },
  aws: {
    name: 'AWS Elastic Beanstalk',
    commands: (vars) => {
      const optionSettings = vars.map(v =>
        `    {\n      "Namespace": "aws:elasticbeanstalk:application:environment",\n      "OptionName": "${v.name}",\n      "Value": "${v.value}"\n    }`
      ).join(',\n');

      return `aws elasticbeanstalk update-environment \\\n  --environment-name your-env \\\n  --option-settings '[${optionSettings}\n  ]'`;
    }
  }
};

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const vars = [];

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        vars.push({ name: key, value });
      }
    }
  });

  return vars;
}

function generateConfig(platform, vars) {
  const platformConfig = platforms[platform];
  if (!platformConfig) {
    console.log(`❌ Plataforma "${platform}" não suportada`);
    return;
  }

  console.log(`\n🚀 Configuração para ${platformConfig.name}:`);
  console.log('='.repeat(50));
  console.log(platformConfig.commands(vars));
  console.log('='.repeat(50));
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 Uso: node setup-deploy.js <plataforma>');
    console.log('\nPlataformas suportadas:');
    Object.keys(platforms).forEach(platform => {
      console.log(`  - ${platform} (${platforms[platform].name})`);
    });
    console.log('\nExemplo: node setup-deploy.js heroku');
    return;
  }

  const platform = args[0].toLowerCase();
  const vars = loadEnvFile();

  if (!vars) return;

  // Filtrar apenas variáveis relacionadas ao Mercado Pago e essenciais
  const mercadoPagoVars = vars.filter(v =>
    v.name.includes('MERCADO_PAGO') ||
    ['NODE_ENV', 'BASE_URL', 'MONGODB_URI', 'JWT_SECRET'].includes(v.name)
  );

  console.log(`📊 Variáveis encontradas: ${mercadoPagoVars.length}`);
  mercadoPagoVars.forEach(v => {
    console.log(`  - ${v.name}`);
  });

  generateConfig(platform, mercadoPagoVars);
}

if (require.main === module) {
  main();
}