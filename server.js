/* Green Living backend - Node.js 20+; no extra runtime dependencies required. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const GENERATED_DIR = path.join(ROOT, 'generated');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'uploads');
const CATALOGUE_FILE = path.join(DATA_DIR, 'catalogue.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const SESSION_COOKIE = 'gl_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60; // seconds

// Small .env reader keeps setup simple without adding a dotenv dependency.
function loadEnvFile() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (match && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
        }
    }
}
loadEnvFile();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
fs.mkdirSync(GENERATED_DIR, { recursive: true });

/* ---------------------------------------------------------------------------
 * Persistent JSON store. Files are created on first run and never deleted.
 * ------------------------------------------------------------------------- */
let writeSequence = 0;
function writeJSON(file, value) {
    const temporary = `${file}.${process.pid}.${++writeSequence}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2));
    fs.renameSync(temporary, file);
}
function readJSON(file, fallback) {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch {
        return fallback;
    }
}
function ensureDataStore() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(CATALOGUE_FILE)) writeJSON(CATALOGUE_FILE, []);
    if (!fs.existsSync(ORDERS_FILE)) writeJSON(ORDERS_FILE, []);
    if (!fs.existsSync(CUSTOMERS_FILE)) writeJSON(CUSTOMERS_FILE, []);
}
ensureDataStore();
function catalogue() {
    const products = readJSON(CATALOGUE_FILE, []);
    return Array.isArray(products) ? products : [];
}
function orders() {
    const list = readJSON(ORDERS_FILE, []);
    return Array.isArray(list) ? list : [];
}
function publishedProducts() {
    return catalogue().filter(product => product && product.published !== false && product.visibility !== 'hidden');
}

/* ---------------------------------------------------------------------------
 * Shared value helpers
 * ------------------------------------------------------------------------- */
function send(res, status, payload, extraHeaders = {}) {
    const body = JSON.stringify(payload);
    res.writeHead(status, Object.assign({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    }, extraHeaders));
    res.end(body);
}
function readBody(req, limit = MAX_JSON_BYTES) {
    return new Promise((resolve, reject) => {
        let size = 0; const chunks = [];
        req.on('data', chunk => {
            size += chunk.length;
            if (size > limit) { reject(Object.assign(new Error('Request is too large.'), { status: 413 })); req.destroy(); return; }
            chunks.push(chunk);
        });
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
            catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
        });
        req.on('error', reject);
    });
}
function cleanText(value, max) { return typeof value === 'string' ? value.trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, max) : ''; }
function toText(value, max = 400) {
    if (value === undefined || value === null) return '';
    return String(value).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}
function toNumber(value, fallback = null) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const number = Number(value.replace(/[₹,\s]/g, ''));
        if (Number.isFinite(number)) return number;
    }
    return fallback;
}
function toBool(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const text = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'active', 'published', 'in stock'].includes(text)) return true;
        if (['false', '0', 'no', 'draft', 'hidden'].includes(text)) return false;
    }
    return fallback;
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function toStringArray(value, max = 12) {
    const source = Array.isArray(value) ? value : (typeof value === 'string' && value.trim() ? value.split(/[\n,]+/) : []);
    const seen = new Set();
    const result = [];
    for (const entry of source) {
        const text = toText(entry, 500);
        if (text && !seen.has(text)) { seen.add(text); result.push(text); }
        if (result.length >= max) break;
    }
    return result;
}
function makeProductId() { return `p_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`; }
function makeOrderId() { return `GL${Date.now().toString().slice(-8)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`; }
function validISO(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    return !Number.isNaN(new Date(value).getTime());
}

/* ---------------------------------------------------------------------------
 * Product normalization: legacy shop fields and admin fields both survive.
 * ------------------------------------------------------------------------- */
function normalizeProductType(value, category, collection) {
    const direct = String(value || '').trim().toLowerCase();
    if (['standard', 'premium', 'gift', 'accessory', 'pot'].includes(direct)) return direct;
    if (direct === 'accessories') return 'accessory';
    if (direct === 'pots' || direct === 'planter') return 'pot';
    const context = `${category} ${collection}`.toLowerCase();
    if (/pot|planter/.test(context)) return 'pot';
    if (/accessor|care|tool|soil|mister|stand/.test(context)) return 'accessory';
    if (/gift/.test(context)) return 'gift';
    if (/premium|signature|collector/.test(context)) return 'premium';
    return 'standard';
}
function normalizeProduct(input, usedIds = new Set()) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    let id = source.id ?? source.productId ?? source.sku;
    id = id === undefined || id === null || String(id).trim() === '' ? makeProductId() : (typeof id === 'number' ? id : toText(id, 80));
    while (usedIds.has(String(id))) id = makeProductId();
    usedIds.add(String(id));

    const images = toStringArray(source.images ?? source.gallery ?? source.photos ?? source.imageUrls, 12);
    const firstImage = toText(source.image ?? source.imageUrl ?? source.photo ?? source.mainImage ?? images[0], 600);
    if (firstImage && !images.includes(firstImage)) images.unshift(firstImage);

    const category = toText(source.category ?? source.type ?? 'Plants', 80) || 'Plants';
    const collection = toText(source.collection ?? source.potCollection ?? source.group, 120);
    const productType = normalizeProductType(source.productType ?? source.kind, category, collection);

    const regularPrice = toNumber(source.regularPrice ?? source.listPrice);
    const discount = clamp(toNumber(source.discount, 0) ?? 0, 0, 90);
    let price = toNumber(source.price ?? source.salePrice ?? source.currentPrice);
    if (price === null && regularPrice !== null) price = Math.round(regularPrice * (1 - discount / 100));
    if (price === null) price = 0;
    let originalPrice = toNumber(source.originalPrice);
    if (originalPrice === null) originalPrice = regularPrice;
    if (originalPrice === null && discount > 0) originalPrice = Math.round(price / (1 - discount / 100));
    if (originalPrice === null || originalPrice < price) originalPrice = price;

    const stockText = toText(source.stock ?? source.stockStatus ?? source.availability, 80);
    const parsedQuantity = toNumber(source.stockQuantity ?? source.quantity ?? source.stockCount);
    const looksUnavailable = /out[\s-]?of[\s-]?stock|sold[\s-]?out|unavailable|not[\s-]?available/i.test(stockText);
    const stockQuantity = parsedQuantity === null
        ? (stockText.match(/\d+/)
            ? Number(stockText.match(/\d+/)[0])
            : (!looksUnavailable && toBool(source.inStock, true) ? 25 : 0))
        : Math.max(0, Math.round(parsedQuantity));
    const availability = stockText || (toBool(source.inStock, true) && stockQuantity > 0 ? 'In stock' : 'Out of stock');

    const sunlight = toText(source.sunlight ?? source.light, 120);
    const watering = toText(source.watering ?? source.water, 120);
    const maintenance = toText(source.maintenance ?? source.care, 120);
    const material = toText(source.material ?? source.potMaterial, 160);

    // Spread first so legacy extras (imagePosition, giftWrap, rating, etc.) survive.
    const product = Object.assign({}, source, {
        id,
        name: toText(source.name ?? source.title, 160) || 'Untitled specimen',
        category,
        productType,
        sku: toText(source.sku ?? source.code, 60),
        shortDescription: toText(source.shortDescription ?? source.excerpt ?? source.tagline, 300),
        description: toText(source.description ?? source.details, 4000),
        image: firstImage,
        images,
        video: toText(source.video ?? source.videoUrl, 600),
        price,
        regularPrice,
        originalPrice,
        discount: Math.round(discount),
        collection,
        height: toText(source.height, 80),
        size: toText(source.size, 60),
        potType: toText(source.potType ?? source.potStyle, 120),
        potMaterial: toText(source.potMaterial, 120),
        sunlight,
        watering,
        maintenance,
        placement: toText(source.placement, 120),
        stockQuantity,
        stockStatus: availability,
        availability,
        published: toBool(source.published ?? source.active, true),
        featured: toBool(source.featured, false),
        bestSeller: toBool(source.bestSeller, false),
        newArrival: toBool(source.newArrival, false),
        tag: toText(source.tag ?? source.badge ?? source.label, 80),
        light: toText(source.light ?? source.sunlight, 120),
        water: toText(source.water ?? source.watering, 120),
        care: toText(source.care ?? source.maintenance, 120),
        material,
        dimensions: toText(source.dimensions, 160),
        colors: toText(source.colors, 160),
        stock: availability,
        createdAt: validISO(source.createdAt) ? source.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    return product;
}

/* ---------------------------------------------------------------------------
 * Orders + derived customers
 * ------------------------------------------------------------------------- */
function normalizeOrder(input, idOverride = null, createdAtOverride = null) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const items = Array.isArray(source.items) ? source.items.map(item => {
        const entry = item && typeof item === 'object' ? item : {};
        return Object.assign({}, entry, {
            id: entry.id ?? entry.productId ?? '',
            name: toText(entry.name ?? entry.title, 160),
            price: toNumber(entry.price, 0) ?? 0,
            quantity: Math.max(1, Math.round(toNumber(entry.quantity, 1) ?? 1))
        });
    }) : [];
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotal = toNumber(source.subtotal ?? source.subTotal, calculatedSubtotal) ?? calculatedSubtotal;
    const delivery = toNumber(source.delivery ?? source.shipping ?? source.deliveryFee, 0) ?? 0;
    const total = toNumber(source.total ?? source.grandTotal, subtotal + delivery) ?? (subtotal + delivery);
    const customerSource = source.customer && typeof source.customer === 'object' ? source.customer : {};
    const customer = {
        name: toText(customerSource.name ?? source.customerName ?? 'Guest', 120) || 'Guest',
        email: toText(customerSource.email ?? source.email, 160),
        phone: toText(customerSource.phone ?? source.phone, 40),
        address: toText(customerSource.address, 400),
        city: toText(customerSource.city, 100),
        pincode: toText(customerSource.pincode, 20)
    };
    const order = Object.assign({}, source, {
        id: idOverride || toText(source.id, 80) || makeOrderId(),
        createdAt: createdAtOverride || (validISO(source.createdAt) ? source.createdAt : new Date().toISOString()),
        items,
        subtotal,
        delivery,
        total,
        customer,
        // Cash on delivery is the only supported payment method. Normalise it
        // server-side so a crafted client request cannot store UPI details.
        paymentMethod: 'COD',
        paymentStatus: 'pending_on_delivery',
        status: toText(source.status, 120) || 'Preparing your plants',
        trackingStage: clamp(Math.round(toNumber(source.trackingStage, 0) ?? 0), 0, 3),
        eta: validISO(source.eta) ? source.eta : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });
    delete order.upiId;
    delete order.upi;
    delete order.upiTransactionId;
    return order;
}
function rebuildCustomers(list) {
    const byKey = new Map();
    for (const order of list) {
        const name = order.customer?.name || 'Guest';
        const email = toText(order.customer?.email, 160).toLowerCase();
        const key = email || name.toLowerCase();
        const entry = byKey.get(key) || { id: key, name, email, orders: 0, totalSpent: 0, lastOrderAt: '' };
        entry.orders += 1;
        entry.totalSpent += toNumber(order.total, 0) ?? 0;
        if (String(order.createdAt) > entry.lastOrderAt) entry.lastOrderAt = order.createdAt;
        byKey.set(key, entry);
    }
    const customers = [...byKey.values()].map(entry => Object.assign({}, entry, {
        totalSpent: Math.round(entry.totalSpent * 100) / 100
    })).sort((a, b) => b.totalSpent - a.totalSpent || a.name.localeCompare(b.name));
    writeJSON(CUSTOMERS_FILE, customers);
    return customers;
}
function derivedCustomers() {
    const stored = readJSON(CUSTOMERS_FILE, []);
    if (Array.isArray(stored)) return stored;
    return rebuildCustomers(orders());
}

/* ---------------------------------------------------------------------------
 * Owner authentication: credentials come only from environment variables.
 * ------------------------------------------------------------------------- */
function adminConfig() {
    return {
        username: typeof process.env.ADMIN_USERNAME === 'string' ? process.env.ADMIN_USERNAME.trim() : '',
        password: typeof process.env.ADMIN_PASSWORD === 'string' ? process.env.ADMIN_PASSWORD : '',
        secret: typeof process.env.ADMIN_SESSION_SECRET === 'string' ? process.env.ADMIN_SESSION_SECRET : ''
    };
}
function adminConfigured(config) { return Boolean(config.username && config.password && config.secret); }
function adminSalt(config) {
    return crypto.createHash('sha256').update(`greenliving-admin\0${config.username}\0${config.secret}`).digest();
}
function passwordDigest(password, config) {
    return crypto.scryptSync(String(password), adminSalt(config), 64).toString('hex');
}
let cachedDigest = { key: '', value: '' };
function expectedPasswordDigest(config) {
    const key = `${config.username}\0${config.password}\0${config.secret}`;
    if (cachedDigest.key !== key) cachedDigest = { key, value: passwordDigest(config.password, config) };
    return cachedDigest.value;
}
function constantTimeTextEqual(left, right) {
    const a = Buffer.from(String(left), 'utf8');
    const b = Buffer.from(String(right), 'utf8');
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}
function verifyPassword(password, config) {
    const supplied = Buffer.from(passwordDigest(password, config), 'hex');
    const expected = Buffer.from(expectedPasswordDigest(config), 'hex');
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
function createSessionToken(username, config) {
    const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', config.secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}
function verifySessionToken(token, config) {
    if (!config.secret || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = crypto.createHmac('sha256', config.secret).update(payload).digest('base64url');
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!data || data.u !== config.username || !Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
        return config.username;
    } catch { return null; }
}
function parseCookies(header) {
    const cookies = {};
    for (const part of String(header || '').split(';')) {
        const separator = part.indexOf('=');
        if (separator === -1) continue;
        const key = part.slice(0, separator).trim();
        if (!key) continue;
        try { cookies[key] = decodeURIComponent(part.slice(separator + 1).trim()); }
        catch { cookies[key] = part.slice(separator + 1).trim(); }
    }
    return cookies;
}
function sessionCookie(value, maxAge = SESSION_MAX_AGE) {
    return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
function authenticatedUser(req) {
    const config = adminConfig();
    if (!adminConfigured(config)) return null;
    return verifySessionToken(parseCookies(req.headers.cookie)[SESSION_COOKIE], config);
}
function requireAdmin(req, res) {
    if (authenticatedUser(req)) return true;
    send(res, 401, { error: 'Admin authentication required. Please sign in again.' });
    return false;
}
async function adminLogin(req, res) {
    const config = adminConfig();
    if (!adminConfigured(config)) {
        return send(res, 503, { error: 'Admin login is not configured. Add ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET to the server .env file, then restart the server.' });
    }
    const body = await readBody(req, 64 * 1024);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) return send(res, 400, { error: 'Username and password are required.' });
    const usernameMatches = constantTimeTextEqual(username, config.username);
    const passwordMatches = verifyPassword(password, config);
    if (!usernameMatches || !passwordMatches) return send(res, 401, { error: 'Invalid username or password.' });
    return send(res, 200, { authenticated: true, username: config.username }, { 'Set-Cookie': sessionCookie(createSessionToken(config.username, config)) });
}
function adminLogout(req, res) {
    return send(res, 200, { authenticated: false }, { 'Set-Cookie': sessionCookie('', 0) });
}
function adminSession(req, res) {
    const username = authenticatedUser(req);
    return send(res, 200, { authenticated: Boolean(username), username: username || null });
}

/* ---------------------------------------------------------------------------
 * Public catalogue, checkout sync and dashboard data (all persisted only).
 * ------------------------------------------------------------------------- */
async function seedCatalogue(req, res) {
    const body = await readBody(req);
    if (!Array.isArray(body.products)) return send(res, 400, { error: 'A products array is required.' });
    const existing = catalogue();
    if (existing.length) return send(res, 200, { products: publishedProducts() });
    const used = new Set();
    const seeded = body.products.map(product => normalizeProduct(product, used));
    writeJSON(CATALOGUE_FILE, seeded);
    return send(res, 200, { products: seeded.filter(product => product.published !== false) });
}
async function createOrder(req, res) {
    const body = await readBody(req, 4 * 1024 * 1024);
    if (!Array.isArray(body.items) || body.items.length === 0) {
        return send(res, 400, { error: 'An order must contain at least one item.' });
    }
    const order = normalizeOrder(body, makeOrderId(), new Date().toISOString());
    const list = orders();
    list.unshift(order);
    writeJSON(ORDERS_FILE, list);
    rebuildCustomers(list);
    return send(res, 201, { order });
}
function isPot(product) {
    const context = `${product.productType || ''} ${product.category || ''} ${product.collection || ''}`.toLowerCase();
    return product.productType === 'pot' || /pot|planter/.test(context);
}
function isAccessory(product) {
    const context = `${product.productType || ''} ${product.category || ''}`.toLowerCase();
    return product.productType === 'accessory' || /accessor|care|tool|soil|mister/.test(context);
}
function buildDashboard() {
    const products = catalogue();
    const list = orders();
    const plants = products.filter(product => !isPot(product) && !isAccessory(product));
    const pots = products.filter(isPot);

    const categoryMap = new Map();
    for (const product of products) {
        const name = product.category || 'Uncategorised';
        categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
    }
    const categoryCounts = [...categoryMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const potCollections = [...new Set(pots
        .map(product => toText(product.collection || product.potType || product.name, 120))
        .filter(Boolean))].sort();

    const excludedNames = new Set(products.filter(product => isPot(product) || isAccessory(product)).map(product => product.name));
    const popularity = new Map();
    for (const order of list) {
        for (const item of Array.isArray(order.items) ? order.items : []) {
            const name = toText(item.name, 160);
            if (!name || excludedNames.has(name)) continue;
            popularity.set(name, (popularity.get(name) || 0) + Math.max(1, Math.round(toNumber(item.quantity, 1) ?? 1)));
        }
    }
    const popularPlants = [...popularity.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 6);

    const recentOrders = list.slice(0, 6).map(order => ({
        id: order.id,
        customer: order.customer?.name || 'Guest',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
    }));

    const monthlyMap = new Map();
    for (const order of list) {
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime())) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key) || { key, label: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }), value: 0, time: date.getTime() };
        entry.value += 1;
        monthlyMap.set(key, entry);
    }
    const monthly = [...monthlyMap.values()].sort((a, b) => a.time - b.time).slice(-6).map(({ label, value }) => ({ label, value }));
    const completed = list.filter(order => /complet|deliver|fulfil/i.test(order.status || '')).length;

    return {
        totals: { plants: plants.length, pots: pots.length, customers: derivedCustomers().length, orders: list.length },
        categoryCounts,
        recentPlants: plants.slice().reverse().slice(0, 6),
        popularPlants,
        potCollections,
        recentOrders,
        customers: derivedCustomers().map(({ name, email, orders: orderCount, totalSpent }) => ({ name, email, orders: orderCount, totalSpent })),
        orderOverview: { total: list.length, completed, active: list.length - completed, monthly }
    };
}

/* ---------------------------------------------------------------------------
 * Secure media uploads (built-in modules only; content is verified, not the
 * client-supplied extension).
 * ------------------------------------------------------------------------- */
function mediaMatchesMagic(buffer, mimeType) {
    switch (mimeType) {
        case 'image/jpeg': return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        case 'image/png': return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        case 'image/gif': return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
        case 'image/webp': return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
        case 'video/mp4': return buffer.length > 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
        case 'video/webm': return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
        default: return false;
    }
}
async function adminUpload(req, res) {
    const body = await readBody(req, Math.ceil(MAX_VIDEO_BYTES * 4 / 3) + 4096);
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : '';
    const match = dataUrl.match(/^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!match) return send(res, 400, { error: 'A valid base64 image or video upload is required.' });
    const mimeType = match[1].toLowerCase();
    const extensions = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
        'video/mp4': 'mp4', 'video/webm': 'webm'
    };
    const extension = extensions[mimeType];
    if (!extension) return send(res, 400, { error: 'Only JPEG, PNG, WebP, GIF, MP4 and WebM files are supported.' });
    const encoded = match[2];
    if (encoded.length % 4 !== 0) return send(res, 400, { error: 'The uploaded file is malformed.' });
    const buffer = Buffer.from(encoded, 'base64');
    const limit = mimeType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (!buffer.length) return send(res, 400, { error: 'The uploaded file is empty.' });
    if (buffer.length > limit) return send(res, 413, { error: mimeType.startsWith('video/') ? 'Videos must be 60 MB or smaller.' : 'Images must be 8 MB or smaller.' });
    if (!mediaMatchesMagic(buffer, mimeType)) return send(res, 400, { error: 'The file contents do not match the declared media type.' });

    const stem = path.basename(String(body.name || 'upload'))
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 70) || 'upload';
    let filename = `${stem}.${extension}`;
    let target = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(target)) filename = `${stem}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
    target = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(target, buffer, { flag: 'wx' });
    return send(res, 200, { url: `/assets/uploads/${filename}` });
}

/* ---------------------------------------------------------------------------
 * Admin catalogue / order APIs
 * ------------------------------------------------------------------------- */
async function adminAddProduct(req, res) {
    const body = await readBody(req);
    const list = catalogue();
    const product = normalizeProduct(body, new Set(list.map(entry => String(entry.id))));
    list.push(product);
    writeJSON(CATALOGUE_FILE, list);
    return send(res, 201, { product });
}
async function adminUpdateProduct(req, res, id) {
    const body = await readBody(req);
    const list = catalogue();
    const index = list.findIndex(entry => String(entry.id) === id);
    if (index === -1) return send(res, 404, { error: 'Product not found.' });
    const used = new Set(list.filter((_, position) => position !== index).map(entry => String(entry.id)));
    const product = normalizeProduct(Object.assign({}, list[index], body, { id: list[index].id }), used);
    list[index] = product;
    writeJSON(CATALOGUE_FILE, list);
    return send(res, 200, { product });
}
function adminDeleteProduct(req, res, id) {
    const list = catalogue();
    const next = list.filter(entry => String(entry.id) !== id);
    if (next.length === list.length) return send(res, 404, { error: 'Product not found.' });
    writeJSON(CATALOGUE_FILE, next);
    return send(res, 200, { ok: true, id });
}
async function adminPatchOrder(req, res, id) {
    const body = await readBody(req);
    const list = orders();
    const index = list.findIndex(order => String(order.id) === id);
    if (index === -1) return send(res, 404, { error: 'Order not found.' });
    if (body.status !== undefined) list[index].status = toText(body.status, 120) || list[index].status;
    if (body.trackingStage !== undefined) list[index].trackingStage = clamp(Math.round(toNumber(body.trackingStage, 0) ?? 0), 0, 3);
    list[index].updatedAt = new Date().toISOString();
    writeJSON(ORDERS_FILE, list);
    return send(res, 200, { order: list[index] });
}
function inventorySnapshot() {
    return catalogue().map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        collection: product.collection,
        productType: product.productType,
        image: product.image,
        price: product.price,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        published: product.published !== false
    }));
}

