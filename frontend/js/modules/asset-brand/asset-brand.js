const AssetBrandPage = {

  currentPage: 1,
  deleteId: null,
  editId: null,
  eventsBound: false,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    this.loadBrands();
    this.bindEvents();
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadBrands(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadBrands());
    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveBrand());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());
  },

  async loadBrands() {
    const search = document.getElementById('searchInput').value;
    const params = new URLSearchParams({ page: this.currentPage, limit: 10, search });
    
    try {
      const res = await fetch(`${BASE_URL}/asset-brand/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const pagination = data.pagination || {
          current_page: 1,
          per_page: data.data ? data.data.length : 10,
          total: data.data ? data.data.length : 0,
          last_page: 1
        };
        this.renderTable(data.data, pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat data brand');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  renderPhoto(photoPath) {
    if (!photoPath) {
      return `<div class="brand-logo-placeholder"><i class="fa-solid fa-image"></i></div>`;
    }
    const fullUrl = `${window.location.origin}/Project%20A/${photoPath}`;
    return `<div class="brand-logo-wrap" onclick="AssetBrandPage.openPreview('${fullUrl}')" title="Klik untuk memperbesar">
      <img src="${fullUrl}" alt="Logo Brand" />
    </div>`;
  },

  openPreview(url) {
    document.getElementById('previewImage').src = url;
    document.getElementById('modalPreview').classList.add('active');
  },

  closePreview() {
    document.getElementById('modalPreview').classList.remove('active');
    document.getElementById('previewImage').src = '';
  },

  renderTable(brands, pagination) {
    const tbody = document.getElementById('brandTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!brands || !brands.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Belum ada data brand</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = brands.map((b, i) => `
      <tr>
        <td>${start + i}</td>
        <td>${this.renderPhoto(b.logo)}</td>
        <td><strong>${this.escapeHtml(b.name)}</strong></td>
        <td>
          <div class="action-group">
            <button class="btn btn-icon btn-edit btn-sm" onclick="AssetBrandPage.openEdit(${b.id})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-icon btn-delete btn-sm" onclick="AssetBrandPage.openDelete(${b.id}, '${this.escapeHtml(b.name)}')" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    const end = Math.min(start + pagination.per_page - 1, pagination.total);
    document.getElementById('tableInfo').textContent = `Menampilkan ${start}–${end} dari ${pagination.total} data`;
    this.renderPagination(pagination);
  },

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  renderPagination(p) {
    const el = document.getElementById('pagination');
    if (p.last_page <= 1) { el.innerHTML = ''; return; }

    let html = `
      <button class="page-btn ${p.current_page === 1 ? 'disabled' : ''}"
        onclick="AssetBrandPage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="AssetBrandPage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="AssetBrandPage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadBrands();
  },

  openForm() {
    this.editId = null;
    document.getElementById('modalFormTitle').textContent = 'Tambah Brand';
    document.getElementById('brandForm').reset();
    document.getElementById('brandId').value = '';
    document.getElementById('nameError').textContent = '';
    document.getElementById('brandName').classList.remove('is-error');
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    this.editId = id;
    document.getElementById('modalFormTitle').textContent = 'Edit Brand';
    
    try {
      const res = await fetch(`${BASE_URL}/asset-brand/get.php?id=${id}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data || !data.data[0]) {
        Toast.error('Data brand tidak ditemukan');
        return;
      }

      const b = data.data[0];
      document.getElementById('brandId').value = b.id;
      document.getElementById('brandName').value = b.name || '';
      document.getElementById('brandLogo').value = ''; // Reset file input
      
      document.getElementById('nameError').textContent = '';
      document.getElementById('brandName').classList.remove('is-error');
      
      document.getElementById('modalForm').classList.add('active');
    } catch (e) {
      Toast.error('Gagal memuat data');
      console.error(e);
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
  },

  async saveBrand() {
    const name = document.getElementById('brandName').value.trim();
    if (!name) {
      document.getElementById('brandName').classList.add('is-error');
      document.getElementById('nameError').textContent = 'Nama brand wajib diisi';
      return;
    }
    
    document.getElementById('brandName').classList.remove('is-error');
    document.getElementById('nameError').textContent = '';

    const formData = new FormData();
    formData.append('name', name);
    
    const logoFile = document.getElementById('brandLogo').files[0];
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const isEdit = !!this.editId;
    if (isEdit) formData.append('id', this.editId);

    const url = isEdit ? `${BASE_URL}/asset-brand/update.php` : `${BASE_URL}/asset-brand/create.php`;
    document.getElementById('saveBtnText').textContent = 'Menyimpan...';

    try {
      const res = await fetch(url, {
        method: 'POST', // Both create and update for brand use POST because of FormData
        headers: { 
          'Authorization': `Bearer ${Storage.getToken()}` 
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        Toast.success(data.message);
        this.closeForm();
        this.loadBrands();
      } else {
        Toast.error(data.message || 'Gagal menyimpan data');
      }
    } catch (e) {
      Toast.error('Terjadi kesalahan sistem');
      console.error(e);
    } finally {
      document.getElementById('saveBtnText').textContent = 'Simpan';
    }
  },

  openDelete(id, name) {
    this.deleteId = id;
    document.getElementById('deleteBrandName').textContent = name;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDelete() {
    document.getElementById('modalDelete').classList.remove('active');
    this.deleteId = null;
  },

  async confirmDelete() {
    if (!this.deleteId) return;

    try {
      const res = await fetch(`${BASE_URL}/asset-brand/delete.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}`
        },
        body: JSON.stringify({ id: this.deleteId })
      });
      const data = await res.json();

      if (data.success) {
        Toast.success(data.message);
        this.closeDelete();
        this.loadBrands();
      } else {
        Toast.error(data.message || 'Gagal menghapus data');
      }
    } catch (e) {
      Toast.error('Gagal menghapus data');
      console.error(e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AssetBrandPage.init();
});
