#!/bin/bash

# Script de Deploy para Hostinger - SORED Backend
# Uso: ./deploy-hostinger.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configurações do Hostinger
HOSTINGER_USER="u123456789"  # Substitua com seu usuário Hostinger
HOSTINGER_HOST="123.456.789.10"  # Substitua com seu IP Hostinger
HOSTINGER_PATH="/home/u123456789/domains/api.sored-industrial.com/public_html"
APP_NAME="sored-backend"
NODE_VERSION="18"

log "🚀 Iniciando deploy para Hostinger"

# Verificar se SSH está configurado
if ! ssh -o ConnectTimeout=5 $HOSTINGER_USER@$HOSTINGER_HOST "echo 'SSH OK'" 2>/dev/null; then
    error "SSH não está configurado ou servidor não está acessível"
fi

# Build do backend
log "📦 Build do backend..."
cd backend
npm ci --only=production
npm run build

# Criar arquivo de ambiente para produção
cat > .env.hostinger << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/sored_prod
JWT_SECRET=super_secure_jwt_secret_for_hostinger
JWT_EXPIRES_IN=7d
BASE_URL=https://api.sored-industrial.com
ALLOWED_ORIGINS=https://sored-industrial.vercel.app,https://sored-industrial.com,https://www.sored-industrial.com
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADO_PAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADO_PAGO_WEBHOOK_SECRET=webhook_secret_hostinger
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contato@sored-industrial.com
EMAIL_PASS=app_password_here
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
SESSION_SECRET=session_secret_hostinger
DB_NAME=sored_prod
DB_MAX_POOL_SIZE=10
EOF

# Compactar arquivos
log "📁 Compactando arquivos..."
tar -czf ../deploy.tar.gz \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=.git \
    --exclude=uploads \
    --exclude=test \
    .

# Enviar arquivos para Hostinger
log "📤 Enviando arquivos para Hostinger..."
scp ../deploy.tar.gz $HOSTINGER_USER@$HOSTINGER_HOST:/tmp/

# Extrair e instalar no Hostinger
log "🔧 Instalando no servidor..."
ssh $HOSTINGER_USER@$HOSTINGER_HOST << 'EOF'
    cd $HOSTINGER_PATH
    
    # Backup da versão anterior
    if [ -d "backup" ]; then
        rm -rf backup
    fi
    mkdir -p backup
    
    if [ -d "current" ]; then
        mv current backup/previous_$(date +%Y%m%d_%H%M%S)
    fi
    
    # Extrair nova versão
    mkdir -p current
    cd current
    tar -xzf /tmp/deploy.tar.gz
    
    # Instalar dependências
    nvm use $NODE_VERSION
    npm ci --only=production
    
    # Configurar PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Configurar variáveis de ambiente
    cp .env.hostinger .env.production
    
    # Iniciar com PM2
    pm2 delete $APP_NAME 2>/dev/null || true
    pm2 start dist/index.js --name $APP_NAME --env production
    pm2 save
    pm2 startup
    
    # Limpar
    rm /tmp/deploy.tar.gz
    
    echo "Deploy concluído com sucesso!"
EOF

# Limpar arquivos locais
log "🧹 Limpando arquivos temporários..."
cd ..
rm deploy.tar.gz

# Verificar deploy
log "🔍 Verificando deploy..."
sleep 10

if curl -f https://api.sored-industrial.com/api/health > /dev/null 2>&1; then
    success "Backend está online e saudável!"
else
    error "Backend não está respondendo. Verifique os logs."
fi

success "Deploy para Hostinger concluído! 🎉"
echo
echo "🌐 Backend: https://api.sored-industrial.com"
echo "📊 Health: https://api.sored-industrial.com/api/health"
echo "📋 Logs: pm2 logs $APP_NAME"
