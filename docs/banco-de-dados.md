# Banco de Dados

## 🗄️ Visão Geral

Este documento descreve o esquema completo do banco de dados PostgreSQL do PWA Consultas, incluindo tabelas, relacionamentos, índices e queries comuns.

## 📊 Diagrama de Relacionamentos (ERD)

```
┌─────────────────────┐
│       users         │
│─────────────────────│
│ id (PK)             │
│ name                │
│ email (UNIQUE)      │
│ password_hash       │
│ profile_picture_url │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────────┐          ┌─────────────────────┐
│   appointments      │          │   notifications     │
│─────────────────────│          │─────────────────────│
│ id (PK)             │          │ id (PK)             │
│ user_id (FK)        │          │ user_id (FK)        │
│ doctor_name         │          │ title               │
│ specialty           │          │ message             │
│ appointment_date    │          │ tipo                │
│ appointment_time    │          │ urgencia            │
│ location            │          │ lido                │
│ status              │          │ sent_at             │
│ created_at          │          └─────────────────────┘
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│   subscriptions     │
│─────────────────────│
│ id (PK)             │
│ user_id (FK)        │
│ endpoint (UNIQUE)   │
│ p256dh              │
│ auth                │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## 📋 Tabelas

### 1. users

Armazena informações dos usuários do sistema.

**Definição SQL:**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Colunas:**

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | SERIAL | Identificador único | PRIMARY KEY, AUTO INCREMENT |
| `name` | VARCHAR(255) | Nome completo do usuário | NOT NULL |
| `email` | VARCHAR(255) | Email para login | NOT NULL, UNIQUE |
| `password_hash` | TEXT | Hash bcrypt da senha | NOT NULL |
| `profile_picture_url` | TEXT | URL da foto de perfil | NULL (opcional) |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de última atualização | DEFAULT CURRENT_TIMESTAMP |

**Exemplo de Dados:**

```sql
INSERT INTO users (name, email, password_hash, profile_picture_url)
VALUES (
  'João Silva',
  'joao@exemplo.com',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH',
  '/uploads/joao-silva.jpg'
);
```

**Queries Comuns:**

```sql
-- Buscar usuário por email (login)
SELECT * FROM users WHERE email = $1;

-- Buscar usuário por ID
SELECT * FROM users WHERE id = $1;

-- Atualizar perfil
UPDATE users
SET name = $1, email = $2, profile_picture_url = $3, updated_at = CURRENT_TIMESTAMP
WHERE id = $4;

-- Atualizar senha
UPDATE users
SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2;

-- Listar todos os usuários
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC;
```

**Usado em:**
- `authController.js` - Login, mudança de senha
- `userController.js` - Perfil, atualização de dados

---

### 2. appointments

Armazena consultas médicas agendadas pelos usuários.

**Definição SQL:**

```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Aguardando',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
```

**Colunas:**

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | SERIAL | Identificador único | PRIMARY KEY, AUTO INCREMENT |
| `user_id` | INTEGER | ID do usuário | FOREIGN KEY → users(id), NOT NULL |
| `doctor_name` | VARCHAR(255) | Nome do médico | NOT NULL |
| `specialty` | VARCHAR(255) | Especialidade médica | NOT NULL |
| `appointment_date` | DATE | Data da consulta | NOT NULL |
| `appointment_time` | TIME | Hora da consulta | NOT NULL |
| `location` | TEXT | Local da consulta | NOT NULL |
| `status` | VARCHAR(50) | Status da consulta | DEFAULT 'Aguardando' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de última atualização | DEFAULT CURRENT_TIMESTAMP |

**Valores de Status:**
- `"Aguardando"` - Consulta criada mas não confirmada
- `"Confirmada"` - Consulta confirmada pelo usuário
- `"Cancelada"` - Consulta cancelada

**Exemplo de Dados:**

```sql
INSERT INTO appointments (
  user_id, doctor_name, specialty, appointment_date, appointment_time, location, status
) VALUES (
  1,
  'Dr. João Silva',
  'Cardiologia',
  '2025-01-25',
  '14:00',
  'Hospital Central - Sala 305',
  'Aguardando'
);
```

**Queries Comuns:**

```sql
-- Buscar consultas não canceladas de um usuário
SELECT * FROM appointments
WHERE user_id = $1 AND status != 'Cancelada'
ORDER BY appointment_date ASC, appointment_time ASC;

