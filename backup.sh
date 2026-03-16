#!/bin/bash

# Script de Backup - SORED Industrial
# Uso: ./backup.sh [full|database|uploads]

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

# Tipo de backup
BACKUP_TYPE=${1:-full}
BACKUP_DIR="/backup/sored"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

log "Iniciando backup do tipo: $BACKUP_TYPE"

# Verificar se Docker está rodando
if ! docker ps | grep -q "sored-mongodb-prod"; then
    error "MongoDB não está rodando"
fi

case $BACKUP_TYPE in
    "database")
        log "Fazendo backup do banco de dados..."
        
        # Backup MongoDB
        docker exec sored-mongodb-prod mongodump \
            --out /backup/mongodb_$DATE \
            --gzip \
            --quiet
        
        # Mover para diretório de backup
        docker cp sored-mongodb-prod:/backup/mongodb_$DATE $BACKUP_DIR/
        
        # Limpar backup temporário
        docker exec sored-mongodb-prod rm -rf /backup/mongodb_$DATE
        
        success "Backup do banco de dados concluído"
        ;;
        
    "uploads")
        log "Fazendo backup dos arquivos de upload..."
        
        # Backup dos uploads
        tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/
        
        success "Backup dos uploads concluído"
        ;;
        
    "full"|"")
        log "Fazendo backup completo..."
        
        # Backup MongoDB
        docker exec sored-mongodb-prod mongodump \
            --out /backup/mongodb_$DATE \
            --gzip \
            --quiet
        
        # Mover para diretório de backup
        docker cp sored-mongodb-prod:/backup/mongodb_$DATE $BACKUP_DIR/
        
        # Limpar backup temporário
        docker exec sored-mongodb-prod rm -rf /backup/mongodb_$DATE
        
        # Backup dos uploads
        tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/
        
        # Backup das configurações
        tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
            docker-compose.prod.yml \
            nginx/ \
            *.env* \
            deploy.sh
        
        success "Backup completo concluído"
        ;;
        
    *)
        error "Tipo de backup inválido. Use: database, uploads ou full"
        ;;
esac

# Limpeza de backups antigos (manter últimos 7 dias)
log "Limpando backups antigos..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} 2>/dev/null || true

# Informações do backup
BACKUP_SIZE=$(du -sh $BACKUP_DIR/*_$DATE* 2>/dev/null | awk '{sum+=$1} END {print sum}')
log "Tamanho do backup: $BACKUP_SIZE"

# Lista de backups
log "Backups disponíveis:"
ls -lah $BACKUP_DIR/ | tail -5

success "Backup concluído com sucesso!"
echo
echo "📁 Localização: $BACKUP_DIR"
echo "📅 Data/Hora: $DATE"
echo "💾 Tipo: $BACKUP_TYPE"
echo "📊 Tamanho: $BACKUP_SIZE"
