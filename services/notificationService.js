const pool = require('../config/db');
const webpush = require('web-push');

// Função para enviar notificação push e salvar no banco de dados
async function sendPushNotification(userId, title, message) {
    try {
        // 1. Armazenar a notificação no banco de dados
        try {
            await pool.query(
                'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
                [userId, title, message]
            );
            console.log('Notificação armazenada no banco de dados.');
        } catch (dbError) {
            console.error('Erro ao armazenar notificação no banco de dados:', dbError);
            // Não vamos parar o processo, o envio do push ainda pode funcionar.
        }

        // 2. Buscar as assinaturas do usuário
        const subscriptionsResult = await pool.query(
            'SELECT endpoint, p256dh, auth FROM subscriptions WHERE user_id = $1',
            [userId]
        );
        const subscriptions = subscriptionsResult.rows;

        if (subscriptions.length === 0) {
            console.log(`Nenhuma assinatura de push encontrada para o usuário ${userId}.`);
            return;
        }

        // 3. Preparar o payload da notificação
        const notificationPayload = JSON.stringify({
            title: title,
            body: message,
            icon: '/icons/android-launchericon-192-192.png',
            badge: '/icons/android-launchericon-96-96.png',
            data: {
                url: '/notificacoes'
            }
        });

        // 4. Enviar a notificação para cada assinatura
        const pushPromises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushSubscription, notificationPayload)
                .catch(error => {
                    console.error('Erro ao enviar notificação push para:', sub.endpoint, error);
                    // Se a assinatura expirou (código 410 GONE), remove do banco
                    if (error.statusCode === 410) {
                        pool.query('DELETE FROM subscriptions WHERE endpoint = $1', [sub.endpoint])
                            .then(() => console.log('Assinatura expirada removida:', sub.endpoint))
                            .catch(deleteErr => console.error('Erro ao excluir assinatura expirada:', deleteErr));
                    }
                });
        });

        await Promise.allSettled(pushPromises);
        console.log('Todas as tentativas de envio de notificação push foram concluídas.');

    } catch (error) {
        console.error('Erro geral na função sendPushNotification:', error);
    }
}

module.exports = {
    sendPushNotification
};
