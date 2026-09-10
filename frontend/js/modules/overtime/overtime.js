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
    const grid = document.getElementById('pickerDaysGrid');
    if (!btn || !popover || !grid) return;

    let startDate = 1;
    let endDate = 30;

    // Toggle popover
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.style.display = popover.style.display === 'none' || popover.style.display === '' ? 'block' : 'none';
      if (popover.style.display === 'block') {
        renderCalendar();
      }
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !popover.contains(e.target)) {
        popover.style.display = 'none';
      }
    });

    // To remove the grid gaps causing white lines between backgrounds, we must remove the gap on the grid.
    // The current grid has gap: 0.5rem. We will remove it here dynamically and handle spacing with padding/width.
    grid.style.gap = '0';
    grid.style.rowGap = '0.5rem'; // Keep row gap, or remove it too if rows should touch. Let's keep a small row gap.

    const renderCalendar = () => {
      let daysHtml = '';
      
      // Prev month (Sept 2026 starts Tuesday, so Su, Mo are from August: 30, 31)
      const prevDays = [30, 31];
      prevDays.forEach(d => {
        daysHtml += `<div style="position: relative; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 28px; height: 28px; line-height: 28px; text-align: center; color: var(--gray-400); font-size: 0.75rem;">${d}</div>
        </div>`;
      });

      for (let i = 1; i <= 30; i++) {
        let wrapperBg = 'transparent';
        let numberHtml = '';

        const isStart = (startDate && i === startDate);
        const isEnd = (endDate && i === endDate);
        const isBetween = (startDate && endDate && i > startDate && i < endDate);
        const isOutside = !isStart && !isEnd && !isBetween;

        if (isStart && endDate && startDate !== endDate) {
          wrapperBg = 'linear-gradient(to right, transparent 50%, #eff6ff 50%)';
        } else if (isEnd && startDate && startDate !== endDate) {
          wrapperBg = 'linear-gradient(to right, #eff6ff 50%, transparent 50%)';
        } else if (isBetween) {
          wrapperBg = '#eff6ff';
        }

        if (isStart || isEnd) {
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 28px; text-align: center; background: #0284c7; color: white; border-radius: 50%; font-size: 0.75rem; z-index: 2;">${i < 10 ? '0'+i : i}</div>`;
        } else if (isBetween) {
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 26px; text-align: center; background: transparent; color: #0284c7; border: 1px dashed #0284c7; border-radius: 50%; font-size: 0.75rem; z-index: 2;">${i < 10 ? '0'+i : i}</div>`;
        } else {
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 28px; text-align: center; color: var(--gray-500); font-size: 0.75rem; z-index: 2;">${i < 10 ? '0'+i : i}</div>`;
        }

        daysHtml += `<div class="date-cell" data-day="${i}" style="position: relative; height: 36px; display: flex; align-items: center; justify-content: center; background: ${wrapperBg}; cursor: pointer;">
          ${numberHtml}
        </div>`;
      }

      // Next month padding (Oct 1-3)
      for (let i = 1; i <= 3; i++) {
        let wrapperBg = 'transparent';
        let numberHtml = '';
        // If endDate is next month's 1st (for example 31 in our 1-index logic, let's say endDate = 31 represents Oct 1)
        if (endDate === 30 + i) {
          wrapperBg = 'linear-gradient(to right, #eff6ff 50%, transparent 50%)';
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 28px; text-align: center; background: #38bdf8; color: white; border-radius: 50%; font-size: 0.75rem; z-index: 2;">0${i}</div>`;
        } else if (startDate && endDate && 30 + i > startDate && 30 + i < endDate) {
          wrapperBg = '#eff6ff';
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 26px; text-align: center; background: transparent; color: #0284c7; border: 1px dashed #0284c7; border-radius: 50%; font-size: 0.75rem; z-index: 2;">0${i}</div>`;
        } else {
          numberHtml = `<div style="width: 28px; height: 28px; line-height: 28px; text-align: center; color: var(--gray-400); font-size: 0.75rem; z-index: 2;">0${i}</div>`;
        }
        daysHtml += `<div class="date-cell next-month" data-day="${30 + i}" style="position: relative; height: 36px; display: flex; align-items: center; justify-content: center; background: ${wrapperBg}; cursor: pointer;">
          ${numberHtml}
        </div>`;
      }

      grid.innerHTML = daysHtml;

      // Add click interactions
      grid.querySelectorAll('.date-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const clickedDay = parseInt(cell.getAttribute('data-day'));
          
          if (startDate && endDate) {
            // Reset and start new range
            startDate = clickedDay;
            endDate = null;
          } else if (startDate && !endDate) {
            if (clickedDay < startDate) {
              endDate = startDate;
              startDate = clickedDay;
            } else {
              endDate = clickedDay;
            }
          } else {
            startDate = clickedDay;
          }
          
          renderCalendar();
          updateBtnText();
        });
      });
    };

    const updateBtnText = () => {
      const btnText = btn.querySelector('div');
      if (btnText && startDate) {
        let startStr = startDate > 30 ? `2026-10-0${startDate-30}` : `2026-09-${startDate < 10 ? '0'+startDate : startDate}`;
        let endStr = '';
        if (endDate) {
          endStr = endDate > 30 ? `2026-10-0${endDate-30}` : `2026-09-${endDate < 10 ? '0'+endDate : endDate}`;
          btnText.textContent = `${startStr} to ${endStr}`;
        } else {
          btnText.textContent = `${startStr} to :`;
        }
      }
    };

    // Initial render
    renderCalendar();
    updateBtnText();
  },


};

document.addEventListener('DOMContentLoaded', () => {
  Overtime.init();
});
