const pool = require('../config/db');
const { getUserData } = require('./userController');
const { sendPushNotification } = require('../services/notificationService');

const renderNotificationsPage = async (req, res) => {
    try {
        const notificacoesResult = await pool.query(
            "SELECT id, title, message, sent_at, lido, tipo, urgencia FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC;",
            [req.session.userId]
        );
        
        const notificacoes = notificacoesResult.rows.map(notificacao => ({
            id: notificacao.id,
            titulo: notificacao.title,
            mensagem: notificacao.message,
            data: new Date(notificacao.sent_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            lida: notificacao.lido,
            tipo: notificacao.tipo || 'appointment',
            urgencia: notificacao.urgencia || 'normal'
        }));

        const user = await getUserData(req.session.userId);
        
        let temAssinatura = false;
        try {
            const subscriptionResult = await pool.query(
                "SELECT COUNT(*) as count FROM subscriptions WHERE user_id = $1;",
                [req.session.userId]
            );
            temAssinatura = subscriptionResult.rows[0].count > 0;
        } catch (subscriptionError) {
            console.log('Tabela subscriptions não existe ou erro na consulta, usando valor padrão');
            temAssinatura = false;
        }
        
        res.render('notificacoes', {
            nomeUsuario: user ? user.name : 'Usuário',
            profilePicture: user ? (user.profile_picture_url || '/uploads/default_avatar.png') : '/uploads/default_avatar.png',
            notificacoes: notificacoes,
            temAssinatura: temAssinatura
        });
    } catch (err) {
        console.error('Erro ao carregar página de notificações:', err);
        res.status(500).send('Erro ao carregar página.');
    }
};

const subscribeToPush = async (req, res) => {
    const subscription = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    try {
        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys;
        
        const existingResult = await pool.query(
            'SELECT id FROM subscriptions WHERE endpoint = $1 AND user_id = $2',
            [endpoint, userId]
        );
        
        if (existingResult.rows.length > 0) {
            await pool.query(
                'UPDATE subscriptions SET p256dh = $1, auth = $2, updated_at = NOW() WHERE endpoint = $3 AND user_id = $4',
                [p256dh, auth, endpoint, userId]
            );
            console.log('Assinatura atualizada para o usuário:', userId);
        } else {
            await pool.query(
                'INSERT INTO subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
                [userId, endpoint, p256dh, auth]
            );
            console.log('Nova assinatura registrada para o usuário:', userId);
        }
        
        res.status(201).json({ message: 'Assinatura registrada com sucesso' });
    } catch (error) {
        console.error('Erro ao registrar assinatura:', error);
        res.status(500).json({ message: 'Erro ao registrar assinatura' });
    }
};

const markNotificationAsRead = async (req, res) => {
    const { id } = req.body;
    const userId = req.session.userId;
    
    try {
        const result = await pool.query(
            'UPDATE notifications SET lido = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notificação não encontrada ou não pertence ao usuário' });
        }
        
        res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.session.userId;

    try {
        await pool.query(
            'UPDATE notifications SET lido = TRUE WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        res.status(500).json({ message: 'Erro ao marcar todas as notificações como lidas' });
    }
};

const markNotificationAsUnread = async (req, res) => {
    const { id } = req.body;
    const userId = req.session.userId;

    try {
        const result = await pool.query(
            'UPDATE notifications SET lido = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notificação não encontrada ou não pertence ao usuário' });
        }

        res.json({ message: 'Notificação marcada como não lida' });
    } catch (error) {
        console.error('Erro ao marcar notificação como não lida:', error);
        res.status(500).json({ message: 'Erro ao marcar notificação como não lida' });
    }
};

const sendTestNotification = async (req, res) => {
    try {
        // Verificar se há userId na sessão
        const userId = req.session?.userId;

        if (!userId) {
            // Se não estiver logado, enviar para TODOS os usuários com subscriptions
            const allSubscriptionsResult = await pool.query(
                'SELECT DISTINCT user_id FROM subscriptions LIMIT 10'
            );

            if (allSubscriptionsResult.rows.length === 0) {
                return res.status(404).send('Nenhuma subscription encontrada. Faça login e permita notificações primeiro.');
            }

            // Enviar para todos os usuários encontrados
            const sendPromises = allSubscriptionsResult.rows.map(row =>
                sendPushNotification(
                    row.user_id,
                    'Teste de Notificação',
                    'Esta é uma notificação de teste para verificar o funcionamento do sistema.'
                )
            );

            await Promise.all(sendPromises);
            return res.send(`Notificação de teste enviada para ${allSubscriptionsResult.rows.length} usuário(s). Verifique seu dispositivo.`);
        }

        // Se estiver logado, enviar apenas para o usuário atual
        await sendPushNotification(
            userId,
            'Teste de Notificação',
            'Esta é uma notificação de teste para verificar o funcionamento do sistema.'
        );
        res.send('Notificação de teste enviada. Verifique seu dispositivo.');
    } catch (error) {
        console.error('Erro ao enviar notificação de teste:', error);
        res.status(500).send('Erro ao enviar notificação de teste.');
    }
};

module.exports = {
    renderNotificationsPage,
    subscribeToPush,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    markNotificationAsUnread,
    sendTestNotification
};
