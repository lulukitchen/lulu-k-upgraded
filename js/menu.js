// Menu Management and CSV Loading
class MenuManager {
    constructor() {
        this.menuData = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFmGECEXCaaH6uXJ_lDHO7g1GaIwh-aHTy9P_EVoTYWxROaBOa_XPJ4H3OOe4h4NwlU93Lg-_au-2B/pub?gid=1874715002&single=true&output=csv';
        this.imageBaseUrl = 'https://lulu-k.com/images/';
        this.comparisonItems = JSON.parse(localStorage.getItem('luluComparison')) || [];
        
        this.init();
    }
    
    init() {
        this.loadMenu();
        this.setupDailySpecial();
        this.loadComparison();
    }
    
    async loadMenu() {
        try {
            this.showLoadingState();
            
            // Try to load from CSV first
            try {
                const response = await fetch(this.csvUrl);
                const csvText = await response.text();
                this.menuData = this.parseCSV(csvText);
                console.log('Menu loaded from CSV:', this.menuData.length, 'items');
            } catch (csvError) {
                console.warn('Could not load from CSV, using fallback data:', csvError);
                this.menuData = this.getFallbackMenuData();
            }
            
            this.filteredData = [...this.menuData];
            this.renderMenu();
            this.setupCategories();
            
        } catch (error) {
            console.error('Error loading menu:', error);
            this.showErrorState();
        }
    }
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const item = {};
            
            headers.forEach((header, index) => {
                item[header] = values[index] || '';
            });
            
            // Convert numeric fields
            item.price = parseFloat(item.price) || 0;
            item.price_discount = parseFloat(item.price_discount) || 0;
            item.display_order = parseInt(item.display_order) || 0;
            
            // Convert boolean fields
            item.vegan = item.vegan.toLowerCase() === 'true';
            item.spicy = item.spicy.toLowerCase() === 'true';
            item.chef_recommendation = item.chef_recommendation.toLowerCase() === 'true';
            
            // Set image URL
            if (item.Image_url && !item.Image_url.startsWith('http')) {
                item.imageUrl = this.imageBaseUrl + item.Image_url;
            } else {
                item.imageUrl = item.Image_url || '/images/placeholder.jpg';
            }
            
            // Parse extras if available
            if (item.extras) {
                try {
                    item.extrasArray = item.extras.split(';').map(e => e.trim()).filter(e => e);
                } catch (e) {
                    item.extrasArray = [];
                }
            } else {
                item.extrasArray = [];
            }
            
