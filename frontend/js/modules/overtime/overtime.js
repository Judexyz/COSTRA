const Overtime = {
  mockData: [
    { id: 1, user: 'Jude', date: '2026-09-01', start: '17:00', end: '19:00', duration: '2 hours', status: 'Approved' },
    { id: 2, user: 'Yashir', date: '2026-09-02', start: '18:00', end: '20:30', duration: '2.5 hours', status: 'Pending' },
    { id: 3, user: 'Jimbo', date: '2026-09-05', start: '17:30', end: '18:30', duration: '1 hour', status: 'Rejected' },
    { id: 4, user: 'Jude', date: '2026-09-08', start: '17:00', end: '21:00', duration: '4 hours', status: 'Pending' },
  ],

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }

    this.renderTable();
    this.bindFilters();
    this.initDatePicker();
  },

  renderTable() {
    const tbody = document.getElementById('overtimeTableBody');
    if (!tbody) return;

    // For now, always show empty state to match mockup exactly
    const html = `<tr><td colspan="5" style="text-align: center; padding: 4rem; color: var(--gray-700); font-weight: 500;">No rows</td></tr>`;
    tbody.innerHTML = html;
  },

  bindFilters() {
    const filterUser = document.getElementById('filterUser');
    const filterSite = document.getElementById('filterSite');
    const searchInput = document.querySelector('input[type="text"][placeholder="Search..."]');

    if (filterUser) filterUser.addEventListener('change', () => this.renderTable());
    if (filterSite) filterSite.addEventListener('change', () => this.renderTable());
    if (searchInput) searchInput.addEventListener('input', () => this.renderTable());
  },

  initDatePicker() {
    const btn = document.getElementById('dateRangePickerBtn');
    const popover = document.getElementById('dateRangePopover');
    if (!btn || !popover) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.style.display = popover.style.display === 'none' || popover.style.display === '' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !popover.contains(e.target)) {
        popover.style.display = 'none';
      }
    });

    // Generate days (1-30) for September 2026
    const grid = document.getElementById('pickerDaysGrid');
    if (grid) {
      let daysHtml = '';
      // Sept 2026 starts on Tuesday, so empty for Su, Mo (2 empty slots)
      daysHtml += `<div></div><div></div>`;
      for (let i = 1; i <= 30; i++) {
        const isSelected = i === 1 || i === 30;
        if (isSelected) {
          daysHtml += `<div class="date-cell" data-date="2026-09-${i < 10 ? '0'+i : i}" style="width: 28px; height: 28px; line-height: 28px; margin: 0 auto; background: #0284c7; color: white; border-radius: 50%; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;">${i < 10 ? '0'+i : i}</div>`;
        } else {
          daysHtml += `<div class="date-cell" data-date="2026-09-${i < 10 ? '0'+i : i}" style="width: 28px; height: 28px; line-height: 26px; margin: 0 auto; background: transparent; color: #0284c7; border: 1px dashed #0284c7; border-radius: 50%; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='transparent'">${i < 10 ? '0'+i : i}</div>`;
        }
      }
      grid.innerHTML = daysHtml;

      // Add click event for dates
      const dateCells = grid.querySelectorAll('.date-cell');
      dateCells.forEach(cell => {
        cell.addEventListener('click', (e) => {
          const selectedDate = e.target.getAttribute('data-date');
          const btnText = btn.querySelector('div');
          
          // Simple interaction: update text and close popover
          if (btnText) {
            btnText.textContent = `2026-09-01 to ${selectedDate}`;
          }
          popover.style.display = 'none';
          
          // Optionally re-render table
          this.renderTable();
        });
      });
    }
  },


};

document.addEventListener('DOMContentLoaded', () => {
  Overtime.init();
});
