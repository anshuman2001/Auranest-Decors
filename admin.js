
// ══════════════════════════════════════════════════
// POM: OffersPage — manage store offers/promotions
// ══════════════════════════════════════════════════
const OffersPage = {
  _editId: null,

  async load() {
    if (!window.$db) return;
    try {
      const snap = await window.$fb.getDocs(window.$fb.collection(window.$db, 'offers'));
      window.$offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      document.getElementById('sbOfferCount').textContent = window.$offers.length;
      this.render(window.$offers);
    } catch(e) { document.getElementById('offersGrid').innerHTML = '<div style="grid-column:1/-1;color:var(--red);padding:1rem">Failed to load offers</div>'; }
  },

  render(list) {
    const el = document.getElementById('offersGrid');
    if (!list.length) {
      el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">No offers yet. Create your first promotion!</div>';
      return;
    }
    el.innerHTML = list.map(o => `
      <div style="background:var(--card);border:1px solid var(--border);padding:1.5rem;position:relative">
        <div style="position:absolute;top:.8rem;right:.8rem;display:flex;gap:.4rem">
          <button class="ebtn" onclick="OffersPage.edit('${o.id}')">Edit</button>
          <button class="dbtn" onclick="OffersPage.delete('${o.id}')">Delete</button>
        </div>
        <div style="font-size:1.4rem;margin-bottom:.5rem">🏷️</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;margin-bottom:.3rem">${o.title||'Untitled Offer'}</div>
        ${o.discountCode ? `<div style="background:var(--gold-dim);border:1px solid var(--border);color:var(--gold);padding:.2rem .6rem;font-size:.68rem;letter-spacing:.1em;display:inline-block;margin-bottom:.5rem">${o.discountCode} — ${o.discountPercent||0}% OFF</div>` : ''}
        <div style="font-size:.76rem;color:var(--muted);margin-bottom:.8rem">${o.description||''}</div>
        <div style="display:flex;align-items:center;gap:.5rem">
          <span class="badge ${o.isActive?'b-active':'b-cancelled'}">${o.isActive?'Active':'Inactive'}</span>
          ${o.endDate ? `<span style="font-size:.68rem;color:var(--muted)">Until ${o.endDate}</span>` : ''}
        </div>
      </div>`).join('');
  },

  openModal(id) {
    this._editId = id || null;
    document.getElementById('offerModalTitle').textContent = id ? 'Edit Offer' : 'New Offer';
    if (!id) {
      ['ofTitle','ofCode','ofDesc'].forEach(i => document.getElementById(i).value = '');
      document.getElementById('ofDiscount').value = '';
      document.getElementById('ofActive').checked = true;
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('ofStart').value = today;
      document.getElementById('ofEnd').value   = '';
    } else {
      const o = window.$offers?.find(x => x.id === id);
      if (!o) return;
      document.getElementById('ofTitle').value    = o.title||'';
      document.getElementById('ofCode').value     = o.discountCode||'';
      document.getElementById('ofDiscount').value = o.discountPercent||'';
      document.getElementById('ofDesc').value     = o.description||'';
      document.getElementById('ofStart').value    = o.startDate||'';
      document.getElementById('ofEnd').value      = o.endDate||'';
      document.getElementById('ofActive').checked = !!o.isActive;
    }
    document.getElementById('offerModal').classList.add('on');
  },

  closeModal() { document.getElementById('offerModal').classList.remove('on'); this._editId = null; },

  async save() {
    const title = document.getElementById('ofTitle').value.trim();
    if (!title) { showToast('⚠️ Offer title is required'); return; }
    const data = {
      title,
      discountCode:    document.getElementById('ofCode').value.trim().toUpperCase(),
      discountPercent: parseInt(document.getElementById('ofDiscount').value)||0,
      description:     document.getElementById('ofDesc').value.trim(),
      startDate:       document.getElementById('ofStart').value,
      endDate:         document.getElementById('ofEnd').value,
      isActive:        document.getElementById('ofActive').checked,
      updatedAt:       window.$fb.serverTimestamp(),
    };
    try {
      if (this._editId) {
        await window.$fb.updateDoc(window.$fb.doc(window.$db,'offers',this._editId), data);
        showToast('✅ Offer updated!');
      } else {
        data.createdAt = window.$fb.serverTimestamp();
        await window.$fb.addDoc(window.$fb.collection(window.$db,'offers'), data);
        showToast('✅ Offer created!');
      }
      this.closeModal();
      this.load();
    } catch(e) { showToast('❌ ' + e.message); }
  },

  edit(id) { this.openModal(id); },

  async delete(id) {
    if (!confirm('Delete this offer?')) return;
    try {
      await window.$fb.deleteDoc(window.$fb.doc(window.$db,'offers',id));
      showToast('🗑️ Offer deleted');
      this.load();
    } catch(e) { showToast('❌ ' + e.message); }
  }
};

