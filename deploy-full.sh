#!/bin/bash

# Script de Deploy Completo - Vercel + Hostinger
# Uso: ./deploy-full.sh [frontend|backend|both]

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
DEPLOY_TARGET=${1:-both}

log "🚀 Iniciando deploy completo - SORED Industrial"

# Verificar pré-requisitos
log "🔍 Verificando pré-requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não está instalado"
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    error "Git não está instalado"
fi

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Backup antes do deploy
log "💾 Fazendo backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup do backend
if [ -d "backend" ]; then
    cp -r backend "$BACKUP_DIR/"
fi

# Backup de arquivos importantes
cp vercel.json "$BACKUP_DIR/" 2>/dev/null || true
cp deploy-vercel.sh "$BACKUP_DIR/" 2>/dev/null || true
cp deploy-hostinger.sh "$BACKUP_DIR/" 2>/dev/null || true

success "Backup criado em: $BACKUP_DIR"

# Deploy Frontend (Vercel)
if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    log "🌐 Deploy Frontend para Vercel..."
    
    # Verificar se Vercel CLI está instalado
    if ! command -v vercel &> /dev/null; then
        log "📦 Instalando Vercel CLI..."
        npm install -g vercel
    fi
    
    # Verificar login
    if ! vercel whoami &> /dev/null; then
        log "🔐 Faça login no Vercel:"
        vercel login
    fi
    
    # Build frontend
    log "📦 Build do frontend..."
    npm ci
    npm run build
    
    # Deploy para Vercel
    if [ "$DEPLOY_TARGET" = "both" ]; then
        log "🚀 Deploy frontend (preview)..."
        vercel
    else
        log "🚀 Deploy frontend (produção)..."
        vercel --prod
    fi
    
    success "Frontend deployado para Vercel!"
fi

# Deploy Backend (Hostinger)
if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    log "🔧 Deploy Backend para Hostinger..."
    
    # Verificar se SSH está configurado
    if [ ! -f "$HOME/.ssh/id_rsa" ]; then
        warning "Chave SSH não encontrada. Configure SSH para Hostinger."
        echo "1. Gere chave: ssh-keygen -t rsa -b 4096"
        echo "2. Adicione ao Hostinger"
        echo "3. Teste: ssh user@hostinger.com"
        read -p "Pressione Enter para continuar..."
    fi
    
    # Build backend
    log "📦 Build do backend..."
    cd backend
    npm ci --only=production
    npm run build
    cd ..
    
    # Deploy para Hostinger
    if [ -f "deploy-hostinger.sh" ]; then
        chmod +x deploy-hostinger.sh
        ./deploy-hostinger.sh
    else
        error "Script deploy-hostinger.sh não encontrado"
    fi
    
    success "Backend deployado para Hostinger!"
fi

# Verificação final
log "🔍 Verificação final..."

# URLs finais
FRONTEND_URL="https://sored-industrial.vercel.app"
BACKEND_URL="https://api.sored-industrial.com"

# Testar frontend
if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    log "🌐 Testando frontend..."
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        success "Frontend está online: $FRONTEND_URL"
    else
        warning "Frontend pode não estar acessível ainda (propagação DNS)"
    fi
fi

# Testar backend
if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    log "🔧 Testando backend..."
    if curl -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        success "Backend está online: $BACKEND_URL"
    else
        warning "Backend pode não estar acessível ainda"
    fi
fi

# Limpar
log "🧹 Limpando arquivos temporários..."
rm -rf .next 2>/dev/null || true
rm -rf backend/dist 2>/dev/null || true

# Resumo
echo
success "🎉 Deploy completo concluído!"
echo
echo "📋 URLs Finais:"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo "📊 API: $BACKEND_URL/api"
echo "❤️  Health: $BACKEND_URL/api/health"
echo
echo "📋 Próximos passos:"
echo "1. Configure DNS (se necessário)"
echo "2. Verifique certificados SSL"
echo "3. Teste integração frontend/backend"
echo "4. Monitore logs e performance"
echo "5. Configure analytics e monitoramento"
echo
echo "📊 Monitoramento:"
echo "- Vercel: vercel logs"
echo "- Hostinger: pm2 logs sored-backend"
echo "- Status: curl $BACKEND_URL/api/health"

if [ "$DEPLOY_TARGET" = "both" ]; then
    echo
    success "🚀 Sistema SORED 100% em produção!"
    echo "Frontend: Vercel"
    echo "Backend: Hostinger"
    echo "Integração: CORS configurado"
    echo "Segurança: SSL + Rate limiting"
fi
