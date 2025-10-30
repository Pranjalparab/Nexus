// FlowGenix Authentication JavaScript

// Switch between login and register forms
function switchToRegister() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateEmail(email)) {
        showAuthError('Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user exists (simulate)
        const existingUsers = JSON.parse(localStorage.getItem('flowgenix_users') || '{}');
        
        if (existingUsers[email] && existingUsers[email].password === password) {
            // Successful login
            const user = {
                email: email,
                name: existingUsers[email].name,
                loginTime: new Date().toISOString(),
                permissionsGranted: existingUsers[email].permissionsGranted || false
            };
            
            // Save user session
            localStorage.setItem('flowgenix_user', JSON.stringify(user));
            currentUser = user;
            
            // Initialize user history
            addToHistory('login', `Logged in as ${user.name}`);
            
            // Show success and transition to main app
            showAuthSuccess('Welcome back! Redirecting to your dashboard...');
            
            setTimeout(() => {
                showMainApp();
            }, 1500);
            
        } else {
            throw new Error('Invalid email or password');
        }
        
    } catch (error) {
        showAuthError(error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Handle register form submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (name.length < 2) {
        showAuthError('Name must be at least 2 characters');
        return;
    }
    
    if (!validateEmail(email)) {
        showAuthError('Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Simulate registration delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('flowgenix_users') || '{}');
        
        if (existingUsers[email]) {
            throw new Error('An account with this email already exists');
        }
        
        // Create new user
        const newUser = {
            name: name,
            password: password, // In real app, this would be hashed
            registrationDate: new Date().toISOString(),
            permissionsGranted: false
        };
        
        // Save user to storage
        existingUsers[email] = newUser;
        localStorage.setItem('flowgenix_users', JSON.stringify(existingUsers));
        
        // Create user session
        const user = {
            email: email,
            name: name,
            loginTime: new Date().toISOString(),
            permissionsGranted: false
        };
        
        localStorage.setItem('flowgenix_user', JSON.stringify(user));
        currentUser = user;
        
        // Initialize user stats
        const initialStats = {
            todayFocus: '0m',
            streak: 0,
            totalRewards: 0,
            coins: 250,
            joinDate: new Date().toISOString()
        };
        localStorage.setItem('flowgenix_stats', JSON.stringify(initialStats));
        
        // Initialize user history
        addToHistory('register', `Account created for ${name}`);
        
        // Show success and transition to main app
        showAuthSuccess('Account created successfully! Welcome to FlowGenix!');
        
        setTimeout(() => {
            showMainApp();
        }, 1500);
        
    } catch (error) {
        showAuthError(error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show authentication error
function showAuthError(message) {
    // Remove existing error
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    // Style the error
    errorElement.style.cssText = `
        background: rgba(255, 107, 157, 0.1);
        border: 1px solid #ff6b9d;
        color: #ff6b9d;
        padding: 10px 15px;
        border-radius: 8px;
        margin: 15px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: shake 0.5s ease-in-out;
    `;
    
    // Insert error before submit button
    const activeForm = document.querySelector('.auth-form.active');
    const submitBtn = activeForm.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorElement, submitBtn);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorElement.parentElement) {
            errorElement.remove();
        }
    }, 5000);
}

// Show authentication success
function showAuthSuccess(message) {
    // Remove existing messages
    const existingError = document.querySelector('.auth-error');
    const existingSuccess = document.querySelector('.auth-success');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
    
    // Create success element
    const successElement = document.createElement('div');
    successElement.className = 'auth-success';
    successElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Style the success
    successElement.style.cssText = `
        background: rgba(67, 233, 123, 0.1);
        border: 1px solid #43e97b;
        color: #43e97b;
        padding: 10px 15px;
        border-radius: 8px;
        margin: 15px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.5s ease-in-out;
    `;
    
    // Insert success before submit button
    const activeForm = document.querySelector('.auth-form.active');
    const submitBtn = activeForm.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(successElement, submitBtn);
}

// Add to user history
function addToHistory(action, description) {
    const history = JSON.parse(localStorage.getItem('flowgenix_history') || '[]');
    const historyEntry = {
        id: Date.now(),
        action: action,
        description: description,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(historyEntry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
        history.splice(100);
    }
    
    localStorage.setItem('flowgenix_history', JSON.stringify(history));
}

// Logout function
function logout() {
    // Add logout to history
    if (currentUser) {
        addToHistory('logout', `${currentUser.name} logged out`);
    }
    
    // Clear user session
    localStorage.removeItem('flowgenix_user');
    currentUser = null;
    
    // Show auth container
    showAuthContainer();
    
    // Reset forms
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    switchToLogin();
    
    // Clear any existing messages
    const messages = document.querySelectorAll('.auth-error, .auth-success');
    messages.forEach(msg => msg.remove());
    
    showNotification('You have been logged out', 'info');
}

// Social login functions (placeholders for future implementation)
function loginWithGoogle() {
    showNotification('Google login will be available soon!', 'info');
}

function loginWithApple() {
    showNotification('Apple login will be available soon!', 'info');
}

// Add shake animation for errors
const authStyles = document.createElement('style');
authStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .auth-form button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .auth-form input:invalid {
        border-color: #ff6b9d;
    }
    
    .auth-form input:valid {
        border-color: #43e97b;
    }
`;
document.head.appendChild(authStyles);

// Auto-fill demo credentials (for development)
function fillDemoCredentials() {
    document.getElementById('login-email').value = 'demo@flowgenix.com';
    document.getElementById('login-password').value = 'demo123';
    showNotification('Demo credentials filled!', 'info');
}

// Add demo button (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
        const demoBtn = document.createElement('button');
        demoBtn.textContent = '🎯 Demo Login';
        demoBtn.type = 'button';
        demoBtn.onclick = fillDemoCredentials;
        demoBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--accent-purple);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            cursor: pointer;
            z-index: 10000;
        `;
        document.body.appendChild(demoBtn);
        
        // Create demo user if doesn't exist
        const users = JSON.parse(localStorage.getItem('flowgenix_users') || '{}');
        if (!users['demo@flowgenix.com']) {
            users['demo@flowgenix.com'] = {
                name: 'Demo User',
                password: 'demo123',
                registrationDate: new Date().toISOString(),
                permissionsGranted: true
            };
            localStorage.setItem('flowgenix_users', JSON.stringify(users));
        }
    }, 1000);
}

