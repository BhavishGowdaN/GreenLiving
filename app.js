// =====================================================
// GREEN LIVING - COMPLETE WEBSITE JAVASCRIPT
// Home: six-film sequential video background
// Garden Studio: photo-based plant anatomy
// Shop: product interactions
// =====================================================


// 1. PAGE LOADER
window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("pageLoader")?.classList.add("loaded");
    }, 700);
});


// 2. CINEMATIC HERO is initialized once at the end of this file.

// 3. GARDEN STUDIO — photo-based botanical anatomy
// The interactive plant library, anatomy views and part information are
// handled by plantAnatomy.js. No 3D living-space module is loaded here.


// 6. HOME FLOATING PARTICLES
const particleContainer = document.getElementById("heroParticles");

if (particleContainer) {
    const particleSymbols = ["✦", "·", "🍃", "✧"];

    for (let i = 0; i < 24; i++) {
        const particle = document.createElement("span");

        particle.className = "particle";

        particle.textContent =
            particleSymbols[Math.floor(Math.random() * particleSymbols.length)];

        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDuration = (9 + Math.random() * 13) + "s";
        particle.style.animationDelay = (-Math.random() * 15) + "s";
        particle.style.fontSize = (10 + Math.random() * 13) + "px";

        particleContainer.appendChild(particle);
    }
}


// 7. SCROLL REVEAL
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: .12
});

document.querySelectorAll(".reveal").forEach(element => {
    revealObserver.observe(element);
});


// 8. ANIMATED COUNTERS
const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = Number(counter.dataset.target);
        const duration = 1300;
        const start = performance.now();

        function updateCounter(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            counter.textContent = Math.round(target * eased);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
        counterObserver.unobserve(counter);
    });
}, {
    threshold: .6
});

document.querySelectorAll(".counter").forEach(counter => {
    counterObserver.observe(counter);
});


// 9. PROGRESS BAR ANIMATION
const progressObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.style.width =
            entry.target.dataset.progress + "%";

        progressObserver.unobserve(entry.target);
    });
}, {
    threshold: .5
});

document.querySelectorAll("[data-progress]").forEach(bar => {
    progressObserver.observe(bar);
});


