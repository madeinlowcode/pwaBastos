const pool = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

// Helper para buscar dados do usuário para o cabeçalho/views
const getUserData = async (userId) => {
    if (!userId) return null;
    try {
        const userResult = await pool.query("SELECT name, email, profile_picture_url FROM users WHERE id = $1;", [userId]);
        return userResult.rows[0];
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        return null;
    }
};

const renderProfilePage = async (req, res) => {
    try {
        const user = await getUserData(req.session.userId);
        if (user) {
            res.render('perfil', {
                nome: user.name,
                email: user.email,
                nomeUsuario: user.name,
                profilePicture: user.profile_picture_url || '/uploads/default_avatar.png'
            });
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        res.status(500).send('Erro ao carregar perfil.');
    }
};

const updateUserProfile = async (req, res) => {
    const { name, email, profilePictureUrl } = req.body;
    try {
        const result = await pool.query(
            "UPDATE users SET name = $1, email = $2, profile_picture_url = $3, updated_at = NOW() WHERE id = $4 RETURNING name, email, profile_picture_url;",
            [name, email, profilePictureUrl, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
        }

        return res.json({ message: 'Perfil atualizado com sucesso!', user: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar perfil.' });
    }
};

const getUserStats = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Get appointment count
        const appointmentResult = await pool.query(
            "SELECT COUNT(*) as count FROM appointments WHERE user_id = $1",
            [userId]
        );
        
        // Get notification count (unread)
        let notificationCount = 0;
        try {
            const notificationResult = await pool.query(
                "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND lido = FALSE",
                [userId]
            );
            notificationCount = notificationResult.rows[0].count;
        } catch (notifError) {
            console.log('Notifications table not found or error, using default value');
        }
        
        // Calculate health score (mock calculation)
        const healthScore = 100; // Could be based on completed appointments, checkups, etc.
        
        res.json({
            appointmentCount: parseInt(appointmentResult.rows[0].count) || 0,
            notificationCount: parseInt(notificationCount) || 0,
            healthScore: healthScore
        });
        
    } catch (err) {
        console.error('Erro ao buscar estatísticas do usuário:', err);
        res.status(500).json({ 
            appointmentCount: 0,
            notificationCount: 0,
            healthScore: 100
        });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
        }

        const userId = req.session.userId;
        const fileName = req.file.filename;
        const fileUrl = `/uploads/${fileName}`;

        // Buscar o avatar antigo para deletar
        const userResult = await pool.query(
            "SELECT profile_picture_url FROM users WHERE id = $1",
            [userId]
        );

        const oldAvatarUrl = userResult.rows[0]?.profile_picture_url;

        // Deletar arquivo antigo se existir
        if (oldAvatarUrl && oldAvatarUrl !== '/uploads/default_avatar.png' && oldAvatarUrl.startsWith('/uploads/')) {
            try {
                const oldFileName = oldAvatarUrl.replace('/uploads/', '');
                const oldFilePath = path.join(__dirname, '../uploads', oldFileName);
                await fs.unlink(oldFilePath);
            } catch (deleteError) {
                console.log('Arquivo antigo não encontrado ou não pôde ser deletado:', deleteError.message);
            }
        }

        // Atualizar URL do avatar no banco de dados
        const updateResult = await pool.query(
            "UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2 RETURNING name, email, profile_picture_url",
            [fileUrl, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        return res.json({
            message: 'Avatar atualizado com sucesso!',
            profilePictureUrl: fileUrl,
            user: updateResult.rows[0]
        });
    } catch (err) {
        console.error('Erro ao fazer upload de avatar:', err);
        res.status(500).json({ message: 'Erro ao fazer upload do avatar' });
    }
};

module.exports = {
    getUserData,
    renderProfilePage,
    updateUserProfile,
    getUserStats,
    uploadAvatar
};
