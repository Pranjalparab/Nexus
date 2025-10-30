// FlowGenix Timer JavaScript

let timerInterval = null;
let currentTimerMinutes = 25;
let currentTimerSeconds = 0;
let isTimerRunning = false;
let isTimerPaused = false;
let originalTimerMinutes = 25;
let focusStartTime = null;
let cameraCheckInterval = null;

// Initialize timer when timer tab is shown
function initializeTimer() {
    setupProgressRing();
    updateTimerDisplay();
    updateTimerAnimation();
}

// Setup SVG progress ring
function setupProgressRing() {
    const progressRing = document.querySelector('.progress-ring-fill');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = circumference;
}

// Set timer duration
function setTimer(minutes) {
    if (isTimerRunning) {
        showNotification('Stop current timer before setting a new duration', 'warning');
        return;
    }
    
    currentTimerMinutes = minutes;
    currentTimerSeconds = 0;
    originalTimerMinutes = minutes;
    
    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateTimerDisplay();
    updateProgressRing();
    showNotification(`Timer set to ${minutes} minutes`, 'success');
}

// Toggle timer start/pause
function toggleTimer() {
    if (!isTimerRunning && !isTimerPaused) {
        startTimer();
    } else if (isTimerRunning) {
        pauseTimer();
    } else if (isTimerPaused) {
        resumeTimer();
    }
}

// Start timer
function startTimer() {
    if (currentTimerMinutes === 0 && currentTimerSeconds === 0) {
        showNotification('Please set a timer duration first', 'warning');
        return;
    }
    
    isTimerRunning = true;
    isTimerPaused = false;
    focusStartTime = Date.now();
    window.isTimerRunning = true;
    
    // Block apps if enabled
    if (document.getElementById('app-blocking').checked) {
        blockDistractingApps();
    }
    
    // Start camera verification if enabled
    if (document.getElementById('camera-verification').checked) {
        startCameraVerification();
    }
    
    // Update button
    const startPauseBtn = document.getElementById('start-pause-btn');
    startPauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    startPauseBtn.classList.remove('primary');
    startPauseBtn.classList.add('secondary');
    
    // Start countdown
    timerInterval = setInterval(() => {
        if (currentTimerSeconds === 0) {
            if (currentTimerMinutes === 0) {
                completeTimer();
                return;
            }
            currentTimerMinutes--;
            currentTimerSeconds = 59;
        } else {
            currentTimerSeconds--;
        }
        
        updateTimerDisplay();
        updateProgressRing();
        
        // Play tick sound (if enabled)
        playTickSound();
        
    }, 1000);
    
    // Add timer running class to body
    document.body.classList.add('timer-running');
    
    showNotification('Focus session started! Stay focused! 💪', 'success');
    
    // Add to history
    addToHistory('timer_start', `Started ${originalTimerMinutes} minute focus session`);
}

// Pause timer
function pauseTimer() {
    isTimerRunning = false;
    isTimerPaused = true;
    window.isTimerRunning = false;
    
    clearInterval(timerInterval);
    
    // Update button
    const startPauseBtn = document.getElementById('start-pause-btn');
    startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
    startPauseBtn.classList.remove('secondary');
    startPauseBtn.classList.add('primary');
    
    // Stop camera verification
    stopCameraVerification();
    
    showNotification('Focus session paused', 'info');
    
    // Add to history
    addToHistory('timer_pause', 'Focus session paused');
}

// Resume timer
function resumeTimer() {
    isTimerRunning = true;
    isTimerPaused = false;
    window.isTimerRunning = true;
    
    // Restart camera verification if enabled
    if (document.getElementById('camera-verification').checked) {
        startCameraVerification();
    }
    
    // Update button
    const startPauseBtn = document.getElementById('start-pause-btn');
    startPauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    startPauseBtn.classList.remove('primary');
    startPauseBtn.classList.add('secondary');
    
    // Resume countdown
    timerInterval = setInterval(() => {
        if (currentTimerSeconds === 0) {
            if (currentTimerMinutes === 0) {
                completeTimer();
                return;
            }
            currentTimerMinutes--;
            currentTimerSeconds = 59;
        } else {
            currentTimerSeconds--;
        }
        
        updateTimerDisplay();
        updateProgressRing();
        playTickSound();
        
    }, 1000);
    
    showNotification('Focus session resumed! Keep going! 🚀', 'success');
    
    // Add to history
    addToHistory('timer_resume', 'Focus session resumed');
}

// Reset timer
function resetTimer() {
    // Confirm if timer is running
    if (isTimerRunning || isTimerPaused) {
        if (!confirm('Are you sure you want to reset the timer? Your progress will be lost.')) {
            return;
        }
    }
    
    clearInterval(timerInterval);
    stopCameraVerification();
    
    isTimerRunning = false;
    isTimerPaused = false;
    window.isTimerRunning = false;
    
    currentTimerMinutes = originalTimerMinutes;
    currentTimerSeconds = 0;
    
    // Reset button
    const startPauseBtn = document.getElementById('start-pause-btn');
    startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Focus</span>';
    startPauseBtn.classList.remove('secondary');
    startPauseBtn.classList.add('primary');
    
    // Remove timer running class
    document.body.classList.remove('timer-running');
    
    // Unblock apps
    unblockDistractingApps();
    
    updateTimerDisplay();
    updateProgressRing();
    
    showNotification('Timer reset', 'info');
    
    // Add to history
    if (focusStartTime) {
        const sessionDuration = Math.floor((Date.now() - focusStartTime) / 1000 / 60);
        addToHistory('timer_reset', `Focus session reset after ${sessionDuration} minutes`);
    }
    
    focusStartTime = null;
}

