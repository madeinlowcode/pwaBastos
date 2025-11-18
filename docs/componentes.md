# Componentes do Sistema

## 🧩 Visão Geral

Este documento descreve todos os componentes frontend e backend do PWA Consultas, incluindo suas responsabilidades, dependências e interfaces.

## 📱 Componentes Frontend

### 1. Service Worker

**Arquivo**: `public/service-worker.js`

**Responsabilidade**: Gerenciar cache, requisições offline e notificações push

**Funcionalidades:**

```javascript
// Cache Configuration
const CACHE_NAME = 'pwa-consultas-magic-ui-v1';
const urlsToCache = [
  '/',
  '/login',
  '/consultas',
  '/notificacoes',
  '/perfil',
  '/css/style.css',
  '/css/magic-ui-system.css',
  '/js/service-worker-register.js',
  '/manifest.json'
];
```

**Eventos:**

1. **`install`** - Pré-cache de recursos essenciais
   ```javascript
   self.addEventListener('install', event => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => cache.addAll(urlsToCache))
     );
   });
   ```

2. **`activate`** - Limpeza de caches antigos
   ```javascript
   self.addEventListener('activate', event => {
     event.waitUntil(
       caches.keys().then(cacheNames => {
         return Promise.all(
           cacheNames.map(cacheName => {
             if (cacheName !== CACHE_NAME) {
               return caches.delete(cacheName);
             }
           })
         );
       })
     );
   });
   ```

3. **`fetch`** - Estratégias de cache
   - **Logout**: Sempre network (bypass cache)
   - **Navegação**: Network-first com fallback para cache
   - **Assets**: Cache-first com fallback para network

4. **`push`** - Recebe notificações push
   ```javascript
   self.addEventListener('push', event => {
     const data = event.data.json();
     self.registration.showNotification(data.title, {
       body: data.body,
       icon: '/images/icon-192x192.png',
       badge: '/images/badge-72x72.png'
     });
   });
   ```

5. **`notificationclick`** - Abre URL ao clicar na notificação

**Referenciado por**: `service-worker-register.js`

---

### 2. Notification Handler

**Arquivo**: `public/js/notification-handler.js`

**Responsabilidade**: Gerenciar inscrições de notificação push

**Funções Principais:**