            return item;
        });
    }
    
    parseCSVLine(line) {
        const result = [];
        let inQuotes = false;
        let current = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }
    
    getFallbackMenuData() {
        // Fallback data when CSV is not available
        return [
            {
                Id: '1',
                name_he: 'עוף בטריאקי',
                description_he: 'חתיכות עוף רכות ברוטב טריאקי מתוק וארבעה ירקות טריים',
                price: 45,
                price_discount: 0,
                imageUrl: '/images/chicken-teriyaki.jpg',
                alt_text: 'עוף בטריאקי',
                category_he: 'מנות עיקריות',
                vegan: false,
                spicy: false,
                chef_recommendation: true,
                display_order: 1,
                extrasArray: ['אורז', 'ירקות', 'רוטב חריף']
            },
            {
                Id: '2',
                name_he: 'אטריות מוקפצות',
                description_he: 'אטריות דקות מוקפצות עם ירקות טריים וחלבון לבחירה',
                price: 38,
                price_discount: 32,
                imageUrl: '/images/stir-fry-noodles.jpg',
                alt_text: 'אטריות מוקפצות',
                category_he: 'מנות עיקריות',
                vegan: true,
                spicy: false,
                chef_recommendation: false,
                display_order: 2,
                extrasArray: ['בשר', 'עוף', 'טופו']
            },
            {
                Id: '3',
                name_he: 'אורז מטוגן',
                description_he: 'אורז מטוגן ברוטב סויה עם ביצה וירקות',
                price: 35,
                price_discount: 0,
                imageUrl: '/images/fried-rice.jpg',
                alt_text: 'אורז מטוגן',
                category_he: 'מנות עיקריות',
                vegan: false,
                spicy: false,
                chef_recommendation: false,
                display_order: 3,
                extrasArray: ['בשר', 'עוף', 'ירקות נוספים']
            },
            {
                Id: '4',
                name_he: 'דים סאם',
                description_he: 'כיסוני בצק מאודים במילוי בשר או ירקות',
                price: 28,
                price_discount: 0,
                imageUrl: '/images/dim-sum.jpg',
                alt_text: 'דים סאם',
                category_he: 'מנות פתיחה',
                vegan: false,
                spicy: false,
                chef_recommendation: true,
                display_order: 4,
                extrasArray: ['רוטב צ\'ילי', 'רוטב סויה']
            }
        ];
    }
    
    renderMenu() {
        const menuGrid = document.getElementById('menu-grid');
        if (!menuGrid) return;
        
        if (this.filteredData.length === 0) {
            menuGrid.innerHTML = '<div class="no-results">לא נמצאו מנות התואמות לסינון</div>';
            return;
        }
        
        // Sort by display_order and chef recommendations
        const sortedData = [...this.filteredData].sort((a, b) => {
            if (a.chef_recommendation && !b.chef_recommendation) return -1;
            if (!a.chef_recommendation && b.chef_recommendation) return 1;
            return a.display_order - b.display_order;
        });
        
        menuGrid.innerHTML = sortedData.map(item => this.getMenuItemHTML(item)).join('');
    }
    
    getMenuItemHTML(item) {
        const hasDiscount = item.price_discount > 0 && item.price_discount < item.price;
        const displayPrice = hasDiscount ? item.price_discount : item.price;
        
        const tags = [];
        if (item.vegan) tags.push('<span class="tag vegan">🌱 טבעוני</span>');
        if (item.spicy) tags.push('<span class="tag spicy">🌶️ חריף</span>');
        if (item.chef_recommendation) tags.push('<span class="tag chef-rec">👨‍🍳 המלצת השף</span>');
        
        return `
            <div class="menu-item" data-id="${item.Id}" data-category="${item.category_he}" 
                 onmouseenter="this.showQuickPreview && this.showQuickPreview('${item.Id}')"
                 onmouseleave="this.hideQuickPreview && this.hideQuickPreview()">
                <img src="${item.imageUrl}" alt="${item.alt_text}" loading="lazy" 
                     onerror="this.src='/images/placeholder.jpg'">
                <div class="menu-item-content">
                    <h3>${item.name_he}</h3>
                    <p>${item.description_he}</p>
                    
                    <div class="menu-item-tags">
                        ${tags.join('')}
                    </div>
                    
                    <div class="menu-item-price">
                        <span class="price">₪${displayPrice.toFixed(0)}</span>
                        ${hasDiscount ? `<span class="price-discount">₪${item.price.toFixed(0)}</span>` : ''}
                    </div>
                    
                    <div class="menu-item-actions">
                        <button class="btn-add-cart" onclick="menuManager.addToCartWithExtras('${item.Id}')">
                            הוסף לעגלה
                        </button>
                        <button class="btn-compare" onclick="menuManager.addToComparison('${item.Id}')" title="השווה">
                            ⚖️
                        </button>
                        <button class="btn-quick-view" onclick="menuManager.showQuickView('${item.Id}')" title="תצוגה מהירה">
                            👁️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    filterMenu(category) {
        this.currentFilter = category;
        
        if (category === 'all') {
            this.filteredData = [...this.menuData];
        } else {
            this.filteredData = this.menuData.filter(item => {
                switch (category) {
                    case 'vegetarian':
                        return item.vegan;
                    case 'spicy':
                        return item.spicy;
                    case 'starter':
                        return item.category_he.includes('פתיחה');
                    case 'main':
                        return item.category_he.includes('עיקריות');
                    case 'family':
                        return item.name_he.includes('XL') || item.name_he.includes('משפחתי');
                    default:
                        return item.category_he.toLowerCase().includes(category.toLowerCase());
                }
            });
        }
        
        this.applyAllergenFilters();
        this.renderMenu();
    }
    
    applyAllergenFilters() {
        const hideGluten = document.getElementById('hide-gluten')?.checked;
        const hideNuts = document.getElementById('hide-nuts')?.checked;
        const hideDairy = document.getElementById('hide-dairy')?.checked;
        const hideSoy = document.getElementById('hide-soy')?.checked;
        
        let filtered = [...this.filteredData];
        
        if (hideGluten) {
            filtered = filtered.filter(item => 
                !item.description_he.includes('גלוטן') && 
                !item.name_he.includes('אטריות') &&
                !item.Tags?.includes('gluten')
            );
        }
        
        if (hideNuts) {
            filtered = filtered.filter(item => 
                !item.description_he.includes('אגוז') && 
                !item.Tags?.includes('nuts')
            );
        }
        
        if (hideDairy) {
            filtered = filtered.filter(item => 
                !item.description_he.includes('חלב') && 
                !item.Tags?.includes('dairy')
            );
        }
        
        if (hideSoy) {
            filtered = filtered.filter(item => 
                !item.description_he.includes('סויה') && 
                !item.Tags?.includes('soy')
            );
        }
        
        this.filteredData = filtered;
    }
    
    setupCategories() {
        // Create category navigation if it doesn't exist
        const existingNav = document.querySelector('.category-nav');
        if (existingNav) return;
        
        const categories = [...new Set(this.menuData.map(item => item.category_he))];
        
        if (categories.length <= 1) return; // Don't create nav if only one category
        
        const categoryNav = document.createElement('nav');
        categoryNav.className = 'category-nav';
        categoryNav.innerHTML = `
            <ul>
                <li><a href="#" onclick="menuManager.filterMenu('all')" class="active">הכל</a></li>
                ${categories.map(cat => 
                    `<li><a href="#" onclick="menuManager.filterMenu('${cat}')">${cat}</a></li>`
                ).join('')}
            </ul>
        `;
        
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            menuSection.insertBefore(categoryNav, menuSection.firstChild.nextSibling);
        }
    }
    
    addToCartWithExtras(itemId) {
        const item = this.menuData.find(i => i.Id === itemId);
        if (!item) return;
        
        // If item has available extras, show extras modal
        if (item.extrasArray && item.extrasArray.length > 0) {
            this.showExtrasModal(item);
        } else {
            // Add directly to cart
            luluKitchen.addToCart(item, []);
        }
    }
    
    showExtrasModal(item) {
        // This will be implemented in extras.js
        if (window.extrasManager) {
            window.extrasManager.showExtrasModal(item);
        } else {
            // Fallback - add without extras
            luluKitchen.addToCart(item, []);
        }
    }
    
    // Comparison System
    addToComparison(itemId) {
        if (this.comparisonItems.length >= 3) {
            luluKitchen.showNotification('ניתן להשוות עד 3 מנות בלבד', 'error');
            return;
        }
        
        if (this.comparisonItems.includes(itemId)) {
            luluKitchen.showNotification('המנה כבר בהשוואה', 'error');
            return;
        }
        
        this.comparisonItems.push(itemId);
        localStorage.setItem('luluComparison', JSON.stringify(this.comparisonItems));
        this.updateComparisonDisplay();
        luluKitchen.showNotification('המנה נוספה להשוואה', 'success');
    }
    
    removeFromComparison(itemId) {
        this.comparisonItems = this.comparisonItems.filter(id => id !== itemId);
        localStorage.setItem('luluComparison', JSON.stringify(this.comparisonItems));
        this.updateComparisonDisplay();
    }
    
    clearComparison() {
        this.comparisonItems = [];
        localStorage.removeItem('luluComparison');
        this.updateComparisonDisplay();
    }
    
    updateComparisonDisplay() {
        const comparisonSection = document.getElementById('comparison-section');
        const comparisonGrid = document.getElementById('comparison-grid');
        
        if (!comparisonSection || !comparisonGrid) return;
        
        if (this.comparisonItems.length === 0) {
            comparisonSection.style.display = 'none';
            return;
        }
        
        comparisonSection.style.display = 'block';
        const comparisonData = this.comparisonItems
            .map(id => this.menuData.find(item => item.Id === id))
            .filter(item => item);
        
        comparisonGrid.innerHTML = comparisonData.map(item => this.getComparisonItemHTML(item)).join('');
    }
    
    getComparisonItemHTML(item) {
        const displayPrice = item.price_discount > 0 ? item.price_discount : item.price;
        
        return `
            <div class="comparison-item">
                <img src="${item.imageUrl}" alt="${item.alt_text}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                <h4>${item.name_he}</h4>
                <p class="price">₪${displayPrice.toFixed(0)}</p>
                <p style="font-size: 0.9rem; color: var(--gray);">${item.description_he}</p>
                <button class="btn-secondary" onclick="menuManager.removeFromComparison('${item.Id}')">הסר</button>
            </div>
        `;
    }
    
    loadComparison() {
        this.updateComparisonDisplay();
    }
    
    // Quick View Modal
    showQuickView(itemId) {
        const item = this.menuData.find(i => i.Id === itemId);
        if (!item) return;
        
        const modal = document.getElementById('preview-modal');
        const content = document.getElementById('preview-content');
        
        if (!modal || !content) return;
        
        const hasDiscount = item.price_discount > 0 && item.price_discount < item.price;
        const displayPrice = hasDiscount ? item.price_discount : item.price;
        
        content.innerHTML = `
            <div class="quick-view-content">
                <img src="${item.imageUrl}" alt="${item.alt_text}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 10px;">
                <h2>${item.name_he}</h2>
                <p>${item.description_he}</p>
                <div class="price-section">
                    <span class="price" style="font-size: 1.5rem; color: var(--primary-red);">₪${displayPrice.toFixed(0)}</span>
                    ${hasDiscount ? `<span class="price-discount" style="text-decoration: line-through; color: var(--gray);">₪${item.price.toFixed(0)}</span>` : ''}
                </div>
                <div style="margin: 1rem 0;">
                    ${item.vegan ? '<span class="tag vegan">🌱 טבעוני</span>' : ''}
                    ${item.spicy ? '<span class="tag spicy">🌶️ חריף</span>' : ''}
                    ${item.chef_recommendation ? '<span class="tag chef-rec">👨‍🍳 המלצת השף</span>' : ''}
                </div>
                <button class="btn-primary" onclick="menuManager.addToCartWithExtras('${item.Id}'); luluKitchen.closeModal('preview-modal')">הוסף לעגלה</button>
            </div>
        `;
        
        luluKitchen.openModal('preview-modal');
    }
    
    // Daily Special
    setupDailySpecial() {
        const today = new Date().getDay();
        let specialItem = null;
        
        // Try to get today's special from menu data
        if (this.menuData.length > 0) {
            const chefRecommendations = this.menuData.filter(item => item.chef_recommendation);
            if (chefRecommendations.length > 0) {
                specialItem = chefRecommendations[today % chefRecommendations.length];
            } else {
                specialItem = this.menuData[today % this.menuData.length];
            }
        }
        
        if (!specialItem) {
            // Use fallback special
            specialItem = {
                name_he: 'עוף בטריאקי מיוחד',
                description_he: 'המנה הכי פופולרית שלנו עם הנחה מיוחדת!',
                price: 45,
                price_discount: 35,
                imageUrl: '/images/special-today.jpg'
            };
        }
        
        this.updateDailySpecial(specialItem);
    }
    
    updateDailySpecial(item) {
        const nameEl = document.getElementById('special-name');
        const descEl = document.getElementById('special-description');
        const imgEl = document.getElementById('special-img');
        const originalEl = document.getElementById('special-original');
        const finalEl = document.getElementById('special-final');
        
        if (nameEl) nameEl.textContent = item.name_he;
        if (descEl) descEl.textContent = item.description_he;
        if (imgEl) {
            imgEl.src = item.imageUrl;
            imgEl.alt = item.name_he;
        }
        
        const hasDiscount = item.price_discount > 0 && item.price_discount < item.price;
        
        if (originalEl) {
            originalEl.textContent = hasDiscount ? `₪${item.price}` : '';
            originalEl.style.display = hasDiscount ? 'inline' : 'none';
        }
        
        if (finalEl) {
            finalEl.textContent = `₪${hasDiscount ? item.price_discount : item.price}`;
        }
    }
    
    showLoadingState() {
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="menu-loading">
                    <div class="skeleton-loader" style="height: 200px; border-radius: 10px; margin-bottom: 1rem;"></div>
                    <div class="skeleton-loader" style="height: 20px; border-radius: 5px; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton-loader" style="height: 15px; border-radius: 5px; width: 70%;"></div>
                </div>
            `.repeat(8);
        }
    }
    
    showErrorState() {
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 3rem; color: var(--gray);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">😔</div>
                    <h3>שגיאה בטעינת התפריט</h3>
                    <p>מצטערים, יש בעיה בטעינת התפריט. אנא נסו שוב מאוחר יותר.</p>
                    <button class="btn-primary" onclick="location.reload()">נסה שוב</button>
                </div>
            `;
        }
    }
}

// Initialize menu manager when DOM is loaded
let menuManager;
document.addEventListener('DOMContentLoaded', () => {
    menuManager = new MenuManager();
    
    // Global functions
    window.menuManager = menuManager;
    window.filterMenu = (category) => menuManager.filterMenu(category);
    window.clearComparison = () => menuManager.clearComparison();
    window.closePreview = () => luluKitchen.closeModal('preview-modal');
});