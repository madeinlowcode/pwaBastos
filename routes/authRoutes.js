const express = require('express');
const router = express.Router();
const {
    isAuthenticated,
    renderLoginPage,
    loginUser,
    logoutUser,
    renderForgotPasswordPage,
    handlePasswordResetRequest,
    changePassword,
    renderRegisterPage,
    registerUser
} = require('../controllers/authController');

// Rotas de renderização de página
router.get('/login', renderLoginPage);
router.get('/register', renderRegisterPage);
router.get('/logout', logoutUser);
router.get('/esqueceu-senha', renderForgotPasswordPage);

// Rotas da API
router.post('/api/login', loginUser);
router.post('/api/register', registerUser);
router.post('/api/password/reset', handlePasswordResetRequest);
router.post('/api/password/change', isAuthenticated, changePassword); // Protegida

module.exports = router;
