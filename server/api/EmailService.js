// SendGrid Configuration for FastComet
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_CONFIG = {
    from: {
        email: 'lulu@lulu-k.com',
        name: 'המטבח הסיני של לולו - Lulu Kitchen'
    },
    businessEmails: [
        'lulu@lulu-k.com',
        'lulu.kitchen.il@gmail.com'
    ],
    templates: {
        orderConfirmation: 'd-1234567890abcdef', // Replace with actual SendGrid template ID
        orderStatusUpdate: 'd-fedcba0987654321',
        welcomeEmail: 'd-1111111111111111',
        vipWelcome: 'd-2222222222222222'
    }
};

class EmailService {
    constructor() {
        this.isConfigured = !!process.env.SENDGRID_API_KEY;
        if (!this.isConfigured) {
            console.warn('SendGrid API key not configured. Email features will be disabled.');
        }
    }

    async sendOrderConfirmation(orderData) {
        if (!this.isConfigured) {
            console.log('Email service not configured, skipping order confirmation');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            // Customer confirmation email
            const customerEmail = {
                to: orderData.customer.email,
                from: EMAIL_CONFIG.from,
                templateId: EMAIL_CONFIG.templates.orderConfirmation,
                dynamicTemplateData: {
                    customerName: orderData.customer.name,
                    orderNumber: orderData.orderNumber,
                    orderDate: new Date().toLocaleDateString('he-IL'),
                    items: orderData.items.map(item => ({
                        name: item.dish.nameHe,
                        nameEn: item.dish.nameEn,
                        quantity: item.quantity,
                        price: item.totalPrice,
                        extras: item.extras.map(extra => extra.nameHe || extra.name).join(', ')
                    })),
                    subtotal: orderData.subtotal,
                    deliveryFee: orderData.deliveryFee,
                    total: orderData.total,
                    deliveryMethod: orderData.deliveryMethod,
                    deliveryAddress: orderData.customer.address,
                    deliveryTime: orderData.deliveryTime,
                    phone: orderData.customer.phone,
                    language: orderData.language || 'he',
                    isVIP: orderData.customer.isVIP || false,
                    vipDiscount: orderData.vipDiscount || 0
                }
            };

            // Business notification email
            const businessEmail = {
                to: EMAIL_CONFIG.businessEmails,
                from: EMAIL_CONFIG.from,
                subject: `🍜 הזמנה חדשה מספר ${orderData.orderNumber} - מטבח לולו`,
                html: this.generateBusinessEmailHTML(orderData)
            };

            // Send emails
            const results = await Promise.allSettled([
                sgMail.send(customerEmail),
                sgMail.send(businessEmail)
            ]);

            return {
                success: true,
                customerEmailSent: results[0].status === 'fulfilled',
                businessEmailSent: results[1].status === 'fulfilled',
                errors: results.filter(r => r.status === 'rejected').map(r => r.reason)
            };

        } catch (error) {
            console.error('Failed to send order confirmation emails:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateBusinessEmailHTML(orderData) {
        const itemsHTML = orderData.items.map(item => {
            const extrasText = item.extras.length > 0 
                ? `<br><small style="color: #666;">תוספות: ${item.extras.map(e => e.nameHe || e.name).join(', ')}</small>`
                : '';
            
            return `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; text-align: right;">${item.dish.nameHe}</td>
                    <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: center;">₪${item.totalPrice}</td>
                </tr>
                ${extrasText ? `<tr><td colspan="3" style="padding: 0 12px;">${extrasText}</td></tr>` : ''}
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>הזמנה חדשה - מטבח לולו</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                <div style="background: linear-gradient(135deg, #DC143C 0%, #FFD700 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">🍜 הזמנה חדשה!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">מטבח לולו - המטבח הסיני של ירושלים</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #DC143C; margin-top: 0;">פרטי ההזמנה</h2>
                    <p><strong>מספר הזמנה:</strong> ${orderData.orderNumber}</p>
                    <p><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
                    <p><strong>שעה:</strong> ${new Date().toLocaleTimeString('he-IL')}</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #DC143C; margin-top: 0;">פרטי הלקוח</h2>
                    <p><strong>שם:</strong> ${orderData.customer.name}</p>
                    <p><strong>טלפון:</strong> <a href="tel:${orderData.customer.phone}" style="color: #DC143C;">${orderData.customer.phone}</a></p>
                    <p><strong>אימייל:</strong> <a href="mailto:${orderData.customer.email}" style="color: #DC143C;">${orderData.customer.email}</a></p>
                    ${orderData.customer.address ? `<p><strong>כתובת:</strong> ${orderData.customer.address}</p>` : ''}
                    ${orderData.customer.isVIP ? '<p><strong>סטטוס:</strong> <span style="color: #FFD700; font-weight: bold;">👑 VIP</span></p>' : ''}
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #DC143C; margin-top: 0;">פריטים בהזמנה</h2>
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                        <thead style="background: #DC143C; color: white;">
                            <tr>
                                <th style="padding: 15px; text-align: right;">מנה</th>
                                <th style="padding: 15px; text-align: center;">כמות</th>
                                <th style="padding: 15px; text-align: center;">מחיר</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #DC143C; margin-top: 0;">סיכום מחירים</h2>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>סכום ביניים:</span>
                        <span>₪${orderData.subtotal}</span>
                    </div>
                    ${orderData.vipDiscount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
                            <span>הנחת VIP:</span>
                            <span>-₪${orderData.vipDiscount}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>משלוח:</span>
                        <span>${orderData.deliveryFee > 0 ? `₪${orderData.deliveryFee}` : 'חינם'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #DC143C; border-top: 2px solid #DC143C; padding-top: 10px;">
                        <span>סה״כ:</span>
                        <span>₪${orderData.total}</span>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #DC143C; margin-top: 0;">פרטי משלוח</h2>
                    <p><strong>אופן משלוח:</strong> ${orderData.deliveryMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח'}</p>
                    ${orderData.deliveryTime ? `<p><strong>זמן רצוי:</strong> ${orderData.deliveryTime}</p>` : ''}
                    ${orderData.notes ? `<p><strong>הערות:</strong> ${orderData.notes}</p>` : ''}
                </div>

                <div style="background: #DC143C; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 30px;">
                    <p style="margin: 0; font-size: 16px;">
                        🔗 <a href="https://wa.me/052-520-1978?text=${encodeURIComponent('הזמנה מספר ' + orderData.orderNumber)}" 
                              style="color: #FFD700; text-decoration: none;">
                            לתיאום ההזמנה בוואטסאפ
                        </a>
                    </p>
                </div>

                <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666;">
                    <p>מטבח לולו - המטבח הסיני של ירושלים</p>
                    <p>נבנה עם ❤️ בירושלים</p>
                </div>
            </body>
            </html>
        `;
    }

    async sendWelcomeEmail(customerData) {
        if (!this.isConfigured) return { success: false, error: 'Email service not configured' };

        try {
            const welcomeEmail = {
                to: customerData.email,
                from: EMAIL_CONFIG.from,
                templateId: EMAIL_CONFIG.templates.welcomeEmail,
                dynamicTemplateData: {
                    customerName: customerData.name,
                    language: customerData.language || 'he'
                }
            };

            await sgMail.send(welcomeEmail);
            return { success: true };

        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return { success: false, error: error.message };
        }
    }

    async sendVIPWelcomeEmail(customerData) {
        if (!this.isConfigured) return { success: false, error: 'Email service not configured' };

        try {
            const vipEmail = {
                to: customerData.email,
                from: EMAIL_CONFIG.from,
                templateId: EMAIL_CONFIG.templates.vipWelcome,
                dynamicTemplateData: {
                    customerName: customerData.name,
                    language: customerData.language || 'he'
                }
            };

            await sgMail.send(vipEmail);
            return { success: true };

        } catch (error) {
            console.error('Failed to send VIP welcome email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();