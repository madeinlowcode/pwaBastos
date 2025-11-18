# Documentação da API

## 📡 Visão Geral

Este documento descreve todas as rotas e endpoints da API do PWA Consultas, incluindo autenticação, consultas, usuários e notificações.

## 🔐 Autenticação

Todas as rotas marcadas com 🔒 requerem autenticação via sessão.

## 📋 Índice de Rotas

### Autenticação
- [GET /login](#get-login) - Página de login
- [POST /api/login](#post-apilogin) - Processar login
- [GET /logout](#get-logout) - Logout
- [GET /esqueceu-senha](#get-esqueceu-senha) - Página de recuperação de senha
- [POST /api/password/reset](#post-apipasswordreset) - Solicitar reset de senha
- [POST /api/password/change](#post-apipasswordchange) 🔒 - Alterar senha

### Consultas
- [GET /](#get-) 🔒 - Dashboard principal
- [GET /consultas](#get-consultas) 🔒 - Lista de consultas
- [GET /add-appointment](#get-add-appointment) 🔒 - Formulário de nova consulta
- [POST /api/appointments/add](#post-apiappointmentsadd) 🔒 - Criar consulta
- [POST /api/consultas/acao](#post-apiconsultasacao) 🔒 - Ação em consulta

### Usuário
- [GET /perfil](#get-perfil) 🔒 - Página de perfil
- [POST /api/perfil/atualizar](#post-apiperfilatualizar) 🔒 - Atualizar perfil
- [GET /api/user/stats](#get-apiuserstats) 🔒 - Estatísticas do usuário

### Notificações
- [GET /notificacoes](#get-notificacoes) 🔒 - Página de notificações
- [POST /api/subscribe](#post-apisubscribe) 🔒 - Inscrever para push
- [POST /api/notificacoes/marcar-lida](#post-apinotificacoesmarcar-lida) 🔒 - Marcar como lida
- [POST /api/notificacoes/marcar-todas-lidas](#post-apinotificacoesmarcar-todas-lidas) 🔒 - Marcar todas como lidas
- [GET /test-notification](#get-test-notification) 🔒 - Enviar notificação de teste

---

## 🔐 Rotas de Autenticação

### GET /login

Renderiza a página de login.

**Autenticação**: Não requerida

**Resposta**: HTML (página de login)

**Layout**: Sem layout (standalone)

**Implementação**:
```javascript
// routes/authRoutes.js
router.get('/login', authController.renderLoginPage);

// controllers/authController.js
exports.renderLoginPage = (req, res) => {
  res.render('login', { layout: false });
};
```

**Template**: `views/login.hbs`

---

### POST /api/login

Processa o login do usuário.

**Autenticação**: Não requerida

**Body**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Resposta de Erro** (200):
```json
{
  "success": false,
  "message": "Usuário não encontrado"
}
```
ou
```json
{
  "success": false,
  "message": "Senha incorreta"
}
```

**Implementação**:
```javascript
// routes/authRoutes.js
router.post('/api/login', authController.loginUser);

// controllers/authController.js
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
```

**Efeitos Colaterais**:
- Cria sessão com `userId`, `userName`, `userEmail`

---

### GET /logout

Realiza logout do usuário.

**Autenticação**: Não requerida (mas funciona se autenticado)

**Resposta**: Redirect para `/login`

**Implementação**:
```javascript
// routes/authRoutes.js
router.get('/logout', authController.logoutUser);

// controllers/authController.js
exports.logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
    }
    res.redirect('/login');
  });
};
```

**Efeitos Colaterais**:
- Destroi a sessão do usuário

---

### GET /esqueceu-senha

Renderiza página de recuperação de senha.

**Autenticação**: Não requerida

**Resposta**: HTML (página de recuperação)

**Implementação**:
```javascript
// routes/authRoutes.js
router.get('/esqueceu-senha', authController.renderForgotPasswordPage);

// controllers/authController.js
exports.renderForgotPasswordPage = (req, res) => {
  res.render('forgot-password', { layout: false });
};
```

**Template**: `views/forgot-password.hbs`

---

### POST /api/password/reset

Solicita reset de senha (placeholder - envio de email não implementado).

**Autenticação**: Não requerida

**Body**:
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta** (200):
```json
{
  "success": true,
  "message": "Email de recuperação enviado (placeholder)"
}
```

**Implementação**:
```javascript
// routes/authRoutes.js
router.post('/api/password/reset', authController.handlePasswordResetRequest);

// controllers/authController.js
exports.handlePasswordResetRequest = async (req, res) => {
  const { email } = req.body;
  // TODO: Implementar envio de email com link de reset
  res.json({
    success: true,
    message: 'Email de recuperação enviado (placeholder)'
  });
};
```

---

### POST /api/password/change

Altera a senha do usuário autenticado.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "currentPassword": "senhaAtual123",
  "newPassword": "novaSenha456"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Resposta de Erro** (200):
```json
{
  "success": false,
  "message": "Senha atual incorreta"
}
```
ou
```json
{
  "success": false,
  "message": "A nova senha deve ter pelo menos 8 caracteres"
}
```

**Implementação**:
```javascript
// routes/authRoutes.js
router.post('/api/password/change', authController.isAuthenticated, authController.changePassword);

// controllers/authController.js
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (newPassword.length < 8) {
    return res.json({ success: false, message: 'A nova senha deve ter pelo menos 8 caracteres' });
  }

  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

  if (!isValid) {
    return res.json({ success: false, message: 'Senha atual incorreta' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

  res.json({ success: true });
};
```

---

## 🏥 Rotas de Consultas

### GET /

Dashboard principal com próximas consultas.

**Autenticação**: 🔒 Requerida

**Resposta**: HTML (página home)

**Dados da Página**:
```javascript
{
  userName: "Nome do Usuário",
  userProfilePicture: "/uploads/foto.jpg",
  appointments: [
    {
      id: 1,
      doctor_name: "Dr. João Silva",
      specialty: "Cardiologia",
      appointment_date: "2025-01-25",
      appointment_time: "14:00",
      location: "Hospital Central",
      status: "Aguardando"
    }
  ]
}
```

**Implementação**:
```javascript
// routes/appointmentRoutes.js
router.get('/', authController.isAuthenticated, appointmentController.renderHomePage);

// controllers/appointmentController.js
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
```

**Template**: `views/home.hbs`

---

### GET /consultas

Lista todas as consultas confirmadas.

**Autenticação**: 🔒 Requerida

**Resposta**: HTML (página de consultas)

**Dados da Página**:
```javascript
{
  userName: "Nome do Usuário",
  userProfilePicture: "/uploads/foto.jpg",
  appointments: [/* array de consultas confirmadas */]
}
```

**Implementação**:
```javascript
// routes/appointmentRoutes.js
router.get('/consultas', authController.isAuthenticated, appointmentController.renderAppointmentsPage);

// controllers/appointmentController.js
exports.renderAppointmentsPage = async (req, res) => {
  const userId = req.session.userId;

  const appointments = await pool.query(
    'SELECT * FROM appointments WHERE user_id = $1 AND status = $2 ORDER BY appointment_date ASC',
    [userId, 'Confirmada']
  );

  const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  res.render('consultas', {
    userName: req.session.userName,
    userProfilePicture: user.rows[0].profile_picture_url || '/images/default-avatar.png',
    appointments: appointments.rows
  });
};
```

**Template**: `views/consultas.hbs`

---

### GET /add-appointment

Renderiza formulário de nova consulta.

**Autenticação**: 🔒 Requerida

**Resposta**: HTML (formulário de consulta)

**Implementação**:
```javascript
// routes/appointmentRoutes.js
router.get('/add-appointment', authController.isAuthenticated, appointmentController.renderAddAppointmentPage);

// controllers/appointmentController.js
exports.renderAddAppointmentPage = async (req, res) => {
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);

  res.render('add-appointment', {
    userName: req.session.userName,
    userProfilePicture: user.rows[0].profile_picture_url || '/images/default-avatar.png'
  });
};
```

**Template**: `views/add-appointment.hbs`

---

### POST /api/appointments/add

Cria uma nova consulta.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "doctorName": "Dr. João Silva",
  "specialty": "Cardiologia",
  "date": "2025-01-25",
  "time": "14:00",
  "location": "Hospital Central"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "appointment": {
    "id": 10,
    "user_id": 1,
    "doctor_name": "Dr. João Silva",
    "specialty": "Cardiologia",
    "appointment_date": "2025-01-25",
    "appointment_time": "14:00",
    "location": "Hospital Central",
    "status": "Aguardando"
  }
}
```

**Implementação**:
```javascript
// routes/appointmentRoutes.js
router.post('/api/appointments/add', authController.isAuthenticated, appointmentController.addAppointment);

// controllers/appointmentController.js
exports.addAppointment = async (req, res) => {
  const { doctorName, specialty, date, time, location } = req.body;
  const userId = req.session.userId;

  const result = await pool.query(
    'INSERT INTO appointments (user_id, doctor_name, specialty, appointment_date, appointment_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, doctorName, specialty, date, time, location, 'Aguardando']
  );

  // Enviar notificação push
  await notificationService.sendPushNotification(
    userId,
    'Nova consulta agendada',
    `Consulta com ${doctorName} em ${date} às ${time}`
  );

  res.json({ success: true, appointment: result.rows[0] });
};
```

**Efeitos Colaterais**:
- Cria registro no banco de dados
- Envia notificação push ao usuário

---

### POST /api/consultas/acao

Atualiza o status de uma consulta.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "id": 10,
  "acao": "confirmar"  // "confirmar", "cancelar", "desmarcar"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Ações disponíveis**:
- `"confirmar"` → Muda status para "Confirmada"
- `"cancelar"` → Muda status para "Cancelada"
- `"desmarcar"` → Muda status para "Aguardando"

**Implementação**:
```javascript
// routes/appointmentRoutes.js
router.post('/api/consultas/acao', authController.isAuthenticated, appointmentController.handleAppointmentAction);

// controllers/appointmentController.js
exports.handleAppointmentAction = async (req, res) => {
  const { id, acao } = req.body;
  const userId = req.session.userId;

  // Mapear ação para status
  let newStatus;
  if (acao === 'confirmar') newStatus = 'Confirmada';
  if (acao === 'cancelar') newStatus = 'Cancelada';
  if (acao === 'desmarcar') newStatus = 'Aguardando';

  // Buscar consulta
  const appointment = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);

  // Atualizar status
  await pool.query(
    'UPDATE appointments SET status = $1 WHERE id = $2',
    [newStatus, id]
  );

  // Enviar notificação
  const messages = {
    'confirmar': 'Consulta confirmada',
    'cancelar': 'Consulta cancelada',
    'desmarcar': 'Consulta desmarcada'
  };

  await notificationService.sendPushNotification(
    userId,
    messages[acao],
    `Consulta com ${appointment.rows[0].doctor_name}`
  );

  res.json({ success: true });
};
```

**Efeitos Colaterais**:
- Atualiza status no banco de dados
- Envia notificação push

---

## 👤 Rotas de Usuário

### GET /perfil

Renderiza página de perfil do usuário.

**Autenticação**: 🔒 Requerida

**Resposta**: HTML (página de perfil)

**Dados da Página**:
```javascript
{
  userName: "Nome do Usuário",
  userEmail: "usuario@exemplo.com",
  userProfilePicture: "/uploads/foto.jpg"
}
```

**Implementação**:
```javascript
// routes/userRoutes.js
router.get('/perfil', authController.isAuthenticated, userController.renderProfilePage);

// controllers/userController.js
exports.renderProfilePage = async (req, res) => {
  const userId = req.session.userId;
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  res.render('perfil', {
    userName: user.rows[0].name,
    userEmail: user.rows[0].email,
    userProfilePicture: user.rows[0].profile_picture_url || '/images/default-avatar.png'
  });
};
```

**Template**: `views/perfil.hbs`

---

### POST /api/perfil/atualizar

Atualiza dados do perfil do usuário.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "name": "Novo Nome",
  "email": "novoemail@exemplo.com",
  "profilePictureUrl": "/uploads/nova-foto.jpg"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Implementação**:
```javascript
// routes/userRoutes.js
router.post('/api/perfil/atualizar', authController.isAuthenticated, userController.updateUserProfile);

// controllers/userController.js
exports.updateUserProfile = async (req, res) => {
  const { name, email, profilePictureUrl } = req.body;
  const userId = req.session.userId;

  await pool.query(
    'UPDATE users SET name = $1, email = $2, profile_picture_url = $3 WHERE id = $4',
    [name, email, profilePictureUrl, userId]
  );

  // Atualizar sessão
  req.session.userName = name;
  req.session.userEmail = email;

  res.json({ success: true });
};
```

**Efeitos Colaterais**:
- Atualiza banco de dados
- Atualiza dados na sessão

---

### GET /api/user/stats

Retorna estatísticas do usuário.

**Autenticação**: 🔒 Requerida

**Resposta de Sucesso** (200):
```json
{
  "appointmentCount": 5,
  "unreadNotifications": 3,
  "healthScore": 100
}
```

**Implementação**:
```javascript
// routes/userRoutes.js
router.get('/api/user/stats', authController.isAuthenticated, userController.getUserStats);

// controllers/userController.js
exports.getUserStats = async (req, res) => {
  const userId = req.session.userId;

  const appointmentCount = await pool.query(
    'SELECT COUNT(*) FROM appointments WHERE user_id = $1',
    [userId]
  );

  const unreadNotifications = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND lido = false',
    [userId]
  );

  res.json({
    appointmentCount: parseInt(appointmentCount.rows[0].count),
    unreadNotifications: parseInt(unreadNotifications.rows[0].count),
    healthScore: 100  // Mock - implementar lógica futura
  });
};
```

---

## 🔔 Rotas de Notificações

### GET /notificacoes

Renderiza página de notificações.

**Autenticação**: 🔒 Requerida

**Resposta**: HTML (página de notificações)

**Dados da Página**:
```javascript
{
  userName: "Nome do Usuário",
  userProfilePicture: "/uploads/foto.jpg",
  notifications: [
    {
      id: 1,
      title: "Consulta confirmada",
      message: "Sua consulta foi confirmada",
      tipo: "appointment",
      urgencia: "normal",
      lido: false,
      sent_at: "2025-01-20 10:30:00"
    }
  ],
  hasPushSubscription: true
}
```

**Implementação**:
```javascript
// routes/notificationRoutes.js
router.get('/notificacoes', authController.isAuthenticated, notificationController.renderNotificationsPage);

// controllers/notificationController.js
exports.renderNotificationsPage = async (req, res) => {
  const userId = req.session.userId;

  const notifications = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC',
    [userId]
  );

  const subscriptions = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  res.render('notificacoes', {
    userName: req.session.userName,
    userProfilePicture: user.rows[0].profile_picture_url || '/images/default-avatar.png',
    notifications: notifications.rows,
    hasPushSubscription: subscriptions.rows.length > 0
  });
};
```

**Template**: `views/notificacoes.hbs`

---

### POST /api/subscribe

Registra inscrição para notificações push.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BHx...",
    "auth": "7s..."
  }
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Implementação**:
```javascript
// routes/notificationRoutes.js
router.post('/api/subscribe', authController.isAuthenticated, notificationController.subscribeToPush);

// controllers/notificationController.js
exports.subscribeToPush = async (req, res) => {
  const subscription = req.body;
  const userId = req.session.userId;

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
    // Inserir
    await pool.query(
      'INSERT INTO subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, p256dh, auth]
    );
  }

  res.json({ success: true });
};
```

**Efeitos Colaterais**:
- Cria ou atualiza subscription no banco

---

### POST /api/notificacoes/marcar-lida

Marca uma notificação como lida.

**Autenticação**: 🔒 Requerida

**Body**:
```json
{
  "id": 5
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Implementação**:
```javascript
// routes/notificationRoutes.js
router.post('/api/notificacoes/marcar-lida', authController.isAuthenticated, notificationController.markNotificationAsRead);

// controllers/notificationController.js
exports.markNotificationAsRead = async (req, res) => {
  const { id } = req.body;

  await pool.query(
    'UPDATE notifications SET lido = true WHERE id = $1',
    [id]
  );

  res.json({ success: true });
};
```

---

### POST /api/notificacoes/marcar-todas-lidas

Marca todas as notificações como lidas.

**Autenticação**: 🔒 Requerida

**Body**: Vazio

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Implementação**:
```javascript
// routes/notificationRoutes.js
router.post('/api/notificacoes/marcar-todas-lidas', authController.isAuthenticated, notificationController.markAllNotificationsAsRead);

// controllers/notificationController.js
exports.markAllNotificationsAsRead = async (req, res) => {
  const userId = req.session.userId;

  await pool.query(
    'UPDATE notifications SET lido = true WHERE user_id = $1',
    [userId]
  );

  res.json({ success: true });
};
```

---

### GET /test-notification

Envia notificação de teste (para desenvolvimento).

**Autenticação**: 🔒 Requerida

**Resposta**: Redirect para `/notificacoes`

**Implementação**:
```javascript
// routes/notificationRoutes.js
router.get('/test-notification', authController.isAuthenticated, notificationController.sendTestNotification);

// controllers/notificationController.js
exports.sendTestNotification = async (req, res) => {
  const userId = req.session.userId;

  await notificationService.sendPushNotification(
    userId,
    'Notificação de Teste',
    'Esta é uma notificação de teste do sistema'
  );

  res.redirect('/notificacoes');
};
```

**Efeitos Colaterais**:
- Envia notificação push de teste

---

## 📊 Códigos de Status HTTP

| Código | Significado | Uso no Projeto |
|--------|-------------|----------------|
| **200** | OK | Todas as respostas de sucesso (JSON e HTML) |
| **302** | Found (Redirect) | Logout, redirects após ações |
| **404** | Not Found | Rotas não encontradas (Express padrão) |
| **500** | Internal Server Error | Erros não tratados (Express padrão) |

**Nota**: O projeto retorna `200` mesmo em erros de validação, com `success: false` no JSON.

---

## 🔒 Middleware de Autenticação

**Arquivo**: `controllers/authController.js`

```javascript
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};
```

**Uso**:
```javascript
router.get('/rota-protegida', authController.isAuthenticated, controller.funcao);
```

---

## 📝 Exemplos de Uso com Fetch API

### Login

```javascript
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});

const data = await response.json();
if (data.success) {
  window.location.href = '/';
}
```

### Criar Consulta

```javascript
const response = await fetch('/api/appointments/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doctorName: 'Dr. João Silva',
    specialty: 'Cardiologia',
    date: '2025-01-25',
    time: '14:00',
    location: 'Hospital Central'
  })
});

const data = await response.json();
console.log('Consulta criada:', data.appointment);
```

### Confirmar Consulta

```javascript
const response = await fetch('/api/consultas/acao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 10,
    acao: 'confirmar'
  })
});

const data = await response.json();
if (data.success) {
  location.reload();
}
```

---

**Próximos passos**: Consulte [Banco de Dados](./banco-de-dados.md) para entender o esquema completo.