/* ---------------------------------------------------------------------------
 * Existing AI custom-plant endpoints (unchanged behaviour)
 * ------------------------------------------------------------------------- */
const allowedPlants = {
    Indoor: ['Monstera', 'Peace Lily', 'Snake Plant', 'Money Plant', 'Fiddle-leaf Fig'],
    Balcony: ['Rose', 'Jasmine', 'Sunflower', 'Tulip', 'Flowering Kalanchoe'],
    Gift: ['Peace Lily', 'Orchid', 'Snake Plant', 'Flowering Kalanchoe', 'Monstera', 'Rose']
};
const allowedPots = ['Premium Ceramic Pot', 'Modern Minimalist Pot', 'Terracotta Pot', 'Decorative Designer Pot', 'Hanging Planter', 'Balcony Planter', 'Small Desk Pot', 'Large Floor Pot'];
const allowedColors = ['Matte White', 'Sage Green', 'Terracotta', 'Sand Beige', 'Charcoal', 'Forest Green', 'Warm Cream'];
const allowedSizes = ['Small', 'Medium', 'Large'];
const allowedArrangements = ['Single centered plant', 'Full and bushy arrangement', 'Tall upright arrangement', 'Trailing arrangement', 'Flowering arrangement'];
const allowedEnvironments = ['Warm minimalist home', 'Bright balcony', 'Botanical studio', 'Garden patio', 'Neutral product photography background'];
const rateLimit = new Map();

