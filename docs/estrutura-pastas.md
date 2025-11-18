# Estrutura de Pastas

## 📂 Organização do Projeto

Esta página documenta a estrutura completa de diretórios e arquivos do projeto PWA Consultas.

## 🌳 Árvore de Diretórios

```
pwaBastos/
├── config/                         # Configurações da aplicação
│   └── db.js                       # Configuração do PostgreSQL
│
├── controllers/                    # Controladores (lógica de negócio)
│   ├── authController.js           # Autenticação e autorização
│   ├── appointmentController.js    # Gerenciamento de consultas
│   ├── userController.js           # Gerenciamento de usuários
│   └── notificationController.js   # Sistema de notificações
│
├── routes/                         # Definição de rotas
│   ├── authRoutes.js               # Rotas de autenticação
│   ├── appointmentRoutes.js        # Rotas de consultas
│   ├── userRoutes.js               # Rotas de usuário
│   └── notificationRoutes.js       # Rotas de notificações
│
├── services/                       # Serviços e lógica reutilizável
│   └── notificationService.js      # Serviço de notificações push
│
├── views/                          # Templates Handlebars
│   ├── layouts/                    # Layouts principais
│   │   └── main.hbs                # Layout base
│   │
│   ├── partials/                   # Componentes reutilizáveis
│   │   ├── header.hbs              # Cabeçalho
│   │   ├── footer.hbs              # Rodapé
│   │   ├── consultaCard.hbs        # Card de consulta
│   │   └── notificacaoItem.hbs     # Item de notificação
│   │
│   ├── home.hbs                    # Página inicial/dashboard
│   ├── login.hbs                   # Página de login
│   ├── consultas.hbs               # Lista de consultas
│   ├── add-appointment.hbs         # Formulário de nova consulta
│   ├── perfil.hbs                  # Perfil do usuário
│   ├── edit-profile.hbs            # Edição de perfil
│   ├── notificacoes.hbs            # Lista de notificações
│   └── forgot-password.hbs         # Recuperação de senha
│
├── public/                         # Arquivos estáticos
│   ├── js/                         # JavaScript client-side
│   │   ├── service-worker-register.js      # Registro do SW
│   │   ├── notification-handler.js         # Gerenciamento de notificações
│   │   ├── appointment-actions.js          # Ações em consultas
│   │   ├── login.js                        # Lógica de login
│   │   ├── navigation.js                   # Navegação
│   │   ├── magic-ui.js                     # Efeitos e animações
│   │   ├── magic-notifications.js          # Interações de notificações
│   │   ├── modern-profile.js               # Interações de perfil
│   │   ├── modern-appointment-cards.js     # Cards de consultas
│   │   ├── medical-notifications.js        # Notificações médicas
│   │   ├── simplified-notifications.js     # Sistema simplificado
│   │   ├── forgot-password.js              # Recuperação de senha
│   │   └── sweetalert-test.js              # Testes de alertas
│   │
│   ├── css/                        # Folhas de estilo
│   │   ├── style.css                       # Estilos principais
│   │   ├── magic-ui-system.css             # Sistema de design
│   │   ├── magic-card.css                  # Componente card
│   │   ├── magic-login.css                 # Página de login
│   │   ├── magic-notifications.css         # Notificações
│   │   ├── modern-profile.css              # Perfil
│   │   ├── modern-appointment-cards.css    # Cards de consultas
│   │   ├── medical-notifications.css       # Alertas médicos
│   │   └── simplified-notifications.css    # Notificações simplificadas
│   │
│   ├── images/                     # Imagens e ícones
│   │   └── [arquivos de imagem]
│   │
│   ├── service-worker.js           # Service Worker principal
│   └── manifest.json               # Web App Manifest
│
├── uploads/                        # Uploads de usuários
│   └── [fotos de perfil]
│
├── memory-bank/                    # Documentação de desenvolvimento
│   └── [arquivos de memória]
│
├── docs/                           # Documentação do projeto
│   ├── README.md                   # Visão geral
│   ├── arquitetura.md              # Arquitetura
│   ├── estrutura-pastas.md         # Este arquivo
│   ├── componentes.md              # Componentes
│   ├── integracoes.md              # Integrações
│   ├── api.md                      # API
│   ├── banco-de-dados.md           # Banco de dados
│   └── deploy.md                   # Deploy
│
├── node_modules/                   # Dependências (não versionado)
│
├── server.js                       # Arquivo principal do servidor
├── package.json                    # Configuração do projeto
├── package-lock.json               # Lock de dependências
├── .env                            # Variáveis de ambiente (não versionado)
├── .env.example                    # Exemplo de variáveis
├── .gitignore                      # Arquivos ignorados pelo Git
├── CLAUDE.md                       # Instruções para o Claude Code
├── generate-vapid-keys.js          # Gerador de chaves VAPID
├── create-test-user.js             # Criador de usuário de teste
└── check-users.js                  # Verificador de usuários
```

