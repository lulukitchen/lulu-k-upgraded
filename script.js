// Lulu Kitchen - Enhanced Chinese Restaurant Ordering System
// Main Application Controller

class LuluKitchenApp {
    constructor() {
        this.menuService = new MenuService();
        this.isInitialized = false;
        this.currentMenu = null;
        this.filteredMenu = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize services
            await this.initializeServices();
            
            // Load and display menu
            await this.loadMenu();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Initialize daily special
            this.initializeDailySpecial();
            
            // Update customer counters
            this.updateCustomerCounters();
            
            // Initialize VIP system
            this.initializeVIPSystem();
            
            console.log('🍜 Lulu Kitchen App initialized successfully!');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize Lulu Kitchen App:', error);
            this.showError('שגיאה בטעינת האתר. אנא רענן את הדף.');
        }
    }

    async initializeServices() {
        // Services are already initialized via their constructors
        // Translation service
        if (window.i18n) {
            await window.i18n.loadTranslations();
        }
        
        // Cart manager is already initialized
        if (window.cart) {
            window.cart.updateCartDisplay();
        }
        
        // Extras modal is already initialized
        // ExtrasModal is ready to use
    }

    async loadMenu() {
        try {
            this.showMenuLoading(true);
            this.currentMenu = await this.menuService.loadMenuFromCSV();
            this.filteredMenu = this.currentMenu;
            this.displayMenu(this.currentMenu);
            this.showMenuLoading(false);
        } catch (error) {
            console.error('Error loading menu:', error);
            this.showMenuLoading(false);
            this.showError('שגיאה בטעינת התפריט. מציג תפריט בסיסי.');
            // Show fallback menu
            this.currentMenu = this.menuService.getFallbackMenu();
            this.displayMenu(this.currentMenu);
        }
    }

    displayMenu(menu) {
        const menuGrid = document.getElementById('menu-grid');
        if (!menuGrid) return;

        const menuHTML = Object.entries(menu).map(([categoryId, category]) => {
            return `
                <div class="menu-category" data-category="${categoryId}">
                    <h3 class="category-title">
                        ${window.i18n ? window.i18n.getCategoryName(category) : category.nameHe}
                    </h3>
                    <div class="category-dishes">
                        ${category.dishes.map(dish => this.generateDishCardHTML(dish)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        menuGrid.innerHTML = menuHTML;
        
        // Update no results display
        const hasResults = Object.values(menu).some(category => category.dishes.length > 0);
        this.toggleNoResults(!hasResults);
    }

    generateDishCardHTML(dish) {
        const dishName = window.i18n ? window.i18n.getDishName(dish) : dish.nameHe;
        const dishDescription = window.i18n ? window.i18n.getDishDescription(dish) : dish.descriptionHe;
        const price = window.i18n ? window.i18n.formatPrice(dish.price) : `₪${dish.price}`;
        
        return `
            <div class="dish-card" data-dish-id="${dish.id}" data-category="${dish.category}">
                <div class="dish-image-container">
                    <img src="${dish.image}" alt="${dishName}" class="dish-image" loading="lazy" 
                         onerror="this.src='https://lulu-k.com/images/default-dish.jpg'">
                    
                    <!-- Tags -->
                    <div class="dish-tags">
                        ${dish.isVegan ? '<span class="tag vegan">🌱</span>' : ''}
                        ${dish.isVegetarian ? '<span class="tag vegetarian">🥗</span>' : ''}
                        ${dish.spiceLevel > 0 ? `<span class="tag spicy">${'🌶️'.repeat(Math.min(dish.spiceLevel, 3))}</span>` : ''}
                        ${dish.isKosher ? '<span class="tag kosher">✡️</span>' : ''}
                        ${dish.isGlutenFree ? '<span class="tag gluten-free">🚫🌾</span>' : ''}
                        ${dish.isPopular ? '<span class="tag popular">⭐ פופולרי</span>' : ''}
                        ${dish.isSpecial ? '<span class="tag special">👑 מיוחד</span>' : ''}
                    </div>
                </div>
                
                <div class="dish-content">
                    <h4 class="dish-name">${dishName}</h4>
                    <p class="dish-description">${dishDescription}</p>
                    
                    <div class="dish-details">
                        ${dish.calories > 0 ? `<span class="calories">${dish.calories} קלוריות</span>` : ''}
                        ${dish.spiceLevel > 0 ? `<span class="spice-level" title="רמת חריפות">${'🔥'.repeat(dish.spiceLevel)}</span>` : ''}
                    </div>
                    
                    <div class="dish-price">${price}</div>
                    
                    <div class="dish-actions">
                        <button class="btn-primary add-to-cart-btn" onclick="app.quickAddToCart('${dish.id}')" 
                                data-translate="menu.addToCart">
                            הוסף לעגלה
                        </button>
                        <button class="view-extras-btn" onclick="app.openExtrasModal('${dish.id}')" 
                                data-translate="menu.viewExtras" title="תוספות">
                            🍽️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Quick add to cart without extras
    quickAddToCart(dishId) {
        const dish = this.findDishById(dishId);
        if (dish && window.cart) {
            window.cart.addToCart(dish, [], 1);
        }
    }

    // Open extras modal for dish
    openExtrasModal(dishId) {
        const dish = this.findDishById(dishId);
        if (dish && window.extrasModal) {
            window.extrasModal.open(dish);
        }
    }

    findDishById(dishId) {
        if (!this.currentMenu) return null;
        
        for (const category of Object.values(this.currentMenu)) {
            const dish = category.dishes.find(d => d.id === dishId);
            if (dish) return dish;
        }
        return null;
    }

    // Search functionality
    searchMenu(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase().trim();
        this.applyFilters();
    }

    // Filter functionality
    filterMenu(filterType) {
        this.currentFilter = filterType;
        
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
        
        this.applyFilters();
    }

    applyFilters() {
        if (!this.currentMenu) return;

        let filteredMenu = { ...this.currentMenu };

        // Apply category filter
        if (this.currentFilter !== 'all') {
            Object.keys(filteredMenu).forEach(categoryId => {
                filteredMenu[categoryId] = {
                    ...filteredMenu[categoryId],
                    dishes: filteredMenu[categoryId].dishes.filter(dish => {
                        switch (this.currentFilter) {
                            case 'vegan':
                                return dish.isVegan;
                            case 'vegetarian':
                                return dish.isVegetarian;
                            case 'spicy':
                                return dish.spiceLevel > 0;
                            case 'kosher':
                                return dish.isKosher;
                            case 'gluten-free':
                                return dish.isGlutenFree;
                            default:
                                return true;
                        }
                    })
                };
            });
        }

        // Apply search filter
        if (this.searchTerm) {
            const language = window.i18n ? window.i18n.getCurrentLanguage() : 'he';
            Object.keys(filteredMenu).forEach(categoryId => {
                filteredMenu[categoryId] = {
                    ...filteredMenu[categoryId],
                    dishes: filteredMenu[categoryId].dishes.filter(dish => {
                        const nameKey = language === 'he' ? 'nameHe' : 'nameEn';
                        const descKey = language === 'he' ? 'descriptionHe' : 'descriptionEn';
                        return dish[nameKey].toLowerCase().includes(this.searchTerm) ||
                               dish[descKey].toLowerCase().includes(this.searchTerm);
                    })
                };
            });
        }

        // Remove empty categories
        Object.keys(filteredMenu).forEach(categoryId => {
            if (filteredMenu[categoryId].dishes.length === 0) {
                delete filteredMenu[categoryId];
            }
        });

        this.filteredMenu = filteredMenu;
        this.displayMenu(filteredMenu);
    }

    clearSearch() {
        const searchInput = document.getElementById('menu-search-input');
        if (searchInput) {
            searchInput.value = '';
            this.searchTerm = '';
            this.applyFilters();
        }
    }

    showMenuLoading(show) {
        const loader = document.getElementById('menu-loading');
        const menuGrid = document.getElementById('menu-grid');
        
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
        
        if (menuGrid) {
            menuGrid.style.opacity = show ? '0.5' : '1';
        }
    }

    toggleNoResults(show) {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.style.display = show ? 'block' : 'none';
        }
    }

    initializeEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterMenu(btn.dataset.filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('menu-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchMenu(e.target.value);
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Language toggle
        document.addEventListener('languageChanged', () => {
            if (this.currentMenu) {
                this.displayMenu(this.filteredMenu || this.currentMenu);
            }
        });

        // Scroll to menu button
        const scrollToMenuBtn = document.querySelector('[onclick*="scrollToMenu"]');
        if (scrollToMenuBtn) {
            scrollToMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToMenu();
            });
        }

        // VIP button
        const vipBtn = document.querySelector('[onclick*="openVIP"]');
        if (vipBtn) {
            vipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openVIP();
            });
        }
    }

    initializeDailySpecial() {
        // Get a random popular dish as today's special
        if (this.currentMenu) {
            const allDishes = Object.values(this.currentMenu).flatMap(category => category.dishes);
            const popularDishes = allDishes.filter(dish => dish.isPopular);
            
            if (popularDishes.length > 0) {
                const todaysSpecial = popularDishes[Math.floor(Math.random() * popularDishes.length)];
                const specialPrice = Math.round(todaysSpecial.price * 0.8); // 20% discount
                
                this.displayDailySpecial(todaysSpecial, specialPrice);
            }
        }
    }

    displayDailySpecial(dish, specialPrice) {
        const specialImg = document.getElementById('special-img');
        const specialName = document.getElementById('special-name');
        const specialDescription = document.getElementById('special-description');
        const specialOriginal = document.getElementById('special-original');
        const specialFinal = document.getElementById('special-final');
        
        if (specialImg) specialImg.src = dish.image;
        if (specialName) specialName.textContent = window.i18n ? window.i18n.getDishName(dish) : dish.nameHe;
        if (specialDescription) specialDescription.textContent = window.i18n ? window.i18n.getDishDescription(dish) : dish.descriptionHe;
        if (specialOriginal) specialOriginal.textContent = `₪${dish.price}`;
        if (specialFinal) specialFinal.textContent = `₪${specialPrice}`;
    }

    updateCustomerCounters() {
        // Animate the counters
        this.animateCounter('happy-customers', 2847);
        this.animateCounter('orders-completed', 12394);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = Math.ceil(targetValue / 100);
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = currentValue.toLocaleString();
        }, 30);
    }

    initializeVIPSystem() {
        // Check if user is already VIP
        const isVIP = window.cart ? window.cart.checkVIPStatus() : false;
        
        if (isVIP) {
            this.showVIPStatus();
        }
    }

    showVIPStatus() {
        // Update VIP display elements
        const vipElements = document.querySelectorAll('[data-vip-status]');
        vipElements.forEach(el => {
            el.classList.add('vip-active');
        });
    }

    // Navigation functions
    scrollToMenu() {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            menuSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    openVIP() {
        const vipSection = document.getElementById('vip');
        if (vipSection) {
            vipSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Error handling
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">❌</span>
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
        }, 5000);
    }
}

