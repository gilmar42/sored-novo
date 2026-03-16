# 🚀 Deploy Vercel + Hostinger - SORED Industrial

## 📋 Arquitetura

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel       │    │   Hostinger     │
│  (Frontend)    │◄──►│   (Backend)    │
│                │    │                │
│ Next.js 14     │    │ Node.js +      │
│ React 18        │    │ Express        │
│                │    │ MongoDB        │
└─────────────────┘    └─────────────────┘
```

## 🔧 Configuração Rápida

### 1. Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy preview
./deploy-vercel.sh preview

# Deploy produção
./deploy-vercel.sh production
```

### 2. Backend (Hostinger)

```bash
# Configurar SSH
ssh-keygen -t rsa -b 4096 -C "deploy@sored"

# Deploy para Hostinger
./deploy-hostinger.sh
```

## 📁 Arquivos Criados

### Frontend (Vercel)
- `vercel.json` - Configuração Vercel
- `package.vercel.json` - Dependências otimizadas
- `.env.vercel.example` - Variáveis de ambiente
- `deploy-vercel.sh` - Script de deploy

### Backend (Hostinger)
- `deploy-hostinger.sh` - Script de deploy
- `ecosystem.config.js` - Configuração PM2
- `nginx-hostinger.conf` - Configuração Nginx
- `backend/src/config/cors.js` - CORS configurado

## 🌐 URLs Finais

- **Frontend:** https://sored-industrial.vercel.app
- **Frontend (domínio):** https://sored-industrial.com
- **Backend:** https://api.sored-industrial.com
- **API:** https://api.sored-industrial.com/api

## 🔧 Configurações Necessárias

### Vercel
1. **Conectar repositório:**
   ```bash
   vercel link
   ```

2. **Configurar domínio:**
   ```bash
   vercel domains add sored-industrial.com
   ```

3. **Variáveis de ambiente:**
   - `NEXT_PUBLIC_API_URL=https://api.sored-industrial.com/api`
   - `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`

### Hostinger
1. **Configurar servidor:**
   - Node.js 18+
   - PM2 instalado
   - Nginx configurado

2. **Configurar PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

3. **Configurar Nginx:**
   ```bash
   sudo cp nginx-hostinger.conf /etc/nginx/sites-available/api.sored-industrial.com
   sudo ln -s /etc/nginx/sites-available/api.sored-industrial.com /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

## 🔒 Segurança

### SSL/TLS
- **Vercel:** Automático
- **Hostinger:** Let's Encrypt ou certificado pago

### CORS Configurado
- Origens permitidas específicas
- Métodos e headers configurados
- Credentials habilitado

### Rate Limiting
- API: 10 requisições/segundo
- Login: 5 requisições/minuto

## 📊 Monitoramento

### Vercel
- Dashboard: https://vercel.com/dashboard
- Analytics: https://vercel.com/analytics
- Logs: `vercel logs`

### Hostinger
- PM2: `pm2 monit`
- Logs: `/home/user/logs/`
- Health: `curl https://api.sored-industrial.com/api/health`

## 🚀 Deploy Automatizado

### GitHub Actions (Opcional)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Erros Comuns

1. **CORS Error:**
   - Verifique `ALLOWED_ORIGINS` no backend
   - Configure domínio no Vercel

2. **Build Error:**
   - Verifique `next.config.js`
   - Limpe cache: `rm -rf .next`

3. **Deploy Error:**
   - Verifique SSH keys
   - Confirme permissões no Hostinger

4. **API Error:**
   - Verifique se backend está rodando
   - Teste health check

### Comandos Úteis

```bash
# Verificar status Vercel
vercel ls

# Verificar logs Vercel
vercel logs

# Verificar status PM2
pm2 status

# Verificar logs PM2
pm2 logs sored-backend

# Reiniciar backend
pm2 restart sored-backend

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 📋 Checklist Antes do Deploy

### Frontend (Vercel)
- [ ] Variáveis de ambiente configuradas
- [ ] Build funciona localmente
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Analytics habilitado

### Backend (Hostinger)
- [ ] SSH configurado
- [ ] Node.js 18+ instalado
- [ ] PM2 configurado
- [ ] Nginx configurado
- [ ] SSL instalado
- [ ] MongoDB conectado
- [ ] Health check funcionando

## 🎉 Deploy Completo!

Após seguir estes passos:
1. **Frontend** rodando no Vercel
2. **Backend** rodando no Hostinger
3. **APIs** se comunicando via CORS
4. **SSL** configurado em ambos
5. **Monitoramento** ativo

**Sistema SORED 100% em produção!** 🚀
