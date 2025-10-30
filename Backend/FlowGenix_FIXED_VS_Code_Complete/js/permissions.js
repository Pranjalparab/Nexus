// FlowGenix Permissions JavaScript

// Handle permission granting
function grantPermissions() {
    showNotification('Requesting permissions...', 'info');
    
    // Request various permissions
    requestAllPermissions().then(results => {
        if (results.allGranted) {
            // Update user permissions status
            if (currentUser) {
                currentUser.permissionsGranted = true;
                localStorage.setItem('flowgenix_user', JSON.stringify(currentUser));
                
                // Update users database
                const users = JSON.parse(localStorage.getItem('flowgenix_users') || '{}');
                if (users[currentUser.email]) {
                    users[currentUser.email].permissionsGranted = true;
                    localStorage.setItem('flowgenix_users', JSON.stringify(users));
                }
            }
            
            // Close modal
            closeModal('permission-modal');
            
            // Show success message
            showNotification('All permissions granted! FlowGenix is now fully functional.', 'success');
            
            // Add to history
            addToHistory('permissions_granted', 'All permissions granted successfully');
            
            // Initialize blocking system
            initializeBlockingSystem();
            
        } else {
            showNotification('Some permissions were denied. Some features may not work properly.', 'warning');
            closeModal('permission-modal');
        }
    }).catch(error => {
        console.error('Permission error:', error);
        showNotification('Failed to request permissions. Please try again.', 'error');
    });
}

// Deny permissions
function denyPermissions() {
    closeModal('permission-modal');
    showNotification('Permissions denied. You can grant them later in settings.', 'info');
    
    // Add to history
    addToHistory('permissions_denied', 'User denied permissions');
}

// Request all required permissions
async function requestAllPermissions() {
    const results = {
        notifications: false,
        camera: false,
        microphone: false,
        fullscreen: false,
        allGranted: false
    };
    
    try {
        // Request notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            results.notifications = permission === 'granted';
        }
        
        // Request camera permission (for focus verification)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
                results.camera = true;
                // Stop the stream immediately
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.log('Camera permission denied:', err);
                results.camera = false;
            }
        }
        
        // Request microphone permission (for voice reminders)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: false, 
                    audio: true 
                });
                results.microphone = true;
                // Stop the stream immediately
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.log('Microphone permission denied:', err);
                results.microphone = false;
            }
        }
        
        // Check fullscreen capability
        if (document.documentElement.requestFullscreen) {
            results.fullscreen = true;
        }
        
        // Consider permissions granted if at least notifications work
        results.allGranted = results.notifications;
        
        return results;
        
    } catch (error) {
        console.error('Error requesting permissions:', error);
        throw error;
    }
}

// Initialize blocking system
function initializeBlockingSystem() {
    // Set up visibility change listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up beforeunload listener for focus sessions
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Set up focus/blur listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Set up keyboard shortcuts blocking
    document.addEventListener('keydown', handleKeyboardBlocking);
    
    // Initialize custom blocking rules
    initializeCustomBlocking();
    
    showNotification('Focus protection system activated!', 'success');
}

// Handle visibility changes
function handleVisibilityChange() {
    if (window.isTimerRunning && isAppBlocked) {
        if (document.hidden) {
            // User switched away from FlowGenix during focus session
            logDistraction('tab_switch', 'User switched to another tab/window');
            
            // Show warning notification when they return
            setTimeout(() => {
                if (!document.hidden) {
                    showFocusWarning('You switched away during your focus session. Stay focused!');
                }
            }, 1000);
        } else {
            // User returned to FlowGenix
            showNotification('Welcome back! Stay focused! 💪', 'success');
        }
    }
}

// Handle page unload during focus sessions
function handleBeforeUnload(e) {
    if (window.isTimerRunning && isAppBlocked) {
        const message = 'You have an active focus session. Leaving now will interrupt your progress.';
        e.returnValue = message;
        return message;
    }
}

// Handle keyboard blocking during focus sessions
function handleKeyboardBlocking(e) {
    if (window.isTimerRunning && isAppBlocked) {
        // Block common shortcuts that could be used to escape
        const blockedKeys = [
            'F5', // Refresh
            'F11', // Fullscreen toggle
            'F12', // DevTools
        ];
        
        const blockedCombos = [
            ['Control', 'r'], // Refresh
            ['Control', 'w'], // Close tab
            ['Control', 't'], // New tab
            ['Control', 'n'], // New window
            ['Control', 'Shift', 'i'], // DevTools
            ['Control', 'Shift', 'j'], // Console
            ['Control', 'u'], // View source
            ['Alt', 'F4'], // Close window (Windows)
            ['Control', 'q'], // Quit (Mac/Linux)
        ];
        
        // Check single keys
        if (blockedKeys.includes(e.key)) {
            e.preventDefault();
            showFocusWarning('Keyboard shortcuts are blocked during focus sessions!');
            return false;
        }
        
        // Check key combinations
        for (const combo of blockedCombos) {
            let match = true;
            
            if (combo.includes('Control') && !e.ctrlKey) match = false;
            if (combo.includes('Shift') && !e.shiftKey) match = false;
            if (combo.includes('Alt') && !e.altKey) match = false;
            if (combo.includes('Meta') && !e.metaKey) match = false;
            
            const keyInCombo = combo.find(key => 
                !['Control', 'Shift', 'Alt', 'Meta'].includes(key)
            );
            
            if (keyInCombo && e.key !== keyInCombo && e.code !== keyInCombo) {
                match = false;
            }
            
            if (match) {
                e.preventDefault();
                showFocusWarning('This shortcut is blocked during focus sessions!');
                return false;
            }
        }
    }
}

