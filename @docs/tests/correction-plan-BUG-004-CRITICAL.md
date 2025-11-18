# 🔧 PLANO DE CORREÇÃO - BUG-004 (CRÍTICO)

**Data:** 2025-10-20
**Prioridade:** 🔴 CRÍTICA - BLOQUEADOR
**Bug ID:** BUG-004
**Título:** Sistema de Roteamento não captura /api/register

---

## 📋 RESUMO DO PROBLEMA

A rota `POST /api/register` não está sendo processada pelo controller `registerUser`. Todas as requisições retornam `HTTP 302 Redirect` para `/login` ao invés de executar a lógica de registro.

**Impacto:** Sistema completamente não funcional - usuários não conseguem se registrar.

---

## 🔍 DIAGNÓSTICO COMPLETO

### Sintomas Observados

1. ✅ `POST /api/login` funciona e retorna JSON
2. ❌ `POST /api/register` retorna `302 Redirect` para `/login`
3. ❌ Controller `registerUser` nunca é executado (logs não aparecem)
4. ❌ Router `authRoutes` não recebe a requisição (logs não aparecem)

### Evidências Técnicas

```javascript
// Configuração atual (server.js linhas 118-122)
app.use(authRoutes);           // Sem proteção
app.use(userRoutes);           // COM isAuthenticated global
app.use(appointmentRoutes);    // COM isAuthenticated global
app.use(notificationRoutes);   // COM isAuthenticated global
```

```javascript
// authRoutes.js (funciona)
router.post('/api/login', loginUser);

// authRoutes.js (NÃO funciona)
router.post('/api/register', registerUser);
```

### Causa Raiz Identificada

O problema está na configuração dos routers sem prefixo de caminho. Quando todos os routers são montados com `app.use(router)` sem path prefix, o Express processa os middlewares na ordem, e como alguns routers têm `router.use(isAuthenticated)` aplicado globalmente, eles podem estar interceptando rotas antes de chegarem ao authRoutes.

---

## ✅ SOLUÇÃO RECOMENDADA

### Opção 1: Prefixar Routers (RECOMENDADO)

Esta é a solução mais limpa e alinhada com as melhores práticas do Express.

#### Passo 1: Modificar server.js

**Arquivo:** `server.js`
**Linhas:** 118-122

```javascript
// ANTES (problema):
app.use(authRoutes);
app.use(userRoutes);
app.use(appointmentRoutes);
app.use(notificationRoutes);

// DEPOIS (solução):
app.use('/', authRoutes);          // Manter na raiz para /login, /register, etc
app.use('/user', userRoutes);       // Prefixar com /user
app.use('/', appointmentRoutes);    // Manter na raiz para / (home)
app.use('/notifications', notificationRoutes);  // Prefixar com /notifications
```

#### Passo 2: Atualizar userRoutes.js

**Arquivo:** `routes/userRoutes.js`

```javascript
// ANTES:
router.get('/perfil', renderProfilePage);
router.post('/api/perfil/atualizar', updateUserProfile);
router.get('/api/user/stats', getUserStats);

// DEPOIS:
router.get('/perfil', renderProfilePage);  // Acesso via /user/perfil
router.post('/api/atualizar', updateUserProfile);  // /user/api/atualizar
router.get('/api/stats', getUserStats);  // /user/api/stats
```

#### Passo 3: Atualizar notificationRoutes.js

**Arquivo:** `routes/notificationRoutes.js`

```javascript
// ANTES:
router.get('/notificacoes', renderNotificationsPage);
router.post('/api/subscribe', subscribeToPush);
router.post('/api/notificacoes/marcar-lida', markNotificationAsRead);

// DEPOIS:
router.get('/', renderNotificationsPage);  // /notifications/
router.post('/api/subscribe', subscribeToPush);  // /notifications/api/subscribe
router.post('/api/marcar-lida', markNotificationAsRead);  // /notifications/api/marcar-lida
```

#### Passo 4: Atualizar Views e Frontend

**Arquivos a atualizar:**
- `public/js/profile.js` - Atualizar URLs de API
- `public/js/notifications.js` - Atualizar URLs de API
- Views que fazem links para rotas de perfil

**Exemplo:**
```javascript
// ANTES:
fetch('/api/perfil/atualizar', ...)

// DEPOIS:
fetch('/user/api/atualizar', ...)
```

---

### Opção 2: Remover isAuthenticated Global (ALTERNATIVA)

Se não quiser usar prefixos, pode aplicar `isAuthenticated` em cada rota individual ao invés de globalmente.

#### Passo 1: Modificar userRoutes.js

```javascript
// ANTES:
const router = express.Router();
router.use(isAuthenticated);  // ❌ Remove isto

router.get('/perfil', renderProfilePage);

// DEPOIS:
const router = express.Router();
// Não usar router.use(isAuthenticated)

router.get('/perfil', isAuthenticated, renderProfilePage);  // ✅ Aplicar individualmente
router.post('/api/perfil/atualizar', isAuthenticated, updateUserProfile);
router.get('/api/user/stats', isAuthenticated, getUserStats);
```

#### Passo 2: Repetir para appointmentRoutes.js e notificationRoutes.js

**Vantagem:** Mantém as URLs atuais
**Desvantagem:** Repetitivo e menos manutenível

---

### Opção 3: Reordenar e Isolar (INVESTIGAÇÃO)

Mover authRoutes para ser processado ANTES de qualquer middleware de autenticação.

```javascript
// server.js
// Processar sessão DEPOIS de parsers mas ANTES de rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ ... }));

// Rotas de autenticação SEM proteção - PRIMEIRO
app.use(authRoutes);

// DEPOIS rotas protegidas
app.use(userRoutes);
app.use(appointmentRoutes);
app.use(notificationRoutes);
```

