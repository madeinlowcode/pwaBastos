document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações locais
        if (!name || !email || !password || !confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Todos os campos são obrigatórios.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
            return;
        }

        if (name.length < 3) {
            Swal.fire({
                icon: 'error',
                title: 'Nome inválido!',
                text: 'Nome deve ter pelo menos 3 caracteres.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
            return;
        }

        if (password.length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Senha fraca!',
                text: 'Senha deve ter pelo menos 8 caracteres.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Senhas não coincidem!',
                text: 'As senhas não são iguais. Verifique e tente novamente.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Cadastro realizado!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1500,
                    backdrop: true,
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = '/';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no Cadastro!',
                    text: data.message,
                    confirmButtonText: 'Tentar novamente',
                    backdrop: true
                });
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de Conexão!',
                text: 'Não foi possível conectar ao servidor.',
                confirmButtonText: 'Entendi',
                backdrop: true
            });
        }
    });
});
