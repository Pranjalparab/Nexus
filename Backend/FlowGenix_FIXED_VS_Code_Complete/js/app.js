// FlowGenix Main App JavaScript

// Global Variables
let currentUser = null;
let currentTheme = 'kpop';
let currentTab = 'home';
let isAppBlocked = false;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    showLoadingScreen();
});

// Initialize the application
function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('flowgenix_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showAuthContainer();
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('flowgenix_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(savedTheme);
    }
    
    // Load user stats
    loadUserStats();
    
    // Setup theme particles
    createThemeParticles();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation events
    document.addEventListener('click', handleGlobalClicks);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window events
    window.addEventListener('beforeunload', saveAppState);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
}

// Handle global clicks
function handleGlobalClicks(e) {
    // Close modals when clicking outside
    if (e.target.classList.contains('modal')) {
        closeAllModals();
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Prevent shortcuts during focus sessions
    if (window.isTimerRunning) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            showNotification('Focus mode is active! Complete your session first.', 'warning');
            return;
        }
    }
    
    // Global shortcuts
    if (e.ctrlKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                showTab('home');
                break;
            case '2':
                e.preventDefault();
                showTab('timer');
                break;
            case '3':
                e.preventDefault();
                showTab('todo');
                break;
            case '4':
                e.preventDefault();
                showTab('rewards');
                break;
            case '5':
                e.preventDefault();
                showTab('chat');
                break;
        }
    }
}

// Show loading screen
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';
    
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
}

// Show auth container
function showAuthContainer() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

// Show main app
function showMainApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('app-container').classList.add('active');
    
    // Update user name
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
    }
    
    // Show permission modal for new users
    if (currentUser && !currentUser.permissionsGranted) {
        showPermissionModal();
    }
}

// Show permission modal
function showPermissionModal() {
    document.getElementById('permission-modal').classList.add('show');
}

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    currentTab = tabName;
    
    // Load tab-specific data
    switch (tabName) {
        case 'home':
            loadHomeData();
            break;
        case 'timer':
            initializeTimer();
            break;
        case 'todo':
            loadTodos();
            break;
        case 'rewards':
            loadRewards();
            break;
        case 'chat':
            initializeChat();
            break;
    }
}

// Load home tab data
function loadHomeData() {
    loadUserStats();
    updateQuickStats();
}

// Load user statistics
function loadUserStats() {
    const stats = JSON.parse(localStorage.getItem('flowgenix_stats') || '{}');
    
    document.getElementById('today-focus').textContent = stats.todayFocus || '0m';
    document.getElementById('streak-count').textContent = stats.streak || '0';
    document.getElementById('total-rewards').textContent = stats.totalRewards || '0';
    document.getElementById('user-coins').textContent = stats.coins || '250';
    document.getElementById('rewards-coins').textContent = (stats.coins || '250') + ' Coins';
}

// Update quick statistics
function updateQuickStats() {
    // Animate stats counting up
    const statsElements = ['today-focus', 'streak-count', 'total-rewards'];
    statsElements.forEach(id => {
        const element = document.getElementById(id);
        const value = element.textContent;
        element.style.animation = 'fadeIn 0.5s ease';
    });
}

// Theme Management
function selectTheme(theme) {
    // Remove active class from all theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected theme
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    
    // Apply theme
    applyTheme(theme);
    currentTheme = theme;
    
    // Save theme preference
    localStorage.setItem('flowgenix_theme', theme);
    
    showNotification(`${theme.toUpperCase()} theme selected!`, 'success');
}

// Apply theme
function applyTheme(theme) {
    // Remove existing theme classes
    document.body.className = document.body.className.replace(/\w+-theme/g, '');
    
    // Add new theme class
    document.body.classList.add(theme + '-theme');
    
    // Update theme particles
    updateThemeParticles(theme);
    
    // Update focus animation
    const focusAnimation = document.getElementById('focus-animation');
    focusAnimation.className = 'focus-animation';
    focusAnimation.classList.add(theme + '-active');
}

