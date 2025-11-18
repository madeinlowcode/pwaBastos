/**
 * Medical Notifications - Simplified, Accessible JavaScript
 * Designed for stressed medical patients
 */

class MedicalNotifications {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAccessibility();
        this.checkNotificationStatus();
    }

    bindEvents() {
        // Mark as read functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mark-read-btn')) {
                e.preventDefault();
                this.markAsRead(e.target.closest('.notification-card'));
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focused = document.activeElement;
                if (focused.classList.contains('notification-card')) {
                    e.preventDefault();
                    this.handleCardAction(focused);
                }
            }
        });

        // Swipe gestures for mobile
        this.setupSwipeGestures();
    }

    setupAccessibility() {
        // Add ARIA live region for screen readers
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'notifications-live-region';
        document.body.appendChild(liveRegion);
    }

    async markAsRead(card) {
        const id = card.dataset.id;
        const markReadBtn = card.querySelector('.mark-read-btn');
        
        // Immediate visual feedback
        if (markReadBtn) {
            markReadBtn.style.opacity = '0.5';
            markReadBtn.disabled = true;
        }

        try {
            const response = await fetch('/notificacoes/marcar-lida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                this.handleMarkAsReadSuccess(card, id);
            } else {
                this.handleMarkAsReadError(card);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            this.handleMarkAsReadError(card);
        }
    }

    handleMarkAsReadSuccess(card, id) {
        // Remove unread styling
        card.classList.remove('unread');
        
        // Remove mark as read button
        const markReadBtn = card.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.remove();
        }

        // Announce to screen readers
        this.announceToScreenReader('Notificação marcada como lida');

        // Optional: Add subtle animation
        card.style.transition = 'opacity 0.3s ease';
        card.style.opacity = '0.9';
    }

    handleMarkAsReadError(card) {
        const markReadBtn = card.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.style.opacity = '1';
            markReadBtn.disabled = false;
        }
        
        // Show user-friendly error
        this.showToast('Erro ao marcar notificação. Tente novamente.');
    }

    async confirmAppointment(notificationId) {
        try {
            const response = await fetch('/api/consultas/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });

            if (response.ok) {
                this.showToast('Consulta confirmada com sucesso!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showToast('Erro ao confirmar consulta');
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);
            this.showToast('Erro ao confirmar consulta');
        }
    }

    async rescheduleAppointment(notificationId) {
        // Simple redirect to rescheduling page
        window.location.href = `/consultas/reagendar/${notificationId}`;
    }

    handleCardAction(card) {
        // Default action - focus on contextual buttons if available
        const primaryAction = card.querySelector('.action-btn.primary');
        if (primaryAction) {
            primaryAction.focus();
        } else {
            // If no specific action, mark as read
            this.markAsRead(card);
        }
    }

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(e.target.closest('.notification-card'));
        });
    }

    handleSwipe(card) {
        if (!card) return;

        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance < 0) {
                // Swipe left - mark as read
                this.markAsRead(card);
            }
        }
    }

    checkNotificationStatus() {
        // Check if notifications are enabled
        if ('Notification' in window) {
            const statusText = document.getElementById('notificationStatus')?.querySelector('.status-text');
            if (statusText) {
                if (Notification.permission === 'granted') {
                    statusText.textContent = 'Notificações ativas para suas consultas';
                } else if (Notification.permission === 'denied') {
                    statusText.textContent = 'Notificações desativadas no seu navegador';
                } else {
                    statusText.textContent = 'Ative as notificações para receber lembretes';
                }
            }
        }
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('notifications-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => liveRegion.textContent = '', 1000);
        }
    }

    showToast(message) {
        // Simple toast notification for errors/success
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--medical-text);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: var(--medical-shadow);
            z-index: 1000;
            font-size: 0.875rem;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global functions for onclick handlers
window.confirmAppointment = (id) => {
    new MedicalNotifications().confirmAppointment(id);
};

window.rescheduleAppointment = (id) => {
    new MedicalNotifications().rescheduleAppointment(id);
};

window.markAsRead = (id) => {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        new MedicalNotifications().markAsRead(card);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MedicalNotifications();
});

// Utility for screen reader only content
const style = document.createElement('style');
style.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(style);