// 10. 3D TILT EFFECT
function addTiltEffect(element, maximum = 8) {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - .5) * maximum;
        const rotateX = (.5 - y) * maximum;

        element.style.transform =
            `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    element.addEventListener("pointerleave", () => {
        element.style.transform =
            "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
    });
}

document.querySelectorAll(".tilt-card").forEach(card => {
    addTiltEffect(card, 7);
});


// 11. PRODUCT DATABASE
// Reassignable so the persistent server catalogue can replace the seed list
// without changing the references used by the rest of the site.
let products = [
    {
        id: 1,
        name: "Monstera Deliciosa",
        price: 899,
        category: "Indoor",
        tag: "BEST SELLER",
        image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=85",
        description: "A beautiful tropical plant with iconic split leaves. Perfect for adding a bold green touch to your home.",
        light: "Indirect light",
        water: "Weekly",
        care: "Easy"
    },
    {
        id: 2,
        name: "Snake Plant",
        imagePosition: "center center",
        price: 599,
        category: "Air Purifying",
        tag: "EASY CARE",
        image: "assets/products/photography/snake-plant-potted.png",
        description: "A hardy and elegant indoor plant that grows upright and needs very little attention.",
        light: "Low to bright",
        water: "Every 2 weeks",
        care: "Very easy"
    },
    {
        id: 3,
        name: "Peace Lily",
        price: 749,
        category: "Flowering",
        tag: "POPULAR",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85",
        description: "A graceful plant with rich green leaves and beautiful white flowers.",
        light: "Indirect light",
        water: "Weekly",
        care: "Moderate"
    },
    {
        id: 4,
        name: "Aloe Vera",
        price: 399,
        category: "Succulent",
        tag: "LOW MAINTENANCE",
        image: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=85",
        description: "A popular succulent with thick green leaves. It loves sunlight and needs less frequent watering.",
        light: "Bright light",
        water: "Every 2 weeks",
        care: "Easy"
    },
    {
        id: 5,
        name: "Areca Palm",
        imagePosition: "center 38%",
        price: 999,
        category: "Indoor",
        tag: "FRESH PICK",
        image: "https://images.pexels.com/photos/5538833/pexels-photo-5538833.jpeg?auto=compress&cs=tinysrgb&w=1200",
        description: "A tropical palm that brings a refreshing appearance to living rooms.",
        light: "Bright indirect",
        water: "Weekly",
        care: "Moderate"
    },
    {
        id: 6,
        name: "Jade Plant",
        price: 449,
        category: "Succulent",
        tag: "FAVOURITE",
        image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85",
        description: "A compact succulent with thick leaves, ideal for sunny windows.",
        light: "Bright light",
        water: "Every 2 weeks",
        care: "Easy"
    },
    {
        id: 7,
        name: "Bougainvillea",
        price: 699,
        category: "Outdoor",
        tag: "OUTDOOR PICK",
        image: "https://images.unsplash.com/photo-1773136577852-c9a46e4cd198?auto=format&fit=crop&w=1200&q=90",
        description: "A colourful flowering plant for balconies and outdoor gardens.",
        light: "Full sunlight",
        water: "When soil dries",
        care: "Moderate"
    },
    {
        id: 8, name: "Spider Plant", price: 499, category: "Air Purifying", tag: "BEGINNER FRIENDLY",
        image: "https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=900&q=85",
        description: "A friendly indoor plant with arching green and white leaves.", light: "Indirect light", water: "Weekly", care: "Easy"
    },
    {
        id: 9, name: "Gift-Wrapped Peace Lily", price: 1099, category: "Gift Plants", tag: "READY TO GIFT", giftWrap: true,
        image: "assets/products/photography/gift-peace-lily.jpg",
        description: "A graceful Peace Lily presented in a keepsake pot with a sage wrap, satin ribbon and gift tag.", light: "Medium, indirect", water: "Keep lightly moist", care: "Moderate"
    },
    {
        id: 10, name: "Gift-Wrapped Snake Plant", price: 899, category: "Gift Plants", tag: "READY TO GIFT", giftWrap: true,
        image: "assets/products/photography/gift-snake-plant.jpg",
        description: "A sculptural Snake Plant dressed in elegant botanical gift paper with a ribbon bow.", light: "Low to bright indirect", water: "Allow soil to dry", care: "Very easy"
    },
    {
        id: 11, name: "Gift-Wrapped Flowering Kalanchoe", price: 799, category: "Gift Plants", tag: "BLOOMING GIFT", giftWrap: true,
        image: "assets/products/photography/gift-kalanchoe.jpg",
        description: "A cheerful flowering Kalanchoe styled as a colourful gift with decorative wrap and a bow.", light: "Bright indirect", water: "When soil dries", care: "Easy"
    },
    {
        id: 12, name: "Gift-Wrapped Anthurium", price: 1499, category: "Gift Plants", tag: "ELEGANT GIFT", giftWrap: true,
        image: "https://estore.manentzos.com.cy/cdn/shop/files/AnthuriumNo1447_2048x.jpg?v=1759823967",
        description: "A striking Anthurium with glossy green leaves and red blooms, finished with premium gift wrap, ribbon and a keepsake tag.", light: "Bright, indirect", water: "When top soil dries", care: "Moderate"
    },
    {
        id: 13, name: "Premium Fiddle-Leaf Fig", imagePosition: "center 38%", price: 2499, category: "Premium Plants", tag: "SIGNATURE PLANT",
        image: "https://images.unsplash.com/photo-1763616310356-883d6931321a?auto=format&fit=crop&w=900&q=85",
        description: "A statement indoor tree with sculptural violin-shaped foliage, selected for a bright living space.", light: "Bright, indirect", water: "When top soil dries", care: "Moderate"
    },
    {
        id: 14, name: "Premium Monstera Deliciosa", price: 2199, category: "Premium Plants", tag: "COLLECTOR PICK",
        image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=85",
        description: "A mature tropical Monstera with dramatic fenestrated leaves for a bold botanical focal point.", light: "Bright, indirect", water: "When top soil dries", care: "Moderate"
    },
    {
        id: 15, name: "Premium Tulip Collection", price: 1899, category: "Premium Plants", tag: "PREMIUM BLOOM",
        image: "https://images.unsplash.com/photo-1683014752469-cbcbc1cb8a80?auto=format&fit=crop&w=900&q=85",
        description: "A carefully presented flowering Tulip collection with graceful blooms and a refined decorative planter.", light: "Bright, indirect", water: "When medium nearly dries", care: "Moderate"
    },
    {
        id: 16, name: "Premium Money Plant", price: 1299, category: "Premium Plants", tag: "BOTANICAL CLASSIC",
        image: "https://images.unsplash.com/photo-1534726955665-2cb2d145f2ad?auto=format&fit=crop&w=900&q=85",
        description: "A lush trailing Money Plant with full heart-shaped foliage, styled in a premium ceramic planter.", light: "Bright, indirect", water: "When top soil dries", care: "Easy"
    },
    {
        id: 17, name: "Office Desk Green Plant", price: 1199, category: "Office Plants", tag: "WORKSPACE PICK",
        image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85",
        description: "A compact leafy green plant selected for a bright desk or shared office shelf.", light: "Bright indirect", water: "Every 1–2 weeks", care: "Easy"
    },
    { id: 22, name: "Matte Ceramic Planter", price: 499, category: "Pots", tag: "HAND FINISH", image: "assets/products/photography/white-pot.jpg", description: "A timeless matte ceramic pot with a clean silhouette for indoor foliage.", material: "Glazed ceramic", dimensions: "Approx. 16 cm diameter × 15 cm height", colors: "Warm cream, sage, matte white", stock: "In stock", light: "—", water: "Drainage recommended", care: "Wipe clean" },
    { id: 23, name: "Classic Terracotta Pot", price: 299, category: "Pots", tag: "NATURAL CLAY", image: "assets/products/photography/terracotta-pot.jpg", description: "Breathable natural clay planter with a warm earthy tone.", material: "Unglazed terracotta", dimensions: "Approx. 15 cm diameter × 14 cm height", colors: "Natural terracotta", stock: "In stock", light: "—", water: "Drainage recommended", care: "Brush clean" },
    { id: 24, name: "Minimalist Sage Planter", price: 649, category: "Pots", tag: "MODERN DESIGN", image: "assets/products/photography/sage-pot.jpg", description: "A modern sage-toned planter that complements botanical interiors.", material: "Ceramic", dimensions: "Approx. 18 cm diameter × 16 cm height", colors: "Sage green", stock: "In stock", light: "—", water: "Drainage recommended", care: "Wipe clean" },
    { id: 25, name: "Suspended Hanging Planter", price: 599, category: "Pots", tag: "SPACE SAVER", image: "assets/products/photography/hanging-pot.jpg", description: "A hanging planter with a natural rope detail for trailing plants.", material: "Ceramic planter with cotton rope", dimensions: "Approx. 16 cm diameter; hanging length 45 cm", colors: "Sand beige", stock: "In stock", light: "—", water: "Drainage recommended", care: "Wipe clean" },
    { id: 26, name: "Botanical Watering Can", price: 399, category: "Accessories", tag: "PLANT CARE", image: "assets/products/photography/watering-can-new.jpg", description: "A compact watering can with a long spout for gentle, controlled watering.", material: "Powder-coated metal", dimensions: "1.2 litre capacity", colors: "Sage green", stock: "In stock", light: "—", water: "—", care: "Rinse and dry" },
    { id: 27, name: "Natural Wood Plant Stand", price: 899, category: "Accessories", tag: "HOME ACCENT", image: "assets/products/photography/plant-stand-photo.jpg", description: "A simple raised stand to add height and style to a favourite indoor planter.", material: "Solid wood", dimensions: "Approx. 28 cm height", colors: "Natural wood", stock: "In stock", light: "—", water: "—", care: "Dust with a dry cloth" },
    { id: 28, name: "Plant Care Starter Kit", price: 549, category: "Accessories", tag: "GROWING ESSENTIALS", image: "assets/products/photography/plant-care-kit.jpg", description: "A handy starter collection of plant-care essentials for everyday tending.", material: "Mixed care tools", dimensions: "Compact set", colors: "Natural and green accents", stock: "In stock", light: "—", water: "—", care: "Clean tools after use" },
    { id: 29, name: "Matte Black Ribbed Planter", price: 699, category: "Pots", tag: "MODERN FINISH", image: "assets/products/photography/black-pot.jpg", description: "A charcoal black planter with a clean rounded profile and subtle matte texture.", material: "Matte ceramic", dimensions: "Approx. 17 cm diameter × 16 cm height", colors: "Matte black", stock: "In stock", light: "—", water: "Drainage recommended", care: "Wipe clean" },
    { id: 30, name: "Tall Textured Floor Planter", price: 1499, category: "Pots", tag: "FLOOR PLANTER", image: "assets/products/photography/tall-textured-pot.jpg", description: "A tall neutral planter with a softly textured finish for statement plants.", material: "Textured ceramic", dimensions: "Approx. 24 cm diameter × 38 cm height", colors: "Warm beige", stock: "In stock", light: "—", water: "Drainage recommended", care: "Wipe clean" },
    { id: 31, name: "Botanical Plant Mister", price: 399, category: "Accessories", tag: "GENTLE MIST", image: "assets/products/photography/plant-mister.jpg", description: "A glass mister with a brass-tone pump for gentle leaf care.", material: "Glass and metal", dimensions: "Approx. 300 ml", colors: "Clear glass, brass-tone pump", stock: "In stock", light: "—", water: "—", care: "Rinse after use" },
    { id: 32, name: "Pruning Scissors", price: 349, category: "Accessories", tag: "GARDEN TOOL", image: "assets/products/photography/pruning-shears.jpg", description: "Compact pruning scissors with ergonomic green handles for routine plant trimming.", material: "Steel and coated handles", dimensions: "Compact hand tool", colors: "Green", stock: "In stock", light: "—", water: "—", care: "Wipe blade clean and dry" },
    { id: 33, name: "Potting Soil Mix", price: 349, category: "Accessories", tag: "GROWING MEDIUM", image: "assets/products/photography/potting-soil-mix.jpg", description: "A soil mix with visible perlite for airy, well-draining indoor plant roots.", material: "Potting mix", dimensions: "Retail pouch", colors: "Natural", stock: "In stock", light: "—", water: "—", care: "Store sealed and dry" }
];


window.greenLivingProducts = products;

// Reference-card merchandising metadata. These values are display-only: names,
// categories, descriptions, selling prices, images and cart totals are untouched.
// Any future verified value already present in the catalogue always wins.
const productMerchandising = {
    1:  { originalPrice: 1299, rating: 4.8, reviewCount: 324 },
    2:  { originalPrice: 899,  rating: 4.7, reviewCount: 512 },
    3:  { originalPrice: 1099, rating: 4.6, reviewCount: 268 },
    4:  { originalPrice: 599,  rating: 4.5, reviewCount: 189 },
    5:  { originalPrice: 1499, rating: 4.8, reviewCount: 147 },
    6:  { originalPrice: 649,  rating: 4.4, reviewCount: 233 },
    7:  { originalPrice: 999,  rating: 4.6, reviewCount: 96 },
    8:  { originalPrice: 699,  rating: 4.5, reviewCount: 208 },
    9:  { originalPrice: 1599, rating: 4.9, reviewCount: 176 },
    10: { originalPrice: 1299, rating: 4.8, reviewCount: 142 },
    11: { originalPrice: 1099, rating: 4.7, reviewCount: 218 },
    12: { originalPrice: 1999, rating: 4.9, reviewCount: 87 },
    13: { originalPrice: 3299, rating: 4.9, reviewCount: 121 },
    14: { originalPrice: 2899, rating: 4.8, reviewCount: 164 },
    15: { originalPrice: 2499, rating: 4.7, reviewCount: 98 },
    16: { originalPrice: 1699, rating: 4.8, reviewCount: 205 },
    17: { originalPrice: 1599, rating: 4.6, reviewCount: 134 },
    22: { originalPrice: 699,  rating: 4.6, reviewCount: 178 },
    23: { originalPrice: 449,  rating: 4.5, reviewCount: 264 },
    24: { originalPrice: 899,  rating: 4.7, reviewCount: 119 },
    25: { originalPrice: 799,  rating: 4.4, reviewCount: 92 },
    26: { originalPrice: 549,  rating: 4.6, reviewCount: 311 },
    27: { originalPrice: 1199, rating: 4.5, reviewCount: 86 },
    28: { originalPrice: 749,  rating: 4.7, reviewCount: 245 },
    29: { originalPrice: 949,  rating: 4.5, reviewCount: 133 },
    30: { originalPrice: 1999, rating: 4.8, reviewCount: 74 },
    31: { originalPrice: 549,  rating: 4.6, reviewCount: 198 },
    32: { originalPrice: 499,  rating: 4.4, reviewCount: 157 },
    33: { originalPrice: 499,  rating: 4.7, reviewCount: 289 }
};

function applyMerchandising(product) {
    if (!product || product.id === undefined || product.id === null) return product;

    const extra = productMerchandising[String(product.id)] || productMerchandising[product.id] || {};
    const regularPrice = Number(product.regularPrice);

    if (!Object.prototype.hasOwnProperty.call(product, "originalPrice")) {
        product.originalPrice = Number.isFinite(regularPrice) && regularPrice > 0
            ? regularPrice
            : (Number.isFinite(extra.originalPrice) ? extra.originalPrice : null);
    }
    if (!Object.prototype.hasOwnProperty.call(product, "rating")) {
        product.rating = extra.rating ?? null;
    }
    if (!Object.prototype.hasOwnProperty.call(product, "reviewCount") &&
        !Object.prototype.hasOwnProperty.call(product, "reviews")) {
        product.reviewCount = extra.reviewCount ?? null;
    }

    return product;
}

products.forEach(applyMerchandising);

// Accept both the original seed catalogue and the normalized admin catalogue.
function normalizeCatalogueProduct(raw) {
    const product = { ...(raw || {}) };

    product.id = product.id ?? product.sku;
    product.name = String(product.name || "New plant");
    product.category = String(product.category || product.collection || "Indoor");
    product.description = String(product.description || product.shortDescription || "");
    product.shortDescription = String(product.shortDescription || product.description || "");
    product.price = Number(product.price) || 0;
    product.image = String(product.image || product.images?.[0] || fallbackImage);
    product.images = Array.isArray(product.images) && product.images.length
        ? product.images.filter(Boolean).map(String)
        : [product.image];

    if (product.video) product.video = String(product.video);

    if (product.availability === undefined && product.stockStatus !== undefined) {
        product.availability = product.stockStatus;
    }
    if (product.stockStatus === undefined && product.availability !== undefined) {
        product.stockStatus = product.availability;
    }
    if (product.availability === undefined && product.stock !== undefined) {
        product.availability = product.stock;
    }

    return applyMerchandising(product);
}

function findProduct(productId) {
    if (productId === undefined || productId === null) return null;
    return products.find(product => String(product.id) === String(productId)) || null;
}

function isWishlisted(productId) {
    return wishlist.some(id => String(id) === String(productId));
}

// Products without an explicit stock number are treated as available.
function availableStock(product) {
    if (!product) return 0;

    const status = String(
        product.availability ?? product.stockStatus ?? product.stock ?? ""
    ).toLowerCase();

    if (/out[\s-]?of[\s-]?stock|sold[\s-]?out|unavailable|not[\s-]?available/.test(status)) {
        return 0;
    }

    const numericFields = [product.stockQuantity, product.stock, product.quantity];
    for (const value of numericFields) {
        if (value === undefined || value === null || value === "") continue;
        const amount = Number(value);
        if (Number.isFinite(amount)) return Math.max(0, Math.floor(amount));
    }

    return Infinity;
}

function stockShort(product) {
    const stock = availableStock(product);
    if (stock === 0) return "Out of stock";
    if (Number.isFinite(stock)) return `${stock} in stock`;
    return String(product.availability || product.stockStatus || product.stock || "In stock");
}

function stockLabel(product) {
    return `Availability: ${stockShort(product)}`;
}

function setQuantityLimit(input, product) {
    if (!input) return;
    const stock = availableStock(product);
    input.min = "1";
    input.max = Number.isFinite(stock) ? String(Math.max(1, stock)) : "20";
    if (Number(input.value) > Number(input.max)) input.value = input.max;
}

// 12. SHOP STATE
let selectedCategory = "All";
let searchText = "";
let wishlistOnly = false;
let cart = [];
let wishlist = [];
let selectedProductId = null;
let checkoutItems = [];
let currentOrder = null;

const productGrid = document.getElementById("productGrid");
const emptyMessage = document.getElementById("emptyMessage");
const productModal = document.getElementById("productModal");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");

const fallbackImage =
    "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85";


// 12b. LOCAL PERSISTENCE (cart, wishlist, theme)
const storageKeys = {
    cart: "greenLivingCart",
    wishlist: "greenLivingWishlist",
    theme: "greenLivingTheme",
    orders: "greenLivingOrders"
};

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        // Storage can be unavailable in private mode — the site still works.
    }
}

wishlist = readStorage(storageKeys.wishlist, [])
    .filter(id => products.some(product => String(product.id) === String(id)));

const savedCart = readStorage(storageKeys.cart, []);
cart = Array.isArray(savedCart)
    ? savedCart
        .map(item => {
            // Custom plant designs retain their generated image and full selections.
            if (item && item.customization && String(item.id).startsWith("custom-")) {
                return { ...item, quantity: Math.max(1, Number(item.quantity) || 1) };
            }
            const product = products.find(entry => String(entry.id) === String(item.id));
            if (!product) return null;
            return { ...product, quantity: Math.max(1, Number(item.quantity) || 1) };
        })
        .filter(Boolean)
    : [];

if (readStorage(storageKeys.theme, "light") === "dark") {
    document.body.classList.add("dark-mode");
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) themeToggle.textContent = "☾";
}


// 13. DISPLAY PRODUCTS
function fallbackForProduct(productId) {
    // Species-specific local assets are used only when the primary lifestyle photo fails.
    // They are not substituted with a different species or a generic plant image.
    const fallbackSets = {
        1: 'assets/products/fallback/potted-plant.svg',
        2: 'assets/products/photography/snake-plant-potted.png',
        3: 'assets/products/fallback/potted-plant.svg',
        4: 'assets/products/fallback/potted-plant.svg',
        5: 'assets/products/fallback/potted-plant.svg',
        6: 'assets/products/fallback/potted-plant.svg',
        7: 'assets/products/fallback/potted-plant.svg',
        8: 'assets/products/fallback/potted-plant.svg',
        9: 'assets/products/photography/gift-peace-lily.jpg',
        10: 'assets/products/photography/gift-snake-plant.jpg',
        11: 'assets/products/photography/gift-kalanchoe.jpg',
        12: 'assets/products/fallback/potted-plant.svg',
        13: 'assets/products/fallback/potted-plant.svg',
        14: 'assets/products/fallback/potted-plant.svg',
        15: 'assets/products/fallback/potted-plant.svg',
        16: 'assets/products/fallback/potted-plant.svg',
        17: 'assets/products/fallback/potted-plant.svg',
        22: 'assets/products/photography/white-pot.jpg', 23: 'assets/products/photography/terracotta-pot.jpg',
        24: 'assets/products/photography/sage-pot.jpg', 25: 'assets/products/photography/hanging-pot.jpg',
        26: 'assets/products/photography/watering-can-new.jpg', 27: 'assets/products/photography/plant-stand-photo.jpg',
        28: 'assets/products/photography/plant-care-kit.jpg', 29: 'assets/products/photography/black-pot.jpg',
        30: 'assets/products/photography/tall-textured-pot.jpg', 31: 'assets/products/photography/plant-mister.jpg',
        32: 'assets/products/photography/pruning-shears.jpg', 33: 'assets/products/photography/potting-soil-mix.jpg'
    };
    return fallbackSets[Number(productId)] || '';
}


function pricingMarkup(product, prefix = "") {
    const selling = `<strong class="product-price">${formatRupees(product.price)}</strong>`;
    const original = Number(product.originalPrice);
    if (!Number.isFinite(original) || original <= Number(product.price)) {
        return `<span class="${prefix}pricing-current">${selling}</span>`;
    }
    const discount = Math.round(((original - Number(product.price)) / original) * 100);
    return `<span class="${prefix}pricing-row"><del class="product-original-price">${formatRupees(original)}</del>${selling}<span class="product-discount">${discount}% OFF</span></span>`;
}

function displayProducts() {
    let filtered = products.filter(product => {
        const categoryMatch = selectedCategory === "All" || product.category === selectedCategory || (selectedCategory === "Everyday Plants" && !["Gift Plants", "Premium Plants", "Office Plants", "Pots", "Accessories"].includes(product.category));
        const searchMatch = product.name.toLowerCase().includes(searchText) ||
            product.category.toLowerCase().includes(searchText) ||
            product.description.toLowerCase().includes(searchText);
        return categoryMatch && searchMatch;
    });
    if (wishlistOnly) filtered = filtered.filter(product => isWishlisted(product.id));

    productGrid.innerHTML = "";
    emptyMessage.textContent = wishlistOnly
        ? "Your wishlist is empty. Tap the heart on a plant to save it."
        : "No plants found.";
    emptyMessage.hidden = filtered.length > 0;
    if (!filtered.length) return;

    const sectionMeta = {
        "Gift Plants": ["Gift Plants", "Thoughtful, beautifully wrapped plants for every special occasion."],
        "Premium Plants": ["Statement plants, beautifully grown", "Distinctive foliage and flowering specimens selected for standout spaces."],
        "Office Plants": ["Greener workspaces", "Easy-to-style plants selected for desks and bright office spaces."],
        "Pots": ["Planters for every space", "Thoughtful shapes, finishes and materials for your favourite plants."],
        "Accessories": ["Everyday plant-care essentials", "Helpful tools and accents for a greener home."]
    };
    const makeCard = (product, target = productGrid) => {
        const card = document.createElement("article");
        const ratingValue = Number(product.rating);
        const reviewValue = Number(product.reviewCount ?? product.reviews);
        const filledStars = Math.round(Math.min(5, Math.max(0, ratingValue)));
        const ratingMarkup = Number.isFinite(ratingValue) && ratingValue > 0
            ? `<div class="product-rating" aria-label="Rated ${ratingValue} out of 5 from ${Number.isFinite(reviewValue) && reviewValue > 0 ? reviewValue : 0} reviews"><span class="rating-stars" aria-hidden="true">${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}</span><span>${ratingValue.toFixed(1)}</span>${Number.isFinite(reviewValue) && reviewValue > 0 ? `<small>(${reviewValue.toLocaleString("en-IN")})</small>` : ""}</div>`
            : "";
        card.className = `product-card${product.giftWrap ? " gift-product-card" : ""}${availableStock(product) === 0 ? " sold-out" : ""}`;
        const photoMode = ["Pots", "Accessories"].includes(product.category) ? "catalog" : "lifestyle";
        const soldOut = availableStock(product) === 0;
        const purchaseDisabled = soldOut ? 'disabled aria-disabled="true"' : "";
        const imageMarkup = `<img src="${product.image}" alt="${product.name}, complete plant and pot photographed as one product" class="product-image product-image--${photoMode}" style="object-position:${product.imagePosition || "center 48%"}" data-product-id="${product.id}" data-fallback="${fallbackForProduct(product.id)}" loading="lazy" decoding="async">`;
        card.innerHTML = `
            <div class="product-image-wrap ${product.giftWrap ? "gift-wrap-visual" : ""}">
                ${imageMarkup}
                <span class="product-tag">${product.category === "Succulent" ? "Succulent" : product.category === "Gift Plants" ? "Gift Plant" : product.category === "Air Purifying" ? "Air Purifying" : product.category}</span>
                <button class="wishlist-btn ${isWishlisted(product.id) ? "liked" : ""}" data-id="${product.id}" type="button" aria-label="${isWishlisted(product.id) ? "Remove from" : "Add to"} wishlist">${isWishlisted(product.id) ? "♥" : "♡"}</button>
            </div>
            <div class="product-info">
                <h3 class="product-title-open" data-id="${product.id}" tabindex="0" role="button" aria-label="View details for ${product.name}">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                ${ratingMarkup}
                <div class="product-price-row">${pricingMarkup(product)}</div>
                <p class="product-stock-status${soldOut ? " out-of-stock" : ""}">${escapeHTML(stockShort(product))}</p>
                <div class="product-actions"><button class="add-cart-btn" data-id="${product.id}" type="button" ${purchaseDisabled}>🛒 Add to Cart</button><button class="buy-now-btn" data-id="${product.id}" type="button" ${purchaseDisabled}>Buy Now</button></div>
            </div>`;
        target.appendChild(card);
        addTiltEffect(card, 7);
        card.querySelectorAll("img").forEach(img => img.addEventListener("error", event => {
            const failed = event.currentTarget;
            console.warn("[Green Living] Product image failed to load:", failed.dataset.productId, failed.currentSrc || failed.src);
            const fallback = failed.dataset.fallback;
            if (fallback && failed.src !== new URL(fallback, document.baseURI).href && !failed.dataset.fallbackUsed) {
                failed.dataset.fallbackUsed = '1';
                failed.src = fallback;
                failed.classList.add('local-image-fallback');
                failed.onerror = () => { failed.onerror = null; failed.src = 'assets/products/fallback/potted-plant.svg'; failed.classList.add('local-image-fallback'); };
                return;
            }
            failed.onerror = null;
            failed.src = 'assets/products/fallback/potted-plant.svg';
            failed.classList.add('local-image-fallback');
            failed.alt = `${failed.alt.split(',')[0]} plant photograph`;
            failed.classList.remove("image-unavailable");
        }));
    };

    if (selectedCategory === "All" && !wishlistOnly) {
        const special = ["Gift Plants", "Premium Plants", "Office Plants", "Pots", "Accessories"];
        const everyday = filtered.filter(p => !special.includes(p.category));
        if (everyday.length) {
            const heading = document.createElement("section");
            heading.className = "shop-product-section everyday-products-section";
            heading.innerHTML = '<div class="shop-product-section-heading"><div class="shop-section-title-copy"><p class="eyebrow">THE GREEN LIVING COLLECTION</p><h3><span aria-hidden="true">🌿</span> Everyday Plants</h3><p>Beautiful and easy-care plants for your home, office and outdoor spaces.</p></div><button class="shop-view-all" type="button" data-view-category="Everyday Plants">View All <span aria-hidden="true">→</span></button></div><div class="shop-product-grid"></div>';
            productGrid.appendChild(heading);
            const grid = heading.querySelector(".shop-product-grid");
            everyday.forEach(product => makeCard(product, grid));
        }
        special.forEach(category => {
            const group = filtered.filter(p => p.category === category);
            if (!group.length) return;
            const [title, description] = sectionMeta[category];
            const section = document.createElement("section");
            section.className = `shop-product-section ${category.toLowerCase().replaceAll(" ", "-")}-section`;
            const sectionIcons = { "Gift Plants": "🎁", "Premium Plants": "✦", "Office Plants": "▤", "Pots": "▱", "Accessories": "✂" };
            section.innerHTML = `<div class="shop-product-section-heading"><div class="shop-section-title-copy"><p class="eyebrow">CURATED COLLECTION</p><h3><span aria-hidden="true">${sectionIcons[category] || "🌿"}</span> ${category}</h3><p>${description}</p></div><button class="shop-view-all" type="button" data-view-category="${category}">View All <span aria-hidden="true">→</span></button></div><div class="shop-product-grid"></div>`;
            productGrid.appendChild(section);
            const groupGrid = section.querySelector(".shop-product-grid");
            group.forEach(product => makeCard(product, groupGrid));
        });
    } else {
        const title = selectedCategory === "All" ? "Your saved plants" : selectedCategory;
        const description = selectedCategory === "Everyday Plants" ? "Complete, naturally potted everyday plants for your home and garden." : (sectionMeta[selectedCategory]?.[1] || "Explore plants selected for this category.");
        const section = document.createElement("section");
        section.className = "shop-product-section filtered-products-section";
        section.innerHTML = `<div class="shop-product-section-heading"><p class="eyebrow">GREEN LIVING COLLECTION</p><h3>${title}</h3><p>${description}</p></div><div class="shop-product-grid"></div>`;
        productGrid.appendChild(section);
        const filteredGrid = section.querySelector(".shop-product-grid");
        filtered.forEach(product => makeCard(product, filteredGrid));
    }
}


// Show admin-uploaded additional photos and optional product video in the
// existing detail modal without adding a separate fake media section.
function renderProductMedia(product) {
    const mainImage = document.getElementById("modalImage");
    const host = mainImage?.closest(".modal-image");
    if (!host) return;

    host.querySelector(".modal-product-media-extra")?.remove();

    const extraImages = (product.images || [])
        .filter(url => url && url !== product.image)
        .slice(0, 6);
    const videoUrl = product.video ? String(product.video) : "";

    if (!extraImages.length && !videoUrl) return;

    const wrapper = document.createElement("div");
    wrapper.className = "modal-product-media-extra";

    extraImages.forEach((url, index) => {
        const thumbnail = document.createElement("button");
        thumbnail.type = "button";
        thumbnail.className = "modal-media-thumb";
        thumbnail.setAttribute("aria-label", `View ${product.name} photo ${index + 2}`);

        const image = document.createElement("img");
        image.src = url;
        image.alt = `${product.name} additional view ${index + 2}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => { thumbnail.hidden = true; });

        thumbnail.appendChild(image);
        thumbnail.addEventListener("click", () => {
            mainImage.src = url;
            mainImage.alt = `${product.name} — additional view ${index + 2}`;
            mainImage.classList.remove("local-image-fallback");
            mainImage.removeAttribute("data-fallback-used");
            mainImage.style.display = "block";
        });
        wrapper.appendChild(thumbnail);
    });

    if (videoUrl) {
        const video = document.createElement("video");
        video.className = "modal-product-video";
        video.src = videoUrl;
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-label", `${product.name} product video`);
        video.addEventListener("error", () => { video.hidden = true; });
        wrapper.appendChild(video);
    }

    host.appendChild(wrapper);
}