// Complete timer
function completeTimer() {
    clearInterval(timerInterval);
    stopCameraVerification();
    
    isTimerRunning = false;
    isTimerPaused = false;
    window.isTimerRunning = false;
    
    const sessionDuration = originalTimerMinutes;
    const coinsEarned = Math.floor(sessionDuration / 5) * 10; // 10 coins per 5 minutes
    
    // Reset display
    currentTimerMinutes = originalTimerMinutes;
    currentTimerSeconds = 0;
    
    // Reset button
    const startPauseBtn = document.getElementById('start-pause-btn');
    startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Focus</span>';
    startPauseBtn.classList.remove('secondary');
    startPauseBtn.classList.add('primary');
    
    // Remove timer running class
    document.body.classList.remove('timer-running');
    
    // Unblock apps
    unblockDistractingApps();
    
    // Update stats
    updateUserCoins(coinsEarned, 'add');
    updateFocusStats(sessionDuration);
    
    updateTimerDisplay();
    updateProgressRing();
    
    // Show completion celebration
    showCompletionCelebration(sessionDuration, coinsEarned);
    
    // Play completion sound
    playCompletionSound();
    
    // Add to history
    addToHistory('timer_complete', `Completed ${sessionDuration} minute focus session. Earned ${coinsEarned} coins!`);
    
    // Show notification
    showNotification(`🎉 Focus session complete! You earned ${coinsEarned} coins!`, 'success');
}

// Update timer display
function updateTimerDisplay() {
    document.getElementById('timer-minutes').textContent = 
        currentTimerMinutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds').textContent = 
        currentTimerSeconds.toString().padStart(2, '0');
}

// Update progress ring
function updateProgressRing() {
    const progressRing = document.querySelector('.progress-ring-fill');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    
    const totalSeconds = originalTimerMinutes * 60;
    const currentSeconds = (currentTimerMinutes * 60) + currentTimerSeconds;
    const progress = (totalSeconds - currentSeconds) / totalSeconds;
    
    const strokeDashoffset = circumference - (progress * circumference);
    progressRing.style.strokeDashoffset = strokeDashoffset;
    
    // Update stroke color based on theme
    const themeColors = {
        kpop: '#ff6b9d',
        anime: '#667eea',
        car: '#ff7f50',
        music: '#a8edea'
    };
    
    progressRing.style.stroke = themeColors[currentTheme] || '#4facfe';
}

// Update timer animation based on theme
function updateTimerAnimation() {
    const focusAnimation = document.getElementById('focus-animation');
    focusAnimation.className = 'focus-animation';
    
    if (isTimerRunning || isTimerPaused) {
        focusAnimation.classList.add(currentTheme + '-active');
    }
}

// Block distracting apps (web version simulation)
function blockDistractingApps() {
    isAppBlocked = true;
    
    // Simulate app blocking by preventing certain actions
    const blockMessage = document.createElement('div');
    blockMessage.id = 'block-overlay';
    blockMessage.innerHTML = `
        <div class="block-message">
            <h2>🎯 Focus Mode Active</h2>
            <p>Stay focused! Distracting websites are blocked during your session.</p>
            <div class="blocked-sites">
                <span>📱 Social Media</span>
                <span>🎮 Games</span>
                <span>📺 Entertainment</span>
                <span>🛒 Shopping</span>
            </div>
        </div>
    `;
    
    blockMessage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: -1;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(blockMessage);
    
    // Block common distracting domains (simulation)
    const blockedSites = [
        'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com',
        'netflix.com', 'tiktok.com', 'reddit.com', 'gaming.com'
    ];
    
    // Add to history
    addToHistory('apps_blocked', `Blocked ${blockedSites.length} distracting sites`);
}

// Unblock apps
function unblockDistractingApps() {
    isAppBlocked = false;
    
    const blockOverlay = document.getElementById('block-overlay');
    if (blockOverlay) {
        blockOverlay.remove();
    }
    
    // Add to history
    addToHistory('apps_unblocked', 'Apps unblocked - session ended');
}

// Start camera verification
function startCameraVerification() {
    // Random intervals between 5-15 minutes
    const interval = (Math.random() * 10 + 5) * 60 * 1000;
    
    cameraCheckInterval = setTimeout(() => {
        if (isTimerRunning) {
            showCameraVerification();
            startCameraVerification(); // Schedule next check
        }
    }, interval);
}

// Stop camera verification
function stopCameraVerification() {
    if (cameraCheckInterval) {
        clearTimeout(cameraCheckInterval);
        cameraCheckInterval = null;
    }
}