```javascript
// Solicitar permissão de notificação
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await subscribeUser();
  }
}

// Inscrever usuário para push
async function subscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });

  // Enviar subscription para servidor
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Dependências:**
- Service Worker registrado
- VAPID public key (da meta tag no HTML)

**Usado em**: Todas as páginas autenticadas

---

### 3. Appointment Actions

**Arquivo**: `public/js/appointment-actions.js`

**Responsabilidade**: Gerenciar ações em consultas (confirmar, cancelar, desmarcar)

**Event Listeners:**

```javascript
// Confirmar consulta
document.querySelectorAll('.btn-confirmar').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const appointmentId = e.target.dataset.id;
    const result = await Swal.fire({
      title: 'Confirmar consulta?',
      icon: 'question',
      showCancelButton: true
    });

    if (result.isConfirmed) {
      await updateAppointmentStatus(appointmentId, 'confirmar');
    }
  });
});
```

**Funções:**

```javascript
async function updateAppointmentStatus(id, action) {
  const response = await fetch('/api/consultas/acao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, acao: action })
  });

  if (response.ok) {
    Swal.fire('Sucesso!', 'Consulta atualizada', 'success');
    location.reload();
  }
}
```

**Dependências:**
- SweetAlert2
- Cards de consulta com data-id

**Usado em**: `home.hbs`, `consultas.hbs`

---

### 4. Magic UI

**Arquivo**: `public/js/magic-ui.js`

**Responsabilidade**: Efeitos visuais e animações

**Funcionalidades:**

1. **Card Hover Effects**
   ```javascript
   document.querySelectorAll('.magic-card').forEach(card => {
     card.addEventListener('mouseenter', () => {
       card.style.transform = 'translateY(-4px) scale(1.02)';
     });
   });
   ```

2. **Active Navigation**
   ```javascript
   const currentPage = window.location.pathname;
   document.querySelectorAll('.nav-item').forEach(item => {
     if (item.href.includes(currentPage)) {
       item.classList.add('active');
     }
   });
   ```

3. **Click Ripple Effect**
   ```javascript
   document.querySelectorAll('.btn').forEach(btn => {
     btn.addEventListener('click', createRipple);
   });
   ```

4. **Scroll Animations**
   ```javascript
   const observer = new IntersectionObserver(entries => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         entry.target.classList.add('fade-in');
       }
     });
   });
   ```

**Usado em**: Todas as páginas

---

### 5. Login Handler

**Arquivo**: `public/js/login.js`

**Responsabilidade**: Autenticação de usuários

**Formulário:**

```javascript
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Login realizado!',
        timer: 1500
      });
      window.location.href = '/';
    } else {
      Swal.fire('Erro', data.message, 'error');
    }
  } catch (error) {
    Swal.fire('Erro', 'Erro ao fazer login', 'error');
  }
});
```

**Usado em**: `login.hbs`

---

### 6. Navigation Handler

**Arquivo**: `public/js/navigation.js`

**Responsabilidade**: Navegação do footer

**Implementação:**

```javascript
document.querySelectorAll('.footer-nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    const destination = e.currentTarget.dataset.page;
    window.location.href = destination;
  });
});
```

**Usado em**: `partials/footer.hbs`

---

## 🎨 Componentes de Estilo

### 1. Magic UI Design System

**Arquivo**: `public/css/magic-ui-system.css`

**Responsabilidade**: Variáveis CSS e fundação do design system

**CSS Custom Properties:**

```css
:root {
  /* Cores Primárias */
  --primary-50: #e3f2fd;
  --primary-100: #bbdefb;
  --primary-500: #2196f3;
  --primary-900: #0d47a1;

  /* Cores de Saúde */
  --health-green: #4caf50;
  --health-red: #f44336;
  --health-yellow: #ffc107;

  /* Cores Semânticas */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;

  /* Escala de Cinzas */
  --neutral-50: #fafafa;
  --neutral-900: #212121;

  /* Espaçamento */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
}
```

**Usado em**: Todos os arquivos CSS

---

### 2. Magic Card

**Arquivo**: `public/css/magic-card.css`

**Responsabilidade**: Estilização de cards

**Classes:**

```css
.magic-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: var(--space-4);
  transition: all 0.3s ease;
}

.magic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

**Usado em**: Cards de consultas, notificações, perfil

---

## 🖼️ Componentes Handlebars

### 1. Header Partial

**Arquivo**: `views/partials/header.hbs`

**Responsabilidade**: Cabeçalho com informações do usuário

**Estrutura:**

```handlebars
<header class="app-header">
  <div class="header-left">
    <h1 class="app-title">PWA Consultas</h1>
  </div>
  <div class="header-right">
    <span class="user-name">{{userName}}</span>
    <img src="{{userProfilePicture}}" alt="Perfil" class="user-avatar">
  </div>
</header>
```

**Props:**
- `userName` (String): Nome do usuário
- `userProfilePicture` (String): URL da foto

**Usado em**: `layouts/main.hbs`

---

### 2. Footer Partial

**Arquivo**: `views/partials/footer.hbs`

**Responsabilidade**: Navegação inferior

**Estrutura:**

```handlebars
<footer class="app-footer">
  <nav class="footer-nav">
    <a href="/" class="footer-nav-item">
      <i class="fas fa-home"></i>
      <span>Home</span>
    </a>
    <a href="/consultas" class="footer-nav-item">
      <i class="fas fa-calendar"></i>
      <span>Consultas</span>
    </a>
    <a href="/notificacoes" class="footer-nav-item">
      <i class="fas fa-bell"></i>
      <span>Notificações</span>
    </a>
    <a href="/perfil" class="footer-nav-item">
      <i class="fas fa-user"></i>
      <span>Perfil</span>
    </a>
  </nav>
</footer>
```