// 14. PRODUCT DETAILS MODAL
function openProductDetails(productId) {
    const product = findProduct(productId);
    if (!product) return;

    selectedProductId = product.id;

    const modalImage = document.getElementById("modalImage");

    modalImage.style.display = "block";
    modalImage.classList.remove("local-image-fallback");
    modalImage.removeAttribute("data-fallback-used");
    const previousPhotoNotice = document.getElementById("modalPhotoNotice");
    if (previousPhotoNotice) previousPhotoNotice.hidden = true;
    modalImage.src = product.image || fallbackImage;
    modalImage.alt = product.name;
    renderProductMedia(product);

    modalImage.onerror = () => {
        console.warn("[Green Living] Product detail image failed to load:", product.id, modalImage.currentSrc || modalImage.src);
        modalImage.onerror = null;
        const localFallback = fallbackForProduct(product.id);
        if (localFallback && modalImage.src !== new URL(localFallback, document.baseURI).href) {
            modalImage.src = localFallback;
            modalImage.classList.add("local-image-fallback");
        } else {
            modalImage.style.display = "none";
            const modalPhotoNotice = document.getElementById("modalPhotoNotice") || (() => {
                const notice = document.createElement("p");
                notice.id = "modalPhotoNotice";
                notice.className = "product-photo-error product-photo-error--modal";
                notice.textContent = "Product photo temporarily unavailable";
                modalImage.parentElement.appendChild(notice);
                return notice;
            })();
            modalPhotoNotice.hidden = false;
        }
    };

    document.getElementById("modalCategory").textContent =
        product.category.toUpperCase();

    document.getElementById("modalName").textContent = product.name;
    document.getElementById("modalPrice").innerHTML = pricingMarkup(product, "modal-");
    document.getElementById("modalDescription").textContent =
        product.fullDescription || product.description || product.shortDescription || "";
    document.getElementById("modalLight").textContent = product.light || product.sunlight || "—";
    document.getElementById("modalWater").textContent = product.water || product.watering || "—";
    document.getElementById("modalCare").textContent = product.care || product.maintenance || "—";

    const soldOut = availableStock(product) === 0;
    const stockStatus = document.getElementById('modalStockStatus');
    if (stockStatus) {
        stockStatus.textContent = stockLabel(product);
        stockStatus.classList.toggle("out-of-stock", soldOut);
    }

    const plantDetails = document.querySelector('.product-modal .plant-details');
    if (plantDetails) plantDetails.hidden = ['Pots', 'Accessories'].includes(product.category);
    const potDetails = document.getElementById('modalPotDetails');
    if (potDetails) {
        const isAccessory = ['Pots', 'Accessories'].includes(product.category);
        potDetails.hidden = !isAccessory;
        potDetails.innerHTML = isAccessory
            ? `<p><strong>Material:</strong> ${escapeHTML(product.material || product.potMaterial || 'Not specified')}</p><p><strong>Dimensions:</strong> ${escapeHTML(product.dimensions || product.size || 'Not specified')}</p><p><strong>Available colours:</strong> ${escapeHTML(product.colors || 'Not specified')}</p><p><strong>Stock:</strong> ${escapeHTML(stockShort(product))}</p>`
            : '';
    }

    const modalQty = document.getElementById('modalProductQuantity');
    if (modalQty) {
        modalQty.value = '1';
        setQuantityLimit(modalQty, product);
    }
    const addButton = document.getElementById('modalAddCart');
    const buyButton = document.getElementById('modalBuyNow');
    if (addButton) addButton.disabled = soldOut;
    if (buyButton) buyButton.disabled = soldOut;
    const related = document.getElementById('modalRelatedProducts');
    if (related) {
        const relatedCategoryMap = {
            "Indoor": ["Indoor", "Premium Plants", "Air Purifying"],
            "Outdoor": ["Outdoor", "Flowering", "Premium Plants"],
            "Succulent": ["Succulent", "Pots"],
            "Air Purifying": ["Air Purifying", "Indoor", "Premium Plants"],
            "Flowering": ["Flowering", "Gift Plants", "Premium Plants"],
            "Gift Plants": ["Gift Plants", "Flowering", "Premium Plants"],
            "Premium Plants": ["Premium Plants", "Indoor", "Air Purifying"],
            "Office Plants": ["Office Plants", "Indoor", "Pots"],
            "Pots": ["Pots"],
            "Accessories": ["Accessories", "Pots"]
        };
        const explicitRelatedIds = {
            3: [9, 2, 12, 4], // Peace Lily: gift version, Snake Plant, Orchid gift, Aloe Vera
            1: [14, 16, 2, 3],
            2: [3, 6, 4, 9],
            12: [3, 11, 9, 15],
            26: [31, 28, 32, 27]
        };
        const preferred = relatedCategoryMap[product.category] || [product.category, "Premium Plants"];
        const explicitItems = explicitRelatedIds[product.id]
            ?.map(id => findProduct(id))
            .filter(Boolean);
        const relatedItems = (explicitItems || products.filter(item => String(item.id) !== String(product.id) && preferred.includes(item.category)))
            .filter(item => String(item.id) !== String(product.id)).slice(0, 4);
        related.innerHTML = relatedItems.length ? `<h3>Grow well with</h3><div class="modal-related-list">${relatedItems.map(item => `<button class="modal-related-card" type="button" data-related-product="${item.id}"><img src="${item.image}" alt="${item.name}" loading="lazy" data-related-fallback="${fallbackForProduct(item.id, 0)}"><span class="modal-related-copy"><strong>${item.name}</strong><small>${item.category}</small><b>₹${item.price.toLocaleString('en-IN')}</b></span></button>`).join('')}</div>` : '';
        related?.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
            console.warn("[Green Living] Related product image failed to load:", img.alt, img.currentSrc || img.src);
            const fallback = img.dataset.relatedFallback;
            if (fallback && img.src !== new URL(fallback, document.baseURI).href && !img.dataset.fallbackUsed) {
                img.dataset.fallbackUsed = '1';
                img.src = fallback;
                return;
            }
            img.style.display = 'none';
            const notice = document.createElement('small');
            notice.className = 'product-photo-error related-photo-error';
            notice.textContent = 'Product photo temporarily unavailable';
            img.parentElement?.prepend(notice);
        }, { once: true }));
    }

    productModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeProductDetails() {
    productModal.classList.remove("show");
    document.body.style.overflow = "";
}

