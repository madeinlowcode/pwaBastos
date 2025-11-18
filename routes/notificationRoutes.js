const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../controllers/authController');
const {
    renderNotificationsPage,
    subscribeToPush,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    markNotificationAsUnread,
    sendTestNotification
} = require('../controllers/notificationController');

// ROTAS PÚBLICAS (sem autenticação)
// Rota de teste - IMPORTANTE: deve vir ANTES do middleware isAuthenticated
router.get('/test-public', sendTestNotification);

// PROTEGER AS ROTAS ABAIXO (requer login)
router.use(isAuthenticated);

// Rota de renderização
router.get('/', renderNotificationsPage);

// Rota de teste autenticada
router.get('/test', sendTestNotification);

// Rotas da API
router.post('/subscribe', subscribeToPush);
router.post('/marcar-lida', markNotificationAsRead);
router.post('/marcar-todas-lidas', markAllNotificationsAsRead);
router.post('/marcar-nao-lida', markNotificationAsUnread);

module.exports = router;
