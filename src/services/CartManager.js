// Advanced Cart Management System
class CartManager {
    constructor() {
        this.cart = [];
        this.deliveryFee = 40;
        this.freeDeliveryThreshold = 800;
        this.vipDiscountPercent = 15;
        this.loadCartFromStorage();
        this.bindEvents();
    }

    // Add item to cart with extras
    addToCart(dish, extras = [], quantity = 1, specialInstructions = '') {
        const cartItem = {
            uniqueId: this.generateUniqueId(),
            dish: { ...dish },
            extras: extras.map(extra => ({ ...extra })),
            quantity: quantity,
            specialInstructions: specialInstructions,
            basePrice: dish.price,
            extrasPrice: extras.reduce((sum, extra) => sum + extra.price, 0),
            totalPrice: (dish.price + extras.reduce((sum, extra) => sum + extra.price, 0)) * quantity,
            addedAt: new Date().toISOString()
        };

        this.cart.push(cartItem);
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showNotification('notify.addedToCart');
        
        // Trigger cart updated event
        this.triggerCartEvent('itemAdded', cartItem);
        
        return cartItem;
    }

    // Remove item from cart
    removeFromCart(uniqueId) {
        const itemIndex = this.cart.findIndex(item => item.uniqueId === uniqueId);
        if (itemIndex > -1) {
            const removedItem = this.cart.splice(itemIndex, 1)[0];
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.showNotification('notify.removedFromCart');
            this.triggerCartEvent('itemRemoved', removedItem);
            return removedItem;
        }
        return null;
    }

    // Update item quantity
    updateQuantity(uniqueId, newQuantity) {
        const item = this.cart.find(item => item.uniqueId === uniqueId);
        if (item && newQuantity > 0) {
            const oldQuantity = item.quantity;
            item.quantity = newQuantity;
            item.totalPrice = (item.basePrice + item.extrasPrice) * newQuantity;
            
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.triggerCartEvent('quantityChanged', { item, oldQuantity, newQuantity });
            return item;
        } else if (item && newQuantity <= 0) {
            return this.removeFromCart(uniqueId);
        }
        return null;
    }

    // Clear entire cart
    clearCart() {
        const clearedItems = [...this.cart];
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.triggerCartEvent('cartCleared', clearedItems);
    }

    // Get cart summary
    getCartSummary() {
        const itemsCount = this.cart.length;
        const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Check VIP status
        const isVIP = this.checkVIPStatus();
        const vipDiscount = isVIP ? (subtotal * this.vipDiscountPercent / 100) : 0;
        const discountedSubtotal = subtotal - vipDiscount;
        
        // Calculate delivery
        const deliveryFee = this.getDeliveryFee(discountedSubtotal);
        const total = discountedSubtotal + deliveryFee;
        
        // Calculate free delivery progress
        const freeDeliveryProgress = this.freeDeliveryThreshold - discountedSubtotal;
        const needsForFreeDelivery = freeDeliveryProgress > 0 ? freeDeliveryProgress : 0;

        return {
            itemsCount,
            totalQuantity,
            subtotal,
            vipDiscount,
            discountedSubtotal,
            deliveryFee,
            total,
            needsForFreeDelivery,
            isVIP,
            isEmpty: itemsCount === 0,
            hasDelivery: deliveryFee > 0
        };
    }

    // Check if user qualifies for VIP
    checkVIPStatus() {
        // Check localStorage for VIP status
        const vipStatus = localStorage.getItem('lulu-kitchen-vip');
        if (vipStatus === 'true') return true;
        
        // Check order history for auto-VIP qualification
        const orderHistory = this.getOrderHistory();
        const totalOrders = orderHistory.length;
        const totalSpent = orderHistory.reduce((sum, order) => sum + order.total, 0);
        
        // Auto-VIP qualification: 3+ orders OR ₪1500+ spent
        if (totalOrders >= 3 || totalSpent >= 1500) {
            this.setVIPStatus(true);
            return true;
        }
        
        return false;
    }

    // Set VIP status
    setVIPStatus(isVIP) {
        localStorage.setItem('lulu-kitchen-vip', isVIP.toString());
        if (isVIP) {
            this.showNotification('vip.welcome');
            this.triggerCartEvent('vipStatusChanged', { isVIP: true });
        }
        this.updateCartDisplay();
    }