document.getElementById("modalClose").addEventListener(
    "click",
    closeProductDetails
);

productModal.addEventListener("click", event => {
    if (event.target === productModal) {
        closeProductDetails();
    }
});


// 15. SHOPPING CART
function getRequestedQuantity(input, product, fallback = 1) {
    const raw = Number(input?.value) || fallback;
    const stock = availableStock(product);
    const upper = Number.isFinite(stock) ? Math.min(20, stock) : 20;
    return Math.max(1, Math.min(upper, Math.floor(raw)));
}

function addToCart(productId, quantity = 1) {
    const product = findProduct(productId);
    if (!product) return false;

    let requested = Math.max(1, Math.floor(Number(quantity) || 1));
    const stock = availableStock(product);

    if (stock === 0) {
        showToast(product.name + " is currently out of stock.");
        return false;
    }

    const existing = cart.find(item => String(item.id) === String(product.id));
    const alreadyInCart = existing ? existing.quantity : 0;

    if (Number.isFinite(stock) && alreadyInCart + requested > stock) {
        const remaining = stock - alreadyInCart;
        if (remaining <= 0) {
            showToast(`Only ${stock} available of ${product.name}.`);
            return false;
        }
        requested = remaining;
        showToast(`Only ${stock} available — quantity adjusted.`);
    } else {
        showToast(product.name + " added to cart!");
    }

    if (existing) {
        existing.quantity += requested;
    } else {
        cart.push({ ...product, quantity: requested });
    }

    updateCart();
    return true;
}

