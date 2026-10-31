/* =========================
   SUPABASE
========================= */
(function () {
    const loginCompleted =
        sessionStorage.getItem("kaka_login_completed");

    if (loginCompleted !== "true") {
        window.location.replace("login.html");
        return;
    }

    sessionStorage.removeItem("kaka_login_completed");
})();

(async function () {
    const token = localStorage.getItem("kaka_access_token");

    if (!token) {
        window.location.replace("./login.html");
        return;
    }

    try {
        const response = await fetch(
            "https://oikdlfdviruwwukwosmn.supabase.co/auth/v1/user",
            {
                headers: {
                    "apikey": "sb_publishable_bMEfqkt2eZPBiNDXY8gbEA_okVZKsLU",
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            localStorage.removeItem("kaka_access_token");
            localStorage.removeItem("kaka_refresh_token");
            localStorage.removeItem("kaka_user");

            window.location.replace("./login.html");
        }
    } catch (error) {
        console.error("Could not verify login:", error);
    }
})();

(function () {
    const accessToken =
        localStorage.getItem("kaka_access_token");

    if (!accessToken) {
        window.location.replace("login.html");
    }
}());

const SUPABASE_URL =
    "https://oikdlfdviruwwukwosmn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_bMEfqkt2eZPBiNDXY8gbEA_okVZKsLU";


/* =========================
   VARIABLES
========================= */

let products = [];
let filteredProducts = [];
let currentProduct = null;
let currentImages = [];
let currentImageIndex = 0;
let selectedSize = null;
let activeMessageId = null;


/* =========================
   DOM
========================= */

const productGrid = document.getElementById("productGrid");
const productCount = document.getElementById("productCount");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const categoryFilter = document.getElementById("categoryFilter");
const genderFilter = document.getElementById("genderFilter");
const sizeFilter = document.getElementById("sizeFilter");
const colourFilter = document.getElementById("colourFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortSelect = document.getElementById("sortSelect");
const clearFilters = document.getElementById("clearFilters");
const filtersSidebar = document.getElementById("filtersSidebar");
const filterOverlay = document.getElementById("filterOverlay");
const openFilters = document.getElementById("openFilters");
const closeFilters = document.getElementById("closeFilters");
const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");
const modalMainImage = document.getElementById("modalMainImage");
const modalBrand = document.getElementById("modalBrand");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalMeta = document.getElementById("modalMeta");
const modalDescription = document.getElementById("modalDescription");
const thumbnailContainer = document.getElementById("thumbnailContainer");
const galleryCounter = document.getElementById("galleryCounter");
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");
const sizeSection = document.getElementById("sizeSection");
const sizeButtons = document.getElementById("sizeButtons");
const stockMessage = document.getElementById("stockMessage");
const messageArea = document.getElementById("messageArea");
const messageSubtitle = document.getElementById("messageSubtitle");
const messagesModal = document.getElementById("messagesModal");
const myMessagesArea = document.getElementById("myMessagesArea");


/* =========================
   FILTER SIDEBAR
========================= */

function openFilterSidebar() {
    filtersSidebar.classList.add("active");
    filterOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeFilterSidebar() {
    filtersSidebar.classList.remove("active");
    filterOverlay.classList.remove("active");

    if (
        !productModal.classList.contains("active") &&
        !messagesModal.classList.contains("active")
    ) {
        document.body.style.overflow = "";
    }
}

openFilters.addEventListener("click", openFilterSidebar);
closeFilters.addEventListener("click", closeFilterSidebar);
filterOverlay.addEventListener("click", closeFilterSidebar);


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
    try {
        productCount.textContent = "Loading products...";

        const response = await fetch(
            SUPABASE_URL + "/rest/v1/Products?select=*&is_public=eq.true&order=created_at.desc",
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + SUPABASE_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        products = await response.json();
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error(error);
        productCount.textContent = "Unable to load products.";
        productGrid.innerHTML = `<div class="no-products">Unable to load products right now.</div>`;
    }
}


/* =========================
   FILTER OPTIONS
========================= */

function populateFilters() {
    populateSelect(brandFilter, products.map(p => p.brand));
    populateSelect(categoryFilter, products.map(p => p.category));
    populateSelect(genderFilter, products.map(p => p.gender));
    populateSelect(sizeFilter, getAllSizes());
    populateSelect(colourFilter, products.map(p => p.colour));
}

function populateSelect(select, values) {
    const currentValue = select.value;
    const uniqueValues = [
        ...new Set(
            values
                .filter(value => value !== null && value !== undefined && String(value).trim() !== "")
                .map(value => String(value).trim())
        )
    ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const firstOption = select.options[0];
    select.innerHTML = "";
    select.appendChild(firstOption);

    uniqueValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    if (uniqueValues.includes(currentValue)) {
        select.value = currentValue;
    }
}

function getAllSizes() {
    const sizes = [];
    products.forEach(product => {
        if (product.size_stock && typeof product.size_stock === "object") {
            Object.keys(product.size_stock).forEach(size => {
                if (!sizes.includes(size)) sizes.push(size);
            });
        }
        if (product.size) {
            String(product.size)
                .split(",")
                .map(size => size.trim())
                .filter(Boolean)
                .forEach(size => {
                    if (!sizes.includes(size)) sizes.push(size);
                });
        }
    });
    return sizes;
}


/* =========================
   FILTERING
========================= */

function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const brand = brandFilter.value;
    const category = categoryFilter.value;
    const gender = genderFilter.value;
    const size = sizeFilter.value;
    const colour = colourFilter.value;
    const min = minPrice.value !== "" ? Number(minPrice.value) : null;
    const max = maxPrice.value !== "" ? Number(maxPrice.value) : null;

    filteredProducts = products.filter(product => {
        const searchableText = [
            product.name,
            product.brand,
            product.category,
            product.gender,
            product.colour,
            product.description
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (search && !searchableText.includes(search)) return false;
        if (brand && product.brand !== brand) return false;
        if (category && product.category !== category) return false;
        if (gender && product.gender !== gender) return false;
        if (colour && product.colour !== colour) return false;
        if (size && !productHasSize(product, size)) return false;

        const price = Number(product.price);
        if (min !== null && (Number.isNaN(price) || price < min)) return false;
        if (max !== null && (Number.isNaN(price) || price > max)) return false;

        return true;
    });

    sortProducts();
    renderProducts();
}

function sortProducts() {
    const sort = sortSelect.value;
    filteredProducts.sort((a, b) => {
        if (sort === "price-low") return Number(a.price || 0) - Number(b.price || 0);
        if (sort === "price-high") return Number(b.price || 0) - Number(a.price || 0);
        if (sort === "name-az") return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
        if (sort === "name-za") return String(b.name || "").localeCompare(String(a.name || ""), undefined, { sensitivity: "base" });

        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    });
}

function productHasSize(product, selectedSize) {
    if (product.size_stock && typeof product.size_stock === "object") {
        return Object.prototype.hasOwnProperty.call(product.size_stock, selectedSize);
    }
    if (product.size) {
        return String(product.size).split(",").map(size => size.trim()).includes(selectedSize);
    }
    return false;
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {
    productGrid.innerHTML = "";
    productCount.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`;

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `<div class="no-products">No products found.</div>`;
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        const images = getProductImages(product);
        const image = images.length > 0 ? images[0] : "";

        const imageHTML = image
            ? `<img class="product-image" src="${escapeAttribute(image)}" alt="${escapeAttribute(product.name || "Product")}" loading="lazy">`
            : `<div class="product-image" style="display:flex;align-items:center;justify-content:center;color:#888;">No Image</div>`;

        const imageCountHTML = images.length > 1 ? `<div class="image-count">${images.length} images</div>` : "";
        const stock = getTotalStock(product);
        let stockText = stock > 0 ? `<span class="stock-badge">In Stock</span>` : `<span class="stock-badge">Out of Stock</span>`;

        card.innerHTML = `
            <div class="product-image-container">
                ${imageHTML}
                ${imageCountHTML}
            </div>
            <div class="product-info">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    ${product.brand ? `<div class="product-brand" style="margin-bottom:0;">${escapeHTML(product.brand)}</div>` : ""}
                    <button type="button" class="product-msg-icon-btn" title="View messages for this product" style="background:none; border:none; cursor:pointer; font-size:16px;" data-product-id="${product.id}" data-product-name="${escapeAttribute(product.name)}">💬</button>
                </div>
                <div class="product-name" style="margin-top: 5px;">${escapeHTML(product.name || "Unnamed Product")}</div>
                <div class="product-meta">
                    ${product.category ? escapeHTML(product.category) : ""}
                    ${product.colour ? " • " + escapeHTML(product.colour) : ""}
                </div>
                <div class="product-price">₹${formatPrice(product.price)}</div>
                ${stockText}
            </div>
        `;

        // Handle clicking the small chat icon button specifically
        const msgBtn = card.querySelector(".product-msg-icon-btn");
        msgBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openProductMessages(product.id, product.name);
        });

        card.addEventListener("click", () => openProductModal(product));
        productGrid.appendChild(card);
    });
}

function getProductImages(product) {
    let images = [];
    if (Array.isArray(product.image_urls)) images = product.image_urls.filter(Boolean);
    if (images.length === 0 && product.image_url) images = [product.image_url];
    return images;
}

function getTotalStock(product) {
    if (product.size_stock && typeof product.size_stock === "object") {
        return Object.values(product.size_stock).reduce((total, value) => {
            const number = Number(value);
            return total + (Number.isFinite(number) ? Math.max(0, number) : 0);
        }, 0);
    }
    const stock = Number(product.stock || 0);
    return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}


/* =========================
   OPEN PRODUCT MODAL
========================= */

function openProductModal(product) {
    currentProduct = product;
    currentImages = getProductImages(product);
    currentImageIndex = 0;
    selectedSize = null;

    modalBrand.textContent = product.brand || "";
    modalName.textContent = product.name || "Unnamed Product";
    modalPrice.textContent = "₹" + formatPrice(product.price);

    const metaParts = [];
    if (product.category) metaParts.push(product.category);
    if (product.gender) metaParts.push(product.gender);
    if (product.colour) metaParts.push(product.colour);
    modalMeta.textContent = metaParts.join(" • ");
    modalDescription.textContent = product.description || "";

    renderGallery();
    renderSizeButtons();
    renderMessageBox();

    productModal.classList.add("active");
    document.body.style.overflow = "hidden";
}


/* =========================
   GALLERY
========================= */

function renderGallery() {
    if (currentImages.length === 0) {
        modalMainImage.src = "";
        galleryCounter.textContent = "0 / 0";
        thumbnailContainer.innerHTML = "";
        prevImage.style.display = "none";
        nextImage.style.display = "none";
        return;
    }

    modalMainImage.src = currentImages[currentImageIndex];
    galleryCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    thumbnailContainer.innerHTML = "";

    currentImages.forEach((image, index) => {
        const thumbnail = document.createElement("img");
        thumbnail.className = "thumbnail";
        if (index === currentImageIndex) thumbnail.classList.add("active");
        thumbnail.src = image;
        thumbnail.alt = "Product thumbnail";
        thumbnail.addEventListener("click", event => {
            event.stopPropagation();
            currentImageIndex = index;
            renderGallery();
        });
        thumbnailContainer.appendChild(thumbnail);
    });

    const showControls = currentImages.length > 1;
    prevImage.style.display = showControls ? "block" : "none";
    nextImage.style.display = showControls ? "block" : "none";
}

function showPreviousImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex--;
    if (currentImageIndex < 0) currentImageIndex = currentImages.length - 1;
    renderGallery();
}

function showNextImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex++;
    if (currentImageIndex >= currentImages.length) currentImageIndex = 0;
    renderGallery();
}


/* =========================
   SIZE BUTTONS
========================= */

function renderSizeButtons() {
    sizeButtons.innerHTML = "";
    stockMessage.textContent = "";
    selectedSize = null;

    let sizes = [];
    if (currentProduct.size_stock && typeof currentProduct.size_stock === "object") {
        sizes = Object.keys(currentProduct.size_stock);
    }
    if (sizes.length === 0 && currentProduct.size) {
        sizes = String(currentProduct.size).split(",").map(size => size.trim()).filter(Boolean);
    }

    if (sizes.length === 0) {
        sizeSection.style.display = "none";
        return;
    }

    sizeSection.style.display = "block";

    sizes.forEach(size => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "size-button";
        button.textContent = size;

        const stock = getSizeStock(currentProduct, size);
        if (stock <= 0) {
            button.classList.add("out-of-stock");
            button.disabled = true;
        }

        button.addEventListener("click", () => {
            if (button.disabled) return;
            document.querySelectorAll(".size-button").forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            selectedSize = size;
            stockMessage.textContent = `${stock} available in size ${size}`;
            updateMessageSubtitle();
        });

        sizeButtons.appendChild(button);
    });

    if (getTotalStock(currentProduct) <= 0) {
        stockMessage.textContent = "Currently out of stock.";
    }
}

function getSizeStock(product, size) {
    if (product.size_stock && typeof product.size_stock === "object") {
        const value = product.size_stock[size];
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
    }
    return Number(product.stock || 0);
}


/* =========================
   CUSTOMER LOGIN & MESSAGING
========================= */

function getLoggedInUser() {
    try {
        const storedUser = localStorage.getItem("kaka_user");
        if (!storedUser) return null;
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Unable to read logged-in user:", error);
        return null;
    }
}

function renderMessageBox() {
    const user = getLoggedInUser();
    messageArea.innerHTML = "";

    if (!user) {
        messageSubtitle.textContent = "Please log in to send a message about this product.";
        messageArea.innerHTML = `
            <div class="login-message">
                You need to be logged in before you can send an enquiry.
                <br>
                <a class="login-button" href="login.html">Login</a>
            </div>
        `;
        return;
    }

    messageSubtitle.textContent = `Logged in as ${user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email || "Customer"}`;

    messageArea.innerHTML = `
        <textarea id="customerMessage" class="message-box" placeholder="Write your message here..." maxlength="1000"></textarea>
        <button type="button" id="sendMessageButton" class="send-message-button">Send Message</button>
        <div id="messageStatus" class="message-status"></div>
    `;

    document.getElementById("sendMessageButton").addEventListener("click", sendCustomerMessage);
}

function updateMessageSubtitle() {
    const user = getLoggedInUser();
    if (!user) return;
    const name = user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email || "Customer";
    if (selectedSize) {
        messageSubtitle.textContent = `Logged in as ${name}. Enquiring about size ${selectedSize}.`;
    } else {
        messageSubtitle.textContent = `Logged in as ${name}.`;
    }
}

async function sendCustomerMessage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    if (!currentProduct) return;

    const messageInput = document.getElementById("customerMessage");
    const sendButton = document.getElementById("sendMessageButton");
    const status = document.getElementById("messageStatus");

    if (!messageInput || !sendButton || !status) return;

    const message = messageInput.value.trim();
    if (!message) {
        status.className = "message-status error";
        status.textContent = "Please write a message first.";
        return;
    }

    if (hasProductSizes(currentProduct) && !selectedSize) {
        status.className = "message-status error";
        status.textContent = "Please select a size first.";
        return;
    }

    const userName = user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : "";
    const userEmail = user.email || "";
    const accessToken = localStorage.getItem("kaka_access_token");

    if (!accessToken) {
        status.className = "message-status error";
        status.textContent = "Your login session has expired. Please log in again.";
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    status.className = "message-status";
    status.textContent = "";

    try {
        const response = await fetch(SUPABASE_URL + "/rest/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + accessToken,
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                user_id: user.id,
                customer_name: userName || null,
                customer_email: userEmail || null,
                product_id: currentProduct.id || null,
                product_name: currentProduct.name || null,
                selected_size: selectedSize || null,
                message: message,
                status: "New"
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Unable to send message.");
        }

        messageInput.value = "";
        status.className = "message-status success";
        status.textContent = "Message sent successfully! The KAKA team will receive your enquiry.";
    } catch (error) {
        console.error("Message error:", error);
        status.className = "message-status error";
        status.textContent = error.message || "Unable to send message. Please try again.";
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Send Message";
    }
}

function hasProductSizes(product) {
    if (product.size_stock && typeof product.size_stock === "object") {
        return Object.keys(product.size_stock).length > 0;
    }
    if (product.size) {
        return String(product.size).split(",").map(size => size.trim()).filter(Boolean).length > 0;
    }
    return false;
}


/* =========================
   PRODUCT-SPECIFIC MESSAGES & REPLIES
========================= */

async function openProductMessages(productId, productName) {
    const user = getLoggedInUser();
    messagesModal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (!user) {
        myMessagesArea.innerHTML = `
            <div class="messages-login">
                <p>You need to be logged in to view your messages.</p>
                <a class="login-button" href="login.html">Login</a>
            </div>
        `;
        return;
    }

    await loadProductSpecificMessages(productId, productName);
}

async function loadProductSpecificMessages(productId, productName) {
    const user = getLoggedInUser();
    if (!user) return;

    myMessagesArea.innerHTML = `<div class="no-messages">Loading messages for ${escapeHTML(productName)}...</div>`;

    const accessToken = localStorage.getItem("kaka_access_token");
    if (!accessToken) {
        myMessagesArea.innerHTML = `<div class="messages-error">Your login session has expired. Please log in again.</div>`;
        return;
    }

    try {
        const messagesResponse = await fetch(
            SUPABASE_URL + "/rest/v1/messages?select=*&user_id=eq." + encodeURIComponent(user.id) + "&product_id=eq." + encodeURIComponent(productId) + "&order=created_at.desc",
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            }
        );

        if (!messagesResponse.ok) {
            throw new Error("Unable to load messages.");
        }

        const messages = await messagesResponse.json();

        if (messages.length > 0) {
            activeMessageId = messages[0].id;
        } else {
            myMessagesArea.innerHTML = `<div class="no-messages">No enquiries found for ${escapeHTML(productName)} yet. Use the product modal to send a message!</div>`;
            return;
        }

        const repliesResponse = await fetch(
            SUPABASE_URL + "/rest/v1/message_replies?select=*&user_id=eq." + encodeURIComponent(user.id) + "&order=created_at.asc",
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            }
        );

        const replies = await repliesResponse.json();
        renderMyMessages(messages, replies);
    } catch (error) {
        console.error("Error loading product messages:", error);
        myMessagesArea.innerHTML = `<div class="messages-error">${escapeHTML(error.message)}</div>`;
    }
}

function renderMyMessages(messages, replies) {
    myMessagesArea.innerHTML = "";

    messages.forEach(message => {
        const card = document.createElement("div");
        card.className = "customer-message-card";

        card.addEventListener("click", () => {
            activeMessageId = message.id;
            document.querySelectorAll(".customer-message-card").forEach(c => {
                c.style.borderColor = "#e5e7eb";
            });
            card.style.borderColor = "#0084ff";
        });

        const status = message.status || "New";
        const messageReplies = replies.filter(reply => reply.message_id === message.id);

        const repliesHTML = messageReplies.length > 0
            ? messageReplies.map(reply => {
                const isAdminReply = reply.admin_email;
                if (!isAdminReply) {
                    return `
                        <div class="my-message-label" style="margin-top:12px;">
                            Your reply
                        </div>
                        <div class="my-message-text">
                            ${escapeHTML(reply.reply)}
                        </div>
                    `;
                } else {
                    return `
                        <div style="margin-top:12px;">
                            <div class="admin-reply-label">
                                KAKA Team
                            </div>
                            <div class="admin-reply">
                                ${escapeHTML(reply.reply)}
                                <div class="reply-meta">
                                    ${escapeHTML(formatDate(reply.created_at))}
                                </div>
                            </div>
                        </div>
                    `;
                }
            }).join("")
            : `<div style="color:#888;font-size:13px;margin-top:10px;">No reply yet.</div>`;

        card.innerHTML = `
            <div class="customer-message-top">
                <div>
                    <div class="customer-message-product">
                        ${escapeHTML(message.product_name || "Product enquiry")}
                    </div>
                    ${message.selected_size ? `<div class="customer-message-size">Size: ${escapeHTML(message.selected_size)}</div>` : ""}
                </div>
                <div class="customer-message-status ${status.toLowerCase()}">
                    ${escapeHTML(status)}
                </div>
            </div>
            <div class="my-message-label">
                Your message
            </div>
            <div class="my-message-text">
                ${escapeHTML(message.message || "")}
            </div>
            ${repliesHTML}
            <div class="message-date">
                Sent: ${escapeHTML(formatDate(message.created_at))}
            </div>
        `;

        myMessagesArea.appendChild(card);
    });
}

// Send Reply Button Event Listener
document.getElementById("sendReplyButton").addEventListener("click", async () => {
    const replyInput = document.getElementById("replyInput");
    const replyText = replyInput.value.trim();
    const user = getLoggedInUser();
    const accessToken = localStorage.getItem("kaka_access_token");

    if (!replyText) {
        alert("Please write a reply first.");
        return;
    }

    if (!user || !accessToken) {
        alert("You must be logged in to reply.");
        window.location.href = "login.html";
        return;
    }

    if (!activeMessageId) {
        alert("Please select a message thread to reply to.");
        return;
    }

    try {
        const response = await fetch(SUPABASE_URL + "/rest/v1/message_replies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + accessToken,
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                message_id: activeMessageId,
                user_id: user.id,
                reply: replyText
            })
        });

        if (!response.ok) {
            throw new Error("Failed to send reply");
        }

        await fetch(SUPABASE_URL + "/rest/v1/messages?id=eq." + activeMessageId, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + accessToken,
                Prefer: "return=minimal"
            },
            body: JSON.stringify({ status: "New" })
        });

        replyInput.value = "";
        
        // Refresh product specific messages view if active
        loadMyMessages();
    } catch (error) {
        console.error("Error sending reply:", error);
        alert("Could not send reply. Please try again.");
    }
});

// Fallback general messages loader if global button is clicked
async function loadMyMessages() {
    const user = getLoggedInUser();
    if (!user) return;

    myMessagesArea.innerHTML = `<div class="no-messages">Loading your messages...</div>`;

    const accessToken = localStorage.getItem("kaka_access_token");
    if (!accessToken) return;

    try {
        const messagesResponse = await fetch(
            SUPABASE_URL + "/rest/v1/messages?select=*&user_id=eq." + encodeURIComponent(user.id) + "&order=created_at.desc",
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            }
        );

        const messages = await messagesResponse.json();
        if (messages.length > 0) activeMessageId = messages[0].id;

        if (messages.length === 0) {
            myMessagesArea.innerHTML = `<div class="no-messages">You haven't sent any messages yet.</div>`;
            return;
        }

        const repliesResponse = await fetch(
            SUPABASE_URL + "/rest/v1/message_replies?select=*&user_id=eq." + encodeURIComponent(user.id) + "&order=created_at.asc",
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            }
        );

        const replies = await repliesResponse.json();
        renderMyMessages(messages, replies);
    } catch (error) {
        console.error("General messages error:", error);
    }
}

function closeMyMessages() {
    messagesModal.classList.remove("active");
    document.body.style.overflow = "";
}

function closeProductModal() {
    productModal.classList.remove("active");
    document.body.style.overflow = "";
}


/* =========================
   HELPERS
========================= */

function formatPrice(price) {
    const number = Number(price);
    if (!Number.isFinite(number)) return "0";
    return number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(date) {
    if (!date) return "Unknown";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleString();
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}


/* =========================
   EVENTS
========================= */

searchInput.addEventListener("input", applyFilters);
brandFilter.addEventListener("change", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
genderFilter.addEventListener("change", applyFilters);
sizeFilter.addEventListener("change", applyFilters);
colourFilter.addEventListener("change", applyFilters);
minPrice.addEventListener("input", applyFilters);
maxPrice.addEventListener("input", applyFilters);

sortSelect.addEventListener("change", () => {
    sortProducts();
    renderProducts();
});

clearFilters.addEventListener("click", () => {
    searchInput.value = "";
    brandFilter.value = "";
    categoryFilter.value = "";
    genderFilter.value = "";
    sizeFilter.value = "";
    colourFilter.value = "";
    minPrice.value = "";
    maxPrice.value = "";
    sortSelect.value = "newest";
    applyFilters();
    closeFilterSidebar();
});


/* =========================
   MODAL EVENTS
========================= */

closeModal.addEventListener("click", closeProductModal);
prevImage.addEventListener("click", event => {
    event.stopPropagation();
    showPreviousImage();
});
nextImage.addEventListener("click", event => {
    event.stopPropagation();
    showNextImage();
});
productModal.addEventListener("click", event => {
    if (event.target === productModal) closeProductModal();
});

const myMsgBtn = document.getElementById("myMessagesButton");
if (myMsgBtn) {
    myMsgBtn.addEventListener("click", () => {
        messagesModal.classList.add("active");
        document.body.style.overflow = "hidden";
        loadMyMessages();
    });
}

document.getElementById("closeMessagesButton").addEventListener("click", closeMyMessages);
document.getElementById("refreshMessagesButton").addEventListener("click", loadMyMessages);
messagesModal.addEventListener("click", event => {
    if (event.target === messagesModal) closeMyMessages();
});


/* =========================
   KEYBOARD
========================= */

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (filtersSidebar.classList.contains("active")) {
            closeFilterSidebar();
            return;
        }
        if (productModal.classList.contains("active")) {
            closeProductModal();
            return;
        }
        if (messagesModal.classList.contains("active")) {
            closeMyMessages();
        }
    }

    if (productModal.classList.contains("active")) {
        if (event.key === "ArrowLeft") showPreviousImage();
        if (event.key === "ArrowRight") showNextImage();
    }
});
// Toggle Floating Messenger Popup
const chatBubbleBtn = document.getElementById("chatBubbleBtn");
const chatPopupBox = document.getElementById("chatPopupBox");
const closeChatPopup = document.getElementById("closeChatPopup");

if (chatBubbleBtn && chatPopupBox) {
    chatBubbleBtn.addEventListener("click", () => {
        chatPopupBox.classList.toggle("active");
        if (chatPopupBox.classList.contains("active")) {
            loadMyMessages(); // Or load quick chat threads
        }
    });

    closeChatPopup.addEventListener("click", () => {
        chatPopupBox.classList.remove("active");
    });
}
// Logout Button Event Listener
const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        const confirmed = confirm("Are you sure you want to log out?");
        if (!confirmed) return;

        // Clear local storage session tokens
        localStorage.removeItem("kaka_access_token");
        localStorage.removeItem("kaka_refresh_token");
        localStorage.removeItem("kaka_user");

        // Redirect to login page
        window.location.replace("login.html");
    });
}
const footerMessagesLink = document.getElementById("footerMessagesLink");
if (footerMessagesLink) {
    footerMessagesLink.addEventListener("click", (e) => {
        e.preventDefault();
        messagesModal.classList.add("active");
        document.body.style.overflow = "hidden";
        loadMyMessages();
    });
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
async function checkUnreadMessages() {
    const user = getLoggedInUser();
    const accessToken = localStorage.getItem("kaka_access_token");
    const badge = document.getElementById("messageBadge");

    if (!user || !accessToken || !badge) return;

    try {
        const response = await fetch(
            SUPABASE_URL + "/rest/v1/messages?select=id,status&user_id=eq." + encodeURIComponent(user.id),
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            }
        );

        if (!response.ok) return;
        const messages = await response.json();
        
        // Count messages that have status "Replied" or "New" or need attention
        const unreadCount = messages.filter(m => m.status === "Replied" || m.status === "New").length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.add("active");
        } else {
            badge.classList.remove("active");
        }
    } catch (error) {
        console.error("Error checking unread messages:", error);
    }
}

// Run this check when the page loads
window.addEventListener("DOMContentLoaded", () => {
    checkUnreadMessages();
});
/* =========================
   START
========================= */

loadProducts();