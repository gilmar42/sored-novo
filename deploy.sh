#!/bin/bash

# Script de Deploy Produção - SORED
# Uso: ./deploy.sh [staging|production]

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

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar ambiente
ENVIRONMENT=${1:-staging}
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Ambiente inválido. Use: staging ou production"
fi

log "Iniciando deploy para ambiente: $ENVIRONMENT"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado"
fi

# Verificar variáveis de ambiente
if [[ "$ENVIRONMENT" == "production" ]]; then
    if [[ ! -f ".env.production" ]]; then
        error "Arquivo .env.production não encontrado"
    fi
    
    # Verificar variáveis obrigatórias
    source .env.production
    
    required_vars=("MERCADO_PAGO_ACCESS_TOKEN" "MERCADO_PAGO_PUBLIC_KEY" "JWT_SECRET" "MONGO_ROOT_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Variável $var não está definida em .env.production"
        fi
    done
    
    warning "Você está fazendo deploy para PRODUÇÃO"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy cancelado"
        exit 0
    fi
fi

# Backup do banco de dados (se em produção)
if [[ "$ENVIRONMENT" == "production" ]]; then
    log "Fazendo backup do banco de dados..."
    docker exec sored-mongodb-prod mongodump --out /backup/$(date +%Y%m%d_%H%M%S) || warning "Backup não foi concluído"
fi

# Build das imagens
log "Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Parar serviços antigos
log "Parando serviços antigos..."
docker-compose -f docker-compose.prod.yml down

# Limpar imagens antigas (opcional)
read -p "Deseja limpar imagens Docker antigas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Limpando imagens antigas..."
    docker system prune -f
fi

# Iniciar serviços
log "Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar serviços iniciarem
log "Aguardando serviços iniciarem..."
sleep 30

# Verificar saúde dos serviços
log "Verificando saúde dos serviços..."

# Verificar MongoDB
if docker exec sored-mongodb-prod mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    success "MongoDB está saudável"
else
    error "MongoDB não está respondendo"
fi

# Verificar Backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    success "Backend está saudável"
else
    error "Backend não está respondendo"
fi

# Verificar Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    success "Frontend está saudável"
else
    error "Frontend não está respondendo"
fi

# Verificar Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    success "Nginx está saudável"
else
    warning "Nginx pode não estar configurado corretamente"
fi

# Limpeza
log "Limpando imagens não utilizadas..."
docker image prune -f

# Log final
success "Deploy concluído com sucesso!"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo
    echo "🚀 SORED está em produção!"
    echo "📊 Dashboard: https://sored-industrial.com"
    echo "🔧 API: https://sored-industrial.com/api"
    echo "📧 Suporte: contato@sored-industrial.com"
else
    echo
    echo "🚀 SORED está em staging!"
    echo "📊 Dashboard: http://localhost"
    echo "🔧 API: http://localhost/api"
fi

echo
echo "📋 Próximos passos:"
echo "1. Configure suas credenciais do Mercado Pago"
echo "2. Configure o email SMTP"
echo "3. Verifique os certificados SSL"
echo "4. Monitore os logs: docker-compose logs -f"

echo
success "Deploy concluído! 🎉"
