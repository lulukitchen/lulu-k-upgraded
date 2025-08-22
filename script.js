// script.js

// Cart Management
let cart = [];

function addToCart(item) {
    cart.push(item);
    updateCartDisplay();
}

function removeFromCart(item) {
    cart = cart.filter(cartItem => cartItem !== item);
    updateCartDisplay();
}

function updateCartDisplay() {
    console.log("Cart updated:", cart);
}

// Modal Controls
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
}

// VIP Section
const isVIP = true;

function accessVIPSection() {
    if (isVIP) {
        console.log("Welcome to the VIP section!");
    } else {
        console.log("Access denied. Upgrade to VIP.");
    }
}

// Filters
function filterProducts(criteria) {
    console.log("Filtering products by:", criteria);
}

// Interactive Features
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function() {
        const item = button.getAttribute('data-item');
        addToCart(item);
    });
});

// Hebrew Language Support
const translations = {
    greeting: "שלום",
    cartUpdated: "העגלה עודכנה",
};

function displayGreeting() {
    console.log(translations.greeting);
}