function updateCart(persist = true) {
    const count = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const cartCount = document.getElementById("cartCount");
    if (cartCount) cartCount.textContent = count;

    if (persist) {
        writeStorage(
            storageKeys.cart,
            cart.map(item => item.customization
                ? { ...item, quantity: item.quantity }
                : { id: item.id, quantity: item.quantity })
        );
    }

    displayCart();
}

function displayCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    cartItems.innerHTML = "";

    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML =
            '<p class="empty-message">Your cart is empty.</p>';
    }

    cart.forEach(item => {
        total += item.price * item.quantity;

        const row = document.createElement("div");
        row.className = "cart-item";

        row.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price.toLocaleString("en-IN")} each</p>
                ${item.customization ? `<p class="cart-custom-detail">${escapeHTML(item.customization.plant)} · ${escapeHTML(item.customization.potColor)} ${escapeHTML(item.customization.potSize)} · “${escapeHTML(item.customization.personalizationText)}”</p>` : ""}
                <div class="quantity-control">
                    <button type="button" data-qty-change="-1" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-qty-change="1" data-id="${item.id}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <button class="remove-cart-item" data-remove="${item.id}" type="button">Remove</button>
        `;

        row.querySelector("img").onerror = event => {
            const img = event.currentTarget;
            console.warn("[Green Living] Cart image failed to load:", item.name, img.currentSrc || img.src);
            const localFallback = item.customization?.image || fallbackForProduct(item.id);
            if (localFallback && !img.dataset.fallbackUsed) {
                img.dataset.fallbackUsed = "1";
                img.src = localFallback;
            } else {
                img.removeAttribute("src");
                img.alt = `${item.name} image unavailable`;
                img.classList.add("cart-image-unavailable");
            }
        };

        cartItems.appendChild(row);
    });

    cartTotal.textContent = "₹" + total.toLocaleString("en-IN");
}

function removeFromCart(productId) {
    cart = cart.filter(item => String(item.id) !== String(productId));

    updateCart();
    showToast("Item removed from cart.");
}

function openCart() {
    cartDrawer.classList.add("open");
    cartBackdrop.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartBackdrop.classList.remove("show");
    document.body.style.overflow = "";
}

document.getElementById("cartOpen").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

document.getElementById("modalAddCart").addEventListener("click", () => {
    if (selectedProductId === null || selectedProductId === undefined) return;

    const product = findProduct(selectedProductId);
    if (!product) return;

    const quantity = getRequestedQuantity(
        document.getElementById("modalProductQuantity"),
        product
    );

    if (addToCart(selectedProductId, quantity)) closeProductDetails();
});

document.getElementById("modalBuyNow")?.addEventListener("click", () => {
    if (selectedProductId === null || selectedProductId === undefined) return;

    const product = findProduct(selectedProductId);
    if (!product) return;

    const stock = availableStock(product);
    if (stock === 0) {
        showToast(product.name + " is currently out of stock.");
        return;
    }

    const quantity = getRequestedQuantity(
        document.getElementById("modalProductQuantity"),
        product
    );

    closeProductDetails();
    openCheckout([{ ...product, quantity }], "buy-now");
});


// 16. WISHLIST
function toggleWishlist(productId) {
    const existingIndex = wishlist.findIndex(id => String(id) === String(productId));
    if (existingIndex >= 0) {
        wishlist.splice(existingIndex, 1);
        showToast("Removed from wishlist.");
    } else {
        wishlist.push(productId);
        showToast("Added to wishlist!");
    }

    writeStorage(storageKeys.wishlist, wishlist);
    displayProducts();
}


// 17. CATEGORY FILTER
document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        selectedCategory = this.dataset.category;
        wishlistOnly = false;

        displayProducts();
    });
});

productGrid.addEventListener("click", event => {
    const viewAll = event.target.closest("[data-view-category]");
    if (!viewAll) return;
    selectedCategory = viewAll.dataset.viewCategory || "All";
    wishlistOnly = false;
    document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.category === selectedCategory);
    });
    displayProducts();
});


// 18. SEARCH
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    searchText = this.value.trim().toLowerCase();
    wishlistOnly = false;
    displayProducts();
});

// Search also understands the major Green Living sections. Product searches
// still filter the grid; section searches jump straight to matching content.
const sectionSearchTargets = [
    { id: "studio", name: "Garden Studio", terms: ["garden studio", "studio", "botanical", "anatomy", "living detail"] },
    { id: "dashboard", name: "My Garden Dashboard", terms: ["my garden", "garden dashboard", "dashboard", "fit score", "growth journey", "garden"] },
    { id: "shop", name: "Shop Plants", terms: ["shop", "shop plants", "marketplace", "buy plants", "premium plants"] },
    { id: "customize", name: "Customize Your Own Plant", terms: ["customize", "customise", "custom", "personalize", "personalise", "create plant"] },
    { id: "plantCare", name: "Plant Care", terms: ["plant care", "plant passport", "passport", "care", "watering", "sunlight"] },
    { id: "home", name: "Home", terms: ["home", "hero", "video"] }
];

function findSectionSearchTarget(query) {
    return sectionSearchTargets.find(entry =>
        entry.terms.some(term => query === term || query.includes(term))
    ) || null;
}

function openSearchResult() {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        searchInput.focus();
        return;
    }

    const sectionMatch = findSectionSearchTarget(query);
    const targetId = sectionMatch ? sectionMatch.id : "shop";

    if (document.getElementById(targetId)) {
        document.getElementById(targetId).scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        showToast(sectionMatch
            ? `Opening ${sectionMatch.name}.`
            : `Showing plant results for "${searchInput.value.trim()}".`);
    }

    searchInput.focus();
}

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        openSearchResult();
    }
});

document.getElementById("searchButton").addEventListener("click", openSearchResult);


// 19. DAY AND NIGHT MODE
document.getElementById("themeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const dark = document.body.classList.contains("dark-mode");

    this.textContent = dark ? "☾" : "☼";
    writeStorage(storageKeys.theme, dark ? "dark" : "light");

    showToast(
        dark ? "Night mode enabled." : "Day mode enabled."
    );
});


// Footer newsletter keeps the reference layout functional without leaving the page.
const newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("newsletterEmail");
        if (!email || !email.value.trim()) return;
        showToast("Thanks for joining Green Living!");
        email.value = "";
    });
}


// 20. MOBILE NAVIGATION
const navLinks = document.getElementById("navLinks");

document.getElementById("menuToggle").addEventListener("click", function () {
    const open = navLinks.classList.toggle("show");
    this.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("show");
        document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
    });
});


// 21. ACTIVE NAVIGATION
const pageSections = document.querySelectorAll("main section[id]");
const navItems = document.querySelectorAll(".nav-links a");

const activeSectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        navItems.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + entry.target.id
            );
        });
    });
}, {
    rootMargin: "-35% 0px -55% 0px"
});

pageSections.forEach(section => {
    activeSectionObserver.observe(section);
});

// Keep the visible active state in sync with the link the visitor selects.
// The scroll observer above still refines it while the page is scrolled.
function setActiveNavLink(link) {
    if (!link) return;
    navItems.forEach(item => {
        const isActive = item === link;
        item.classList.toggle("active", isActive);
        if (isActive) {
            item.setAttribute("aria-current", "page");
        } else {
            item.removeAttribute("aria-current");
        }
    });
}

navItems.forEach(link => {
    link.addEventListener("click", () => setActiveNavLink(link));
});

const initialNavLink = Array.from(navItems).find(
    link => link.getAttribute("href") === window.location.hash
) || Array.from(navItems).find(link => link.getAttribute("href") === "#home");

setActiveNavLink(initialNavLink);


// 22. NAVBAR SCROLL AND BACK TO TOP
const navbar = document.getElementById("navbar");
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    backToTop.classList.toggle("show", window.scrollY > 500);
}, {
    passive: true
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// 23. WISHLIST NAVIGATION
document.getElementById("wishlistNav").addEventListener("click", () => {
    if (wishlist.length === 0) {
        showToast("Your wishlist is empty.");
        return;
    }

    selectedCategory = "All";
    searchText = "";
    wishlistOnly = true;
    searchInput.value = "";

    document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === "All"
        );
    });

    displayProducts();

    document.getElementById("shop").scrollIntoView({
        behavior: "smooth"
    });

    showToast(`${wishlist.length} saved plants.`);
});


// 24. CHECKOUT, PAYMENT METHOD, ORDER CONFIRMATION AND TRACKING
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutSummary = document.getElementById("checkoutSummary");
const checkoutTotal = document.getElementById("checkoutGrandTotal");
const checkoutFormView = document.getElementById("checkoutFormView");
const orderSuccessView = document.getElementById("orderSuccessView");
const orderTrackingView = document.getElementById("orderTrackingView");
const upiFields = document.getElementById("upiFields");
const upiIdInput = document.getElementById("upiId");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutDelivery = document.getElementById("checkoutDelivery");

const DELIVERY_FEE = 0;
let checkoutSource = "cart";

function formatRupees(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
}

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateDelivery() {
    return DELIVERY_FEE;
}

function formatEta(dateString) {
    if (!dateString) return "3–4 days";

    return new Date(dateString).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function renderOrderItems(container, items, compact = false) {
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="order-item${compact ? " compact" : ""}">
            <img src="${item.image}" alt="${item.name}">
            <div class="order-item-copy">
                <strong>${item.name}</strong>
                <span>Qty ${item.quantity} · ${formatRupees(item.price)} each</span>
            </div>
            <strong>${formatRupees(item.price * item.quantity)}</strong>
        </div>
    `).join("");

    container.querySelectorAll("img").forEach(img => {
        img.onerror = () => { img.src = fallbackImage; };
    });
}