-- Buscar consultas confirmadas
SELECT * FROM appointments
WHERE user_id = $1 AND status = 'Confirmada'
ORDER BY appointment_date ASC;

-- Buscar próximas consultas (futuras)
SELECT * FROM appointments
WHERE user_id = $1 AND appointment_date >= CURRENT_DATE AND status != 'Cancelada'
ORDER BY appointment_date ASC, appointment_time ASC;

-- Criar nova consulta
INSERT INTO appointments (
  user_id, doctor_name, specialty, appointment_date, appointment_time, location, status
) VALUES ($1, $2, $3, $4, $5, $6, 'Aguardando')
RETURNING *;

-- Atualizar status
UPDATE appointments
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2;

-- Deletar consulta
DELETE FROM appointments WHERE id = $1;

-- Contar consultas por usuário
SELECT COUNT(*) FROM appointments WHERE user_id = $1;

-- Buscar consultas por especialidade
SELECT * FROM appointments
WHERE user_id = $1 AND specialty = $2
ORDER BY appointment_date DESC;
```

**Usado em:**
- `appointmentController.js` - CRUD de consultas

---

### 3. notifications

Armazena histórico de notificações enviadas aos usuários.

**Definição SQL:**

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'system',
  urgencia VARCHAR(50) DEFAULT 'normal',
  lido BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lido ON notifications(lido);
CREATE INDEX idx_notifications_user_lido ON notifications(user_id, lido);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);
```

**Colunas:**

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | SERIAL | Identificador único | PRIMARY KEY, AUTO INCREMENT |
| `user_id` | INTEGER | ID do usuário | FOREIGN KEY → users(id), NOT NULL |
| `title` | VARCHAR(255) | Título da notificação | NOT NULL |
| `message` | TEXT | Mensagem completa | NOT NULL |
| `tipo` | VARCHAR(50) | Tipo de notificação | DEFAULT 'system' |
| `urgencia` | VARCHAR(50) | Nível de urgência | DEFAULT 'normal' |
| `lido` | BOOLEAN | Se foi lida pelo usuário | DEFAULT FALSE |
| `sent_at` | TIMESTAMP | Data/hora de envio | DEFAULT CURRENT_TIMESTAMP |

**Valores de Tipo:**
- `"appointment"` - Notificação relacionada a consultas
- `"system"` - Notificação do sistema
- `"reminder"` - Lembrete
- `"alert"` - Alerta importante

**Valores de Urgência:**
- `"normal"` - Urgência normal
- `"high"` - Alta urgência
- `"critical"` - Crítico

**Exemplo de Dados:**

```sql
INSERT INTO notifications (user_id, title, message, tipo, urgencia, lido)
VALUES (
  1,
  'Consulta confirmada',
  'Sua consulta com Dr. João Silva foi confirmada para 25/01/2025 às 14:00',
  'appointment',
  'normal',
  FALSE
);
```

**Queries Comuns:**

```sql
-- Buscar todas as notificações de um usuário
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY sent_at DESC;

-- Buscar notificações não lidas
SELECT * FROM notifications
WHERE user_id = $1 AND lido = FALSE
ORDER BY sent_at DESC;

-- Contar notificações não lidas
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND lido = FALSE;

-- Criar notificação
INSERT INTO notifications (user_id, title, message, tipo, urgencia, lido)
VALUES ($1, $2, $3, $4, $5, FALSE);

-- Marcar como lida
UPDATE notifications
SET lido = TRUE
WHERE id = $1;

-- Marcar todas como lidas
UPDATE notifications
SET lido = TRUE
WHERE user_id = $1;

-- Deletar notificações antigas (cleanup)
DELETE FROM notifications
WHERE sent_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Buscar notificações por tipo
SELECT * FROM notifications
WHERE user_id = $1 AND tipo = $2
ORDER BY sent_at DESC;
```