// Password strength indicator
function checkPasswordStrength(password) {
    let strength = 0;
    const indicators = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(indicators).filter(Boolean).length;
    
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ff6b9d', '#ffa726', '#ffeb3b', '#43e97b', '#4facfe'];
    
    return {
        level: strengthLevels[strength - 1] || 'Very Weak',
        color: strengthColors[strength - 1] || '#ff6b9d',
        score: strength
    };
}

// Add password strength indicator to register form
document.getElementById('register-password').addEventListener('input', function(e) {
    const password = e.target.value;
    
    // Remove existing indicator
    const existingIndicator = document.querySelector('.password-strength');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (password.length > 0) {
        const strength = checkPasswordStrength(password);
        
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        indicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${strength.score * 20}%; background: ${strength.color}"></div>
            </div>
            <span style="color: ${strength.color}; font-size: 0.8rem;">${strength.level}</span>
        `;
        
        indicator.style.cssText = `
            margin-top: -10px;
            margin-bottom: 15px;
        `;
        
        const strengthBarStyle = `
            .strength-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            .strength-fill {
                height: 100%;
                transition: width 0.3s ease, background 0.3s ease;
                border-radius: 2px;
            }
        `;
        
        if (!document.getElementById('strength-bar-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'strength-bar-styles';
            styleSheet.textContent = strengthBarStyle;
            document.head.appendChild(styleSheet);
        }
        
        e.target.parentNode.insertAdjacentElement('afterend', indicator);
    }
});

// Export auth functions
window.AuthManager = {
    logout,
    validateEmail,
    switchToLogin,
    switchToRegister,
    fillDemoCredentials
};