function updateCheckoutTotals() {
    const subtotal = calculateTotal(checkoutItems);
    const delivery = calculateDelivery();

    if (checkoutSubtotal) {
        checkoutSubtotal.textContent = formatRupees(subtotal);
    }

    if (checkoutDelivery) {
        checkoutDelivery.textContent = delivery === 0 ? "Free" : formatRupees(delivery);
    }

    if (checkoutTotal) {
        checkoutTotal.textContent = formatRupees(subtotal + delivery);
    }
}

function renderCheckoutSummary() {
    if (!checkoutSummary) return;

    if (checkoutItems.length === 0) {
        checkoutSummary.innerHTML = '<p class="empty-message">Your cart is empty.</p>';
        updateCheckoutTotals();
        return;
    }

    checkoutSummary.innerHTML = checkoutItems.map(item => `
        <div class="checkout-product-row" data-checkout-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="checkout-product-copy">
                <strong>${item.name}</strong>
                <span>${formatRupees(item.price)} each</span>
                ${item.customization ? `<span class="checkout-custom-detail">${escapeHTML(item.customization.plant)} · ${escapeHTML(item.customization.potColor)} ${escapeHTML(item.customization.potSize)} · “${escapeHTML(item.customization.personalizationText)}”</span>` : ""}
                <div class="checkout-qty">
                    <button type="button" data-checkout-qty="-1" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-checkout-qty="1" data-id="${item.id}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <strong class="checkout-line-total">${formatRupees(item.price * item.quantity)}</strong>
        </div>
    `).join("");

    checkoutSummary.querySelectorAll("img").forEach(img => {
        img.onerror = () => { img.src = fallbackImage; };
    });

    updateCheckoutTotals();
}

function isApiPage() {
    return location.protocol === "http:" || location.protocol === "https:";
}

// Payments are COD only. UPI is hidden/disabled even if older markup is cached.
function forceCodOnly() {
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        if (input.value === "COD") {
            input.checked = true;
            input.disabled = false;
        } else {
            input.checked = false;
            input.disabled = true;
            input.closest("label")?.setAttribute("hidden", "");
        }
    });

    if (upiFields) upiFields.hidden = true;
    if (upiIdInput) {
        upiIdInput.required = false;
        upiIdInput.value = "";
        upiIdInput.setCustomValidity("");
    }
}

function validateCheckoutItems() {
    const validItems = [];

    checkoutItems.forEach(item => {
        if (item.customization) {
            validItems.push(item);
            return;
        }

        const product = findProduct(item.id);
        if (!product) {
            showToast(`${item.name || "An item"} is no longer available.`);
            return;
        }

        const stock = availableStock(product);
        const requested = Math.max(1, Math.floor(Number(item.quantity) || 1));

        if (stock === 0) {
            showToast(`${product.name} is currently out of stock.`);
            return;
        }

        if (Number.isFinite(stock) && requested > stock) {
            showToast(`Only ${stock} available of ${product.name}. Quantity adjusted.`);
            validItems.push({ ...item, quantity: stock, price: product.price, image: product.image || item.image });
            return;
        }

        validItems.push({ ...item, quantity: requested, price: product.price, image: product.image || item.image });
    });

    checkoutItems = validItems;
    renderCheckoutSummary();
    return validItems.length > 0;
}

function persistOrderToServer(order) {
    if (!isApiPage()) return Promise.resolve(null);

    return fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
    })
        .then(async response => {
            if (!response.ok) throw new Error(`Order sync failed (${response.status})`);
            const payload = await response.json().catch(() => ({}));
            return payload.order || null;
        })
        .then(serverOrder => {
            if (serverOrder?.id && String(serverOrder.id) !== String(order.id)) {
                const savedOrders = readStorage(storageKeys.orders, []);
                const index = savedOrders.findIndex(entry => String(entry.id) === String(order.id));
                if (index >= 0) savedOrders[index] = { ...savedOrders[index], id: serverOrder.id };
                writeStorage(storageKeys.orders, savedOrders);

                order.id = serverOrder.id;
                currentOrder = order;
                renderConfirmation(order);
            }

            window.dispatchEvent(new CustomEvent("greenliving:orders", { detail: { order: serverOrder || order } }));
            window.greenLivingDashboard?.refresh?.();
            return serverOrder;
        })
        .catch(error => {
            console.warn("[Green Living] Order saved locally; server sync unavailable.", error);
            return null;
        });
}

