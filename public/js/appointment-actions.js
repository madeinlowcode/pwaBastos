document.addEventListener('DOMContentLoaded', () => {
    const consultaCards = document.querySelectorAll('.consulta-card');

    consultaCards.forEach(card => {
        const id = card.dataset.id; // Assuming the card will have a data-id attribute
        const btnConfirmar = card.querySelector('.btn-confirmar');
        const btnDesmarcar = card.querySelector('.btn-desmarcar');
        const btnCancelar = card.querySelector('.btn-cancelar');

        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => updateAppointmentStatus(id, 'confirmar'));
        }
        if (btnDesmarcar) {
            btnDesmarcar.addEventListener('click', () => {
                Swal.fire({
                    title: 'Tem certeza?',
                    text: "Você realmente deseja desmarcar esta consulta?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sim, desmarcar!',
                    cancelButtonText: 'Não, manter'
                }).then((result) => {
                    if (result.isConfirmed) {
                        updateAppointmentStatus(id, 'desmarcar');
                    }
                });
            });
        }
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                Swal.fire({
                    title: 'Tem certeza?',
                    text: "Você realmente deseja cancelar esta consulta? Esta ação não pode ser desfeita!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sim, cancelar!',
                    cancelButtonText: 'Não, manter'
                }).then((result) => {
                    if (result.isConfirmed) {
                        updateAppointmentStatus(id, 'cancelar');
                    }
                });
            });
        }
    });

    async function updateAppointmentStatus(id, acao) {
        try {
            const response = await fetch('/api/consultas/acao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, acao })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: `Status da consulta atualizado para: ${data.consulta.status}`,
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.reload(); 
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: `Erro ao atualizar status: ${data.message}`,
                });
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Ocorreu um erro ao tentar atualizar o status da consulta.',
            });
        }
    }
});
