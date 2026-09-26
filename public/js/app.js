/**
 * Core Front-End Interactivity & POS Cart Manager (Simple & Clean)
 * Restoran Dapur Ina Aina
 */

// Cart State Manager
const POS_CART = {
  items: [],

  init() {
    this.loadFromStorage();
    this.render();
    this.attachEvents();
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('dapur_ina_cart');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (e) {
      this.items = [];
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('dapur_ina_cart', JSON.stringify(this.items));
    } catch (e) {}
  },

  MAX_QTY_PER_ITEM: 20,

  addItem(id, name, price, stock, img, category) {
    const existing = this.items.find(item => item.id_produk === id);
    if (existing) {
      if (existing.jumlah + 1 > this.MAX_QTY_PER_ITEM) {
        this.showToast(`Batas maksimal pemesanan adalah ${this.MAX_QTY_PER_ITEM} porsi per menu.`, 'error');
        return;
      }
      if (existing.jumlah + 1 > stock) {
        this.showToast(`Stok "${name}" hanya tersisa ${stock} porsi!`, 'error');
        return;
      }
      existing.jumlah += 1;
      existing.subtotal = existing.jumlah * existing.harga_satuan;
      if (img && !existing.gambar) existing.gambar = img;
      if (stock) existing.stok = stock;
    } else {
      if (stock <= 0) {
        this.showToast(`Maaf, "${name}" saat ini sedang habis.`, 'error');
        return;
      }
      this.items.push({
        id_produk: id,
        nama_produk: name,
        harga_satuan: parseFloat(price),
        jumlah: 1,
        subtotal: parseFloat(price),
        kategori: category || '',
        gambar: img || '',
        stok: stock || 99
      });
    }

    this.saveToStorage();
    this.render();
    this.showToast(`"${name}" ditambahkan ke keranjang`, 'success');
  },

  updateQty(id, delta) {
    const item = this.items.find(i => i.id_produk === id);
    if (!item) return;

    if (delta > 0) {
      if (item.jumlah + delta > this.MAX_QTY_PER_ITEM) {
        this.showToast(`Batas maksimal per menu adalah ${this.MAX_QTY_PER_ITEM} porsi per pesanan.`, 'error');
        return;
      }
      if (item.stok && item.jumlah + delta > item.stok) {
        this.showToast(`Stok "${item.nama_produk}" hanya tersisa ${item.stok} porsi!`, 'error');
        return;
      }
    }

    item.jumlah += delta;
    if (item.jumlah <= 0) {
      this.removeItem(id);
      return;
    }

    item.subtotal = item.jumlah * item.harga_satuan;
    this.saveToStorage();
    this.render();
  },

  removeItem(id) {
    this.items = this.items.filter(i => i.id_produk !== id);
    this.saveToStorage();
    this.render();
  },

  clear() {
    this.items = [];
    this.saveToStorage();
    this.render();
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.jumlah, 0);
  },

  render() {
    const cartContainer = document.getElementById('cartItemsContainer');
    const mobileCartContainer = document.getElementById('mobileCartItemsContainer');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    const billSubtotal = document.getElementById('billSubtotal');
    const floatingCartBar = document.getElementById('floatingCartBar');
    const floatingCartTotal = document.getElementById('floatingCartTotal');
    const badgeDisplays = document.querySelectorAll('.cart-badge-count');
    const cartInput = document.getElementById('cartDataInput');
    const mobileCartInputs = document.querySelectorAll('.mobileCartDataInput');
    const btnCheckout = document.getElementById('btnSubmitOrder');

    const total = this.getTotal();
    const count = this.getItemCount();

    // Update Badges
    badgeDisplays.forEach(badge => {
      badge.textContent = count;
    });

    // Update Hidden Form Input
    if (cartInput) {
      cartInput.value = JSON.stringify(this.items);
    }
    mobileCartInputs.forEach(input => {
      input.value = JSON.stringify(this.items);
    });

    // Enable/Disable Checkout Button
    if (btnCheckout) {
      btnCheckout.disabled = (count === 0);
    }

    // Update Total Displays
    const formattedTotal = 'Rp ' + total.toLocaleString('id-ID');
    if (totalDisplay) {
      totalDisplay.textContent = formattedTotal;
    }
    if (billSubtotal) {
      billSubtotal.textContent = formattedTotal;
    }

    // Update Floating Bottom Cart Bar
    if (floatingCartBar) {
      if (count > 0) {
        floatingCartBar.style.display = 'flex';
        if (floatingCartTotal) floatingCartTotal.textContent = formattedTotal;
      } else {
        floatingCartBar.style.display = 'none';
      }
    }

    const htmlContent = (this.items.length === 0) 
      ? `<div class="cart-empty-state" style="padding: 36px 16px; text-align: center;">
          <div class="cart-empty-icon" style="width: 52px; height: 52px; background: #fff7ed; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div class="cart-empty-title" style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">Keranjang Belanja Masih Kosong</div>
          <a href="/menu" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
            <span>Lihat Buku Menu</span>
          </a>
        </div>`
      : this.items.map(item => `
          <div class="cart-item-card">
            <img src="${item.gambar || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}" 
                 alt="${item.nama_produk}" 
                 class="cart-item-thumb"
                 onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'">
            <div class="cart-item-info">
              <div class="cart-item-title">${item.nama_produk}</div>
              <div class="cart-item-unit-price">Rp ${item.harga_satuan.toLocaleString('id-ID')} / porsi</div>
              <div class="cart-item-subtotal">Rp ${item.subtotal.toLocaleString('id-ID')}</div>
            </div>
            <div class="cart-item-actions">
              <div class="cart-stepper">
                <button type="button" class="cart-stepper-btn" onclick="POS_CART.updateQty(${item.id_produk}, -1)" aria-label="Kurang porsi">-</button>
                <span class="cart-stepper-num">${item.jumlah}</span>
                <button type="button" class="cart-stepper-btn" onclick="POS_CART.updateQty(${item.id_produk}, 1)" aria-label="Tambah porsi" ${item.jumlah >= 20 ? 'disabled style="opacity: 0.35; cursor: not-allowed;" title="Maksimal 20 porsi"' : ''}>+</button>
              </div>
              <button type="button" class="cart-delete-btn" onclick="POS_CART.removeItem(${item.id_produk})" title="Hapus menu">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `).join('');

    if (cartContainer) {
      cartContainer.innerHTML = htmlContent;
    }
    if (mobileCartContainer) {
      mobileCartContainer.innerHTML = htmlContent;
    }
  },

  showToast(message, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
    }
  },

  attachEvents() {
    const searchInput = document.getElementById('liveSearchMenu');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.menu-card');
        cards.forEach(card => {
          const title = (card.getAttribute('data-name') || '').toLowerCase();
          const cat = (card.getAttribute('data-category') || '').toLowerCase();
          if (title.includes(query) || cat.includes(query)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }
  }
};

// Mobile Drawer Controls
function openMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleMobileDrawer(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  const drawer = document.getElementById('mobileDrawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  POS_CART.init();

  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeMobileDrawer();
    });
  }

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileDrawer();
  });
});