// Initialize custom blocking rules
function initializeCustomBlocking() {
    // Override console methods during focus sessions
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    // Block right-click context menu during focus
    document.addEventListener('contextmenu', (e) => {
        if (window.isTimerRunning && isAppBlocked) {
            e.preventDefault();
            showFocusWarning('Right-click menu is disabled during focus sessions!');
        }
    });
    
    // Block text selection during focus (optional)
    document.addEventListener('selectstart', (e) => {
        if (window.isTimerRunning && isAppBlocked && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            // Allow selection in input fields but block elsewhere
            // e.preventDefault();
        }
    });
}

// Log distractions for analytics
function logDistraction(type, description) {
    const distraction = {
        id: Date.now(),
        type: type,
        description: description,
        timestamp: new Date().toISOString(),
        sessionId: focusStartTime
    };
    
    // Save to distractions log
    const distractions = JSON.parse(localStorage.getItem('flowgenix_distractions') || '[]');
    distractions.unshift(distraction);
    
    // Keep only last 100 distractions
    if (distractions.length > 100) {
        distractions.splice(100);
    }
    
    localStorage.setItem('flowgenix_distractions', JSON.stringify(distractions));
    
    // Add to history
    addToHistory('distraction_logged', description);
}

// Show focus warning
function showFocusWarning(message) {
    // Create warning overlay
    let warningOverlay = document.getElementById('focus-warning');
    
    if (!warningOverlay) {
        warningOverlay = document.createElement('div');
        warningOverlay.id = 'focus-warning';
        warningOverlay.innerHTML = `
            <div class="warning-content">
                <div class="warning-icon">⚠️</div>
                <h2>Focus Mode Active</h2>
                <p class="warning-message"></p>
                <div class="warning-timer">
                    Session time remaining: <span id="warning-timer-display"></span>
                </div>
                <button onclick="acknowledgeWarning()" class="acknowledge-btn">
                    I understand, let me focus
                </button>
            </div>
        `;
        
        warningOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(warningOverlay);
    }
    
    // Update warning message
    warningOverlay.querySelector('.warning-message').textContent = message;
    
    // Update timer display
    updateWarningTimer();
    
    // Show overlay
    warningOverlay.style.display = 'flex';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (warningOverlay.parentElement) {
            warningOverlay.style.display = 'none';
        }
    }, 10000);
}

// Update warning timer display
function updateWarningTimer() {
    const timerDisplay = document.getElementById('warning-timer-display');
    if (timerDisplay && window.isTimerRunning) {
        const totalSeconds = (currentTimerMinutes * 60) + currentTimerSeconds;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Acknowledge focus warning
function acknowledgeWarning() {
    const warningOverlay = document.getElementById('focus-warning');
    if (warningOverlay) {
        warningOverlay.style.display = 'none';
    }
    
    // Log acknowledgment
    addToHistory('warning_acknowledged', 'User acknowledged focus warning');
}

// Website blocking simulation (for web version)
function blockWebsites() {
    const blockedDomains = [
        'facebook.com',
        'instagram.com', 
        'twitter.com',
        'youtube.com',
        'netflix.com',
        'tiktok.com',
        'reddit.com',
        'discord.com',
        'twitch.tv',
        'amazon.com',
        'ebay.com'
    ];
    
    // In a real browser extension, this would block actual navigation
    // For demo purposes, we'll show warnings when trying to visit blocked sites
    
    const originalOpen = window.open;
    window.open = function(...args) {
        if (window.isTimerRunning && isAppBlocked) {
            const url = args[0];
            if (url && blockedDomains.some(domain => url.includes(domain))) {
                showFocusWarning(`Access to ${url} is blocked during focus sessions!`);
                return null;
            }
        }
        return originalOpen.apply(this, args);
    };
    
    // Block form submissions to blocked domains
    document.addEventListener('submit', (e) => {
        if (window.isTimerRunning && isAppBlocked) {
            const action = e.target.action;
            if (action && blockedDomains.some(domain => action.includes(domain))) {
                e.preventDefault();
                showFocusWarning('Form submissions to blocked sites are prevented during focus sessions!');
            }
        }
    });
}

// Enter fullscreen mode for maximum focus
function enterFocusMode() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
            showNotification('Entered full focus mode!', 'success');
        }).catch(err => {
            console.log('Fullscreen failed:', err);
        });
    }
}

