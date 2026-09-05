const ReportsPage = {
  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    this.bindEvents();
    this.loadProblematicAssets();
  },

  bindEvents() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.borderBottomColor = 'transparent';
          b.style.color = 'var(--gray-500)';
        });
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        const target = e.target;
        target.classList.add('active');
        target.style.borderBottomColor = 'var(--primary-600)';
        target.style.color = 'var(--primary-600)';
        
        const tabId = target.getAttribute('data-tab');
        document.getElementById('tab-' + tabId).style.display = 'block';

        if (tabId === 'problematic-assets') {
          this.loadProblematicAssets();
        } else if (tabId === 'cost-validation') {
          this.loadCostValidations();
        }
      });
    });

    const filterStatus = document.getElementById('filterValidationStatus');
    if (filterStatus) {
       filterStatus.addEventListener('change', () => {
         this.loadCostValidations();
       });
    }
  },

  async loadProblematicAssets() {
    try {
      const res = await fetch(`${BASE_URL}/reports/problematic_assets.php`, { 
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` } 
      });
      const data = await res.json();
      
      const tbody = document.getElementById('problematicAssetsTableBody');
      if (data.success) {
        if (!data.data.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Tidak ada aset bermasalah saat ini</td></tr>';
          return;
        }

        const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
        
        tbody.innerHTML = data.data.map(a => `
          <tr>
            <td><strong>${a.asset_code}</strong></td>
            <td><strong>${a.name}</strong></td>
            <td>${a.category_name} / ${a.brand_name}</td>
            <td><span class="badge" style="background:#fee2e2; color:#b91c1c">${a.total_tickets} Tiket</span></td>
            <td>${formatCurrency(a.total_maintenance_cost)}</td>
            <td>${this.getStatusBadge(a.status)}</td>
          </tr>
        `).join('');
      } else {
        Toast.error(data.message || 'Gagal memuat data aset bermasalah');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    }
  },

  async loadCostValidations() {
    try {
      const status = document.getElementById('filterValidationStatus').value;
      const res = await fetch(`${BASE_URL}/reports/cost_validations.php?status=${status}`, { 
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` } 
      });
      const data = await res.json();
      
      const tbody = document.getElementById('costValidationTableBody');
      if (data.success) {
        if (!data.data.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Tidak ada data biaya maintenance</td></tr>';
          return;
        }

        const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
        const userRole = Storage.getUser()?.role || '';
        const canValidate = (userRole === 'admin' || userRole === 'super_admin');
        
        tbody.innerHTML = data.data.map(m => {
          let btn = '';
          if (m.validation_status === 'validated') {
            btn = `<span style="color: var(--success); font-weight: 600;"><i class="fa-solid fa-check-circle"></i> Tervalidasi</span>`;
          } else if (m.validation_status === 'rejected') {
            btn = `<span style="color: var(--danger); font-weight: 600;"><i class="fa-solid fa-xmark-circle"></i> Ditolak</span>
                   <div style="font-size: 0.8rem; color: var(--danger); margin-top: 4px;">${m.validation_notes || 'Tidak valid'}</div>`;
          } else {
            if (canValidate) {
               btn = `<div style="display:flex; gap:4px;">
                        <button class="btn btn-sm btn-primary" onclick="ReportsPage.validateCost(${m.id})"><i class="fa-solid fa-check"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="ReportsPage.openRejectModal(${m.id})"><i class="fa-solid fa-xmark"></i></button>
                      </div>`;
            } else {
               btn = `<span style="color: var(--warning); font-weight: 600;"><i class="fa-solid fa-clock"></i> Menunggu</span>`;
            }
          }

          return `
          <tr>
            <td><strong>${new Date(m.schedule).toLocaleDateString('id-ID')}</strong></td>
            <td>
              <strong>${m.asset_name}</strong> (${m.asset_code})
              <div style="font-size:0.8rem; color:var(--gray-500); margin-top:4px;">${m.notes || '-'}</div>
            </td>
            <td>${m.technician_name}</td>
            <td><strong>${formatCurrency(m.cost)}</strong></td>
            <td>${btn}</td>
          </tr>
        `}).join('');
      } else {
        Toast.error(data.message || 'Gagal memuat data validasi biaya');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    }
  },

  async validateCost(id) {
    if (!confirm('Apakah Anda yakin data biaya ini sudah benar dan valid?')) return;
    
    try {
      const res = await fetch(`${BASE_URL}/reports/validate_cost.php`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}` 
        },
        body: JSON.stringify({ id, action: 'approve' })
      });
      const data = await res.json();
      
      if (data.success) {
        Toast.success('Biaya berhasil divalidasi');
        this.loadCostValidations();
      } else {
        Toast.error(data.message || 'Gagal memvalidasi');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    }
  },

  openRejectModal(id) {
    document.getElementById('rejectMaintenanceId').value = id;
    document.getElementById('rejectNotes').value = '';
    document.getElementById('rejectModal').classList.add('active');
  },

  closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
  },

  async submitReject() {
    const id = document.getElementById('rejectMaintenanceId').value;
    const notes = document.getElementById('rejectNotes').value.trim();
    
    if (!notes) {
      Toast.error('Alasan penolakan wajib diisi');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/reports/validate_cost.php`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}` 
        },
        body: JSON.stringify({ id, action: 'reject', notes })
      });
      const data = await res.json();
      
      if (data.success) {
        Toast.success('Data biaya berhasil ditolak');
        this.closeRejectModal();
        this.loadCostValidations();
      } else {
        Toast.error(data.message || 'Gagal menolak data');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    }
  },

  getStatusBadge(status) {
    const s = String(status).toLowerCase();
    if (s === 'active') return '<span class="badge" style="background:#d1fae5; color:#047857">Aktif</span>';
    if (s === 'in_maintenance') return '<span class="badge" style="background:#fef3c7; color:#b45309">Maintenance</span>';
    if (s === 'broken') return '<span class="badge" style="background:#fee2e2; color:#b91c1c">Rusak</span>';
    if (s === 'retired') return '<span class="badge" style="background:#f3f4f6; color:#374151">Pensiun</span>';
    return `<span class="badge">${status}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ReportsPage.init();
});
