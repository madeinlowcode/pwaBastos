const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const pool = new Pool({
    user: 'postgres.mxrpvgosmbxuqsmxwbmf',
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    database: 'postgres',
    password: 'uNEMPTeASPIr12*',
    port: 5432,
});

async function createTestUser() {
    try {
        // Gerar hash da senha
        const password = 'teste123';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Verificar se o usuário já existe
        const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', ['teste@example.com']);
        
        if (checkResult.rows.length > 0) {
            console.log('Usuário de teste já existe. ID:', checkResult.rows[0].id);
            return;
        }

        // Inserir novo usuário
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, name, email',
            ['Usuário Teste', 'teste@example.com', passwordHash]
        );

        console.log('Usuário de teste criado com sucesso:');
        console.table(result.rows);
        console.log('Senha: teste123');

    } catch (err) {
        console.error('Erro ao criar usuário de teste:', err);
    } finally {
        pool.end();
    }
}

createTestUser();
