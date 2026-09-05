const AssetPage = {

  currentPage: 1,
  deleteId: null,
  editId: null,
  eventsBound: false,

  _generateSerialFallback() {
    const prefix = 'HD';
    const random = String(Math.floor(10000000 + Math.random() * 90000000));
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const secondsToday = Math.floor((now.getTime() - startOfDay) / 1000);
    const seq = String((secondsToday % 900) + 100).padStart(3, '0');
    return `${prefix}-${random}-${seq}`;
  },

  init() {
    console.log('[AssetPage] init() mulai...');
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    this.loadDropdowns();
    this.loadAssets();
    this.bindEvents();
    console.log('[AssetPage] init() selesai.');
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadAssets(); });
    document.getElementById('filterStatus').addEventListener('change', () => { this.currentPage = 1; this.loadAssets(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadAssets());
    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());

    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveAsset());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());
  },

  async loadDropdowns() {
    const token = Storage.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [catRes, brandRes, clientRes] = await Promise.all([
        fetch(`${BASE_URL}/asset-category/get.php`, { headers }),
        fetch(`${BASE_URL}/asset-brand/get.php`, { headers }),
        fetch(`${BASE_URL}/client/get.php?limit=100`, { headers })
      ]);
      const [cats, brands, clients] = await Promise.all([
        catRes.json(), brandRes.json(), clientRes.json()
      ]);
      this.fillSelect('assetCategory', cats.data, 'id', 'name');
      this.fillSelect('assetBrand', brands.data, 'id', 'name');
      this.fillSelect('assetClient', clients.data, 'id', 'name');
    } catch (e) {
      console.error('Gagal load dropdown:', e);
    }
  },

  fillSelect(id, data, valKey, labelKey) {
    const el = document.getElementById(id);
    if (!el || !Array.isArray(data)) return;
    const currentValue = el.value;
    while (el.options.length > 1) el.remove(1);
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valKey];
      opt.textContent = item[labelKey];
      el.appendChild(opt);
    });
    if (currentValue) el.value = currentValue;
  },

  async loadAssets() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('filterStatus').value;
    const params = new URLSearchParams({ page: this.currentPage, limit: 10, search, status });
    try {
      const res = await fetch(`${BASE_URL}/asset/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      if (data.success) this.renderTable(data.data, data.pagination);
      else Toast.error(data.message || 'Gagal memuat data asset');
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  renderPhoto(photoPath) {
    if (!photoPath) {
      return `<div class="asset-thumb-placeholder" style="width:160px;height:160px;min-width:160px;min-height:160px;border-radius:10px;background:#f1f5f9;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem;"><i class="fa-regular fa-image"></i></div>`;
    }
    const fullUrl = `${window.location.origin}/Project%20A/${photoPath}`;
    return `<div class="asset-photo-wrap" style="width:160px;height:160px;min-width:160px;min-height:160px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;cursor:pointer;flex-shrink:0;" onclick="AssetPage.openPreview('${fullUrl}')" title="Klik untuk memperbesar">
      <img src="${fullUrl}" alt="Foto Asset" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;max-width:none;" />
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

  renderTable(assets, pagination) {
    const tbody = document.getElementById('assetTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!assets || !assets.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="table-empty">Belum ada data asset</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = assets.map((a, i) => `
      <tr>
        <td>${start + i}</td>
        <td>${this.renderPhoto(a.photo)}</td>
        <td><code>${a.asset_code || '—'}</code></td>
        <td><strong>${a.name}</strong></td>
        <td>${a.category_name || '—'}</td>
        <td>${a.brand_name || '—'}</td>
        <td>${a.client_name || '—'}</td>
        <td><code>${a.serial_number || '—'}</code></td>
        <td>${this.statusBadge(a.status)}</td>
        <td>${a.location || '—'}</td>
        <td>${this.formatDate(a.purchase_date)}</td>
        <td>${this.formatDate(a.warranty_exp)}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-icon btn-edit btn-sm" onclick="AssetPage.openEdit(${a.id})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-icon btn-delete btn-sm" onclick="AssetPage.openDelete(${a.id}, '${this.escapeHtml(a.name)}')" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    const end = Math.min(start + pagination.per_page - 1, pagination.total);
    document.getElementById('tableInfo').textContent =
      `Menampilkan ${start}–${end} dari ${pagination.total} data`;

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

  statusBadge(status) {
    const map = {
      active: '<span class="badge badge-success">Aktif</span>',
      damaged: '<span class="badge badge-danger">Rusak</span>',
      maintenance: '<span class="badge badge-warning">Maintenance</span>'
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },

  renderPagination(p) {
    const el = document.getElementById('pagination');
    if (p.last_page <= 1) { el.innerHTML = ''; return; }

    let html = `
      <button class="page-btn ${p.current_page === 1 ? 'disabled' : ''}"
        onclick="AssetPage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="AssetPage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="AssetPage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadAssets();
  },

  async openForm() {
    this.editId = null;
    await this.loadDropdowns();
    document.getElementById('modalFormTitle').textContent = 'Tambah Asset';
    document.getElementById('assetForm').reset();
    document.getElementById('assetId').value = '';
    document.getElementById('nameError').textContent = '';
    document.getElementById('assetName').classList.remove('is-error');
    let serial = (typeof SerialGen !== 'undefined' && SerialGen.generate) ? SerialGen.generate() : this._generateSerialFallback();
    document.getElementById('assetSerial').value = serial;
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    console.log('[AssetPage] openEdit(' + id + ')');
    this.editId = id;
    await this.loadDropdowns();
    document.getElementById('modalFormTitle').textContent = 'Edit Asset';

    try {
      const res = await fetch(`${BASE_URL}/asset/get.php?id=${id}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();

      if (!data.success || !data.data || !data.data[0]) {
        Toast.error('Data asset tidak ditemukan');
        return;
      }

      const a = data.data[0];
      console.log('[openEdit] Data asset:', a);

      document.getElementById('assetId').value = a.id;
      document.getElementById('assetName').value = a.name || '';

      setTimeout(() => {
        document.getElementById('assetCategory').value = a.category_id ? String(a.category_id) : '';
        document.getElementById('assetBrand').value = a.brand_id ? String(a.brand_id) : '';
        document.getElementById('assetClient').value = a.client_id ? String(a.client_id) : '';
        console.log('[openEdit] Dropdown set:', {
          category: a.category_id,
          brand: a.brand_id,
          client: a.client_id
        });
      }, 50);

      document.getElementById('assetStatus').value = a.status || 'active';
      document.getElementById('assetSerial').value = a.serial_number || '';
      document.getElementById('assetLocation').value = a.location || '';
      document.getElementById('assetPurchase').value = a.purchase_date || '';
      document.getElementById('assetWarranty').value = a.warranty_exp || '';
      document.getElementById('assetDesc').value = a.description || '';
      document.getElementById('assetPhoto').value = '';

      document.getElementById('nameError').textContent = '';
      document.getElementById('assetName').classList.remove('is-error');

      document.getElementById('modalForm').classList.add('active');
    } catch (e) {
      Toast.error('Gagal memuat data asset');
      console.error(e);
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
  },

  async saveAsset() {
    const name = document.getElementById('assetName').value.trim();
    if (!name) {
      document.getElementById('assetName').classList.add('is-error');
      document.getElementById('nameError').textContent = 'Nama asset wajib diisi';
      return;
    }
    document.getElementById('assetName').classList.remove('is-error');
    document.getElementById('nameError').textContent = '';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('status', document.getElementById('assetStatus').value);
    formData.append('serial_number', document.getElementById('assetSerial').value);
    formData.append('location', document.getElementById('assetLocation').value);
    formData.append('description', document.getElementById('assetDesc').value);

    const categoryId = document.getElementById('assetCategory').value;
    const brandId    = document.getElementById('assetBrand').value;
    const clientId   = document.getElementById('assetClient').value;

    if (categoryId && !isNaN(categoryId) && parseInt(categoryId) > 0) formData.append('category_id', categoryId);
    if (brandId    && !isNaN(brandId)    && parseInt(brandId) > 0)    formData.append('brand_id', brandId);
    if (clientId   && !isNaN(clientId)   && parseInt(clientId) > 0)   formData.append('client_id', clientId);

    const purchaseDate = document.getElementById('assetPurchase').value;
    const warrantyExp  = document.getElementById('assetWarranty').value;
    if (purchaseDate) formData.append('purchase_date', purchaseDate);
    if (warrantyExp)  formData.append('warranty_exp', warrantyExp);

    const photo = document.getElementById('assetPhoto').files[0];
    if (photo) {
      console.log('[saveAsset] Upload foto:', photo.name, photo.size);
      formData.append('photo', photo);
    }

    const isEdit = !!this.editId;
    if (isEdit) formData.append('id', this.editId);

    const url = isEdit ? `${BASE_URL}/asset/update.php` : `${BASE_URL}/asset/create.php`;
    document.getElementById('saveBtnText').textContent = 'Menyimpan...';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` },
        body: formData
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[saveAsset] Response bukan JSON:', text.substring(0, 2000));
        Toast.error(`Server error (${res.status}). Cek Console untuk detail.`);
        return;
      }

      const data = await res.json();
      console.log('[saveAsset] Response:', data);

      if (data.success) {
        Toast.success(data.message);
        this.closeForm();
        this.loadAssets();
      } else {
        Toast.error(data.message || 'Gagal menyimpan data');
      }
    } catch (e) {
      Toast.error('Gagal menyimpan data');
      console.error(e);
    } finally {
      document.getElementById('saveBtnText').textContent = 'Simpan';
    }
  },

  openDelete(id, name) {
    this.deleteId = id;
    document.getElementById('deleteAssetName').textContent = name;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDelete() {
    document.getElementById('modalDelete').classList.remove('active');
    this.deleteId = null;
  },

  async confirmDelete() {
    if (!this.deleteId) return;

    try {
      const res = await fetch(`${BASE_URL}/asset/delete.php`, {
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
        this.loadAssets();
      } else {
        Toast.error(data.message || 'Gagal menghapus data');
      }
    } catch (e) {
      Toast.error('Gagal menghapus data');
      console.error(e);
    }
  },

  async exportPDF() {
    try {
      const search = document.getElementById('searchInput').value;
      const filterCatEl = document.getElementById('filterCategory');
      const filterCat = filterCatEl ? filterCatEl.value : '';
      const filterStatus = document.getElementById('filterStatus').value;
      
      const params = new URLSearchParams({ page: 1, limit: 1000, search, category_id: filterCat, status: filterStatus });
      const res = await fetch(`${BASE_URL}/asset/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data.length) {
        Toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const tableData = data.data.map((a, i) => [
        i + 1,
        a.asset_code || '-',
        a.name || '-',
        a.category_name || '-',
        a.brand_name || '-',
        a.status ? a.status.toUpperCase() : '-',
        a.location || '-'
      ]);

      const headers = ['No', 'Kode Aset', 'Nama Aset', 'Kategori', 'Merek', 'Status', 'Lokasi'];
      PDFExport.exportProfessionalPDF('Laporan Data Aset', headers, tableData, 'Laporan_Aset.pdf');
    } catch (e) {
      Toast.error('Gagal mengekspor PDF');
      console.error(e);
    }
  }

};

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DOM] DOMContentLoaded fired');
  AssetPage.init();
});