function openCheckout(items, source = "cart") {
    if (!checkoutModal || !checkoutForm) {
        showToast("Checkout is not available right now.");
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    checkoutSource = source;
    checkoutItems = items
        .filter(item => item && item.id)
        .map(item => {
            const product = item.customization ? null : findProduct(item.id);
            if (product && availableStock(product) === 0) return null;

            const stock = product ? availableStock(product) : Infinity;
            const requested = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const quantity = Math.max(1, Math.min(20, requested, Number.isFinite(stock) ? stock : Infinity));

            return { ...item, quantity };
        })
        .filter(Boolean);

    if (checkoutItems.length === 0) {
        showToast("Those items are no longer available.");
        return;
    }

    checkoutFormView.hidden = false;
    orderSuccessView.hidden = true;
    orderTrackingView.hidden = true;
    checkoutForm.reset();
    forceCodOnly();

    renderCheckoutSummary();
    checkoutModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.classList.remove("show");
    document.body.style.overflow = "";
}

function showCheckoutView(view) {
    if (!checkoutFormView) return;
    checkoutFormView.hidden = view !== "form";
    orderSuccessView.hidden = view !== "success";
    orderTrackingView.hidden = view !== "tracking";
}

checkoutSummary?.addEventListener("click", event => {
    const button = event.target.closest("[data-checkout-qty]");
    if (!button) return;

    const productId = button.dataset.id;
    const change = Number(button.dataset.checkoutQty);
    const item = checkoutItems.find(entry => String(entry.id) === String(productId));

    if (!item) return;

    const product = item.customization ? null : findProduct(productId);
    const stock = product ? availableStock(product) : Infinity;
    const nextQuantity = item.quantity + change;

    if (nextQuantity < 1) return;
    if (Number.isFinite(stock) && nextQuantity > stock) {
        showToast(stock === 0
            ? `${item.name} is currently out of stock.`
            : `Only ${stock} available of ${item.name}.`);
        return;
    }

    item.quantity = Math.min(10, nextQuantity);
    renderCheckoutSummary();
});

checkoutForm?.addEventListener("submit", event => {
    event.preventDefault();
    forceCodOnly();

    if (!validateCheckoutItems()) return;

    const formData = new FormData(checkoutForm);
    const subtotal = calculateTotal(checkoutItems);
    const delivery = calculateDelivery();
    const orderNumber = "GL" + Date.now().toString().slice(-8);
    const eta = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const order = {
        id: orderNumber,
        createdAt: new Date().toISOString(),
        items: checkoutItems.map(item => ({ ...item })),
        subtotal,
        delivery,
        total: subtotal + delivery,
        paymentMethod: "COD",
        paymentStatus: "pending_on_delivery",
        upiId: "",
        customer: {
            name: formData.get("fullName"),
            phone: formData.get("phone"),
            email: formData.get("email"),
            address: formData.get("address"),
            city: formData.get("city"),
            pincode: formData.get("pincode")
        },
        status: "Preparing your plants",
        trackingStage: 1,
        eta
    };

    const savedOrders = readStorage(storageKeys.orders, []);
    savedOrders.unshift(order);
    writeStorage(storageKeys.orders, savedOrders);
    currentOrder = order;

    // Buy Now must never remove unrelated cart items.
    if (checkoutSource === "cart") {
        cart = [];
        updateCart();
    }

    renderConfirmation(order);
    showCheckoutView("success");
    checkoutItems = [];
    checkoutForm.reset();
    forceCodOnly();

    window.dispatchEvent(new CustomEvent("greenliving:orders", { detail: { order } }));
    window.greenLivingDashboard?.refresh?.();
    persistOrderToServer(order);
});

function renderConfirmation(order) {
    if (!order) return;

    document.getElementById("successOrderNumber").textContent = order.id;
    document.getElementById("successOrderTotal").textContent = formatRupees(order.total);
    document.getElementById("successSubtotal").textContent = formatRupees(order.subtotal || order.total);
    document.getElementById("successDelivery").textContent =
        !order.delivery ? "Free" : formatRupees(order.delivery);
    document.getElementById("successEta").textContent = formatEta(order.eta);
    document.getElementById("successPaymentMethod").textContent =
        "Cash on Delivery · Pay when your order arrives";
    document.getElementById("successCustomerName").textContent = order.customer.name;

    renderOrderItems(document.getElementById("successOrderItems"), order.items);
}

function getLatestOrder() {
    const savedOrders = readStorage(storageKeys.orders, []);
    return Array.isArray(savedOrders) && savedOrders.length > 0 ? savedOrders[0] : null;
}

function getTrackingStage(order) {
    if (!order) return 0;
    if (Number(order.trackingStage) >= 3) return 3;

    const elapsedHours = (Date.now() - new Date(order.createdAt).getTime()) / 3600000;
    let stage = Number(order.trackingStage) || 0;

    if (elapsedHours >= 1) stage = Math.max(stage, 1);
    if (elapsedHours >= 24) stage = Math.max(stage, 2);
    if (elapsedHours >= 48) stage = Math.max(stage, 3);

    return Math.min(3, Math.max(0, stage));
}

function renderTracking(order) {
    if (!order) return;

    document.getElementById("trackingOrderNumber").textContent = order.id;
    document.getElementById("trackingDeliveryName").textContent = order.customer.name;
    document.getElementById("trackingDeliveryAddress").textContent =
        `${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}`;
    document.getElementById("trackingTotal").textContent = formatRupees(order.total);

    const stage = getTrackingStage(order);
    const steps = [
        { title: "Order placed", detail: "Your order has been received." },
        { title: "Preparing your plants", detail: "We are carefully preparing your plants for travel." },
        { title: "Out for delivery", detail: "Your green package is on its way." },
        { title: "Delivered", detail: "Your plants have reached their new home." }
    ];

    const timeline = document.getElementById("trackingTimeline");
    timeline.innerHTML = steps.map((step, index) => {
        const state = index < stage ? "completed" : index === stage ? "active" : "pending";
        const label = index < stage ? "Completed" : index === stage ? "In progress" : "Pending";
        const dot = index < stage ? "✓" : index === stage ? "•" : "";

        return `
            <div class="tracking-step ${state}">
                <span class="tracking-dot">${dot}</span>
                <div><strong>${step.title}</strong><p>${step.detail}</p></div>
                <small>${label}</small>
            </div>
        `;
    }).join("");

    const progress = document.getElementById("trackingProgressBar");
    if (progress) {
        progress.style.width = `${(stage / (steps.length - 1)) * 100}%`;
    }

    const eta = document.getElementById("trackingEta");
    if (eta) {
        eta.textContent = stage >= 3
            ? "Delivered — enjoy your greener space."
            : `Estimated arrival: ${formatEta(order.eta)}`;
    }

    renderOrderItems(document.getElementById("trackingItems"), order.items, true);
}

function openTracking(order) {
    if (!order) {
        showToast("No orders yet. Place an order to track it here.");
        return;
    }

    currentOrder = order;
    renderTracking(order);
    showCheckoutView("tracking");
    checkoutModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

document.getElementById("trackOrderButton")?.addEventListener("click", () => {
    openTracking(currentOrder || getLatestOrder());
});

document.getElementById("trackOrderNav")?.addEventListener("click", event => {
    event.preventDefault();
    openTracking(getLatestOrder());
});

document.getElementById("backToConfirmation")?.addEventListener("click", () => {
    renderConfirmation(currentOrder || getLatestOrder());
    showCheckoutView("success");
});

document.getElementById("continueShoppingButton")?.addEventListener("click", closeCheckout);
document.getElementById("closeTrackingButton")?.addEventListener("click", closeCheckout);
document.getElementById("checkoutClose")?.addEventListener("click", closeCheckout);
checkoutModal?.addEventListener("click", event => {
    if (event.target === checkoutModal) closeCheckout();
});

document.getElementById("checkoutButton")?.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }
    closeCart();
    openCheckout(cart.map(item => ({ ...item })), "cart");
});

function changeCartQuantity(productId, change) {
    const item = cart.find(product => String(product.id) === String(productId));
    if (!item) return;

    const product = item.customization ? null : findProduct(productId);
    const stock = product ? availableStock(product) : Infinity;

    if (change > 0 && Number.isFinite(stock) && item.quantity + change > stock) {
        showToast(stock === 0
            ? `${item.name} is currently out of stock.`
            : `Only ${stock} available of ${item.name}.`);
        return;
    }

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(product => String(product.id) !== String(productId));
    }
    updateCart();
}


// Customizer integration: custom designs use the same cart drawer and checkout flow.
window.greenLivingAddCustomPlantToCart = function (customItem) {
    if (!customItem || !customItem.customization || !customItem.image || !customItem.id) return false;
    const existing = cart.find(item => String(item.id) === String(customItem.id));
    if (existing) existing.quantity += 1;
    else cart.push({ ...customItem, quantity: 1 });
    updateCart();
    showToast("Your customized plant was added to the cart.");
    return true;
};

window.greenLivingBuyCustomPlantNow = function (customItem) {
    if (!customItem || !customItem.customization || !customItem.image || !customItem.id) return false;
    openCheckout([{ ...customItem, quantity: 1 }], "buy-now");
    return true;
};

