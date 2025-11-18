// Arquivo para testar SweetAlert em diferentes resoluções
// Adicione este script temporariamente à página de login para testes

document.addEventListener('DOMContentLoaded', () => {
    // Função para testar alertas
    function testSweetAlert() {
        const tests = [
            {
                name: 'Sucesso',
                config: {
                    icon: 'success',
                    title: 'Teste de Sucesso!',
                    text: 'Este alerta deve aparecer centralizado no mobile.',
                    timer: 2000,
                    showConfirmButton: false
                }
            },
            {
                name: 'Erro',
                config: {
                    icon: 'error',
                    title: 'Teste de Erro!',
                    text: 'Este alerta deve aparecer centralizado no mobile.',
                    confirmButtonText: 'OK'
                }
            },
            {
                name: 'Info',
                config: {
                    icon: 'info',
                    title: 'Teste de Info!',
                    text: 'Resolução atual: ' + window.innerWidth + 'x' + window.innerHeight,
                    confirmButtonText: 'Próximo teste'
                }
            }
        ];

        let currentTest = 0;

        function runTest() {
            if (currentTest >= tests.length) {
                console.log('✅ Todos os testes concluídos!');
                return;
            }

            const test = tests[currentTest];
            console.log(`🧪 Executando teste: ${test.name}`);
            
            Swal.fire({
                ...test.config,
                backdrop: true,
                heightAuto: false,
                customClass: {
                    container: 'swal2-container',
                    popup: 'swal2-popup',
                    confirmButton: 'swal2-confirm'
                }
            }).then(() => {
                currentTest++;
                setTimeout(runTest, 500);
            });
        }

        runTest();
    }

    // Adicionar botão de teste (apenas para desenvolvimento)
    if (location.search.includes('test=sweetalert')) {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Testar SweetAlert';
        testButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        testButton.onclick = testSweetAlert;
        document.body.appendChild(testButton);

        // Info de resolução
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            z-index: 10000;
            padding: 5px;
            background: rgba(0,0,0,0.7);
            color: white;
            border-radius: 3px;
            font-size: 10px;
        `;
        infoDiv.textContent = `${window.innerWidth}x${window.innerHeight}`;
        document.body.appendChild(infoDiv);

        // Atualizar resolução em tempo real
        window.addEventListener('resize', () => {
            infoDiv.textContent = `${window.innerWidth}x${window.innerHeight}`;
        });
    }
});

// Para uso no console do navegador
window.testSweetAlert = () => {
    console.log('🧪 Testando SweetAlert...');
    
    Swal.fire({
        icon: 'info',
        title: 'Teste Manual',
        text: `Resolução: ${window.innerWidth}x${window.innerHeight}\nUser Agent: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`,
        confirmButtonText: 'OK',
        backdrop: true,
        heightAuto: false,
        customClass: {
            container: 'swal2-container',
            popup: 'swal2-popup',
            confirmButton: 'swal2-confirm'
        }
    });
};