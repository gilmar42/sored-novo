# Deploy na Hostinger

## Hostinger Business Web Hosting / Node.js Web App

Se o seu plano for `Business Web Hosting`, este é o modo recomendado.
Segundo a documentação oficial da Hostinger, Node.js com acesso completo ao servidor é recurso de VPS; em Web Hosting você deve usar o app Node.js gerenciado da plataforma.

Fontes oficiais:
- https://support.hostinger.com/en/articles/1583661-is-node-js-supported-at-hostinger

### Como este projeto deve ser publicado nesse cenário

- Framework: `Next.js`
- Node.js: `20.x`
- Root directory: `sored-novo-main`
- Entry file: vazio
- Output directory: vazio
- Build command: `npm run build`
- Start command: `npm run start`

### Variáveis de ambiente mínimas no app Next.js

Baseie-se em `.env.hostinger.example`:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_PUBLIC_KEY`
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- opcional: `MERCADO_PAGO_WEBHOOK_SECRET`

### Observação importante

Após a refatoração atual, o Next.js já consegue:
- autenticação local com Prisma
- pagamentos Checkout/PIX local-first
- webhook do Mercado Pago no próprio app em `/api/webhooks/mercadopago`

Ou seja: no cenário de `Business Web Hosting`, o app pode rodar sem backend Express separado, desde que as credenciais e o banco estejam corretos.

## Hostinger VPS (opcional)

Use esta seção só se você realmente estiver em VPS e quiser manter frontend + backend separados.

Este repo tem 2 apps:
- Frontend: Next.js (porta 3000)
- Backend: Express/Node (porta 3001)

Arquivos principais para este deploy:
- `ecosystem.config.cjs`: sobe frontend e backend no PM2
- `nginx-hostinger.conf`: reverse proxy HTTPS no Hostinger
- `package.json`: scripts `hostinger:*` para instalar, buildar e recarregar

## Observação sobre o modelo de deploy

Alguns provedores pedem esses campos mesmo para frameworks.
- Na Hostinger VPS, não use export estático (`out`), porque este projeto depende de SSR e rotas `/api/*`.
- O frontend gera build `standalone`, mas o processo padrão do servidor continua sendo `npm start` via PM2.
- O backend sobe separado em `./backend/dist/index.js`, também via PM2.

## 1) Variaveis de ambiente

Frontend (raiz) - baseie em `.env.hostinger.example`:
- `DATABASE_URL` (MariaDB para Prisma)
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (URL publica do site)
- `BACKEND_URL` (origem do backend sem `/api`; em VPS normalmente `http://localhost:3001`, em deploy separado `https://api.seudominio.com`)
- `NEXT_PUBLIC_API_URL` (opcional; URL completa da API com `/api`, ex.: `https://api.seudominio.com/api`, util para chamadas diretas do navegador)

Backend (`backend/.env`) - baseie em `backend/.env.hostinger.example`:
- `DATABASE_URL` (MariaDB para Prisma)
- `JWT_SECRET`
- `BASE_URL` (URL publica do backend, https://...)
- `FRONTEND_URL` (URL publica do frontend, https://...)
- `ALLOWED_ORIGINS` (lista separada por virgula; inclua o frontend)
- Mercado Pago:
  - `MERCADO_PAGO_ACCESS_TOKEN`
  - `MERCADO_PAGO_PUBLIC_KEY`
  - (opcional) `MERCADO_PAGO_WEBHOOK_SECRET`

Arquitetura de banco após a refatoração:
- app principal (`Next.js` + Prisma): `MariaDB`
- backend de pagamentos (`Express` + Prisma): `MariaDB`
- integração com `Mercado Pago`: preservada no backend Express

## 2) Instalação no servidor

Copie os arquivos de exemplo antes de instalar:
```bash
cp .env.hostinger.example .env
cp backend/.env.hostinger.example backend/.env
```

Depois ajuste os valores reais do seu domínio, banco e Mercado Pago.

Na raiz:
```bash
npm ci
```

No backend:
```bash
cd backend
npm ci
```

Ou, da raiz, usando o fluxo padronizado:
```bash
npm run hostinger:install
```

## 3) Build

Da raiz:
```bash
npm run build:hostinger
```

## 4) Banco (Prisma / MariaDB)

Como ainda nao existe `prisma/migrations/`, use:
```bash
npm run db:push
```

## 5) Start e reload (PM2)

O arquivo do PM2 e `ecosystem.config.cjs` (na raiz).
Ele carrega automaticamente:
- `./.env` para o frontend
- `./backend/.env` para o backend

Exemplo:
```bash
npm run hostinger:start
pm2 save
pm2 startup
```

Depois de alterar variáveis ou publicar nova build:
```bash
npm run hostinger:reload
```

## 6) Reverse proxy / SSL

Use Nginx/Apache para expor apenas o frontend (443) e manter o backend interno (3001).
Se precisar expor o backend, use HTTPS e ajuste `ALLOWED_ORIGINS`.

Configuração recomendada na Hostinger:
- `/` → Next.js (`127.0.0.1:3000`)
- backend Express fica interno em `127.0.0.1:3001`, acessado pelo Next nas rotas de pagamento/webhook
- arquivo-base: `nginx-hostinger.conf`

## 7) Mercado Pago

Em producao:
- `FRONTEND_URL` e `BASE_URL` precisam ser HTTPS
- Webhook: `${BASE_URL}/api/webhooks/mercadopago` (precisa ser uma URL pública acessível pelo Mercado Pago; pode ser no backend direto ou no Next fazendo proxy)
- Retorno do checkout aponta para `${FRONTEND_URL}/payment-success`

Configuração recomendada (1 domínio):
- Nginx roteia todo tráfego público para o Next (3000)
- O Next encaminha internamente pagamentos e webhook para `BACKEND_URL=http://127.0.0.1:3001`
- `FRONTEND_URL=https://app.seudominio.com`
- `BASE_URL=https://app.seudominio.com` (o Mercado Pago chama o webhook nesse mesmo domínio em `/api/webhooks/mercadopago`)

Configuração recomendada (Vercel + backend externo):
- `BACKEND_URL=https://api.seudominio.com`
- `NEXT_PUBLIC_API_URL=https://api.seudominio.com/api`
- Nao use apenas `NEXT_PUBLIC_API_URL=/api` nesse cenário, porque as rotas `/api/*` do Next executam no Vercel e precisam saber qual é a origem real do backend.

## 8) Ordem sugerida de deploy na Hostinger

```bash
git pull
cp .env.hostinger.example .env
cp backend/.env.hostinger.example backend/.env
npm run hostinger:install
npm run build:hostinger
npm run db:push
npm run hostinger:reload
```
