# Integrações Externas

## 🔌 Visão Geral

Este documento descreve todas as integrações externas utilizadas no PWA Consultas, incluindo configuração, uso e melhores práticas.

## 🗄️ Banco de Dados - PostgreSQL via Supabase

### Configuração

**Arquivo**: `config/db.js`

**Provider**: Supabase (https://supabase.com)

**Implementação:**

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false  // Necessário para Supabase
  }
});

module.exports = pool;
```

### Variáveis de Ambiente

```env
DB_HOST=db.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
```

### Como Obter Credenciais Supabase

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie as credenciais de conexão:
   - Host
   - Database name
   - Port
   - User
   - Password

### Uso no Código

```javascript
const pool = require('../config/db');

// Query simples
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// Insert com RETURNING
const newAppointment = await pool.query(
  'INSERT INTO appointments (user_id, doctor_name, ...) VALUES ($1, $2, ...) RETURNING *',
  [userId, doctorName, ...]
);

// Update
await pool.query(
  'UPDATE appointments SET status = $1 WHERE id = $2',
  [newStatus, appointmentId]
);

// Delete
await pool.query('DELETE FROM subscriptions WHERE id = $1', [subscriptionId]);
```

### Boas Práticas

✅ **Faça:**
- Use sempre parameterized queries (`$1`, `$2`) para prevenir SQL injection
- Feche conexões com `pool.end()` ao encerrar o servidor
- Use transações para operações que precisam ser atômicas
- Crie índices em colunas frequentemente consultadas

❌ **Não faça:**
- Concatenar strings para criar queries
- Armazenar credenciais no código
- Fazer queries dentro de loops (use batch inserts)
- Ignorar erros de conexão

### Monitoramento

Acesse o dashboard do Supabase para:
- Ver queries em tempo real
- Monitorar uso de recursos
- Configurar backups automáticos
- Gerenciar permissões

---

## 🔔 Web Push Notifications - Web Push API

### Configuração

**Biblioteca**: `web-push` (npm package)

**Arquivo de Configuração**: `server.js`

```javascript
const webpush = require('web-push');

// Configurar VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);
```

### Variáveis de Ambiente

```env
PUBLIC_VAPID_KEY=BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PRIVATE_VAPID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_MAILTO=mailto:seu-email@exemplo.com
```

### Gerar VAPID Keys

**Script**: `generate-vapid-keys.js`

```javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

**Comando:**
```bash
node generate-vapid-keys.js
```

**Importante**:
- Gere as chaves **uma vez** e armazene no `.env`
- Não gere novas chaves após ter subscriptions ativas (elas ficarão inválidas)
- Mantenha a private key segura

### Fluxo de Inscrição (Cliente)

**Arquivo**: `public/js/notification-handler.js`

```javascript
// 1. Solicitar permissão
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  // 2. Obter service worker registration
  const registration = await navigator.serviceWorker.ready;

  // 3. Converter VAPID key de Base64 para Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 4. Inscrever para push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });

  // 5. Enviar subscription para servidor
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Armazenamento de Subscription (Servidor)

**Arquivo**: `controllers/notificationController.js`

```javascript
exports.subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.session.userId;

  // Extrair dados da subscription
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;

  // Verificar se já existe
  const existing = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1 AND endpoint = $2',
    [userId, endpoint]
  );

  if (existing.rows.length > 0) {
    // Atualizar
    await pool.query(
      'UPDATE subscriptions SET p256dh = $1, auth = $2 WHERE id = $3',
      [p256dh, auth, existing.rows[0].id]
    );
  } else {
    // Inserir nova
    await pool.query(
      'INSERT INTO subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, p256dh, auth]
    );
  }

  res.json({ success: true });
};
```

### Envio de Notificação (Servidor)

**Arquivo**: `services/notificationService.js`

```javascript
const webpush = require('web-push');

exports.sendPushNotification = async (userId, title, message) => {
  // 1. Salvar notificação no banco
  await pool.query(
    'INSERT INTO notifications (user_id, title, message, tipo, urgencia, lido) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, title, message, 'appointment', 'normal', false]
  );

  // 2. Buscar subscriptions do usuário
  const result = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  // 3. Criar payload
  const payload = JSON.stringify({
    title: title,
    body: message,
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: '/' }
  });

  // 4. Enviar para todas as subscriptions
  const sendPromises = result.rows.map(async (sub) => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      // Se 410 GONE, subscription expirada - remover do banco
      if (error.statusCode === 410) {
        await pool.query('DELETE FROM subscriptions WHERE id = $1', [sub.id]);
      }
    }
  });

  await Promise.allSettled(sendPromises);
};
```

### Recepção de Notificação (Service Worker)

**Arquivo**: `public/service-worker.js`

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: data.vibrate,
    data: data.data,
    requireInteraction: true  // Notificação não desaparece automaticamente
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### Troubleshooting

**Notificações não aparecem:**
1. Verificar se permissão foi concedida (`Notification.permission`)
2. Verificar se service worker está ativo
3. Verificar console do service worker (DevTools → Application → Service Workers)
4. Verificar se VAPID keys estão corretas

**Erro 401 Unauthorized:**
- VAPID keys incorretas ou não configuradas
- `VAPID_MAILTO` inválido (deve ser `mailto:email@exemplo.com`)

**Erro 410 Gone:**
- Subscription expirada (código já trata removendo do banco)
- Usuário desinstalou PWA ou revogou permissão

---

## 📦 FontAwesome - Biblioteca de Ícones

### Instalação

```bash
npm install @fortawesome/fontawesome-free
```

### Configuração

**Arquivo**: `server.js`

```javascript
app.use('/fontawesome', express.static('node_modules/@fortawesome/fontawesome-free'));
```

**Arquivo**: `views/layouts/main.hbs`

```html
<link rel="stylesheet" href="/fontawesome/css/all.min.css">
```

### Uso

```html
<!-- Ícone sólido -->
<i class="fas fa-calendar"></i>

