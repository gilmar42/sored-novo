# Configurações para Deploy Vercel + Hostinger

## 🚀 Arquitetura de Deploy

### Frontend (Vercel)
- **Plataforma:** Vercel
- **URL:** https://sored-industrial.vercel.app
- **Framework:** Next.js 13+ com App Router
- **Build:** `npm run build`
- **Output:** Standalone

### Backend (Hostinger)
- **Plataforma:** Hostinger VPS
- **URL:** https://api.sored-industrial.com
- **Framework:** Node.js + Express
- **Runtime:** Node.js 18+
- **Port:** 3001

## 📋 Configurações Necessárias

### 1. Vercel (Frontend)
- Variáveis de ambiente
- Build command
- Deploy settings

### 2. Hostinger (Backend)
- Node.js setup
- PM2 process manager
- Nginx reverse proxy
- SSL certificates

### 3. Integração
- CORS configuration
- API endpoints
- Environment variables
- Security headers
