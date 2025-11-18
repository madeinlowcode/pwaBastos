/**
 * PWA Install Prompt Handler
 * Mostra um banner customizado para instalar a PWA
 */

let deferredPrompt;
let installBanner;

// Detectar quando a PWA é installable
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA installable detectada!');

    // Prevenir o prompt padrão do Chrome
    e.preventDefault();

    // Guardar o evento para usar depois
    deferredPrompt = e;

    // Mostrar banner customizado
    showInstallBanner();
});

// Detectar quando a PWA foi instalada
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada com sucesso!');

    // Esconder banner
    hideInstallBanner();

    // Limpar o prompt
    deferredPrompt = null;

    // Mostrar mensagem de sucesso
    showSuccessMessage();
});

function showInstallBanner() {
    // Verificar se já foi instalada ou se o usuário já recusou
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
        console.log('Usuário já recusou a instalação anteriormente');
        return;
    }

    // Criar banner se não existir
    if (!installBanner) {
        installBanner = createInstallBanner();
        document.body.appendChild(installBanner);
    }

    // Mostrar banner com animação
    setTimeout(() => {
        installBanner.classList.add('show');
    }, 500);
}

function createInstallBanner() {
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
        <div class="pwa-install-content">
            <div class="pwa-install-icon">
                <img src="/icons/android-launchericon-96-96.png" alt="PWA Consultas">
            </div>
            <div class="pwa-install-text">
                <h3>Instalar PWA Consultas</h3>
                <p>Instale o app para acesso rápido e notificações</p>
            </div>
            <div class="pwa-install-actions">
                <button class="pwa-install-btn install" onclick="installPWA()">
                    <i class="fas fa-download"></i>
                    Instalar
                </button>
                <button class="pwa-install-btn dismiss" onclick="dismissInstallBanner()">
                    <i class="fas fa-times"></i>
                    Agora não
                </button>
            </div>
        </div>
    `;

    return banner;
}

function hideInstallBanner() {
    if (installBanner) {
        installBanner.classList.remove('show');
        setTimeout(() => {
            if (installBanner && installBanner.parentNode) {
                installBanner.parentNode.removeChild(installBanner);
                installBanner = null;
            }
        }, 300);
    }
}

window.installPWA = async function() {
    if (!deferredPrompt) {
        console.log('Prompt de instalação não disponível');
        return;
    }

    // Esconder banner
    hideInstallBanner();

    // Mostrar prompt de instalação nativo
    deferredPrompt.prompt();

    // Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);

    if (outcome === 'dismissed') {
        // Usuário recusou, guardar para não mostrar novamente por um tempo
        localStorage.setItem('pwa-install-dismissed', 'true');
        setTimeout(() => {
            localStorage.removeItem('pwa-install-dismissed');
        }, 7 * 24 * 60 * 60 * 1000); // 7 dias
    }

    // Limpar o prompt
    deferredPrompt = null;
};

window.dismissInstallBanner = function() {
    hideInstallBanner();

    // Guardar que o usuário recusou
    localStorage.setItem('pwa-install-dismissed', 'true');

    // Limpar após 7 dias
    setTimeout(() => {
        localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
};

function showSuccessMessage() {
    const toast = document.createElement('div');
    toast.className = 'pwa-success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>PWA instalada com sucesso!</span>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Adicionar CSS
const style = document.createElement('style');
style.textContent = `
    .pwa-install-banner {
        position: fixed;
        bottom: -200px;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        transition: bottom 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .pwa-install-banner.show {
        bottom: 0;
    }

    .pwa-install-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        gap: 16px;
        flex-wrap: wrap;
    }

    .pwa-install-icon {
        flex-shrink: 0;
    }

    .pwa-install-icon img {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .pwa-install-text {
        flex: 1;
        min-width: 200px;
    }

    .pwa-install-text h3 {
        margin: 0 0 4px 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .pwa-install-text p {
        margin: 0;
        font-size: 0.875rem;
        opacity: 0.9;
    }

    .pwa-install-actions {
        display: flex;
        gap: 12px;
        flex-shrink: 0;
    }

    .pwa-install-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    }

    .pwa-install-btn.install {
        background: white;
        color: #667eea;
    }

    .pwa-install-btn.install:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .pwa-install-btn.dismiss {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        backdrop-filter: blur(10px);
    }

    .pwa-install-btn.dismiss:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .pwa-success-toast {
        position: fixed;
        top: -100px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transition: top 0.3s ease;
    }

    .pwa-success-toast.show {
        top: 20px;
    }

    .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.9375rem;
        font-weight: 500;
    }

    .toast-content i {
        font-size: 1.5rem;
    }

    /* Mobile responsiveness */
    @media (max-width: 640px) {
        .pwa-install-content {
            flex-direction: column;
            text-align: center;
        }

        .pwa-install-actions {
            width: 100%;
            flex-direction: column;
        }

        .pwa-install-btn {
            width: 100%;
            justify-content: center;
        }

        .pwa-install-text {
            min-width: 100%;
        }
    }
`;
document.head.appendChild(style);

console.log('PWA Install Prompt Handler inicializado');
