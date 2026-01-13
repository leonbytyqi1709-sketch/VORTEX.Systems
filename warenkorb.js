// ============================================================================
// VORTEX SYSTEMS - ZENTRALES WARENKORB-SYSTEM
// ============================================================================

class VortexCart {
  constructor() {
    this.storageKey = 'vortex_warenkorb';
    this.cart = this.loadCart();
    this.init();
  }

  // ========== INITIALIZATION ==========
  init() {
    this.setupEventListeners();
    this.renderCartUI();
  }

  // ========== LOKALER SPEICHER ==========
  loadCart() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading cart:', e);
      return [];
    }
  }

  saveCart() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    this.updateUI();
  }

  // ========== WARENKORB-OPERATIONEN ==========
  addToCart(productData) {
    const { id, name, price, emoji } = productData;

    if (!id || !name || !price) {
      console.error('Invalid product data');
      return;
    }

    const existingItem = this.cart.find(item => item.id === id);

    if (existingItem) {
      if (existingItem.quantity < 5) {
        existingItem.quantity += 1;
      } else {
        this.showToast('Maximum 5 Stück pro Artikel', 'warning');
        return;
      }
    } else {
      this.cart.push({
        id,
        name,
        price: parseFloat(price),
        quantity: 1,
        emoji: emoji || '📦'
      });
    }

    this.saveCart();
    this.showToast(`✅ "${name}" hinzugefügt`, 'success');
  }

  removeFromCart(productId) {
    const item = this.cart.find(i => i.id === productId);
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.showToast(`✅ "${item.name}" entfernt`, 'info');
  }

  updateQuantity(productId, newQuantity) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    newQuantity = Math.max(1, Math.min(5, parseInt(newQuantity)));
    item.quantity = newQuantity;
    this.saveCart();
  }

  emptyCart() {
    if (this.cart.length === 0) return;
    this.cart = [];
    this.saveCart();
    this.showToast('✅ Warenkorb geleert', 'info');
    this.renderCartModal();
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ========== UI UPDATES ==========
  updateUI() {
    this.updateCartBadge();
    this.renderCartModal();
  }

  updateCartBadge() {
    const badge = document.querySelector('.cart-count-badge');
    const count = this.getCartCount();
    
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // ========== MODALS ==========
  renderCartModal() {
    const modal = document.querySelector('.cart-modal-content');
    if (!modal) return;

    let html = '<div class="cart-modal-header"><h2>🛒 Warenkorb</h2><button class="close-modal">✕</button></div>';

    if (this.cart.length === 0) {
      html += '<div class="empty-cart"><p>Warenkorb ist leer</p></div>';
    } else {
      html += '<div class="cart-items-list">';
      this.cart.forEach(item => {
        html += `
          <div class="cart-item" data-id="${item.id}">
            <div class="item-info">
              <span class="item-emoji">${item.emoji}</span>
              <div>
                <p class="item-name">${item.name}</p>
                <p class="item-price">${item.price.toFixed(2)} €</p>
              </div>
            </div>
            <div class="item-quantity">
              <button class="qty-btn qty-minus">−</button>
              <input type="number" class="qty-input" value="${item.quantity}" min="1" max="5" readonly>
              <button class="qty-btn qty-plus">+</button>
            </div>
            <div class="item-subtotal">${(item.price * item.quantity).toFixed(2)} €</div>
            <button class="remove-btn" data-id="${item.id}">🗑️</button>
          </div>
        `;
      });
      html += '</div>';

      html += `
        <div class="cart-summary">
          <div class="summary-row"><span>Zwischensumme:</span><span>${this.getCartTotal().toFixed(2)} €</span></div>
          <div class="summary-row"><span>Versand:</span><span>5,00 €</span></div>
          <div class="summary-row total"><span>Gesamt:</span><span>${(this.getCartTotal() + 5).toFixed(2)} €</span></div>
        </div>

        <div class="cart-buttons">
          <button class="btn-secondary empty-cart-btn">Leeren</button>
          <button class="btn-primary checkout-btn">Kasse</button>
        </div>
      `;
    }

    modal.innerHTML = html;
    this.attachCartModalListeners();
  }

  renderCheckoutModal() {
    const modal = document.querySelector('.checkout-modal-content');
    if (!modal) return;

    const total = this.getCartTotal() + 5;

    const html = `
      <div class="checkout-header">
        <h2>💳 Bestellung abschließen</h2>
        <button class="close-modal">✕</button>
      </div>

      <form class="checkout-form" id="checkoutForm">
        <div class="form-group">
          <label>Name *</label>
          <input type="text" name="name" required placeholder="Dein vollständiger Name">
        </div>

        <div class="form-group">
          <label>Email *</label>
          <input type="email" name="email" required placeholder="deine@email.com">
        </div>

        <div class="form-group">
          <label>Adresse *</label>
          <input type="text" name="address" required placeholder="Straße, Hausnummer">
        </div>

        <div class="form-group">
          <label>Stadt & PLZ *</label>
          <input type="text" name="city" required placeholder="Stadt, PLZ">
        </div>

        <div class="form-group">
          <label>Zahlungsart *</label>
          <div class="payment-options">
            <label class="payment-radio">
              <input type="radio" name="payment" value="card" required>
              <span>💳 Kreditkarte</span>
            </label>
            <label class="payment-radio">
              <input type="radio" name="payment" value="paypal">
              <span>🅿️ PayPal</span>
            </label>
            <label class="payment-radio">
              <input type="radio" name="payment" value="transfer">
              <span>🏦 Banküberweisung</span>
            </label>
          </div>
        </div>

        <div class="checkout-summary">
          <div class="summary-row"><span>Gesamtbetrag:</span><span class="amount">${total.toFixed(2)} €</span></div>
        </div>

        <button type="submit" class="btn-primary btn-checkout-submit">Bestellung absenden (${total.toFixed(2)} €)</button>
        <button type="button" class="btn-secondary btn-checkout-cancel">Abbrechen</button>
      </form>
    `;

    modal.innerHTML = html;
    this.attachCheckoutListeners();
  }

  // ========== EVENT LISTENERS ==========
  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.attachProductCardListeners();
      this.attachCartIconListener();
      this.attachModalOverlayListener();
      this.updateCartBadge();
    });

    // Fallback if DOM is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachProductCardListeners());
    } else {
      this.attachProductCardListeners();
      this.attachCartIconListener();
    }
  }

  attachProductCardListeners() {
    // Add to Cart Button
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.product-card');
        if (!card) return;

        const productData = {
          id: card.dataset.id,
          name: card.dataset.name,
          price: card.dataset.price,
          emoji: card.dataset.emoji
        };

        this.addToCart(productData);
      });
    });

    // Quantity Selector
    document.querySelectorAll('.quantity-selector').forEach(selector => {
      const minusBtn = selector.querySelector('.quantity-btn.minus');
      const plusBtn = selector.querySelector('.quantity-btn.plus');
      const input = selector.querySelector('.quantity-input');

      minusBtn?.addEventListener('click', () => {
        let val = parseInt(input.value);
        input.value = Math.max(1, val - 1);
      });

      plusBtn?.addEventListener('click', () => {
        let val = parseInt(input.value);
        input.value = Math.min(5, val + 1);
      });
    });
  }

  attachCartIconListener() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
      cartIcon.addEventListener('click', () => this.openCartModal());
    }
  }

  attachModalOverlayListener() {
    const overlay = document.querySelector('.cart-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCartModal();
      });
    }

    const checkoutOverlay = document.querySelector('.checkout-modal-overlay');
    if (checkoutOverlay) {
      checkoutOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutOverlay) this.closeCheckoutModal();
      });
    }
  }

  attachCartModalListeners() {
    // Close Button
    document.querySelector('.close-modal')?.addEventListener('click', () => this.closeCartModal());

    // Quantity Controls
    document.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.cart-item');
        const id = item.dataset.id;
        const input = item.querySelector('.qty-input');
        let val = parseInt(input.value);
        this.updateQuantity(id, Math.max(1, val - 1));
      });
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.cart-item');
        const id = item.dataset.id;
        const input = item.querySelector('.qty-input');
        let val = parseInt(input.value);
        this.updateQuantity(id, Math.min(5, val + 1));
      });
    });

    // Remove Button
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeFromCart(btn.dataset.id);
      });
    });

    // Empty Cart Button
    document.querySelector('.empty-cart-btn')?.addEventListener('click', () => this.emptyCart());

    // Checkout Button
    document.querySelector('.checkout-btn')?.addEventListener('click', () => this.openCheckoutModal());
  }

  attachCheckoutListeners() {
    // Close Button
    document.querySelector('.checkout-modal-content .close-modal')?.addEventListener('click', () => {
      this.closeCheckoutModal();
    });

    // Cancel Button
    document.querySelector('.btn-checkout-cancel')?.addEventListener('click', () => {
      this.closeCheckoutModal();
    });

    // Form Submit
    document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processCheckout();
    });
  }

  // ========== CHECKOUT ==========
  processCheckout() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validierung
    if (!data.name || !data.email || !data.address || !data.city || !data.payment) {
      this.showToast('❌ Bitte alle Felder ausfüllen', 'error');
      return;
    }

    // Bestellung verarbeiten
    console.log('Bestellung:', data);
    const total = (this.getCartTotal() + 5).toFixed(2);

    this.showToast(`✅ Bestellung erfolgreich! (${total} €)`, 'success');
    
    // Warenkorb leeren
    this.cart = [];
    this.saveCart();

    // Modals schließen
    setTimeout(() => {
      this.closeCheckoutModal();
      this.closeCartModal();
      this.renderCartModal();
    }, 500);
  }

  // ========== MODAL CONTROL ==========
  openCartModal() {
    const overlay = document.querySelector('.cart-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      this.renderCartModal();
    }
  }

  closeCartModal() {
    const overlay = document.querySelector('.cart-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  openCheckoutModal() {
    this.closeCartModal();
    const overlay = document.querySelector('.checkout-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      this.renderCheckoutModal();
    }
  }

  closeCheckoutModal() {
    const overlay = document.querySelector('.checkout-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  // ========== TOAST NOTIFICATIONS ==========
  showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    // Animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// ============================================================================
// INITIALISIERUNG
// ============================================================================
const vortexCart = new VortexCart();