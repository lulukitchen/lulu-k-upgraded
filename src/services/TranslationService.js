// Hebrew/English Translation Service
class TranslationService {
    constructor() {
        this.currentLanguage = 'he'; // Default to Hebrew
        this.translations = {};
        this.fallbackTranslations = this.getDefaultTranslations();
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            // Try to load Hebrew translations
            const heResponse = await fetch('/src/locales/he.json');
            if (heResponse.ok) {
                this.translations.he = await heResponse.json();
            }

            // Try to load English translations  
            const enResponse = await fetch('/src/locales/en.json');
            if (enResponse.ok) {
                this.translations.en = await enResponse.json();
            }
        } catch (error) {
            console.warn('Could not load translation files, using defaults:', error);
        }

        // Use fallback translations if files not loaded
        if (!this.translations.he) {
            this.translations.he = this.fallbackTranslations.he;
        }
        if (!this.translations.en) {
            this.translations.en = this.fallbackTranslations.en;
        }
    }

    getDefaultTranslations() {
        return {
            he: {
                // Navigation
                "nav.dailySpecial": "מנת היום",
                "nav.menu": "התפריט",
                "nav.vip": "VIP",
                "nav.contact": "צור קשר",
                "nav.payment": "תשלום",
                "nav.cart": "עגלה",
                
                // Hero Section
                "hero.title": "המטבח הסיני המקורי של ירושלים",
                "hero.subtitle": "מנות טריות, טעמים מקוריים, משלוח מהיר!",
                "hero.orderNow": "הזמן עכשיו",
                "hero.joinVip": "הצטרף ל-VIP",
                
                // Menu
                "menu.fullMenu": "התפריט המלא",
                "menu.search": "חפש מנה...",
                "menu.filterBy": "סנן לפי:",
                "menu.all": "הכל",
                "menu.vegan": "טבעוני",
                "menu.vegetarian": "צמחוני", 
                "menu.spicy": "חריף",
                "menu.kosher": "כשר",
                "menu.glutenFree": "ללא גלוטן",
                "menu.addToCart": "הוסף לעגלה",
                "menu.viewExtras": "תוספות",
                "menu.calories": "קלוריות",
                "menu.spiceLevel": "רמת חריפות",
                
                // Cart
                "cart.title": "העגלה שלך",
                "cart.empty": "העגלה ריקה",
                "cart.items": "פריטים",
                "cart.subtotal": "סכום ביניים",
                "cart.delivery": "משלוח",
                "cart.total": "סה״כ",
                "cart.freeDelivery": "משלוח חינם!",
                "cart.freeDeliveryProgress": "עוד {amount}₪ למשלוח חינם",
                "cart.checkout": "המשך לתשלום",
                "cart.pickupFree": "איסוף עצמי (חינם)",
                "cart.deliveryPaid": "משלוח (40₪)",
                
                // Extras Modal
                "extras.title": "תוספות למנה",
                "extras.rice": "אורז ופחמימות",
                "extras.sauces": "רטבים ותבלינים", 
                "extras.vegetables": "ירקות טריים",
                "extras.proteins": "חלבונים נוספים",
                "extras.totalPrice": "מחיר כולל תוספות",
                "extras.addToCart": "הוסף לעגלה",
                
                // VIP System
                "vip.title": "מנוי VIP",
                "vip.joinTitle": "הצטרף למנוי ה-VIP",
                "vip.monthlyPrice": "299₪/חודש",
                "vip.benefits.discount": "15% הנחה על כל הזמנה",
                "vip.benefits.freeDelivery": "משלוח חינם תמיד",
                "vip.benefits.exclusiveMenu": "גישה למנות בלעדיות",
                "vip.benefits.priority": "עדיפות בהזמנות",
                "vip.benefits.doublePoints": "נקודות לויאליטי כפולות",
                "vip.join": "הצטרף ל-VIP",
                "vip.welcome": "ברוך הבא למועדון ה-VIP!",
                
                // Loyalty Points
                "loyalty.title": "נקודות לויאליטי",
                "loyalty.rate": "כל ₪1 = נקודה אחת",
                "loyalty.redemption": "100 נקודות = ₪10 הנחה",
                "loyalty.yourPoints": "הנקודות שלך:",
                
                // Order Form
                "order.personalInfo": "פרטים אישיים",
                "order.name": "שם מלא",
                "order.phone": "טלפון",
                "order.email": "אימייל",
                "order.address": "כתובת",
                "order.deliveryTime": "זמן אספקה רצוי",
                "order.notes": "הערות להזמנה",
                "order.paymentMethod": "אופן תשלום",
                "order.cash": "מזומן",
                "order.card": "כרטיס אשראי",
                "order.placeOrder": "בצע הזמנה",
                
                // Notifications
                "notify.addedToCart": "נוסף לעגלה בהצלחה!",
                "notify.removedFromCart": "הוסר מהעגלה",
                "notify.orderPlaced": "ההזמנה נשלחה בהצלחה!",
                "notify.error": "אירעה שגיאה, נסה שוב",
                "notify.loading": "טוען...",
                
                // Footer
                "footer.rights": "כל הזכויות שמורות",
                "footer.madeWith": "נבנה עם ❤️ בירושלים",
                
                // Days of week
                "day.sunday": "ראשון",
                "day.monday": "שני", 
                "day.tuesday": "שלישי",
                "day.wednesday": "רביעי",
                "day.thursday": "חמישי",
                "day.friday": "שישי",
                "day.saturday": "שבת"
            },
            en: {
                // Navigation
                "nav.dailySpecial": "Daily Special",
                "nav.menu": "Menu",
                "nav.vip": "VIP",
                "nav.contact": "Contact",
                "nav.payment": "Payment",
                "nav.cart": "Cart",
                
                // Hero Section
                "hero.title": "Jerusalem's Original Chinese Kitchen",
                "hero.subtitle": "Fresh dishes, authentic flavors, fast delivery!",
                "hero.orderNow": "Order Now",
                "hero.joinVip": "Join VIP",
                
                // Menu
                "menu.fullMenu": "Full Menu",
                "menu.search": "Search dish...",
                "menu.filterBy": "Filter by:",
                "menu.all": "All",
                "menu.vegan": "Vegan",
                "menu.vegetarian": "Vegetarian",
                "menu.spicy": "Spicy", 
                "menu.kosher": "Kosher",
                "menu.glutenFree": "Gluten Free",
                "menu.addToCart": "Add to Cart",
                "menu.viewExtras": "Extras",
                "menu.calories": "Calories",
                "menu.spiceLevel": "Spice Level",
                
                // Cart
                "cart.title": "Your Cart", 
                "cart.empty": "Cart is empty",
                "cart.items": "Items",
                "cart.subtotal": "Subtotal",
                "cart.delivery": "Delivery",
                "cart.total": "Total",
                "cart.freeDelivery": "Free delivery!",
                "cart.freeDeliveryProgress": "₪{amount} more for free delivery",
                "cart.checkout": "Proceed to Checkout",
                "cart.pickupFree": "Self pickup (Free)",
                "cart.deliveryPaid": "Delivery (₪40)",
                
                // Extras Modal
                "extras.title": "Dish Extras",
                "extras.rice": "Rice & Carbs",
                "extras.sauces": "Sauces & Spices",
                "extras.vegetables": "Fresh Vegetables", 
                "extras.proteins": "Additional Proteins",
                "extras.totalPrice": "Total price with extras",
                "extras.addToCart": "Add to Cart",
                
                // VIP System
                "vip.title": "VIP Membership",
                "vip.joinTitle": "Join VIP Membership",
                "vip.monthlyPrice": "₪299/month",
                "vip.benefits.discount": "15% discount on every order",
                "vip.benefits.freeDelivery": "Free delivery always",
                "vip.benefits.exclusiveMenu": "Access to exclusive dishes",
                "vip.benefits.priority": "Priority in orders",
                "vip.benefits.doublePoints": "Double loyalty points",
                "vip.join": "Join VIP",
                "vip.welcome": "Welcome to the VIP club!",
                
                // Loyalty Points
                "loyalty.title": "Loyalty Points",
                "loyalty.rate": "Every ₪1 = 1 point",
                "loyalty.redemption": "100 points = ₪10 discount",
                "loyalty.yourPoints": "Your points:",
                
                // Order Form
                "order.personalInfo": "Personal Information",
                "order.name": "Full Name",
                "order.phone": "Phone",
                "order.email": "Email",
                "order.address": "Address",
                "order.deliveryTime": "Preferred delivery time",
                "order.notes": "Order notes",
                "order.paymentMethod": "Payment Method",
                "order.cash": "Cash",
                "order.card": "Credit Card",
                "order.placeOrder": "Place Order",
                
                // Notifications
                "notify.addedToCart": "Added to cart successfully!",
                "notify.removedFromCart": "Removed from cart",
                "notify.orderPlaced": "Order placed successfully!",
                "notify.error": "An error occurred, please try again",
                "notify.loading": "Loading...",
                
                // Footer
                "footer.rights": "All rights reserved",
                "footer.madeWith": "Made with ❤️ in Jerusalem",
                
                // Days of week
                "day.sunday": "Sunday",
                "day.monday": "Monday",
                "day.tuesday": "Tuesday", 
                "day.wednesday": "Wednesday",
                "day.thursday": "Thursday",
                "day.friday": "Friday",
                "day.saturday": "Saturday"
            }
        };
    }

    setLanguage(lang) {
        if (lang === 'he' || lang === 'en') {
            this.currentLanguage = lang;
            this.updatePageDirection();
            this.updatePageContent();
            localStorage.setItem('lulu-kitchen-language', lang);
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    translate(key, params = {}) {
        const translations = this.translations[this.currentLanguage] || this.fallbackTranslations[this.currentLanguage];
        let translation = translations[key] || key;
        
        // Replace parameters in translation
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }

    // Shorthand for translate
    t(key, params = {}) {
        return this.translate(key, params);
    }

    updatePageDirection() {
        const html = document.documentElement;
        const body = document.body;
        
        if (this.currentLanguage === 'he') {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', 'he');
            body.classList.add('rtl');
            body.classList.remove('ltr');
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', 'en');
            body.classList.add('ltr');
            body.classList.remove('rtl');
        }
    }

    updatePageContent() {
        // Update all elements with data-translate attribute
        const translatableElements = document.querySelectorAll('[data-translate]');
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.translate(key);
        });

        // Update placeholders
        const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update titles
        const titleElements = document.querySelectorAll('[data-translate-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-translate-title');
            element.title = this.translate(key);
        });

        // Trigger custom event for components that need to update
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    initializeFromStorage() {
        const savedLanguage = localStorage.getItem('lulu-kitchen-language');
        if (savedLanguage) {
            this.setLanguage(savedLanguage);
        }
    }

    // Get localized dish name based on current language
    getDishName(dish) {
        return this.currentLanguage === 'he' ? dish.nameHe : dish.nameEn;
    }

    // Get localized dish description based on current language
    getDishDescription(dish) {
        return this.currentLanguage === 'he' ? dish.descriptionHe : dish.descriptionEn;
    }

    // Get localized category name based on current language
    getCategoryName(category) {
        return this.currentLanguage === 'he' ? category.nameHe : category.nameEn;
    }

    // Format price with currency
    formatPrice(price) {
        return `₪${price}`;
    }

    // Format date based on language
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        if (this.currentLanguage === 'he') {
            return date.toLocaleDateString('he-IL', options);
        } else {
            return date.toLocaleDateString('en-US', options);
        }
    }
}

// Initialize global translation service
window.i18n = new TranslationService();

// Auto-initialize from storage when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.initializeFromStorage();
    });
} else {
    window.i18n.initializeFromStorage();
}