// Language switching function
function switchLanguage(lang) {
    if (window.i18n) {
        window.i18n.setLanguage(lang);
        
        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `lang-${lang}`);
        });
    }
}

// Cart functions (for backward compatibility)
function openCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Update cart display
        if (window.cart) {
            window.cart.updateCartDisplay();
        }
    }
}

function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function proceedToCheckout() {
    const summary = window.cart ? window.cart.getCartSummary() : null;
    
    if (!summary || summary.isEmpty) {
        alert('העגלה ריקה. הוסף מנות כדי להמשיך.');
        return;
    }
    
    // For now, show WhatsApp order (can be enhanced with proper checkout)
    this.sendWhatsAppOrder(summary);
}

function sendWhatsAppOrder(summary) {
    const cartItems = window.cart ? window.cart.cart : [];
    const businessWhatsApp = '052-520-1978';
    
    let message = '🍜 *הזמנה חדשה ממטבח לולו*\n\n';
    message += '*פריטים:*\n';
    
    cartItems.forEach(item => {
        const dishName = window.i18n ? window.i18n.getDishName(item.dish) : item.dish.nameHe;
        message += `• ${dishName} x${item.quantity} - ₪${item.totalPrice}\n`;
        
        if (item.extras.length > 0) {
            message += `  תוספות: ${item.extras.map(e => e.nameHe || e.name).join(', ')}\n`;
        }
        
        if (item.specialInstructions) {
            message += `  הערות: ${item.specialInstructions}\n`;
        }
    });
    
    message += `\n*סה"כ:* ₪${summary.total}`;
    message += `\n*אופן משלוח:* ${window.cart.getDeliveryMethod() === 'pickup' ? 'איסוף עצמי' : 'משלוח'}`;
    
    const whatsappURL = `https://wa.me/${businessWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

// VIP functions
function joinVIP() {
    if (window.cart) {
        window.cart.setVIPStatus(true);
        alert('ברוך הבא למועדון ה-VIP! תיהנה מ-15% הנחה על כל הזמנה ומשלוח חינם.');
    }
}

// Legacy functions for existing HTML compatibility
function addToCart(itemName) {
    console.log('Legacy addToCart called:', itemName);
    // This can be enhanced to find the dish by name and add it
}

function filterProducts(criteria) {
    console.log('Legacy filterProducts called:', criteria);
    if (window.app) {
        window.app.filterMenu(criteria);
    }
}

function clearComparison() {
    console.log('Comparison feature - to be implemented');
}

function closePreview() {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

// Initialize the app
window.app = new LuluKitchenApp();