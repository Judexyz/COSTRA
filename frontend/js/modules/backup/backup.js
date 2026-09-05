const Backup = {
  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn(e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn(e); }
    
    const user = Storage.getUser();
    if (user) {
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userRole').textContent = user.role;
      document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        Toast.show('Anda tidak memiliki akses ke halaman ini', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
      }
    }

    document.getElementById('btnRefresh').addEventListener('click', () => this.loadBackups());
    document.getElementById('btnRunArchive').addEventListener('click', () => this.runArchive());

    this.loadBackups();
  },

  formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  async loadBackups() {
    const tbody = document.querySelector('#backupsTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat data...</td></tr>';
    
    try {
      const response = await fetch(`${BASE_URL}/backup/list.php`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const res = await response.json();
      
      if (res.success) {
        this.renderTable(res.data);
      } else {
        Toast.show(res.message || 'Gagal memuat daftar backup', 'error');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Gagal memuat data</td></tr>';
      }
    } catch (error) {
      Toast.show('Terjadi kesalahan koneksi', 'error');
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Terjadi kesalahan</td></tr>';
    }
  },

  renderTable(files) {
    const tbody = document.querySelector('#backupsTable tbody');
    tbody.innerHTML = '';

    if (!files || files.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada file backup tersedia</td></tr>';
      return;
    }

    files.forEach((file, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${file.filename}</strong></td>
        <td>${this.formatBytes(file.size)}</td>
        <td>${this.formatDate(file.created_at)}</td>
        <td class="text-right">
          <div class="action-group" style="justify-content: flex-end;">
            <button class="btn btn-outline btn-sm" onclick="Backup.download('${file.filename}')" title="Download JSON">
              <i class="fa-solid fa-file-code"></i> JSON
            </button>
            <button class="btn btn-danger btn-sm" onclick="Backup.downloadPDF('${file.filename}')" title="Download PDF">
              <i class="fa-solid fa-file-pdf"></i> PDF
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  download(filename) {
    const token = Storage.getToken();
    if (!token) {
      Toast.show('Anda harus login', 'error');
      return;
    }
    const url = `/Project A/backend/api/backup/download.php?file=${encodeURIComponent(filename)}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  },

  async downloadPDF(filename) {
    const token = Storage.getToken();
    if (!token) {
      Toast.show('Anda harus login', 'error');
      return;
    }

    Toast.show('Menyiapkan file PDF, mohon tunggu...', 'info');

    try {
      const url = `${BASE_URL}/backup/download.php?file=${encodeURIComponent(filename)}&token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file backup JSON');
      }

      const jsonData = await response.json();
      
      if (!jsonData.data || jsonData.data.length === 0) {
        Toast.show('Tidak ada data tiket dalam file backup ini', 'warning');
        return;
      }

      const tableData = jsonData.data.map(t => [
        t.ticket_number || '-',
        this.formatDate(t.created_at),
        t.description ? (t.description.length > 80 ? t.description.substring(0, 80) + '...' : t.description) : '-',
        t.priority ? t.priority.toUpperCase() : '-',
        t.severity ? t.severity.toUpperCase() : '-',
        t.status ? t.status.toUpperCase() : '-'
      ]);

      doc.autoTable({
        startY: 28,
        head: [['No Tiket', 'Tanggal', 'Deskripsi', 'Prioritas', 'Dampak', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }, 
        styles: { fontSize: 8 }
      });

      doc.save(filename.replace('.json', '.pdf'));
      Toast.show('File PDF berhasil diunduh', 'success');

    } catch (error) {
      console.error('PDF Generation Error:', error);
      Toast.show('Gagal menghasilkan file PDF', 'error');
    }
  },

  async runArchive() {
    if (!confirm('Peringatan: Tiket yang berumur lebih dari 6 bulan akan di-backup ke file JSON dan DIHAPUS PERMANEN dari database. Angka di Dashboard Anda mungkin akan berubah.\n\nApakah Anda yakin ingin menjalankan proses arsip sekarang?')) {
      return;
    }

    const btn = document.getElementById('btnRunArchive');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
      const response = await fetch(`${BASE_URL}/backup/archive.php`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const res = await response.json();
      
      if (res.success) {
        Toast.show(res.message, 'success');
        this.loadBackups(); 
      } else {
        Toast.show(res.message || 'Gagal mengarsipkan tiket', 'error');
      }
    } catch (error) {
      Toast.show('Terjadi kesalahan saat memproses arsip', 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Backup.init());
