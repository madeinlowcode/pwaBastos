const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        console.log('User not authenticated. Redirecting to /login');
        return res.redirect('/login');
    }
};

const renderLoginPage = (req, res) => {
    res.render('login');
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log('Attempting login for email:', email);

    try {
        const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        console.log('User found:', user ? user.email : 'None');

        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('Login failed: Password mismatch.');
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        console.log('Session userId set:', req.session.userId);

        res.json({ message: 'Login bem-sucedido!' });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
};

const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
            return res.status(500).send('Erro ao fazer logout.');
        }
        res.redirect('/login');
    });
};

const renderForgotPasswordPage = (req, res) => {
    res.render('forgot-password');
};

const handlePasswordResetRequest = async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Email não encontrado.' });
        }
        // Lógica de envio de email de recuperação (placeholder)
        res.json({
            success: true,
            message: 'Instruções de recuperação de senha enviadas para seu email.'
        });
    } catch (err) {
        console.error('Erro ao processar recuperação de senha:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao processar sua solicitação.'
        });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha atual incorreta.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);

        res.json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error('Erro ao alterar senha:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar alterar a senha.' });
    }
};

const renderRegisterPage = (req, res) => {
    res.render('register');
};

const registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Validações
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
            message: 'Todos os campos são obrigatórios.'
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
            message: 'As senhas não coincidem.'
        });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: 'Email inválido.'
        });
    }

    try {
        // Verificar se email já existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: 'Este email já está cadastrado.'
            });
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // Inserir usuário
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             RETURNING id, name, email`,
            [name, email.toLowerCase(), passwordHash]
        );

        const newUser = result.rows[0];
        console.log('Novo usuário cadastrado:', newUser.email);

        // Criar sessão automaticamente
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

module.exports = {
    isAuthenticated,
    renderLoginPage,
    loginUser,
    logoutUser,
    renderForgotPasswordPage,
    handlePasswordResetRequest,
    changePassword,
    renderRegisterPage,
    registerUser
};