    // Get delivery fee
    getDeliveryFee(subtotal) {
        const isVIP = this.checkVIPStatus();
        const threshold = isVIP ? 600 : this.freeDeliveryThreshold; // VIP gets free delivery at ₪600
        
        const deliveryMethod = this.getDeliveryMethod();
        if (deliveryMethod === 'pickup') return 0;
        
        return subtotal >= threshold ? 0 : this.deliveryFee;
    }

    // Get delivery method from form
    getDeliveryMethod() {
        const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        return deliveryRadio ? deliveryRadio.value : 'delivery';
    }

    // Generate upsell suggestions
    getUpsellSuggestions() {
        const summary = this.getCartSummary();
        const suggestions = [];

        // If cart is empty, suggest popular items
        if (summary.isEmpty) {
            return this.getPopularItems(3);
        }

        // If no drinks, suggest drinks
        const hasDrinks = this.cart.some(item => 
            item.dish.category === 'drink'
        );
        if (!hasDrinks) {
            suggestions.push(...this.getSuggestedDrinks(2));
        }

        // If only one main dish, suggest complementary items
        const mainDishes = this.cart.filter(item => 
            item.dish.category === 'main'
        );
        if (mainDishes.length === 1) {
            suggestions.push(...this.getComplementaryItems(mainDishes[0].dish, 2));
        }

        // If close to free delivery, suggest cheap additions
        if (summary.needsForFreeDelivery > 0 && summary.needsForFreeDelivery <= 50) {
            suggestions.push(...this.getCheapAdditions(summary.needsForFreeDelivery, 2));
        }

        return suggestions.slice(0, 4); // Max 4 suggestions
    }

    // Get suggested drinks
    getSuggestedDrinks(limit = 2) {
        // This would normally come from menu data
        return [
            { name: 'תה ירוק', price: 15, category: 'drink' },
            { name: 'קוקה קולה', price: 12, category: 'drink' }
        ].slice(0, limit);
    }

    // Get complementary items
    getComplementaryItems(mainDish, limit = 2) {
        // Suggest rice/noodles with main dishes
        const complementary = [
            { name: 'אורז לבן מאודה', price: 18, category: 'rice' },
            { name: 'אטריות אודון', price: 22, category: 'noodles' }
        ];
        return complementary.slice(0, limit);
    }

    // Get cheap additions for free delivery
    getCheapAdditions(maxPrice, limit = 2) {
        const cheap = [
            { name: 'ביצה רולס', price: 25, category: 'starter' },
            { name: 'מרק חם', price: 20, category: 'soup' }
        ].filter(item => item.price <= maxPrice);
        return cheap.slice(0, limit);
    }

    // Get popular items
    getPopularItems(limit = 3) {
        return [
            { name: 'עוף קונג פאו', price: 65, category: 'main', isPopular: true },
            { name: 'חזיר מתוק חמוץ', price: 72, category: 'main', isPopular: true },
            { name: 'אטריות מוקפצות', price: 45, category: 'noodles', isPopular: true }
        ].slice(0, limit);
    }

    // Generate unique ID for cart items
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Save cart to localStorage
    saveCartToStorage() {
        try {
            localStorage.setItem('lulu-kitchen-cart', JSON.stringify(this.cart));
        } catch (error) {
            console.warn('Could not save cart to localStorage:', error);
        }
    }

