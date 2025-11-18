# Plano de Correcao - Bugs E2E do Sistema de Autenticacao

## Metadata
- **Gerado em:** 2025-10-20 21:15 UTC
- **Total de Correcoes:** 3 bugs criticos/importantes
- **Prioridade Maxima:** CRITICA (P0)
- **Estimativa Total:** 6-8 horas
- **Status:** AGUARDANDO CORRECAO

---

## CRITICO - Correcoes Prioritarias (P0)

### [BUG-001] - Sessao Nao Persiste Apos Login

#### Metadata do Bug
- **Severidade:** CRITICA
- **Prioridade:** P0 - BLOQUEADOR
- **Impacto:** Sistema completamente inutilizavel
- **Estimativa:** 3-4 horas
- **Status:** NAO INICIADO

#### Descricao do Problema
O sistema cria a sessao no backend durante o login, mas a sessao nao persiste no proximo request (redirect para home). Usuario fica preso em loop de autenticacao.

#### Localizacao do Bug
- **Arquivo Principal:** `server.js`
- **Linhas:** 54-60 (configuracao de sessao)
- **Arquivo Secundario:** `controllers/authController.js`
- **Linhas:** 40-43 (criacao de sessao), 5-12 (middleware)

#### Evidencias
**Logs do Servidor:**
```
Attempting login for email: teste@example.com
User found: teste@example.com
Password match: true
Session userId set: 63dcff97-e663-42be-a3dd-8dc4eb73dbd6
User not authenticated. Redirecting to /login  <-- PROBLEMA AQUI
```

**Configuracao Atual (server.js linhas 55-60):**
```javascript
// ANTES (com bug):
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
```

#### Analise da Causa Raiz

**Problema 1: Store de Sessao em Memoria**
- express-session usa MemoryStore por padrao
- MemoryStore NAO e adequado para producao
- Pode ter problemas com garbage collection
- Cookies podem nao persistir adequadamente

**Problema 2: Configuracao de Cookie Inadequada**
- Apenas `secure` esta configurado
- Falta `httpOnly` (seguranca)
- Falta `sameSite` (previne CSRF)
- Falta `maxAge` (duracao da sessao)

**Problema 3: saveUninitialized = true**
- Cria sessoes vazias desnecessariamente
- Pode causar conflitos de sessao

#### Correcao Necessaria

**Opcao 1: Session Store com PostgreSQL (RECOMENDADO)**

**Passo 1:** Instalar dependencia
```bash
npm install connect-pg-simple
```

**Passo 2:** Modificar server.js
```javascript
// DEPOIS (corrigido):
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db'); // Usar pool existente

app.use(session({
    store: new pgSession({
        pool: pool,                      // Usar conexao existente
        tableName: 'user_sessions',      // Nome da tabela de sessoes
        createTableIfMissing: true       // Criar tabela automaticamente
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,            // MUDADO: false
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,                  // ADICIONADO
        maxAge: 24 * 60 * 60 * 1000,    // ADICIONADO: 24 horas
        sameSite: 'lax'                  // ADICIONADO
    }
}));
```

**Passo 3:** Criar tabela de sessoes (se nao criada automaticamente)
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);
```

**Opcao 2: Session Store com Redis (Alternativa)**
```javascript
// Instalar: npm install connect-redis redis
const RedisStore = require('connect-redis')(session);
const { createClient } = require('redis');

const redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));
```

#### Checklist de Implementacao

**Para Implementar Opcao 1 (PostgreSQL):**
- [ ] Instalar pacote: `npm install connect-pg-simple`
- [ ] Importar connect-pg-simple no server.js
- [ ] Importar pool de db.js
- [ ] Modificar configuracao de sessao conforme codigo acima
- [ ] Testar localmente: fazer login e verificar persistencia
- [ ] Verificar tabela user_sessions criada no banco
- [ ] Verificar cookie sendo enviado no browser
- [ ] Executar testes E2E novamente
- [ ] **STATUS:** NAO INICIADO

**Validacao da Correcao:**
```javascript
// Como testar se esta funcionando:

// 1. Fazer login
// POST /api/login com credenciais validas

// 2. Verificar cookie no browser
// Deve ter: connect.sid cookie com httpOnly=true

// 3. Acessar pagina protegida
// GET / ou GET /perfil
// Deve carregar sem redirect para /login

// 4. Verificar logs
// Nao deve aparecer "User not authenticated" apos login bem-sucedido