**Usado em:**
- `notificationController.js` - Listagem e marcação
- `notificationService.js` - Criação de notificações

---

### 4. subscriptions

Armazena inscrições de notificação push dos usuários.

**Definição SQL:**

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_endpoint ON subscriptions(endpoint);
```

**Colunas:**

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | SERIAL | Identificador único | PRIMARY KEY, AUTO INCREMENT |
| `user_id` | INTEGER | ID do usuário | FOREIGN KEY → users(id), NOT NULL |
| `endpoint` | TEXT | Endpoint do push service | NOT NULL, UNIQUE |
| `p256dh` | TEXT | Chave pública P-256 | NOT NULL |
| `auth` | TEXT | Chave de autenticação | NOT NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de última atualização | DEFAULT CURRENT_TIMESTAMP |

**Exemplo de Dados:**

```sql
INSERT INTO subscriptions (user_id, endpoint, p256dh, auth)
VALUES (
  1,
  'https://fcm.googleapis.com/fcm/send/c9Xaz...',
  'BHx3eX...',
  '7sP4n...'
);
```

**Queries Comuns:**

```sql
-- Buscar todas as subscriptions de um usuário
SELECT * FROM subscriptions WHERE user_id = $1;

-- Verificar se subscription já existe
SELECT * FROM subscriptions
WHERE user_id = $1 AND endpoint = $2;

-- Inserir nova subscription
INSERT INTO subscriptions (user_id, endpoint, p256dh, auth)
VALUES ($1, $2, $3, $4)
ON CONFLICT (endpoint) DO UPDATE
SET p256dh = $3, auth = $4, updated_at = CURRENT_TIMESTAMP;

-- Atualizar subscription existente
UPDATE subscriptions
SET p256dh = $1, auth = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $3;

-- Deletar subscription expirada
DELETE FROM subscriptions WHERE id = $1;

-- Deletar subscriptions antigas (não usadas há 90 dias)
DELETE FROM subscriptions
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
```

**Usado em:**
- `notificationController.js` - Registro de subscriptions
- `notificationService.js` - Envio de notificações push

---

## 🔗 Relacionamentos

### users → appointments (1:N)

Um usuário pode ter múltiplas consultas.

```sql
-- Foreign Key
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Cascade**: Deletar usuário deleta todas as consultas.

### users → notifications (1:N)

Um usuário pode ter múltiplas notificações.

```sql
-- Foreign Key
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Cascade**: Deletar usuário deleta todas as notificações.

### users → subscriptions (1:N)

Um usuário pode ter múltiplas subscriptions (vários dispositivos).

```sql
-- Foreign Key
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Cascade**: Deletar usuário deleta todas as subscriptions.

---

## 🗂️ Índices

### Índices Primários

Todos os IDs são chaves primárias com índice automático:
- `users(id)`
- `appointments(id)`
- `notifications(id)`
- `subscriptions(id)`

### Índices Únicos

- `users(email)` - Garante emails únicos
- `subscriptions(endpoint)` - Garante endpoints únicos

### Índices Compostos

- `appointments(user_id, appointment_date)` - Otimiza queries de consultas por usuário e data
- `notifications(user_id, lido)` - Otimiza contagem de notificações não lidas

### Índices Simples

- `appointments(user_id)` - FK lookup
- `appointments(appointment_date)` - Filtro por data
- `appointments(status)` - Filtro por status
- `notifications(user_id)` - FK lookup
- `notifications(sent_at)` - Ordenação por data
- `subscriptions(user_id)` - FK lookup

---

