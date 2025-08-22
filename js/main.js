// Main JavaScript - Core Functionality
class LuluKitchen {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('luluCart')) || [];
        this.isVIP = JSON.parse(localStorage.getItem('luluVIP')) || false;
        this.loyaltyPoints = JSON.parse(localStorage.getItem('luluPoints')) || 0;
        this.language = localStorage.getItem('luluLanguage') || 'he';
        this.theme = localStorage.getItem('luluTheme') || 'light';
        
        this.deliveryZones = {
            'jerusalem': { name: 'ירושלים', fee: 40, minFree: 800 },
            'mevasseret': { name: 'מבשרת', fee: 40, minFree: 800 },
            'surroundings': { name: 'סביבות', fee: 40, minFree: 800 }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCartDisplay();
        this.loadLanguage();
        this.loadTheme();
        this.updateVIPStatus();
        this.updatePointsDisplay();
        this.createLanguageToggle();
        this.createThemeToggle();
        this.setupServiceWorker();
    }
    
    setupEventListeners() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                e.target.closest('.modal').style.display = 'none';
            }
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.style.display = 'none');
            }
        });
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterMenu(btn.dataset.filter);
            });
        });
        
        // Allergen filters
        const allergenFilters = document.querySelectorAll('.allergen-filters input');
        allergenFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyAllergenFilters();
            });
        });
        
        // Delivery options
        document.addEventListener('change', (e) => {
            if (e.target.name === 'delivery') {
                this.updateDeliveryFee(e.target.value);
            }
        });
    }
    
    // Cart Management
    addToCart(item, extras = []) {
        const cartItem = {
            id: this.generateUniqueId(item, extras),
            ...item,
            extras: extras,
            quantity: 1,
            totalPrice: this.calculateItemPrice(item, extras),
            addedAt: new Date()
        };
        
        const existingItem = this.cart.find(ci => ci.id === cartItem.id);
        if (existingItem) {
            existingItem.quantity++;
            existingItem.totalPrice = this.calculateItemPrice(item, extras) * existingItem.quantity;
        } else {
            this.cart.push(cartItem);
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showAddToCartFeedback(item.name_he);
        
        // Add loyalty points
        this.addLoyaltyPoints(cartItem.totalPrice);
    }
    
    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartDisplay();
    }
    
    updateQuantity(itemId, change) {
        const item = this.cart.find(ci => ci.id === itemId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                const basePrice = this.calculateItemPrice(
                    { price: item.price, price_discount: item.price_discount },
                    item.extras
                );
                item.totalPrice = basePrice * item.quantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }
    
    calculateItemPrice(item, extras = []) {
        const basePrice = item.price_discount || item.price;
        const extrasPrice = extras.reduce((sum, extra) => sum + (extra.price || 0), 0);
        return basePrice + extrasPrice;
    }
    
    generateUniqueId(item, extras) {
        const extrasString = extras.map(e => e.name).sort().join('|');
        return `${item.Id}_${btoa(extrasString).replace(/=/g, '')}`;
    }
    
    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
        
        if (cartItems) {
            cartItems.innerHTML = this.cart.length === 0 ? 
                this.getEmptyCartHTML() : 
                this.cart.map(item => this.getCartItemHTML(item)).join('');
        }
        
        if (cartTotal) {
            const total = this.calculateCartTotal();
            cartTotal.textContent = total.toFixed(2);
        }
        
        this.updateCartSummary();
    }
    
    calculateCartTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
        const vipDiscount = this.isVIP ? subtotal * 0.15 : 0;
        const deliveryFee = this.getDeliveryFee(subtotal - vipDiscount);
        return subtotal - vipDiscount + deliveryFee;
    }
    
    getDeliveryFee(total) {
        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        if (!selectedDelivery || selectedDelivery.value === 'pickup') return 0;
        
        // Free delivery for VIP or orders over ₪800
        if (this.isVIP || total >= 800) return 0;
        return 40;
    }
    
    // VIP Management
    joinVIP() {
        if (confirm('האם אתה בטוח שברצונך להצטרף למנוי VIP בעלות של ₪299 לחודש?')) {
            this.isVIP = true;
            localStorage.setItem('luluVIP', JSON.stringify(true));
            this.updateVIPStatus();
            this.updateCartDisplay();
            this.showNotification('ברוכים הבאים למועדון ה-VIP! תיהנו מ-15% הנחה על כל הזמנה!', 'success');
        }
    }
    
    updateVIPStatus() {
        const vipElements = document.querySelectorAll('.vip-status');
        vipElements.forEach(el => {
            el.textContent = this.isVIP ? '👑 חבר VIP' : '';
            el.style.display = this.isVIP ? 'block' : 'none';
        });
        
        if (this.isVIP) {
            document.body.classList.add('vip-member');
        }
    }
    
    // Loyalty Points
    addLoyaltyPoints(amount) {
        const points = Math.floor(amount); // ₪1 = 1 point
        this.loyaltyPoints += points;
        localStorage.setItem('luluPoints', JSON.stringify(this.loyaltyPoints));
        this.updatePointsDisplay();
    }
    
    redeemPoints(points) {
        if (this.loyaltyPoints >= points) {
            this.loyaltyPoints -= points;
            localStorage.setItem('luluPoints', JSON.stringify(this.loyaltyPoints));
            this.updatePointsDisplay();
            return points / 10; // 100 points = ₪10 discount
        }
        return 0;
    }
    
    updatePointsDisplay() {
        const pointsDisplay = document.getElementById('user-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = this.loyaltyPoints;
        }
    }
    
    // Language Management
    loadLanguage() {
        if (this.language === 'en') {
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
            document.body.classList.add('english');
        } else {
            document.documentElement.lang = 'he';
            document.documentElement.dir = 'rtl';
            document.body.classList.remove('english');
        }
    }
    
    toggleLanguage() {
        this.language = this.language === 'he' ? 'en' : 'he';
        localStorage.setItem('luluLanguage', this.language);
        this.loadLanguage();
        // Reload content with new language
        location.reload();
    }
    
    createLanguageToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'language-toggle';
        toggle.textContent = this.language === 'he' ? 'EN' : 'עב';
        toggle.onclick = () => this.toggleLanguage();
        document.body.appendChild(toggle);
    }
    
    // Theme Management
    loadTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('luluTheme', this.theme);
        document.body.classList.toggle('dark-mode');
    }
    
    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        toggle.onclick = () => {
            this.toggleTheme();
            toggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        };
        document.body.appendChild(toggle);
    }
    
    // Utility Functions
    saveCart() {
        localStorage.setItem('luluCart', JSON.stringify(this.cart));
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 50%;
            transform: translateX(50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 2001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    showAddToCartFeedback(itemName) {
        this.showNotification(`${itemName} נוסף לעגלה!`, 'success');
    }
    
    // PWA Setup
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    }
    
    // Modal Controls
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            // Focus management for accessibility
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
    
    // Helper HTML generators
    getEmptyCartHTML() {
        return `
            <div class="empty-cart">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
                <h3>העגלה שלך ריקה</h3>
                <p>הוסף מנות טעימות מהתפריט שלנו!</p>
                <button class="btn-primary" onclick="luluKitchen.closeModal('cart-modal')">המשך קנייה</button>
            </div>
        `;
    }
    
    getCartItemHTML(item) {
        const extrasText = item.extras.length > 0 ? 
            item.extras.map(e => e.name_he || e.name).join(', ') : '';
        
        return `
            <div class="cart-item">
                <img src="${item.imageUrl || '/images/placeholder.jpg'}" alt="${item.name_he}" loading="lazy">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name_he}</div>
                    ${extrasText ? `<div class="cart-item-extras">תוספות: ${extrasText}</div>` : ''}
                    <div class="cart-item-price">₪${item.totalPrice.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="luluKitchen.updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="luluKitchen.updateQuantity('${item.id}', 1)">+</button>
                    <button class="remove-item" onclick="luluKitchen.removeFromCart('${item.id}')">הסר</button>
                </div>
            </div>
        `;
    }
    
    updateCartSummary() {
        // Update floating cart summary
        let summary = document.querySelector('.cart-summary');
        if (!summary && this.cart.length > 0) {
            summary = document.createElement('div');
            summary.className = 'cart-summary';
            summary.onclick = () => this.openCart();
            document.body.appendChild(summary);
        }
        
        if (summary) {
            if (this.cart.length === 0) {
                summary.remove();
            } else {
                const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
                const total = this.calculateCartTotal();
                summary.innerHTML = `
                    🛒 ${itemCount} | ₪${total.toFixed(0)}
                `;
            }
        }
    }
}

// Global functions for backward compatibility
let luluKitchen;

document.addEventListener('DOMContentLoaded', () => {
    luluKitchen = new LuluKitchen();
    
    // Make functions globally available
    window.addToCart = (item, extras) => luluKitchen.addToCart(item, extras);
    window.removeFromCart = (id) => luluKitchen.removeFromCart(id);
    window.openCart = () => luluKitchen.openModal('cart-modal');
    window.closeCart = () => luluKitchen.closeModal('cart-modal');
    window.openModal = (id) => luluKitchen.openModal(id);
    window.closeModal = (id) => luluKitchen.closeModal(id);
    window.joinVIP = () => luluKitchen.joinVIP();
    window.proceedToCheckout = () => window.location.href = 'order.html';
    window.scrollToMenu = () => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    window.openVIP = () => luluKitchen.openModal('vip-modal');
});