// Magic UI Notifications - Enhanced interactions and animations

class MagicNotifications {
    constructor() {
        this.init();
    }

    init() {
        this.setupAnimations();
        this.setupInteractions();
        this.setupBulkActions();
        this.setupSwipeGestures();
        this.setupSearch();
        this.setupStatusUpdates();
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

        // Observe notification cards
        const cards = document.querySelectorAll('.magic-notification-card');
        cards.forEach(card => {
            observer.observe(card);
        });
    }

    setupInteractions() {
        // Notification card hover effects
        const cards = document.querySelectorAll('.magic-notification-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });

            // Click ripple effect
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.magic-notification-btn')) {
                    this.addClickRipple(e, card);
                }
            });
        });

        // Mark as read buttons
        const markReadButtons = document.querySelectorAll('.mark-read-btn');
        markReadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = button.getAttribute('data-id');
                this.markAsRead(id);
            });
        });

        // Mark all as read
        const markAllButton = document.querySelector('.mark-all-read-btn');
        if (markAllButton) {
            markAllButton.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }

    setupBulkActions() {
        const selectAllCheckbox = document.querySelector('.select-all-notifications');
        const notificationCheckboxes = document.querySelectorAll('.notification-checkbox');
        const bulkActions = document.querySelector('.magic-bulk-actions');

        if (selectAllCheckbox && notificationCheckboxes.length > 0) {
            selectAllCheckbox.addEventListener('change', (e) => {
                notificationCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateBulkActions();
            });

            notificationCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateBulkActions();
                });
            });
        }
    }

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        let currentCard = null;

        const cards = document.querySelectorAll('.magic-notification-card');
        cards.forEach(card => {
            card.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                currentCard = card;
            });

            card.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipeGesture(currentCard, touchStartX, touchEndX);
            });
        });
    }

    setupSearch() {
        const searchInput = document.querySelector('.notification-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterNotifications(e.target.value);
            });
        }
    }

    setupStatusUpdates() {
        // Update notification status in real-time
        this.updateNotificationStatus();
        
        // Check for new notifications every 30 seconds
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000);
    }

    handleSwipeGesture(card, startX, endX) {
        const swipeDistance = endX - startX;
        const swipeThreshold = 100;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - mark as read
                const id = card.getAttribute('data-id');
                this.markAsRead(id);
            } else {
                // Swipe left - mark as unread
                const id = card.getAttribute('data-id');
                this.markAsUnread(id);
            }
        }
    }

    async markAsRead(id) {
        try {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.classList.add('removing');
                
                setTimeout(async () => {
                    const response = await fetch('/notificacoes/marcar-lida', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id })
                    });

                    if (response.ok) {
                        this.updateCard(card, 'read');
                        this.showSuccessNotification('Notificação marcada como lida');
                    } else {
                        this.showErrorNotification('Erro ao marcar notificação');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showErrorNotification('Erro ao marcar notificação');
        }
    }

    async markAsUnread(id) {
        try {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                const response = await fetch('/notificacoes/marcar-nao-lida', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id })
                });

                if (response.ok) {
                    this.updateCard(card, 'unread');
                    this.showSuccessNotification('Notificação marcada como não lida');
                } else {
                    this.showErrorNotification('Erro ao marcar notificação');
                }
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showErrorNotification('Erro ao marcar notificação');
        }
    }

    async markAllAsRead() {
        try {
            this.showLoading('Marcando todas como lidas...');
            
            const response = await fetch('/notificacoes/marcar-todas-lidas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const cards = document.querySelectorAll('.magic-notification-card');
                cards.forEach(card => {
                    this.updateCard(card, 'read');
                });
                this.showSuccessNotification('Todas as notificações foram marcadas como lidas');
            } else {
                this.showErrorNotification('Erro ao marcar notificações');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showErrorNotification('Erro ao marcar notificações');
        } finally {
            this.hideLoading();
        }
    }

    updateCard(card, status) {
        if (status === 'read') {
            card.classList.remove('unread');
            card.classList.add('read');
            const markReadBtn = card.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.remove();
            }
        } else {
            card.classList.remove('read');
            card.classList.add('unread');
        }
    }

    filterNotifications(searchTerm) {
        const cards = document.querySelectorAll('.magic-notification-card');
        cards.forEach(card => {
            const title = card.querySelector('.magic-notification-title').textContent.toLowerCase();
            const message = card.querySelector('.magic-notification-message').textContent.toLowerCase();
            
            if (title.includes(searchTerm.toLowerCase()) || message.includes(searchTerm.toLowerCase())) {
                card.style.display = 'flex';
                card.style.animation = 'slideIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    }

    updateBulkActions() {
        const checkboxes = document.querySelectorAll('.notification-checkbox:checked');
        const bulkActions = document.querySelector('.magic-bulk-actions');
        const selectedCount = document.querySelector('.selected-count');
        
        if (checkboxes.length > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = `${checkboxes.length} selecionada${checkboxes.length > 1 ? 's' : ''}`;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    async checkForNewNotifications() {
        try {
            const response = await fetch('/api/notificacoes/novas');
            if (response.ok) {
                const data = await response.json();
                if (data.hasNew) {
                    this.showNewNotificationBadge(data.count);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar novas notificações:', error);
        }
    }

    updateNotificationStatus() {
        // Check notification permission status
        if ('Notification' in window) {
            const statusIndicator = document.querySelector('.magic-status-indicator');
            const enableButton = document.querySelector('.enable-notifications-btn');
            
            if (Notification.permission === 'granted') {
                statusIndicator.textContent = 'Notificações ativadas';
                statusIndicator.className = 'magic-status-indicator active';
                if (enableButton) enableButton.style.display = 'none';
            } else if (Notification.permission === 'denied') {
                statusIndicator.textContent = 'Notificações bloqueadas';
                statusIndicator.className = 'magic-status-indicator inactive';
                if (enableButton) enableButton.style.display = 'none';
            } else {
                statusIndicator.textContent = 'Notificações não ativadas';
                statusIndicator.className = 'magic-status-indicator pending';
                if (enableButton) enableButton.style.display = 'inline-block';
            }
        }
    }

    async enableNotifications() {
        try {
            const permission = await Notification.requestPermission();
            this.updateNotificationStatus();
            
            if (permission === 'granted') {
                this.showSuccessNotification('Notificações ativadas com sucesso!');
                location.reload();
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showErrorNotification('Erro ao ativar notificações');
        }
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
            background: rgba(37, 99, 235, 0.1);
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

    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `magic-toast ${type}`;
        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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

    showLoading(message = 'Carregando...') {
        const loader = document.createElement('div');
        loader.className = 'magic-loader-overlay';
        loader.innerHTML = `
            <div class="magic-loader">
                <div class="loader-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.magic-loader-overlay');
        if (loader) {
            loader.remove();
        }
    }

    showNewNotificationBadge(count) {
        const badge = document.querySelector('.new-notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = 'block';
        }
    }
}

// Global functions
function markAsRead(id) {
    const notifications = new MagicNotifications();
    notifications.markAsRead(id);
}

function markAllAsRead() {
    const notifications = new MagicNotifications();
    notifications.markAllAsRead();
}

function enableNotifications() {
    const notifications = new MagicNotifications();
    notifications.enableNotifications();
}

// Add CSS for toast notifications
const style = document.createElement('style');
style.textContent = `
    .magic-toast {
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
        max-width: 400px;
    }
    
    .magic-toast.show {
        transform: translateX(0);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.875rem;
    }
    
    .magic-toast.success .toast-content {
        color: #10b981;
    }
    
    .magic-toast.error .toast-content {
        color: #ef4444;
    }
    
    .magic-toast.info .toast-content {
        color: #3b82f6;
    }
    
    .magic-loader-overlay {
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
    
    .magic-loader {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .loader-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize notifications
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.magic-notifications-container')) {
            new MagicNotifications();
        }
    });
}