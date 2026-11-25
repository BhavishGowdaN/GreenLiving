/* =========================================================
   GREEN LIVING — GARDEN DASHBOARD (live application data)

   Primary source: GET /api/dashboard (the response is used as-is).
   Offline fallback: window.greenLivingProducts and
   localStorage.greenLivingOrders only.

   No sample names, fake activity, invented growth percentages or
   baseline order counts are produced anywhere in this file.
   ========================================================= */

(function () {
    "use strict";

    var root = document.getElementById("gardenDashboard");
    if (!root) return;

    var $ = function (selector, scope) {
        return (scope || document).querySelector(selector);
    };
    var $$ = function (selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    };

    var numberFormat = new Intl.NumberFormat("en-IN");
    var moneyFormat = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    });

    var apiTimeoutMs = 4500;
    var requestToken = 0;
    var animationTokens = new WeakMap();
    var refreshButton = $("#gardenDashboardRefresh", root);
    var lastSnapshot = null;

    var DONUT_PALETTE = ["#6E9B55", "#C9A96A", "#AFC5A0", "#3F7A52", "#9C8251", "#7FA96A", "#D8C79B", "#547F5C"];

    /* -----------------------------------------------------
       Small helpers
       ----------------------------------------------------- */

    function reducedMotion() {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function arrayOf(value) {
        if (Array.isArray(value)) return value;
        if (isObject(value)) return Object.keys(value).map(function (key) { return value[key]; });
        return [];
    }

    function firstDefined(source, keys) {
        if (!isObject(source)) return undefined;
        for (var index = 0; index < keys.length; index += 1) {
            var value = source[keys[index]];
            if (value !== undefined && value !== null) return value;
        }
        return undefined;
    }

    function text(value) {
        if (value === undefined || value === null) return "";
        if (typeof value === "object") {
            return text(firstDefined(value, ["name", "title", "label", "fullName", "email"]));
        }
        return String(value).trim();
    }

    function num(value) {
        if (typeof value === "number") return isFinite(value) ? value : 0;
        if (typeof value === "string") {
            var parsed = parseFloat(value.replace(/[^0-9.\-]/g, ""));
            return isFinite(parsed) ? parsed : 0;
        }
        return 0;
    }

    function whole(value) {
        return Math.max(0, Math.round(num(value)));
    }

    function money(value) {
        var amount = num(value);
        return amount ? moneyFormat.format(amount) : (text(value) || "₹0");
    }

    function escapeHtml(value) {
        return text(value).replace(/[&<>"']/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
        });
    }

    function formatDate(value) {
        if (!value) return "—";
        var date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }

    function uniqueNames(values) {
        var seen = Object.create(null);
        var result = [];
        values.forEach(function (value) {
            var name = text(value);
            var key = name.toLowerCase();
            if (!name || seen[key]) return;
            seen[key] = true;
            result.push(name);
        });
        return result;
    }

    function closest(target, selector) {
        while (target && target !== root) {
            if (target.matches && target.matches(selector)) return target;
            target = target.parentElement;
        }
        return null;
    }

    function emptySnapshot(source) {
        return {
            source: source || "No data source",
            plants: [],
            potStyles: [],
            categories: [],
            recentPlants: [],
            popularPlants: [],
            orders: [],
            customers: [],
            monthly: [],
            totals: { plants: 0, pots: 0, customers: 0, orders: 0, completed: 0, active: 0 }
        };
    }

    /* -----------------------------------------------------
       Normalisation — only real fields from each source
       ----------------------------------------------------- */

    function normalizeProduct(item) {
        if (!item) return null;
        if (typeof item !== "object") {
            return { id: text(item), name: text(item), category: "", image: "", imagePosition: "", tag: "", orders: 0 };
        }
        return {
            id: firstDefined(item, ["id", "productId", "_id", "slug", "name"]),
            name: text(firstDefined(item, ["name", "title", "productName"])),
            category: text(firstDefined(item, ["category", "categoryName", "type"])),
            image: text(firstDefined(item, ["image", "imageUrl", "photo", "thumbnail", "picture"])),
            imagePosition: text(firstDefined(item, ["imagePosition", "objectPosition"])),
            tag: text(firstDefined(item, ["tag", "badge", "label", "note"])),
            orders: whole(firstDefined(item, ["orders", "orderCount", "purchases", "timesOrdered", "quantity", "count"]))
        };
    }

    function normalizeOrder(item) {
        if (!item) return null;
        if (typeof item !== "object") return null;

        var customer = isObject(item.customer) ? item.customer : {};
        var items = arrayOf(firstDefined(item, ["items", "products", "lines", "cartItems"]));
        var status = text(firstDefined(item, ["status", "orderStatus", "state", "stage", "trackingStatus"]));

        return {
            id: text(firstDefined(item, ["id", "orderId", "orderNumber", "number"])),
            createdAt: firstDefined(item, ["createdAt", "date", "orderDate", "placedAt", "timestamp", "time"]),
            name: text(firstDefined(customer, ["name", "fullName", "customerName"]) || firstDefined(item, ["customerName", "buyerName"])),
            email: text(firstDefined(customer, ["email", "emailAddress"]) || firstDefined(item, ["email", "customerEmail"])),
            total: num(firstDefined(item, ["total", "grandTotal", "totalAmount", "amount", "orderTotal"])),
            status: status,
            items: items
        };
    }

    function normalizeCustomer(item) {
        if (!item) return null;
        if (typeof item !== "object") {
            return { name: "", email: text(item), orders: 0, totalSpent: 0, lastOrder: null };
        }
        return {
            name: text(firstDefined(item, ["name", "fullName", "customerName"])),
            email: text(firstDefined(item, ["email", "emailAddress", "customerEmail"])),
            orders: whole(firstDefined(item, ["orders", "orderCount", "totalOrders", "count"])),
            totalSpent: num(firstDefined(item, ["totalSpent", "spend", "revenue", "amount", "total"])),
            lastOrder: firstDefined(item, ["lastOrder", "lastOrderAt", "latestOrder", "lastOrderDate", "createdAt"])
        };
    }

    function normalizeCategories(raw, plants) {
        var entries = [];

        if (Array.isArray(raw)) {
            entries = raw.map(function (item) {
                if (typeof item !== "object" || item === null) {
                    return { name: text(item), count: 0 };
                }
                return {
                    name: text(firstDefined(item, ["name", "category", "categoryName", "label", "key"])),
                    count: whole(firstDefined(item, ["count", "total", "value", "varieties", "products", "number"]))
                };
            });
        } else if (isObject(raw)) {
            entries = Object.keys(raw).map(function (name) {
                var value = raw[name];
                return {
                    name: text(name),
                    count: Array.isArray(value) ? value.length : whole(value)
                };
            });
        }

        entries = entries.filter(function (entry) { return Boolean(entry.name); });

        // Fill in counts only when the API supplied category names without counts.
        entries.forEach(function (entry) {
            if (entry.count) return;
            entry.count = plants.filter(function (plant) { return plant.category === entry.name; }).length;
        });

        if (!entries.length && plants.length) {
            var counts = new Map();
            plants.forEach(function (plant) {
                var name = plant.category || "Other";
                counts.set(name, (counts.get(name) || 0) + 1);
            });
            entries = Array.from(counts.entries()).map(function (entry) {
                return { name: entry[0], count: entry[1] };
            });
        }

        return entries.sort(function (a, b) {
            return b.count - a.count || a.name.localeCompare(b.name);
        });
    }

    function normalizeMonthly(raw, orders) {
        var entries = [];

        if (Array.isArray(raw)) {
            entries = raw.map(function (item) {
                if (Array.isArray(item)) {
                    return { label: text(item[0]), count: whole(item[1]) };
                }
                if (typeof item !== "object" || item === null) {
                    return { label: text(item), count: 0 };
                }
                var label = text(firstDefined(item, ["label", "month", "name", "period", "date"]));
                return {
                    label: label,
                    count: whole(firstDefined(item, ["count", "orders", "total", "value", "number"]))
                };
            });
        } else if (isObject(raw)) {
            entries = Object.keys(raw).map(function (label) {
                var value = raw[label];
                return { label: label, count: Array.isArray(value) ? value.length : whole(value) };
            });
        } else if (orders.length) {
            // Derive six real month buckets from saved order timestamps.
            var buckets = [];
            var today = new Date();
            for (var offset = 5; offset >= 0; offset -= 1) {
                var date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
                buckets.push({
                    key: date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0"),
                    label: date.toLocaleDateString("en-IN", { month: "short" }),
                    count: 0
                });
            }
            orders.forEach(function (order) {
                if (!order.createdAt) return;
                var date = new Date(order.createdAt);
                if (isNaN(date.getTime())) return;
                var key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
                var bucket = buckets.find(function (entry) { return entry.key === key; });
                if (bucket) bucket.count += 1;
            });
            entries = buckets;
        }

        return entries
            .filter(function (entry) { return Boolean(entry.label); })
            .map(function (entry) {
                return {
                    label: text(entry.label).slice(0, 8),
                    count: whole(entry.count)
                };
            })
            .slice(-12);
    }

    function deriveCustomers(orders) {
        var byEmail = new Map();

        orders.forEach(function (order) {
            if (!order.email) return;
            var key = order.email.toLowerCase();
            var customer = byEmail.get(key);
            if (!customer) {
                customer = { name: "", email: order.email, orders: 0, totalSpent: 0, lastOrder: null };
                byEmail.set(key, customer);
            }
            if (!customer.name && order.name) customer.name = order.name;
            customer.orders += 1;
            customer.totalSpent += order.total;
            if (order.createdAt && (!customer.lastOrder || new Date(order.createdAt) > new Date(customer.lastOrder))) {
                customer.lastOrder = order.createdAt;
            }
        });

        return Array.from(byEmail.values()).sort(function (a, b) {
            return b.orders - a.orders || a.email.localeCompare(b.email);
        });
    }

    function derivePopular(plants, orders) {
        var counts = new Map();

        orders.forEach(function (order) {
            order.items.forEach(function (rawItem) {
                if (!rawItem) return;
                var itemId = firstDefined(rawItem, ["id", "productId", "product_id", "itemId"]);
                var itemName = text(firstDefined(rawItem, ["name", "title", "productName"]));
                var product = plants.find(function (plant) {
                    if (itemId !== undefined && String(plant.id) === String(itemId)) return true;
                    return Boolean(itemName) && String(plant.name).toLowerCase() === itemName.toLowerCase();
                });
                if (!product) return; // no matching catalogue item means no invented ranking
                var quantity = whole(firstDefined(rawItem, ["quantity", "qty", "count"])) || 1;
                var key = String(product.id);
                counts.set(key, (counts.get(key) || 0) + quantity);
            });
        });

        return Array.from(counts.entries())
            .map(function (entry) {
                var product = plants.find(function (candidate) { return String(candidate.id) === entry[0]; });
                return {
                    id: product.id,
                    name: product.name,
                    orders: entry[1]
                };
            })
            .sort(function (a, b) { return b.orders - a.orders || a.name.localeCompare(b.name); })
            .slice(0, 4);
    }

    function statusCount(orders, completed) {
        return orders.filter(function (order) {
            var status = order.status.toLowerCase();
            var isCompleted = /deliver|complet|fulfil|dispatch|ship|cancel|refund/.test(status);
            return completed ? isCompleted : !isCompleted;
        }).length;
    }

    function normalizeSnapshot(payload) {
        if (!isObject(payload)) return null;

        // Some endpoints wrap the dashboard object in a "data" envelope.
        if (isObject(payload.data) && firstDefined(payload, ["totals", "stats", "summary", "plants", "orders", "categories"]) === undefined) {
            payload = payload.data;
        }

        var totalsSource = firstDefined(payload, ["totals", "stats", "summary", "counts"]) || {};
        var plantsRaw = arrayOf(firstDefined(payload, ["plants", "plantVarieties", "plant_varieties", "plantCollection", "catalogue", "catalog", "products"]));
        var potsRaw = firstDefined(payload, ["potCollections", "potVarieties", "pot_varieties", "pots", "potStyles", "potOptions"]);
        var ordersRaw = arrayOf(firstDefined(payload, ["orders", "recentOrders", "recent_orders", "savedOrders", "orderHistory"]));
        var customersRaw = arrayOf(firstDefined(payload, ["customers", "customerInformation", "customer_information", "customerInfo", "customerList", "customerDetails"]));
        var recentPlantsRaw = arrayOf(firstDefined(payload, ["recentPlants", "recentlyAdded", "recentlyAddedPlants", "newPlants"]));
        var popularRaw = arrayOf(firstDefined(payload, ["popularPlants", "popular_plants", "popularVarieties", "topPlants", "mostLoved"]));
        var categoriesRaw = firstDefined(payload, ["categories", "categoryCounts", "category_counts", "collection", "collectionMix"]);
        var monthlyRaw = firstDefined(payload, ["monthlyOrders", "monthly_orders", "monthlyCounts", "monthlyOrderCounts", "ordersByMonth", "orderTrend", "monthlyTrend"]);

        var plants = plantsRaw.map(normalizeProduct).filter(function (plant) {
            return plant && plant.name && !/^(pots|accessories)$/i.test(plant.category);
        });
        var potStyles = uniqueNames(arrayOf(potsRaw).map(function (item) {
            return typeof item === "object" && item !== null
                ? firstDefined(item, ["name", "title", "style", "label", "pot", "collection"])
                : item;
        }));
        var orders = ordersRaw.map(normalizeOrder).filter(Boolean);
        var customers = customersRaw.map(normalizeCustomer).filter(function (customer) {
            return customer && customer.email;
        });
        if (!customers.length) customers = deriveCustomers(orders);

        var recentPlants = recentPlantsRaw.length
            ? recentPlantsRaw.map(normalizeProduct).filter(function (plant) { return plant && plant.name; })
            : plants.slice().sort(function (a, b) { return num(b.id) - num(a.id) || String(b.id).localeCompare(String(a.id)); }).slice(0, 4);

        var popularPlants = popularRaw.length
            ? popularRaw.map(normalizeProduct).filter(function (plant) { return plant && plant.name; }).slice(0, 4)
            : derivePopular(plants, orders);

        var orderKeys = ["orders", "totalOrders", "total_orders", "orderCount"];
        var customerKeys = ["customers", "totalCustomers", "total_customers", "customerCount"];
        var explicitOrders = firstDefined(totalsSource, orderKeys) !== undefined
            ? firstDefined(totalsSource, orderKeys)
            : firstDefined(payload, orderKeys);
        var explicitCustomers = firstDefined(totalsSource, customerKeys) !== undefined
            ? firstDefined(totalsSource, customerKeys)
            : firstDefined(payload, customerKeys);

        return {
            source: text(firstDefined(payload, ["source", "label"])) || "Live store data",
            plants: plants,
            potStyles: potStyles,
            categories: normalizeCategories(categoriesRaw, plants),
            recentPlants: recentPlants,
            popularPlants: popularPlants,
            orders: orders,
            customers: customers,
            monthly: normalizeMonthly(monthlyRaw, orders),
            totals: {
                plants: whole(firstDefined(totalsSource, ["plants", "plantVarieties", "totalPlants", "totalPlantVarieties", "total_plants"]) !== undefined
                    ? firstDefined(totalsSource, ["plants", "plantVarieties", "totalPlants", "totalPlantVarieties", "total_plants"])
                    : plants.length),
                pots: whole(firstDefined(totalsSource, ["pots", "potVarieties", "totalPots", "totalPotVarieties", "total_pots"]) !== undefined
                    ? firstDefined(totalsSource, ["pots", "potVarieties", "totalPots", "totalPotVarieties", "total_pots"])
                    : potStyles.length),
                customers: whole(explicitCustomers !== undefined ? explicitCustomers : customers.length),
                orders: whole(explicitOrders !== undefined ? explicitOrders : orders.length),
                completed: whole(firstDefined(totalsSource, ["completed", "completedOrders", "deliveredOrders"]) !== undefined
                    ? firstDefined(totalsSource, ["completed", "completedOrders", "deliveredOrders"])
                    : statusCount(orders, true)),
                active: whole(firstDefined(totalsSource, ["active", "activeOrders", "inProgress", "inProgressOrders"]) !== undefined
                    ? firstDefined(totalsSource, ["active", "activeOrders", "inProgress", "inProgressOrders"])
                    : statusCount(orders, false))
            }
        };
    }

    function readLocalOrders() {
        try {
            var parsed = JSON.parse(localStorage.getItem("greenLivingOrders") || "[]");
            return arrayOf(parsed).map(normalizeOrder).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    function localSnapshot() {
        var products = arrayOf(window.greenLivingProducts)
            .map(normalizeProduct)
            .filter(function (product) { return product && product.name; });

        var plants = products.filter(function (product) {
            return !/^(pots|accessories)$/i.test(product.category);
        });
        var potStyles = uniqueNames(products
            .filter(function (product) { return /pot|planter/i.test(product.category + " " + product.name); })
            .map(function (product) { return product.name; }));

        var orders = readLocalOrders();
        var customers = deriveCustomers(orders);

        return {
            source: "Local catalogue & saved orders",
            plants: plants,
            potStyles: potStyles,
            categories: normalizeCategories(null, plants),
            recentPlants: plants.slice().sort(function (a, b) {
                return num(b.id) - num(a.id) || String(b.id).localeCompare(String(a.id));
            }).slice(0, 4),
            popularPlants: derivePopular(plants, orders),
            orders: orders,
            customers: customers,
            monthly: normalizeMonthly(null, orders),
            totals: {
                plants: plants.length,
                pots: potStyles.length,
                customers: customers.length,
                orders: orders.length,
                completed: statusCount(orders, true),
                active: statusCount(orders, false)
            }
        };
    }

    /* -----------------------------------------------------
       Rendering
       ----------------------------------------------------- */

    function animateValue(element, target) {
        if (!element) return;

        var token = (animationTokens.get(element) || 0) + 1;
        animationTokens.set(element, token);
        element.dataset.value = String(target);

        if (reducedMotion() || !window.requestAnimationFrame) {
            element.textContent = numberFormat.format(target);
            return;
        }

        var start = performance.now();
        var duration = 720;
        var tick = function (now) {
            if (animationTokens.get(element) !== token) return;
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = numberFormat.format(Math.round(target * eased));
            if (progress < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
    }

    function renderSource(snapshot) {
        var source = $("#gardenDashboardSource", root);
        root.dataset.source = /api|live/i.test(snapshot.source) ? "api" : "local";
        if (!source) return;
        source.textContent = root.dataset.source === "api"
            ? snapshot.source + " · live catalogue and saved store orders"
            : snapshot.source + " · API unavailable, showing zero where no saved data exists";
    }

    function renderStats(snapshot) {
        $$("[data-dashboard-stat]", root).forEach(function (element) {
            var key = element.getAttribute("data-dashboard-stat");
            if (Object.prototype.hasOwnProperty.call(snapshot.totals, key)) {
                animateValue(element, snapshot.totals[key]);
            }
        });
    }

    function renderCollection(snapshot) {
        var donut = $("#gardenDonut", root);
        var legend = $("#gardenCategoryLegend", root);
        var totalValue = $("#gardenDonutValue", root);
        if (!donut || !legend) return;

        // The live dashboard endpoint supplies categoryCounts (which includes Pots
        // and Accessories) but not a flat plants array. Keep the donut limited to
        // plant categories and derive its total from the very entries it draws so
        // the centre value, segments and "Total Plant Varieties" stat always agree.
        var entries = (snapshot.categories || []).filter(function (entry) {
            return !/^(pots|accessories)$/i.test(entry.name);
        });
        var total = entries.reduce(function (sum, entry) { return sum + entry.count; }, 0);
        var angle = 0;
        var segments = entries.map(function (entry, index) {
            var next = angle + (total ? (entry.count / total) * 360 : 0);
            var color = DONUT_PALETTE[index % DONUT_PALETTE.length];
            var segment = color + " " + angle.toFixed(2) + "deg " + next.toFixed(2) + "deg";
            angle = next;
            return segment;
        });

        donut.style.background = segments.length
            ? "conic-gradient(" + segments.join(",") + ")"
            : "conic-gradient(rgba(175,197,160,.18) 0deg 360deg)";
        donut.setAttribute("aria-label", entries.length
            ? entries.map(function (entry) { return entry.name + ": " + entry.count + " varieties"; }).join(", ")
            : "No plant categories in the catalogue");
        if (totalValue) totalValue.textContent = String(total);

        legend.innerHTML = entries.length
            ? entries.map(function (entry, index) {
                var color = DONUT_PALETTE[index % DONUT_PALETTE.length];
                var percent = total ? Math.round((entry.count / total) * 100) : 0;
                return '<button type="button" class="gd-legend-row" data-dashboard-category="' + escapeHtml(entry.name) + '" aria-label="View ' + escapeHtml(entry.name) + ' plants in the shop">' +
                    '<span class="gd-legend-dot" style="background:' + color + '"></span>' +
                    '<span class="gd-legend-name">' + escapeHtml(entry.name) + '</span>' +
                    '<span class="gd-legend-count">' + entry.count + '</span>' +
                    '<span class="gd-legend-bar"><i style="width:' + percent + '%;background:' + color + '"></i></span>' +
                    '</button>';
            }).join("")
            : '<p class="gd-empty">No catalogue categories available.</p>';
    }

    function renderRecentPlants(snapshot) {
        var container = $("#gardenRecentPlants", root);
        if (!container) return;

        if (!snapshot.recentPlants.length) {
            container.innerHTML = '<p class="gd-empty">No recently added plants in the catalogue.</p>';
            return;
        }

        container.innerHTML = snapshot.recentPlants.map(function (product, index) {
            var imagePosition = product.imagePosition ? ' style="object-position:' + escapeHtml(product.imagePosition) + '"' : "";
            var image = product.image
                ? '<span class="gd-plant-thumb"><img src="' + escapeHtml(product.image) + '" alt="" loading="lazy" decoding="async"' + imagePosition + '></span>'
                : '<span class="gd-plant-thumb gd-thumb-empty" aria-hidden="true">❧</span>';
            return '<button type="button" class="gd-plant-row gd-clickable" data-product-id="' + escapeHtml(product.id) + '" aria-label="View ' + escapeHtml(product.name) + '">' +
                image +
                '<span class="gd-plant-copy"><strong>' + escapeHtml(product.name) + '</strong><small>' +
                escapeHtml(product.category || "Plant") + (product.tag ? ' · ' + escapeHtml(product.tag) : '') + '</small></span>' +
                '<span class="gd-plant-index">' + String(index + 1).padStart(2, "0") + '</span>' +
                '</button>';
        }).join("");
    }

    function renderPopularPlants(snapshot) {
        var container = $("#gardenPopularPlants", root);
        if (!container) return;

        if (!snapshot.popularPlants.length) {
            container.innerHTML = '<p class="gd-empty">No order history yet — popularity appears once orders are saved.</p>';
            return;
        }

        var max = Math.max.apply(null, snapshot.popularPlants.map(function (item) { return item.orders; })) || 1;
        container.innerHTML = snapshot.popularPlants.map(function (item, index) {
            var percent = Math.max(12, Math.round((item.orders / max) * 100));
            return '<div class="gd-rank-row">' +
                '<span class="gd-rank-number">' + String(index + 1).padStart(2, "0") + '</span>' +
                '<span class="gd-rank-copy"><strong>' + escapeHtml(item.name) + '</strong>' +
                '<span class="gd-rank-track"><i style="width:' + percent + '%"></i></span></span>' +
                '<span class="gd-rank-value">' + item.orders + '</span>' +
                '</div>';
        }).join("");
    }

    function renderPotCollections(snapshot) {
        var container = $("#gardenPotCollections", root);
        var count = $("#gardenPotCount", root);
        if (!container) return;
        if (count) count.textContent = snapshot.potStyles.length + " styles";

        if (!snapshot.potStyles.length) {
            container.innerHTML = '<p class="gd-empty">No pot collections available.</p>';
            return;
        }

        var icons = [
            '<circle cx="12" cy="8" r="3.2"/><path d="M6 18h12l-1 3H7l-1-3Z"/>',
            '<rect x="7.5" y="4" width="9" height="14" rx="2"/><path d="M6 18h12"/>',
            '<path d="M5 8h14l-1.4 10H6.4L5 8Z"/><path d="M4 8h16"/>',
            '<path d="M8 4h8l-1 4H9L8 4Z"/><path d="M6 9h12l-1 9H7l-1-9Z"/>'
        ];

        container.innerHTML = snapshot.potStyles.slice(0, 8).map(function (style, index) {
            return '<div class="gd-pot-item">' +
                '<span class="gd-pot-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[index % icons.length] + '</svg></span>' +
                '<span>' + escapeHtml(style) + '</span>' +
                '</div>';
        }).join("");
    }

    function renderRecentOrders(snapshot) {
        var container = $("#gardenRecentOrders", root);
        if (!container) return;

        if (!snapshot.orders.length) {
            container.innerHTML = '<p class="gd-empty">No orders yet.</p>';
            return;
        }

        var orders = snapshot.orders.slice().sort(function (a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }).slice(0, 5);

        container.innerHTML = orders.map(function (order) {
            var itemCount = order.items.length;
            return '<div class="gd-order-row">' +
                '<span class="gd-order-id">' + escapeHtml(order.id || "—") + '</span>' +
                '<span class="gd-order-main"><strong>' + escapeHtml(order.name || "—") + '</strong>' +
                '<small>' + escapeHtml(order.email || "—") + '</small></span>' +
                '<span class="gd-order-meta"><strong>' + escapeHtml(money(order.total)) + '</strong>' +
                '<small>' + escapeHtml(formatDate(order.createdAt)) + ' · ' + itemCount + (itemCount === 1 ? " item" : " items") + '</small></span>' +
                '<span class="gd-order-status">' + escapeHtml(order.status || "Order placed") + '</span>' +
                '</div>';
        }).join("");
    }

    function renderCustomers(snapshot) {
        var container = $("#gardenCustomers", root);
        if (!container) return;

        if (!snapshot.customers.length) {
            container.innerHTML = '<p class="gd-empty">No customers yet — customer details appear with saved orders.</p>';
            return;
        }

        container.innerHTML = snapshot.customers.slice(0, 6).map(function (customer) {
            var initials = customer.name
                ? customer.name.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase()
                : "·";
            return '<div class="gd-customer-row">' +
                '<span class="gd-avatar" aria-hidden="true">' + escapeHtml(initials) + '</span>' +
                '<span class="gd-customer-main"><strong>' + escapeHtml(customer.name || "—") + '</strong>' +
                '<small>' + escapeHtml(customer.email) + '</small></span>' +
                '<span class="gd-customer-meta"><strong>' + customer.orders + (customer.orders === 1 ? " order" : " orders") + '</strong>' +
                '<small>' + escapeHtml(money(customer.totalSpent)) + '</small></span>' +
                '</div>';
        }).join("");
    }

    function renderOrders(snapshot) {
        var total = $("#gardenOrderTotal", root);
        var completed = $("#gardenOrderCompleted", root);
        var active = $("#gardenOrderActive", root);
        var local = $("#gardenLocalOrderCount", root);
        var chart = $("#gardenOrderChart", root);
        if (!chart) return;

        if (total) total.textContent = numberFormat.format(snapshot.totals.orders);
        if (completed) completed.textContent = numberFormat.format(snapshot.totals.completed);
        if (active) active.textContent = numberFormat.format(snapshot.totals.active);
        if (local) local.textContent = snapshot.orders.length + " shown";

        var hasMonthlyData = snapshot.monthly.some(function (entry) { return entry.count > 0; });
        if (!hasMonthlyData) {
            chart.innerHTML = '<p class="gd-empty">No orders yet.</p>';
            chart.classList.add("gd-chart--empty");
            return;
        }

        chart.classList.remove("gd-chart--empty");
        var max = Math.max.apply(null, snapshot.monthly.map(function (entry) { return entry.count; })) || 1;
        chart.innerHTML = snapshot.monthly.map(function (entry) {
            var height = Math.max(8, Math.round((entry.count / max) * 100));
            return '<div class="gd-chart-column">' +
                '<span class="gd-chart-value">' + entry.count + '</span>' +
                '<span class="gd-chart-bar"><i style="height:' + height + '%"></i></span>' +
                '<span class="gd-chart-label">' + escapeHtml(entry.label) + '</span>' +
                '</div>';
        }).join("");
    }

    function renderAll(snapshot) {
        renderSource(snapshot);
        renderStats(snapshot);
        renderCollection(snapshot);
        renderRecentPlants(snapshot);
        renderPopularPlants(snapshot);
        renderPotCollections(snapshot);
        renderRecentOrders(snapshot);
        renderCustomers(snapshot);
        renderOrders(snapshot);
        root.dataset.dashboardReady = "true";
    }

    /* -----------------------------------------------------
       Interactions
       ----------------------------------------------------- */

    function scrollToSelector(selector) {
        var target = $(selector);
        if (target && typeof target.scrollIntoView === "function") {
            target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
        }
    }

    function selectCategory(category) {
        var name = text(category);
        if (!name) return;
        if (typeof window.greenLivingSelectCategory === "function") {
            window.greenLivingSelectCategory(name);
            return;
        }
        scrollToSelector("#shop");
    }

    function openProduct(id) {
        var productId = text(id);
        if (!productId) return;
        if (typeof window.greenLivingOpenProduct === "function") {
            window.greenLivingOpenProduct(productId);
            return;
        }
        scrollToSelector("#productGrid");
    }

    root.addEventListener("click", function (event) {
        var categoryElement = closest(event.target, "[data-dashboard-category]");
        if (categoryElement) {
            selectCategory(categoryElement.getAttribute("data-dashboard-category"));
            return;
        }
        var productElement = closest(event.target, "[data-product-id]");
        if (productElement) openProduct(productElement.getAttribute("data-product-id"));
    });

    root.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        var target = closest(event.target, "[data-dashboard-category], [data-product-id]");
        if (target && target.tagName === "BUTTON") {
            event.preventDefault();
            target.click();
        }
    });

    function setBusy(busy) {
        if (!refreshButton) return;
        refreshButton.disabled = busy;
        refreshButton.setAttribute("aria-busy", busy ? "true" : "false");
        var label = $(".gd-refresh-label", refreshButton);
        if (label) label.textContent = busy ? "Refreshing…" : "Refresh";
    }

    function refresh() {
        var token = ++requestToken;
        setBusy(true);

        function useFallback() {
            finish(localSnapshot());
        }

        function finish(snapshot) {
            if (token !== requestToken) return;
            lastSnapshot = snapshot;
            renderAll(snapshot);
            setBusy(false);
        }

        if (window.location.protocol === "file:" || typeof fetch !== "function") {
            return Promise.resolve().then(useFallback);
        }

        var controller = typeof AbortController === "function" ? new AbortController() : null;
        var timer = controller ? window.setTimeout(function () { controller.abort(); }, apiTimeoutMs) : 0;
        var options = { cache: "no-store", headers: { Accept: "application/json" } };
        if (controller) options.signal = controller.signal;

        return fetch("/api/dashboard", options)
            .then(function (response) {
                var contentType = response.headers && response.headers.get
                    ? (response.headers.get("content-type") || "")
                    : "";
                if (!response.ok || contentType.indexOf("json") === -1) return null;
                return response.json();
            })
            .then(function (payload) {
                if (!isObject(payload) || payload.error || payload.success === false) return null;
                return normalizeSnapshot(payload);
            })
            .then(function (snapshot) {
                if (snapshot) finish(snapshot);
                else useFallback();
            })
            .catch(useFallback)
            .then(function () {
                if (timer) window.clearTimeout(timer);
            });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", function () { refresh(); });
    }

    window.greenLivingDashboard = {
        getSnapshot: function () { return lastSnapshot; },
        refresh: refresh
    };

    lastSnapshot = localSnapshot();
    refresh();
})();
