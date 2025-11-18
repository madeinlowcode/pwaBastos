const pool = require('../config/db');
const { getUserData } = require('./userController');
const { sendPushNotification } = require('../services/notificationService');

const renderHomePage = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM appointments WHERE user_id = $1 AND status != 'Cancelada' ORDER BY appointment_date, appointment_time;", [req.session.userId]);
        const consultas = result.rows.map(consulta => ({
            id: consulta.id,
            medico: consulta.doctor_name,
            especialidade: consulta.specialty,
            data: consulta.appointment_date.toISOString().split('T')[0],
            hora: consulta.appointment_time.substring(0, 5),
            local: consulta.location,
            status: consulta.status
        }));
        
        const user = await getUserData(req.session.userId);

        res.render('home', {
            nomeUsuario: user ? user.name : 'Usuário',
            profilePicture: user ? (user.profile_picture_url || '/uploads/default_avatar.png') : '/uploads/default_avatar.png',
            consultas: consultas,
            showAddButton: true
        });
    } catch (err) {
        console.error('Erro ao buscar consultas para a home:', err);
        res.status(500).send('Erro ao carregar consultas.');
    }
};

const renderAddAppointmentPage = async (req, res) => {
    try {
        const user = await getUserData(req.session.userId);
        res.render('add-appointment', {
            nomeUsuario: user ? user.name : 'Usuário',
            profilePicture: user ? (user.profile_picture_url || '/uploads/default_avatar.png') : '/uploads/default_avatar.png'
        });
    } catch (err) {
        console.error('Erro ao carregar página de adicionar consulta:', err);
        res.status(500).send('Erro ao carregar página.');
    }
};

const renderAppointmentsPage = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM appointments WHERE user_id = $1 AND status = 'Confirmada' ORDER BY appointment_date, appointment_time;", [req.session.userId]);
        const consultas = result.rows.map(consulta => ({
            id: consulta.id,
            medico: consulta.doctor_name,
            especialidade: consulta.specialty,
            data: consulta.appointment_date.toISOString().split('T')[0],
            hora: consulta.appointment_time.substring(0, 5),
            local: consulta.location,
            status: consulta.status
        }));
        
        const user = await getUserData(req.session.userId);

        res.render('consultas', {
            nomeUsuario: user ? user.name : 'Usuário',
            profilePicture: user ? (user.profile_picture_url || '/uploads/default_avatar.png') : '/uploads/default_avatar.png',
            consultas: consultas
        });
    } catch (err) {
        console.error('Erro ao buscar consultas confirmadas:', err);
        res.status(500).send('Erro ao carregar consultas confirmadas.');
    }
};

const handleAppointmentAction = async (req, res) => {
    const { id, acao } = req.body;
    let newStatus, notificationTitle, notificationMessage;

    switch(acao) {
        case 'confirmar':
            newStatus = 'Confirmada';
            notificationTitle = 'Consulta Confirmada';
            notificationMessage = 'Sua consulta foi confirmada.';
            break;
        case 'desmarcar':
            newStatus = 'Aguardando';
            notificationTitle = 'Consulta Desmarcada';
            notificationMessage = 'Sua consulta foi desmarcada e aguarda nova confirmação.';
            break;
        case 'cancelar':
            newStatus = 'Cancelada';
            notificationTitle = 'Consulta Cancelada';
            notificationMessage = 'Sua consulta foi cancelada.';
            break;
        default:
            return res.status(400).json({ message: 'Ação inválida' });
    }

    try {
        const result = await pool.query(
            "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;",
            [newStatus, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Consulta não encontrada' });
        }
        
        const appointment = result.rows[0];
        const userId = appointment.user_id;
        
        const appointmentDate = appointment.appointment_date.toISOString().split('T')[0];
        const appointmentTime = appointment.appointment_time.substring(0, 5);
        const customMessage = `${notificationMessage} Detalhes: ${appointment.doctor_name} em ${appointmentDate} às ${appointmentTime}.`;
        
        await sendPushNotification(userId, notificationTitle, customMessage);
        
        return res.json({ message: 'Status atualizado', consulta: appointment });
    } catch (err) {
        console.error('Erro ao atualizar status da consulta:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const addAppointment = async (req, res) => {
    const { doctorName, specialty, appointmentDate, appointmentTime, location } = req.body;
    const userId = req.session.userId;

    try {
        const result = await pool.query(
            'INSERT INTO appointments (user_id, doctor_name, specialty, appointment_date, appointment_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, doctorName, specialty, appointmentDate, appointmentTime, location, 'Aguardando']
        );

        const customMessage = `Sua consulta com ${doctorName} (${specialty}) foi agendada para ${appointmentDate} às ${appointmentTime}.`;
        await sendPushNotification(userId, 'Nova Consulta Agendada!', customMessage);

        res.status(201).json({ message: 'Consulta agendada com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao agendar consulta:', err);
        res.status(500).json({ message: 'Erro ao agendar consulta.' });
    }
};

module.exports = {
    renderHomePage,
    renderAddAppointmentPage,
    renderAppointmentsPage,
    handleAppointmentAction,
    addAppointment
};
