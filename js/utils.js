// Utility Functions for Lulu Kitchen
class Utils {
    // Date and Time Utilities
    static isRestaurantOpen() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();
        
        // Friday: 13:00-15:00
        if (day === 5) {
            return hour >= 13 && hour < 15;
        }
        
        // Saturday: Closed
        if (day === 6) {
            return false;
        }
        
        // Sunday-Thursday: 13:00-21:00
        return hour >= 13 && hour <= 21;
    }
    
    static getNextOpenTime() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        if (day === 6) { // Saturday
            return 'ראשון 13:00';
        }
        
        if (day === 5 && hour >= 15) { // Friday after 15:00
            return 'ראשון 13:00';
        }
        
        if ((day >= 0 && day <= 4) && hour >= 21) { // Sunday-Thursday after 21:00
            return day === 4 ? 'ראשון 13:00' : 'מחר 13:00';
        }
        
        if ((day >= 0 && day <= 4) && hour < 13) { // Before opening
            return 'היום 13:00';
        }
        
        return 'פתוח עכשיו';
    }
    
    static validateDeliveryTime(timeString) {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const deliveryTime = new Date();
            deliveryTime.setHours(hours, minutes);
            
            const now = new Date();
            const minDeliveryTime = new Date(now.getTime() + 45 * 60000); // 45 minutes from now
            
            return deliveryTime >= minDeliveryTime;
        } catch (error) {
            return false;
        }
    }
    
    // Validation Utilities
    static validatePhone(phone) {
        const phoneRegex = /^0\d{8,9}$/;
        return phoneRegex.test(phone.replace(/[-\s]/g, ''));
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validateAddress(address) {
        return address && address.trim().length >= 5;
    }
    
    // WhatsApp Integration
    static createWhatsAppMessage(order) {
        const items = order.items.map(item => {
            const extras = item.extras.length > 0 ? 
                `\nתוספות: ${item.extras.map(e => e.name_he).join(', ')}` : '';
            return `${item.quantity}x ${item.name_he} - ₪${item.totalPrice}${extras}`;
        }).join('\n');
        
        const vipDiscount = order.isVIP ? `\nהנחת VIP (15%): -₪${(order.subtotal * 0.15).toFixed(2)}` : '';
        const deliveryFee = order.deliveryFee > 0 ? `\nדמי משלוח: ₪${order.deliveryFee}` : '\nמשלוח: חינם';
        
        return encodeURIComponent(`
🍜 הזמנה חדשה ממטבח לולו

👤 פרטי לקוח:
שם: ${order.customerName}
טלפון: ${order.customerPhone}
כתובת: ${order.customerAddress}
זמן רצוי: ${order.deliveryTime}
${order.notes ? `הערות: ${order.notes}` : ''}

🛒 הזמנה:
${items}

💰 סיכום תשלום:
סכום ביניים: ₪${order.subtotal.toFixed(2)}${vipDiscount}${deliveryFee}
סה"כ לתשלום: ₪${order.total.toFixed(2)}

💳 אמצעי תשלום: ${order.paymentMethod}

⏰ הוזמן ב: ${new Date().toLocaleString('he-IL')}
        `);
    }
    
    static sendWhatsAppOrder(order) {
        const message = this.createWhatsAppMessage(order);
        const whatsappUrl = `https://wa.me/972525201978?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }
    
    // Email Integration
    static sendEmailOrder(order) {
        const subject = encodeURIComponent('הזמנה חדשה ממטבח לולו');
        const body = this.createWhatsAppMessage(order); // Same format works for email
        const emailUrl = `mailto:lulu@lulu-k.com,lulu.kitchen.il@gmail.com?subject=${subject}&body=${body}`;
        window.open(emailUrl);
    }
    
    // Local Storage Utilities
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    }
    
    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return defaultValue;
        }
    }
    
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    }
    
    // Currency and Price Utilities
    static formatPrice(price, includeCurrency = true) {
        const formatted = price.toFixed(2);
        return includeCurrency ? `₪${formatted}` : formatted;
    }
    
    static calculateVIPDiscount(amount) {
        return amount * 0.15;
    }
    
    static calculateDeliveryFee(subtotal, isVIP = false) {
        if (isVIP || subtotal >= 800) {
            return 0;
        }
        return 40;
    }
    
    // Image Utilities
    static handleImageError(img) {
        img.src = '/images/placeholder.jpg';
        img.alt = 'תמונה לא זמינה';
    }
    
    static lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Animation Utilities
    static smoothScroll(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    static fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.max(1 - progress, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Accessibility Utilities
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    static setupKeyboardNavigation() {
        // Tab navigation for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal[style*="block"]');
                if (modal) {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    if (focusableElements.length === 0) return;
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
    
    // Performance Utilities
    static debounce(func, wait) {
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
    
    static throttle(func, wait) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, wait);
            }
        };
    }
    
    // Device Detection
    static isMobile() {
        return window.innerWidth <= 768;
    }
    
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }
    
    // Error Handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Could send to error tracking service here
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: `${context}: ${error.message}`,
                fatal: false
            });
        }
    }
    
    // Analytics Utilities
    static trackEvent(eventName, parameters = {}) {
        if (window.gtag) {
            window.gtag('event', eventName, parameters);
        }
        
        // Could also send to other analytics services
        console.log('Event tracked:', eventName, parameters);
    }
    
    static trackPurchase(order) {
        this.trackEvent('purchase', {
            transaction_id: order.id,
            value: order.total,
            currency: 'ILS',
            items: order.items.map(item => ({
                item_id: item.Id,
                item_name: item.name_he,
                quantity: item.quantity,
                price: item.totalPrice / item.quantity
            }))
        });
    }
    
    // Network Utilities
    static isOnline() {
        return navigator.onLine;
    }
    
    static setupOfflineDetection() {
        window.addEventListener('online', () => {
            document.body.classList.remove('offline');
            Utils.showNotification('חיבור לאינטרנט הוחזר', 'success');
        });
        
        window.addEventListener('offline', () => {
            document.body.classList.add('offline');
            Utils.showNotification('אין חיבור לאינטרנט', 'error');
        });
    }
    
    static showNotification(message, type = 'info', duration = 3000) {
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
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(50%) translateY(0)';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(50%) translateY(-100px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Utils.setupKeyboardNavigation();
    Utils.setupOfflineDetection();
    Utils.lazyLoadImages();
    
    // Make Utils globally available
    window.Utils = Utils;
});