// ══════════════════════════════════════════════════
// POM: BrandingPage — manage logo, banners, colors
// ══════════════════════════════════════════════════
const BrandingPage = {
  async load() {
    if (!window.$db) return;
    try {
      const snap = await window.$fb.getDocs(window.$fb.collection(window.$db,'settings'));
      const cfg  = snap.docs.find(d => d.id === 'branding')?.data() || {};
      if (cfg.logoUrl)    { document.getElementById('logoUrl').value = cfg.logoUrl; this.previewLogo(cfg.logoUrl); }
      if (cfg.storeName)  document.getElementById('brandName').value    = cfg.storeName;
      if (cfg.tagline)    document.getElementById('brandTagline').value  = cfg.tagline;
      if (cfg.brandColor) document.getElementById('brandColor').value    = cfg.brandColor;
      if (cfg.banner1Url) { document.getElementById('banner1Url').value  = cfg.banner1Url; this._previewBanner('banner1Preview', cfg.banner1Url); }
      if (cfg.banner2Url) { document.getElementById('banner2Url').value  = cfg.banner2Url; this._previewBanner('banner2Preview', cfg.banner2Url); }
    } catch(e) {}
  },

  previewLogo(url) {
    const el = document.getElementById('logoPreview');
    if (url) {
      const img = new Image(); img.style.cssText='width:100%;height:100%;object-fit:cover';
      img.onerror = function(){ if(this.parentNode) this.parentNode.innerHTML='🏪'; };
      img.src = url; el.innerHTML=''; el.appendChild(img);
    } else { el.innerHTML='🏪'; }
  },

  _previewBanner(previewId, url) {
    const el = document.getElementById(previewId);
    if (el) {
      if (url) {
        const img = new Image(); img.style.cssText='width:100%;height:100%;object-fit:cover';
        img.onerror = function(){ if(this.parentNode) this.parentNode.innerHTML=''; };
        img.src = url; el.innerHTML=''; el.appendChild(img);
      } else { el.innerHTML=''; }
    }
  },

  async uploadLogo(input) {
    const file = input.files[0];
    if (!file) return;
    showToast('⬆️ Uploading logo...');
    const url = await uploadToStorage(file, `branding/logo_${Date.now()}`);
    if (url) { document.getElementById('logoUrl').value = url; this.previewLogo(url); showToast('✅ Logo uploaded!'); }
  },

  async uploadBanner(input, urlFieldId, previewId) {
    const file = input.files[0];
    if (!file) return;
    showToast('⬆️ Uploading banner...');
    const url = await uploadToStorage(file, `branding/banner_${Date.now()}`);
    if (url) { document.getElementById(urlFieldId).value = url; this._previewBanner(previewId, url); showToast('✅ Banner uploaded!'); }
  },

  async save() {
    if (!window.$db) return;
    const data = {
      logoUrl:    document.getElementById('logoUrl').value.trim(),
      storeName:  document.getElementById('brandName').value.trim(),
      tagline:    document.getElementById('brandTagline').value.trim(),
      brandColor: document.getElementById('brandColor').value,
      banner1Url: document.getElementById('banner1Url').value.trim(),
      banner2Url: document.getElementById('banner2Url').value.trim(),
      updatedAt:  window.$fb.serverTimestamp(),
    };
    try {
      const ref = window.$fb.doc(window.$db, 'settings', 'branding');
      await window.$fb.setDoc(ref, data, { merge: true });
      showToast('✅ Branding saved! Changes reflect on the store.');
    } catch(e) { showToast('❌ ' + e.message); }
  }
};

// ══════════════════════════════════════════════════
// IMAGE UPLOAD via Cloudinary (unsigned preset, no backend needed)
// ══════════════════════════════════════════════════
function getCloudinaryConfig() {
  return {
    cloudName: document.getElementById('cldCloud')?.value.trim() || localStorage.getItem('auranest_cld_cloud') || '',
    preset:    document.getElementById('cldPreset')?.value.trim() || localStorage.getItem('auranest_cld_preset') || '',
  };
}

