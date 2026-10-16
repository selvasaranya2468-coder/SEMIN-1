const API_URL = "https://dummyjson.com/products?limit=30";
const dashboard = document.getElementById("dashboard");
const summary = document.getElementById("summary");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

let allProducts = [];
class ProductError extends Error {
  constructor(message, type) {
    super(message);       
    this.name = "ProductError";
    this.type = type;      
  }
}

async function fetchProducts() {
  let response;

  try {
    response = await fetch(API_URL);
  } catch (error) {
    throw new ProductError(
      "Unable to connect to the server. Please check your internet connection.",
      "network"
    );
  }

  if (!response.ok) {
    throw new ProductError(
      "The server returned an error (status " + response.status + ").",
      "http"
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {

    throw new ProductError("The server sent data that is not valid JSON.", "data");
  }

  return validateProducts(data);
}


function isValidProduct(product) {
  return (
    product !== null &&
    typeof product === "object" &&
    typeof product.title === "string" && product.title.trim() !== "" &&
    typeof product.price === "number" && !isNaN(product.price) &&
    typeof product.category === "string" && product.category.trim() !== "" &&
    typeof product.thumbnail === "string" && product.thumbnail.trim() !== ""
  );
}


function validateProducts(data) {

  if (data === null || typeof data !== "object" || !Array.isArray(data.products)) {
    throw new ProductError(
      "The API response is not in the expected format (products list missing).",
      "data"
    );
  }
  const validProducts = data.products.filter(isValidProduct);

  if (validProducts.length === 0) {
    throw new ProductError(
      "No valid products were found in the API response.",
      "data"
    );
  }

  return validProducts;
}

function showLoading() {
  dashboard.innerHTML =
    '<div class="status" role="status">' +
    '<div class="spinner"></div>' +
    '<p>Loading products...</p>' +
    '</div>';
  summary.textContent = "Loading products...";
  searchInput.disabled = true;
  categorySelect.disabled = true;
}

function showError(error) {

  let heading = "Unexpected error";
  if (error.type === "network") heading = "Network error";
  if (error.type === "http") heading = "HTTP error";
  if (error.type === "data") heading = "Invalid data error";

  const message =
    error instanceof ProductError ? error.message : "Something went wrong. Please try again.";

  dashboard.innerHTML = "";

  const box = document.createElement("div");
  box.className = "error-box";
  box.setAttribute("role", "alert");

  const title = document.createElement("h2");
  title.textContent = "Could not load products - " + heading;

  const text = document.createElement("p");
  text.textContent = message;

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Try Again";
  retryButton.addEventListener("click", loadProducts); 

  box.appendChild(title);
  box.appendChild(text);
  box.appendChild(retryButton);
  dashboard.appendChild(box);

  summary.textContent = "No products to show";
}


function createCard(product) {
  const card = document.createElement("article");
  card.className = "card";


  const imageBox = document.createElement("div");
  imageBox.className = "card-image";

  const image = document.createElement("img");
  image.src = product.thumbnail;
  image.alt = product.title;

  image.addEventListener("error", function () {
    imageBox.innerHTML = "";
    imageBox.textContent = "Image unavailable";
  });

  imageBox.appendChild(image);

 
  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = product.title;

  const category = document.createElement("span");
  category.className = "card-category";
  category.textContent = product.category;

  const price = document.createElement("div");
  price.className = "card-price";
  price.textContent = "₹" + product.price.toFixed(2);

  body.appendChild(title);
  body.appendChild(category);
  body.appendChild(price);

  card.appendChild(imageBox);
  card.appendChild(body);
  return card;
}

function renderProducts() {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;

  const visibleProducts = allProducts.filter(function (product) {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchText);
    return matchesCategory && matchesSearch;
  });

  dashboard.innerHTML = "";
  summary.textContent =
    "Showing " + visibleProducts.length + " of " + allProducts.length + " products";

  if (visibleProducts.length === 0) {
    dashboard.innerHTML =
      '<div class="status"><p>No products found. Try a different name or category.</p></div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid";
  visibleProducts.forEach(function (product) {
    grid.appendChild(createCard(product));
  });
  dashboard.appendChild(grid);
}

function fillCategoryDropdown() {
  categorySelect.innerHTML = '<option value="all">All categories</option>';

  const categories = [...new Set(allProducts.map(function (p) { return p.category; }))];
  categories.sort();

  categories.forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    categorySelect.appendChild(option);
  });
}


async function loadProducts() {
  showLoading();

  try {
  
    allProducts = await fetchProducts();

    fillCategoryDropdown();
    searchInput.value = "";
    searchInput.disabled = false;    
    categorySelect.disabled = false;
    renderProducts();
  } catch (error) {
    console.error(error);             
    showError(error);
  }
}

searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);

loadProducts();