// Create theme particles
function createThemeParticles() {
    let particlesContainer = document.querySelector('.theme-particles');
    if (!particlesContainer) {
        particlesContainer = document.createElement('div');
        particlesContainer.className = 'theme-particles';
        document.body.appendChild(particlesContainer);
    }
}

// Update theme particles
function updateThemeParticles(theme) {
    const particlesContainer = document.querySelector('.theme-particles');
    if (particlesContainer) {
        particlesContainer.className = 'theme-particles ' + theme;
    }
}

// Quick Actions
function startQuickTimer() {
    showTab('timer');
    setTimeout(() => {
        setTimer(25);
        toggleTimer();
    }, 500);
}

function openTeacherMode() {
    showNotification('Teacher Mode coming soon! 👩‍🏫', 'info');
}

// Profile and Settings
function showProfile() {
    showNotification('Profile page coming soon!', 'info');
}

function showSettings() {
    document.getElementById('settings-modal').classList.add('show');
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Window Focus/Blur Handlers
function handleWindowFocus() {
    if (isAppBlocked) {
        // User returned to the app during blocked mode
        showNotification('Welcome back! Stay focused! 💪', 'success');
    }
}

function handleWindowBlur() {
    if (window.isTimerRunning && isAppBlocked) {
        // User left the app during focus session
        console.log('User left during focus session');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 15px 20px;
        border-radius: var(--border-radius-sm);
        box-shadow: var(--shadow-heavy);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid ${type === 'success' ? 'var(--accent-green)' : 
                                 type === 'warning' ? 'var(--accent-orange)' : 
                                 type === 'error' ? 'var(--accent-pink)' : 'var(--accent-blue)'};
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Add notification to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Save app state
function saveAppState() {
    const appState = {
        currentTheme,
        currentTab,
        timestamp: Date.now()
    };
    localStorage.setItem('flowgenix_state', JSON.stringify(appState));
}

// Update user coins
function updateUserCoins(amount, operation = 'add') {
    const stats = JSON.parse(localStorage.getItem('flowgenix_stats') || '{}');
    const currentCoins = parseInt(stats.coins || 250);
    
    let newCoins;
    if (operation === 'add') {
        newCoins = currentCoins + amount;
    } else {
        newCoins = Math.max(0, currentCoins - amount);
    }
    
    stats.coins = newCoins;
    localStorage.setItem('flowgenix_stats', JSON.stringify(stats));
    
    // Update UI
    document.getElementById('user-coins').textContent = newCoins;
    document.getElementById('rewards-coins').textContent = newCoins + ' Coins';
    
    // Animate coin change
    animateCoinChange(amount, operation);
}

// Animate coin changes
function animateCoinChange(amount, operation) {
    const coinsDisplay = document.querySelector('.coins-display');
    const changeIndicator = document.createElement('div');
    changeIndicator.textContent = operation === 'add' ? `+${amount}` : `-${amount}`;
    changeIndicator.style.cssText = `
        position: absolute;
        top: -10px;
        right: 0;
        color: ${operation === 'add' ? 'var(--accent-green)' : 'var(--accent-pink)'};
        font-weight: bold;
        animation: coinFloat 2s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    coinsDisplay.style.position = 'relative';
    coinsDisplay.appendChild(changeIndicator);
    
    setTimeout(() => {
        changeIndicator.remove();
    }, 2000);
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes coinFloat {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-30px); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 18px;
        margin-left: auto;
    }
    
    .notification-close:hover {
        color: var(--text-primary);
    }
`;
document.head.appendChild(notificationStyles);

// Export functions for use by other scripts
window.FlowGenix = {
    showNotification,
    updateUserCoins,
    currentTheme,
    currentUser,
    showTab,
    closeModal,
    closeAllModals
};
