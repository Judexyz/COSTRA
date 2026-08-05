const ClientPage = {

  currentPage: 1,
  deleteId: null,
  editId: null,
  eventsBound: false,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    this.loadClients();
    this.bindEvents();
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadClients(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadClients());
    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveClient());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());
  },

  async loadClients() {
    const search = document.getElementById('searchInput').value;
    const params = new URLSearchParams({ page: this.currentPage, limit: 10, search });
    
    try {
      const res = await fetch(`${BASE_URL}/client/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.renderTable(data.data, data.pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat data client');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  renderTable(clients, pagination) {
    const tbody = document.getElementById('clientTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!clients || !clients.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Belum ada data client</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = clients.map((c, i) => `
      <tr>
        <td>${start + i}</td>
        <td><strong>${this.escapeHtml(c.name)}</strong></td>
        <td>${this.escapeHtml(c.email) || '—'}</td>
        <td>${this.escapeHtml(c.phone) || '—'}</td>
        <td>${this.escapeHtml(c.address) || '—'}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-icon btn-edit btn-sm" onclick="ClientPage.openEdit(${c.id})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-icon btn-delete btn-sm" onclick="ClientPage.openDelete(${c.id}, '${this.escapeHtml(c.name)}')" title="Hapus">
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
        onclick="ClientPage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="ClientPage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="ClientPage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadClients();
  },

  openForm() {
    this.editId = null;
    document.getElementById('modalFormTitle').textContent = 'Tambah Client';
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    document.getElementById('nameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('clientName').classList.remove('is-error');
    document.getElementById('clientEmail').classList.remove('is-error');
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    this.editId = id;
    document.getElementById('modalFormTitle').textContent = 'Edit Client';
    
    try {
      const res = await fetch(`${BASE_URL}/client/get.php?id=${id}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data || !data.data[0]) {
        Toast.error('Data client tidak ditemukan');
        return;
      }

      const c = data.data[0];
      document.getElementById('clientId').value = c.id;
      document.getElementById('clientName').value = c.name || '';
      document.getElementById('clientEmail').value = c.email || '';
      document.getElementById('clientPhone').value = c.phone || '';
      document.getElementById('clientAddress').value = c.address || '';
      document.getElementById('clientDesc').value = c.description || '';
      
      document.getElementById('nameError').textContent = '';
      document.getElementById('emailError').textContent = '';
      document.getElementById('clientName').classList.remove('is-error');
      document.getElementById('clientEmail').classList.remove('is-error');
      
      document.getElementById('modalForm').classList.add('active');
    } catch (e) {
      Toast.error('Gagal memuat data');
      console.error(e);
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
  },

  async saveClient() {
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    let hasError = false;

    if (!name) {
      document.getElementById('clientName').classList.add('is-error');
      document.getElementById('nameError').textContent = 'Nama client wajib diisi';
      hasError = true;
    } else {
      document.getElementById('clientName').classList.remove('is-error');
      document.getElementById('nameError').textContent = '';
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      document.getElementById('clientEmail').classList.add('is-error');
      document.getElementById('emailError').textContent = 'Format email tidak valid';
      hasError = true;
    } else {
      document.getElementById('clientEmail').classList.remove('is-error');
      document.getElementById('emailError').textContent = '';
    }

    if (hasError) return;

    const payload = {
      name: name,
      email: email,
      phone: document.getElementById('clientPhone').value.trim(),
      address: document.getElementById('clientAddress').value.trim(),
      description: document.getElementById('clientDesc').value.trim()
    };

    const isEdit = !!this.editId;
    if (isEdit) payload.id = this.editId;

    const url = isEdit ? `${BASE_URL}/client/update.php` : `${BASE_URL}/client/create.php`;
    document.getElementById('saveBtnText').textContent = 'Menyimpan...';

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        Toast.success(data.message);
        this.closeForm();
        this.loadClients();
      } else {
        Toast.error(data.message || 'Gagal menyimpan data');
        if (data.message && data.message.toLowerCase().includes('email')) {
          document.getElementById('clientEmail').classList.add('is-error');
          document.getElementById('emailError').textContent = data.message;
        }
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
    document.getElementById('deleteClientName').textContent = name;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDelete() {
    document.getElementById('modalDelete').classList.remove('active');
    this.deleteId = null;
  },

  async confirmDelete() {
    if (!this.deleteId) return;

    try {
      const res = await fetch(`${BASE_URL}/client/delete.php`, {
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
        this.loadClients();
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
  ClientPage.init();
});