function validateDetails(body) {
    const details = {
        customizationType: cleanText(body.customizationType, 20),
        plant: cleanText(body.plant, 50), pot: cleanText(body.pot, 60),
        potColor: cleanText(body.potColor, 30), potSize: cleanText(body.potSize, 12),
        customerName: cleanText(body.customerName, 60),
        personalizationText: cleanText(body.personalizationText, 28),
        customMessage: cleanText(body.customMessage, 300),
        giftWrap: body.giftWrap === true,
        giftMessage: cleanText(body.giftMessage, 240),
        arrangement: cleanText(body.arrangement, 60), environment: cleanText(body.environment, 80)
    };
    if (!allowedPlants[details.customizationType]) throw Object.assign(new Error('Choose Indoor, Balcony or Gift customization.'), { status: 400 });
    if (!allowedPlants[details.customizationType].includes(details.plant)) throw Object.assign(new Error('The selected plant is not available for this customization type.'), { status: 400 });
    if (!allowedPots.includes(details.pot) || !allowedColors.includes(details.potColor) || !allowedSizes.includes(details.potSize)) throw Object.assign(new Error('Choose a valid pot style, colour and size.'), { status: 400 });
    if (!details.customerName || !details.personalizationText) throw Object.assign(new Error('Customer name and pot personalization text are required.'), { status: 400 });
    if (!allowedArrangements.includes(details.arrangement)) details.arrangement = allowedArrangements[0];
    if (!allowedEnvironments.includes(details.environment)) details.environment = allowedEnvironments[0];
    if (details.customizationType !== 'Gift') { details.giftWrap = false; details.giftMessage = ''; }
    return details;
}
function makePrompt(d) {
    const gift = d.customizationType === 'Gift' && d.giftWrap
        ? 'Wrap the pot itself in premium textured gift paper with a carefully tied elegant ribbon and bow; keep all foliage clearly visible.'
        : 'Do not add gift wrapping or ribbons.';
    const setting = d.customizationType === 'Balcony'
        ? 'a tasteful sunlit apartment balcony with soft greenery and natural daylight'
        : d.customizationType === 'Gift'
            ? 'a refined warm cream gift-styling studio with subtle botanical details'
            : 'a calm premium modern home interior with soft natural daylight';
    const scale = d.potSize === 'Small' ? 'compact small tabletop proportions' : d.potSize === 'Large' ? 'large substantial floor-pot proportions' : 'balanced medium-sized proportions';
    const potFinish = d.pot === 'Terracotta Pot' ? 'unglazed porous terracotta with natural clay texture' : d.pot === 'Hanging Planter' ? 'a ceramic hanging planter with visible hanging support' : d.pot === 'Large Floor Pot' ? 'a tall substantial floor planter' : d.pot === 'Small Desk Pot' ? 'a compact tabletop planter' : d.pot === 'Decorative Designer Pot' ? 'a sculptural designer planter with a decorative but tasteful silhouette' : d.pot === 'Balcony Planter' ? 'a long balcony planter with realistic planter proportions' : d.pot === 'Modern Minimalist Pot' ? 'a modern minimalist planter with clean geometry' : 'a premium ceramic planter with smooth, refined surfaces';
    return `STRICT CUSTOM PRODUCT BRIEF — follow every selected option literally. Create ONE photorealistic premium ecommerce product photograph. The product is a healthy ${d.plant} plant, with species-accurate leaf shapes, natural stem structure, foliage density and growth habit. It must be planted in exactly this pot style: ${d.pot}. Pot colour: ${d.potColor}. Pot material/finish: ${potFinish}; make this colour and material clearly visible, do not substitute a different pot. Pot size: ${d.potSize} (${scale}); use correct scale and proportions. Arrangement: ${d.arrangement}; follow this composition. Plant roots/soil must be inside the pot, not floating. The entire plant and entire pot must fit in the frame, centered and clearly visible. ${gift} The pot front must be clean and blank for exact lettering to be added after generation; do not generate any letters, words, logos, labels, watermarks or text. Environment/background must be: ${d.environment}; set the scene to match this choice, not a generic studio. Setting type: ${setting}. ${d.customMessage ? `Style direction: ${d.customMessage}.` : ''} Premium realistic product photography, natural lighting, physically realistic shadows, refined botanical ecommerce art direction, no collage, no detached plant parts, no additional pots, no extra plants, square composition.`;
}
function rateLimitCheck(req) {
    const ip = req.socket.remoteAddress || 'unknown';
    const now = Date.now(); const entry = rateLimit.get(ip) || { start: now, count: 0 };
    if (now - entry.start > 60_000) { entry.start = now; entry.count = 0; }
    entry.count += 1; rateLimit.set(ip, entry);
    return entry.count <= 5;
}
async function generateImage(req, res) {
    if (!rateLimitCheck(req)) return send(res, 429, { error: 'Too many image requests. Please wait a minute and try again.' });
    const details = validateDetails(await readBody(req));
    if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'AI image generation is not configured yet. Add OPENAI_API_KEY to the backend .env file, then restart the server.' });
    let apiResponse;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);
        try {
            apiResponse = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY.trim()}`, 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ model: MODEL, prompt: makePrompt(details), n: 1, size: '1024x1024', quality: 'medium', output_format: 'jpeg' })
            });
        } finally { clearTimeout(timeout); }
    } catch (error) {
        const message = error.name === 'AbortError' ? 'Image generation timed out after 2 minutes. Please try again.' : 'Could not connect to the image service. Check your internet connection and try again.';
        return send(res, 504, { error: message });
    }
    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
        const message = result?.error?.message || `Image API returned HTTP ${apiResponse.status}.`;
        console.error('OpenAI image API error:', apiResponse.status, result?.error?.type || '', result?.error?.code || '');
        const status = apiResponse.status === 429 ? 429 : apiResponse.status >= 500 ? 502 : 400;
        return send(res, status, { error: message });
    }
    const encoded = result?.data?.[0]?.b64_json;
    if (!encoded) return send(res, 502, { error: 'The image service returned an empty image. Please generate again.' });
    const image = Buffer.from(encoded, 'base64');
    if (!image.length || image.length > MAX_IMAGE_BYTES) return send(res, 502, { error: 'The generated image was invalid or too large.' });
    const id = crypto.randomUUID();
    fs.writeFileSync(path.join(GENERATED_DIR, `${id}.jpg`), image, { flag: 'wx' });
    return send(res, 200, { imageUrl: `/generated/${id}.jpg`, imageId: id, model: MODEL });
}
async function finalizeImage(req, res) {
    const body = await readBody(req, Math.ceil(MAX_IMAGE_BYTES * 1.4) + 4096);
    const match = typeof body.imageDataUrl === 'string' && body.imageDataUrl.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return send(res, 400, { error: 'A valid composed JPEG or PNG image is required.' });
    const image = Buffer.from(match[2], 'base64');
    if (!image.length || image.length > MAX_IMAGE_BYTES) return send(res, 413, { error: 'The personalized image is too large.' });
    const ext = match[1] === 'png' ? 'png' : 'jpg';
    const id = crypto.randomUUID();
    fs.writeFileSync(path.join(GENERATED_DIR, `${id}.${ext}`), image, { flag: 'wx' });
    return send(res, 200, { imageUrl: `/generated/${id}.${ext}`, imageId: id });
}

/* ---------------------------------------------------------------------------
 * Static files with byte-range support for large background videos.
 * ------------------------------------------------------------------------- */
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.otf': 'font/otf', '.woff2': 'font/woff2', '.json': 'application/json' };
function parseRangeHeader(header, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
    if (!match || (!match[1] && !match[2])) return null;
    let start;
    let end;
    if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isFinite(suffix) || suffix <= 0) return 'invalid';
        start = Math.max(0, size - suffix);
        end = size - 1;
    } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : size - 1;
        if (!Number.isFinite(start) || !Number.isFinite(end)) return 'invalid';
        if (end >= size) end = size - 1;
    }
    if (start >= size || end < start || start < 0) return 'invalid';
    return { start, end };
}
function serveStatic(req, res, pathname) {
    let decoded; try { decoded = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
    const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const target = path.resolve(ROOT, relative);
    if (!target.startsWith(ROOT + path.sep) || target === path.join(ROOT, '.env') || target.startsWith(DATA_DIR + path.sep) || target.includes(`${path.sep}node_modules${path.sep}`) || target.includes(`${path.sep}.git${path.sep}`)) {
        res.writeHead(403); return res.end('Forbidden');
    }
    fs.stat(target, (error, stat) => {
        if (error || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
        const headers = {
            'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': target.includes(`${path.sep}generated${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
            'Accept-Ranges': 'bytes',
            'Content-Length': String(stat.size)
        };
        if (req.headers.range) {
            const range = parseRangeHeader(req.headers.range, stat.size);
            if (range === 'invalid') {
                res.writeHead(416, Object.assign({ 'Content-Range': `bytes */${stat.size}` }, headers));
                return res.end();
            }
            if (range) {
                res.writeHead(206, Object.assign({}, headers, {
                    'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`,
                    'Content-Length': String(range.end - range.start + 1)
                }));
                if (req.method === 'HEAD') return res.end();
                const partial = fs.createReadStream(target, { start: range.start, end: range.end });
                partial.on('error', () => res.destroy());
                return partial.pipe(res);
            }
        }
        res.writeHead(200, headers);
        if (req.method === 'HEAD') return res.end();
        const stream = fs.createReadStream(target);
        stream.on('error', () => res.destroy());
        stream.pipe(res);
    });
}

