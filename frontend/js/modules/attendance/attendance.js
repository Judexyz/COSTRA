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
    
    const title = document.getElementById('pickerTitle');
    const monthGrid = document.getElementById('pickerMonthGrid');
    const yearGrid = document.getElementById('pickerYearGrid');
    
    let selectedMonth = 'September';
    let selectedYear = '2026';

    // Populate years
    let yearsHtml = '';
    for (let y = 2020; y <= 2030; y++) {
      yearsHtml += `<div data-year="${y}" style="cursor: pointer; padding: 0.375rem 0; font-size: 0.875rem; color: var(--gray-700);">${y}</div>`;
    }
    if (yearGrid) yearGrid.innerHTML = yearsHtml;

    popover.style.display = 'none';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      
      // Reset view to month grid when opening
      if (!isVisible) {
        monthGrid.style.display = 'grid';
        yearGrid.style.display = 'none';
        title.innerText = 'Select Month';
        btn.style.borderColor = '#0284c7';
        btn.querySelector('label').style.color = '#0284c7';
        popover.style.display = 'block';
      } else {
        popover.style.display = 'none';
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
    if (monthGrid) {
      const monthDivs = monthGrid.querySelectorAll('div');
      monthDivs.forEach(div => {
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          monthDivs.forEach(d => {
            d.style.backgroundColor = 'transparent';
            d.style.color = 'var(--gray-700)';
          });
          div.style.backgroundColor = '#0284c7';
          div.style.color = 'white';
          div.style.borderRadius = '9999px';
          
          selectedMonth = div.getAttribute('data-month');
          
          // Switch to year view
          monthGrid.style.display = 'none';
          yearGrid.style.display = 'grid';
          title.innerText = 'Select Year';
        });
      });
    }

    // Handle year selection
    if (yearGrid) {
      yearGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'DIV') {
          e.stopPropagation();
          const yearDivs = yearGrid.querySelectorAll('div');
          yearDivs.forEach(d => {
            d.style.backgroundColor = 'transparent';
            d.style.color = 'var(--gray-700)';
          });
          e.target.style.backgroundColor = '#0284c7';
          e.target.style.color = 'white';
          e.target.style.borderRadius = '9999px';
          
          selectedYear = e.target.getAttribute('data-year');
          
          // Update button text
          const displayEl = btn.querySelector('div:nth-child(2)');
          if (displayEl) {
            displayEl.innerText = `${selectedMonth} ${selectedYear}`;
          }

          // Close popover
          popover.style.display = 'none';
          btn.style.borderColor = 'var(--gray-300)';
          btn.querySelector('label').style.color = 'var(--gray-500)';
        }
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
