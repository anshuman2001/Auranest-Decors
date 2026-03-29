/**
 * POM: OffersPage
 * Manages the Offers & Promotions admin page.
 * Handles CRUD for offers stored in Firestore 'offers' collection.
 * Active offers are read by the store and shown as a notification bar.
 *
 * Firestore schema — offers/{id}:
 *   title:           string   (displayed in store banner)
 *   discountCode:    string   (promo code customers can copy)
 *   discountPercent: number
 *   description:     string
 *   startDate:       string   (YYYY-MM-DD)
 *   endDate:         string   (YYYY-MM-DD)
 *   isActive:        boolean  (controls store visibility)
 *   createdAt:       Timestamp
 *   updatedAt:       Timestamp
 */

const OffersPage = {
  _editId: null,

  /** Load all offers from Firestore and render them */
  async load() {
    if (!window.$db) return;
    try {
      const snap = await window.$fb.getDocs(
        window.$fb.collection(window.$db, 'offers')
      );
      window.$offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const el = document.getElementById('sbOfferCount');
      if (el) el.textContent = window.$offers.length;
      this.render(window.$offers);
    } catch (e) {
      const el = document.getElementById('offersGrid');
      if (el) el.innerHTML = '<div style="grid-column:1/-1;color:var(--red);padding:1rem">Failed to load offers: ' + e.message + '</div>';
    }
  },

  /** Render offer cards in the grid */
  render(list) {
    const el = document.getElementById('offersGrid');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">No offers yet. Create your first promotion to display on the store!</div>';
      return;
    }
    el.innerHTML = list.map(o => `
      <div style="background:var(--card);border:1px solid var(--border);padding:1.5rem;position:relative;">
        <div style="position:absolute;top:.8rem;right:.8rem;display:flex;gap:.4rem">
          <button class="ebtn" onclick="OffersPage.edit('${o.id}')">Edit</button>
          <button class="dbtn" onclick="OffersPage.delete('${o.id}')">Delete</button>
        </div>
        <div style="font-size:1.4rem;margin-bottom:.5rem">🏷️</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;margin-bottom:.3rem">${o.title || 'Untitled Offer'}</div>
        ${o.discountCode
          ? `<div style="background:var(--gold-dim);border:1px solid var(--border);color:var(--gold);padding:.2rem .6rem;font-size:.68rem;letter-spacing:.1em;display:inline-block;margin-bottom:.5rem">
               ${o.discountCode} — ${o.discountPercent || 0}% OFF
             </div>`
          : ''}
        <div style="font-size:.76rem;color:var(--muted);margin-bottom:.8rem">${o.description || ''}</div>
        <div style="display:flex;align-items:center;gap:.5rem">
          <span class="badge ${o.isActive ? 'b-active' : 'b-cancelled'}">${o.isActive ? 'Active' : 'Inactive'}</span>
          ${o.endDate ? `<span style="font-size:.68rem;color:var(--muted)">Until ${o.endDate}</span>` : ''}
        </div>
      </div>`).join('');
  },

  /** Open the add/edit modal */
  openModal(id) {
    this._editId = id || null;
    const titleEl = document.getElementById('offerModalTitle');
    if (titleEl) titleEl.textContent = id ? 'Edit Offer' : 'New Offer';

    if (!id) {
      ['ofTitle', 'ofCode', 'ofDesc'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.value = '';
      });
      const discount = document.getElementById('ofDiscount');
      if (discount) discount.value = '';
      const active = document.getElementById('ofActive');
      if (active) active.checked = true;
      const today = new Date().toISOString().split('T')[0];
      const start = document.getElementById('ofStart');
      if (start) start.value = today;
      const end = document.getElementById('ofEnd');
      if (end) end.value = '';
    } else {
      const o = window.$offers?.find(x => x.id === id);
      if (!o) return;
      document.getElementById('ofTitle').value    = o.title || '';
      document.getElementById('ofCode').value     = o.discountCode || '';
      document.getElementById('ofDiscount').value = o.discountPercent || '';
      document.getElementById('ofDesc').value     = o.description || '';
      document.getElementById('ofStart').value    = o.startDate || '';
      document.getElementById('ofEnd').value      = o.endDate || '';
      document.getElementById('ofActive').checked = !!o.isActive;
    }
    document.getElementById('offerModal')?.classList.add('on');
  },

  closeModal() {
    document.getElementById('offerModal')?.classList.remove('on');
    this._editId = null;
  },

  /** Save (create or update) an offer */
  async save() {
    const title = document.getElementById('ofTitle')?.value.trim();
    if (!title) { if (typeof showToast === 'function') showToast('⚠️ Offer title is required'); return; }

    const data = {
      title,
      discountCode:    document.getElementById('ofCode')?.value.trim().toUpperCase() || '',
      discountPercent: parseInt(document.getElementById('ofDiscount')?.value) || 0,
      description:     document.getElementById('ofDesc')?.value.trim() || '',
      startDate:       document.getElementById('ofStart')?.value || '',
      endDate:         document.getElementById('ofEnd')?.value || '',
      isActive:        document.getElementById('ofActive')?.checked || false,
      updatedAt:       window.$fb.serverTimestamp(),
    };

    try {
      if (this._editId) {
        await window.$fb.updateDoc(window.$fb.doc(window.$db, 'offers', this._editId), data);
        if (typeof showToast === 'function') showToast('✅ Offer updated!');
      } else {
        data.createdAt = window.$fb.serverTimestamp();
        await window.$fb.addDoc(window.$fb.collection(window.$db, 'offers'), data);
        if (typeof showToast === 'function') showToast('✅ Offer created! It will appear on the store if Active.');
      }
      this.closeModal();
      this.load();
    } catch (e) {
      if (typeof showToast === 'function') showToast('❌ ' + e.message);
    }
  },

  edit(id)   { this.openModal(id); },

  async delete(id) {
    if (!confirm('Delete this offer permanently?')) return;
    try {
      await window.$fb.deleteDoc(window.$fb.doc(window.$db, 'offers', id));
      if (typeof showToast === 'function') showToast('🗑️ Offer deleted');
      this.load();
    } catch (e) {
      if (typeof showToast === 'function') showToast('❌ ' + e.message);
    }
  }
};
