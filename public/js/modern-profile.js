/**
 * Modern Profile - Enhanced User Experience
 * Medical PWA Profile Management
 */

class ModernProfile {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupImageUpload();
        this.setupPasswordStrength();
    }

    init() {
        // Initialize tooltips and animations
        this.setupAnimations();
        this.loadUserStats();
    }

    setupEventListeners() {
        // Action cards
        document.querySelectorAll('[data-action]').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction(card.dataset.action);
            });
        });

        // Modal controls
        document.querySelectorAll('[data-dismiss="modal"]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal(element.closest('.modern-modal'));
            });
        });

        // Form submissions
        document.getElementById('modernEditForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate(e.target);
        });

        document.getElementById('modernPasswordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordChange(e.target);
        });

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePassword(toggle.dataset.target);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupImageUpload() {
        const pictureInput = document.getElementById('pictureInput');
        const profileImage = document.getElementById('profileImage');

        if (pictureInput && profileImage) {
            pictureInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleImageUpload(file);
                }
            });
        }
    }

    setupPasswordStrength() {
        const newPasswordInput = document.getElementById('newPass');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.stat-card, .action-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    async loadUserStats() {
        try {
            const response = await fetch('/perfil/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Use default values if API fails
            this.updateStatsDisplay({
                appointmentCount: 12,
                notificationCount: 3,
                healthScore: 100
            });
        }
    }

    updateStatsDisplay(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach((card, index) => {
            const numberElement = card.querySelector('.stat-number');
            if (numberElement) {
                let value;
                switch (index) {
                    case 0:
                        value = stats.appointmentCount || 0;
                        break;
                    case 1:
                        value = stats.notificationCount || 0;
                        break;
                    case 2:
                        value = `${stats.healthScore || 100}%`;
                        break;
                    default:
                        value = '0';
                }
                this.animateNumber(numberElement, value);
            }
        });
    }

    animateNumber(element, targetValue) {
        const isPercentage = typeof targetValue === 'string' && targetValue.includes('%');
        const numericValue = parseInt(targetValue);
        let currentValue = 0;
        const increment = Math.ceil(numericValue / 20);
        
        const animation = setInterval(() => {
            currentValue += increment;
            if (currentValue >= numericValue) {
                currentValue = numericValue;
                clearInterval(animation);
            }
            element.textContent = isPercentage ? `${currentValue}%` : currentValue;
        }, 50);
    }

    handleAction(action) {
        switch (action) {
            case 'edit':
                this.openEditModal();
                break;
            case 'password':
                this.openPasswordModal();
                break;
            case 'notifications':
                window.location.href = '/notificacoes/';
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    openEditModal() {
        const modal = document.getElementById('modernEditModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    openPasswordModal() {
        const modal = document.getElementById('modernPasswordModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Reset form and focus first input
            const form = modal.querySelector('form');
            if (form) form.reset();
            
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
            
            // Reset password strength
            this.updatePasswordStrength('');
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modern-modal.show').forEach(modal => {
            this.closeModal(modal);
        });
    }

    async handleProfileUpdate(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/perfil/atualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Perfil atualizado com sucesso!', 'success');
                this.closeModal(document.getElementById('modernEditModal'));
                
                // Update UI
                document.querySelector('.user-name').textContent = data.name;
                document.querySelector('.user-email').textContent = data.email;
                
                // Update header
                const headerName = document.querySelector('.header-user-name');
                if (headerName) headerName.textContent = data.name;
                
            } else {
                this.showNotification(result.message || 'Erro ao atualizar perfil', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Erro de conexão. Tente novamente.', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handlePasswordChange(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate passwords match
        if (data.newPassword !== data.confirmPassword) {
            this.showNotification('As senhas não coincidem', 'error');
            return;
        }

        // Validate password strength
        if (data.newPassword.length < 8) {
            this.showNotification('A senha deve ter pelo menos 8 caracteres', 'error');
            return;
        }

        // Add loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Alterando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/password/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Senha alterada com sucesso!', 'success');
                this.closeModal(document.getElementById('modernPasswordModal'));
                form.reset();
            } else {
                this.showNotification(result.message || 'Erro ao alterar senha', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Erro de conexão. Tente novamente.', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleImageUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecione uma imagem válida', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showNotification('A imagem deve ter menos de 5MB', 'error');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);

        // Upload file
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await fetch('/api/upload/profile-picture', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Foto atualizada com sucesso!', 'success');
                
                // Update all profile pictures in the page
                document.querySelectorAll('[src*="profile"]').forEach(img => {
                    img.src = result.imageUrl + '?t=' + Date.now();
                });
            } else {
                this.showNotification(result.message || 'Erro ao fazer upload da imagem', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Erro de conexão. Tente novamente.', 'error');
        }
    }

    togglePassword(targetId) {
        const input = document.getElementById(targetId);
        const toggle = document.querySelector(`[data-target="${targetId}"]`);
        
        if (input && toggle) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        }
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let message = 'Digite uma senha';

        if (password.length === 0) {
            strength = 0;
            message = 'Digite uma senha';
        } else if (password.length < 6) {
            strength = 1;
            message = 'Muito fraca';
        } else if (password.length < 8) {
            strength = 2;
            message = 'Fraca';
        } else {
            strength = 2;
            message = 'Boa';
            
            // Check for various criteria
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            if (strength >= 5) {
                message = 'Muito forte';
            } else if (strength >= 4) {
                message = 'Forte';
            }
        }

        // Update visual feedback
        const strengthClasses = ['', 'weak', 'fair', 'good', 'strong'];
        strengthBar.className = 'strength-fill ' + (strengthClasses[Math.min(strength, 4)] || '');
        strengthText.textContent = message;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
            max-width: 400px;
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

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModernProfile();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernProfile;
}