// 5. Verificar banco de dados
// SELECT * FROM user_sessions;
// Deve mostrar sessao ativa
```

#### Teste de Validacao Automatizado
```javascript
// Adicionar em testes E2E:
test('Login deve persistir sessao', async () => {
    // Login
    await page.goto('http://localhost:3334/login');
    await page.fill('#email', 'teste@example.com');
    await page.fill('#password', 'teste123');
    await page.click('#submit');

    // Aguardar redirect
    await page.waitForURL('http://localhost:3334/');

    // Verificar autenticacao
    const url = page.url();
    expect(url).toBe('http://localhost:3334/');

    // Verificar cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'connect.sid');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie.httpOnly).toBe(true);

    // Navegar para outra pagina protegida
    await page.goto('http://localhost:3334/perfil');

    // Nao deve redirecionar para login
    expect(page.url()).not.toContain('/login');
});
```

---

## IMPORTANTE - Correcoes de Alta Prioridade (P1)

### [BUG-002] - Erro ao Acessar Paginas Protegidas Sem Autenticacao

#### Metadata do Bug
- **Severidade:** IMPORTANTE
- **Prioridade:** P1 - ALTA
- **Impacto:** UX ruim - erro ao inves de redirect
- **Estimativa:** 1 hora
- **Status:** NAO INICIADO

#### Descricao do Problema
Ao tentar acessar pagina protegida sem autenticacao, browser exibe ERR_FAILED ao inves de redirecionar graciosamente para /login.

#### Localizacao do Bug
- **Arquivo:** `controllers/authController.js`
- **Funcao:** `isAuthenticated`
- **Linhas:** 5-12

#### Codigo Atual
```javascript
// ANTES (com problema):
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        console.log('User not authenticated. Redirecting to /login');
        res.redirect('/login');
    }
};
```

#### Problema Identificado
O codigo parece correto, mas pode estar havendo problema com:
1. Headers ja enviados
2. Response nao sendo finalizada adequadamente
3. Conflito com outros middlewares

#### Correcao Necessaria

**Opcao 1: Garantir Finalizacao da Response**
```javascript
// DEPOIS (corrigido):
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();  // ADICIONADO return
    } else {
        console.log('User not authenticated. Redirecting to /login');
        return res.redirect('/login');  // ADICIONADO return
    }
};
```

**Opcao 2: Adicionar Tratamento de Erro**
```javascript
// DEPOIS (versao melhorada):
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        console.log('User not authenticated. Redirecting to /login');

        // Se for requisicao AJAX, retornar JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({
                message: 'Autenticacao necessaria',
                redirect: '/login'
            });
        }

        // Se for requisicao normal, redirecionar
        return res.redirect('/login');
    }
};
```

**Opcao 3: Adicionar Flash Message (Opcional)**
```javascript
// Requer express-flash
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        console.log('User not authenticated. Redirecting to /login');
        req.flash('error', 'Por favor, faca login para continuar');
        return res.redirect('/login');
    }
};
```

#### Checklist de Implementacao
- [ ] Adicionar `return` nas chamadas next() e redirect()
- [ ] Adicionar verificacao `req.session` antes de `req.session.userId`
- [ ] (Opcional) Implementar tratamento diferenciado para AJAX
- [ ] (Opcional) Adicionar flash messages
- [ ] Testar acesso direto a /perfil sem login
- [ ] Verificar que redireciona graciosamente
- [ ] **STATUS:** NAO INICIADO

#### Teste de Validacao
```javascript
test('Acesso nao autorizado deve redirecionar para login', async () => {
    // Tentar acessar pagina protegida sem login
    await page.goto('http://localhost:3334/perfil');

    // Deve redirecionar para login
    await page.waitForURL(/.*\/login/);
    expect(page.url()).toContain('/login');

    // Nao deve mostrar erro
    const errorElement = await page.$('.error-page');
    expect(errorElement).toBeNull();
});
```

---

### [BUG-003] - Funcionalidade de Registro Ausente

#### Metadata do Bug
- **Severidade:** IMPORTANTE
- **Prioridade:** P1 - ALTA
- **Impacto:** Usuarios nao podem se cadastrar
- **Estimativa:** 2-3 horas
- **Status:** NAO INICIADO

#### Descricao do Problema
Link "Cadastre-se" na pagina de login aponta para /register, mas rota nao existe. Nao ha view nem controller para registro.

#### Localizacao do Bug
- **Arquivo com Link:** `views/login.hbs` (linha 54)
- **Arquivo Faltante:** `views/register.hbs` (nao existe)
- **Controller Faltante:** registerUser em authController.js
- **Rota Faltante:** POST /api/register em authRoutes.js

#### Correcao Necessaria

**Passo 1: Criar View register.hbs**
```handlebars
{{!-- views/register.hbs --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro - PWA Consultas</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/magic-login.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
</head>
<body class="login-page">
    <div class="magic-login-container">
        <div class="magic-login-card">
            <div class="magic-brand">
                <div class="magic-brand-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <h1>HealthCare</h1>
                <p>Criar nova conta</p>
            </div>

            <form class="magic-form" id="registerForm">
                <div class="magic-input-group">
                    <input type="text" id="name" name="name" class="magic-input"
                           placeholder=" " required minlength="3">
                    <label for="name">Nome Completo</label>
                    <i class="fas fa-user input-icon"></i>
                </div>

                <div class="magic-input-group">
                    <input type="email" id="email" name="email" class="magic-input"
                           placeholder=" " required>
                    <label for="email">Email</label>
                    <i class="fas fa-envelope input-icon"></i>
                </div>

                <div class="magic-input-group">
                    <input type="password" id="password" name="password" class="magic-input"
                           placeholder=" " required minlength="8">
                    <label for="password">Senha</label>
                    <i class="fas fa-lock input-icon"></i>
                    <small>Minimo 8 caracteres</small>
                </div>

                <div class="magic-input-group">
                    <input type="password" id="confirmPassword" name="confirmPassword"
                           class="magic-input" placeholder=" " required>
                    <label for="confirmPassword">Confirmar Senha</label>
                    <i class="fas fa-lock input-icon"></i>
                </div>

                <button type="submit" class="magic-button">
                    Criar Conta
                </button>

                <div class="magic-footer">
                    <p>Ja tem uma conta? <a href="/login" class="magic-link">Entrar</a></p>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    <script src="/js/register.js"></script>
</body>
</html>
```

**Passo 2: Criar Controller registerUser**
```javascript
// Adicionar em controllers/authController.js

const renderRegisterPage = (req, res) => {
    res.render('register');
};

const registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Validacoes
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
            message: 'Todos os campos sao obrigatorios.'
        });
    }

    if (name.length < 3) {
        return res.status(400).json({
            message: 'Nome deve ter pelo menos 3 caracteres.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'Senha deve ter pelo menos 8 caracteres.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: 'As senhas nao coincidem.'
        });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: 'Email invalido.'
        });
    }

    try {
        // Verificar se email ja existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: 'Este email ja esta cadastrado.'
            });
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // Inserir usuario
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             RETURNING id, name, email`,
            [name, email, passwordHash]
        );

        const newUser = result.rows[0];
        console.log('Novo usuario cadastrado:', newUser.email);

        // Criar sessao automaticamente
        req.session.userId = newUser.id;
        req.session.userName = newUser.name;
        req.session.userEmail = newUser.email;

        res.json({
            message: 'Cadastro realizado com sucesso!',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (err) {
        console.error('Erro no cadastro:', err);
        res.status(500).json({
            message: 'Erro interno ao processar cadastro.'
        });
    }
};

// Exportar as novas funcoes
module.exports = {
    isAuthenticated,
    renderLoginPage,
    loginUser,
    logoutUser,
    renderForgotPasswordPage,
    handlePasswordResetRequest,
    changePassword,
    renderRegisterPage,     // NOVO
    registerUser            // NOVO
};
```

