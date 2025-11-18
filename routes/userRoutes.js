const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../controllers/authController');
const upload = require('../config/multer');
const {
    renderProfilePage,
    updateUserProfile,
    getUserStats,
    uploadAvatar
} = require('../controllers/userController');

// Todas as rotas de usuário/perfil são protegidas
router.use(isAuthenticated);

// Rota de renderização
router.get('/', renderProfilePage);

// Rotas da API
router.post('/atualizar', updateUserProfile);
router.get('/stats', getUserStats);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
