// ===== GLOBAL STATE MANAGEMENT =====
const AppState = {
    theme: localStorage.getItem('theme') || 'light',
    user: JSON.parse(localStorage.getItem('user')) || null,
    notifications: [],
    isLoading: false,
    currentPage: window.location.pathname
};

// ===== THEME MANAGEMENT =====
class ThemeManager {
    static init() {
        this.applyTheme(AppState.theme);
        this.bindEvents();
    }
    
    static applyTheme(theme) {
        const body = document.body;
        const checkbox = document.getElementById('theme-checkbox');
        
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (checkbox) checkbox.checked = true;
        } else {
            body.removeAttribute('data-theme');
            if (checkbox) checkbox.checked = false;
        }
        
        AppState.theme = theme;
        localStorage.setItem('theme', theme);
        
        // Animate theme change
        body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            body.style.transition = '';
        }, 500);
    }
    
    static toggle() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        if (window.NotificationManager) {
            NotificationManager.show(`Switched to ${newTheme} theme`, 'success', 2000);
        }
    }
    
    static bindEvents() {
        const checkbox = document.getElementById('theme-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => this.toggle());
        }
    }
}

// ===== MODAL MANAGEMENT =====
class ModalManager {
    static activeModal = null;
    
    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Close any existing modal
        if (this.activeModal) {
            this.close(this.activeModal);
        }
        
        modal.style.display = 'block';
        this.activeModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        const content = modal.querySelector('.modal-content-premium');
        if (content) {
            content.style.transform = 'scale(0.8) translateY(-50px)';
            content.style.opacity = '0';
            
            requestAnimationFrame(() => {
                content.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                content.style.transform = 'scale(1) translateY(0)';
                content.style.opacity = '1';
            });
        }
        
        // Add backdrop click handler
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close(modalId));
        }
    }
    
    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content-premium');
        if (content) {
            content.style.transition = 'all 0.3s ease';
            content.style.transform = 'scale(0.8) translateY(-50px)';
            content.style.opacity = '0';
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                this.activeModal = null;
                
                // Reset styles
                content.style.transform = '';
                content.style.opacity = '';
                content.style.transition = '';
            }, 300);
        } else {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.activeModal = null;
        }
    }
    
    static switch(fromModalId, toModalId) {
        this.close(fromModalId);
        setTimeout(() => {
            this.open(toModalId);
        }, 350);
    }
}

// ===== NOTIFICATION SYSTEM =====
class NotificationManager {
    static notifications = [];
    static maxNotifications = 5;
    
    static show(message, type = 'info', duration = 4000) {
        const notification = this.create(message, type);
        document.body.appendChild(notification);
        
        this.notifications.push(notification);
        
        // Position notifications
        this.repositionNotifications();
        
        // Entrance animation
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    static create(message, type) {
        const notification = document.createElement('div');
        notification.className = 'notification-premium';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon ${type}">
                    <i class="${icons[type]}"></i>
                </div>
                <div class="notification-title">${titles[type]}</div>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        // Add click to dismiss
        notification.addEventListener('click', () => this.remove(notification));
        
        return notification;
    }
    
    static remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            this.repositionNotifications();
        }, 400);
    }
    
    static repositionNotifications() {
        this.notifications.forEach((notification, index) => {
            const offset = index * (notification.offsetHeight + 16);
            notification.style.top = `${32 + offset}px`;
        });
    }
}

// ===== FLOATING ASSISTANT =====
class FloatingAssistant {
    static isOpen = false;
    
    static init() {
        const assistant = document.querySelector('.floating-assistant');
        const mainBtn = document.querySelector('.fab-main');
        
        if (mainBtn) {
            mainBtn.addEventListener('click', () => this.toggle());
        }
        
        // Add option click handlers
        const options = document.querySelectorAll('.fab-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('onclick');
                if (action) {
                    eval(action);
                    this.close();
                }
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!assistant.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
    }
    
    static toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    static open() {
        const assistant = document.querySelector('.floating-assistant');
        if (assistant) {
            assistant.classList.add('active');
            this.isOpen = true;
        }
    }
    
    static close() {
        const assistant = document.querySelector('.floating-assistant');
        if (assistant) {
            assistant.classList.remove('active');
            this.isOpen = false;
        }
    }
}

// ===== NAVIGATION MANAGER =====
class NavigationManager {
    static navigateTo(url, newTab = false) {
        if (newTab) {
            window.open(url, '_blank');
        } else {
            // Add loading state
            LoadingManager.show();
            
            setTimeout(() => {
                window.location.href = url;
            }, 500);
        }
    }
    
