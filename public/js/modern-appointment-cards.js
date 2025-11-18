/**
 * Modern Appointment Cards - Enhanced Interactions
 * Medical PWA with Smart Action System
 */

class ModernAppointmentCards {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupSwipeGestures();
        this.setupKeyboardNavigation();
    }

    init() {
        // Check if there are appointment cards on the page
        if (document.querySelectorAll('.modern-appointment-card').length === 0) {
            console.log('No appointment cards found on this page');
            return;
        }
        
        // Initialize cards on page load
        this.updateButtonStates();
        this.setupIntersectionObserver();
        console.log('Modern Appointment Cards initialized');
    }

    setupEventListeners() {
        // Primary action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.primary-action-btn')) {
                e.preventDefault();
                this.handlePrimaryAction(e.target.closest('.primary-action-btn'));
            }
            
            // Secondary menu toggle
            if (e.target.closest('.secondary-menu-btn')) {
                e.preventDefault();
                this.toggleSecondaryMenu(e.target.closest('.secondary-menu-btn'));
            }
            
            // Secondary menu actions
            if (e.target.closest('.menu-action')) {
                e.preventDefault();
                this.handleSecondaryAction(e.target.closest('.menu-action'));
            }
            
            // Expand toggle
            if (e.target.closest('.expand-toggle')) {
                e.preventDefault();
                this.toggleExpandedDetails(e.target.closest('.expand-toggle'));
            }
            
            // Close menus when clicking outside
            if (!e.target.closest('.secondary-actions')) {
                this.closeAllSecondaryMenus();
            }
        });

        // Touch/Mouse events for cards
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC to close menus
            if (e.key === 'Escape') {
                this.closeAllSecondaryMenus();
            }
            
            // Enter/Space for focused elements
            if (e.key === 'Enter' || e.key === ' ') {
                const focused = document.activeElement;
                if (focused.classList.contains('expand-toggle')) {
                    e.preventDefault();
                    this.toggleExpandedDetails(focused);
                }
                if (focused.classList.contains('secondary-menu-btn')) {
                    e.preventDefault();
                    this.toggleSecondaryMenu(focused);
                }
            }
        });
    }

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        let currentCard = null;

        document.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.modern-appointment-card');
            if (card) {
                touchStartX = e.changedTouches[0].screenX;
                currentCard = card;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (currentCard) {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(currentCard, touchStartX, touchEndX);
                currentCard = null;
            }
        }, { passive: true });
    }

    setupIntersectionObserver() {
        // Animate cards as they enter viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.modern-appointment-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    updateButtonStates() {
        document.querySelectorAll('.primary-action-btn').forEach(btn => {
            const status = btn.dataset.status || btn.classList.contains('confirmed') ? 'confirmed' : 'pending';
            const appointmentId = btn.dataset.appointmentId;
            
            this.updatePrimaryButton(btn, status);
        });
    }

    updatePrimaryButton(btn, status) {
        const actionText = btn.querySelector('.action-text');
        const actionIcon = btn.querySelector('.action-icon');
        
        switch (status) {
            case 'confirmed':
                btn.style.background = 'var(--status-completed)';
                btn.disabled = true;
                if (actionText) actionText.textContent = 'Confirmada';
                if (actionIcon) actionIcon.className = 'fas fa-check-circle action-icon';
                break;
            case 'cancelled':
                btn.style.background = 'var(--text-muted)';
                btn.disabled = true;
                if (actionText) actionText.textContent = 'Cancelada';
                if (actionIcon) actionIcon.className = 'fas fa-times-circle action-icon';
                break;
            case 'completed':
                btn.style.background = 'var(--status-completed)';
                btn.disabled = true;
                if (actionText) actionText.textContent = 'Concluída';
                if (actionIcon) actionIcon.className = 'fas fa-check-double action-icon';
                break;
            default: // pending
                btn.style.background = 'var(--medical-primary)';
                btn.disabled = false;
                if (actionText) actionText.textContent = 'Confirmar';
                if (actionIcon) actionIcon.className = 'fas fa-check action-icon';
        }
    }

    async handlePrimaryAction(btn) {
        if (btn.disabled) return;

        const appointmentId = btn.dataset.appointmentId;
        const currentStatus = btn.dataset.status || 'pending';
        
        // Add loading state
        this.setButtonLoading(btn, true);
        
        try {
            let newStatus;
            switch (currentStatus) {
                case 'pending':
                    newStatus = await this.confirmAppointment(appointmentId);
                    break;
                default:
                    this.showNotification('Ação não disponível para este status', 'info');
                    return;
            }
            
            // Update button state
            this.updatePrimaryButton(btn, newStatus);
            btn.dataset.status = newStatus;
            
            // Update card visual state
            const card = btn.closest('.modern-appointment-card');
            if (card) {
                card.className = card.className.replace(/status-\w+/, `status-${newStatus}`);
            }
            
            // Show success feedback
            this.showNotification('Consulta confirmada com sucesso!', 'success');
            this.addSuccessAnimation(btn);
            
        } catch (error) {
            console.error('Error handling primary action:', error);
            this.showNotification('Erro ao processar ação. Tente novamente.', 'error');
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    toggleSecondaryMenu(btn) {
        const appointmentId = btn.dataset.appointmentId;
        const menu = document.querySelector(`.secondary-menu[data-appointment-id="${appointmentId}"]`);
        
        if (!menu) return;
        
        // Close other menus first
        this.closeAllSecondaryMenus();
        
        // Toggle current menu
        if (menu.classList.contains('show')) {
            this.closeSecondaryMenu(menu);
        } else {
            this.openSecondaryMenu(menu);
        }
    }

    openSecondaryMenu(menu) {
        menu.classList.add('show');
        menu.style.zIndex = '1000';
        
        // Add backdrop blur effect
        const card = menu.closest('.modern-appointment-card');
        if (card) {
            card.style.position = 'relative';
            card.style.zIndex = '999';
        }
    }

    closeSecondaryMenu(menu) {
        menu.classList.remove('show');
        setTimeout(() => {
            menu.style.zIndex = '';
            const card = menu.closest('.modern-appointment-card');
            if (card) {
                card.style.position = '';
                card.style.zIndex = '';
            }
        }, 200);
    }

    closeAllSecondaryMenus() {
        document.querySelectorAll('.secondary-menu.show').forEach(menu => {
            this.closeSecondaryMenu(menu);
        });
    }

    async handleSecondaryAction(actionBtn) {
        const action = actionBtn.dataset.action;
        const appointmentId = actionBtn.dataset.appointmentId;
        
        // Close menu
        this.closeAllSecondaryMenus();
        
        // Add loading state to action
        this.setButtonLoading(actionBtn, true);
        
        try {
            switch (action) {
                case 'reschedule':
                    await this.rescheduleAppointment(appointmentId);
                    break;
                case 'cancel':
                    const confirmed = await this.confirmCancellation();
                    if (confirmed) {
                        await this.cancelAppointment(appointmentId);
                    }
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error('Error handling secondary action:', error);
            this.showNotification('Erro ao processar ação. Tente novamente.', 'error');
        } finally {
            this.setButtonLoading(actionBtn, false);
        }
    }

    toggleExpandedDetails(toggleBtn) {
        const appointmentId = toggleBtn.dataset.appointmentId;
        const expandedContent = toggleBtn.nextElementSibling;
        const chevron = toggleBtn.querySelector('i');
        
        if (!expandedContent) return;
        
        if (expandedContent.classList.contains('show')) {
            // Collapse
            expandedContent.style.maxHeight = '0';
            expandedContent.classList.remove('show');
            toggleBtn.classList.remove('expanded');
            chevron.style.transform = 'rotate(0deg)';
            toggleBtn.querySelector('span').textContent = 'Ver detalhes';
        } else {
            // Expand
            expandedContent.style.maxHeight = expandedContent.scrollHeight + 'px';
            expandedContent.classList.add('show');
            toggleBtn.classList.add('expanded');
            chevron.style.transform = 'rotate(180deg)';
            toggleBtn.querySelector('span').textContent = 'Ocultar detalhes';
        }
    }

    handleSwipe(card, startX, endX) {
        const swipeThreshold = 100;
        const swipeDistance = endX - startX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - confirm appointment
                const primaryBtn = card.querySelector('.primary-action-btn');
                if (primaryBtn && !primaryBtn.disabled) {
                    this.handlePrimaryAction(primaryBtn);
                }
            } else {
                // Swipe left - open secondary menu
                const secondaryBtn = card.querySelector('.secondary-menu-btn');
                if (secondaryBtn) {
                    this.toggleSecondaryMenu(secondaryBtn);
                }
            }
        }
    }

    handleTouchStart(e) {
        const card = e.target.closest('.modern-appointment-card');
        if (card) {
            card.style.transform = 'scale(0.98)';
        }
    }

    handleTouchEnd(e) {
        const card = e.target.closest('.modern-appointment-card');
        if (card) {
            setTimeout(() => {
                card.style.transform = '';
            }, 100);
        }
    }

    setButtonLoading(btn, loading) {
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
            const originalContent = btn.innerHTML;
            btn.dataset.originalContent = originalContent;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            if (btn.dataset.originalContent) {
                btn.innerHTML = btn.dataset.originalContent;
                delete btn.dataset.originalContent;
            }
        }
    }

    addSuccessAnimation(btn) {
        btn.style.transform = 'scale(1.05)';
        btn.style.background = 'var(--status-confirmed)';
        
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    }

    // API Integration Methods
    async confirmAppointment(appointmentId) {
        const response = await fetch('/api/appointments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: appointmentId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to confirm appointment');
        }
        
        return 'confirmed';
    }

    async rescheduleAppointment(appointmentId) {
        // For now, redirect to reschedule page
        window.location.href = `/consultas/reagendar/${appointmentId}`;
    }

    async cancelAppointment(appointmentId) {
        const response = await fetch('/api/appointments/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: appointmentId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to cancel appointment');
        }
        
        // Update UI to show cancelled state
        const card = document.querySelector(`[data-id="${appointmentId}"]`);
        if (card) {
            card.className = card.className.replace(/status-\w+/, 'status-cancelled');
            const primaryBtn = card.querySelector('.primary-action-btn');
            if (primaryBtn) {
                this.updatePrimaryButton(primaryBtn, 'cancelled');
            }
        }
        
        this.showNotification('Consulta cancelada', 'info');
    }

    async confirmCancellation() {
        return new Promise((resolve) => {
            const modal = this.createConfirmationModal(
                'Cancelar Consulta',
                'Tem certeza que deseja cancelar esta consulta?',
                resolve
            );
            document.body.appendChild(modal);
        });
    }

    createConfirmationModal(title, message, callback) {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-cancel">Não</button>
                    <button class="btn-confirm">Sim, cancelar</button>
                </div>
            </div>
        `;
        
        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;
        
        modal.querySelector('.modal-overlay').style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        `;
        
        modal.querySelector('.modal-content').style.cssText = `
            background: white;
            border-radius: 1rem;
            padding: 1.5rem;
            max-width: 400px;
            width: 100%;
            position: relative;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;
        
        modal.querySelector('.modal-actions').style.cssText = `
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
        `;
        
        modal.querySelectorAll('button').forEach(btn => {
            btn.style.cssText = `
                flex: 1;
                padding: 0.75rem 1rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
        });
        
        modal.querySelector('.btn-cancel').style.background = 'var(--gray-200)';
        modal.querySelector('.btn-confirm').style.cssText += 'background: var(--medical-error); color: white;';
        
        // Event listeners
        modal.querySelector('.btn-cancel').onclick = () => {
            modal.remove();
            callback(false);
        };
        
        modal.querySelector('.btn-confirm').onclick = () => {
            modal.remove();
            callback(true);
        };
        
        modal.querySelector('.modal-overlay').onclick = () => {
            modal.remove();
            callback(false);
        };
        
        return modal;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: 'var(--status-confirmed)',
            error: 'var(--medical-error)',
            warning: 'var(--status-pending)',
            info: 'var(--medical-primary)'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.25rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            max-width: 350px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModernAppointmentCards();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernAppointmentCards;
}