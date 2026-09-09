const ShiftPage = {
  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    this.bindTabs();
    this.renderUserShiftTable();
    this.renderCategoryTable();
  },

  bindTabs() {
    const tabs = document.querySelectorAll('.shift-tab');
    const tabUserShift = document.getElementById('tabUserShift');
    const tabCategory = document.getElementById('tabCategory');
    const pageTitle = document.getElementById('shiftPageTitle');
    const pageSubtitle = document.getElementById('shiftPageSubtitle');
    const categoryActions = document.getElementById('shiftCategoryActions');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Reset all tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.fontWeight = '500';
          t.style.color = 'var(--gray-500)';
          t.style.borderBottom = 'none';
          t.style.marginBottom = '0';
        });

        // Activate clicked tab
        tab.classList.add('active');
        tab.style.fontWeight = '600';
        tab.style.color = 'var(--primary-600)';
        tab.style.borderBottom = '2px solid var(--primary-600)';
        tab.style.marginBottom = '-2px';

        const target = tab.getAttribute('data-tab');
        if (target === 'user-shift') {
          tabUserShift.style.display = 'block';
          tabCategory.style.display = 'none';
          pageTitle.textContent = 'User Shift List';
          pageSubtitle.textContent = 'Dashboard • User Shift';
          categoryActions.style.display = 'none';
        } else {
          tabUserShift.style.display = 'none';
          tabCategory.style.display = 'block';
          pageTitle.textContent = 'Shift Category';
          pageSubtitle.textContent = 'Dashboard • Shift Category';
          categoryActions.style.display = 'block';
        }
      });
    });
  },

  renderUserShiftTable() {
    const headRow = document.getElementById('userShiftHead');
    const tbody = document.getElementById('userShiftBody');
    if (!headRow || !tbody) return;

    // We will generate headers from 2026-09-01 to 2026-09-06 for empty state (or 30, but mock empty state just shows a few)
    let headersHtml = '<th class="sticky-col">User Name</th>';
    for (let i = 1; i <= 6; i++) {
      const dateStr = `2026-09-${i.toString().padStart(2, '0')}`;
      headersHtml += `<th>${dateStr}</th>`;
    }
    headRow.innerHTML = headersHtml;

    // Empty state
    tbody.innerHTML = `
      <tr>
        <td colspan="31" style="text-align: center; padding: 4rem 1rem; color: var(--gray-800); background: #f8fafc;">
          Please select site or user to see data
        </td>
      </tr>
    `;
  },

  renderCategoryTable() {
    const tbody = document.getElementById('shiftCategoryBody');
    if (!tbody) return;

    const mockData = [
      { name: 'Working Hour', type: 'Paid', category: 'Attendance', code: 'T' },
      { name: 'Pagi', type: 'Paid', category: 'Attendance', code: 'P' },
      { name: 'Siang', type: 'Paid', category: 'Attendance', code: 'S' },
      { name: 'Malam', type: 'Paid', category: 'Attendance', code: 'M' },
      { name: 'Off', type: 'Unpaid', category: 'Attendance', code: 'OFF' },
      { name: 'Sakit', type: 'Paid', category: 'On Leave', code: 'SKP' },
      { name: 'Sakit (Unpaid)', type: 'Unpaid', category: 'On Leave', code: 'SKU' },
      { name: 'Izin', type: 'Unpaid', category: 'On Leave', code: 'I' },
      { name: 'Cuti Paid', type: 'Paid', category: 'On Leave', code: 'CP' },
      { name: 'Cuti Unpaid', type: 'Unpaid', category: 'On Leave', code: 'CU' },
      { name: 'On Trip', type: 'Paid', category: 'Attendance', code: 'OTR' }
    ];

    let html = '';
    mockData.forEach(item => {
      html += `
        <tr>
          <td>${this.escapeHtml(item.name)}</td>
          <td>${this.escapeHtml(item.type)}</td>
          <td>${this.escapeHtml(item.category)}</td>
          <td>${this.escapeHtml(item.code)}</td>
          <td>-</td>
          <td>
            <div style="color: var(--gray-500); font-size: 0.75rem;">At: System</div>
            <div style="color: var(--gray-500); font-size: 0.75rem;">By: System</div>
          </td>
          <td>
            <div style="color: var(--gray-500); font-size: 0.75rem;">At: System</div>
            <div style="color: var(--gray-500); font-size: 0.75rem;">By: System</div>
          </td>
          <td style="text-align: center;">
            <i class="fa-solid fa-ellipsis-vertical" style="color: var(--gray-400); cursor: pointer;"></i>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
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
  ShiftPage.init();
});
