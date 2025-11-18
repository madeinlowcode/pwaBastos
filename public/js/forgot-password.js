document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        // Show loading indicator
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<span>Enviando...</span> <i class="fas fa-spinner fa-spin"></i>';
        submitButton.disabled = true;
        
        // Send request to server
        fetch('/api/password/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Email enviado!',
                    text: 'Verifique seu email para as instruções de recuperação de senha.',
                    confirmButtonColor: '#5d87ff'
                });
            } else {
                throw new Error(data.message || 'Erro ao enviar email de recuperação');
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: error.message,
                confirmButtonColor: '#5d87ff'
            });
        })
        .finally(() => {
            // Reset button state
            submitButton.innerHTML = '<span>Enviar Instruções</span> <i class="fas fa-paper-plane"></i>';
            submitButton.disabled = false;
        });
    });
});
