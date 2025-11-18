document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Login bem-sucedido!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1500,
                    backdrop: true,
                    allowOutsideClick: false,
                    heightAuto: false,
                    customClass: {
                        container: 'swal2-container',
                        popup: 'swal2-popup'
                    }
                }).then(() => {
                    window.location.href = '/';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no Login!',
                    text: data.message,
                    confirmButtonText: 'Tentar novamente',
                    backdrop: true,
                    heightAuto: false,
                    customClass: {
                        container: 'swal2-container',
                        popup: 'swal2-popup',
                        confirmButton: 'swal2-confirm'
                    }
                });
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de Conexão!',
                text: 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.',
                confirmButtonText: 'Entendi',
                backdrop: true,
                heightAuto: false,
                customClass: {
                    container: 'swal2-container',
                    popup: 'swal2-popup',
                    confirmButton: 'swal2-confirm'
                }
            });
        }
    });
});