**Nota:** Isto JÁ está sendo feito, mas não resolve porque routers com `router.use(isAuthenticated)` interceptam TODAS as requisições.

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Investigação Final

- [ ] Adicionar logs temporários em TODOS os routers
- [ ] Adicionar logs no middleware de sessão
- [ ] Testar `/api/register` e verificar exatamente onde é interceptado
- [ ] Documentar o fluxo exato da requisição

### Fase 2: Implementação (Opção 1)

- [ ] Modificar `server.js` com prefixos de routers
- [ ] Atualizar `routes/userRoutes.js`
- [ ] Atualizar `routes/notificationRoutes.js`
- [ ] Atualizar `public/js/profile.js`
- [ ] Atualizar `public/js/notifications.js`
- [ ] Verificar todas as views que fazem links

### Fase 3: Testes Unitários

- [ ] Testar `POST /api/register` com curl (JSON)
- [ ] Testar `POST /api/register` com curl (URL-encoded)
- [ ] Testar `POST /api/login` (garantir que não quebrou)
- [ ] Testar `GET /perfil` com autenticação
- [ ] Testar `GET /user/perfil` (nova URL se usou Opção 1)
- [ ] Verificar logs do controller aparecem

### Fase 4: Validação no Banco

- [ ] Tentar criar usuário via `/api/register`
- [ ] Verificar no PostgreSQL se usuário foi criado
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
   ```
- [ ] Fazer login com usuário criado
- [ ] Acessar rotas protegidas com sessão

### Fase 5: Re-teste E2E

- [ ] Solicitar re-teste E2E completo
- [ ] Validar BUG-001 (Persistência de Sessão)
- [ ] Validar BUG-002 (Redirect Gracioso)
- [ ] Validar BUG-003 (Registro Completo)
- [ ] Validar BUG-004 (Este bug)

---

## 🧪 COMANDOS DE TESTE

### Teste 1: Registro com JSON

```bash
curl -v -X POST http://localhost:3334/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Senha12345678",
    "confirmPassword": "Senha12345678"
  }' \
  -c cookies.txt

# Esperado: HTTP 200 + JSON de sucesso
# NÃO DEVE: HTTP 302 redirect
```

### Teste 2: Login

```bash
curl -v -X POST http://localhost:3334/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Senha12345678"
  }' \
  -b cookies.txt -c cookies.txt

# Esperado: HTTP 200 + JSON {"message":"Login bem-sucedido!"}
```

### Teste 3: Acessar Rota Protegida

```bash
curl -v http://localhost:3334/perfil \
  -b cookies.txt

# Esperado: HTTP 200 (página HTML do perfil)
# NÃO DEVE: HTTP 302 redirect para /login
```

### Teste 4: Verificar Banco de Dados

```sql
-- Conectar ao PostgreSQL e executar:
SELECT id, name, email, created_at
FROM users
WHERE email = 'test@example.com';

-- Deve retornar 1 registro
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Antes de Implementar

1. **Faça backup** dos arquivos que serão modificados
2. **Teste localmente** antes de commitar
3. **Documente** as mudanças de URL se usar Opção 1
4. **Atualize** a documentação da API se houver

### Após Implementar

1. **NÃO commitar** os logs de debug temporários
2. **Remover** todos os `console.log` adicionados para investigação
3. **Testar** todas as funcionalidades afetadas
4. **Solicitar** re-teste E2E completo

---

## 🎯 CRITÉRIOS DE SUCESSO

A correção será considerada bem-sucedida quando:

1. ✅ `POST /api/register` retorna HTTP 200 + JSON
2. ✅ Controller `registerUser` é executado (logs aparecem)
3. ✅ Usuário é criado no banco de dados
4. ✅ Sessão é criada automaticamente após registro
5. ✅ Usuário consegue acessar rotas protegidas após registro
6. ✅ `POST /api/login` continua funcionando
7. ✅ Todas as outras rotas continuam funcionando
8. ✅ E2E tests passam 100%

---

## 📊 ESTIMATIVA

- **Opção 1 (Prefixar):** 2-3 horas (inclui atualização de frontend)
- **Opção 2 (Remover global):** 1-2 horas (mais simples mas menos ideal)
- **Testes:** 1 hora
- **Total:** 3-4 horas

---

## 🔗 ARQUIVOS RELACIONADOS

### Arquivos que DEVEM ser modificados:

- `server.js` (linhas 118-122)
- `routes/userRoutes.js`
- `routes/notificationRoutes.js`

### Arquivos que PODEM precisar atualização (se Opção 1):

- `public/js/profile.js`
- `public/js/notifications.js`
- `views/partials/header.hbs` (se houver links para perfil)

### Arquivos para REMOVER logs de debug após correção:

- `controllers/authController.js` (linhas 125-127)
- `routes/authRoutes.js` (linhas 15-19)

---

## 📞 PRÓXIMOS PASSOS

1. **Developer Agent:** Escolher uma opção de correção
2. **Developer Agent:** Implementar correção seguindo checklist
3. **Developer Agent:** Executar testes unitários
4. **Developer Agent:** Solicitar re-teste E2E quando pronto
5. **E2E Agent:** Re-executar todos os testes
6. **E2E Agent:** Emitir relatório final

---

**Status:** 🔴 AGUARDANDO IMPLEMENTAÇÃO
**Prioridade:** CRÍTICA
**Bloqueador:** SIM - Bloqueia todos os outros testes

---

**Criado por:** E2E Testing Specialist Agent
**Data:** 2025-10-20 21:38 UTC