    static goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.navigateTo('../index.html');
        }
    }
}

// ===== LOADING MANAGER =====
class LoadingManager {
    static show(message = 'Loading premium experience...') {
        if (AppState.isLoading) return;
        
        AppState.isLoading = true;
        const loader = this.create(message);
        document.body.appendChild(loader);
        
        requestAnimationFrame(() => {
            loader.style.opacity = '1';
        });
    }
    
    static hide() {
        if (!AppState.isLoading) return;
        
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(loader)) {
                    document.body.removeChild(loader);
                }
                AppState.isLoading = false;
            }, 300);
        }
    }
    
    static create(message) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div class="loading-spinner animate-rotate"></div>
            <p style="color: white; margin-top: 1rem; font-weight: 500;">${message}</p>
        `;
        
        return overlay;
    }
}

// ===== SCROLL ANIMATIONS =====
class ScrollAnimations {
    static observer = null;
    
    static init() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        
                        // Add animation classes based on data attributes
                        const animation = entry.target.getAttribute('data-animation');
                        if (animation) {
                            entry.target.classList.add(`animate-${animation}`);
                        }
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        // Observe all elements with scroll-animate class
        document.querySelectorAll('.scroll-animate').forEach(el => {
            this.observer.observe(el);
        });
        
        // Add stagger animations
        this.addStaggerAnimations();
    }
    
    static addStaggerAnimations() {
        const staggerGroups = document.querySelectorAll('.stagger-container');
        staggerGroups.forEach(group => {
            const items = group.children;
            Array.from(items).forEach((item, index) => {
                item.classList.add('stagger-item');
                item.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }
}

// ===== FORM HANDLER =====
class FormHandler {
    static init() {
        const forms = document.querySelectorAll('.premium-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
        
        // Password toggle functionality
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.togglePassword(toggle));
        });
        
        // Input focus animations
        const inputs = document.querySelectorAll('.input-container input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => this.handleInputFocus(input));
            input.addEventListener('blur', () => this.handleInputBlur(input));
        });
    }
    
    static handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading-spinner animate-rotate" style="width: 20px; height: 20px;"></div>';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            NotificationManager.show('Form submitted successfully!', 'success');
        }, 2000);
    }
    
    static togglePassword(toggle) {
        const input = toggle.previousElementSibling;
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    static handleInputFocus(input) {
        const container = input.closest('.input-container');
        container.classList.add('focused');
    }
    
    static handleInputBlur(input) {
        const container = input.closest('.input-container');
        if (!input.value) {
            container.classList.remove('focused');
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    ThemeManager.init();
    FloatingAssistant.init();
    ScrollAnimations.init();
    FormHandler.init();
    
    // Handle modal close on outside click
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-backdrop')) {
            const modal = event.target.parentElement;
            ModalManager.close(modal.id);
        }
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.premium-modal[style*="block"]');
            if (openModal) {
                ModalManager.close(openModal.id);
            }
        }
    });
    
    // Add loading styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-family: var(--font-family);
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #667eea;
            border-radius: 50%;
            margin-bottom: 1rem;
        }
        
        .demo-video-placeholder {
            width: 100%;
            height: 200px;
            background: #f0f0f0;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        }
        
        [data-theme="dark"] .demo-video-placeholder {
            background: #2d2d2d;
        }
        
        .demo-video-placeholder:hover {
            background: rgba(102, 126, 234, 0.1);
        }
        
        .input-container.focused {
            transform: scale(1.02);
        }
        
        .notification-premium {
            position: fixed;
            right: 2rem;
            min-width: 300px;
            max-width: 400px;
            z-index: 3000;
        }
    `;
    document.head.appendChild(style);
});

// ===== EXPORT FOR MODULE USE =====
window.FocusZone = {
    ThemeManager,
    ModalManager,
    NotificationManager,
    FloatingAssistant,
    NavigationManager,
    LoadingManager,
    ScrollAnimations,
    FormHandler,
    formatTime,
    generateId,
    debounce
};

// Make managers globally available
window.ThemeManager = ThemeManager;
window.ModalManager = ModalManager;
window.NotificationManager = NotificationManager;
window.FloatingAssistant = FloatingAssistant;
window.NavigationManager = NavigationManager;
window.LoadingManager = LoadingManager;
window.ScrollAnimations = ScrollAnimations;
window.FormHandler = FormHandler;
