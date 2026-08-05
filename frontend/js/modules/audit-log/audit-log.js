const AuditLogPage = {
  currentPage: 1,
  limit: 20,
  dataList: [],

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn(e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn(e); }

    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadLogs(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadLogs());
    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());
    document.getElementById('btnClearLog').addEventListener('click', () => this.clearLogs());
    const user = Storage.getUser();
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      const btnClear = document.getElementById('btnClearLog');
      if (btnClear) btnClear.style.display = 'none';
    }

    this.loadLogs();
  },

  async loadLogs() {
    const tbody = document.querySelector('#auditTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>';

    const token = Storage.getToken();
    const search = document.getElementById('searchInput').value;
    
    const BASE_URL = window.location.origin + '/Project%20A/backend/api';
    try {
      const response = await fetch(`${BASE_URL}/audit/get.php?page=${this.currentPage}&limit=${this.limit}&search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        this.dataList = result.data;
        this.renderTable(result.data);
        this.renderPagination(result.pagination);
      } else {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat log</td></tr>`;
      }
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Terjadi kesalahan sistem</td></tr>`;
    }
  },

  renderTable(data) {
    const tbody = document.querySelector('#auditTable tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Tidak ada riwayat audit.</td></tr>`;
      return;
    }

    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('id-ID');
      let actionBadge = '';
      if(log.action.toLowerCase() === 'create') actionBadge = '<span class="status-badge" style="background:#d1fae5; color:#059669;">CREATE</span>';
      else if(log.action.toLowerCase() === 'update') actionBadge = '<span class="status-badge" style="background:#fef08a; color:#b45309;">UPDATE</span>';
      else if(log.action.toLowerCase() === 'delete') actionBadge = '<span class="status-badge" style="background:#fee2e2; color:#dc2626;">DELETE</span>';
      else if(log.action.toLowerCase() === 'login') actionBadge = '<span class="status-badge" style="background:#dbeafe; color:#2563eb;">LOGIN</span>';
      else actionBadge = `<span class="status-badge bg-secondary">${log.action.toUpperCase()}</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space:nowrap; font-size:0.85rem; color:#64748b;">${date}</td>
        <td><strong>${log.user_name || 'System'}</strong></td>
        <td><span style="font-weight:600; color:#3b82f6;">${log.module.toUpperCase()}</span></td>
        <td>${actionBadge}</td>
        <td>${log.detail || '-'}</td>
        <td style="font-family:monospace; font-size:0.8rem;">${log.ip_address || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderPagination(pagination) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    
    if (pagination.last_page <= 1) return;

    for (let i = 1; i <= pagination.last_page; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-outline ${i === this.currentPage ? 'bg-primary text-white' : ''}`;
      btn.style.padding = '5px 10px';
      btn.textContent = i;
      btn.onclick = () => {
        this.currentPage = i;
        this.loadLogs();
      };
      container.appendChild(btn);
    }
  },

  exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Laporan Audit Log', 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 26);

    const tableData = this.dataList.map(log => [
      new Date(log.created_at).toLocaleString('id-ID'),
      log.user_name || 'System',
      log.module.toUpperCase(),
      log.action.toUpperCase(),
      log.detail || '-',
      log.ip_address || '-'
    ]);

    doc.autoTable({
      head: [['Waktu', 'Pengguna', 'Modul', 'Aksi', 'Detail', 'IP Address']],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Audit_Log.pdf');
  },

  async clearLogs() {
    if (!confirm('PERINGATAN: Anda yakin ingin menghapus seluruh riwayat Audit Log? Tindakan ini tidak dapat dibatalkan.')) return;

    const BASE_URL = window.location.origin + '/Project%20A/backend/api';
    try {
      const res = await fetch(`${BASE_URL}/audit/clear.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Storage.getToken()}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        this.currentPage = 1;
        this.loadLogs();
      } else {
        alert(data.message || 'Gagal menghapus log');
      }
    } catch (e) {
      console.error(e);
      alert('Kesalahan jaringan');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuditLogPage.init();
});
