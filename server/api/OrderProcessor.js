// Order Processing API for FastComet Hosting
const EmailService = require('./EmailService');

class OrderProcessor {
    constructor() {
        this.orderCounter = parseInt(localStorage.getItem('lulu-order-counter') || '1000');
    }

    async processOrder(orderData) {
        try {
            // Generate order number
            const orderNumber = this.generateOrderNumber();
            
            // Process the order data
            const processedOrder = {
                orderNumber,
                timestamp: new Date().toISOString(),
                customer: {
                    name: orderData.customerName,
                    phone: orderData.customerPhone,
                    email: orderData.customerEmail,
                    address: orderData.deliveryAddress,
                    isVIP: orderData.isVIP || false
                },
                items: orderData.items,
                subtotal: orderData.subtotal,
                vipDiscount: orderData.vipDiscount || 0,
                deliveryFee: orderData.deliveryFee,
                total: orderData.total,
                deliveryMethod: orderData.deliveryMethod,
                deliveryTime: orderData.preferredTime,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                language: orderData.language || 'he',
                status: 'pending'
            };

            // Save order to storage (in a real app, this would be a database)
            this.saveOrder(processedOrder);

            // Send confirmation emails
            const emailResult = await EmailService.sendOrderConfirmation(processedOrder);
            
            // Generate WhatsApp message for business
            const whatsappResult = this.generateWhatsAppNotification(processedOrder);

            return {
                success: true,
                orderNumber,
                order: processedOrder,
                emailResult,
                whatsappResult
            };

        } catch (error) {
            console.error('Error processing order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateOrderNumber() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const counter = String(this.orderCounter).padStart(3, '0');
        this.orderCounter++;
        
        // Save counter to localStorage
        localStorage.setItem('lulu-order-counter', this.orderCounter.toString());
        
        return `LU${dateStr}${counter}`;
    }

    saveOrder(order) {
        try {
            // Get existing orders
            const existingOrders = JSON.parse(localStorage.getItem('lulu-orders') || '[]');
            
            // Add new order
            existingOrders.push(order);
            
            // Keep only last 100 orders
            const recentOrders = existingOrders.slice(-100);
            
            // Save back to localStorage
            localStorage.setItem('lulu-orders', JSON.stringify(recentOrders));
            
            console.log('Order saved successfully:', order.orderNumber);
        } catch (error) {
            console.error('Failed to save order:', error);
        }
    }

    generateWhatsAppNotification(order) {
        const businessWhatsApp = '052-520-1978';
        
        let message = `🍜 *הזמנה חדשה ממטבח לולו*\n\n`;
        message += `*מספר הזמנה:* ${order.orderNumber}\n`;
        message += `*תאריך:* ${new Date().toLocaleDateString('he-IL')}\n`;
        message += `*שעה:* ${new Date().toLocaleTimeString('he-IL')}\n\n`;
        
        message += `*פרטי לקוח:*\n`;
        message += `• שם: ${order.customer.name}\n`;
        message += `• טלפון: ${order.customer.phone}\n`;
        if (order.customer.email) {
            message += `• אימייל: ${order.customer.email}\n`;
        }
        if (order.customer.address) {
            message += `• כתובת: ${order.customer.address}\n`;
        }
        if (order.customer.isVIP) {
            message += `• סטטוס: 👑 VIP\n`;
        }
        
        message += `\n*פריטים:*\n`;
        order.items.forEach(item => {
            const dishName = item.dish.nameHe || item.dish.name;
            message += `• ${dishName} x${item.quantity} - ₪${item.totalPrice}\n`;
            
            if (item.extras && item.extras.length > 0) {
                const extrasText = item.extras.map(extra => extra.nameHe || extra.name).join(', ');
                message += `  תוספות: ${extrasText}\n`;
            }
        });
        
        message += `\n*סיכום:*\n`;
        message += `• סכום ביניים: ₪${order.subtotal}\n`;
        
        if (order.vipDiscount > 0) {
            message += `• הנחת VIP: -₪${order.vipDiscount}\n`;
        }
        
        message += `• משלוח: ${order.deliveryFee > 0 ? `₪${order.deliveryFee}` : 'חינם'}\n`;
        message += `• *סה"כ: ₪${order.total}*\n\n`;
        
        message += `*פרטי משלוח:*\n`;
        message += `• אופן: ${order.deliveryMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח'}\n`;
        
        if (order.deliveryTime) {
            message += `• זמן רצוי: ${order.deliveryTime}\n`;
        }
        
        message += `• אופן תשלום: ${order.paymentMethod === 'cash' ? 'מזומן' : 'כרטיס אשראי'}\n`;
        
        if (order.notes) {
            message += `\n*הערות:* ${order.notes}\n`;
        }
        
        message += `\n📞 לחזרה ללקוח: ${order.customer.phone}`;
        
        const whatsappURL = `https://wa.me/${businessWhatsApp}?text=${encodeURIComponent(message)}`;
        
        return {
            url: whatsappURL,
            message: message
        };
    }

    // Get order history for admin/customer
    getOrderHistory(limit = 50) {
        try {
            const orders = JSON.parse(localStorage.getItem('lulu-orders') || '[]');
            return orders.slice(-limit).reverse(); // Most recent first
        } catch (error) {
            console.error('Failed to get order history:', error);
            return [];
        }
    }

    // Get order by number
    getOrder(orderNumber) {
        try {
            const orders = JSON.parse(localStorage.getItem('lulu-orders') || '[]');
            return orders.find(order => order.orderNumber === orderNumber);
        } catch (error) {
            console.error('Failed to get order:', error);
            return null;
        }
    }

    // Update order status
    updateOrderStatus(orderNumber, newStatus, notes = '') {
        try {
            const orders = JSON.parse(localStorage.getItem('lulu-orders') || '[]');
            const orderIndex = orders.findIndex(order => order.orderNumber === orderNumber);
            
            if (orderIndex === -1) {
                throw new Error('Order not found');
            }
            
            orders[orderIndex].status = newStatus;
            orders[orderIndex].statusUpdatedAt = new Date().toISOString();
            if (notes) {
                orders[orderIndex].statusNotes = notes;
            }
            
            localStorage.setItem('lulu-orders', JSON.stringify(orders));
            
            // TODO: Send status update email to customer
            
            return orders[orderIndex];
        } catch (error) {
            console.error('Failed to update order status:', error);
            throw error;
        }
    }

    // Get order statistics
    getOrderStats() {
        try {
            const orders = JSON.parse(localStorage.getItem('lulu-orders') || '[]');
            const today = new Date().toISOString().slice(0, 10);
            const thisMonth = new Date().toISOString().slice(0, 7);
            
            return {
                totalOrders: orders.length,
                todayOrders: orders.filter(order => order.timestamp.startsWith(today)).length,
                monthlyOrders: orders.filter(order => order.timestamp.startsWith(thisMonth)).length,
                totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
                averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
                vipOrders: orders.filter(order => order.customer.isVIP).length,
                popularItems: this.getPopularItems(orders)
            };
        } catch (error) {
            console.error('Failed to get order stats:', error);
            return {};
        }
    }

    getPopularItems(orders) {
        const itemCounts = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const dishName = item.dish.nameHe || item.dish.name;
                itemCounts[dishName] = (itemCounts[dishName] || 0) + item.quantity;
            });
        });
        
        return Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
    }
}

// For FastComet hosting - expose as global function
if (typeof window !== 'undefined') {
    window.OrderProcessor = OrderProcessor;
} else {
    module.exports = OrderProcessor;
}