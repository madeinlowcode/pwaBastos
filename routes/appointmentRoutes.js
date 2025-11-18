const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../controllers/authController');
const {
    renderHomePage,
    renderAddAppointmentPage,
    renderAppointmentsPage,
    handleAppointmentAction,
    addAppointment
} = require('../controllers/appointmentController');

// Todas as rotas de consulta são protegidas
router.use(isAuthenticated);

// Rotas de renderização de página
router.get('/', renderHomePage);
router.get('/add-appointment', renderAddAppointmentPage);
router.get('/consultas', renderAppointmentsPage);

// Rotas da API
router.post('/api/appointments/add', addAppointment);
router.post('/api/consultas/acao', handleAppointmentAction);

module.exports = router;
