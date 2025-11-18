const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { sendPushNotification } = require('../services/notificationService');

/**
 * ROTA DE TESTE PÚBLICA - NÃO REQUER AUTENTICAÇÃO
 * Use para testar notificações push sem precisar fazer login
 *
 * Acesse: /test-push
 */
router.get('/test-push', async (req, res) => {
    try {
        // Buscar TODOS os usuários com subscriptions ativas
        const allSubscriptionsResult = await pool.query(
            'SELECT DISTINCT user_id FROM subscriptions LIMIT 10'
        );

        if (allSubscriptionsResult.rows.length === 0) {
            return res.status(404).send(`
                <html>
                <head>
                    <title>Nenhuma Subscription Encontrada</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: 50px auto;
                            padding: 20px;
                            text-align: center;
                        }
                        h1 { color: #e74c3c; }
                        p { color: #555; line-height: 1.6; }
                        .steps {
                            text-align: left;
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin-top: 20px;
                        }
                        .steps ol { padding-left: 20px; }
                        .steps li { margin: 10px 0; }
                        a { color: #3498db; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>❌ Nenhuma Subscription Encontrada</h1>
                    <p>Não há nenhum dispositivo inscrito para receber notificações push.</p>

                    <div class="steps">
                        <strong>Para testar notificações, siga estes passos:</strong>
                        <ol>
                            <li>Acesse a <a href="/">página inicial</a></li>
                            <li>Faça login ou crie uma conta</li>
                            <li>Vá em "Notificações" no menu</li>
                            <li>Clique em "Permitir" quando solicitado</li>
                            <li>Volte aqui e teste novamente: <a href="/test-push">/test-push</a></li>
                        </ol>
                    </div>
                </body>
                </html>
            `);
        }

        // Enviar notificação para todos os usuários encontrados
        const sendPromises = allSubscriptionsResult.rows.map(row =>
            sendPushNotification(
                row.user_id,
                '🧪 Teste de Notificação',
                'Esta é uma notificação de teste. Se você recebeu isso, significa que o sistema está funcionando perfeitamente! ✅'
            )
        );

        await Promise.all(sendPromises);

        // Retornar página de sucesso
        res.send(`
            <html>
            <head>
                <title>Notificação Enviada</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        text-align: center;
                    }
                    h1 { color: #27ae60; }
                    p { color: #555; font-size: 1.1rem; line-height: 1.6; }
                    .success-icon {
                        font-size: 80px;
                        margin: 20px 0;
                    }
                    .info-box {
                        background: #e8f5e9;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 20px;
                        border-left: 4px solid #27ae60;
                    }
                    .info-box p {
                        margin: 10px 0;
                        font-size: 0.95rem;
                    }
                    a {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #3498db;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        transition: background 0.3s;
                    }
                    a:hover {
                        background: #2980b9;
                    }
                </style>
            </head>
            <body>
                <div class="success-icon">✅</div>
                <h1>Notificação Enviada com Sucesso!</h1>
                <p>Notificação de teste enviada para <strong>${allSubscriptionsResult.rows.length}</strong> usuário(s).</p>

                <div class="info-box">
                    <p><strong>📱 Verifique seu dispositivo:</strong></p>
                    <p>• A notificação deve aparecer em segundos</p>
                    <p>• Deve mostrar o ícone da PWA (cruz médica)</p>
                    <p>• Ao clicar, abrirá a página de notificações</p>
                </div>

                <a href="/test-push">🔄 Enviar Outra Notificação</a>
                <br>
                <a href="/" style="background: #95a5a6; margin-left: 10px;">🏠 Voltar ao Início</a>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Erro ao enviar notificação de teste:', error);
        res.status(500).send(`
            <html>
            <head>
                <title>Erro</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        text-align: center;
                    }
                    h1 { color: #e74c3c; }
                    p { color: #555; }
                    pre {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 4px;
                        text-align: left;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <h1>❌ Erro ao Enviar Notificação</h1>
                <p>Ocorreu um erro ao tentar enviar a notificação de teste.</p>
                <pre>${error.message}</pre>
                <a href="/test-push" style="color: #3498db;">Tentar Novamente</a>
            </body>
            </html>
        `);
    }
});

/**
 * ROTA DE INFORMAÇÕES
 * Mostra quantos usuários estão inscritos
 */
router.get('/test-info', async (req, res) => {
    try {
        const totalUsers = await pool.query('SELECT COUNT(DISTINCT user_id) as count FROM subscriptions');
        const totalSubscriptions = await pool.query('SELECT COUNT(*) as count FROM subscriptions');

        res.send(`
            <html>
            <head>
                <title>Informações de Subscriptions</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                    }
                    h1 { color: #3498db; }
                    .stats {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 30px 0;
                    }
                    .stat-card {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 12px;
                        text-align: center;
                    }
                    .stat-number {
                        font-size: 48px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .stat-label {
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    a {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #3498db;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                    }
                </style>
            </head>
            <body>
                <h1>📊 Estatísticas de Push Notifications</h1>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-label">Usuários Inscritos</div>
                        <div class="stat-number">${totalUsers.rows[0].count}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total de Subscriptions</div>
                        <div class="stat-number">${totalSubscriptions.rows[0].count}</div>
                    </div>
                </div>

                <a href="/test-push">🧪 Enviar Notificação de Teste</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Erro: ' + error.message);
    }
});

module.exports = router;
