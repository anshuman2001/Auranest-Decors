/**
 * POM: CategoryPage
 * Manages the full-screen category overlay page in the store.
 * Handles category → subcategory → filtered products navigation flow.
 *
 * Usage:
 *   CategoryPage.open('Home & Kitchen')   // opens overlay for a category
 *   CategoryPage.close()                  // closes overlay
 *   CategoryPage.select(catKey, subcat)   // navigate to filtered products
 */

const CategoryPage = {

  /** Category definitions with subcategories */
  _data: {
    'Home & Kitchen': {
      emoji: '🍽️',
      displayName: 'Home & Kitchen',
      desc: 'Discover our handcrafted kitchenware and artisan dining essentials, made by skilled Indian artisans.',
      subcats: [
        { key: 'Serveware',     emoji: '🍱', desc: 'Trays, platters & serving pieces' },
        { key: 'Kitchen Tools', emoji: '🔪', desc: 'Spatulas, spice boxes & utensils' },
        { key: 'Tableware',     emoji: '☕', desc: 'Mugs, coasters & table décor' },
      ]
    },
    'Aura décor': {
      emoji: '🏺',
      displayName: 'Aura Décor',
      desc: "Handcrafted decorative pieces that celebrate India's rich folk art traditions — for every corner of your home.",
      subcats: [
        { key: 'Decorative Pots', emoji: '🌿', desc: 'Planters & ceramic pots' },
        { key: 'Wall Décor',      emoji: '🖼️', desc: 'Wall hangings & art platters' },
        { key: 'Vases',           emoji: '💐', desc: 'Vases & floral arrangements' },
      ]
    },
    'Aesthetic Furniture': {
      emoji: '🪑',
      displayName: 'Aesthetic Furniture',
      desc: 'Artisan-crafted furniture pieces that blend traditional craft with contemporary design sensibilities.',
      subcats: [
        { key: 'Storage', emoji: '📦', desc: 'Boxes, crates & storage units' },
        { key: 'Racks',   emoji: '🗂️', desc: 'Display & organization racks' },
        { key: 'Shelves', emoji: '📚', desc: 'Wall shelves & display units' },
      ]
    },
    'Giftings': {
      emoji: '🎁',
      displayName: 'Giftings',
      desc: 'Curated artisan gift sets perfect for every occasion — weddings, festivals, and celebrations.',
      subcats: [
        { key: 'Festive', emoji: '🎊', desc: 'Diwali, Holi & festival gifts' },
        { key: 'Wedding', emoji: '💍', desc: 'Wedding & celebration gifts' },
        { key: 'Artisan', emoji: '🎨', desc: 'Premium artisan collections' },
      ]
    }
  },

  /**
   * Open the category overlay for a given category key.
   * @param {string} catKey - e.g. 'Home & Kitchen'
   */
  open(catKey) {
    const cat = this._data[catKey];
    if (!cat) return;
    const all = window.$products || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);

    document.getElementById('catCrumb').textContent     = cat.displayName;
    document.getElementById('catHeroIcon').textContent  = cat.emoji;
    document.getElementById('catHeroTitle').textContent = cat.displayName;
    document.getElementById('catHeroDesc').textContent  = cat.desc;
    document.getElementById('scatTitle').textContent    = `Shop ${cat.displayName}`;

    const catProducts = all.filter(p => p.category === catKey);

    document.getElementById('scatGrid').innerHTML =
      cat.subcats.map(s => {
        const cnt = all.filter(p => p.subCategory === s.key).length;
        return `<div class="scat-card" onclick="CategoryPage.select('${catKey}','${s.key}')">
          <div class="scat-emoji">${s.emoji}</div>
          <div class="scat-name">${s.key}</div>
          <div class="scat-count">${cnt} product${cnt !== 1 ? 's' : ''}</div>
          <div class="scat-desc">${s.desc}</div>
        </div>`;
      }).join('') +
      `<div class="scat-card scat-card-all" onclick="CategoryPage.select('${catKey}','__all__')">
        <div class="scat-emoji">✨</div>
        <div class="scat-name">View All</div>
        <div class="scat-count">${catProducts.length} products</div>
        <div class="scat-desc">Browse the full ${cat.displayName} collection</div>
      </div>`;

    const overlay = document.getElementById('catOverlay');
    overlay.classList.add('open');
    overlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  },

  /** Close the category overlay */
  close() {
    document.getElementById('catOverlay').classList.remove('open');
    document.body.style.overflow = '';
  },

  /**
   * Navigate from category overlay → filtered product grid.
   * @param {string} catKey  - category key
   * @param {string} subcat  - subcategory key, or '__all__' for all in category
   */
  select(catKey, subcat) {
    this.close();
    setTimeout(() => {
      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        if (subcat === '__all__') {
          const btn = document.querySelector(`.fbtn[data-key="${catKey}"]`);
          if (typeof filterProds === 'function') filterProds(catKey, btn);
        } else {
          const btn = document.querySelector(`.fbtn[data-key="${subcat}"]`);
          if (typeof filterProds === 'function') filterProds(subcat, btn);
        }
      }, 100);
    }, 350);
  }
};