**Usado em**: `layouts/main.hbs`

---

### 3. Consulta Card Partial

**Arquivo**: `views/partials/consultaCard.hbs`

**Responsabilidade**: Card individual de consulta

**Estrutura:**

```handlebars
<div class="magic-card consulta-card">
  <div class="card-header">
    <h3>{{doctor_name}}</h3>
    <span class="specialty-badge">{{specialty}}</span>
  </div>
  <div class="card-body">
    <p class="appointment-date">
      <i class="fas fa-calendar"></i>
      {{formatDate appointment_date}}
    </p>
    <p class="appointment-time">
      <i class="fas fa-clock"></i>
      {{appointment_time}}
    </p>
    <p class="appointment-location">
      <i class="fas fa-map-marker-alt"></i>
      {{location}}
    </p>
  </div>
  <div class="card-footer">
    {{#eq status "Aguardando"}}
      <button class="btn btn-confirmar" data-id="{{id}}">Confirmar</button>
      <button class="btn btn-cancelar" data-id="{{id}}">Cancelar</button>
    {{/eq}}
    {{#eq status "Confirmada"}}
      <button class="btn btn-desmarcar" data-id="{{id}}">Desmarcar</button>
    {{/eq}}
  </div>
</div>
```

**Props:**
- `id` (Number): ID da consulta
- `doctor_name` (String): Nome do médico
- `specialty` (String): Especialidade
- `appointment_date` (Date): Data
- `appointment_time` (String): Hora
- `location` (String): Local
- `status` (String): Status (Aguardando, Confirmada, Cancelada)

**Usado em**: `home.hbs`, `consultas.hbs`

---

### 4. Notificação Item Partial

**Arquivo**: `views/partials/notificacaoItem.hbs`

**Responsabilidade**: Item individual de notificação

**Estrutura:**

```handlebars
<div class="notification-item {{#unless lido}}unread{{/unless}}">
  <div class="notification-icon">
    <i class="fas fa-bell"></i>
  </div>
  <div class="notification-content">
    <h4>{{title}}</h4>
    <p>{{message}}</p>
    <span class="notification-time">{{sent_at}}</span>
  </div>
  {{#unless lido}}
    <button class="btn-mark-read" data-id="{{id}}">
      <i class="fas fa-check"></i>
    </button>
  {{/unless}}
</div>
```

**Props:**
- `id` (Number): ID da notificação
- `title` (String): Título
- `message` (String): Mensagem
- `lido` (Boolean): Se foi lida
- `sent_at` (Date): Data de envio
- `tipo` (String): Tipo (appointment, system, etc.)
- `urgencia` (String): Nível de urgência

**Usado em**: `notificacoes.hbs`

---

## ⚙️ Componentes Backend

### 1. Auth Controller

**Arquivo**: `controllers/authController.js`

**Responsabilidade**: Autenticação e autorização

**Funções Exportadas:**

```javascript
// Middleware de autenticação
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Renderizar página de login
exports.renderLoginPage = (req, res) => {
  res.render('login', { layout: false });
};

// Processar login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Usuário não encontrado' });
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (isValid) {
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Senha incorreta' });
  }
};

// Logout
exports.logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

// Mudar senha
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  // Validar senha atual
  const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const isValid = await bcrypt.compare(currentPassword, user.rows[0].password_hash);

  if (!isValid) {
    return res.json({ success: false, message: 'Senha atual incorreta' });
  }

  // Atualizar senha
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

  res.json({ success: true });
};
```

**Dependências:**
- `bcrypt` - Hashing de senhas
- `pool` (db.js) - Conexão com banco
- `express-session` - Sessões

**Usado em**: `routes/authRoutes.js`

---

### 2. Appointment Controller