## 📁 Descrição Detalhada dos Diretórios

### `/config` - Configurações

Contém arquivos de configuração da aplicação.

**Arquivos:**
- **`db.js`** - Configuração do pool de conexão com PostgreSQL
  - Importa variáveis de ambiente para conexão
  - Cria e exporta pool de conexão
  - Referenciado em: controllers e services

### `/controllers` - Controladores

Contém a lógica de negócio e handlers de requisições.

**Arquivos:**
- **`authController.js`** (169 linhas)
  - Funções: `isAuthenticated`, `renderLoginPage`, `loginUser`, `logoutUser`, `renderForgotPasswordPage`, `handlePasswordResetRequest`, `changePassword`
  - Gerencia autenticação, sessões e mudança de senha

- **`appointmentController.js`** (243 linhas)
  - Funções: `renderHomePage`, `renderAddAppointmentPage`, `renderAppointmentsPage`, `handleAppointmentAction`, `addAppointment`
  - CRUD completo de consultas médicas
  - Integração com notificationService

- **`userController.js`** (128 linhas)
  - Funções: `getUserData`, `renderProfilePage`, `updateUserProfile`, `getUserStats`
  - Gerenciamento de perfil e estatísticas

- **`notificationController.js`** (195 linhas)
  - Funções: `renderNotificationsPage`, `subscribeToPush`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `sendTestNotification`
  - Sistema completo de notificações push

### `/routes` - Rotas

Define os endpoints e mapeia para controllers.

**Arquivos:**
- **`authRoutes.js`** - Rotas públicas e de autenticação
- **`appointmentRoutes.js`** - Rotas protegidas de consultas
- **`userRoutes.js`** - Rotas de perfil do usuário
- **`notificationRoutes.js`** - Rotas de notificações

**Padrão de nomenclatura:**
- Rotas de view: `/nome-da-pagina`
- Rotas de API: `/api/recurso/acao`

### `/services` - Serviços

Contém lógica de negócio reutilizável e integrações.

**Arquivos:**
- **`notificationService.js`** (78 linhas)
  - Função principal: `sendPushNotification(userId, title, message)`
  - Armazena notificação no banco
  - Envia para todos os dispositivos do usuário
  - Trata subscriptions expiradas

### `/views` - Templates Handlebars

Templates para renderização server-side.

#### **Layouts**
- **`layouts/main.hbs`** - Template base com `<head>`, estrutura HTML, e `{{{body}}}`

#### **Partials** (Componentes Reutilizáveis)
- **`header.hbs`** - Cabeçalho com logo, nome do usuário, foto de perfil
- **`footer.hbs`** - Rodapé com navegação (Home, Consultas, Notificações, Perfil)
- **`consultaCard.hbs`** - Card individual de consulta com botões de ação
- **`notificacaoItem.hbs`** - Item de notificação com status lido/não lido

#### **Pages** (Páginas Completas)
- **`home.hbs`** - Dashboard principal com próximas consultas
- **`login.hbs`** - Formulário de login com Magic UI
- **`consultas.hbs`** - Lista completa de consultas confirmadas
- **`add-appointment.hbs`** - Formulário de nova consulta
- **`perfil.hbs`** - Página de perfil do usuário
- **`edit-profile.hbs`** - Formulário de edição de perfil
- **`notificacoes.hbs`** - Lista de notificações
- **`forgot-password.hbs`** - Recuperação de senha

### `/public` - Arquivos Estáticos

#### **`/public/js`** - JavaScript Client-Side

**Core PWA:**
- **`service-worker-register.js`** - Registra o Service Worker ao carregar a página

**Autenticação:**
- **`login.js`** - Submissão de formulário de login via Fetch API
- **`forgot-password.js`** - Lógica de recuperação de senha

**Notificações:**
- **`notification-handler.js`** - Solicita permissão e registra subscription
- **`magic-notifications.js`** - Interações na página de notificações
- **`medical-notifications.js`** - Notificações específicas médicas
- **`simplified-notifications.js`** - Versão simplificada

**Consultas:**
- **`appointment-actions.js`** - Confirmar, cancelar, desmarcar consultas
- **`modern-appointment-cards.js`** - Interações dos cards de consultas

**UI/UX:**
- **`magic-ui.js`** - Animações, hover effects, ripples, scroll animations
- **`navigation.js`** - Navegação do footer
- **`modern-profile.js`** - Interações do perfil

**Utilitários:**
- **`sweetalert-test.js`** - Testes de modais SweetAlert2

#### **`/public/css`** - Folhas de Estilo

**Sistema de Design:**
- **`magic-ui-system.css`** - Variáveis CSS, cores, espaçamento (base do design system)

