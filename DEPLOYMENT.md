# Deploy em Producao (Checklist)

Este repo tem 2 apps:
- Frontend: Next.js (porta 3000)
- Backend: Express/Node (porta 3001)

## 1) Variaveis de ambiente

Frontend (raiz) - baseie em `.env.example`:
- `DATABASE_URL` (PostgreSQL para Prisma)
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (URL publica do site)
- `BACKEND_URL` (URL interna para o backend; em VPS normalmente `http://localhost:3001`)

Backend (`backend/.env`) - baseie em `backend/.env.example`:
- `MONGODB_URI`
- `JWT_SECRET`
- `BASE_URL` (URL publica do backend, https://...)
- `FRONTEND_URL` (URL publica do frontend, https://...)
- `ALLOWED_ORIGINS` (lista separada por virgula; inclua o frontend)
- Mercado Pago:
  - `MERCADO_PAGO_ACCESS_TOKEN`
  - `MERCADO_PAGO_PUBLIC_KEY`
  - (opcional) `MERCADO_PAGO_WEBHOOK_SECRET`

## 2) Build

Na raiz:
```bash
npm ci
npm run build
```

No backend:
```bash
cd backend
npm ci
npm run build
```

## 3) Banco (Prisma / Postgres)

Como ainda nao existe `prisma/migrations/`, use:
```bash
npm run db:push
```

## 4) Start (PM2 recomendado)

O arquivo do PM2 e `ecosystem.config.cjs` (na raiz).

Exemplo:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5) Reverse proxy / SSL

Use Nginx/Apache para expor apenas o frontend (443) e manter o backend interno (3001).
Se precisar expor o backend, use HTTPS e ajuste `ALLOWED_ORIGINS`.

## 6) Mercado Pago

Em producao:
- `FRONTEND_URL` e `BASE_URL` precisam ser HTTPS
- Webhook: `${BASE_URL}/api/webhooks/mercadopago` (precisa ser uma URL pública acessível pelo Mercado Pago; pode ser no backend direto ou no Next fazendo proxy)
- Retorno do checkout aponta para `${FRONTEND_URL}/payment-success`

Configuração recomendada (1 domínio):
- Nginx roteia `/` → Next (3000) e `/api/*` → Backend (3001) (ver `nginx-hostinger.conf:1`)
- `FRONTEND_URL=https://app.seudominio.com`
- `BASE_URL=https://app.seudominio.com` (o Mercado Pago chama o webhook nesse mesmo domínio em `/api/webhooks/mercadopago`)
- No frontend, `BACKEND_URL=http://127.0.0.1:3001` (proxy interno) ou omita se você chamar o backend direto pelo Nginx em `/api`