function setProgressUI(show, pct, msg) {
  const bar    = document.getElementById('uploadProgress');
  const fill   = document.getElementById('uploadBar');
  const status = document.getElementById('uploadStatus');
  if (bar)    bar.style.display  = show ? 'block' : 'none';
  if (fill)   fill.style.width   = (pct || 0) + '%';
  if (status) status.textContent = msg || '';
  const gBox   = document.getElementById('globalUpload');
  const gBar   = document.getElementById('globalUploadBar');
  const gLabel = document.getElementById('globalUploadLabel');
  if (gBox)   gBox.style.display   = show ? 'block' : 'none';
  if (gBar)   gBar.style.width     = (pct || 0) + '%';
  if (gLabel) gLabel.textContent   = msg || 'Uploading…';
}

async function uploadToCloudinary(file) {
  const { cloudName, preset } = getCloudinaryConfig();
  if (!cloudName || !preset) {
    showToast('⚠️ Cloudinary not configured — go to Settings → Image Hosting');
    return null;
  }
  setProgressUI(true, 20, 'Uploading to Cloudinary…');
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset);
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST', body: form,
    });
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message);
    setProgressUI(true, 100, '✅ Uploaded!');
    setTimeout(() => setProgressUI(false), 1200);
    return json.secure_url;
  } catch (err) {
    setProgressUI(false);
    showToast('❌ ' + err.message);
    return null;
  }
}

// Single upload entry point
async function uploadToStorage(file, _path) {
  return await uploadToCloudinary(file);
}

window.uploadProductImage = async function(input, index) {
  const file = input.files[0];
  if (!file) return;
  const url = await uploadToStorage(file, `products/img_${Date.now()}_${index}`);
  if (url) {
    const field = document.getElementById('mImage' + index);
    if (field) { field.value = url; previewImg(index, url); }
    showToast('✅ Image ' + (index+1) + ' uploaded!');
  }
};

// ── NAVIGATION ──
const PAGE_TITLES = {dashboard:'Dashboard',products:'Products',orders:'Orders',customers:'Customers',analytics:'Analytics',inventory:'Inventory',offers:'Offers',branding:'Branding',settings:'Settings'};

function goPage(id, navEl) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id)?.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else document.querySelectorAll('.ni').forEach(n=>{ if(n.textContent.trim().toLowerCase().startsWith(PAGE_TITLES[id]?.toLowerCase()||'')) n.classList.add('active'); });
  document.getElementById('pageTitle').textContent  = PAGE_TITLES[id]||id;
  document.getElementById('breadcrumb').textContent = `Home / ${PAGE_TITLES[id]||id}`;
  // Scroll to top on mobile
  window.scrollTo({top:0,behavior:'smooth'});
}

function openAddModal() {
  window.$editingId = null;
  document.getElementById('modalTitle').textContent = 'Add New Product';
  ['mName','mPrice','mMrp','mMat','mColor','mSize','mTag','mStock','mDesc','mPartNumber'].forEach(id=>document.getElementById(id).value='');
  [0,1,2,3,4].forEach(i => {
    const el = document.getElementById('mImage'+i);
    if (el) el.value = '';
    previewImg(i, '');
  });
  document.getElementById('addModal').classList.add('on');
}

function closeAddModal() { document.getElementById('addModal').classList.remove('on'); window.$editingId=null; }

function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),3000);
}

// Preview image thumbnail — uses DOM methods to avoid null-parentElement crash
function previewImg(index, url) {
  const el = document.getElementById('mPreview' + index);
  if (!el) return;
  el.innerHTML = '';
  if (!url) return;
  const img = new Image();
  img.style.cssText = 'width:100%;height:100%;object-fit:cover';
  img.onerror = function() {
    if (this.parentNode) this.parentNode.innerHTML = '❌';
  };
  img.src = url;
  el.appendChild(img);
}

