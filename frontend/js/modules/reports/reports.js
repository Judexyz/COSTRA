const ReportsPage = {

  charts: {},

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('filterStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('filterEndDate').value = today.toISOString().split('T')[0];

    this.bindEvents();
    this.loadData();
    this.loadMaintenanceDetail();
  },

  bindEvents() {
    document.getElementById('btnApplyFilter').addEventListener('click', () => {
      this.loadData();
      this.loadMaintenanceDetail();
    });
    document.getElementById('btnResetFilter').addEventListener('click', () => {
      document.getElementById('filterStartDate').value = '';
      document.getElementById('filterEndDate').value = '';
      this.loadData();
      this.loadMaintenanceDetail();
    });

    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());
    document.getElementById('btnExportExcel').addEventListener('click', () => this.exportExcel());
    document.getElementById('btnExportMaintenanceExcel').addEventListener('click', () => this.exportMaintenanceExcel());
  },

  async loadData() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    
    let query = '';
    if (startDate) query += `start_date=${startDate}&`;
    if (endDate) query += `end_date=${endDate}`;

    try {
      const [summaryRes, chartRes] = await Promise.all([
        fetch(`${BASE_URL}/reports/summary.php?${query}`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } }),
        fetch(`${BASE_URL}/reports/chart_data.php?${query}`, { headers: { 'Authorization': `Bearer ${Storage.getToken()}` } })
      ]);

      const summaryData = await summaryRes.json();
      const chartData = await chartRes.json();

      if (summaryData.success) {
        this.renderSummary(summaryData.data);
      }
      
      if (chartData.success) {
        this.renderCharts(chartData.data);
      }

    } catch (e) {
      console.error('Gagal memuat laporan', e);
      Toast.error('Gagal memuat data laporan');
    }
  },

  renderSummary(data) {
    document.getElementById('statTotalIncident').textContent = data.incidents?.total || 0;
    document.getElementById('statTotalRequest').textContent = data.service_requests?.total || 0;
    document.getElementById('statTotalMaintenance').textContent = data.maintenances?.total || 0;
    document.getElementById('statTotalAsset').textContent = data.assets?.total || 0;
  },

  renderCharts(data) {
    this.createStatusChart('incidentStatusChart', data.incidents_by_status || []);
    this.createStatusChart('maintenanceStatusChart', data.maintenance_by_status || []);
    this.createBarChart('topCauseChart', data.top_causes, 'name', 'count', 'Frekuensi', '#f59e0b');
  },

  createStatusChart(canvasId, dataArray) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const colorMap = {
      'open': '#3b82f6',
      'scheduled': '#3b82f6',
      'in_progress': '#f59e0b',
      'progress': '#f59e0b',
      'assigned': '#f59e0b',
      'done': '#10b981',
      'solved': '#10b981',
      'closed': '#10b981',
      'cancelled': '#ef4444',
      'rejected': '#ef4444'
    };

    const labels = dataArray.map(item => String(item.status).toUpperCase());
    const data = dataArray.map(item => parseInt(item.count));
    const bgColors = dataArray.map(item => {
      const st = String(item.status).toLowerCase();
      return colorMap[st] || '#3b82f6';
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Jumlah',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 4,
          maxBarThickness: 80
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  createBarChart(canvasId, dataArray, labelKey, dataKey, datasetLabel, color = '#3b82f6') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = dataArray.map(item => String(item[labelKey]).toUpperCase());
    const data = dataArray.map(item => item[dataKey]);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: datasetLabel,
          data: data,
          backgroundColor: color,
          borderRadius: 4,
          maxBarThickness: 80
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  async exportPDF() {
    Toast.success('Memulai export PDF...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    
    doc.setFontSize(18);
    doc.text('Ringkasan Laporan Sistem', 40, 40);
    doc.setFontSize(11);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 40, 60);

    const sd = document.getElementById('filterStartDate').value || '-';
    const ed = document.getElementById('filterEndDate').value || '-';
    doc.text(`Periode: ${sd} s/d ${ed}`, 40, 75);

    doc.setFontSize(14);
    doc.text('Metrik Utama', 40, 110);
    
    const inc = document.getElementById('statTotalIncident').textContent;
    const req = document.getElementById('statTotalRequest').textContent;
    const mnt = document.getElementById('statTotalMaintenance').textContent;
    const ast = document.getElementById('statTotalAsset').textContent;

    doc.autoTable({
      startY: 130,
      head: [['Kategori', 'Total']],
      body: [
        ['Insiden', inc],
        ['Service Request', req],
        ['Maintenance', mnt],
        ['Aset Aktif', ast]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Laporan_Ringkasan.pdf');
  },

  exportExcel() {
    Toast.success('Memulai export Excel...');
    
    const inc = document.getElementById('statTotalIncident').textContent;
    const req = document.getElementById('statTotalRequest').textContent;
    const mnt = document.getElementById('statTotalMaintenance').textContent;
    const ast = document.getElementById('statTotalAsset').textContent;

    const ws_data = [
      ['Kategori', 'Total'],
      ['Insiden', inc],
      ['Service Request', req],
      ['Maintenance', mnt],
      ['Aset Aktif', ast]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ringkasan Laporan");
    
    XLSX.writeFile(wb, "Laporan_Ringkasan.xlsx");
  },


  async loadMaintenanceDetail(page = 1) {
    try {
      const start = document.getElementById('filterStartDate').value;
      const end = document.getElementById('filterEndDate').value;
      
      const params = new URLSearchParams({ page, limit: 10 });
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);

      const res = await fetch(`${BASE_URL}/reports/maintenance_detail.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.renderMaintenanceTable(data.data, data.pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat detail maintenance');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Kesalahan jaringan');
    }
  },

  renderMaintenanceTable(data, pagination) {
    const tbody = document.getElementById('reportMaintenanceTableBody');
    if (!tbody) return;

    if (!data || !data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Belum ada data maintenance di rentang waktu ini</td></tr>';
      document.getElementById('reportTableInfo').textContent = '-';
      document.getElementById('reportPagination').innerHTML = '';
      return;
    }

    const statusMap = {
      'scheduled': '<span class="badge" style="background:#e0f2fe; color:#0369a1">Dijadwalkan</span>',
      'in_progress': '<span class="badge" style="background:#fef3c7; color:#b45309">Dalam Proses</span>',
      'done': '<span class="badge" style="background:#d1fae5; color:#047857">Selesai</span>',
      'cancelled': '<span class="badge" style="background:#fee2e2; color:#b91c1c">Dibatalkan</span>'
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    tbody.innerHTML = data.map(m => {
      let date = new Date(m.schedule).toLocaleDateString('id-ID');
      return `
        <tr>
          <td><strong>${date}</strong></td>
          <td>
            <strong>${m.asset_name || 'Tanpa Asset'}</strong> (${m.asset_code || '-'})
            <div style="font-size:0.8rem; color:var(--gray-500); margin-top:4px;">${m.notes || ''}</div>
          </td>
          <td>${m.technician || '-'}</td>
          <td><strong>${m.cost && m.cost > 0 ? formatCurrency(m.cost) : 'Rp 0'}</strong></td>
          <td>${statusMap[m.status] || m.status}</td>
        </tr>
      `;
    }).join('');

    const start = (pagination.current_page - 1) * pagination.per_page + 1;
    const end = Math.min(pagination.current_page * pagination.per_page, pagination.total);
    document.getElementById('reportTableInfo').textContent = `Menampilkan ${start}-${end} dari ${pagination.total} data`;

    let pagHtml = '';
    for (let i = 1; i <= pagination.last_page; i++) {
      pagHtml += `<button class="page-btn ${i === pagination.current_page ? 'active' : ''}" onclick="ReportsPage.loadMaintenanceDetail(${i})">${i}</button>`;
    }
    document.getElementById('reportPagination').innerHTML = pagHtml;
  },

  async exportMaintenanceExcel() {
    try {
      const start = document.getElementById('filterStartDate').value;
      const end = document.getElementById('filterEndDate').value;
      
      const params = new URLSearchParams({ page: 1, limit: 10000 });
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);

      const res = await fetch(`${BASE_URL}/reports/maintenance_detail.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (!data.success || !data.data || !data.data.length) {
        Toast.error('Tidak ada data detail maintenance untuk diekspor');
        return;
      }

      const statusMap = {
        'scheduled': 'Dijadwalkan',
        'in_progress': 'Dalam Proses',
        'done': 'Selesai',
        'cancelled': 'Dibatalkan'
      };

      const excelData = [
        ['Laporan Detail Maintenance - Himawari Digi'],
        [`Periode: ${start || 'Awal'} s.d. ${end || 'Akhir'}`],
        [],
        ['Tanggal Jadwal', 'Aset', 'Kode Aset', 'Teknisi', 'Biaya (Rp)', 'Status', 'Catatan']
      ];

      const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

      data.data.forEach(m => {
        excelData.push([
          new Date(m.schedule).toLocaleDateString('id-ID'),
          m.asset_name || '-',
          m.asset_code || '-',
          m.technician || '-',
          m.cost && m.cost > 0 ? formatCurrency(m.cost) : 'Rp 0',
          statusMap[m.status] || m.status,
          m.notes || '-'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detail_Maintenance");
      XLSX.writeFile(wb, "Laporan_Detail_Maintenance.xlsx");
      Toast.success('Berhasil mengekspor Excel');
    } catch (e) {
      Toast.error('Gagal mengekspor Excel');
      console.error(e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ReportsPage.init();
});
