# SORED - Sistema de Orçamento Rápido Industrial

Plataforma SaaS completa para gestão e geração de orçamentos industriais.

## 🚀 Visão Geral

O SORED é um sistema web desenvolvido com Next.js e Node.js que permite empresas industriais calcular rapidamente custos de fabricação, considerando materiais, mão de obra e uso de máquinas.

### ✅ Funcionalidades Implementadas

- **Autenticação Multi-Tenant**: Sistema SaaS com isolamento completo de dados entre empresas
- **Gestão de Clientes**: Cadastro e gerenciamento completo de clientes
- **Gestão de Materiais**: Controle de estoque e custos de materiais
- **Gestão de Mão de Obra**: Cadastro de funções e controle de custos por hora
- **Gestão de Máquinas**: Registro de equipamentos e cálculo de hora máquina
- **Sistema de Orçamentos**: Cálculo automático de custos com margem de lucro
- **Geração de PDF**: Exportação profissional de orçamentos
- **Dashboard**: Indicadores e estatísticas em tempo real
- **Configurações da Empresa**: Personalização de dados e preferências

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem segura
- **TailwindCSS** - Framework de estilização
- **React Hook Form** - Formulários
- **React Query** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem segura
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM MongoDB
- **JWT** - Autenticação
- **PDFKit** - Geração de PDF
- **Multer** - Upload de arquivos
- **Joi** - Validação de dados

## 📁 Estrutura do Projeto

```
sored-novo/
├── src/                          # Frontend Next.js
│   ├── app/                      # App Router
│   │   ├── globals.css          # Estilos globais
│   │   ├── layout.tsx           # Layout principal
│   │   └── page.tsx             # Página inicial
│   ├── components/               # Componentes React
│   ├── lib/                      # Utilitários
│   ├── types/                    # Tipos TypeScript
│   ├── hooks/                    # Hooks personalizados
│   └── utils/                    # Funções utilitárias
├── backend/                      # Backend Node.js
│   ├── src/
│   │   ├── config/              # Configurações
│   │   │   └── database.ts      # Conexão MongoDB
│   │   ├── controllers/         # Controladores
│   │   │   ├── authController.ts
│   │   │   ├── clientController.ts
│   │   │   ├── materialController.ts
│   │   │   ├── laborController.ts
│   │   │   ├── machineController.ts
│   │   │   ├── budgetController.ts
│   │   │   ├── pdfController.ts
│   │   │   ├── dashboardController.ts
│   │   │   └── settingsController.ts
│   │   ├── middleware/          # Middleware
│   │   │   ├── auth.ts          # Autenticação JWT
│   │   │   └── validation.ts    # Validação
│   │   ├── models/              # Models Mongoose
│   │   │   ├── Tenant.ts
│   │   │   ├── User.ts
│   │   │   ├── Client.ts
│   │   │   ├── Material.ts
│   │   │   ├── Labor.ts
│   │   │   ├── Machine.ts
│   │   │   └── Budget.ts
│   │   ├── routes/              # Rotas da API
│   │   │   ├── auth.ts
│   │   │   ├── clients.ts
│   │   │   ├── materials.ts
│   │   │   ├── labor.ts
│   │   │   ├── machines.ts
│   │   │   ├── budgets.ts
│   │   │   ├── pdf.ts
│   │   │   ├── dashboard.ts
│   │   │   └── settings.ts
│   │   ├── utils/               # Utilitários
│   │   │   └── pdfGenerator.ts  # Geração de PDF
│   │   └── index.ts             # Servidor Express
│   ├── uploads/                 # Arquivos upload
│   ├── .env.example             # Variáveis ambiente
│   └── package.json
├── package.json                 # Dependências frontend
├── next.config.js              # Config Next.js
├── tailwind.config.js          # Config TailwindCSS
├── tsconfig.json               # Config TypeScript
└── README.md                   # Documentação
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- MongoDB 5.0+
- npm ou yarn

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd sored-novo
```

### 2. Instalar dependências
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 3. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cd backend
cp .env.example .env

# Editar .env com suas configurações
MONGODB_URI=mongodb://localhost:27017/sored
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
```

### 4. Executar a aplicação
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
npm run dev
```

### 5. Acessar a aplicação
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de empresa e usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário
- `POST /api/auth/logout` - Logout

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Obter cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Materiais
- `GET /api/materials` - Listar materiais
- `POST /api/materials` - Criar material
- `GET /api/materials/:id` - Obter material
- `PUT /api/materials/:id` - Atualizar material
- `DELETE /api/materials/:id` - Deletar material

### Mão de Obra
- `GET /api/labor` - Listar funções
- `POST /api/labor` - Criar função
- `GET /api/labor/:id` - Obter função
- `PUT /api/labor/:id` - Atualizar função
- `DELETE /api/labor/:id` - Deletar função

### Máquinas
- `GET /api/machines` - Listar máquinas
- `POST /api/machines` - Criar máquina
- `GET /api/machines/:id` - Obter máquina
- `PUT /api/machines/:id` - Atualizar máquina
- `DELETE /api/machines/:id` - Deletar máquina

### Orçamentos
- `GET /api/budgets` - Listar orçamentos
- `POST /api/budgets` - Criar orçamento
- `GET /api/budgets/:id` - Obter orçamento
- `PUT /api/budgets/:id` - Atualizar orçamento
- `DELETE /api/budgets/:id` - Deletar orçamento
- `GET /api/budgets/stats` - Estatísticas

### PDF
- `POST /api/pdf/budgets/:id/generate` - Gerar PDF
- `GET /api/pdf/budgets/:id/download` - Baixar PDF

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/activity` - Atividades recentes
- `GET /api/dashboard/top-clients` - Top clientes

### Configurações
- `GET /api/settings` - Obter configurações
- `PUT /api/settings` - Atualizar configurações
- `POST /api/settings/logo` - Upload logo
- `GET /api/settings/subscription` - Informações assinatura

## 🔐 Segurança

- **JWT Tokens**: Autenticação segura com tokens
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Helmet**: Headers de segurança
- **CORS**: Configuração de CORS
- **Input Validation**: Validação rigorosa de dados
- **Password Hashing**: Senhas criptografadas com bcrypt

## 🏗️ Arquitetura Multi-Tenant

O sistema utiliza arquitetura multi-tenant onde:
- Cada empresa possui um `tenantId` único
- Todos os dados são vinculados ao tenant correspondente
- Isolamento completo de dados entre empresas
- Controle de acesso baseado em permissões

## 📈 Planos e Limites

- **Starter**: 50 clientes, 100 materiais, 200 orçamentos, 3 usuários
- **Professional**: Uso ilimitado, 10 usuários
- **Enterprise**: Personalizado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença ISC.

## 📞 Suporte

Para suporte, envie um email para suporte@sored.com.br
