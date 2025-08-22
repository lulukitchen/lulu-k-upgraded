// Payment Processing Module
class PaymentManager {
    constructor() {
        this.paymentMethods = {
            cash: {
                name_he: 'מזומן',
                name_en: 'Cash',
                icon: '💰',
                fees: 0,
                processing_time: 'immediate'
            },
            bit: {
                name_he: 'Bit',
                name_en: 'Bit',
                icon: '📱',
                fees: 0,
                processing_time: 'immediate',
                url: 'https://www.bitpay.co.il/app/me/C822FDFE-1C69-4F92-B57B-09635D465B9D'
            },
            paybox: {
                name_he: 'PayBox',
                name_en: 'PayBox',
                icon: '💳',
                fees: 0,
                processing_time: '1-2 minutes',
                url: 'https://link.payboxapp.com/Hh5KZaqQc1Jz93Zv7'
            }
        };
        
        this.currentOrder = null;
        this.paymentStatus = 'pending';
        
        this.init();
    }
    
    init() {
        this.loadOrderData();
        this.setupEventListeners();
    }
    
    loadOrderData() {
        this.currentOrder = Utils.loadFromStorage('orderDetails', null);
    }
    
    setupEventListeners() {
        // Payment method selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'payment-method') {
                this.handlePaymentMethodChange(e.target.value);
            }
        });
        
        // Form submissions and validations
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'payment-form') {
                e.preventDefault();
                this.processPayment();
            }
        });
    }
    
    handlePaymentMethodChange(method) {
        this.hideAllPaymentDetails();
        this.showPaymentDetails(method);
        this.updatePaymentUI(method);
        
        // Track payment method selection
        Utils.trackEvent('payment_method_selected', {
            method: method,
            order_value: this.currentOrder?.totals?.final || 0
        });
    }
    
    hideAllPaymentDetails() {
        const details = document.querySelectorAll('.payment-details');
        details.forEach(detail => {
            detail.style.display = 'none';
        });
    }
    
    showPaymentDetails(method) {
        const methodElement = document.querySelector(`[data-method="${method}"]`);
        if (methodElement) {
            const details = methodElement.querySelector('.payment-details');
            if (details) {
                details.style.display = 'block';
                
                // Show specific elements for each method
                this.showMethodSpecificElements(method);
            }
        }
    }
    
    showMethodSpecificElements(method) {
        switch (method) {
            case 'bit':
                this.showBitElements();
                break;
            case 'paybox':
                this.showPayBoxElements();
                break;
            case 'cash':
                this.showCashElements();
                break;
        }
    }
    
    showBitElements() {
        const bitQR = document.getElementById('bit-qr');
        if (bitQR) {
            bitQR.style.display = 'block';
            this.generateBitPaymentURL();
        }
    }
    
    showPayBoxElements() {
        const payboxLink = document.getElementById('paybox-link');
        if (payboxLink) {
            payboxLink.style.display = 'block';
            this.generatePayBoxURL();
        }
    }
    
    showCashElements() {
        // Cash payment doesn't need special elements
        // Just show confirmation
        const cashInfo = document.querySelector('.cash-info');
        if (cashInfo) {
            cashInfo.style.display = 'block';
        }
    }
    
    generateBitPaymentURL() {
        if (!this.currentOrder) return;
        
        const amount = this.currentOrder.totals.final;
        const orderNumber = this.generateOrderNumber();
        const description = `מטבח לולו הזמנה ${orderNumber}`;
        
        const bitURL = `${this.paymentMethods.bit.url}?amount=${amount}&description=${encodeURIComponent(description)}`;
        
        // Update Bit payment link
        const bitLink = document.querySelector('[href*="bitpay.co.il"]');
        if (bitLink) {
            bitLink.href = bitURL;
        }
        
        // Generate QR code (would use a QR library in production)
        this.generateQRCode(bitURL);
    }
    
    generatePayBoxURL() {
        // PayBox uses a fixed URL, but we could add parameters if their API supports it
        const payboxLink = document.querySelector('[href*="payboxapp.com"]');
        if (payboxLink) {
            // Link is already set in HTML
        }
    }
    
    generateQRCode(url) {
        // Placeholder for QR code generation
        // In production, would use a QR code library like qrcode.js
        const qrPlaceholder = document.querySelector('.qr-placeholder');
        if (qrPlaceholder) {
            qrPlaceholder.innerHTML = `
                <div class="qr-code-placeholder">
                    <p>📱 QR Code לתשלום Bit</p>
                    <div class="qr-box">
                        <span style="font-size: 4rem;">📱</span>
                    </div>
                    <p style="font-size: 0.8rem;">או השתמשו בקישור למעלה</p>
                </div>
            `;
        }
    }
    
    updatePaymentUI(method) {
        const methodInfo = this.paymentMethods[method];
        const completeBtn = document.getElementById('complete-order-btn');
        const confirmation = document.getElementById('payment-confirmation');
        
        if (completeBtn && this.currentOrder) {
            const total = this.currentOrder.totals.final.toFixed(2);
            
            switch (method) {
                case 'cash':
                    completeBtn.textContent = `השלם הזמנה - תשלום במזומן (₪${total})`;
                    break;
                case 'bit':
                    completeBtn.textContent = `המשך לתשלום Bit (₪${total})`;
                    break;
                case 'paybox':
                    completeBtn.textContent = `המשך לתשלום PayBox (₪${total})`;
                    break;
                default:
                    completeBtn.textContent = `השלם הזמנה (₪${total})`;
            }
            
            completeBtn.disabled = false;
        }
        
        if (confirmation) {
            confirmation.style.display = 'block';
        }
    }
    
    async processPayment() {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        if (!selectedMethod) {
            Utils.showNotification('אנא בחרו אמצעי תשלום', 'error');
            return false;
        }
        
        if (!this.currentOrder) {
            Utils.showNotification('לא נמצאו פרטי הזמנה', 'error');
            return false;
        }
        
        try {
            // Show processing modal
            this.showProcessingModal();
            
            // Create order data
            const orderData = {
                ...this.currentOrder,
                paymentMethod: selectedMethod.value,
                orderNumber: this.generateOrderNumber(),
                timestamp: new Date().toISOString(),
                status: 'confirmed'
            };
            
            // Process based on payment method
            const paymentResult = await this.processPaymentByMethod(selectedMethod.value, orderData);
            
            if (paymentResult.success) {
                // Send notifications
                await this.sendOrderNotifications(orderData);
                
                // Complete order
                await this.completeOrder(orderData);
                
                // Redirect to thank you page
                Utils.saveToStorage('completedOrder', orderData);
                window.location.href = 'thankyou.html';
                
                return true;
            } else {
                throw new Error(paymentResult.error || 'Payment processing failed');
            }
            
        } catch (error) {
            console.error('Payment processing error:', error);
            Utils.showNotification('שגיאה בעיבוד התשלום. אנא נסו שוב.', 'error');
            this.hideProcessingModal();
            return false;
        }
    }
    
    async processPaymentByMethod(method, orderData) {
        this.updateProcessingStep('step-payment', '⏳ מעבד תשלום...');
        
        switch (method) {
            case 'cash':
                return await this.processCashPayment(orderData);
            case 'bit':
                return await this.processBitPayment(orderData);
            case 'paybox':
                return await this.processPayBoxPayment(orderData);
            default:
                throw new Error('Unsupported payment method');
        }
    }
    
    async processCashPayment(orderData) {
        // Cash payment - no processing needed, just record
        await this.delay(1000);
        this.updateProcessingStep('step-payment', '✅ תשלום במזומן נרשם');
        
        return {
            success: true,
            method: 'cash',
            status: 'pending_payment',
            message: 'תשלום במזומן בעת המשלוח'
        };
    }
    
    async processBitPayment(orderData) {
        // Open Bit payment in new window/tab
        const bitUrl = this.generateBitPaymentURL();
        window.open(bitUrl, '_blank');
        
        await this.delay(2000);
        this.updateProcessingStep('step-payment', '✅ הופנה לתשלום Bit');
        
        return {
            success: true,
            method: 'bit',
            status: 'payment_initiated',
            message: 'תשלום Bit הופעל'
        };
    }
    
    async processPayBoxPayment(orderData) {
        // Open PayBox payment in new window/tab
        window.open(this.paymentMethods.paybox.url, '_blank');
        
        await this.delay(2000);
        this.updateProcessingStep('step-payment', '✅ הופנה לתשלום PayBox');
        
        return {
            success: true,
            method: 'paybox',
            status: 'payment_initiated',
            message: 'תשלום PayBox הופעל'
        };
    }
    
    async sendOrderNotifications(orderData) {
        this.updateProcessingStep('step-confirm', '⏳ שולח הזמנה...');
        
        try {
            // Send WhatsApp message
            Utils.sendWhatsAppOrder(this.formatOrderForWhatsApp(orderData));
            
            // Send email if provided
            if (orderData.customer.email) {
                Utils.sendEmailOrder(this.formatOrderForEmail(orderData));
            }
            
            this.updateProcessingStep('step-confirm', '✅ הזמנה נשלחה');
            return true;
            
        } catch (error) {
            console.error('Error sending notifications:', error);
            this.updateProcessingStep('step-confirm', '⚠️ שגיאה בשליחה - ההזמנה נשמרה');
            return false;
        }
    }
    
    formatOrderForWhatsApp(orderData) {
        return {
            customerName: orderData.customer.name,
            customerPhone: orderData.customer.phone,
            customerAddress: orderData.customer.address,
            deliveryTime: orderData.delivery.time,
            notes: orderData.delivery.notes,
            paymentMethod: this.getPaymentMethodName(orderData.paymentMethod),
            items: orderData.items,
            subtotal: orderData.totals.subtotal,
            total: orderData.totals.final,
            deliveryFee: orderData.totals.deliveryFee,
            isVIP: orderData.isVIP,
            orderNumber: orderData.orderNumber
        };
    }
    
    formatOrderForEmail(orderData) {
        return {
            customerName: orderData.customer.name,
            customerEmail: orderData.customer.email,
            items: orderData.items,
            total: orderData.totals.final,
            orderNumber: orderData.orderNumber,
            deliveryMethod: orderData.delivery.method
        };
    }
    
    async completeOrder(orderData) {
        this.updateProcessingStep('step-complete', '⏳ משלים הזמנה...');
        
        // Save order to customer history
        this.saveOrderHistory(orderData);
        
        // Clear cart and temporary data
        this.clearCartData();
        
        // Add loyalty points
        this.addLoyaltyPoints(orderData);
        
        // Activate VIP if selected
        if (orderData.isVIP) {
            this.activateVIP();
        }
        
        // Track purchase
        Utils.trackPurchase(orderData);
        
        this.updateProcessingStep('step-complete', '✅ הזמנה הושלמה!');
        
        await this.delay(1000);
    }
    
    saveOrderHistory(orderData) {
        const savedOrders = Utils.loadFromStorage('luluSavedOrders', []);
        savedOrders.unshift({
            id: Date.now(),
            orderNumber: orderData.orderNumber,
            items: orderData.items,
            total: orderData.totals.final,
            date: orderData.timestamp,
            customerInfo: {
                phone: orderData.customer.phone,
                name: orderData.customer.name
            },
            status: 'confirmed'
        });
        
        // Keep only last 20 orders
        Utils.saveToStorage('luluSavedOrders', savedOrders.slice(0, 20));
    }
    
    clearCartData() {
        Utils.removeFromStorage('luluCart');
        Utils.removeFromStorage('checkoutCart');
        Utils.removeFromStorage('orderDetails');
    }
    
    addLoyaltyPoints(orderData) {
        const pointsMultiplier = orderData.isVIP ? 2 : 1;
        const pointsEarned = Math.floor(orderData.totals.final) * pointsMultiplier;
        
        const currentPoints = Utils.loadFromStorage('luluPoints', 0);
        Utils.saveToStorage('luluPoints', currentPoints + pointsEarned);
    }
    
    activateVIP() {
        Utils.saveToStorage('luluVIP', true);
        
        // Track VIP activation
        Utils.trackEvent('vip_activated', {
            activation_source: 'order_process'
        });
    }
    
    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${random}`;
    }
    
    getPaymentMethodName(method) {
        return this.paymentMethods[method]?.name_he || method;
    }
    
    showProcessingModal() {
        const modal = document.getElementById('payment-processing-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Reset processing steps
            this.updateProcessingStep('step-validate', '✅ בדיקת פרטים');
            this.updateProcessingStep('step-payment', '⏳ עיבוד תשלום');
            this.updateProcessingStep('step-confirm', '⏳ שליחת אישור');
            this.updateProcessingStep('step-complete', '⏳ השלמת הזמנה');
        }
    }
    
    hideProcessingModal() {
        const modal = document.getElementById('payment-processing-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    updateProcessingStep(stepId, text) {
        const step = document.getElementById(stepId);
        if (step) {
            step.textContent = text;
            if (text.startsWith('✅')) {
                step.style.color = 'var(--primary-gold)';
            } else if (text.startsWith('⚠️')) {
                step.style.color = '#f44336';
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Validation methods
    validatePaymentForm() {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        
        if (!selectedMethod) {
            Utils.showNotification('אנא בחרו אמצעי תשלום', 'error');
            return false;
        }
        
        if (!this.currentOrder) {
            Utils.showNotification('לא נמצאו פרטי הזמנה', 'error');
            return false;
        }
        
        // Method-specific validation
        return this.validatePaymentMethod(selectedMethod.value);
    }
    
    validatePaymentMethod(method) {
        switch (method) {
            case 'cash':
                return this.validateCashPayment();
            case 'bit':
                return this.validateBitPayment();
            case 'paybox':
                return this.validatePayBoxPayment();
            default:
                return false;
        }
    }
    
    validateCashPayment() {
        // Cash payment - always valid
        return true;
    }
    
    validateBitPayment() {
        // Bit payment - check if minimum amount requirements are met
        if (this.currentOrder.totals.final < 5) {
            Utils.showNotification('סכום מינימלי לתשלום Bit: ₪5', 'error');
            return false;
        }
        return true;
    }
    
    validatePayBoxPayment() {
        // PayBox payment - check if minimum amount requirements are met
        if (this.currentOrder.totals.final < 5) {
            Utils.showNotification('סכום מינימלי לתשלום PayBox: ₪5', 'error');
            return false;
        }
        return true;
    }
    
    // Utility methods for external access
    getCurrentOrder() {
        return this.currentOrder;
    }
    
    getPaymentMethods() {
        return this.paymentMethods;
    }
    
    getPaymentStatus() {
        return this.paymentStatus;
    }
}

// Initialize payment manager
let paymentManager;
document.addEventListener('DOMContentLoaded', () => {
    paymentManager = new PaymentManager();
    window.paymentManager = paymentManager;
});