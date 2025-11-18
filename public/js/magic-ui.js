// Magic UI JavaScript - Enhanced interactions and animations

class MagicUI {
    constructor() {
        this.init();
    }

    init() {
        this.setupCards();
        this.setupNavigation();
        this.setupAnimations();
        this.setupInteractions();
    }

    setupCards() {
        // Add hover effects to magic cards
        const cards = document.querySelectorAll('.magic-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });

            // Add click animation
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.addClickRipple(e, card);
                }
            });
        });
    }

    setupNavigation() {
        // Update active navigation item
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Add ripple effect to navigation
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.addClickRipple(e, item);
            });
        });
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe cards for scroll animations
        const cards = document.querySelectorAll('.magic-card');
        cards.forEach(card => {
            observer.observe(card);
        });

        // Add fade-in animation class
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    setupInteractions() {
        // Floating Action Button interactions
        const fab = document.querySelector('.fab');
        if (fab) {
            fab.addEventListener('click', (e) => {
                this.addClickRipple(e, fab);
            });
        }

        // Button hover effects
        const buttons = document.querySelectorAll('.magic-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    addClickRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Enhanced appointment management functions
    confirmAppointment(id) {
        this.showLoadingAnimation();
        
        // Simulate API call
        setTimeout(() => {
            this.showSuccessAnimation('Consulta confirmada!');
            this.updateCardStatus(id, 'Confirmada');
        }, 1000);
    }

    rescheduleAppointment(id) {
        this.showModal('remarcar', id);
    }

    cancelAppointment(id) {
        this.showModal('cancelar', id);
    }

    showLoadingAnimation() {
        const loader = document.createElement('div');
        loader.className = 'magic-loader';
        loader.innerHTML = `
            <div class="loader-spinner">
                <div class="spinner-ring"></div>
            </div>
        `;
        document.body.appendChild(loader);

        setTimeout(() => {
            loader.remove();
        }, 2000);
    }

    showSuccessAnimation(message) {
        const notification = document.createElement('div');
        notification.className = 'magic-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showModal(type, id) {
        const modal = document.createElement('div');
        modal.className = 'magic-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h3>${type === 'cancelar' ? 'Cancelar Consulta' : 'Remarcar Consulta'}</h3>
                    <p>Você tem certeza que deseja ${type} esta consulta?</p>
                    <div class="modal-actions">
                        <button class="magic-btn magic-btn-secondary" onclick="this.closest('.magic-modal').remove()">
                            Cancelar
                        </button>
                        <button class="magic-btn ${type === 'cancelar' ? 'magic-btn-danger' : 'magic-btn-primary'}" 
                                onclick="confirmAction('${type}', '${id}')">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    updateCardStatus(id, status) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.className = `magic-card status-${status.toLowerCase()}`;
            const statusBadge = card.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = status;
                statusBadge.className = `status-badge ${status.toLowerCase()}`;
            }
        }
    }

    // Pull-to-refresh functionality
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isRefreshing = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY) {
                currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 0) {
                    e.preventDefault();
                    this.updatePullToRefreshUI(pullDistance);
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (isRefreshing) return;
            
            const pullDistance = currentY - startY;
            if (pullDistance > 100) {
                isRefreshing = true;
                this.triggerRefresh();
            }
            
            this.resetPullToRefreshUI();
            startY = 0;
            currentY = 0;
        });
    }

    updatePullToRefreshUI(distance) {
        const percentage = Math.min(distance / 150, 1);
        const rotate = percentage * 180;
        
        // Update UI elements based on pull distance
        document.body.style.transform = `translateY(${Math.min(distance, 100)}px)`;
    }

    resetPullToRefreshUI() {
        document.body.style.transform = '';
    }

    triggerRefresh() {
        // Reload appointments
        location.reload();
    }
}

// Global functions for appointment management
function confirmAppointment(id) {
    const magicUI = new MagicUI();
    magicUI.confirmAppointment(id);
}

function rescheduleAppointment(id) {
    const magicUI = new MagicUI();
    magicUI.rescheduleAppointment(id);
}

function cancelAppointment(id) {
    const magicUI = new MagicUI();
    magicUI.cancelAppointment(id);
}

function confirmAction(type, id) {
    const magicUI = new MagicUI();
    
    if (type === 'cancelar') {
        magicUI.cancelAppointment(id);
    } else if (type === 'remarcar') {
        window.location.href = `/edit-appointment/${id}`;
    }
    
    document.querySelector('.magic-modal')?.remove();
}

// Safe initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Only initialize if we're in the PWA context
        if (window.location.origin.includes('localhost') || window.location.origin.includes(window.location.hostname)) {
            const magicUI = new MagicUI();
            magicUI.setupPullToRefresh();
            console.log('✨ Magic UI initialized successfully');
        }
    } catch (error) {
        console.warn('⚠️ Magic UI initialization skipped:', error.message);
    }
});

// Fallback for environments with restrictions
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Simple initialization without complex features
        const cards = document.querySelectorAll('.magic-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .magic-loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .spinner-ring {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-top: 5px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .magic-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 1000;
    }
    
    .magic-notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--health-green);
    }
    
    .magic-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .modal-backdrop {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        padding: 32px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 90%;
        text-align: center;
    }
    
    .modal-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        justify-content: center;
    }
    
    .animate-in {
        animation: fadeInUp 0.5s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);