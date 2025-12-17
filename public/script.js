const products = [
  { id: 1, name: 'Café en grain', description: 'Blend maison torréfié', price: 12.5 },
  { id: 2, name: 'Thé matcha', description: 'Qualité cérémoniale', price: 18.9 },
  { id: 3, name: 'Chocolat noir 70%', description: 'Origine Pérou', price: 7.8 },
  { id: 4, name: 'Cookie artisanal', description: 'Chocolat & noisette', price: 3.5 },
];

const productList = document.getElementById('product-list');
const cartItems = document.getElementById('cart-items');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout');
const userInfo = document.getElementById('user-info');

let cart = [];
let telegramUser = null;

function hydrateTelegramUser() {
  if (window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    telegramUser = webApp.initDataUnsafe?.user || null;
    webApp.ready();
  }

  const displayName = telegramUser
    ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || telegramUser.username
    : 'Invite';
  userInfo.textContent = displayName || 'Invite';
}

function renderProducts() {
  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div class="price">${product.price.toFixed(2)}€</div>
      <button data-id="${product.id}">Ajouter</button>
    `;

    card.querySelector('button').addEventListener('click', () => addToCart(product.id));
    productList.appendChild(card);
  });
}

function addToCart(productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (item) {
    item.quantity += 1;
  } else {
    const product = products.find((p) => p.id === productId);
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
}

function changeQuantity(id, delta) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = '';

  if (cart.length === 0) {
    cartItems.textContent = "Aucun article pour l'instant.";
    checkoutBtn.disabled = true;
    totalEl.textContent = '0€';
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div class="muted">${item.price.toFixed(2)}€</div>
      </div>
      <div class="cart-actions">
        <button aria-label="Retirer" data-action="dec">-</button>
        <span>${item.quantity}</span>
        <button aria-label="Ajouter" data-action="inc">+</button>
      </div>
    `;

    const [decBtn, , incBtn] = row.querySelectorAll('button, span');
    decBtn.addEventListener('click', () => changeQuantity(item.id, -1));
    incBtn.addEventListener('click', () => changeQuantity(item.id, 1));

    cartItems.appendChild(row);
  });

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  totalEl.textContent = `${total.toFixed(2)}€`;
  checkoutBtn.disabled = false;
}

async function checkout() {
  if (cart.length === 0) return;

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Envoi...';

  const payload = {
    user: telegramUser,
    items: cart,
    total: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
  };

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur inconnue');

    const status = data.status === 'sent' ? 'Commande envoyée ✨' : 'Commande simulée (token manquant)';
    notify(status);
    cart = [];
    renderCart();
  } catch (error) {
    notify(`Échec: ${error.message}`);
  } finally {
    checkoutBtn.disabled = cart.length === 0;
    checkoutBtn.textContent = 'Envoyer la commande';
  }
}

function notify(message) {
  if (window.Telegram?.WebApp?.showAlert) {
    window.Telegram.WebApp.showAlert(message);
  } else {
    alert(message);
  }
}

hydrateTelegramUser();
renderProducts();
renderCart();
checkoutBtn.addEventListener('click', checkout);