// 25. TOAST MESSAGE
let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// 26. GLOBAL PRODUCT EVENTS
document.addEventListener("click", event => {
    const image = event.target.closest(".product-image");
    const titleOpen = event.target.closest(".product-title-open");
    const addButton = event.target.closest(".add-cart-btn");
    const buyButton = event.target.closest(".buy-now-btn");
    const wishButton = event.target.closest(".wishlist-btn");
    const removeButton = event.target.closest("[data-remove]");
    const quantityButton = event.target.closest("[data-qty-change]");
    const relatedProduct = event.target.closest("[data-related-product]");

    if (relatedProduct) {
        openProductDetails(relatedProduct.dataset.relatedProduct);
    } else if (image || titleOpen) {
        openProductDetails((image || titleOpen).dataset.id);
    } else if (addButton) {
        addToCart(addButton.dataset.id);
    } else if (buyButton) {
        const product = findProduct(buyButton.dataset.id);
        if (product) openCheckout([{ ...product, quantity: 1 }], "buy-now");
    } else if (wishButton) {
        toggleWishlist(wishButton.dataset.id);
    } else if (removeButton) {
        removeFromCart(removeButton.dataset.remove);
    } else if (quantityButton) {
        changeCartQuantity(quantityButton.dataset.id, Number(quantityButton.dataset.qtyChange));
    }
});


// 27. KEYBOARD SUPPORT
document.addEventListener("keydown", event => {
    const productTitle = event.target.closest?.('.product-title-open');
    if (productTitle && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openProductDetails(productTitle.dataset.id); }
    if (event.key === "Escape") {
        closeProductDetails();
        closeCart();
        closeCheckout();
        navLinks.classList.remove("show");
    }
});


function refreshCartFromCatalogue() {
    const savedCart = readStorage(storageKeys.cart, []);

    if (Array.isArray(savedCart)) {
        cart = savedCart
            .map(item => {
                if (item && item.customization && String(item.id).startsWith("custom-")) {
                    return { ...item, quantity: Math.max(1, Number(item.quantity) || 1) };
                }

                const product = findProduct(item?.id);
                if (!product) return null;

                const stock = availableStock(product);
                const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
                if (stock === 0) return null;

                return { ...product, quantity: Number.isFinite(stock) ? Math.min(quantity, stock) : quantity };
            })
            .filter(Boolean);
    }

    wishlist = readStorage(storageKeys.wishlist, [])
        .filter(id => products.some(product => String(product.id) === String(id)));
}

async function syncCatalogueWithServer() {
    if (!isApiPage()) {
        window.dispatchEvent(new CustomEvent("greenliving:catalogue", { detail: { products, source: "local" } }));
        return;
    }

    try {
        const seedResponse = await fetch("/api/catalogue/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: products.map(product => ({ ...product })) })
        });
        if (!seedResponse.ok) throw new Error(`Catalogue seed failed (${seedResponse.status})`);

        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error(`Catalogue fetch failed (${response.status})`);

        const payload = await response.json().catch(() => ({}));
        const incoming = Array.isArray(payload.products) ? payload.products : [];
        if (!incoming.length) return;

        products = incoming.map(normalizeCatalogueProduct);
        window.greenLivingProducts = products;
        refreshCartFromCatalogue();
        displayProducts();
        updateCart();

        window.dispatchEvent(new CustomEvent("greenliving:catalogue", {
            detail: { products, source: "server" }
        }));
        window.greenLivingDashboard?.refresh?.();
    } catch (error) {
        console.warn("[Green Living] Using local catalogue; server sync unavailable.", error);
        window.dispatchEvent(new CustomEvent("greenliving:catalogue", {
            detail: { products, source: "local" }
        }));
    }
}

// Public helpers used by dashboard rows, admin sync checks and validation probes.
window.greenLivingOpenProduct = openProductDetails;
window.greenLivingAddToCart = addToCart;
window.greenLivingCatalogue = {
    refresh: syncCatalogueWithServer,
    getProducts: () => products
};
window.greenLivingCart = {
    add: addToCart,
    get: () => cart
};

window.greenLivingSelectCategory = function (category) {
    if (!category) return;

    selectedCategory = String(category);
    searchText = "";
    wishlistOnly = false;

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle("active", String(button.dataset.category) === selectedCategory);
    });

    displayProducts();
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.addEventListener("storage", event => {
    if (event.key === storageKeys.cart) {
        refreshCartFromCatalogue();
        updateCart(false);
    } else if (event.key === storageKeys.wishlist || event.key === storageKeys.orders) {
        refreshCartFromCatalogue();
        window.dispatchEvent(new CustomEvent("greenliving:orders", { detail: { key: event.key } }));
        window.greenLivingDashboard?.refresh?.();
    }
});

window.addEventListener("greenliving:refresh-catalogue", syncCatalogueWithServer);
window.addEventListener("load", () => window.greenLivingDashboard?.refresh?.());
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncCatalogueWithServer();
});
window.addEventListener("focus", syncCatalogueWithServer);


// 28. INITIALIZE WEBSITE
displayProducts();
updateCart();
forceCodOnly();
syncCatalogueWithServer();

console.log("Green Living website loaded successfully.");
console.log("Home page: six-film video background enabled.");
console.log("Garden Studio: photo-based anatomy enabled.");
console.log("Dashboard: card interactions enabled.");
console.log("Shop: product animations enabled.");


/* ==========================================
   GREENLIVING - SCROLL-SYNCHRONIZED HERO
   One ScrollTrigger; video time follows scroll position directly.
   ========================================== */
(() => {
  const initGreenLivingHero = () => {
    const hero = document.getElementById("homeHero");
    const video = document.getElementById("homeHeroVideo");
    if (!hero || !video || hero.dataset.scrollHeroInitialized === "true") return;
    if (!window.gsap || !window.ScrollTrigger) {
      console.error("GSAP / ScrollTrigger is unavailable; cinematic scroll is disabled.");
      return;
    }

    hero.dataset.scrollHeroInitialized = "true";
    gsap.registerPlugin(ScrollTrigger);
    video.pause();
    video.autoplay = false;
    video.loop = false;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const captions = Array.from(hero.querySelectorAll("[data-scene-start]"));
    const scrollHint = document.getElementById("heroScrollHint");
    let trigger = null;
    let latestTime = 0;
    let seekFrame = 0;
    let seekInProgress = false;
    let lastCaption = -1;

    // Keep only the newest requested time. Never queue stale seeks while decoding.
    const flushLatestSeek = () => {
      seekFrame = 0;
      if (!Number.isFinite(video.duration) || video.duration <= 0 || seekInProgress) return;
      const target = Math.max(0, Math.min(video.duration, latestTime));
      if (Math.abs(video.currentTime - target) < 0.025) return;
      try {
        seekInProgress = true;
        video.currentTime = target;
      } catch (error) {
        seekInProgress = false;
      }
    };

    const requestVideoTime = (time) => {
      latestTime = time;
      if (!seekFrame && !seekInProgress) seekFrame = requestAnimationFrame(flushLatestSeek);
    };

    video.addEventListener("seeked", () => {
      seekInProgress = false;
      // If the user scrolled during decode, immediately seek to the newest position.
      if (Math.abs(video.currentTime - latestTime) >= 0.04 && !seekFrame) {
        seekFrame = requestAnimationFrame(flushLatestSeek);
      }
    });

    const updateSceneCaption = (time) => {
      let activeIndex = -1;
      captions.forEach((caption, index) => {
        const from = Number(caption.dataset.sceneStart || 0);
        const to = Number(caption.dataset.sceneEnd || video.duration);
        const active = time >= from && time < to;
        caption.classList.toggle("is-active", active);
        caption.setAttribute("aria-hidden", active ? "false" : "true");
        if (active) activeIndex = index;
      });
      if (activeIndex !== lastCaption) lastCaption = activeIndex;
    };

    const updateFromProgress = (progress) => {
      const safeProgress = Math.max(0, Math.min(1, progress));
      const time = safeProgress * video.duration;
      requestVideoTime(time);
      updateSceneCaption(time);
      if (scrollHint) scrollHint.style.opacity = safeProgress > 0.025 ? "0" : "1";
    };

    const createScrollControl = () => {
      if (trigger || !Number.isFinite(video.duration) || video.duration <= 0) return;
      updateFromProgress(0);
      trigger = ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 5, 2800)}`,
        pin: true,
        pinSpacing: true,
        scrub: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => updateFromProgress(self.progress),
        onRefresh: self => updateFromProgress(self.progress),
        onLeave: () => requestVideoTime(video.duration),
        onLeaveBack: () => requestVideoTime(0)
      });
      window.greenLivingHero = {
        getState: () => ({
          duration: video.duration,
          currentTime: video.currentTime,
          requestedTime: latestTime,
          progress: trigger ? trigger.progress : 0,
          pinned: Boolean(trigger && trigger.isActive),
          seeking: video.seeking
        })
      };
      ScrollTrigger.refresh();
    };

    video.addEventListener("loadedmetadata", createScrollControl, { once: true });
    video.addEventListener("error", () => hero.classList.add("video-load-error"));
    if (video.readyState >= 1) createScrollControl();
    else video.load();

    // The video must never start independent playback.
    video.addEventListener("play", () => video.pause());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGreenLivingHero, { once: true });
  } else {
    initGreenLivingHero();
  }
})();