<!-- Ícone regular -->
<i class="far fa-bell"></i>

<!-- Ícone com tamanho -->
<i class="fas fa-user fa-2x"></i>

<!-- Ícone com animação -->
<i class="fas fa-spinner fa-spin"></i>
```

### Ícones Usados no Projeto

```javascript
// Navegação
fa-home          // Home
fa-calendar      // Consultas
fa-bell          // Notificações
fa-user          // Perfil

// Consultas
fa-stethoscope   // Médico
fa-clock         // Hora
fa-map-marker-alt // Local

// Ações
fa-check         // Confirmar
fa-times         // Cancelar
fa-edit          // Editar
fa-trash         // Deletar

// Status
fa-check-circle  // Confirmado
fa-exclamation-circle // Aguardando
fa-times-circle  // Cancelado
```

---

## 🍬 SweetAlert2 - Alertas e Modais

### Instalação

```bash
npm install sweetalert2
```

### Configuração

**Arquivo**: `views/layouts/main.hbs`

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

### Uso Básico

**Arquivo**: `public/js/appointment-actions.js`

```javascript
// Alerta simples
Swal.fire('Sucesso!', 'Consulta confirmada', 'success');

// Confirmação
const result = await Swal.fire({
  title: 'Tem certeza?',
  text: 'Esta ação não pode ser desfeita',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sim, confirmar',
  cancelButtonText: 'Cancelar'
});

if (result.isConfirmed) {
  // Ação confirmada
}

// Toast (notificação pequena)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000
});

Toast.fire({
  icon: 'success',
  title: 'Login realizado com sucesso'
});
```

### Customização

**Arquivo**: `public/css/style.css`

```css
/* Customizar botões do SweetAlert2 */
.swal2-confirm {
  background-color: var(--primary-500) !important;
}

.swal2-cancel {
  background-color: var(--neutral-500) !important;
}
```

---

## 🔐 bcrypt - Criptografia de Senhas

### Instalação

```bash
npm install bcrypt
```

### Uso

**Arquivo**: `controllers/authController.js`

```javascript
const bcrypt = require('bcrypt');

// Hash de senha (ao criar usuário)
const password = 'senha123';
const hash = await bcrypt.hash(password, 10);  // 10 = salt rounds

await pool.query(
  'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
  [email, hash]
);

// Verificar senha (ao fazer login)
const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
const isValid = await bcrypt.compare(password, user.rows[0].password_hash);

if (isValid) {
  // Login bem-sucedido
} else {
  // Senha incorreta
}
```

### Salt Rounds

```javascript
// Menor segurança, mais rápido
await bcrypt.hash(password, 8);

// Padrão recomendado
await bcrypt.hash(password, 10);

// Maior segurança, mais lento
await bcrypt.hash(password, 12);
```

**Recomendação**: Use 10 salt rounds para balancear segurança e performance.

---

## 🍪 express-session - Gerenciamento de Sessões

### Instalação

```bash
npm install express-session
```

### Configuração

**Arquivo**: `server.js`

```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,  // String longa e aleatória
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // true em produção com HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7  // 7 dias
  }
}));
```

### Variável de Ambiente

```env
SESSION_SECRET=uma_string_muito_longa_e_aleatoria_para_seguranca
```

### Uso

```javascript
// Definir dados na sessão
req.session.userId = user.id;
req.session.userName = user.name;

// Ler dados da sessão
const userId = req.session.userId;

// Destruir sessão (logout)
req.session.destroy((err) => {
  if (err) {
    console.error(err);
  }
  res.redirect('/login');
});
```

### Middleware de Autenticação

```javascript
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();  // Usuário autenticado
  }
  res.redirect('/login');  // Não autenticado
};
```

---

## 📊 Resumo de Integrações

| Integração | Propósito | Configuração | Uso |
|------------|-----------|--------------|-----|
| **PostgreSQL/Supabase** | Banco de dados | `config/db.js` | Todos os controllers |
| **Web Push** | Notificações push | `server.js`, VAPID keys | `notificationService.js` |
| **FontAwesome** | Ícones | CDN no layout | Templates Handlebars |
| **SweetAlert2** | Alertas elegantes | CDN no layout | Scripts de interação |
| **bcrypt** | Hash de senhas | Controllers | `authController.js` |
| **express-session** | Sessões | `server.js` | Autenticação global |

---

**Próximos passos**: Consulte [API](./api.md) para documentação completa das rotas.
