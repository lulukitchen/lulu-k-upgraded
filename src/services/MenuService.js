// Google Sheets CSV Menu Service
class MenuService {
    constructor() {
        this.MENU_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFmGECEXCaaH6uXJ_lDHO7g1GaIwh-aHTy9P_EVoTYWxROaBOa_XPJ4H3OOe4h4NwlU93Lg-_au-2B/pub?gid=1874715002&single=true&output=csv';
        this.IMAGES_BASE_URL = 'https://lulu-k.com/images/';
        this.cachedMenu = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    async loadMenuFromCSV() {
        try {
            // Check cache first
            if (this.cachedMenu && this.cacheTimestamp && 
                (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
                return this.cachedMenu;
            }

            const response = await fetch(this.MENU_CSV_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            const menu = this.parseCSVToMenu(csvText);
            
            // Cache the result
            this.cachedMenu = menu;
            this.cacheTimestamp = Date.now();
            
            return menu;
        } catch (error) {
            console.error('Error loading menu from CSV:', error);
            // Return fallback menu if CSV fails
            return this.getFallbackMenu();
        }
    }

    parseCSVToMenu(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const menu = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const dish = {};
                headers.forEach((header, index) => {
                    dish[this.sanitizeKey(header)] = values[index]?.trim() || '';
                });
                
                // Process the dish data
                if (dish.name && dish.price) {
                    menu.push(this.processDishData(dish));
                }
            }
        }

        return this.categorizeMenu(menu);
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        
        return values;
    }

    sanitizeKey(key) {
        const keyMap = {
            'שם המנה': 'nameHe',
            'Name': 'nameEn', 
            'מחיר': 'price',
            'Price': 'price',
            'תיאור': 'descriptionHe',
            'Description': 'descriptionEn',
            'קטגוריה': 'category',
            'Category': 'category',
            'תמונה': 'image',
            'Image': 'image',
            'טבעוני': 'isVegan',
            'Vegan': 'isVegan',
            'צמחוני': 'isVegetarian', 
            'Vegetarian': 'isVegetarian',
            'רמת חריפות': 'spiceLevel',
            'Spice Level': 'spiceLevel',
            'כשר': 'isKosher',
            'Kosher': 'isKosher',
            'ללא גלוטן': 'isGlutenFree',
            'Gluten Free': 'isGlutenFree',
            'קלוריות': 'calories',
            'Calories': 'calories'
        };
        
        return keyMap[key] || key.toLowerCase().replace(/\s+/g, '_');
    }

    processDishData(dish) {
        return {
            id: this.generateDishId(dish),
            nameHe: dish.nameHe || dish.name || '',
            nameEn: dish.nameEn || dish.name || '',
            descriptionHe: dish.descriptionHe || dish.description || '',
            descriptionEn: dish.descriptionEn || dish.description || '',
            price: this.parsePrice(dish.price),
            category: dish.category || 'main',
            image: dish.image ? `${this.IMAGES_BASE_URL}${dish.image}` : this.getDefaultImage(dish.category),
            isVegan: this.parseBoolean(dish.isVegan),
            isVegetarian: this.parseBoolean(dish.isVegetarian),
            isKosher: this.parseBoolean(dish.isKosher),
            isGlutenFree: this.parseBoolean(dish.isGlutenFree),
            spiceLevel: parseInt(dish.spiceLevel) || 0,
            calories: parseInt(dish.calories) || 0,
            allergens: this.parseAllergens(dish.allergens || ''),
            isPopular: Math.random() > 0.7, // Mock popularity for demo
            isSpecial: Math.random() > 0.9
        };
    }

    generateDishId(dish) {
        const name = dish.nameHe || dish.nameEn || dish.name || '';
        return name.toLowerCase()
            .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew chars for ID
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 
            'dish-' + Date.now() + Math.random().toString(36).substr(2, 5);
    }

    parsePrice(priceStr) {
        if (!priceStr) return 0;
        return parseFloat(priceStr.toString().replace(/[^\d.]/g, '')) || 0;
    }

    parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const str = value.toLowerCase();
            return str === 'true' || str === 'yes' || str === '1' || str === 'כן';
        }
        return false;
    }

    parseAllergens(allergensStr) {
        if (!allergensStr) return [];
        return allergensStr.split(',').map(a => a.trim()).filter(a => a);
    }

    getDefaultImage(category) {
        const defaultImages = {
            'starter': `${this.IMAGES_BASE_URL}default-starter.jpg`,
            'main': `${this.IMAGES_BASE_URL}default-main.jpg`,
            'soup': `${this.IMAGES_BASE_URL}default-soup.jpg`,
            'rice': `${this.IMAGES_BASE_URL}default-rice.jpg`,
            'noodles': `${this.IMAGES_BASE_URL}default-noodles.jpg`,
            'dessert': `${this.IMAGES_BASE_URL}default-dessert.jpg`,
            'drink': `${this.IMAGES_BASE_URL}default-drink.jpg`
        };
        return defaultImages[category] || `${this.IMAGES_BASE_URL}default-dish.jpg`;
    }

    categorizeMenu(dishes) {
        const categories = {};
        
        dishes.forEach(dish => {
            const category = dish.category;
            if (!categories[category]) {
                categories[category] = {
                    nameHe: this.getCategoryNameHe(category),
                    nameEn: this.getCategoryNameEn(category),
                    dishes: []
                };
            }
            categories[category].dishes.push(dish);
        });

        return categories;
    }

    getCategoryNameHe(category) {
        const names = {
            'starter': 'מנות פתיחה',
            'main': 'מנות עיקריות', 
            'soup': 'מרקים',
            'rice': 'אורז',
            'noodles': 'אטריות',
            'dessert': 'קינוחים',
            'drink': 'משקאות'
        };
        return names[category] || category;
    }

    getCategoryNameEn(category) {
        const names = {
            'starter': 'Starters',
            'main': 'Main Dishes',
            'soup': 'Soups', 
            'rice': 'Rice',
            'noodles': 'Noodles',
            'dessert': 'Desserts',
            'drink': 'Drinks'
        };
        return names[category] || category;
    }

    getFallbackMenu() {
        // Fallback menu in case CSV loading fails
        return {
            'main': {
                nameHe: 'מנות עיקריות',
                nameEn: 'Main Dishes',
                dishes: [
                    {
                        id: 'kung-pao-chicken',
                        nameHe: 'עוף קונג פאו',
                        nameEn: 'Kung Pao Chicken',
                        descriptionHe: 'עוף מוקפץ עם בוטנים ופלפלים חריפים',
                        descriptionEn: 'Stir-fried chicken with peanuts and spicy peppers',
                        price: 65,
                        category: 'main',
                        image: `${this.IMAGES_BASE_URL}kung-pao-chicken.jpg`,
                        isVegan: false,
                        isVegetarian: false,
                        spiceLevel: 3,
                        isPopular: true
                    },
                    {
                        id: 'sweet-sour-pork',
                        nameHe: 'חזיר מתוק חמוץ',
                        nameEn: 'Sweet & Sour Pork',
                        descriptionHe: 'חזיר בציפוי קריספי עם רטב מתוק חמוץ',
                        descriptionEn: 'Crispy pork with sweet and sour sauce',
                        price: 72,
                        category: 'main',
                        image: `${this.IMAGES_BASE_URL}sweet-sour-pork.jpg`,
                        isVegan: false,
                        isVegetarian: false,
                        spiceLevel: 1,
                        isPopular: true
                    }
                ]
            }
        };
    }

    // Search and filter functions
    searchDishes(menu, searchTerm, language = 'he') {
        const allDishes = Object.values(menu).flatMap(category => category.dishes);
        const nameKey = language === 'he' ? 'nameHe' : 'nameEn';
        const descKey = language === 'he' ? 'descriptionHe' : 'descriptionEn';
        
        return allDishes.filter(dish => 
            dish[nameKey].toLowerCase().includes(searchTerm.toLowerCase()) ||
            dish[descKey].toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    filterDishes(menu, filters) {
        const allDishes = Object.values(menu).flatMap(category => category.dishes);
        
        return allDishes.filter(dish => {
            if (filters.isVegan && !dish.isVegan) return false;
            if (filters.isVegetarian && !dish.isVegetarian) return false;
            if (filters.isKosher && !dish.isKosher) return false;
            if (filters.isGlutenFree && !dish.isGlutenFree) return false;
            if (filters.maxSpiceLevel && dish.spiceLevel > filters.maxSpiceLevel) return false;
            if (filters.minPrice && dish.price < filters.minPrice) return false;
            if (filters.maxPrice && dish.price > filters.maxPrice) return false;
            if (filters.categories && filters.categories.length > 0 && 
                !filters.categories.includes(dish.category)) return false;
            
            return true;
        });
    }
}

// Export for use
window.MenuService = MenuService;