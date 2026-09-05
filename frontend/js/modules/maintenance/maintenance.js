const MaintenancePage = {

  currentPage: 1,
  editId: null,
  eventsBound: false,
  lookupsLoaded: false,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    
    this.loadMaintenances();
    this.bindEvents();
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadMaintenances(); });
    document.getElementById('filterStatus').addEventListener('change', () => { this.currentPage = 1; this.loadMaintenances(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadMaintenances());
    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());
    
    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveMaintenance());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.executeDelete());

    document.getElementById('maintenanceCost').addEventListener('input', function(e) {
      let val = this.value.replace(/\D/g, '');
      if (val) {
        this.value = parseInt(val, 10).toLocaleString('id-ID');
      } else {
        this.value = '';
      }
    });
  },
  
  async loadLookups() {
    if (this.lookupsLoaded) return;
    try {
      const [resAsset, resUser] = await Promise.all([
        fetch(`${BASE_URL}/asset/get.php?limit=1000`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } }),
        fetch(`${BASE_URL}/user/get.php?limit=1000`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } })
      ]);
      const [dataAsset, dataUser] = await Promise.all([resAsset.json(), resUser.json()]);

      if (dataAsset.success) {
        const sel = document.getElementById('assetId');
        dataAsset.data.forEach(a => {
          sel.insertAdjacentHTML('beforeend', `<option value="${a.id}">${a.asset_code} - ${this.escapeHtml(a.name)}</option>`);
        });
      }
      
      if (dataUser.success) {
        const sel = document.getElementById('technicianId');
        dataUser.data.forEach(u => {
          sel.insertAdjacentHTML('beforeend', `<option value="${u.id}">${this.escapeHtml(u.name)} (${u.role})</option>`);
        });
      }

      this.lookupsLoaded = true;
    } catch (e) {
      console.error('Failed to load lookups', e);
    }
  },

  async loadMaintenances() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('filterStatus').value;
    
    const params = new URLSearchParams({ 
      page: this.currentPage, 
      limit: 10, 
      search,
      status
    });
    
    try {
      const res = await fetch(`${BASE_URL}/maintenance/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.renderTable(data.data, data.pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat data jadwal');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },
  
  renderBadge(status) {
    if (!status) return '-';
    let cls = `badge-status-${status.replace('_', '-')}`;
    
    const statusMap = {
      'scheduled': 'Dijadwalkan',
      'in_progress': 'Dalam Proses',
      'done': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    
    return `<span class="badge ${cls}">${statusMap[status] || status}</span>`;
  },

  renderTable(maintenances, pagination) {
    const tbody = document.getElementById('maintenanceTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!maintenances || !maintenances.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Belum ada data jadwal perawatan</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = maintenances.map((m, i) => {
      let date = new Date(m.schedule).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      
      return `
        <tr>
          <td><strong>${date}</strong></td>
          <td>${this.renderBadge(m.status)}</td>
          <td>
            <strong>${this.escapeHtml(m.asset_name || 'Tanpa Asset')}</strong>
            <div class="ticket-meta">${this.escapeHtml(m.asset_code)}</div>
            ${m.notes ? `<div class="line-clamp-2 mt-1" style="font-size:0.8rem">${this.escapeHtml(m.notes)}</div>` : ''}
          </td>
          <td>
            ${m.technician 
              ? `<i class="fa-solid fa-user-circle"></i> ${this.escapeHtml(m.technician)}` 
              : '<span class="text-gray-400">Belum ditugaskan</span>'}
          </td>
          <td>
            <div class="action-group">
              <button class="btn btn-icon btn-success btn-sm" onclick="MaintenancePage.quickStatus(${m.id}, 'done')" title="Tandai Selesai" ${m.status === 'done' || m.status === 'cancelled' ? 'disabled style="opacity:0.5"' : ''}>
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="btn btn-icon btn-sm" onclick="MaintenancePage.quickStatus(${m.id}, 'cancelled')" title="Batalkan Jadwal" style="color: var(--danger); background: rgba(239, 68, 68, 0.1);" ${m.status === 'done' || m.status === 'cancelled' ? 'disabled style="opacity:0.5"' : ''}>
                <i class="fa-solid fa-xmark"></i>
              </button>
              <button class="btn btn-icon btn-edit btn-sm" onclick="MaintenancePage.openEdit(${m.id})" title="Edit">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-icon btn-delete btn-sm" onclick="MaintenancePage.confirmDelete(${m.id})" title="Hapus" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const end = Math.min(start + pagination.per_page - 1, pagination.total);
    document.getElementById('tableInfo').textContent = `Menampilkan ${start}–${end} dari ${pagination.total} data`;
    this.renderPagination(pagination);
  },

  escapeHtml(text) {
    if (!text) return '';
    return text.toString()
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
        onclick="MaintenancePage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="MaintenancePage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="MaintenancePage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadMaintenances();
  },

  clearErrors() {
    ['assetError', 'scheduleError'].forEach(id => document.getElementById(id).textContent = '');
    ['assetId', 'scheduleDate'].forEach(id => document.getElementById(id).classList.remove('is-error'));
  },

  async openForm() {
    this.editId = null;
    document.getElementById('modalFormTitle').textContent = 'Buat Jadwal Perawatan';
    document.getElementById('maintenanceForm').reset();
    document.getElementById('maintenanceId').value = '';
    
    document.getElementById('statusGroup').style.display = 'none';
    
    this.clearErrors();
    await this.loadLookups();
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    this.editId = id;
    document.getElementById('modalFormTitle').textContent = 'Ubah Jadwal & Status';
    this.clearErrors();
    document.getElementById('maintenanceForm').reset();
    
    document.getElementById('statusGroup').style.display = 'block';

    await this.loadLookups();

    try {
      const res = await fetch(`${BASE_URL}/maintenance/get.php?search=`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      const m = data.data?.find(x => x.id === parseInt(id));
      if (!m) {
        Toast.error('Data tidak ditemukan');
        return;
      }

      document.getElementById('maintenanceId').value = m.id;
      document.getElementById('assetId').value = m.asset_id || '';
      document.getElementById('technicianId').value = m.user_id || '';
      
      if (m.schedule) {
        const d = new Date(m.schedule);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        document.getElementById('scheduleDate').value = `${yyyy}-${mm}-${dd}`;
      }
      
      document.getElementById('maintenanceStatus').value = m.status;
      document.getElementById('maintenanceCost').value = m.cost ? parseInt(m.cost, 10).toLocaleString('id-ID') : '';
      document.getElementById('maintenanceNotes').value = m.notes || '';
      
      document.getElementById('modalForm').classList.add('active');

    } catch (e) {
      Toast.error('Gagal memuat data');
      console.error(e);
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
    document.getElementById('maintenanceForm').reset();
    this.currentId = null;
  },

  confirmDelete(id) {
    this.currentId = id;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDeleteModal() {
    document.getElementById('modalDelete').classList.remove('active');
    this.currentId = null;
  },

  async executeDelete() {
    if (!this.currentId) return;
    const btn = document.getElementById('btnConfirmDelete');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghapus...';
    btn.disabled = true;

    try {
      const response = await fetch(`${BASE_URL}/maintenance/delete.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}`
        },
        body: JSON.stringify({ id: this.currentId })
      });
      const result = await response.json();
      if (result.success) {
        Toast.success('Jadwal berhasil dihapus');
        this.closeDeleteModal();
        this.loadMaintenances();
      } else {
        Toast.error(result.message || 'Gagal menghapus jadwal');
      }
    } catch (e) {
      Toast.error('Terjadi kesalahan sistem');
    } finally {
      btn.innerHTML = 'Ya, Hapus';
      btn.disabled = false;
    }
  },

  async saveMaintenance() {
    this.clearErrors();
    let hasError = false;

    const asset_id = document.getElementById('assetId').value;
    const schedule = document.getElementById('scheduleDate').value;
    const user_id = document.getElementById('technicianId').value;
    const status = document.getElementById('maintenanceStatus').value;
    const costRaw = document.getElementById('maintenanceCost').value.replace(/\D/g, '');
    const cost = costRaw ? parseInt(costRaw, 10) : 0;
    const notes = document.getElementById('maintenanceNotes').value;

    if (!asset_id) {
      document.getElementById('assetId').classList.add('is-error');
      document.getElementById('assetError').textContent = 'Pilih aset terlebih dahulu';
      hasError = true;
    }
    
    if (!schedule) {
      document.getElementById('scheduleDate').classList.add('is-error');
      document.getElementById('scheduleError').textContent = 'Tanggal wajib diisi';
      hasError = true;
    }

    if (hasError) return;

    const payload = {
      asset_id: parseInt(asset_id),
      user_id: user_id ? parseInt(user_id) : null,
      schedule: schedule,
      cost: cost,
      notes: notes
    };

    if (this.editId) {
      payload.id = this.editId;
      payload.status = status;
    }

    const url = this.editId ? `${BASE_URL}/maintenance/update.php` : `${BASE_URL}/maintenance/create.php`;
    document.getElementById('saveBtnText').textContent = 'Menyimpan...';
    document.getElementById('btnSaveForm').disabled = true;

    try {
      const method = this.editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method: method,
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
        this.loadMaintenances();
      } else {
        Toast.error(data.message || 'Gagal menyimpan data');
      }
    } catch (e) {
      Toast.error('Terjadi kesalahan sistem');
      console.error(e);
    } finally {
      document.getElementById('saveBtnText').textContent = 'Simpan';
      document.getElementById('btnSaveForm').disabled = false;
    }
  },
  
  async quickStatus(id, status) {
    if (status === 'cancelled') {
      if (!confirm('Yakin ingin membatalkan jadwal ini?')) return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/maintenance/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}`
        },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      
      if (data.success) {
        Toast.success(data.message);
        this.loadMaintenances();
      } else {
        Toast.error(data.message || 'Gagal memperbarui status');
      }
    } catch (e) {
      Toast.error('Gagal memperbarui status');
      console.error(e);
    }
  },

  async exportPDF() {
    try {
      const search = document.getElementById('searchInput').value;
      const status = document.getElementById('filterStatus').value;
      
      const params = new URLSearchParams({ page: 1, limit: 1000, search, status });
      const res = await fetch(`${BASE_URL}/maintenance/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data.length) {
        Toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const tableData = data.data.map((m, i) => {
        const scheduleDate = new Date(m.schedule).toLocaleDateString('id-ID');
        return [
          i + 1,
          scheduleDate,
          m.asset_code ? `${m.asset_code} - ${m.asset_name}` : '-',
          m.technician || '-',
          statusMap[m.status] || m.status,
          m.notes || '-'
        ];
      });

      const headers = ['No', 'Tanggal', 'Aset', 'Klien', 'Tipe', 'Status', 'Teknisi'];
      PDFExport.exportProfessionalPDF('Laporan Jadwal Maintenance', headers, tableData, 'Laporan_Maintenance.pdf');
    } catch (e) {
      Toast.error('Gagal mengekspor PDF');
      console.error(e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MaintenancePage.init();
});
