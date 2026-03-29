/**
 * POM: CartService
 * Manages the shopping cart using localStorage.
 * Used by the store page to persist cart across sessions.
 *
 * Cart item schema:
 *   { id, name, price, icon, image, qty }
 */

const CartService = {
  _KEY: 'auranest_cart',

  /** Get all cart items */
  get() {
    return JSON.parse(localStorage.getItem(this._KEY) || '[]');
  },

  /** Persist cart to localStorage */
  save(cart) {
    localStorage.setItem(this._KEY, JSON.stringify(cart));
  },

  /** Add a product to cart (increments qty if already exists) */
  add(product) {
    const cart = this.get();
    const existing = cart.find(x => x.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        id:    product.id,
        name:  product.name,
        price: product.price,
        icon:  product.icon,
        image: product.image || '',
        qty:   1,
      });
    }
    this.save(cart);
  },

  /** Remove a product from cart by id */
  remove(id) {
    this.save(this.get().filter(x => x.id !== id));
  },

  /** Change qty by delta (removes item if qty drops below 1) */
  changeQty(id, delta) {
    const cart = this.get();
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) {
      this.remove(id);
    } else {
      this.save(cart);
    }
  },

  /** Clear the entire cart */
  clear() {
    localStorage.removeItem(this._KEY);
  },

  /** Total price of all items */
  total() {
    return this.get().reduce((sum, x) => sum + x.price * x.qty, 0);
  },

  /** Total quantity of all items */
  count() {
    return this.get().reduce((sum, x) => sum + x.qty, 0);
  },

  /** Shipping cost (free above ₹999) */
  shipping() {
    return this.total() >= 999 ? 0 : 99;
  },

  /** Grand total including shipping */
  grandTotal() {
    return this.total() + this.shipping();
  }
};
