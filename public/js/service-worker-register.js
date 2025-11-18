if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration);
                
                // Verificar se há uma assinatura existente
                return registration.pushManager.getSubscription()
                    .then(subscription => {
                        if (!subscription) {
                            console.log('Nenhuma assinatura encontrada, usuário precisa ativar notificações');
                        } else {
                            console.log('Assinatura existente encontrada');
                        }
                    });
            })
            .catch(error => {
                console.error('Falha ao registrar o Service Worker:', error);
            });
    });
}