**Passo 3: Adicionar Rotas**
```javascript
// Modificar routes/authRoutes.js

const {
    isAuthenticated,
    renderLoginPage,
    loginUser,
    logoutUser,
    renderForgotPasswordPage,
    handlePasswordResetRequest,
    changePassword,
    renderRegisterPage,     // ADICIONAR
    registerUser            // ADICIONAR
} = require('../controllers/authController');

// Adicionar rotas de registro
router.get('/register', renderRegisterPage);
router.post('/api/register', registerUser);
```

**Passo 4: Criar JavaScript do Frontend**
```javascript
// Criar public/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Cadastro realizado!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1500,
                    backdrop: true,
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = '/';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no Cadastro!',
                    text: data.message,
                    confirmButtonText: 'Tentar novamente',
                    backdrop: true
                });
            }
        } catch (error) {
            console.error('Erro na requisicao:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de Conexao!',
                text: 'Nao foi possivel conectar ao servidor.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
        }
    });
});
```

#### Checklist de Implementacao
- [ ] Criar arquivo views/register.hbs
- [ ] Adicionar funcoes renderRegisterPage e registerUser em authController.js
- [ ] Adicionar rotas GET /register e POST /api/register em authRoutes.js
- [ ] Criar arquivo public/js/register.js
- [ ] Testar cadastro de novo usuario
- [ ] Verificar validacoes (email duplicado, senhas diferentes, etc)
- [ ] Verificar que usuario e logado automaticamente apos cadastro
- [ ] **STATUS:** NAO INICIADO

