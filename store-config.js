window.STORE_NAME = "MonoPoly"; // Replace with your desired store name

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-store-name]").forEach(element => {
        element.textContent = window.STORE_NAME;
    });

    document.title = document.title.replace("Store Name", window.STORE_NAME);
});
