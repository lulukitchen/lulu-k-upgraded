// Advanced Cart Management System
class CartManager {
    constructor() {
        this.cart = Utils.loadFromStorage('luluCart', []);
        this.deliveryZone = Utils.loadFromStorage('luluDeliveryZone', 'jerusalem');
        this.deliveryMethod = Utils.loadFromStorage('luluDeliveryMethod', 'delivery');
        this.appliedCoupons = Utils.loadFromStorage('luluCoupons', []);
        
        this.deliveryZones = {
            jerusalem: { name: 'ירושלים', fee: 40, minFree: 800, estimatedTime: '45-60 דקות' },
            mevasseret: { name: 'מבשרת ציון', fee: 40, minFree: 800, estimatedTime: '50-65 דקות' },
            surroundings: { name: 'סביבות ירושלים', fee: 40, minFree: 800, estimatedTime: '60-75 דקות' }
        };
        
        this.coupons = {
            'FIRST10': { discount: 10, type: 'amount', minOrder: 50, description: 'הנחה ללקוח חדש' },
            'VIP15': { discount: 15, type: 'percent', minOrder: 0, description: 'הנחת VIP' },
            'FAMILY20': { discount: 20, type: 'amount', minOrder: 200, description: 'הנחה משפחתית' }
        };
        
        this.init();
    }
    
    init() {
        this.updateCartDisplay();
        this.setupCartModal();
        this.setupDeliveryOptions();
    }
    