## 📊 Queries Avançadas

### Dashboard do Usuário

```sql
-- Buscar dados completos para o dashboard
SELECT
  u.name,
  u.email,
  u.profile_picture_url,
  (SELECT COUNT(*) FROM appointments WHERE user_id = u.id) as total_appointments,
  (SELECT COUNT(*) FROM appointments WHERE user_id = u.id AND status = 'Confirmada') as confirmed_appointments,
  (SELECT COUNT(*) FROM notifications WHERE user_id = u.id AND lido = FALSE) as unread_notifications
FROM users u
WHERE u.id = $1;
```

### Próximas Consultas com Contador de Dias

```sql
SELECT
  *,
  appointment_date - CURRENT_DATE as days_until
FROM appointments
WHERE user_id = $1
  AND appointment_date >= CURRENT_DATE
  AND status != 'Cancelada'
ORDER BY appointment_date ASC, appointment_time ASC
LIMIT 5;
```

### Histórico de Consultas por Especialidade

```sql
SELECT
  specialty,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'Confirmada' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as cancelled
FROM appointments
WHERE user_id = $1
GROUP BY specialty
ORDER BY total DESC;
```

### Notificações Agrupadas por Tipo

```sql
SELECT
  tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN lido = TRUE THEN 1 END) as read,
  COUNT(CASE WHEN lido = FALSE THEN 1 END) as unread
FROM notifications
WHERE user_id = $1
GROUP BY tipo
ORDER BY unread DESC;
```

---

## 🔒 Segurança

### Prevenção de SQL Injection

**✅ Sempre use parameterized queries:**

```javascript
// CORRETO
pool.query('SELECT * FROM users WHERE email = $1', [email]);

// INCORRETO (vulnerável a SQL injection)
pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Proteção de Dados Sensíveis

- **Senhas**: Sempre armazenadas como hash bcrypt (nunca texto plano)
- **VAPID Keys**: Em variáveis de ambiente, nunca no código
- **Credenciais DB**: Em `.env`, nunca versionadas

### Row Level Security (Futuro)

Para maior segurança, considere implementar RLS no PostgreSQL:

```sql
-- Exemplo de RLS para appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_user_policy ON appointments
  FOR ALL
  USING (user_id = current_user_id());
```

---

## 🧹 Manutenção

### Limpeza de Dados Antigos

```sql
-- Deletar notificações com mais de 90 dias
DELETE FROM notifications
WHERE sent_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Deletar consultas canceladas com mais de 1 ano
DELETE FROM appointments
WHERE status = 'Cancelada'
  AND updated_at < CURRENT_TIMESTAMP - INTERVAL '1 year';

-- Deletar subscriptions não usadas há 6 meses
DELETE FROM subscriptions
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
```

### Backup Recomendado

```bash
# Backup completo do banco (via Supabase ou pg_dump)
pg_dump -h DB_HOST -U DB_USER -d DB_DATABASE > backup_$(date +%Y%m%d).sql

# Restore
psql -h DB_HOST -U DB_USER -d DB_DATABASE < backup_20250120.sql
```

### Vacuum e Analyze

```sql
-- Otimizar performance do banco
VACUUM ANALYZE users;
VACUUM ANALYZE appointments;
VACUUM ANALYZE notifications;
VACUUM ANALYZE subscriptions;
```

---

## 📈 Estatísticas

### Total de Registros (Exemplo)

```sql
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM appointments) as total_appointments,
  (SELECT COUNT(*) FROM notifications) as total_notifications,
  (SELECT COUNT(*) FROM subscriptions) as total_subscriptions;
```

### Usuários Mais Ativos

```sql
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(a.id) as appointment_count
FROM users u
LEFT JOIN appointments a ON u.id = a.user_id
GROUP BY u.id
ORDER BY appointment_count DESC
LIMIT 10;
```

---

**Próximos passos**: Consulte [Deploy](./deploy.md) para instruções de implantação em produção.
