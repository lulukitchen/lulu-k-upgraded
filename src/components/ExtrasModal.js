// Extras Modal System for 18 Toppings in 4 Categories
class ExtrasModal {
    constructor() {
        this.isOpen = false;
        this.currentDish = null;
        this.selectedExtras = [];
        this.quantity = 1;
        this.extrasData = this.getExtrasData();
        this.init();
    }

    // 18 extras in 4 categories as specified
    getExtrasData() {
        return {
            rice: {
                nameHe: 'אורז ופחמימות',
                nameEn: 'Rice & Carbs',
                icon: '🍚',
                extras: [
                    { id: 'white-rice', nameHe: 'אורז לבן מאודה', nameEn: 'White Steamed Rice', price: 8 },
                    { id: 'brown-rice', nameHe: 'אורז מלא אורגני', nameEn: 'Organic Brown Rice', price: 12 },
                    { id: 'fried-rice', nameHe: 'אורז מטוגן עם ביצה', nameEn: 'Fried Rice with Egg', price: 15 },
                    { id: 'udon-noodles', nameHe: 'אטריות אודון', nameEn: 'Udon Noodles', price: 18 },
                    { id: 'wide-noodles', nameHe: 'אטריות רחבות', nameEn: 'Wide Noodles', price: 16 }
                ]
            },
            sauces: {
                nameHe: 'רטבים ותבלינים',
                nameEn: 'Sauces & Spices',
                icon: '🥄',
                extras: [
                    { id: 'szechuan-sauce', nameHe: 'רטב חריף סצ\'ואן', nameEn: 'Spicy Szechuan Sauce', price: 5 },
                    { id: 'sweet-sour-sauce', nameHe: 'רטב מתוק חמוץ', nameEn: 'Sweet & Sour Sauce', price: 6 },
                    { id: 'special-soy', nameHe: 'רטב סויה מיוחד', nameEn: 'Special Soy Sauce', price: 8 },
                    { id: 'chili-oil', nameHe: 'רטב צ\'ילי שמן', nameEn: 'Chili Oil Sauce', price: 7 },
                    { id: 'hong-shao', nameHe: 'רטב הונג שאו', nameEn: 'Hong Shao Sauce', price: 10 }
                ]
            },
            vegetables: {
                nameHe: 'ירקות טריים',
                nameEn: 'Fresh Vegetables',
                icon: '🥬',
                extras: [
                    { id: 'broccoli', nameHe: 'ברוקולי מוקפץ', nameEn: 'Stir-fried Broccoli', price: 12 },
                    { id: 'carrot-snow-peas', nameHe: 'גזר וקשיות', nameEn: 'Carrot & Snow Peas', price: 10 },
                    { id: 'bell-peppers', nameHe: 'פלפלים צבעוניים', nameEn: 'Colorful Bell Peppers', price: 8 },
                    { id: 'shiitake', nameHe: 'פטריות שיטאקי', nameEn: 'Shiitake Mushrooms', price: 15 },
                    { id: 'chinese-greens', nameHe: 'ירקות עלים סיניים', nameEn: 'Chinese Leafy Greens', price: 14 }
                ]
            },
            proteins: {
                nameHe: 'חלבונים נוספים',
                nameEn: 'Additional Proteins',
                icon: '🥩',
                extras: [
                    { id: 'crispy-chicken', nameHe: 'חזה עוף קריספי', nameEn: 'Crispy Chicken Breast', price: 22 },
                    { id: 'marinated-beef', nameHe: 'בקר במרינדה', nameEn: 'Marinated Beef', price: 25 },
                    { id: 'honey-pork', nameHe: 'חזיר בדבש', nameEn: 'Honey Glazed Pork', price: 24 },
                    { id: 'golden-tofu', nameHe: 'טופו זהוב', nameEn: 'Golden Tofu', price: 12 },
                    { id: 'tempura-shrimp', nameHe: 'שרימפס טמפורה', nameEn: 'Tempura Shrimp', price: 28 }
                ]
            }
        };
    }

    init() {
        this.createModalHTML();
        this.bindEvents();
    }