    // Load cart from localStorage
    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('lulu-kitchen-cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
                // Clean up old cart items (older than 24 hours)
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                this.cart = this.cart.filter(item => item.addedAt > oneDayAgo);
                this.saveCartToStorage();
            }
        } catch (error) {
            console.warn('Could not load cart from localStorage:', error);
            this.cart = [];
        }
    }

    // Get order history
    getOrderHistory() {
        try {
            const history = localStorage.getItem('lulu-kitchen-orders');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.warn('Could not load order history:', error);
            return [];
        }
    }

    // Add completed order to history
    addToOrderHistory(order) {
        try {
            const history = this.getOrderHistory();
            history.push({
                ...order,
                completedAt: new Date().toISOString()
            });
            
            // Keep only last 50 orders
            const recentHistory = history.slice(-50);
            localStorage.setItem('lulu-kitchen-orders', JSON.stringify(recentHistory));
        } catch (error) {
            console.warn('Could not save order to history:', error);
        }
    }

    // Update cart display in UI
    updateCartDisplay() {
        const summary = this.getCartSummary();
        
        // Update cart count in header
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = summary.totalQuantity;
        }

        // Update cart modal content
        this.updateCartModal(summary);
        
        // Update cart badge visibility
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.toggle('has-items', !summary.isEmpty);
        }
    }

    // Update cart modal
    updateCartModal(summary) {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (cartItemsContainer) {
            if (summary.isEmpty) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart">
                        <p data-translate="cart.empty">${window.i18n?.t('cart.empty') || 'העגלה ריקה'}</p>
                    </div>
                `;
            } else {
                cartItemsContainer.innerHTML = this.cart.map(item => 
                    this.generateCartItemHTML(item)
                ).join('');
            }
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = summary.total;
        }

        // Update delivery progress
        this.updateDeliveryProgress(summary);
        
        // Update upsell suggestions
        this.updateUpsellSuggestions();
    }

    // Generate HTML for cart item
    generateCartItemHTML(item) {
        const dishName = window.i18n ? window.i18n.getDishName(item.dish) : item.dish.nameHe;
        const extrasText = item.extras.length > 0 
            ? item.extras.map(extra => extra.name).join(', ')
            : '';

        return `
            <div class="cart-item" data-item-id="${item.uniqueId}">
                <div class="item-image">
                    <img src="${item.dish.image}" alt="${dishName}" loading="lazy">
                </div>
                <div class="item-details">
                    <h4 class="item-name">${dishName}</h4>
                    ${extrasText ? `<p class="item-extras">${extrasText}</p>` : ''}
                    <div class="item-price">
                        <span class="base-price">₪${item.basePrice}</span>
                        ${item.extrasPrice > 0 ? `<span class="extras-price">+₪${item.extrasPrice}</span>` : ''}
                    </div>
                </div>
                <div class="item-quantity">
                    <button class="qty-btn" onclick="cart.updateQuantity('${item.uniqueId}', ${item.quantity - 1})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="cart.updateQuantity('${item.uniqueId}', ${item.quantity + 1})">+</button>
                </div>
                <div class="item-total">₪${item.totalPrice}</div>
                <button class="remove-item" onclick="cart.removeFromCart('${item.uniqueId}')" title="הסר מהעגלה">🗑️</button>
            </div>
        `;
    }

    // Update delivery progress bar
    updateDeliveryProgress(summary) {
        const progressContainer = document.querySelector('.delivery-progress');
        if (!progressContainer) return;

        if (summary.needsForFreeDelivery > 0) {
            const progressPercent = Math.min(100, 
                ((this.freeDeliveryThreshold - summary.needsForFreeDelivery) / this.freeDeliveryThreshold) * 100
            );
            
            progressContainer.innerHTML = `
                <div class="progress-text">
                    <span data-translate="cart.freeDeliveryProgress" data-translate-params='{"amount": "${summary.needsForFreeDelivery}"}'>
                        עוד ₪${summary.needsForFreeDelivery} למשלוח חינם
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            `;
        } else {
            progressContainer.innerHTML = `
                <div class="free-delivery-achieved">
                    <span data-translate="cart.freeDelivery">🚚 משלוח חינם!</span>
                </div>
            `;
        }
    }

    // Update upsell suggestions
    updateUpsellSuggestions() {
        const upsellContainer = document.querySelector('.upsell-section');
        if (!upsellContainer) return;

        const suggestions = this.getUpsellSuggestions();
        if (suggestions.length === 0) {
            upsellContainer.style.display = 'none';
            return;
        }

        upsellContainer.style.display = 'block';
        upsellContainer.innerHTML = `
            <h4>המלצות בשבילך:</h4>
            <div class="upsell-items">
                ${suggestions.map(suggestion => `
                    <div class="upsell-item">
                        <span class="suggestion-name">${suggestion.name}</span>
                        <span class="suggestion-price">₪${suggestion.price}</span>
                        <button class="btn-small" onclick="cart.addSuggestionToCart('${suggestion.id || suggestion.name}')">
                            הוסף
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Bind events
    bindEvents() {
        // Listen for delivery method changes
        document.addEventListener('change', (e) => {
            if (e.target.name === 'delivery') {
                this.updateCartDisplay();
            }
        });

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            this.updateCartDisplay();
        });
    }

    // Trigger cart events
    triggerCartEvent(eventName, data) {
        window.dispatchEvent(new CustomEvent(`cart${eventName}`, {
            detail: data
        }));
    }

    // Show notification
    showNotification(messageKey) {
        const message = window.i18n ? window.i18n.t(messageKey) : messageKey;
        
        // Simple notification - can be enhanced with a toast library
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize global cart manager
window.cart = new CartManager();

// Initialize cart display when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cart.updateCartDisplay();
    });
} else {
    window.cart.updateCartDisplay();
}