// Show camera verification modal
function showCameraVerification() {
    document.getElementById('camera-modal').classList.add('show');
    
    // Start camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.getElementById('camera-video');
                video.srcObject = stream;
                video.stream = stream;
            })
            .catch(err => {
                console.log('Camera access denied:', err);
                showNotification('Camera access denied. Focus verification skipped.', 'warning');
                skipFocusCheck();
            });
    } else {
        showNotification('Camera not supported in this browser', 'error');
        skipFocusCheck();
    }
}

// Take focus verification photo
function takeFocusPhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Stop camera stream
    if (video.stream) {
        video.stream.getTracks().forEach(track => track.stop());
    }
    
    // Close modal
    document.getElementById('camera-modal').classList.remove('show');
    
    // Add to history
    addToHistory('focus_verified', 'Focus verification photo captured');
    
    showNotification('Focus verified! Keep up the great work! 📸', 'success');
}

// Skip focus check
function skipFocusCheck() {
    const video = document.getElementById('camera-video');
    
    // Stop camera stream if active
    if (video.stream) {
        video.stream.getTracks().forEach(track => track.stop());
    }
    
    // Close modal
    document.getElementById('camera-modal').classList.remove('show');
    
    // Add to history
    addToHistory('focus_skipped', 'Focus verification skipped');
    
    showNotification('Focus check skipped', 'info');
}

// Update focus statistics
function updateFocusStats(sessionMinutes) {
    const stats = JSON.parse(localStorage.getItem('flowgenix_stats') || '{}');
    
    // Update today's focus time
    const currentFocus = parseInt(stats.todayFocus) || 0;
    const newFocus = currentFocus + sessionMinutes;
    stats.todayFocus = newFocus + 'm';
    
    // Update streak
    const lastSessionDate = stats.lastSessionDate;
    const today = new Date().toDateString();
    
    if (lastSessionDate === today) {
        // Same day, don't change streak
    } else if (lastSessionDate === new Date(Date.now() - 86400000).toDateString()) {
        // Yesterday, increment streak
        stats.streak = (stats.streak || 0) + 1;
    } else {
        // Break in streak, reset to 1
        stats.streak = 1;
    }
    
    stats.lastSessionDate = today;
    stats.totalMinutes = (stats.totalMinutes || 0) + sessionMinutes;
    stats.totalSessions = (stats.totalSessions || 0) + 1;
    
    localStorage.setItem('flowgenix_stats', JSON.stringify(stats));
    
    // Update UI
    loadUserStats();
}

// Show completion celebration
function showCompletionCelebration(minutes, coins) {
    const celebration = document.createElement('div');
    celebration.className = 'completion-celebration';
    celebration.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">🎉</div>
            <h2>Session Complete!</h2>
            <div class="celebration-stats">
                <div class="celebration-stat">
                    <span class="stat-value">${minutes}</span>
                    <span class="stat-label">Minutes Focused</span>
                </div>
                <div class="celebration-stat">
                    <span class="stat-value">+${coins}</span>
                    <span class="stat-label">Coins Earned</span>
                </div>
            </div>
            <div class="celebration-message">
                You're building great focus habits! 🚀
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="celebration-close">
                Continue
            </button>
        </div>
        <div class="celebration-confetti"></div>
    `;
    
    celebration.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.5s ease;
    `;
    
    document.body.appendChild(celebration);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (celebration.parentElement) {
            celebration.remove();
        }
    }, 10000);
}

// Play tick sound (if audio enabled)
function playTickSound() {
    // Create subtle tick sound using Web Audio API
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Play completion sound
function playCompletionSound() {
    // Create completion chime
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Play a sequence of notes
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }
}

// Add celebration styles
const celebrationStyles = document.createElement('style');
celebrationStyles.textContent = `
    .celebration-content {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 40px;
        text-align: center;
        max-width: 400px;
        position: relative;
        z-index: 2;
        border: 2px solid var(--accent-green);
    }
    
    .celebration-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
    }
    
    .celebration-content h2 {
        color: var(--text-primary);
        margin-bottom: 30px;
        font-size: 2rem;
    }
    
    .celebration-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30px;
    }
    
    .celebration-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--accent-green);
        margin-bottom: 5px;
    }
    
    .stat-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .celebration-message {
        color: var(--text-primary);
        margin-bottom: 30px;
        font-size: 1.1rem;
    }
    
    .celebration-close {
        background: var(--accent-green);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: var(--border-radius-sm);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .celebration-close:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-medium);
    }
    
    .celebration-confetti {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }
    
    .celebration-confetti::before,
    .celebration-confetti::after {
        content: '🎉🎊✨🌟💫⭐';
        position: absolute;
        top: -10%;
        left: 0;
        width: 100%;
        height: 120%;
        font-size: 2rem;
        animation: confettiFall 3s linear infinite;
    }
    
    .celebration-confetti::after {
        animation-delay: -1.5s;
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(-100vh) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
    }
`;
document.head.appendChild(celebrationStyles);

// Export timer functions
window.TimerManager = {
    setTimer,
    toggleTimer,
    resetTimer,
    initializeTimer
};
