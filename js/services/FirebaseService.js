/**
 * POM: FirebaseService
 * Centralized Firebase operations service.
 * Wraps Firestore + Storage operations used across pages.
 *
 * This service is initialized after Firebase SDK loads and
 * window.$db / window.$storage / window.$fb are populated.
 */

const FirebaseService = {

  // ── Products ──────────────────────────────────────────
  async getProducts() {
    const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'products'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async saveProduct(data, id = null) {
    if (id) {
      await window.$fb.updateDoc(window.$fb.doc(window.$db, 'products', id), { ...data, updatedAt: window.$fb.serverTimestamp() });
      return id;
    } else {
      const ref = await window.$fb.addDoc(window.$fb.collection(window.$db, 'products'), { ...data, createdAt: window.$fb.serverTimestamp(), sold: 0 });
      return ref.id;
    }
  },

  async deleteProduct(id) {
    await window.$fb.deleteDoc(window.$fb.doc(window.$db, 'products', id));
  },

  // ── Orders ────────────────────────────────────────────
  async getOrders() {
    const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'orders'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateOrderStatus(id, status) {
    await window.$fb.updateDoc(window.$fb.doc(window.$db, 'orders', id), { orderStatus: status, updatedAt: window.$fb.serverTimestamp() });
  },

  watchOrders(callback) {
    return window.$fb.onSnapshot(window.$fb.collection(window.$db, 'orders'), snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  // ── Offers ────────────────────────────────────────────
  async getOffers() {
    const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'offers'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getActiveOffers() {
    const all = await this.getOffers();
    return all.filter(o => o.isActive);
  },

  // ── Branding / Settings ───────────────────────────────
  async getBranding() {
    const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'settings'));
    return snap.docs.find(d => d.id === 'branding')?.data() || {};
  },

  async saveBranding(data) {
    try {
      await window.$fb.updateDoc(window.$fb.doc(window.$db, 'settings', 'branding'), data);
    } catch {
      await window.$fb.addDoc(window.$fb.collection(window.$db, 'settings'), data);
    }
  },

  // ── Storage ───────────────────────────────────────────
  /**
   * Upload a File to Firebase Storage and return its download URL.
   * @param {File}   file     - File object from <input type="file">
   * @param {string} path     - Storage path e.g. 'products/img_001.jpg'
   * @param {function} onProgress - Optional (pct: number) => void
   * @returns {Promise<string>} download URL
   */
  uploadFile(file, path, onProgress) {
    return new Promise((resolve, reject) => {
      const ref  = window.$fb.storageRef(window.$storage, path);
      const task = window.$fb.uploadBytesResumable(ref, file);
      task.on(
        'state_changed',
        snap => { if (onProgress) onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)); },
        reject,
        async () => resolve(await window.$fb.getDownloadURL(task.snapshot.ref))
      );
    });
  },

  // ── Users ─────────────────────────────────────────────
  async getCustomers() {
    const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async saveOrder(orderData) {
    return await window.$fb.addDoc(window.$fb.collection(window.$db, 'orders'), { ...orderData, createdAt: window.$fb.serverTimestamp() });
  }
};
