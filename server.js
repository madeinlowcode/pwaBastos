// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// --- Validação de Variáveis de Ambiente ---
const requiredEnvVars = [
    'SESSION_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_DATABASE',
    'DB_USER',
    'DB_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ ERRO: Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n📝 Para corrigir:');
    console.error('   1. Copie .env.example para .env');
    console.error('   2. Configure todas as variáveis necessárias');
    console.error('   3. Execute: node generate-vapid-keys.js (para gerar chaves VAPID)');
    console.error('\n🔗 Veja o arquivo .env.example para instruções detalhadas');
    process.exit(1);
}

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const webpush = require('web-push');
const pool = require('./config/db');

// --- Inicialização do App ---
const app = express();
const port = process.env.PORT || 3000;

// --- Configurações ---

// Configurar VAPID para Web Push
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
const vapidMailto = process.env.VAPID_MAILTO;

if (!publicVapidKey || !privateVapidKey || !vapidMailto) {
    console.warn("⚠️  AVISO: Chaves VAPID não configuradas - notificações push não funcionarão");
    console.warn("   Execute: node generate-vapid-keys.js para gerar as chaves");
} else {
    webpush.setVapidDetails(vapidMailto, publicVapidKey, privateVapidKey);
    console.log("✅ Chaves VAPID configuradas - notificações push ativas");
}

// Confiar no proxy da Vercel para cookies seguros
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Configurar Sessão com PostgreSQL para Persistência
app.use(session({
    store: new pgSession({
        pool: pool,                      // Usar conexão existente do PostgreSQL
        tableName: 'user_sessions',      // Nome da tabela de sessões
        createTableIfMissing: true       // Criar tabela automaticamente
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,            // Não criar sessões vazias
    cookie: {
        secure: process.env.NODE_ENV === 'production',  // HTTPS apenas em produção
        httpOnly: true,                  // Impede acesso via JavaScript
        maxAge: 24 * 60 * 60 * 1000,    // 24 horas
        sameSite: 'lax'                  // Proteção contra CSRF
    },
    proxy: process.env.NODE_ENV === 'production'  // Confiar em proxy reverso
}));

// Configurar View Engine (Handlebars)
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
            return a === b;
        },
        formatDate: function (date) {
            if (!date) return '';
            return new Date(date).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        getInitials: function (name) {
            if (!name) return '?';
            return name
                .split(' ')
                .map(word => word[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


// --- Middlewares ---

// Habilitar parser de JSON e URL-encoded para requisições POST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos das pastas 'public' e 'uploads'
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Rotas ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const testRoutes = require('./routes/testRoutes');

// Rotas públicas (sem autenticação necessária) - DEVEM VIR PRIMEIRO
app.use(authRoutes);
app.use(testRoutes); // Rotas de teste públicas (/test-push, /test-info)

// Rotas protegidas (requerem autenticação) - VÊEM DEPOIS
app.use(appointmentRoutes);  // Inclui / (home), /consultas, /add-appointment
app.use('/perfil', userRoutes); // Prefixar para evitar conflitos de rota
app.use('/notificacoes', notificationRoutes); // Prefixar para evitar conflitos de rota

// Redirecionar a raiz para a home page de consultas se o usuário estiver logado, ou para o login se não estiver.
// O controller isAuthenticated em authRoutes já cuida disso para a rota '/', então uma rota explícita aqui não é necessária.

// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`\n🚀 Servidor PWA Consultas rodando em http://localhost:${port}`);
    console.log(`📱 Acesse no navegador para testar o aplicativo`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