**Componentes:**
- **`magic-card.css`** - Estilização de cards
- **`modern-appointment-cards.css`** - Cards específicos de consultas

**Páginas:**
- **`style.css`** - Estilos globais e responsivos
- **`magic-login.css`** - Página de login
- **`modern-profile.css`** - Página de perfil
- **`magic-notifications.css`** - Página de notificações
- **`medical-notifications.css`** - Alertas médicos
- **`simplified-notifications.css`** - Versão simplificada

#### **Outros Arquivos Públicos:**
- **`service-worker.js`** - Service Worker com cache e push
- **`manifest.json`** - Configuração PWA (nome, ícones, tema)

### `/uploads` - Uploads de Usuários

Diretório para armazenar fotos de perfil enviadas pelos usuários.

**Estrutura:**
- Arquivos nomeados por timestamp ou ID do usuário
- Avatar padrão disponível caso usuário não tenha foto

### `/memory-bank` - Documentação de Desenvolvimento

Arquivos de contexto e memória para desenvolvimento com IA.

### `/docs` - Documentação do Projeto

Documentação completa em Markdown (este diretório).

## 📄 Arquivos Raiz

### Arquivos de Configuração

- **`package.json`** - Metadados do projeto, scripts e dependências
- **`package-lock.json`** - Lock exato das versões das dependências
- **`.env`** - Variáveis de ambiente (NÃO versionado)
- **`.env.example`** - Template para `.env` com variáveis necessárias
- **`.gitignore`** - Arquivos e diretórios ignorados pelo Git

### Arquivo Principal

- **`server.js`** (120+ linhas) - Ponto de entrada da aplicação
  - Importa dependências
  - Configura Express
  - Registra middlewares
  - Configura Handlebars
  - Registra rotas
  - Inicia servidor

### Scripts Utilitários

- **`generate-vapid-keys.js`** - Gera par de chaves VAPID para Web Push
- **`create-test-user.js`** - Cria usuário de teste no banco
- **`check-users.js`** - Lista usuários cadastrados

### Documentação de Desenvolvimento

- **`CLAUDE.md`** - Instruções para Claude Code (IA)

## 🔍 Localizando Arquivos

### Por Funcionalidade

**Autenticação:**
- Routes: `routes/authRoutes.js`
- Controller: `controllers/authController.js`
- View: `views/login.hbs`
- Client JS: `public/js/login.js`
- CSS: `public/css/magic-login.css`

**Consultas:**
- Routes: `routes/appointmentRoutes.js`
- Controller: `controllers/appointmentController.js`
- Views: `views/home.hbs`, `views/consultas.hbs`, `views/add-appointment.hbs`
- Partial: `views/partials/consultaCard.hbs`
- Client JS: `public/js/appointment-actions.js`, `public/js/modern-appointment-cards.js`
- CSS: `public/css/modern-appointment-cards.css`

**Notificações:**
- Routes: `routes/notificationRoutes.js`
- Controller: `controllers/notificationController.js`
- Service: `services/notificationService.js`
- View: `views/notificacoes.hbs`
- Partial: `views/partials/notificacaoItem.hbs`
- Client JS: `public/js/notification-handler.js`, `public/js/magic-notifications.js`
- CSS: `public/css/magic-notifications.css`
- Service Worker: `public/service-worker.js` (push events)

**Perfil de Usuário:**
- Routes: `routes/userRoutes.js`
- Controller: `controllers/userController.js`
- Views: `views/perfil.hbs`, `views/edit-profile.hbs`
- Client JS: `public/js/modern-profile.js`
- CSS: `public/css/modern-profile.css`
- Uploads: `uploads/` (fotos)

**PWA:**
- Service Worker: `public/service-worker.js`
- Manifest: `public/manifest.json`
- Registration: `public/js/service-worker-register.js`

## 📊 Estatísticas do Projeto

**Total de Arquivos por Tipo:**
- JavaScript Backend: 9 arquivos
- JavaScript Frontend: 14 arquivos
- CSS: 9 arquivos
- Handlebars: 12+ templates
- Configuração: 6 arquivos

**Linhas de Código Estimadas:**
- Backend (JS): ~1.200 linhas
- Frontend (JS): ~800 linhas
- CSS: ~1.500 linhas
- Templates (HBS): ~600 linhas

## 🚨 Arquivos Importantes (Não Versionados)

Estes arquivos **NÃO** devem estar no Git:

```
.env                    # Credenciais sensíveis
node_modules/           # Dependências (npm install)
uploads/*               # Arquivos enviados por usuários
*.log                   # Logs
.DS_Store               # macOS
```

Sempre use `.env.example` como template e crie seu próprio `.env` local.

---

**Próximos passos**: Consulte [Componentes](./componentes.md) para entender cada componente em detalhes.
