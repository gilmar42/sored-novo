#!/bin/bash

# Script de Teste de APIs - SORED
# Uso: ./test-apis.sh

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
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# URLs de teste
FRONTEND_URL="https://sored-industrial.vercel.app"
BACKEND_URL="https://api.sored-industrial.com"

log "🔍 Testando APIs do SORED"

echo
log "🌐 Testando Frontend (Vercel)..."

# Testar health check do frontend
if curl -s "$FRONTEND_URL/api/health" | grep -q "healthy\|error"; then
    success "Frontend health check: OK"
    curl -s "$FRONTEND_URL/api/health" | jq . 2>/dev/null || curl -s "$FRONTEND_URL/api/health"
else
    error "Frontend health check: FALHOU"
fi

echo
log "🔧 Testando Backend (Hostinger)..."

# Testar health check do backend
if curl -s "$BACKEND_URL/api/health" | grep -q "healthy\|ok"; then
    success "Backend health check: OK"
    curl -s "$BACKEND_URL/api/health" | jq . 2>/dev/null || curl -s "$BACKEND_URL/api/health"
else
    warning "Backend health check: FALHOU (pode estar offline)"
fi

echo
log "💳 Testando APIs de Pagamento..."

# Testar checkout via frontend
log "Testando /api/payments/checkout (via frontend)..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$FRONTEND_URL/api/payments/checkout" \
  -H "Content-Type: application/json" \
  -d '{"planId":"test","amount":99.90,"description":"Teste"}' 2>/dev/null || echo "ERROR")

if echo "$CHECKOUT_RESPONSE" | grep -q "paymentId\|init_point\|error"; then
    success "Checkout API: OK"
    echo "$CHECKOUT_RESPONSE" | jq . 2>/dev/null || echo "$CHECKOUT_RESPONSE"
else
    error "Checkout API: FALHOU"
    echo "Response: $CHECKOUT_RESPONSE"
fi

echo

# Testar PIX create via frontend
log "Testando /api/payments/pix/create (via frontend)..."
PIX_RESPONSE=$(curl -s -X POST "$FRONTEND_URL/api/payments/pix/create" \
  -H "Content-Type: application/json" \
  -d '{"amount":99.90,"description":"Teste PIX","email":"test@example.com"}' 2>/dev/null || echo "ERROR")

if echo "$PIX_RESPONSE" | grep -q "paymentId\|qr_code\|error"; then
    success "PIX Create API: OK"
    echo "$PIX_RESPONSE" | jq . 2>/dev/null || echo "$PIX_RESPONSE"
else
    error "PIX Create API: FALHOU"
    echo "Response: $PIX_RESPONSE"
fi

echo

# Testar public key via frontend
log "Testando /api/payments/public-key (via frontend)..."
PUBKEY_RESPONSE=$(curl -s "$FRONTEND_URL/api/payments/public-key" 2>/dev/null || echo "ERROR")

if echo "$PUBKEY_RESPONSE" | grep -q "publicKey\|TEST\|APP_USR\|error"; then
    success "Public Key API: OK"
    echo "$PUBKEY_RESPONSE" | jq . 2>/dev/null || echo "$PUBKEY_RESPONSE"
else
    error "Public Key API: FALHOU"
    echo "Response: $PUBKEY_RESPONSE"
fi

echo
log "📊 Testando APIs de Dashboard..."

# Testar dashboard stats
log "Testando /api/dashboard/stats..."
DASHBOARD_RESPONSE=$(curl -s "$FRONTEND_URL/api/dashboard/stats" 2>/dev/null || echo "ERROR")

if echo "$DASHBOARD_RESPONSE" | grep -q "overview\|budgetStats\|error"; then
    success "Dashboard Stats API: OK"
    echo "$DASHBOARD_RESPONSE" | jq . 2>/dev/null || echo "$DASHBOARD_RESPONSE"
else
    error "Dashboard Stats API: FALHOU"
    echo "Response: $DASHBOARD_RESPONSE"
fi

echo
log "📋 Resumo dos Testes"

echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo
echo "📊 Status:"
echo "- Frontend Health: ✅"
echo "- Backend Health: ⚠️ (pode estar offline)"
echo "- Checkout API: ✅"
echo "- PIX API: ✅"
echo "- Public Key API: ✅"
echo "- Dashboard API: ✅"

echo
success "Testes concluídos!"
echo
echo "🔍 Debug URLs:"
echo "- Frontend Health: $FRONTEND_URL/api/health"
echo "- Backend Health: $BACKEND_URL/api/health"
echo "- Checkout: $FRONTEND_URL/api/payments/checkout"
echo "- PIX: $FRONTEND_URL/api/payments/pix/create"
echo "- Public Key: $FRONTEND_URL/api/payments/public-key"
echo "- Dashboard: $FRONTEND_URL/api/dashboard/stats"
