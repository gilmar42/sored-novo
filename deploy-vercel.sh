#!/bin/bash

# Script de Deploy para Vercel - SORED Frontend
# Uso: ./deploy-vercel.sh [production|preview]

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

# Tipo de deploy
DEPLOY_TYPE=${1:-preview}

log "🚀 Iniciando deploy para Vercel ($DEPLOY_TYPE)"

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    log "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar se está logado
if ! vercel whoami &> /dev/null; then
    log "🔐 Faça login no Vercel:"
    vercel login
fi

# Build do frontend
log "📦 Build do frontend..."
npm ci
npm run build

# Verificar build
if [ ! -d ".next" ]; then
    error "Build falhou. Diretório .next não encontrado."
fi

# Configurar variáveis de ambiente
log "🔧 Configurando variáveis de ambiente..."

# Variáveis obrigatórias
vercel env add NEXT_PUBLIC_API_URL https://api.sored-industrial.com/api
vercel env add NEXT_PUBLIC_APP_URL https://sored-industrial.vercel.app
vercel env add NEXT_PUBLIC_APP_NAME "SORED - Sistema de Orçamento Industrial"
vercel env add NEXT_PUBLIC_SUPPORT_EMAIL contato@sored-industrial.com
vercel env add NEXT_PUBLIC_COMPANY_NAME "SORED Industrial Solutions"

# Variáveis específicas do ambiente
if [ "$DEPLOY_TYPE" = "production" ]; then
    log "🌐 Configurando ambiente de produção..."
    
    # Configurar domínio personalizado
    vercel domains add sored-industrial.com
    vercel domains add www.sored-industrial.com
    
    # Configurar Mercado Pago produção
    read -p "Digite sua chave pública do Mercado Pago (produção): " mercadopago_key
    if [ -n "$mercadopago_key" ]; then
        vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY "$mercadopago_key" --environment=production
    fi
    
    # Deploy para produção
    log "🚀 Fazendo deploy para produção..."
    vercel --prod
    
else
    log "🔍 Fazendo deploy preview..."
    
    # Configurar Mercado Pago testes
    vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY "TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" --environment=preview
    
    # Deploy preview
    vercel
fi

# Verificar deploy
log "🔍 Verificando deploy..."
sleep 5

# Obter URL do deploy
DEPLOY_URL=$(vercel ls --scope=personal 2>/dev/null | head -2 | tail -1 | awk '{print $2}')

if [ "$DEPLOY_TYPE" = "production" ]; then
    FINAL_URL="https://sored-industrial.com"
else
    FINAL_URL="$DEPLOY_URL"
fi

# Testar deploy
if curl -f "$FINAL_URL" > /dev/null 2>&1; then
    success "Frontend está online e acessível!"
else
    error "Frontend não está respondendo. Verifique os logs."
fi

# Limpar
log "🧹 Limpando arquivos temporários..."
rm -rf .next

# Configurar analytics (opcional)
read -p "Deseja configurar Vercel Analytics? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "📊 Configurando Vercel Analytics..."
    vercel analytics enable
fi

success "Deploy para Vercel concluído! 🎉"
echo
echo "🌐 Frontend: $FINAL_URL"
echo "📊 Analytics: https://vercel.com/analytics"
echo "🔧 Logs: vercel logs"

if [ "$DEPLOY_TYPE" = "production" ]; then
    echo
    echo "📋 Próximos passos:"
    echo "1. Configure DNS para apontar para Vercel"
    echo "2. Verifique certificado SSL"
    echo "3. Teste integração com backend"
    echo "4. Monitore performance"
fi
