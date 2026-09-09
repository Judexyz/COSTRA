const AttendancePage = {
  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    this.renderTable();
  },

  renderTable() {
    const headRow = document.getElementById('attTableHead');
    const tbody = document.getElementById('attTableBody');
    if (!headRow || !tbody) return;

    // We will generate headers from 2026-09-01 to 2026-09-30
    let headersHtml = '<th class="sticky-col">User Name</th>';
    const dates = [];
    for (let i = 1; i <= 30; i++) {
      const dateStr = `2026-09-${i.toString().padStart(2, '0')}`;
      dates.push(dateStr);
      headersHtml += `<th>${dateStr}</th>`;
    }
    headRow.innerHTML = headersHtml;

    // Mock Users
    const users = ['Jude', 'Yashir', 'Jimbo'];
    let bodyHtml = '';

    users.forEach(user => {
      bodyHtml += `<tr>`;
      bodyHtml += `<td class="sticky-col">${this.escapeHtml(user)}</td>`;
      // Generate empty data for dates
      dates.forEach(() => {
        bodyHtml += `<td>-</td>`;
      });
      bodyHtml += `</tr>`;
    });

    tbody.innerHTML = bodyHtml;
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
  AttendancePage.init();
});
