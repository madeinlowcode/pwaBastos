# Arquitetura do Sistema

## 📐 Visão Geral da Arquitetura

O PWA Consultas é construído seguindo uma arquitetura **MVC (Model-View-Controller)** clássica, adaptada para aplicações web modernas com suporte a PWA.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Handlebars  │  │  JavaScript  │  │     CSS      │  │
│  │  Templates   │  │   (Vanilla)  │  │  Magic UI    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Service Worker (Cache + Push)            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                  SERVIDOR (Node.js)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Express.js Application               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Routes  │→ │Controller│→ │   Services   │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌────────────────┐           ┌────────────────────┐    │
│  │   Middleware   │           │   Web Push VAPID   │    │
│  │  (Auth, etc.)  │           │    Configuration   │    │
│  └────────────────┘           └────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                 │
│                    Hospedado no Supabase                 │
│  ┌─────────┐ ┌──────────────┐ ┌────────────────┐       │
│  │  users  │ │ appointments │ │ notifications  │       │
│  └─────────┘ └──────────────┘ └────────────────┘       │
│  ┌─────────────────┐                                    │
│  │  subscriptions  │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

## 🏗️ Camadas da Aplicação

### 1. Camada de Apresentação (Frontend)

#### **Templates Handlebars**
- **Localização**: `views/`
- **Responsabilidade**: Renderização do HTML no servidor
- **Componentes**:
  - **Layouts**: Estrutura base das páginas (`layouts/main.hbs`)
  - **Partials**: Componentes reutilizáveis (header, footer, cards)
  - **Pages**: Páginas individuais (home, login, perfil, etc.)

#### **JavaScript Client-Side**
- **Localização**: `public/js/`
- **Tecnologia**: Vanilla JavaScript (sem frameworks)
- **Responsabilidades**:
  - Interatividade da interface
  - Registro do Service Worker
  - Gerenciamento de notificações push
  - Validação de formulários
  - Animações e efeitos visuais
  - Comunicação com API via Fetch API

#### **Estilos CSS**
- **Localização**: `public/css/`
- **Sistema**: Magic UI Design System
- **Características**:
  - CSS Custom Properties (variáveis CSS)
  - Mobile-first responsive design
  - Sistema de cores consistente
  - Componentes modulares

### 2. Camada de Aplicação (Backend)

#### **Servidor Express.js**
- **Arquivo principal**: `server.js`
- **Responsabilidades**:
  - Configuração da aplicação
  - Inicialização de middlewares
  - Registro de rotas
  - Configuração do template engine
  - Gerenciamento de sessões

#### **Rotas (Routes)**
- **Localização**: `routes/`
- **Responsabilidade**: Mapeamento de URLs para controllers
- **Módulos**:
  - `authRoutes.js` - Autenticação e autorização
  - `appointmentRoutes.js` - Gerenciamento de consultas
  - `userRoutes.js` - Perfil do usuário
  - `notificationRoutes.js` - Sistema de notificações

#### **Controladores (Controllers)**
- **Localização**: `controllers/`
- **Responsabilidade**: Lógica de negócio e orquestração
- **Padrão**: Cada controller expõe funções para tratar requisições específicas
- **Módulos**:
  - `authController.js` - Login, logout, autenticação
  - `appointmentController.js` - CRUD de consultas
  - `userController.js` - Gerenciamento de usuários
  - `notificationController.js` - Envio e gerenciamento de notificações

#### **Serviços (Services)**
- **Localização**: `services/`
- **Responsabilidade**: Lógica de negócio reutilizável e integrações externas
- **Módulos**:
  - `notificationService.js` - Envio de notificações push via Web Push API

#### **Middleware**
- **Autenticação**: `isAuthenticated` (em `authController.js`)
  - Verifica se usuário está logado
  - Protege rotas que requerem autenticação
  - Redireciona para login se não autenticado
- **Session Management**: `express-session`
- **Body Parsing**: `express.json()`, `express.urlencoded()`
- **Static Files**: Servindo arquivos de `public/` e `uploads/`

### 3. Camada de Dados (Database)

#### **PostgreSQL via Supabase**
- **Configuração**: `config/db.js`
- **Driver**: `pg` (node-postgres)
- **Padrão**: Connection Pool para performance
- **Tabelas**:
  - `users` - Dados dos usuários
  - `appointments` - Consultas médicas
  - `notifications` - Histórico de notificações
  - `subscriptions` - Inscrições para push notifications

### 4. Camada PWA (Progressive Web App)

#### **Service Worker**
- **Arquivo**: `public/service-worker.js`
- **Responsabilidades**:
  - **Cache Management**: Armazena recursos offline
  - **Fetch Strategy**: Define como buscar recursos (cache-first, network-first)
  - **Push Notifications**: Recebe e exibe notificações
  - **Background Sync**: (preparado para implementação futura)

#### **Web App Manifest**
- **Arquivo**: `public/manifest.json`
- **Configuração**:
  - Nome e ícones da aplicação
  - Tema e cores
  - Modo de exibição (standalone)
  - URLs de início

## 🔄 Fluxo de Dados

