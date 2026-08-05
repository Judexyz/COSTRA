const DashboardPage = {

  lineChartInstance: null,
  pieChartInstance: null,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    
    this.loadStats();
    this.loadRecentTickets();
  },

  async loadStats() {
    try {
      const res = await fetch(`${BASE_URL}/dashboard/stats.php`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.animateValue('statTotalAsset', 0, data.stats.total_asset, 1000);
        this.animateValue('statActiveAsset', 0, data.stats.active_asset, 1000);
        this.animateValue('statDamagedAsset', 0, data.stats.damaged_asset, 1000);
        this.animateValue('statMaintenanceAsset', 0, data.stats.maintenance_asset, 1000);
        this.animateValue('statTotalTicket', 0, data.stats.total_ticket, 1000);
        this.animateValue('statTotalClient', 0, data.stats.total_client, 1000);

        this.renderPieChart(data.stats);
        this.renderLineChart(data.monthly_tickets);
      } else {
        Toast.error(data.message || 'Gagal memuat statistik');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    if (end === 0) {
      obj.textContent = 0;
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      obj.textContent = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = end;
      }
    };
    window.requestAnimationFrame(step);
  },

  renderPieChart(stats) {
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }

    const ctx = document.getElementById('assetPieChart');
    if (!ctx) return;

    this.pieChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active ' + stats.active_asset, 'Maintenance ' + stats.maintenance_asset, 'Damaged ' + stats.damaged_asset],
        datasets: [{
          data: [stats.active_asset, stats.maintenance_asset, stats.damaged_asset],
          backgroundColor: ['#2563eb', '#10b981', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          var width = chart.width, height = chart.height, ctx = chart.ctx;
          ctx.restore();
          var total = stats.total_asset || 0;
          var activeP = total > 0 ? Math.round((stats.active_asset / total) * 100) + "%" : "0%";
          
          var centerX = chart.chartArea ? (chart.chartArea.left + chart.chartArea.right) / 2 : width / 2;
          var centerY = chart.chartArea ? (chart.chartArea.top + chart.chartArea.bottom) / 2 : height / 2;
          
          if (total === 0) {
            var outerRadius = chart.outerRadius || (Math.min(chart.chartArea.right - chart.chartArea.left, chart.chartArea.bottom - chart.chartArea.top) / 2 * 0.9);
            var innerRadius = chart.innerRadius || (outerRadius * 0.8);
            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius + (outerRadius - innerRadius) / 2, 0, 2 * Math.PI);
            ctx.lineWidth = outerRadius - innerRadius;
            ctx.strokeStyle = '#f1f5f9';
            ctx.stroke();
          }

          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 28px Inter, sans-serif";
          ctx.fillText(activeP, centerX, centerY - 10);
          
          ctx.fillStyle = "#64748b";
          ctx.font = "12px Inter, sans-serif";
          ctx.fillText("Active", centerX, centerY + 14);
          ctx.save();
        }
      }],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              font: { family: 'Inter', size: 12, color: '#475569' }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ' ' + context.label;
              }
            }
          }
        }
      }
    });
  },

  renderLineChart(monthlyData) {
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }

    const ctx = document.getElementById('ticketsChart');
    if (!ctx) return;

    if (!monthlyData) monthlyData = [];

    const paddedData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(',', '');
      const shortLabel = d.toLocaleString('en-US', { month: 'short' });
      const found = monthlyData.find(m => m.month === monthStr || m.month.startsWith(monthStr.split(' ')[0])) || { month: monthStr, total: 0 };
      paddedData.push({ label: shortLabel, total: parseInt(found.total) });
    }

    const labels = paddedData.map(d => d.label);
    const values = paddedData.map(d => d.total);
    
    const bgColors = values.map((val, index) => {
      if (index === values.length - 1) return '#2563eb';
      return index % 2 === 0 ? '#bfdbfe' : '#2563eb';
    });

    this.lineChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tiket',
          data: values,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13, family: "Inter" },
            bodyFont: { size: 14, family: "Inter" },
            padding: 12,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true,
            suggestedMax: Math.max(...values, 5) * 1.2
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: { family: 'Inter', size: 12, color: '#94a3b8' },
              padding: 10
            },
            border: { display: false }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    });
  },

  async loadRecentTickets() {
    try {
      const res = await fetch(`${BASE_URL}/ticket/get.php?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      const tbody = document.getElementById('recentTicketsBody');
      
      if (data.success && data.data && data.data.length > 0) {
        tbody.innerHTML = data.data.map(t => {
          return `
            <tr>
              <td style="color: var(--primary-600); font-weight: 600;">${this.escapeHtml(t.ticket_no)}</td>
              <td>
                <div style="font-weight: 500;">${this.escapeHtml(t.asset_name || 'Tanpa Asset')}</div>
                <div style="font-size: 0.75rem; color: var(--gray-400);">${this.escapeHtml(t.client_name || '-')}</div>
              </td>
              <td>${this.renderBadge('status', t.status)}</td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--gray-400); padding: 2rem;">Belum ada tiket</td></tr>';
      }
    } catch (e) {
      console.error('Failed to load recent tickets:', e);
      document.getElementById('recentTicketsBody').innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--danger);">Gagal memuat data</td></tr>';
    }
  },

  renderBadge(type, value) {
    if (!value) return '-';
    let text = String(value).replace('_', ' ');
    
    let cls = 'badge ';
    if (type === 'status') {
      const statusMap = {
        'open': 'Open',
        'in_progress': 'In Progress',
        'closed': 'Selesai',
        'rejected': 'Ditolak'
      };
      if (statusMap[value]) text = statusMap[value];
      cls += 'badge-status-' + value.replace('_', '-');
    }
    
    return `<span class="${cls}">${text}</span>`;
  },

  escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DashboardPage.init();
});