#### Teste de Validacao
```javascript
test('Registro de novo usuario', async () => {
    await page.goto('http://localhost:3334/register');

    const timestamp = Date.now();
    const email = `usuario${timestamp}@test.com`;

    await page.fill('#name', 'Usuario Teste');
    await page.fill('#email', email);
    await page.fill('#password', 'senha123456');
    await page.fill('#confirmPassword', 'senha123456');
    await page.click('button[type="submit"]');

    // Deve redirecionar para home
    await page.waitForURL('http://localhost:3334/');

    // Usuario deve estar autenticado
    const url = page.url();
    expect(url).toBe('http://localhost:3334/');
});
```

---

## Tracking de Correcoes

| Bug ID | Severidade | Desenvolvedor | Status | Inicio | Conclusao | Tempo |
|--------|-----------|---------------|--------|--------|-----------|-------|
| BUG-001 | CRITICA | Aguardando | NAO INICIADO | - | - | - |
| BUG-002 | IMPORTANTE | Aguardando | NAO INICIADO | - | - | - |
| BUG-003 | IMPORTANTE | Aguardando | NAO INICIADO | - | - | - |

---

## Processo de Correcao

### Para o Agente de Desenvolvimento (Claude Code):

1. **Ler este plano de correcao completo**

2. **Implementar correcoes na ordem de prioridade:**
   - Primeiro: BUG-001 (CRITICO - Bloqueador)
   - Segundo: BUG-002 (IMPORTANTE - UX)
   - Terceiro: BUG-003 (IMPORTANTE - Feature)

3. **Para cada correcao implementada:**
   - Marcar checkbox como concluida
   - Atualizar STATUS para CONCLUIDO
   - Adicionar timestamp de conclusao
   - Fazer commit: `fix: [BUG-XXX] descricao curta`
   - Testar localmente antes de marcar como completo

4. **Apos TODAS as correcoes:**
   - Atualizar status geral para AGUARDANDO RE-TESTE
   - Notificar agente E2E para re-teste
   - Executar `npm run dev` e verificar servidor funcionando

### Exemplo de Atualizacao:

```markdown
#### Checklist de Implementacao
- [x] Instalar pacote: `npm install connect-pg-simple`
- [x] Importar connect-pg-simple no server.js
- [x] Importar pool de db.js
- [x] Modificar configuracao de sessao
- [x] Testar localmente
- [x] Verificar tabela user_sessions criada
- [x] Verificar cookie sendo enviado
- [x] Executar testes E2E novamente
- **STATUS:** CONCLUIDO em 2025-10-20 22:30 UTC
```

---

## Instrucoes de Re-teste

Apos implementar todas as correcoes, executar:

```bash
# Re-executar teste E2E completo
# (Agente E2E executara novamente os testes)

# Verificar pontos criticos:
# 1. Login com credenciais validas
# 2. Persistencia de sessao apos redirect
# 3. Acesso a paginas protegidas sem redirect loop
# 4. Logout funcionando corretamente
# 5. Registro de novo usuario funcionando
```

---

## Notas Importantes

### Dependencias Necessarias
```json
{
  "connect-pg-simple": "^9.0.1"  // Para BUG-001
}
```

### Variaveis de Ambiente
Nenhuma nova variavel necessaria. As existentes sao suficientes:
- `SESSION_SECRET` (ja configurada)
- `DB_*` (ja configurado)

### Migracao de Dados
Nao ha migracao necessaria. A tabela `user_sessions` sera criada automaticamente.

### Compatibilidade
- Node.js: >= 14.x (ja compativel)
- PostgreSQL: >= 10.x (ja compativel)
- Express: >= 4.x (ja compativel)

---

## Status do Plano

### Status Atual
STATUS GERAL: AGUARDANDO CORRECAO

### Proximas Etapas
1. Implementar BUG-001 (sessao)
2. Implementar BUG-002 (redirect)
3. Implementar BUG-003 (registro)
4. Executar re-teste E2E
5. Validar todas as correcoes

### Status Apos Correcoes
- [ ] Todas as correcoes implementadas
- [ ] Testes E2E re-executados
- [ ] Bugs validados como corrigidos
- [ ] Sistema aprovado para uso

---

**Assinado:** E2E Testing Specialist Agent
**Data:** 2025-10-20 21:15 UTC
**Versao:** 1.0