    addToCart(item, extras = [], quantity = 1) {
        const cartItem = {
            id: this.generateUniqueId(item, extras),
            ...item,
            extras: extras,
            quantity: quantity,
            basePrice: item.price_discount || item.price,
            extrasPrice: extras.reduce((sum, extra) => sum + (extra.price || 0), 0),
            totalPrice: (item.price_discount || item.price + extras.reduce((sum, extra) => sum + (extra.price || 0), 0)) * quantity,
            addedAt: new Date().toISOString()
        };
        
        const existingItemIndex = this.cart.findIndex(ci => ci.id === cartItem.id);
        
        if (existingItemIndex >= 0) {
            // Update existing item
            this.cart[existingItemIndex].quantity += quantity;
            this.cart[existingItemIndex].totalPrice = 
                (this.cart[existingItemIndex].basePrice + this.cart[existingItemIndex].extrasPrice) * 
                this.cart[existingItemIndex].quantity;
        } else {
            // Add new item
            this.cart.push(cartItem);
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showAddToCartFeedback(item.name_he, quantity);
        
        // Track analytics
        Utils.trackEvent('add_to_cart', {
            item_id: item.Id,
            item_name: item.name_he,
            quantity: quantity,
            value: cartItem.totalPrice
        });
        
        return cartItem;
    }
    
    removeFromCart(itemId) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
            const removedItem = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.updateCartDisplay();
            
            Utils.trackEvent('remove_from_cart', {
                item_id: removedItem.Id,
                item_name: removedItem.name_he,
                quantity: removedItem.quantity
            });
            
            Utils.showNotification(`${removedItem.name_he} הוסר מהעגלה`, 'info');
        }
    }
    
    updateQuantity(itemId, change) {
        const item = this.cart.find(ci => ci.id === itemId);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            this.removeFromCart(itemId);
        } else {
            item.quantity = newQuantity;
            item.totalPrice = (item.basePrice + item.extrasPrice) * item.quantity;
            this.saveCart();
            this.updateCartDisplay();
        }
    }
    
    clearCart() {
        if (confirm('האם אתה בטוח שברצונך לרוקן את העגלה?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
            Utils.showNotification('העגלה רוקנה', 'info');
        }
    }
    
    generateUniqueId(item, extras) {
        const extrasString = extras.map(e => e.id || e.name).sort().join('|');
        const baseId = `${item.Id}_${btoa(extrasString).replace(/=/g, '')}`;
        return baseId.substring(0, 50); // Limit length
    }
    
    calculateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // VIP Discount
        const vipDiscount = luluKitchen?.isVIP ? subtotal * 0.15 : 0;
        
        // Apply coupons
        const couponDiscount = this.calculateCouponDiscount(subtotal);
        
        // Loyalty points discount
        const loyaltyDiscount = this.calculateLoyaltyDiscount();
        
        const totalDiscounts = vipDiscount + couponDiscount + loyaltyDiscount;
        const afterDiscounts = Math.max(subtotal - totalDiscounts, 0);
        
        // Delivery fee
        const deliveryFee = this.calculateDeliveryFee(afterDiscounts);
        
        // Calculate points earned (₪1 = 1 point)
        const pointsEarned = Math.floor(afterDiscounts + deliveryFee);
        
        return {
            subtotal,
            vipDiscount,
            couponDiscount,
            loyaltyDiscount,
            totalDiscounts,
            afterDiscounts,
            deliveryFee,
            total: afterDiscounts + deliveryFee,
            pointsEarned,
            itemCount: this.cart.reduce((sum, item) => sum + item.quantity, 0)
        };
    }
    
    calculateDeliveryFee(afterDiscounts) {
        if (this.deliveryMethod === 'pickup') return 0;
        if (luluKitchen?.isVIP) return 0;
        
        const zone = this.deliveryZones[this.deliveryZone];
        if (!zone) return 40;
        
        return afterDiscounts >= zone.minFree ? 0 : zone.fee;
    }
    
    calculateCouponDiscount(subtotal) {
        return this.appliedCoupons.reduce((total, couponCode) => {
            const coupon = this.coupons[couponCode];
            if (!coupon || subtotal < coupon.minOrder) return total;
            
            if (coupon.type === 'percent') {
                return total + (subtotal * coupon.discount / 100);
            } else {
                return total + coupon.discount;
            }
        }, 0);
    }
    
    calculateLoyaltyDiscount() {
        // This would integrate with loyalty points system
        return 0; // Placeholder
    }
    
    applyCoupon(couponCode) {
        const coupon = this.coupons[couponCode.toUpperCase()];
        if (!coupon) {
            Utils.showNotification('קוד קופון לא תקף', 'error');
            return false;
        }
        
        const totals = this.calculateCartTotals();
        if (totals.subtotal < coupon.minOrder) {
            Utils.showNotification(`הזמנה מינימלית לקופון: ₪${coupon.minOrder}`, 'error');
            return false;
        }
        
        if (this.appliedCoupons.includes(couponCode.toUpperCase())) {
            Utils.showNotification('קופון כבר מופעל', 'info');
            return false;
        }
        
        this.appliedCoupons.push(couponCode.toUpperCase());
        Utils.saveToStorage('luluCoupons', this.appliedCoupons);
        this.updateCartDisplay();
        
        Utils.showNotification(`קופון ${coupon.description} הופעל!`, 'success');
        return true;
    }
    
    removeCoupon(couponCode) {
        this.appliedCoupons = this.appliedCoupons.filter(code => code !== couponCode);
        Utils.saveToStorage('luluCoupons', this.appliedCoupons);
        this.updateCartDisplay();
        Utils.showNotification('קופון הוסר', 'info');
    }
    
    setDeliveryZone(zone) {
        if (this.deliveryZones[zone]) {
            this.deliveryZone = zone;
            Utils.saveToStorage('luluDeliveryZone', zone);
            this.updateCartDisplay();
        }
    }
    
    setDeliveryMethod(method) {
        this.deliveryMethod = method;
        Utils.saveToStorage('luluDeliveryMethod', method);
        this.updateCartDisplay();
    }
    
    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartModal();
        this.updateCartSummary();
    }
    
    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }
    
    updateCartModal() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = this.getEmptyCartHTML();
            if (cartTotal) cartTotal.textContent = '0.00';
            return;
        }
        
        cartItems.innerHTML = this.cart.map(item => this.getCartItemHTML(item)).join('') + 
                             this.getCartSummaryHTML();
        
        const totals = this.calculateCartTotals();
        if (cartTotal) cartTotal.textContent = totals.total.toFixed(2);
    }
    
    getCartItemHTML(item) {
        const extrasText = item.extras.length > 0 ? 
            `<div class="cart-item-extras">תוספות: ${item.extras.map(e => e.name_he || e.name).join(', ')}</div>` : '';
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.imageUrl || '/images/placeholder.jpg'}" 
                     alt="${item.name_he}" 
                     loading="lazy" 
                     onerror="Utils.handleImageError(this)">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name_he}</div>
                    ${extrasText}
                    <div class="cart-item-price">₪${item.totalPrice.toFixed(2)}</div>
                    ${item.extras.length > 0 ? `<div class="cart-item-base-price">(בסיס: ₪${item.basePrice}, תוספות: ₪${item.extrasPrice})</div>` : ''}
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', -1)" 
                            aria-label="הקטן כמות">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', 1)" 
                            aria-label="הגדל כמות">+</button>
                    <button class="remove-item" onclick="cartManager.removeFromCart('${item.id}')" 
                            aria-label="הסר פריט">🗑️</button>
                </div>
            </div>
        `;
    }
    
    getCartSummaryHTML() {
        const totals = this.calculateCartTotals();
        const zone = this.deliveryZones[this.deliveryZone];
        
        return `
            <div class="cart-summary-details">
                <div class="delivery-zone-selector">
                    <h4>אזור משלוח:</h4>
                    <select onchange="cartManager.setDeliveryZone(this.value)" aria-label="בחר אזור משלוח">
                        ${Object.entries(this.deliveryZones).map(([key, zone]) => 
                            `<option value="${key}" ${this.deliveryZone === key ? 'selected' : ''}>${zone.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="delivery-method-selector">
                    <h4>שיטת איסוף:</h4>
                    <label>
                        <input type="radio" name="delivery-method" value="delivery" 
                               ${this.deliveryMethod === 'delivery' ? 'checked' : ''}
                               onchange="cartManager.setDeliveryMethod('delivery')">
                        משלוח (${zone?.estimatedTime || '45-60 דקות'})
                    </label>
                    <label>
                        <input type="radio" name="delivery-method" value="pickup" 
                               ${this.deliveryMethod === 'pickup' ? 'checked' : ''}
                               onchange="cartManager.setDeliveryMethod('pickup')">
                        איסוף עצמי (15-20 דקות)
                    </label>
                </div>
                
                <div class="coupon-section">
                    <h4>קופון הנחה:</h4>
                    <div class="coupon-input">
                        <input type="text" id="coupon-code" placeholder="הכנס קוד קופון" maxlength="20">
                        <button onclick="cartManager.applyCouponFromInput()" class="btn-secondary">הפעל</button>
                    </div>
                    ${this.appliedCoupons.length > 0 ? `
                        <div class="applied-coupons">
                            ${this.appliedCoupons.map(code => `
                                <span class="applied-coupon">
                                    ${code} 
                                    <button onclick="cartManager.removeCoupon('${code}')" aria-label="הסר קופון">×</button>
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="cart-totals">
                    <div class="total-line">
                        <span>סכום ביניים:</span>
                        <span>₪${totals.subtotal.toFixed(2)}</span>
                    </div>
                    ${totals.vipDiscount > 0 ? `
                        <div class="total-line discount">
                            <span>הנחת VIP (15%):</span>
                            <span>-₪${totals.vipDiscount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    ${totals.couponDiscount > 0 ? `
                        <div class="total-line discount">
                            <span>הנחת קופון:</span>
                            <span>-₪${totals.couponDiscount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-line ${totals.deliveryFee === 0 ? 'free' : ''}">
                        <span>דמי משלוח:</span>
                        <span>${totals.deliveryFee === 0 ? 'חינם!' : `₪${totals.deliveryFee.toFixed(2)}`}</span>
                    </div>
                    <div class="total-line final">
                        <span><strong>סה"כ לתשלום:</strong></span>
                        <span><strong>₪${totals.total.toFixed(2)}</strong></span>
                    </div>
                    ${totals.pointsEarned > 0 ? `
                        <div class="points-earned">
                            🌟 תרוויח ${totals.pointsEarned} נקודות לויאליטי!
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    applyCouponFromInput() {
        const input = document.getElementById('coupon-code');
        if (input && input.value.trim()) {
            this.applyCoupon(input.value.trim());
            input.value = '';
        }
    }
    
    getEmptyCartHTML() {
        return `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>העגלה שלך ריקה</h3>
                <p>הוסף מנות טעימות מהתפריט שלנו!</p>
                <button class="btn-primary" onclick="luluKitchen.closeModal('cart-modal'); Utils.smoothScroll('menu')">
                    צפה בתפריט
                </button>
            </div>
        `;
    }
    
    updateCartSummary() {
        // Update floating cart summary
        let summary = document.querySelector('.cart-summary');
        const totals = this.calculateCartTotals();
        
        if (totals.itemCount === 0) {
            if (summary) summary.remove();
            return;
        }
        
        if (!summary) {
            summary = document.createElement('div');
            summary.className = 'cart-summary';
            summary.onclick = () => luluKitchen.openModal('cart-modal');
            document.body.appendChild(summary);
        }
        
        summary.innerHTML = `
            <div class="cart-summary-content">
                <div class="cart-summary-icon">🛒</div>
                <div class="cart-summary-info">
                    <div class="cart-summary-count">${totals.itemCount} פריטים</div>
                    <div class="cart-summary-total">₪${totals.total.toFixed(0)}</div>
                </div>
            </div>
        `;
    }
    
    setupCartModal() {
        // Enhance existing cart modal
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            // Add clear cart button
            const modalContent = cartModal.querySelector('.modal-content');
            if (modalContent && !modalContent.querySelector('.cart-actions')) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'cart-actions';
                actionsDiv.innerHTML = `
                    <button class="btn-secondary" onclick="cartManager.clearCart()">רוקן עגלה</button>
                    <button class="btn-primary full-width" onclick="cartManager.proceedToCheckout()">המשך להזמנה</button>
                `;
                
                const checkoutBtn = modalContent.querySelector('.btn-primary.full-width');
                if (checkoutBtn) {
                    checkoutBtn.parentNode.insertBefore(actionsDiv, checkoutBtn);
                    checkoutBtn.remove();
                }
            }
        }
    }
    
    setupDeliveryOptions() {
        // This method can be used to set up delivery zone detection
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                // Could use coordinates to auto-detect delivery zone
                console.log('User location:', position.coords);
            }, (error) => {
                console.log('Location access denied or failed');
            });
        }
    }
    
    proceedToCheckout() {
        if (this.cart.length === 0) {
            Utils.showNotification('העגלה ריקה', 'error');
            return;
        }
        
        const totals = this.calculateCartTotals();
        
        // Check if restaurant is open
        if (!Utils.isRestaurantOpen()) {
            const nextOpen = Utils.getNextOpenTime();
            if (confirm(`המטבח סגור כרגע. הפתיחה הבאה: ${nextOpen}\nהאם תרצה להמשיך ולהזמין למועד מאוחר יותר?`)) {
                // Continue to order page
            } else {
                return;
            }
        }
        
        // Save current cart state for order page
        Utils.saveToStorage('checkoutCart', {
            items: this.cart,
            totals,
            deliveryZone: this.deliveryZone,
            deliveryMethod: this.deliveryMethod,
            appliedCoupons: this.appliedCoupons
        });
        
        // Track checkout start
        Utils.trackEvent('begin_checkout', {
            currency: 'ILS',
            value: totals.total,
            items: this.cart.map(item => ({
                item_id: item.Id,
                item_name: item.name_he,
                quantity: item.quantity,
                price: item.totalPrice / item.quantity
            }))
        });
        
        // Navigate to order page
        window.location.href = 'order.html';
    }
    
    showAddToCartFeedback(itemName, quantity) {
        const quantityText = quantity > 1 ? ` (x${quantity})` : '';
        Utils.showNotification(`${itemName}${quantityText} נוסף לעגלה!`, 'success');
        
        // Could add animation or other visual feedback here
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cartIcon.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    saveCart() {
        Utils.saveToStorage('luluCart', this.cart);
    }
    
    // Quick reorder functionality
    saveOrder(orderData) {
        const savedOrders = Utils.loadFromStorage('luluSavedOrders', []);
        savedOrders.unshift({
            id: Date.now(),
            items: orderData.items,
            total: orderData.total,
            date: new Date().toISOString(),
            customerInfo: {
                phone: orderData.customerPhone,
                name: orderData.customerName
            }
        });
        
        // Keep only last 10 orders
        Utils.saveToStorage('luluSavedOrders', savedOrders.slice(0, 10));
    }
    
    reorder(orderId) {
        const savedOrders = Utils.loadFromStorage('luluSavedOrders', []);
        const order = savedOrders.find(o => o.id === orderId);
        
        if (!order) {
            Utils.showNotification('הזמנה לא נמצאה', 'error');
            return;
        }
        
        // Clear current cart and add items from saved order
        this.cart = [];
        order.items.forEach(item => {
            this.addToCart(item, item.extras, item.quantity);
        });
        
        Utils.showNotification('ההזמנה הועתקה לעגלה!', 'success');
        luluKitchen.openModal('cart-modal');
    }
}

// Initialize cart manager
let cartManager;
document.addEventListener('DOMContentLoaded', () => {
    cartManager = new CartManager();
    
    // Make globally available
    window.cartManager = cartManager;
    window.addToCart = (item, extras, quantity) => cartManager.addToCart(item, extras, quantity);
    window.removeFromCart = (id) => cartManager.removeFromCart(id);
    window.openCart = () => luluKitchen.openModal('cart-modal');
    window.closeCart = () => luluKitchen.closeModal('cart-modal');
    window.proceedToCheckout = () => cartManager.proceedToCheckout();
});