// ── CLOUDINARY CONFIG SAVE & TEST ──
async function saveCloudinaryConfig() {
  const cloudName = document.getElementById('cldCloud')?.value.trim();
  const preset    = document.getElementById('cldPreset')?.value.trim();
  const statusEl  = document.getElementById('cldStatus');
  if (!cloudName || !preset) { showToast('⚠️ Enter both Cloud Name and Upload Preset'); return; }
  statusEl.style.display = 'block';
  statusEl.style.color   = 'var(--muted)';
  statusEl.textContent   = '⏳ Testing connection…';
  try {
    // Test with a 1×1 PNG blob
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: 'image/png' });
    const form  = new FormData();
    form.append('file', blob, 'test.png');
    form.append('upload_preset', preset);
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method:'POST', body: form });
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message);
    // Save locally
    localStorage.setItem('auranest_cld_cloud',  cloudName);
    localStorage.setItem('auranest_cld_preset', preset);
    // Save to Firebase for cross-device persistence
    try {
      const { doc, setDoc } = window.$fb;
      await setDoc(doc(window.$db, 'config', 'cloudinary'), { cloudName, preset }, { merge: true });
    } catch(e) {}
    statusEl.style.color = 'var(--green)';
    statusEl.textContent = '✅ Cloudinary connected! All image uploads now go to Cloudinary.';
  } catch(e) {
    statusEl.style.color = 'var(--red)';
    statusEl.textContent = '❌ ' + e.message + ' — check Cloud Name and Preset name';
  }
}

// ── EXPORT PRODUCTS CSV ──────────────────────────────────────
window.exportProductsCSV = function() {
  const all = window.$products || [];
  if (!all.length) { showToast('⚠️ No products loaded yet'); return; }

  // Wrap value in CSV-safe quotes (doubles internal quotes)
  const esc = v => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const headers = ['FirebaseID','Name','PartNumber','Category','SubCategory',
                   'Price','MRP','Material','Color','Size','Tag','Stock',
                   'Description','Image1','Image2','Image3','Image4','Image5'];

  const rows = all.map(p => {
    const imgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    return [
      p.id,
      p.name        || '',
      p.partNumber  || '',
      p.category    || '',
      p.subCategory || '',
      p.price       || 0,
      p.mrp         || p.price || 0,
      p.material    || '',
      p.color       || '',
      p.size        || '',
      p.tag         || '',
      p.stock       ?? 0,
      p.description || '',
      imgs[0]||'', imgs[1]||'', imgs[2]||'', imgs[3]||'', imgs[4]||'',
    ].map(esc).join(',');
  });

  // UTF-8 BOM ensures Excel opens special chars correctly
  const csv = '﻿' + [headers.map(esc).join(','), ...rows].join('\r\n');
  const today = new Date().toISOString().slice(0, 10);
  const fname = `auranest_products_${today}.csv`;

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = fname;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast(`✅ ${all.length} products exported to ${fname}`);
};

