const TicketPage = {

  currentPage: 1,
  deleteId: null,
  editId: null,
  eventsBound: false,
  lookupsLoaded: false,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    
    this.loadTickets();
    this.bindEvents();
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadTickets(); });
    document.getElementById('filterStatus').addEventListener('change', () => { this.currentPage = 1; this.loadTickets(); });
    document.getElementById('filterPriority').addEventListener('change', () => { this.currentPage = 1; this.loadTickets(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadTickets());
    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());
    
    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveTicket());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());
    
    const btnSend = document.getElementById('btnSendComment');
    if (btnSend) {
      btnSend.addEventListener('click', () => this.sendComment());
    }
  },

  async loadLookups() {
    if (this.lookupsLoaded) return;
    try {
      const [assetRes, clientRes, userRes] = await Promise.all([
        fetch(`${BASE_URL}/asset/get.php?limit=1000`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } }),
        fetch(`${BASE_URL}/client/get.php?limit=1000`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } }),
        fetch(`${BASE_URL}/user/get.php?limit=1000`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } })
      ]);

      const assetData = await assetRes.json();
      const clientData = await clientRes.json();
      const userData = await userRes.json();

      this.populateSelect('ticketAsset', assetData.data, 'name', 'asset_code');
      this.populateSelect('ticketClient', clientData.data, 'name');
      this.populateSelect('ticketAssigned', userData.data, 'name', 'role');
      
      this.lookupsLoaded = true;
    } catch (e) {
      console.error('Failed to load lookups', e);
      Toast.error('Gagal memuat opsi form');
    }
  },

  populateSelect(elementId, data, labelKey, subLabelKey = null) {
    const el = document.getElementById(elementId);
    if (!el || !data) return;
    
    const placeholder = el.options[0].outerHTML;
    el.innerHTML = placeholder + data.map(item => {
      let label = item[labelKey];
      if (subLabelKey && item[subLabelKey]) {
        label += ` (${item[subLabelKey]})`;
      }
      return `<option value="${item.id}">${this.escapeHtml(label)}</option>`;
    }).join('');
  },

  async loadTickets() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    
    const params = new URLSearchParams({ 
      page: this.currentPage, 
      limit: 10, 
      search,
      status,
      priority
    });
    
    try {
      const res = await fetch(`${BASE_URL}/ticket/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.renderTable(data.data, data.pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat data tiket');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  renderBadge(type, value) {
    if (!value) return '<span class="text-gray-400">-</span>';
    let cls = `badge badge-${type}-${value.replace('_', '-')}`;
    let text = String(value).replace('_', ' ');
    
    if (type === 'status') {
      const statusMap = {
        'open': 'Open',
        'in_progress': 'In Progress',
        'resolved': 'Menunggu Klien',
        'closed': 'Selesai',
        'rejected': 'Ditolak'
      };
      if (statusMap[value]) text = statusMap[value];
    }
    
    return `<span class="${cls}">${text}</span>`;
  },

  renderTable(tickets, pagination) {
    const tbody = document.getElementById('ticketTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!tickets || !tickets.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Belum ada data tiket</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = tickets.map((t, i) => `
      <tr>
        <td><strong>${t.ticket_no}</strong></td>
        <td>${this.renderBadge('status', t.status)}</td>
        <td>${this.renderBadge('priority', t.priority)}</td>
        <td>
          <div class="line-clamp-2">${this.escapeHtml(t.description)}</div>
          <div class="ticket-meta">
            <i class="fa-solid fa-box-archive"></i> ${this.escapeHtml(t.asset_name || 'Tanpa Asset')}
            ${t.client_name ? `• <i class="fa-solid fa-building"></i> ${this.escapeHtml(t.client_name)}` : ''}
          </div>
        </td>
        <td>
          ${t.assigned_to 
            ? `<i class="fa-solid fa-user-circle"></i> ${this.escapeHtml(t.assigned_to)}` 
            : '<span class="text-gray-400">Belum ditugaskan</span>'}
        </td>
        <td>
          <div class="action-group">
            ${Storage.getUser()?.role === 'client' ? `
              <button class="btn btn-icon btn-edit btn-sm" onclick="TicketPage.openEdit(${t.id})" title="Lihat">
                <i class="fa-solid fa-eye"></i>
              </button>
            ` : `
              ${(t.status !== 'closed' && t.status !== 'resolved') ? `<button class="btn btn-icon btn-success btn-sm" onclick="TicketPage.quickStatus(${t.id}, 'resolved')" title="Selesai (Tunggu Klien)"><i class="fa-solid fa-check"></i></button>` : ''}
              ${t.status !== 'rejected' ? `<button class="btn btn-icon btn-reject btn-sm" onclick="TicketPage.quickStatus(${t.id}, 'rejected')" title="Tolak"><i class="fa-solid fa-xmark"></i></button>` : ''}
              <button class="btn btn-icon btn-edit btn-sm" onclick="TicketPage.openEdit(${t.id})" title="Edit">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-icon btn-delete btn-sm" onclick="TicketPage.openDelete(${t.id}, '${t.ticket_no}')" title="Hapus">
                <i class="fa-solid fa-trash"></i>
              </button>
            `}
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
        onclick="TicketPage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="TicketPage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="TicketPage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadTickets();
  },

  async openForm() {
    this.editId = null;
    document.getElementById('modalFormTitle').textContent = 'Buat Tiket Baru';
    document.getElementById('ticketForm').reset();
    document.getElementById('ticketId').value = '';
    
    document.getElementById('ticketPriority').value = 'medium';
    document.getElementById('ticketSeverity').value = 'minor';
    
    document.getElementById('descError').textContent = '';
    document.getElementById('ticketDesc').classList.remove('is-error');
    
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('commentsSection').style.display = 'none';
    
    document.getElementById('btnSaveForm').style.display = 'inline-block';
    document.getElementById('clientActionBox').style.display = 'none';
    
    // Pastikan semua input di-enable kembali setelah openEdit
    const inputs = ['ticketDesc', 'ticketPriority', 'ticketSeverity', 'ticketAsset', 'ticketClient', 'ticketAssigned', 'ticketStatus'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });
    
    if (Storage.getUser()?.role === 'client') {
      document.getElementById('ticketPriority').parentElement.style.display = 'none';
      document.getElementById('ticketSeverity').parentElement.style.display = 'none';
      document.getElementById('ticketAssigned').parentElement.style.display = 'none';
      document.getElementById('ticketClient').parentElement.style.display = 'none';
    } else {
      document.getElementById('ticketPriority').parentElement.style.display = 'block';
      document.getElementById('ticketSeverity').parentElement.style.display = 'block';
      document.getElementById('ticketAssigned').parentElement.style.display = 'block';
      document.getElementById('ticketClient').parentElement.style.display = 'block';
    }

    await this.loadLookups();
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    this.editId = id;
    document.getElementById('modalFormTitle').textContent = 'Edit Tiket';
    
    await this.loadLookups();

    try {
      const res = await fetch(`${BASE_URL}/ticket/get.php?search=`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      const t = data.data?.find(x => x.id === parseInt(id));
      if (!t) {
        Toast.error('Data tiket tidak ditemukan');
        return;
      }

      document.getElementById('ticketId').value = t.id;
      document.getElementById('ticketDesc').value = t.description || '';
      document.getElementById('ticketPriority').value = t.priority || 'medium';
      document.getElementById('ticketSeverity').value = t.severity || 'minor';
      
      document.getElementById('ticketAsset').value = t.asset_id || '';
      document.getElementById('ticketClient').value = t.client_id || '';
      document.getElementById('ticketAssigned').value = t.user_id || '';
      
      document.getElementById('statusGroup').style.display = 'block';
      document.getElementById('ticketStatus').value = t.status || 'open';
      
      document.getElementById('descError').textContent = '';
      document.getElementById('ticketDesc').classList.remove('is-error');
      
      
      document.getElementById('commentsSection').style.display = 'flex';
      
      let slaText = 'SLA: Aman';
      let slaColor = 'var(--success-600)';
      if (t.sla_status === 'warning') { slaText = 'SLA: Warning'; slaColor = 'var(--warning-600)'; }
      if (t.sla_status === 'breached') { slaText = 'SLA: Breached!'; slaColor = 'var(--danger-600)'; }
      document.getElementById('slaBadge').innerHTML = `<span style="font-size:0.8rem; font-weight:bold; color:white; background:${slaColor}; padding:3px 8px; border-radius:12px;">${slaText}</span>`;
      
      const isClient = Storage.getUser()?.role === 'client';
      const inputs = ['ticketDesc', 'ticketPriority', 'ticketSeverity', 'ticketAsset', 'ticketClient', 'ticketAssigned', 'ticketStatus'];
      
      if (isClient) {
        document.getElementById('btnSaveForm').style.display = 'none';
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.disabled = true;
        });
        
        document.getElementById('ticketPriority').parentElement.style.display = 'none';
        document.getElementById('ticketSeverity').parentElement.style.display = 'none';
        document.getElementById('ticketAssigned').parentElement.style.display = 'none';
        document.getElementById('ticketClient').parentElement.style.display = 'none';
        
        if (t.status === 'resolved') {
          document.getElementById('clientActionBox').style.display = 'block';
          document.getElementById('rejectBox').style.display = 'none';
          document.getElementById('rejectReason').value = '';
        } else {
          document.getElementById('clientActionBox').style.display = 'none';
        }
      } else {
        document.getElementById('btnSaveForm').style.display = 'inline-block';
        document.getElementById('clientActionBox').style.display = 'none';
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.disabled = false;
        });
        document.getElementById('ticketPriority').parentElement.style.display = 'block';
        document.getElementById('ticketSeverity').parentElement.style.display = 'block';
        document.getElementById('ticketAssigned').parentElement.style.display = 'block';
        document.getElementById('ticketClient').parentElement.style.display = 'block';
      }
      
      this.loadComments(id);
      
      document.getElementById('modalForm').classList.add('active');

    } catch (e) {
      Toast.error('Gagal memuat data');
      console.error(e);
    }
  },
  
  promptReject() {
    document.getElementById('rejectBox').style.display = 'block';
  },

  async clientAction(action) {
    if (!this.editId) return;
    
    let reason = '';
    if (action === 'reject') {
      reason = document.getElementById('rejectReason').value.trim();
      if (!reason) {
        Toast.error('Harap berikan alasan kenapa masalah belum selesai');
        return;
      }
    }
    
    try {
      const res = await fetch(`${BASE_URL}/ticket/client_action.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}`
        },
        body: JSON.stringify({
          id: this.editId,
          action: action,
          reason: reason
        })
      });
      const data = await res.json();
      if (data.success) {
        Toast.success('Tanggapan berhasil dikirim');
        document.getElementById('clientActionBox').style.display = 'none';
        this.loadComments(this.editId);
        this.loadTickets();
        if (action === 'accept') {
          document.getElementById('ticketStatus').value = 'closed';
        } else {
          document.getElementById('ticketStatus').value = 'in_progress';
        }
      } else {
        Toast.error(data.message || 'Gagal mengirim tanggapan');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
    }
  },

  async loadComments(ticketId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<div class="text-gray-400" style="text-align:center; margin-top:20px;">Memuat komentar...</div>';
    
    try {
      const res = await fetch(`${BASE_URL}/ticket/get_comments.php?ticket_id=${ticketId}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success) {
        list.innerHTML = `<div class="text-gray-400" style="text-align:center; margin-top:20px;">Gagal memuat komentar</div>`;
        return;
      }
      
      if (!data.data || data.data.length === 0) {
        list.innerHTML = `<div class="text-gray-400" style="text-align:center; font-size:0.9rem; margin-top:20px;">Belum ada diskusi</div>`;
        return;
      }
      
      list.innerHTML = data.data.map(c => {
        let attach = '';
        if (c.file_path) {
          attach = `<div style="margin-top:8px;"><a href="/Project%20A/${c.file_path}" target="_blank" style="font-size:0.8rem; color:var(--primary-600);"><i class="fa-solid fa-paperclip"></i> ${c.file_name}</a></div>`;
        }
        return `
          <div style="background:var(--gray-50); padding:10px 15px; border-radius:8px; border:1px solid var(--gray-200);">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <strong style="font-size:0.85rem; color:var(--gray-800);">${this.escapeHtml(c.user_name)}</strong>
              <small style="color:var(--gray-500); font-size:0.75rem;">${c.created_at}</small>
            </div>
            <div style="font-size:0.9rem; color:var(--gray-700); white-space:pre-wrap;">${this.escapeHtml(c.message)}</div>
            ${attach}
          </div>
        `;
      }).join('');
      
      list.scrollTop = list.scrollHeight;
      
    } catch (e) {
      console.error(e);
      list.innerHTML = `<div class="text-gray-400" style="text-align:center; margin-top:20px;">Error jaringan</div>`;
    }
  },

  async sendComment() {
    if (!this.editId) return;
    const msgInput = document.getElementById('commentMessage');
    const fileInput = document.getElementById('commentAttachment');
    const btn = document.getElementById('btnSendComment');
    
    const message = msgInput.value.trim();
    if (!message) return;
    
    btn.disabled = true;
    btn.innerHTML = 'Mngirim...';
    
    const fd = new FormData();
    fd.append('ticket_id', this.editId);
    fd.append('message', message);
    if (fileInput.files[0]) {
      fd.append('attachment', fileInput.files[0]);
    }
    
    try {
      const res = await fetch(`${BASE_URL}/ticket/add_comment.php`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` },
        body: fd
      });
      const data = await res.json();
      
      if (data.success) {
        msgInput.value = '';
        fileInput.value = '';
        this.loadComments(this.editId);
      } else {
        Toast.error(data.message || 'Gagal mengirim komentar');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim';
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
  },

  async saveTicket() {
    const desc = document.getElementById('ticketDesc').value.trim();
    if (!desc) {
      document.getElementById('ticketDesc').classList.add('is-error');
      document.getElementById('descError').textContent = 'Deskripsi tiket wajib diisi';
      return;
    }
    
    document.getElementById('ticketDesc').classList.remove('is-error');
    document.getElementById('descError').textContent = '';

    const payload = {
      description: desc,
      priority: document.getElementById('ticketPriority').value,
      severity: document.getElementById('ticketSeverity').value,
      asset_id: document.getElementById('ticketAsset').value || null,
      client_id: document.getElementById('ticketClient').value || null,
      user_id: document.getElementById('ticketAssigned').value || null
    };

    const isEdit = !!this.editId;
    if (isEdit) {
      payload.id = this.editId;
      payload.status = document.getElementById('ticketStatus').value;
    }

    const url = isEdit ? `${BASE_URL}/ticket/update.php` : `${BASE_URL}/ticket/create.php`;
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
        this.loadTickets();
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
  
  async quickStatus(id, status) {
    try {
      const res = await fetch(`${BASE_URL}/ticket/update_status.php`, {
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
        this.loadTickets();
      } else {
        Toast.error(data.message || 'Gagal memperbarui status');
      }
    } catch (e) {
      Toast.error('Gagal memperbarui status');
      console.error(e);
    }
  },

  openDelete(id, ticketNo) {
    this.deleteId = id;
    document.getElementById('deleteTicketNo').textContent = ticketNo;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDelete() {
    document.getElementById('modalDelete').classList.remove('active');
    this.deleteId = null;
  },

  async confirmDelete() {
    if (!this.deleteId) return;

    try {
      const res = await fetch(`${BASE_URL}/ticket/delete.php`, {
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
        this.loadTickets();
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
      const status = document.getElementById('filterStatus').value;
      
      const params = new URLSearchParams({ page: 1, limit: 1000, search, status });
      const res = await fetch(`${BASE_URL}/ticket/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data.length) {
        Toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const tableData = data.data.map((t, i) => {
        const date = new Date(t.created_at).toLocaleDateString('id-ID');
        return [
          i + 1,
          t.ticket_no,
          date,
          t.asset_code ? `${t.asset_code} - ${t.asset_name}` : '-',
          t.client_name || '-',
          t.priority.toUpperCase(),
          t.status.toUpperCase(),
          t.assignee_name || '-'
        ];
      });

      const headers = ['No', 'No. Tiket', 'Tanggal', 'Aset', 'Klien', 'Prioritas', 'Status', 'Teknisi'];
      PDFExport.exportProfessionalPDF('Laporan Data Tiket', headers, tableData, 'Laporan_Tiket.pdf');
    } catch (e) {
      Toast.error('Gagal mengekspor PDF');
      console.error(e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  TicketPage.init();
});
