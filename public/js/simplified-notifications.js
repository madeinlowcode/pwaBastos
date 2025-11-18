/**
 * Simplified Notifications - Optimized for Stressed Medical Patients
 * Focus: Single actions, clear feedback, error prevention
 */

class SimplifiedNotifications {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAccessibility();
    }

    setupEventListeners() {
        // Single click handler for all notification actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.primary-action')) {
                e.preventDefault();
                this.handlePrimaryAction(e.target.closest('.simple-notification'));
            }
            
            if (e.target.closest('.simple-notification') && !e.target.closest('.primary-action')) {
                e.preventDefault();
                this.expandNotification(e.target.closest('.simple-notification'));
            }
        });

        // Keyboard support - Enter/Space
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focused = document.activeElement;
                if (focused.classList.contains('simple-notification')) {
                    e.preventDefault();
                    this.handlePrimaryAction(focused);
                }
            }
        });
    }

    setupAccessibility() {
        // Live region for screen reader announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'notifications-live-region';
        document.body.appendChild(liveRegion);
    }

    async handlePrimaryAction(notification) {
        const id = notification.dataset.id;
        const type = notification.querySelector('.primary-action i').classList.contains('fa-calendar-check') ? 'appointment' : 'general';
        
        // Immediate visual feedback
        const actionBtn = notification.querySelector('.primary-action');
        if (actionBtn) {
            actionBtn.style.opacity = '0.5';
            actionBtn.disabled = true;
        }

        try {
            if (type === 'appointment') {
                await this.handleAppointmentAction(id, notification);
            } else {
                await this.markAsRead(id, notification);
            }
        } catch (error) {
            console.error('Error handling notification action:', error);
            this.showSimpleMessage('Erro. Tente novamente.');
            
            // Restore button
            if (actionBtn) {
                actionBtn.style.opacity = '1';
                actionBtn.disabled = false;
            }
        }
    }

    async handleAppointmentAction(id, notification) {
        // Simple appointment confirmation
        const confirmed = confirm('Confirmar esta consulta?');
        
        if (confirmed) {
            const response = await fetch('/notificacoes/marcar-lida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                this.handleActionSuccess(notification, 'Consulta confirmada!');
            } else {
                throw new Error('Failed to confirm appointment');
            }
        } else {
            // User cancelled - restore button
            const actionBtn = notification.querySelector('.primary-action');
            if (actionBtn) {
                actionBtn.style.opacity = '1';
                actionBtn.disabled = false;
            }
        }
    }

    async markAsRead(id, notification) {
        const response = await fetch('/notificacoes/marcar-lida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            this.handleActionSuccess(notification, 'Marcado como lido');
        } else {
            throw new Error('Failed to mark as read');
        }
    }

    handleActionSuccess(notification, message) {
        // Remove unread styling
        notification.classList.remove('unread');
        
        // Remove action button with smooth animation
        const actionBtn = notification.querySelector('.primary-action');
        if (actionBtn) {
            actionBtn.style.transition = 'all 0.3s ease';
            actionBtn.style.opacity = '0';
            actionBtn.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                actionBtn.remove();
            }, 300);
        }

        // Update urgency dot to show completed state
        const urgencyDot = notification.querySelector('.urgency-dot');
        if (urgencyDot) {
            urgencyDot.style.background = 'var(--normal-color)';
            urgencyDot.classList.remove('unread');
        }

        // Announce to screen readers
        this.announceToScreenReader(message);
        
        // Simple success feedback
        this.showSimpleMessage(message);
        
        // Update header count
        this.updateNotificationCount();
    }

    expandNotification(notification) {
        // Simple expand/collapse for additional details
        const message = notification.querySelector('.notification-message');
        
        if (message.style.webkitLineClamp === 'none') {
            // Collapse
            message.style.webkitLineClamp = '2';
            message.style.webkitBoxOrient = 'vertical';
        } else {
            // Expand
            message.style.webkitLineClamp = 'none';
            message.style.webkitBoxOrient = 'unset';
        }
    }

    updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.simple-notification.unread').length;
        const subtitle = document.querySelector('.notifications-subtitle');
        if (subtitle) {
            subtitle.textContent = `${unreadCount} aviso(s) pendente(s)`;
        }
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('notifications-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => liveRegion.textContent = '', 1000);
        }
    }

    showSimpleMessage(message) {
        // Simple, non-intrusive message
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-blue);
            color: white;
            padding: 12px 20px;
            border-radius: 24px;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Fade out and remove
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Global function for onclick handlers (backward compatibility)
window.handleNotificationAction = function(id, type) {
    const notification = document.querySelector(`[data-id="${id}"]`);
    if (notification) {
        new SimplifiedNotifications().handlePrimaryAction(notification);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SimplifiedNotifications();
});

// Add CSS variables to page if not already present
if (!document.getElementById('simplified-notifications-vars')) {
    const style = document.createElement('style');
    style.id = 'simplified-notifications-vars';
    style.textContent = `
        :root {
            --primary-blue: #3b82f6;
            --normal-color: #10b981;
        }
    `;
    document.head.appendChild(style);
}