// ── IMAGE REVIEW HTML EXPORT ─────────────────────────────────
window.exportImageReview = function() {
  const all = window.$products || [];
  if (!all.length) { showToast('⚠️ No products loaded yet'); return; }

  const tableRows = all.map((p, i) => {
    const imgs  = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    const img1  = imgs[0] || '';
    const thumb = img1
      ? `<img src="${img1}" style="width:90px;height:90px;object-fit:contain;background:#f5ede0;border-radius:6px;display:block" onerror="this.replaceWith('—')"/>`
      : '<span style="color:#bbb;font-size:11px">No image</span>';
    return `<tr>
      <td style="color:#aaa;font-size:12px">${i+1}</td>
      <td>${thumb}</td>
      <td><strong style="font-size:14px">${(p.name||'').replace(/</g,'&lt;')}</strong><br>
          <span style="font-size:11px;color:#aaa">${p.partNumber||''}</span></td>
      <td style="font-size:12px">${p.category||''}</td>
      <td style="font-size:12px;color:#888">${p.subCategory||''}</td>
      <td style="color:#9a6f28;font-weight:600">₹${(p.price||0).toLocaleString('en-IN')}</td>
      <td style="font-size:12px">${p.stock??0}</td>
      <td style="font-size:10px;color:#ccc;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.id}">${p.id}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Auranest Image Review — ${new Date().toLocaleDateString('en-IN')}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f0e8;color:#1c1510;padding:24px}
  h1{font-size:1.5rem;color:#9a6f28;margin-bottom:4px}
  .sub{font-size:13px;color:#888;margin-bottom:20px}
  .tip{background:#fff8e8;border:1px solid rgba(154,111,40,.25);border-left:3px solid #9a6f28;
       padding:10px 14px;font-size:12px;color:#7a6040;margin-bottom:20px;border-radius:2px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;
        box-shadow:0 2px 12px rgba(0,0,0,.08)}
  thead th{background:#9a6f28;color:#fff;padding:10px 14px;text-align:left;font-size:11px;
           letter-spacing:.06em;text-transform:uppercase;position:sticky;top:0}
  td{padding:10px 14px;border-bottom:1px solid #f0e8dc;vertical-align:middle}
  tr:hover td{background:#fdf8f0}
  tr:last-child td{border-bottom:none}
</style>
</head>
<body>
<h1>🏡 Auranest Decors — Product Image Review</h1>
<p class="sub">Generated: ${new Date().toLocaleString('en-IN')} &nbsp;·&nbsp; ${all.length} products</p>
<div class="tip">
  💡 <strong>How to use:</strong> Check each product photo against its Name in column 3.
  Find wrong names → fix them in your CSV file → go to Admin → Bulk Upload CSV → re-upload to update.
</div>
<table>
  <thead>
    <tr><th>#</th><th>Photo</th><th>Name / Part No.</th><th>Category</th><th>Sub-Category</th><th>Price</th><th>Stock</th><th>Firebase ID</th></tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `auranest_image_review_${new Date().toISOString().slice(0,10)}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast(`✅ Image review file downloaded — open the .html file in your browser!`);
};

// ── BULK UPLOAD ──
function openBulkModal()  { document.getElementById('bulkModal').classList.add('on'); }
function closeBulkModal() { document.getElementById('bulkModal').classList.remove('on'); BulkUpload.reset(); }

const BulkUpload = {
  _rows: [], _imageMap: {},

  goStep1() {
    document.getElementById('bulkStep1').style.display = '';
    document.getElementById('bulkStep2').style.display = 'none';
    this._setStep(1);
  },

  goStep2() {
    document.getElementById('bulkStep1').style.display = 'none';
    document.getElementById('bulkStep2').style.display = '';
    this._setStep(2);
    // Show summary of uploaded images if any
    const count = Object.keys(this._imageMap).length / 3 | 0; // each image stored 3 keys
    const realCount = [...new Set(Object.values(this._imageMap))].length;
    const sum = document.getElementById('imgReadySummary');
    if (realCount > 0) {
      sum.style.display = '';
      sum.textContent = `✅ ${realCount} image${realCount>1?'s':''} ready — will be matched to CSV ImageFile columns automatically.`;
    } else {
      sum.style.display = 'none';
    }
  },

  _setStep(n) {
    [1,2,3].forEach(i => {
      const el = document.getElementById('stepInd' + i);
      if (!el) return;
      if (i === n) {
        el.style.color = 'var(--gold)';
        el.style.borderBottomColor = 'var(--gold)';
      } else {
        el.style.color = 'var(--muted)';
        el.style.borderBottomColor = 'transparent';
      }
    });
  },

  async handleImageFiles(files) {
    if (!files || !files.length) return;
    const cfg = getCloudinaryConfig();
    if (!cfg.cloudName || !cfg.preset) {
      showToast('⚠️ Cloudinary not configured — go to Settings → Image Hosting');
      return;
    }
    const prog = document.getElementById('imgUploadProgress');
    const fill = document.getElementById('imgUploadFill');
    const lbl  = document.getElementById('imgUploadLbl');
    const done = document.getElementById('imgUploadDone');
    const status = document.getElementById('imgUploadStatus');
    const grid = document.getElementById('imgThumbGrid');
    prog.style.display = ''; done.style.display = 'none';
    grid.innerHTML = '';
    let uploaded = 0; let errors = 0;
    const total = files.length;
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', cfg.preset);
        const resp = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: 'POST', body: form });
        const json = await resp.json();
        if (json.error) throw new Error(json.error.message);
        const url = json.secure_url;
        const fname = file.name;                                          // "Wooden Tray.jpg"
        const fnameNoExt = fname.replace(/\.[^.]+$/, '');                 // "Wooden Tray"
        const cleaned = fname.toLowerCase().replace(/[^a-z0-9]/g, '');   // "woodentray"
        this._imageMap[fname]             = url;
        this._imageMap[fnameNoExt]        = url;
        this._imageMap['__c__' + cleaned] = url;
        // Thumb
        const img = document.createElement('img');
        img.src = url; img.title = fname;
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border2)';
        grid.appendChild(img);
        uploaded++;
      } catch(e) { errors++; console.warn('Upload failed:', file.name, e); }
      const pct = Math.round((uploaded + errors) / total * 100);
      fill.style.width = pct + '%';
      lbl.textContent = `Uploading ${uploaded + errors} / ${total}…`;
    }
    prog.style.display = 'none';
    done.style.display = '';
    status.textContent = `✅ ${uploaded} image${uploaded>1?'s':''} uploaded${errors ? ` · ${errors} failed` : ''} — ready to match with CSV`;
  },

  _matchImages(row) {
    const map = this._imageMap;
    const urls = [];
    // Priority 1: explicit ImageFile columns (supports 5 images)
    ['imageFile1','imageFile2','imageFile3','imageFile4','imageFile5'].forEach(col => {
      const val = (row[col] || '').trim();
      if (!val) return;
      if (val.startsWith('http')) { urls.push(val); return; } // full URL — use directly
      // Try filename lookup from uploaded images
      const cleaned = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      const url = map[val] || map[val.replace(/\.[^.]+$/, '')] || map['__c__' + cleaned];
      if (url) urls.push(url);
    });
    // Priority 2: auto-match by product name if no images found
    if (!urls.length) {
      const nameCleaned = (row.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = map['__c__' + nameCleaned];
      if (match) urls.push(match);
    }
    return [...new Set(urls)]; // deduplicate
  },

  downloadTemplate() {
    const headers = ['Name','PartNumber','Category','SubCategory','Price','MRP','Material','Color','Size','Tag','Stock','Description','ImageFile1','ImageFile2','ImageFile3'];
    const example = [
      'Folk Art Ceramic Planter','AN-001','Aura décor','Decorative Pots','849','999','Ceramic','Multicolors','Ø9cm × H8.5cm','Folk Art','10','Hand-painted ceramic planter with folk art motifs','folk-art-planter.jpg','','',
    ];
    const csv = [headers.join(','), example.map(v => `"${v}"`).join(',')].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'auranest_products_template.csv';
    a.click();
    showToast('✅ Template downloaded! Fill in Excel or Google Sheets.');
  },

  handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') { showToast('⚠️ Please upload a .csv file only'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this._rows = this._parseCSV(e.target.result);
        if (!this._rows.length) { showToast('⚠️ No valid rows found in CSV'); return; }
        this._showPreview();
      } catch(err) { showToast('❌ Error reading CSV: ' + err.message); }
    };
    reader.readAsText(file);
  },

  _parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = this._splitCSV(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
    const idx = (name) => headers.findIndex(h => h.includes(name));
    const iFirebaseId = headers.findIndex(h => h === 'firebaseid' || h === 'id');
    const iName  = idx('name');  const iCat  = idx('cat');   const iSub  = idx('sub');
    const iPrice = idx('price'); const iMrp  = idx('mrp');   const iMat  = idx('mat');
    const iColor = idx('color'); const iSize = idx('size');  const iTag  = idx('tag');
    const iStock = idx('stock'); const iDesc = idx('desc');  const iPart = idx('part');
    // Support ImageFile1/2/3 (template filenames) AND Image1-5 (exported full URLs)
    const iImgF1 = idx('imagefile1') >= 0 ? idx('imagefile1') : idx('image1');
    const iImgF2 = idx('imagefile2') >= 0 ? idx('imagefile2') : idx('image2');
    const iImgF3 = idx('imagefile3') >= 0 ? idx('imagefile3') : idx('image3');
    const iImgF4 = idx('imagefile4') >= 0 ? idx('imagefile4') : idx('image4');
    const iImgF5 = idx('imagefile5') >= 0 ? idx('imagefile5') : idx('image5');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this._splitCSV(lines[i]);
      const name = (cols[iName] || '').trim();
      if (!name) continue;
      const price = parseInt(cols[iPrice]) || 0;
      if (!price) continue;
      const row = {
        name,
        category:    (cols[iCat]  || 'Aura décor').trim(),
        subCategory: (cols[iSub]  || '').trim(),
        price,
        mrp:         parseInt(cols[iMrp]) || price,
        material:    (cols[iMat]  || '').trim(),
        color:       (cols[iColor]|| '').trim(),
        size:        (cols[iSize] || '').trim(),
        tag:         (cols[iTag]  || '').trim(),
        stock:       parseInt(cols[iStock]) || 10,
        description: (cols[iDesc] || '').trim(),
        partNumber:  (iPart >= 0 ? cols[iPart] || '' : '').trim(),
        imageFile1:  (iImgF1 >= 0 ? cols[iImgF1] || '' : '').trim(),
        imageFile2:  (iImgF2 >= 0 ? cols[iImgF2] || '' : '').trim(),
        imageFile3:  (iImgF3 >= 0 ? cols[iImgF3] || '' : '').trim(),
        imageFile4:  (iImgF4 >= 0 ? cols[iImgF4] || '' : '').trim(),
        imageFile5:  (iImgF5 >= 0 ? cols[iImgF5] || '' : '').trim(),
        icon: '🎁',
      };
      // If FirebaseID column present → this is an update, not a new insert
      if (iFirebaseId >= 0) {
        const fbId = (cols[iFirebaseId] || '').trim();
        if (fbId) row._firebaseId = fbId;
      }
      rows.push(row);
    }
    return rows;
  },

  _splitCSV(line) {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
      else { cur += c; }
    }
    result.push(cur);
    return result;
  },

  _showPreview() {
    const wrap    = document.getElementById('bulkPreviewWrap');
    const stats   = document.getElementById('bulkStats');
    const preview = document.getElementById('bulkPreview');
    const rows    = this._rows;
    const cats        = [...new Set(rows.map(r => r.category))];
    const imagesReady = [...new Set(Object.values(this._imageMap))].length;
    const toUpdate    = rows.filter(r => r._firebaseId).length;
    const toAdd       = rows.length - toUpdate;
    stats.innerHTML = `
      <div class="bulk-stat"><div class="bulk-stat-n" style="color:var(--green)">${toUpdate}</div><div class="bulk-stat-l">🔄 To Update</div></div>
      <div class="bulk-stat"><div class="bulk-stat-n" style="color:var(--gold)">${toAdd}</div><div class="bulk-stat-l">✨ To Add New</div></div>
      <div class="bulk-stat"><div class="bulk-stat-n">${cats.length}</div><div class="bulk-stat-l">Categories</div></div>
      <div class="bulk-stat"><div class="bulk-stat-n">${imagesReady}</div><div class="bulk-stat-l">Images Ready</div></div>`;
    const shown = rows.slice(0, 10);
    preview.innerHTML = `<table>
      <thead><tr><th>#</th><th>Mode</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Image</th></tr></thead>
      <tbody>${shown.map((r,i) => {
        const imgs = this._matchImages(r);
        const imgCell = imgs.length
          ? `<img src="${imgs[0]}" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.outerHTML='<span style=color:var(--red);font-size:.65rem>✗</span>'"/>`
          : '<span style="font-size:.65rem;color:var(--muted)">—</span>';
        const modeBadge = r._firebaseId
          ? '<span class="badge-update">🔄 Update</span>'
          : '<span class="badge-addnew">✨ New</span>';
        return `<tr>
          <td style="color:var(--muted)">${i+1}</td>
          <td>${modeBadge}</td>
          <td><div style="font-weight:500">${r.name}</div><div style="font-size:.65rem;color:var(--muted)">${r.subCategory}</div></td>
          <td><span style="font-size:.7rem;background:var(--gold-dim);color:var(--gold);padding:.15rem .5rem">${r.category}</span></td>
          <td style="color:var(--gold)">₹${r.price}</td>
          <td>${r.stock}</td>
          <td>${imgCell}</td>
        </tr>`;
      }).join('')}
      ${rows.length > 10 ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:.8rem;font-size:.72rem">…and ${rows.length - 10} more products</td></tr>` : ''}
      </tbody></table>`;
    const btnLabel = toUpdate && toAdd  ? `⬆ Update ${toUpdate} + Add ${toAdd} Products`
                   : toUpdate           ? `🔄 Update ${toUpdate} Products`
                   :                      `⬆ Import All ${rows.length} Products`;
    document.getElementById('bulkImportBtn').textContent = btnLabel;
    wrap.style.display = 'block';
    this._setStep(3);
    document.getElementById('stepInd3').style.color = 'var(--gold)';
    document.getElementById('stepInd3').style.borderBottomColor = 'var(--gold)';
  },

  async importAll() {
    if (!this._rows.length) return;
    if (!window.$db || !window.$fb) { showToast('❌ Firebase not connected'); return; }
    const btn      = document.getElementById('bulkImportBtn');
    const progWrap = document.getElementById('bulkProgWrap');
    const fill     = document.getElementById('bulkProgFill');
    const lbl      = document.getElementById('bulkProgLbl');
    btn.disabled = true; btn.textContent = 'Importing…';
    progWrap.style.display = 'block';
    let updated = 0; let added = 0; let errors = 0;
    const total = this._rows.length;
    for (const row of this._rows) {
      try {
        const imgs = this._matchImages(row);
        // Strip CSV-only helper columns before saving
        const { imageFile1, imageFile2, imageFile3, imageFile4, imageFile5, _firebaseId, sold, ...rest } = row;
        const product = {
          ...rest,
          image:     imgs[0] || '',
          images:    imgs,
          updatedAt: window.$fb.serverTimestamp(),
        };
        if (_firebaseId) {
          // UPDATE existing product
          await window.$fb.updateDoc(window.$fb.doc(window.$db, 'products', _firebaseId), product);
          updated++;
        } else {
          // ADD new product
          product.createdAt = window.$fb.serverTimestamp();
          product.sold = 0;
          await window.$fb.addDoc(window.$fb.collection(window.$db, 'products'), product);
          added++;
        }
      } catch(e) { errors++; console.warn('Import error:', e); }
      const pct = Math.round((updated + added + errors) / total * 100);
      fill.style.width = pct + '%';
      lbl.textContent = `Processing… ${updated + added + errors} / ${total}`;
    }
    const summary = [updated && `${updated} updated`, added && `${added} added`, errors && `${errors} failed`].filter(Boolean).join(', ');
    lbl.textContent = `✅ Done! ${summary}.`;
    fill.style.background = errors ? 'var(--terra)' : 'var(--green)';
    showToast(`✅ ${updated + added} products processed (${updated} updated, ${added} new)!`);
    btn.textContent = '✅ Complete';
    if (typeof window.$loadProducts === 'function') window.$loadProducts();
  },

  reset() {
    this._rows = []; this._imageMap = {};
    // Step 1
    document.getElementById('bulkStep1').style.display = '';
    document.getElementById('bulkStep2').style.display = 'none';
    document.getElementById('imgUploadProgress').style.display = 'none';
    document.getElementById('imgUploadDone').style.display = 'none';
    document.getElementById('imgThumbGrid').innerHTML = '';
    // Step 2
    document.getElementById('bulkPreviewWrap').style.display = 'none';
    document.getElementById('bulkProgWrap').style.display = 'none';
    document.getElementById('bulkProgFill').style.width = '0%';
    document.getElementById('bulkImportBtn').disabled = false;
    document.getElementById('bulkImportBtn').textContent = '⬆ Import All Products';
    document.getElementById('imgReadySummary').style.display = 'none';
    this._setStep(1);
  }
};

// Drag-over highlight
document.addEventListener('DOMContentLoaded', function() {
  ['bulkDrop','imgDrop'].forEach(id => {
    const drop = document.getElementById(id);
    if (!drop) return;
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag');
      const files = e.dataTransfer?.files;
      if (!files) return;
      if (id === 'imgDrop') BulkUpload.handleImageFiles(files);
      else if (id === 'bulkDrop') BulkUpload.handleFile(files[0]);
    });
  });
});

// ── RESTORE CLOUDINARY CONFIG ON LOAD ──
document.addEventListener('DOMContentLoaded', function() {
  const img0 = document.getElementById('mImage0');
  if (img0) img0.addEventListener('input', function() { previewImg(0, this.value); });

  // 1. Restore from localStorage immediately
  const cld = localStorage.getItem('auranest_cld_cloud');
  const pre = localStorage.getItem('auranest_cld_preset');
  if (cld) { const el = document.getElementById('cldCloud');  if (el) el.value = cld; }
  if (pre) { const el = document.getElementById('cldPreset'); if (el) el.value = pre; }

  // 2. Load from Firebase (cross-device persistence)
  setTimeout(async () => {
    try {
      const { doc, getDoc } = window.$fb;
      const snap = await getDoc(doc(window.$db, 'config', 'cloudinary'));
      if (snap.exists()) {
        const { cloudName, preset } = snap.data();
        if (cloudName) { localStorage.setItem('auranest_cld_cloud', cloudName);  const el = document.getElementById('cldCloud');  if (el) el.value = cloudName; }
        if (preset)    { localStorage.setItem('auranest_cld_preset', preset);    const el = document.getElementById('cldPreset'); if (el) el.value = preset; }
      }
    } catch(e) {}
  }, 2000);
});