### Fluxo de Requisição HTTP

```
1. Cliente faz requisição HTTP
   ↓
2. Express recebe e processa middlewares
   ↓
3. Rota correspondente é identificada
   ↓
4. Middleware de autenticação (se necessário)
   ↓
5. Controller recebe a requisição
   ↓
6. Controller chama Service (se necessário)
   ↓
7. Service/Controller consulta o banco de dados
   ↓
8. Dados são processados e formatados
   ↓
9. Controller renderiza template Handlebars ou retorna JSON
   ↓
10. Resposta é enviada ao cliente
```

### Fluxo de Autenticação

```
1. Usuário preenche formulário de login
   ↓
2. JavaScript envia POST para /api/login
   ↓
3. authController valida credenciais no banco
   ↓
4. bcrypt compara senha com hash armazenado
   ↓
5. Se válido, cria sessão e armazena userId
   ↓
6. Retorna sucesso ao cliente
   ↓
7. Cliente redireciona para dashboard
```

### Fluxo de Notificação Push

```
1. Service worker solicita permissão ao usuário
   ↓
2. Usuário autoriza notificações
   ↓
3. Browser gera subscription com endpoint único
   ↓
4. JavaScript envia subscription para /api/subscribe
   ↓
5. Servidor armazena subscription no banco
   ↓
6. Quando evento ocorre (ex: nova consulta):
   ↓
7. notificationService cria payload
   ↓
8. web-push envia para todos os endpoints do usuário
   ↓
9. Service worker recebe push event
   ↓
10. Service worker exibe notificação visual
```

### Fluxo de Cache (Service Worker)

```
1. Service worker é registrado ao carregar a página
   ↓
2. Durante install, faz cache de recursos essenciais
   ↓
3. Usuário navega pela aplicação
   ↓
4. Service worker intercepta todas as requisições
   ↓
5. Para navegação: tenta network primeiro, fallback para cache
   ↓
6. Para assets estáticos: tenta cache primeiro, fallback para network
   ↓
7. Novos recursos são adicionados ao cache dinamicamente
```

## 🔐 Segurança

### Autenticação e Autorização

- **Método**: Session-based authentication
- **Armazenamento**: Express-session com cookie seguro
- **Proteção de senha**: bcrypt com salt automático
- **Middleware**: `isAuthenticated` protege rotas privadas
- **Timeout**: Sessões expiram automaticamente (configurável)

### Segurança de Dados

- **Variáveis de ambiente**: Credenciais em `.env` (não versionado)
- **SQL Injection**: Uso de parameterized queries com `pg`
- **XSS**: Handlebars escapa automaticamente HTML
- **HTTPS**: Recomendado em produção (configuração do servidor)

### VAPID Keys

- **Geração**: Script `generate-vapid-keys.js`
- **Armazenamento**: Variáveis de ambiente
- **Uso**: Autenticação do servidor com push services

## 📦 Padrões de Código

### MVC Pattern

```
Model (Implícito)
├── Queries SQL diretas nos controllers
└── Tabelas PostgreSQL

View
├── Handlebars templates (.hbs)
└── CSS + JavaScript client-side

Controller
├── Funções que processam requisições
├── Validação de dados
└── Orquestração de serviços
```

### Convenções de Nomenclatura

- **Arquivos**: camelCase para JS, kebab-case para CSS
- **Rotas API**: `/api/recurso/acao`
- **Rotas View**: `/nome-da-pagina`
- **Funções**: verbos descritivos (render, handle, send, etc.)
- **Variáveis**: camelCase em JS, kebab-case em CSS

### Estrutura de Arquivos

- **Um arquivo por rota/controller**
- **Separação de concerns**: Routes → Controllers → Services
- **Partials reutilizáveis** para componentes UI
- **CSS modular** por componente/página

## 🚀 Performance

### Otimizações Implementadas

1. **Service Worker Cache**: Reduz requisições ao servidor
2. **Connection Pool**: Reutiliza conexões com banco de dados
3. **Static File Serving**: Express serve arquivos estáticos eficientemente
4. **Minificação**: (recomendado adicionar em produção)
5. **Lazy Loading**: Imagens carregadas sob demanda
6. **Compression**: (recomendado adicionar middleware)

### Métricas de Performance

- **FCP (First Contentful Paint)**: < 2s
- **TTI (Time to Interactive)**: < 3s
- **Service Worker**: Instalação em < 1s
- **Cache Hit Rate**: > 80% para assets estáticos

## 🔮 Escalabilidade

### Limitações Atuais

- **Sessões em memória**: Não escalável horizontalmente
- **Uploads locais**: Armazenamento no servidor local

### Melhorias Futuras

- **Redis para sessões**: Permitir múltiplas instâncias
- **S3 para uploads**: Armazenamento distribuído
- **CDN**: Servir assets estáticos
- **Load Balancer**: Distribuir tráfego entre instâncias
- **Índices no banco**: Otimizar queries frequentes

---

**Próximos passos**: Consulte [Estrutura de Pastas](./estrutura-pastas.md) para entender a organização dos arquivos.