/* ---------------------------------------------------------------------------
 * Router
 * ------------------------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';
    try {
        // Existing custom-plant endpoints keep their exact routes and behaviour.
        if (method === 'POST' && pathname === '/api/custom-plants/generate') return await generateImage(req, res);
        if (method === 'POST' && pathname === '/api/custom-plants/finalize') return await finalizeImage(req, res);

        // Public catalogue / checkout / dashboard APIs.
        if (method === 'POST' && pathname === '/api/catalogue/seed') return await seedCatalogue(req, res);
        if (method === 'GET' && pathname === '/api/products') return send(res, 200, { products: publishedProducts() });
        if (method === 'POST' && pathname === '/api/orders') return await createOrder(req, res);
        if (method === 'GET' && pathname === '/api/dashboard') return send(res, 200, buildDashboard());

        // Owner authentication endpoints.
        if (method === 'POST' && pathname === '/api/admin/login') return await adminLogin(req, res);
        if (method === 'POST' && pathname === '/api/admin/logout') return adminLogout(req, res);
        if (method === 'GET' && pathname === '/api/admin/session') return adminSession(req, res);

        // Everything else under /api/admin/ requires the signed HttpOnly cookie.
        if (pathname.startsWith('/api/admin/')) {
            if (!requireAdmin(req, res)) return;
            if (method === 'GET' && pathname === '/api/admin/products') return send(res, 200, { products: catalogue() });
            if (method === 'POST' && pathname === '/api/admin/products') return await adminAddProduct(req, res);
            if (method === 'GET' && pathname === '/api/admin/orders') return send(res, 200, { orders: orders() });
            if (method === 'GET' && pathname === '/api/admin/customers') return send(res, 200, { customers: rebuildCustomers(orders()) });
            if (method === 'GET' && pathname === '/api/admin/inventory') {
                const inventory = inventorySnapshot();
                return send(res, 200, { inventory, products: inventory });
            }
            if (method === 'GET' && pathname === '/api/admin/dashboard') return send(res, 200, buildDashboard());
            if (method === 'POST' && pathname === '/api/admin/uploads') return await adminUpload(req, res);

            const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
            if (productMatch) {
                const id = decodeURIComponent(productMatch[1]);
                if (method === 'PUT') return await adminUpdateProduct(req, res, id);
                if (method === 'DELETE') return adminDeleteProduct(req, res, id);
            }
            const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
            if (orderMatch && method === 'PATCH') return await adminPatchOrder(req, res, decodeURIComponent(orderMatch[1]));
            return send(res, 404, { error: 'Admin endpoint not found.' });
        }

        if (method === 'GET' || method === 'HEAD') return serveStatic(req, res, pathname);
        return send(res, 405, { error: 'Method not allowed.' });
    } catch (error) {
        console.error('Green Living API error:', error.message);
        return send(res, error.status || 500, { error: error.status ? error.message : 'The server could not complete this request. Please try again.' });
    }
});
server.listen(PORT, () => console.log(`Green Living is running at http://localhost:${PORT}`));