// Exit fullscreen mode
function exitFocusMode() {
    if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
            showNotification('Exited focus mode', 'info');
        }).catch(err => {
            console.log('Exit fullscreen failed:', err);
        });
    }
}

// Check if running in mobile app context (for app blocking)
function isMobileApp() {
    // Check for common mobile app indicators
    return (
        typeof cordova !== 'undefined' ||
        typeof PhoneGap !== 'undefined' ||
        typeof ionic !== 'undefined' ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

// Mobile app blocking (placeholder for native implementation)
function blockMobileApps() {
    if (isMobileApp()) {
        // This would be implemented in the native mobile app layer
        // Here we just show a simulation
        
        showNotification('Mobile apps blocked! Only essential apps remain accessible.', 'success');
        
        // Log blocked apps
        const blockedApps = [
            'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Twitter',
            'Snapchat', 'Reddit', 'Discord', 'Netflix', 'Games'
        ];
        
        addToHistory('mobile_apps_blocked', `Blocked ${blockedApps.length} mobile apps`);
        
        return true;
    }
    
    return false;
}

// Unblock mobile apps
function unblockMobileApps() {
    if (isMobileApp()) {
        showNotification('Mobile apps unblocked!', 'info');
        addToHistory('mobile_apps_unblocked', 'Mobile apps unblocked');
        return true;
    }
    
    return false;
}

// Google account integration simulation
function integrateGoogleAccount() {
    // This would integrate with Google's APIs in a real implementation
    showNotification('Google account integration simulated for demo', 'info');
    
    // Simulate Google services blocking
    const googleServices = [
        'gmail.com',
        'youtube.com', 
        'google.com',
        'drive.google.com',
        'photos.google.com'
    ];
    
    if (window.isTimerRunning && isAppBlocked) {
        // Allow essential services, block entertainment
        const allowedServices = ['gmail.com'];
        const blockedServices = googleServices.filter(service => !allowedServices.includes(service));
        
        addToHistory('google_services_filtered', `Blocked ${blockedServices.length} Google services, allowed ${allowedServices.length}`);
    }
}

// Get distraction statistics
function getDistractionStats() {
    const distractions = JSON.parse(localStorage.getItem('flowgenix_distractions') || '[]');
    
    const stats = {
        total: distractions.length,
        today: 0,
        thisWeek: 0,
        types: {}
    };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - (6 * 24 * 60 * 60 * 1000));
    
    distractions.forEach(distraction => {
        const date = new Date(distraction.timestamp);
        
        if (date >= todayStart) {
            stats.today++;
        }
        
        if (date >= weekStart) {
            stats.thisWeek++;
        }
        
        stats.types[distraction.type] = (stats.types[distraction.type] || 0) + 1;
    });
    
    return stats;
}

// Add warning styles
const warningStyles = document.createElement('style');
warningStyles.textContent = `
    .warning-content {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 40px;
        text-align: center;
        max-width: 500px;
        border: 3px solid #ff6b9d;
        box-shadow: 0 0 30px rgba(255, 107, 157, 0.3);
    }
    
    .warning-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        animation: pulse 1s infinite;
    }
    
    .warning-content h2 {
        color: #ff6b9d;
        margin-bottom: 20px;
        font-size: 1.8rem;
    }
    
    .warning-message {
        color: var(--text-primary);
        margin-bottom: 20px;
        font-size: 1.1rem;
        line-height: 1.5;
    }
    
    .warning-timer {
        background: rgba(255, 107, 157, 0.1);
        padding: 15px;
        border-radius: var(--border-radius-sm);
        margin-bottom: 25px;
        color: #ff6b9d;
        font-weight: 600;
    }
    
    #warning-timer-display {
        font-size: 1.2rem;
        font-weight: 700;
    }
    
    .acknowledge-btn {
        background: var(--success-gradient);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: var(--border-radius-sm);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .acknowledge-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-medium);
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(warningStyles);

// Initialize blocking when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize website blocking
    blockWebsites();
    
    // Check for mobile environment
    if (isMobileApp()) {
        console.log('Running in mobile app environment');
    }
});

// Export functions
window.PermissionsManager = {
    grantPermissions,
    denyPermissions,
    requestAllPermissions,
    initializeBlockingSystem,
    logDistraction,
    getDistractionStats,
    enterFocusMode,
    exitFocusMode,
    blockMobileApps,
    unblockMobileApps
};
