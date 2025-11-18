# Contexto Tecnológico - PWA Agendamento de Consultas Médicas

**Última Atualização**: 2025-10-21
**Versão**: 2.0

---

## Stack Tecnológico Completo

### Backend

**Runtime e Framework**:
- **Node.js**: v20+ (LTS)
- **Express.js**: v4.18.x - Framework web minimalista
- **express-handlebars**: v7.x - Template engine para SSR

**Banco de Dados**:
- **PostgreSQL**: v15+ via Supabase
- **pg (node-postgres)**: v8.11.x - PostgreSQL client
- **Connection Pool**: Configurado para alta performance

**Autenticação e Segurança**:
- **express-session**: v1.17.x - Session management
- **bcrypt**: v5.1.x - Password hashing (10 salt rounds)
- **VAPID**: Voluntary Application Server Identification para Web Push

**Notificações Push**:
- **web-push**: v3.6.x - Web Push library com suporte VAPID
- **Push API**: Padrão W3C para push notifications

**Upload de Arquivos**:
- **multer**: v1.4.x - Middleware para multipart/form-data
- Configurado para upload de imagens de perfil

**Utilitários**:
- **dotenv**: v16.x - Gerenciamento de variáveis de ambiente
- **nodemon**: v3.x - Hot-reload durante desenvolvimento

---

### Frontend

**Template Engine**:
- **Handlebars**: v4.x - Renderização server-side
- **Partials**: header, footer, appointment-card
- **Layouts**: main.hbs (layout base)

**JavaScript**:
- **Vanilla JS**: ES6+ (sem frameworks)
- **Service Worker API**: Para PWA e cache
- **Push API**: Para notificações push
- **Fetch API**: Para requisições HTTP

**Estilização**:
- **CSS3**: Custom stylesheets
- **CSS Variables**: Para tematização
- **Flexbox & Grid**: Layout responsivo
- **Mobile-First Design**: Otimizado para dispositivos móveis

**PWA APIs**:
- **Service Worker API**: Offline support, push notifications
- **Cache API**: Estratégia de cache v4
- **Web App Manifest**: Installability
- **Notification API**: System notifications
- **Push Manager API**: Subscription management

---

### Banco de Dados (PostgreSQL via Supabase)

**Configuração**:
```javascript
// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});
```

**Tabelas**:
1. **users** - Informações de usuários e autenticação
2. **appointments** - Consultas médicas agendadas
3. **notifications** - Histórico de notificações
4. **push_subscriptions** - Subscrições de push notification

**Features**:
- Foreign Keys com CASCADE DELETE
- Indexes otimizados para queries frequentes
- Timestamps automáticos (created_at, updated_at)
- Boolean flags (lido para notificações)
- UNIQUE constraints (email, endpoint)

---

## Ambiente de Desenvolvimento

### Requisitos de Sistema

**Software Necessário**:
- Node.js v20+ (LTS recomendada)
- npm v10+ ou yarn v1.22+
- PostgreSQL client (opcional, para acesso direto ao DB)
- Git para versionamento
- Editor de código (VS Code recomendado)

**Extensões VS Code Recomendadas**:
- Handlebars
- PostgreSQL
- ESLint
- Prettier
- GitLens

### Variáveis de Ambiente

**Arquivo .env** (nunca commitar):
```env
# Servidor
PORT=3000
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Database (Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password

# Web Push (VAPID)
PUBLIC_VAPID_KEY=BErUUdx3ycEXpQh-BQVFUIUcknlK8TtWJtJF1VAqFvzV7H00tDloMnASIiucCayJlLFCRraYe3TYNAibBWZlTUI
PRIVATE_VAPID_KEY=your-private-vapid-key-here
VAPID_MAILTO=mailto:your-email@example.com
```

**Gerar VAPID Keys**:
```bash
node generate-vapid-keys.js
```

### Scripts de Desenvolvimento

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"No tests configured yet\"",
    "generate-vapid": "node generate-vapid-keys.js",
    "create-test-user": "node create-test-user.js"
  }
}
```

---

## Dependências do Projeto

### Dependencies (Produção)

```json
{
  "bcrypt": "^5.1.1",
  "dotenv": "^16.4.1",
  "express": "^4.18.2",
  "express-handlebars": "^7.1.2",
  "express-session": "^1.17.3",
  "multer": "^1.4.5-lts.1",
  "pg": "^8.11.3",
  "web-push": "^3.6.6"
}
```

### DevDependencies (Desenvolvimento)

```json
{
  "nodemon": "^3.0.3"
}
```

### Instalação

```bash
# Instalar todas as dependências
npm install