**Arquivo**: `controllers/appointmentController.js`

**Responsabilidade**: CRUD de consultas

**Funções Exportadas:**

```javascript
// Renderizar home com próximas consultas
exports.renderHomePage = async (req, res) => {
  const userId = req.session.userId;

  const appointments = await pool.query(
    'SELECT * FROM appointments WHERE user_id = $1 AND status != $2 ORDER BY appointment_date ASC',
    [userId, 'Cancelada']
  );

  const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  res.render('home', {
    userName: req.session.userName,
    userProfilePicture: user.rows[0].profile_picture_url || '/images/default-avatar.png',
    appointments: appointments.rows
  });
};

// Adicionar nova consulta
exports.addAppointment = async (req, res) => {
  const { doctorName, specialty, date, time, location } = req.body;
  const userId = req.session.userId;

  const result = await pool.query(
    'INSERT INTO appointments (user_id, doctor_name, specialty, appointment_date, appointment_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, doctorName, specialty, date, time, location, 'Aguardando']
  );

  // Enviar notificação
  await notificationService.sendPushNotification(
    userId,
    'Nova consulta agendada',
    `Consulta com ${doctorName} em ${date} às ${time}`
  );

  res.json({ success: true, appointment: result.rows[0] });
};

// Atualizar status da consulta
exports.handleAppointmentAction = async (req, res) => {
  const { id, acao } = req.body;

  let newStatus;
  if (acao === 'confirmar') newStatus = 'Confirmada';
  if (acao === 'cancelar') newStatus = 'Cancelada';
  if (acao === 'desmarcar') newStatus = 'Aguardando';

  await pool.query(
    'UPDATE appointments SET status = $1 WHERE id = $2',
    [newStatus, id]
  );

  res.json({ success: true });
};
```

**Dependências:**
- `pool` (db.js)
- `notificationService`

**Usado em**: `routes/appointmentRoutes.js`

---

### 3. Notification Service

**Arquivo**: `services/notificationService.js`

**Responsabilidade**: Envio de notificações push

**Função Principal:**

```javascript
const webpush = require('web-push');
const pool = require('../config/db');

exports.sendPushNotification = async (userId, title, message) => {
  // Salvar no banco
  await pool.query(
    'INSERT INTO notifications (user_id, title, message, tipo, urgencia, lido) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, title, message, 'appointment', 'normal', false]
  );

  // Buscar subscriptions do usuário
  const result = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  // Payload da notificação
  const payload = JSON.stringify({
    title,
    body: message,
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png'
  });

  // Enviar para todas as subscriptions
  const promises = result.rows.map(sub => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    return webpush.sendNotification(subscription, payload)
      .catch(err => {
        // Se 410 GONE, remover subscription
        if (err.statusCode === 410) {
          pool.query('DELETE FROM subscriptions WHERE id = $1', [sub.id]);
        }
      });
  });

  await Promise.allSettled(promises);
};
```

**Dependências:**
- `web-push`
- `pool` (db.js)

**Usado em**: Todos os controllers que enviam notificações

---

## 🔗 Dependências entre Componentes

```
Service Worker
├── Usado por: service-worker-register.js
└── Depende de: manifest.json

Notification Handler
├── Usado por: Todas as páginas autenticadas
└── Depende de: Service Worker, VAPID key

Appointment Actions
├── Usado por: home.hbs, consultas.hbs
└── Depende de: SweetAlert2, API endpoints

Magic UI
├── Usado por: Todas as páginas
└── Depende de: magic-ui-system.css

Auth Controller
├── Usado por: authRoutes.js
└── Depende de: bcrypt, pool, express-session

Appointment Controller
├── Usado por: appointmentRoutes.js
└── Depende de: pool, notificationService

Notification Service
├── Usado por: appointmentController, notificationController
└── Depende de: web-push, pool
```

---

**Próximos passos**: Consulte [Integrações](./integracoes.md) para entender as integrações externas.