    createModalHTML() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('extras-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'extras-modal';
            modal.className = 'modal extras-modal';
            modal.style.display = 'none';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content extras-modal-content">
                <div class="modal-header">
                    <h2 id="extras-modal-title">תוספות למנה</h2>
                    <span class="close" onclick="extrasModal.close()">&times;</span>
                </div>
                
                <div class="dish-info" id="extras-dish-info">
                    <!-- Dish info will be populated here -->
                </div>

                <div class="extras-tabs">
                    ${Object.entries(this.extrasData).map(([categoryId, category]) => `
                        <button class="tab-button ${categoryId === 'rice' ? 'active' : ''}" 
                                data-category="${categoryId}">
                            <span class="tab-icon">${category.icon}</span>
                            <span class="tab-name" data-translate="extras.${categoryId}">
                                ${category.nameHe}
                            </span>
                        </button>
                    `).join('')}
                </div>

                <div class="extras-content">
                    ${Object.entries(this.extrasData).map(([categoryId, category]) => `
                        <div class="extras-category ${categoryId === 'rice' ? 'active' : ''}" 
                             data-category="${categoryId}">
                            <div class="extras-grid">
                                ${category.extras.map(extra => `
                                    <div class="extra-card" data-extra-id="${extra.id}">
                                        <div class="extra-info">
                                            <h4 class="extra-name">${extra.nameHe}</h4>
                                            <p class="extra-name-en">${extra.nameEn}</p>
                                            <div class="extra-price">₪${extra.price}</div>
                                        </div>
                                        <button class="extra-toggle" 
                                                onclick="extrasModal.toggleExtra('${extra.id}')">
                                            <span class="toggle-text">הוסף</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="price-calculator">
                    <div class="base-price-row">
                        <span class="label">מחיר בסיסי:</span>
                        <span class="price" id="base-price-display">₪0</span>
                    </div>
                    <div class="extras-price-row">
                        <span class="label">תוספות:</span>
                        <span class="price" id="extras-price-display">₪0</span>
                    </div>
                    <div class="total-price-row">
                        <span class="label">סה״כ:</span>
                        <span class="price" id="total-price-display">₪0</span>
                    </div>
                </div>

                <div class="quantity-selector">
                    <label for="extras-quantity">כמות:</label>
                    <div class="quantity-controls">
                        <button type="button" onclick="extrasModal.updateQuantity(-1)">-</button>
                        <input type="number" id="extras-quantity" value="1" min="1" max="20" 
                               onchange="extrasModal.setQuantity(this.value)">
                        <button type="button" onclick="extrasModal.updateQuantity(1)">+</button>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" onclick="extrasModal.close()">ביטול</button>
                    <button class="btn-primary" id="add-to-cart-with-extras" 
                            onclick="extrasModal.addToCart()">
                        הוסף לעגלה - <span id="final-price-display">₪0</span>
                    </button>
                </div>
            </div>
        `;
    }

    open(dish) {
        this.currentDish = { ...dish };
        this.selectedExtras = [];
        this.quantity = 1;
        this.isOpen = true;

        // Update dish info
        this.updateDishInfo();
        
        // Reset all selections
        this.resetSelections();
        
        // Update prices
        this.updatePrices();
        
        // Show modal
        const modal = document.getElementById('extras-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus management
        setTimeout(() => {
            const firstTab = modal.querySelector('.tab-button');
            if (firstTab) firstTab.focus();
        }, 100);
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('extras-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentDish = null;
        this.selectedExtras = [];
    }

    updateDishInfo() {
        if (!this.currentDish) return;

        const dishInfoContainer = document.getElementById('extras-dish-info');
        const dishName = window.i18n ? window.i18n.getDishName(this.currentDish) : this.currentDish.nameHe;
        const dishDesc = window.i18n ? window.i18n.getDishDescription(this.currentDish) : this.currentDish.descriptionHe;

        dishInfoContainer.innerHTML = `
            <div class="dish-preview">
                <img src="${this.currentDish.image}" alt="${dishName}" class="dish-image">
                <div class="dish-details">
                    <h3 class="dish-name">${dishName}</h3>
                    <p class="dish-description">${dishDesc}</p>
                    <div class="dish-tags">
                        ${this.currentDish.isVegan ? '<span class="tag vegan">🌱 טבעוני</span>' : ''}
                        ${this.currentDish.isVegetarian ? '<span class="tag vegetarian">🥗 צמחוני</span>' : ''}
                        ${this.currentDish.spiceLevel > 0 ? `<span class="tag spicy">🌶️ ${'🔥'.repeat(this.currentDish.spiceLevel)}</span>` : ''}
                        ${this.currentDish.isKosher ? '<span class="tag kosher">✡️ כשר</span>' : ''}
                        ${this.currentDish.isGlutenFree ? '<span class="tag gluten-free">🚫🌾 ללא גלוטן</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(categoryId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryId);
        });

        // Update category content
        document.querySelectorAll('.extras-category').forEach(category => {
            category.classList.toggle('active', category.dataset.category === categoryId);
        });
    }

    toggleExtra(extraId) {
        const extraData = this.findExtraById(extraId);
        if (!extraData) return;

        const existingIndex = this.selectedExtras.findIndex(e => e.id === extraId);
        const extraCard = document.querySelector(`[data-extra-id="${extraId}"]`);
        const toggleButton = extraCard.querySelector('.extra-toggle');

        if (existingIndex > -1) {
            // Remove extra
            this.selectedExtras.splice(existingIndex, 1);
            extraCard.classList.remove('selected');
            toggleButton.innerHTML = '<span class="toggle-text">הוסף</span>';
        } else {
            // Add extra
            this.selectedExtras.push(extraData);
            extraCard.classList.add('selected');
            toggleButton.innerHTML = '<span class="toggle-text">הוסר</span>';
        }

        this.updatePrices();
    }

    findExtraById(extraId) {
        for (const category of Object.values(this.extrasData)) {
            const extra = category.extras.find(e => e.id === extraId);
            if (extra) return extra;
        }
        return null;
    }

    updateQuantity(delta) {
        this.quantity = Math.max(1, Math.min(20, this.quantity + delta));
        document.getElementById('extras-quantity').value = this.quantity;
        this.updatePrices();
    }

    setQuantity(value) {
        const newQuantity = parseInt(value);
        if (newQuantity >= 1 && newQuantity <= 20) {
            this.quantity = newQuantity;
            this.updatePrices();
        }
    }

    updatePrices() {
        if (!this.currentDish) return;

        const basePrice = this.currentDish.price;
        const extrasPrice = this.selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
        const totalPerItem = basePrice + extrasPrice;
        const finalTotal = totalPerItem * this.quantity;

        // Update price displays
        document.getElementById('base-price-display').textContent = `₪${basePrice}`;
        document.getElementById('extras-price-display').textContent = `₪${extrasPrice}`;
        document.getElementById('total-price-display').textContent = `₪${totalPerItem}`;
        document.getElementById('final-price-display').textContent = `₪${finalTotal}`;

        // Update button text
        const addButton = document.getElementById('add-to-cart-with-extras');
        const buttonText = this.quantity > 1 
            ? `הוסף ${this.quantity} לעגלה - ₪${finalTotal}`
            : `הוסף לעגלה - ₪${finalTotal}`;
        addButton.innerHTML = buttonText;

        // Disable/enable button based on selection
        addButton.disabled = false;
    }

    resetSelections() {
        // Clear selected extras
        this.selectedExtras = [];
        
        // Reset UI
        document.querySelectorAll('.extra-card').forEach(card => {
            card.classList.remove('selected');
            const toggleButton = card.querySelector('.extra-toggle');
            toggleButton.innerHTML = '<span class="toggle-text">הוסף</span>';
        });

        // Reset quantity
        this.quantity = 1;
        document.getElementById('extras-quantity').value = 1;

        // Reset to first tab
        this.switchTab('rice');
    }

    addToCart() {
        if (!this.currentDish || !window.cart) return;

        // Add to cart with selected extras
        const cartItem = window.cart.addToCart(
            this.currentDish, 
            this.selectedExtras, 
            this.quantity
        );

        if (cartItem) {
            // Close modal
            this.close();
            
            // Show success message
            this.showSuccessMessage();
            
            // Optional: Open cart to show the added item
            this.showCartPreview(cartItem);
        }
    }

    showSuccessMessage() {
        const message = window.i18n ? window.i18n.t('notify.addedToCart') : 'נוסף לעגלה בהצלחה!';
        
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showCartPreview(cartItem) {
        // Briefly show cart animation or preview
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('bounce');
            setTimeout(() => {
                cartIcon.classList.remove('bounce');
            }, 600);
        }
    }

    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tab-button')) {
                const categoryId = e.target.closest('.tab-button').dataset.category;
                this.switchTab(categoryId);
            }
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('extras-modal');
            if (e.target === modal) {
                this.close();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'Tab':
                    // Handle tab navigation within modal
                    this.handleTabNavigation(e);
                    break;
            }
        });

        // Language change updates
        window.addEventListener('languageChanged', () => {
            if (this.isOpen) {
                this.updateDishInfo();
            }
        });
    }

    handleTabNavigation(e) {
        const modal = document.getElementById('extras-modal');
        const focusableElements = modal.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
}

// Initialize global extras modal
window.extrasModal = new ExtrasModal();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.extrasModal) {
            window.extrasModal = new ExtrasModal();
        }
    });
}