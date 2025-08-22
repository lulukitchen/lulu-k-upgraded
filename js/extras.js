// Extras Modal System - 18 extras in 4 categories
class ExtrasManager {
    constructor() {
        this.selectedExtras = [];
        this.currentItem = null;
        
        this.extrasData = {
            rice: {
                name_he: 'אורז',
                name_en: 'Rice',
                items: [
                    { name: 'White Rice', name_he: 'אורז לבן', price: 8, id: 'rice_white' },
                    { name: 'Brown Rice', name_he: 'אורז חום', price: 10, id: 'rice_brown' },
                    { name: 'Fried Rice', name_he: 'אורז מטוגן', price: 12, id: 'rice_fried' },
                    { name: 'Noodles', name_he: 'אטריות', price: 12, id: 'rice_noodles' },
                    { name: 'Vegetable Rice', name_he: 'אורז ירקות', price: 15, id: 'rice_veggie' }
                ]
            },
            sauces: {
                name_he: 'רטבים',
                name_en: 'Sauces',
                items: [
                    { name: 'Sweet & Sour', name_he: 'מתוק חמוץ', price: 5, id: 'sauce_sweet_sour' },
                    { name: 'Teriyaki', name_he: 'טריאקי', price: 5, id: 'sauce_teriyaki' },
                    { name: 'Garlic', name_he: 'שום', price: 5, id: 'sauce_garlic' },
                    { name: 'Spicy Szechuan', name_he: 'סצ\'ואן חריף', price: 7, id: 'sauce_szechuan' },
                    { name: 'Honey Sesame', name_he: 'דבש שומשום', price: 6, id: 'sauce_honey' }
                ]
            },
            vegetables: {
                name_he: 'ירקות',
                name_en: 'Vegetables',
                items: [
                    { name: 'Broccoli', name_he: 'ברוקולי', price: 8, id: 'veg_broccoli' },
                    { name: 'Carrots', name_he: 'גזר', price: 6, id: 'veg_carrots' },
                    { name: 'Bell Peppers', name_he: 'פלפל צבעוני', price: 7, id: 'veg_peppers' },
                    { name: 'Mushrooms', name_he: 'פטריות', price: 9, id: 'veg_mushrooms' }
                ]
            },
            protein: {
                name_he: 'חלבונים',
                name_en: 'Proteins',
                items: [
                    { name: 'Extra Chicken', name_he: 'עוף נוסף', price: 18, id: 'protein_chicken' },
                    { name: 'Beef', name_he: 'בקר', price: 25, id: 'protein_beef' },
                    { name: 'Tofu', name_he: 'טופו', price: 12, id: 'protein_tofu' },
                    { name: 'Shrimp', name_he: 'שרימפס', price: 28, id: 'protein_shrimp' }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.createExtrasModal();
    }
    
    createExtrasModal() {
        // Check if modal already exists
        if (document.getElementById('extras-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'extras-modal';
        modal.className = 'modal extras-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="extrasManager.closeExtrasModal()">&times;</span>
                <h2>בחר תוספות</h2>
                <div id="extras-item-info"></div>
                <div id="extras-categories"></div>
                <div class="extras-total">
                    <h4>סה"כ תוספות: ₪<span id="extras-total-price">0</span></h4>
                </div>
                <div class="extras-actions">
                    <button class="btn-secondary" onclick="extrasManager.clearExtras()">נקה הכל</button>
                    <button class="btn-primary" onclick="extrasManager.addToCartWithExtras()">הוסף לעגלה</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showExtrasModal(item) {
        this.currentItem = item;
        this.selectedExtras = [];
        
        this.updateItemInfo();
        this.renderExtrasCategories();
        this.updateExtrasTotal();
        
        luluKitchen.openModal('extras-modal');
    }
    
    closeExtrasModal() {
        luluKitchen.closeModal('extras-modal');
        this.selectedExtras = [];
        this.currentItem = null;
    }
    
    updateItemInfo() {
        const itemInfo = document.getElementById('extras-item-info');
        if (!itemInfo || !this.currentItem) return;
        
        const hasDiscount = this.currentItem.price_discount > 0;
        const displayPrice = hasDiscount ? this.currentItem.price_discount : this.currentItem.price;
        
        itemInfo.innerHTML = `
            <div class="extras-item-info">
                <img src="${this.currentItem.imageUrl}" alt="${this.currentItem.alt_text}" 
                     style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px; float: right; margin-left: 1rem;">
                <div>
                    <h3>${this.currentItem.name_he}</h3>
                    <p style="color: var(--gray); margin: 0.5rem 0;">${this.currentItem.description_he}</p>
                    <div class="item-base-price">
                        <span style="font-size: 1.2rem; font-weight: bold; color: var(--primary-red);">₪${displayPrice}</span>
                        ${hasDiscount ? `<span style="text-decoration: line-through; color: var(--gray); margin-right: 0.5rem;">₪${this.currentItem.price}</span>` : ''}
                    </div>
                </div>
                <div style="clear: both;"></div>
            </div>
        `;
    }
    
    renderExtrasCategories() {
        const categoriesContainer = document.getElementById('extras-categories');
        if (!categoriesContainer) return;
        
        categoriesContainer.innerHTML = Object.keys(this.extrasData).map(categoryKey => {
            const category = this.extrasData[categoryKey];
            return `
                <div class="extras-category">
                    <h4>${category.name_he}</h4>
                    <div class="extras-list">
                        ${category.items.map(item => this.getExtraItemHTML(item, categoryKey)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getExtraItemHTML(item, categoryKey) {
        const isSelected = this.selectedExtras.some(extra => extra.id === item.id);
        
        return `
            <div class="extra-item ${isSelected ? 'selected' : ''}" 
                 onclick="extrasManager.toggleExtra('${item.id}', '${categoryKey}')"
                 data-extra-id="${item.id}">
                <div class="extra-info">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onclick="event.stopPropagation();" readonly>
                    <span>${item.name_he}</span>
                </div>
                <div class="extra-price">+₪${item.price}</div>
            </div>
        `;
    }
    
    toggleExtra(extraId, categoryKey) {
        const category = this.extrasData[categoryKey];
        const extraItem = category.items.find(item => item.id === extraId);
        
        if (!extraItem) return;
        
        const existingIndex = this.selectedExtras.findIndex(extra => extra.id === extraId);
        
        if (existingIndex >= 0) {
            // Remove extra
            this.selectedExtras.splice(existingIndex, 1);
        } else {
            // Add extra
            this.selectedExtras.push({
                ...extraItem,
                category: categoryKey,
                category_he: category.name_he
            });
        }
        
        this.renderExtrasCategories();
        this.updateExtrasTotal();
        this.showExtrasFeedback(extraItem.name_he, existingIndex >= 0 ? 'removed' : 'added');
    }
    
    clearExtras() {
        this.selectedExtras = [];
        this.renderExtrasCategories();
        this.updateExtrasTotal();
        luluKitchen.showNotification('כל התוספות נוקו', 'info');
    }
    
    updateExtrasTotal() {
        const totalPriceEl = document.getElementById('extras-total-price');
        if (!totalPriceEl) return;
        
        const totalPrice = this.selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
        totalPriceEl.textContent = totalPrice.toFixed(0);
    }
    
    addToCartWithExtras() {
        if (!this.currentItem) return;
        
        // Add item to cart with selected extras
        luluKitchen.addToCart(this.currentItem, this.selectedExtras);
        
        // Show confirmation with extras details
        const extrasText = this.selectedExtras.length > 0 ? 
            ` עם תוספות: ${this.selectedExtras.map(e => e.name_he).join(', ')}` : '';
        
        luluKitchen.showNotification(
            `${this.currentItem.name_he}${extrasText} נוסף לעגלה!`, 
            'success'
        );
        
        this.closeExtrasModal();
    }
    
    showExtrasFeedback(extraName, action) {
        const message = action === 'added' ? 
            `${extraName} נוסף` : 
            `${extraName} הוסר`;
        
        // Create mini feedback
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            background: ${action === 'added' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            z-index: 2002;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }
    
    // Quick add extras for popular combinations
    getPopularCombinations() {
        return {
            'combo_basic': {
                name_he: 'קומבו בסיסי',
                extras: ['rice_white', 'sauce_teriyaki'],
                discount: 2
            },
            'combo_veggie': {
                name_he: 'קומבו צמחוני',
                extras: ['rice_brown', 'veg_broccoli', 'veg_carrots', 'sauce_garlic'],
                discount: 3
            },
            'combo_protein': {
                name_he: 'קומבו חלבוני',
                extras: ['rice_fried', 'protein_chicken', 'sauce_szechuan'],
                discount: 5
            }
        };
    }
    
    addPopularCombo(comboKey) {
        const combinations = this.getPopularCombinations();
        const combo = combinations[comboKey];
        
        if (!combo) return;
        
        // Clear current selection
        this.selectedExtras = [];
        
        // Add combo extras
        combo.extras.forEach(extraId => {
            Object.keys(this.extrasData).forEach(categoryKey => {
                const category = this.extrasData[categoryKey];
                const extraItem = category.items.find(item => item.id === extraId);
                if (extraItem) {
                    this.selectedExtras.push({
                        ...extraItem,
                        category: categoryKey,
                        category_he: category.name_he
                    });
                }
            });
        });
        
        this.renderExtrasCategories();
        this.updateExtrasTotal();
        luluKitchen.showNotification(`${combo.name_he} נוסף!`, 'success');
    }
    
    // Get extras recommendations based on item
    getRecommendedExtras(item) {
        const recommendations = {
            // For chicken dishes
            'chicken': ['sauce_teriyaki', 'rice_white', 'veg_broccoli'],
            // For rice dishes  
            'rice': ['protein_chicken', 'veg_peppers', 'sauce_szechuan'],
            // For noodle dishes
            'noodles': ['protein_beef', 'veg_mushrooms', 'sauce_garlic'],
            // For vegetarian dishes
            'vegetarian': ['protein_tofu', 'veg_carrots', 'sauce_honey']
        };
        
        const itemName = item.name_he.toLowerCase();
        let recommended = [];
        
        if (itemName.includes('עוף')) {
            recommended = recommendations.chicken;
        } else if (itemName.includes('אורז')) {
            recommended = recommendations.rice;
        } else if (itemName.includes('אטריות')) {
            recommended = recommendations.noodles;
        } else if (item.vegan) {
            recommended = recommendations.vegetarian;
        }
        
        return recommended;
    }
    
    showRecommendedExtras() {
        if (!this.currentItem) return;
        
        const recommended = this.getRecommendedExtras(this.currentItem);
        if (recommended.length === 0) return;
        
        const modal = document.getElementById('extras-modal');
        const existingRec = modal.querySelector('.recommended-extras');
        if (existingRec) existingRec.remove();
        
        const recDiv = document.createElement('div');
        recDiv.className = 'recommended-extras';
        recDiv.style.cssText = `
            background: var(--light-gold);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            text-align: center;
        `;
        
        recDiv.innerHTML = `
            <h4 style="color: var(--dark-red); margin-bottom: 0.5rem;">💡 מומלץ עבור המנה הזאת</h4>
            <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                ${recommended.map(extraId => {
                    const extra = this.findExtraById(extraId);
                    return extra ? `
                        <button class="btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.9rem;"
                                onclick="extrasManager.quickAddExtra('${extraId}')">
                            ${extra.name_he} +₪${extra.price}
                        </button>
                    ` : '';
                }).join('')}
            </div>
        `;
        
        const categoriesContainer = document.getElementById('extras-categories');
        categoriesContainer.insertBefore(recDiv, categoriesContainer.firstChild);
    }
    
    findExtraById(extraId) {
        for (const categoryKey in this.extrasData) {
            const category = this.extrasData[categoryKey];
            const extra = category.items.find(item => item.id === extraId);
            if (extra) {
                return { ...extra, category: categoryKey, category_he: category.name_he };
            }
        }
        return null;
    }
    
    quickAddExtra(extraId) {
        const extra = this.findExtraById(extraId);
        if (!extra) return;
        
        const existingIndex = this.selectedExtras.findIndex(e => e.id === extraId);
        if (existingIndex >= 0) {
            luluKitchen.showNotification('התוספת כבר נבחרה', 'info');
            return;
        }
        
        this.selectedExtras.push(extra);
        this.renderExtrasCategories();
        this.updateExtrasTotal();
        this.showExtrasFeedback(extra.name_he, 'added');
    }
}

// Initialize extras manager
let extrasManager;
document.addEventListener('DOMContentLoaded', () => {
    extrasManager = new ExtrasManager();
    window.extrasManager = extrasManager;
});