# 🚀 Deploy em Produção - SORED Industrial

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para build local)
- MongoDB (se não usar Docker)
- Nginx (se não usar Docker)
- Certificados SSL (para HTTPS)

## 🔧 Configuração do Ambiente

### 1. Variáveis de Ambiente

Copie os arquivos de exemplo:

```bash
# Backend
cp production.env.example backend/.env.production

# Frontend  
cp frontend.production.env.example .env.local.production
```

### 2. Configure as variáveis obrigatórias:

**Backend (.env.production):**
```env
# Mercado Pago (OBRIGATÓRIO)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADO_PAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Segurança (OBRIGATÓRIO)
JWT_SECRET=super_secure_jwt_secret_for_production_change_this
MONGO_ROOT_PASSWORD=secure_password_2024

# Outras configurações
NODE_ENV=production
BASE_URL=https://api.sored-industrial.com
ALLOWED_ORIGINS=https://sored-industrial.com,https://www.sored-industrial.com
```

**Frontend (.env.local.production):**
```env
NEXT_PUBLIC_API_URL=https://api.sored-industrial.com/api
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🐳 Deploy com Docker

### 1. Build e Deploy

```bash
# Para staging
./deploy.sh staging

# Para produção
./deploy.sh production
```

### 2. Manualmente com Docker Compose

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Subir os serviços
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📁 Estrutura de Arquivos de Produção

```
sored-novo-main/
├── docker-compose.prod.yml          # Docker Compose produção
├── Dockerfile.prod                   # Frontend Dockerfile
├── backend/
│   ├── Dockerfile.prod              # Backend Dockerfile
│   ├── healthcheck.js               # Health check script
│   └── .env.production              # Variáveis ambiente backend
├── nginx/
│   └── nginx.conf                   # Configuração Nginx
├── next.config.prod.js              # Config Next.js produção
├── deploy.sh                        # Script de deploy
└── README.PROD.md                   # Este arquivo
```

## 🔒 Configurações de Segurança

### 1. SSL/TLS

- Coloque os certificados em `nginx/ssl/`
- `cert.pem` - Certificado SSL
- `key.pem` - Chave privada

### 2. Firewall

Configure o firewall para permitir apenas:
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 22 (SSH - apenas para admin)

### 3. Rate Limiting

O Nginx já está configurado com rate limiting:
- API: 10 requisições/segundo
- Login: 5 requisições/minuto

## 📊 Monitoramento

### 1. Health Checks

```bash
# Verificar saúde dos serviços
curl https://sored-industrial.com/health
curl https://api.sored-industrial.com/api/health
```

### 2. Logs

```bash
# Logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 3. Métricas

- MongoDB: Conecte via MongoDB Compass
- Nginx: Logs de acesso em `/var/log/nginx/`
- Docker: `docker stats` para uso de recursos

## 🔄 Atualizações

### 1. Para atualizar o sistema:

```bash
# Fazer backup
./deploy.sh production

# Atualizar código
git pull origin main

# Fazer deploy novamente
./deploy.sh production
```

### 2. Rollback

```bash
# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Voltar para versão anterior
git checkout <commit-anterior>

# Fazer deploy
./deploy.sh production
```

## 🏗️ Build Local para Produção

### 1. Build do Frontend

```bash
# Usar configuração de produção
cp next.config.prod.js next.config.js

# Instalar dependências
npm ci --only=production

# Build
npm run build

# Testar build
npm start
```

### 2. Build do Backend

```bash
cd backend

# Instalar dependências
npm ci --only=production

# Build TypeScript
npm run build

# Iniciar produção
NODE_ENV=production npm start
```

## 📧 Configuração de Email

Configure em `.env.production`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contato@sored-industrial.com
EMAIL_PASS=sua_app_password
```

## 💾 Backup

### 1. Backup Automático

Adicione ao crontab:

```bash
# Backup diário às 2h
0 2 * * * /caminho/do/sored/backup.sh
```

### 2. Backup Manual

```bash
# Backup MongoDB
docker exec sored-mongodb-prod mongodump --out /backup/$(date +%Y%m%d_%H%M%S)

# Backup arquivos
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/
```

## 🚨 Troubleshooting

### 1. Serviços não iniciam

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar portas
netstat -tulpn | grep -E ':(80|443|3000|3001|27017)'
```

### 2. Erro de conexão MongoDB

```bash
# Verificar container MongoDB
docker exec -it sored-mongodb-prod mongosh

# Verificar rede
docker network ls
docker network inspect sored-network
```

### 3. Erro de CORS

Verifique as configurações em `nginx/nginx.conf` e nas variáveis `ALLOWED_ORIGINS`.

## 📞 Suporte

- **Email:** contato@sored-industrial.com
- **Documentação:** https://docs.sored-industrial.com
- **Status:** https://status.sored-industrial.com

---

## ⚠️ Importante

1. **Nunca** envie `.env.production` para o repositório
2. **Sempre** faça backup antes de atualizações
3. **Monitore** os logs regularmente
4. **Mantenha** o sistema atualizado
5. **Use** senhas fortes e únicas

## 🎉 Deploy Concluído!

Após seguir estes passos, o SORED estará em produção com:
- ✅ HTTPS com SSL
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ Health checks
- ✅ Logs centralizados
- ✅ Backup automático
- ✅ Monitoramento

**Sistema pronto para produção!** 🚀