# Ou com yarn
yarn install
```

---

## Arquitetura de Camadas

### Camada de Apresentação (Views)
- **Tecnologia**: Handlebars templates
- **Localização**: `views/`
- **Responsabilidade**: Renderização HTML server-side
- **Padrões**: Layouts, partials, helpers

### Camada de Controle (Controllers)
- **Tecnologia**: Express.js route handlers
- **Localização**: `controllers/`
- **Responsabilidade**: Processar requisições HTTP, validar input
- **Padrões**: MVC controller pattern

### Camada de Serviço (Services)
- **Tecnologia**: Classes/funções JavaScript
- **Localização**: `services/`
- **Responsabilidade**: Lógica de negócio, integrações
- **Exemplo**: `notificationService.js` - envio de push notifications

### Camada de Dados (Database)
- **Tecnologia**: PostgreSQL via pg driver
- **Localização**: `config/db.js`
- **Responsabilidade**: Persistência, queries, transações
- **Padrões**: Connection pooling, prepared statements

### Camada de Roteamento (Routes)
- **Tecnologia**: Express Router
- **Localização**: `routes/`
- **Responsabilidade**: Mapeamento de URLs para controllers
- **Padrões**: RESTful routes, middleware chain

---

## PWA - Progressive Web App

### Service Worker

**Arquivo**: `public/service-worker.js`

**Funcionalidades**:
- Cache de assets estáticos (app shell)
- Network-first strategy para navegação
- Cache-first strategy para recursos estáticos
- Push event handler para notificações
- Notification click handler
- Cache versioning (v4)
- Limpeza automática de caches antigas

**Estratégias de Cache**:
```javascript
// Navigation requests - sempre buscar rede primeiro
if (event.request.mode === 'navigate') {
    return networkFirst(event);
}

// Static assets - cache primeiro
if (event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image') {
    return cacheFirst(event);
}

