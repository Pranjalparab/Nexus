// Coupon System Integration JavaScript
// This file demonstrates how to integrate the coupon system with any frontend application

class CouponSystemAPI {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.authToken = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // Authentication methods
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.access_token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.error };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Product methods
    async getProducts(theme = null, category = null) {
        try {
            let url = `${this.baseURL}/products`;
            const params = new URLSearchParams();
            if (theme) params.append('theme', theme);
            if (category) params.append('category', category);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            return response.ok ? { success: true, products: data.products } : { success: false, message: data.error };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    // Coupon methods
    async validateCoupon(couponCode, userId, cartItems) {
        try {
            const response = await fetch(`${this.baseURL}/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: couponCode,
                    user_id: userId,
                    cart_items: cartItems
                })
            });

            const data = await response.json();
            return {
                success: response.ok,
                valid: data.valid,
                message: data.message,
                coupon: data.coupon,
                discount: data.discount
            };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    async applyCoupon(couponCode, orderId, cartItems, originalAmount) {
        try {
            if (!this.authToken) {
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${this.baseURL}/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    code: couponCode,
                    order_id: orderId,
                    cart_items: cartItems,
                    original_amount: originalAmount
                })
            });

            const data = await response.json();
            return {
                success: data.success || response.ok,
                message: data.message,
                ...data
            };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    async getAvailableCoupons(theme = null, category = null) {
        try {
            let url = `${this.baseURL}/coupons`;
            const params = new URLSearchParams();
            if (theme) params.append('theme', theme);
            if (category) params.append('category', category);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            return response.ok ? { success: true, coupons: data.coupons } : { success: false, message: data.error };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }
}

// Application state
const api = new CouponSystemAPI();
let cart = [];
let appliedCoupon = null;
let currentDiscount = 0;

// UI Helper functions
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('couponMessage');
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

function formatPrice(price) {
    return `₹${price.toFixed(2)}`;
}

function generateOrderId() {
    return 'ORDER-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Authentication functions
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }

    const result = await api.login(username, password);
    
    if (result.success) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${result.user.username}!`;
        showMessage(`Logged in successfully as ${result.user.username}`, 'success');
        loadAvailableCoupons(); // Reload coupons for authenticated user
    } else {
        alert(`Login failed: ${result.message}`);
    }
}

function logout() {
    api.logout();
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('hidden');
    appliedCoupon = null;
    currentDiscount = 0;
    updateOrderSummary();
    showMessage('Logged out successfully', 'success');
    loadAvailableCoupons(); // Reload coupons for guest user
}

// Product functions
async function loadProducts() {
    const result = await api.getProducts();
    
    if (result.success) {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';
        
        result.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-theme theme-${product.theme.toLowerCase()}">${product.theme}</div>
                <h3>${product.name}</h3>
                <p style="font-size: 0.9rem; color: #666; margin: 8px 0;">${product.description}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div style="margin: 8px 0; font-size: 0.8rem; color: #888;">
                    Category: ${product.category} | Stock: ${product.stock_quantity}
                </div>
                <button class="btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.theme}', '${product.category}')">
                    Add to Cart
                </button>
            `;
            productsGrid.appendChild(productCard);
        });
    } else {
        showMessage(`Failed to load products: ${result.message}`, 'error');
    }
}

// Cart functions
function addToCart(productId, name, price, theme, category) {
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            name: name,
            price: price,
            theme: theme,
            category: category,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    updateOrderSummary();
    
    // Re-validate coupon if one is applied
    if (appliedCoupon) {
        validateCurrentCoupon();
    }
    
    showMessage(`${name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    updateCartDisplay();
    updateOrderSummary();
    
    // Re-validate coupon if one is applied
    if (appliedCoupon) {
        validateCurrentCoupon();
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        return;
    }
    
    let cartHTML = '';
    cart.forEach(item => {
        cartHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.theme} - ${item.category}</small><br>
                    <small>Quantity: ${item.quantity} × ${formatPrice(item.price)}</small>
                </div>
                <div>
                    <span style="margin-right: 10px;">${formatPrice(item.price * item.quantity)}</span>
                    <button class="btn btn-danger" onclick="removeFromCart(${item.product_id})">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = cartHTML;
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Coupon functions
async function validateCurrentCoupon() {
    if (!appliedCoupon || cart.length === 0) return;
    
    const result = await api.validateCoupon(
        appliedCoupon.code, 
        api.currentUser?.id, 
        cart
    );
    
    if (result.success && result.valid) {
        currentDiscount = result.discount.discount_amount;
        showMessage(`Coupon ${appliedCoupon.code} is still valid! Discount: ${formatPrice(currentDiscount)}`, 'success');
    } else {
        appliedCoupon = null;
        currentDiscount = 0;
        showMessage(`Coupon is no longer valid: ${result.message}`, 'error');
    }
    
    updateOrderSummary();
}

async function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.trim().toUpperCase();
    
    if (!couponCode) {
        showMessage('Please enter a coupon code', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Please add items to your cart first', 'error');
        return;
    }
    
    // First validate the coupon
    const validationResult = await api.validateCoupon(couponCode, api.currentUser?.id, cart);
    
    if (validationResult.success && validationResult.valid) {
        appliedCoupon = {
            code: couponCode,
            ...validationResult.coupon
        };
        currentDiscount = validationResult.discount.discount_amount;
        
        updateOrderSummary();
        showMessage(
            `✅ Coupon applied successfully! You saved ${formatPrice(currentDiscount)}`, 
            'success'
        );
        
        // Clear the input
        document.getElementById('couponCode').value = '';
    } else {
        showMessage(`❌ ${validationResult.message}`, 'error');
    }
}

function removeCoupon() {
    appliedCoupon = null;
    currentDiscount = 0;
    updateOrderSummary();
    showMessage('Coupon removed', 'success');
}

function applyCouponFromList(couponCode) {
    document.getElementById('couponCode').value = couponCode;
    applyCoupon();
}

async function loadAvailableCoupons() {
    const result = await api.getAvailableCoupons();
    
    if (result.success) {
        const couponsContainer = document.getElementById('availableCoupons');
        couponsContainer.innerHTML = '';
        
        if (result.coupons.length === 0) {
            couponsContainer.innerHTML = '<p>No coupons available at the moment.</p>';
            return;
        }
        
        result.coupons.forEach(coupon => {
            const couponCard = document.createElement('div');
            couponCard.className = 'coupon-card';
            couponCard.onclick = () => applyCouponFromList(coupon.code);
            
            let discountText = '';
            switch(coupon.coupon_type) {
                case 'PERCENTAGE':
                    discountText = `${coupon.discount_value}% off`;
                    break;
                case 'FIXED_AMOUNT':
                    discountText = `₹${coupon.discount_value} off`;
                    break;
                case 'FREE_SHIPPING':
                    discountText = 'Free shipping';
                    break;
                case 'BUY_ONE_GET_ONE':
                    discountText = 'Buy one get one';
                    break;
            }
            
            couponCard.innerHTML = `
                <div class="coupon-code">${coupon.code}</div>
                <div class="coupon-description">${coupon.name}</div>
                <div style="font-size: 0.8rem; color: #28a745; margin-top: 5px;">
                    ${discountText}
                    ${coupon.min_purchase_amount ? ` (Min: ₹${coupon.min_purchase_amount})` : ''}
                </div>
                <div style="font-size: 0.7rem; color: #666; margin-top: 5px;">
                    ${coupon.usage_count}/${coupon.usage_limit || '∞'} used
                </div>
            `;
            
            couponsContainer.appendChild(couponCard);
        });
    } else {
        showMessage(`Failed to load coupons: ${result.message}`, 'error');
    }
}

// Order summary functions
function updateOrderSummary() {
    const subtotal = getCartTotal();
    const discount = currentDiscount;
    const total = Math.max(0, subtotal - discount);
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('discount').textContent = formatPrice(discount);
    document.getElementById('total').textContent = formatPrice(total);
    
    // Show applied coupon info
    if (appliedCoupon) {
        const discountRow = document.querySelector('#discount').parentElement;
        discountRow.innerHTML = `
            <span>Discount (${appliedCoupon.code}):</span>
            <span>
                -${formatPrice(discount)}
                <button class="btn btn-danger" onclick="removeCoupon()" style="margin-left: 10px; padding: 2px 6px; font-size: 0.7rem;">
                    Remove
                </button>
            </span>
        `;
    }
}

// Checkout function
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const subtotal = getCartTotal();
    const total = Math.max(0, subtotal - currentDiscount);
    
    // If user is logged in and has a coupon, apply it through the API
    if (api.currentUser && appliedCoupon) {
        const orderId = generateOrderId();
        const result = await api.applyCoupon(appliedCoupon.code, orderId, cart, subtotal);
        
        if (result.success) {
            alert(`🎉 Order placed successfully!\n\nOrder ID: ${orderId}\nOriginal Amount: ${formatPrice(subtotal)}\nDiscount Applied: ${formatPrice(result.discount_applied)}\nFinal Amount: ${formatPrice(result.final_amount)}\n\nThank you for your purchase!`);
            
            // Clear cart and coupon
            cart = [];
            appliedCoupon = null;
            currentDiscount = 0;
            
            updateCartDisplay();
            updateOrderSummary();
            document.getElementById('couponCode').value = '';
        } else {
            alert(`Failed to apply coupon during checkout: ${result.message}`);
        }
    } else {
        // Simple checkout without coupon application
        alert(`🛍️ Order placed successfully!\n\nTotal: ${formatPrice(total)}\n\nThank you for your purchase!`);
        
        // Clear cart
        cart = [];
        updateCartDisplay();
        updateOrderSummary();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (api.currentUser) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${api.currentUser.username}!`;
    }
    
    // Load initial data
    loadProducts();
    loadAvailableCoupons();
    updateOrderSummary();
    
    // Set up coupon code input to uppercase
    document.getElementById('couponCode').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});

// Export for use in other applications
window.CouponSystemAPI = CouponSystemAPI;
