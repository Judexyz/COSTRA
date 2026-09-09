const AttendancePage = {
  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    this.initMonthPicker();
    this.renderTable();
  },

  initMonthPicker() {
    const btn = document.getElementById('customMonthPickerBtn');
    const popover = document.getElementById('customMonthPickerPopover');
    if (!btn || !popover) return;
    
    // Default hidden
    popover.style.display = 'none';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      popover.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        btn.style.borderColor = '#0284c7';
        btn.querySelector('label').style.color = '#0284c7';
      } else {
        btn.style.borderColor = 'var(--gray-300)';
        btn.querySelector('label').style.color = 'var(--gray-500)';
      }
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !popover.contains(e.target)) {
        popover.style.display = 'none';
        btn.style.borderColor = 'var(--gray-300)';
        btn.querySelector('label').style.color = 'var(--gray-500)';
      }
    });

    // Handle month selection
    const grid = popover.children[1];
    if (grid) {
      const monthDivs = grid.querySelectorAll('div');
      monthDivs.forEach(div => {
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          // Reset all
          monthDivs.forEach(d => {
            d.style.backgroundColor = 'transparent';
            d.style.color = 'var(--gray-700)';
          });
          // Highlight selected
          div.style.backgroundColor = '#0284c7';
          div.style.color = 'white';
          div.style.borderRadius = '9999px';
          
          // Update button text
          const monthText = div.innerText;
          const displayEl = btn.querySelector('div');
          if (displayEl) {
            displayEl.innerText = monthText + ' 2026';
          }
          
          // Update popover header text
          const headerText = popover.querySelector('span');
          if (headerText) {
            headerText.innerText = monthText + ' 2026';
          }

          // Close popover
          popover.style.display = 'none';
          btn.style.borderColor = 'var(--gray-300)';
          btn.querySelector('label').style.color = 'var(--gray-500)';
        });
      });
    }
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