// API requests - sempre rede
if (event.request.url.includes('/api/')) {
    return networkOnly(event);
}
```

**Lifecycle**:
1. **Install**: Cacheia app shell e recursos críticos
2. **Activate**: Remove caches antigas, assume controle
3. **Fetch**: Intercepta requests, aplica estratégia de cache
4. **Push**: Recebe e exibe notificações push
5. **NotificationClick**: Gerencia cliques em notificações

### Web App Manifest

**Arquivo**: `public/manifest.json`

**Configuração**:
```json
{
  "name": "Agendamento de Consultas",
  "short_name": "Consultas",
  "description": "PWA para agendamento de consultas médicas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4A90E2",
  "orientation": "portrait-primary",
  "icons": [
    // 9 ícones de 48px a 512px
  ],
  "shortcuts": [
    {
      "name": "Nova Consulta",
      "url": "/nova-consulta",
      "icons": [...]
    },
    {
      "name": "Minhas Consultas",
      "url": "/consultas",
      "icons": [...]
    }
  ]
}
```

**Features**:
- Installable em home screen
- Standalone mode (sem browser UI)
- Shortcuts para ações rápidas
- Adaptive icons (maskable)
- Splash screen customizado

---

## Segurança

### Autenticação

**Sessões**:
- express-session com cookie httpOnly
- Session secret de 32+ caracteres
- 24 horas de validade
- Armazenamento server-side

**Passwords**:
- Bcrypt hashing com 10 salt rounds
- Nunca armazena senha em plaintext
- Hash one-way (não reversível)

### VAPID (Web Push)

**Autenticação**:
- Chaves públicas/privadas geradas localmente
- Private key nunca exposta ao frontend
- Public key incluída no frontend para subscription
- Mailto configurado para identificação

### Proteção de Rotas

**Middleware `isAuthenticated`**:
```javascript
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}
```

**Rotas Protegidas**:
- `/consultas/*` - Gerenciamento de consultas
- `/notificacoes/*` - Inbox de notificações
- `/perfil/*` - Perfil do usuário
- `/nova-consulta` - Criação de consultas

**Rotas Públicas**:
- `/login` - Login
- `/register` - Registro
- `/test-push` - Teste de notificações (dev only)
- `/test-info` - Info de subscrições (dev only)

### Validação de Input

**Server-side**:
- Validação de campos obrigatórios
- Sanitização de strings
- Type checking
- Prepared statements (SQL injection protection)

**Client-side**:
- HTML5 form validation (required, email, date)
- JavaScript validation antes de submit
- Feedback visual de erros

---

## Performance

### Database

**Connection Pooling**:
- Pool configurado com max 10 conexões
- Reuso de conexões
- Auto-cleanup de conexões idle

**Indexes**:
```sql
-- Otimização de queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lido ON notifications(lido);
CREATE INDEX idx_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
```

### Caching

**Service Worker**:
- Cache v4 com versionamento
- Pré-cache de app shell (10KB)
- Cache dinâmico de assets (limite 50MB)
- Estratégias diferenciadas por tipo de recurso

**Browser Cache**:
- Static assets com cache headers
- CSS/JS com hash de versão
- Imagens otimizadas

### Otimizações Frontend

**CSS**:
- Minificação (produção)
- Critical CSS inline
- Lazy loading de fontes

**JavaScript**:
- ES6+ (menor bundle size)
- Defer/async em scripts não-críticos
- Event delegation para performance

**Imagens**:
- PNG otimizados para ícones
- Lazy loading de imagens grandes
- Responsive images (srcset)

---

## Monitoramento e Logging

### Logs de Servidor

**Console Logs**:
```javascript
// Atividade de notificações
console.log('Push notification sent to user:', userId);

// Erros capturados
console.error('Error sending push:', error);

// Cleanup automático
console.log('Removed expired subscription:', subscriptionId);
```

### Métricas

**Client-side**:
- Service worker registration status
- Cache hit/miss rates
- Push subscription success rate
- Notification click-through rate

**Server-side**:
- Request/response times
- Database query times
- Push notification delivery rate
- Error rates por endpoint

---

## Testes

### Ferramentas de Teste

**Manual Testing**:
- Chrome DevTools (Application, Network, Console)
- Lighthouse PWA Audit
- ngrok para testes externos

**Ambientes de Teste**:
- Local: `http://localhost:3000`
- ngrok: `https://xxx.ngrok-free.dev`
- Produção: TBD

### Checklist de Testes

**PWA**:
- [ ] Service worker registrado
- [ ] Manifest válido
- [ ] Installable
- [ ] Funciona offline
- [ ] Push notifications funcionando

**Funcionalidades**:
- [ ] Login/Logout
- [ ] Criação de consulta
- [ ] Notificação recebida
- [ ] Inbox atualizado
- [ ] Upload de foto

---

## Deployment

### Requisitos de Produção

**Servidor**:
- Node.js v20+ instalado
- PM2 ou similar para process management
- HTTPS configurado (obrigatório para PWA)
- Nginx ou Apache como reverse proxy

**Banco de Dados**:
- PostgreSQL 15+ ou Supabase
- Backups automáticos configurados
- Connection pooling habilitado

**Variáveis de Ambiente**:
- Todas as variáveis do .env configuradas
- SESSION_SECRET forte (32+ chars)
- VAPID keys geradas e armazenadas

### Processo de Deploy

```bash
# 1. Instalar dependências
npm install --production

# 2. Rodar migrations (se houver)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_initial.sql

# 3. Iniciar servidor (com PM2)
pm2 start server.js --name pwa-consultas

# 4. Verificar status
pm2 status
pm2 logs pwa-consultas
```

### Configuração Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name consultas.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name consultas.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Considerações de Escalabilidade

### Horizontal Scaling

**Limitações Atuais**:
- Sessões armazenadas em memória (não compartilhadas)
- Upload de arquivos em filesystem local

**Melhorias Necessárias**:
- Redis para armazenamento de sessões compartilhado
- S3 ou similar para armazenamento de uploads
- Load balancer para distribuir tráfego

### Vertical Scaling

**Otimizações Possíveis**:
- Aumentar pool de conexões do database
- Adicionar mais memória para cache
- CPU adicional para processamento de notificações

---

## Futuras Melhorias Técnicas

### Backend
- [ ] Implementar TypeScript para type safety
- [ ] Adicionar testes unitários (Jest)
- [ ] Implementar rate limiting (express-rate-limit)
- [ ] Adicionar helmet.js para security headers
- [ ] Implementar CSRF protection

### Frontend
- [ ] Adicionar framework frontend (React/Vue) se necessário
- [ ] Implementar lazy loading de componentes
- [ ] Adicionar animações e transições
- [ ] Melhorar acessibilidade (ARIA labels, keyboard navigation)

### PWA
- [ ] Implementar background sync para ações offline
- [ ] Adicionar Web Share API
- [ ] Implementar geolocation para encontrar clínicas próximas
- [ ] Adicionar badging API para contador de notificações

### Database
- [ ] Implementar migrations automáticas
- [ ] Adicionar soft deletes
- [ ] Implementar audit log de alterações
- [ ] Adicionar full-text search

---

## Recursos e Documentação

### Documentação Oficial
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications/)

### Tutoriais Úteis
- [PWA Tutorial (Google)](https://developers.google.com/web/progressive-web-apps)
- [Web Push Notifications Tutorial](https://web.dev/notifications/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)

### Ferramentas
- [VAPID Key Generator](https://vapidkeys.com/)
- [Lighthouse PWA](https://developers.google.com/web/tools/lighthouse)
- [ngrok](https://ngrok.com/) - Tunneling para testes

---

**Última Revisão**: 2025-10-21
**Versão do Documento**: 2.0
**Mantido por**: Claude Code (Anthropic)
