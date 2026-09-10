const Overtime = {
  requests: [],
  currentUser: null,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    
    this.currentUser = (typeof Storage !== 'undefined' && Storage.getUser()) ? Storage.getUser() : null;

    this.loadRequests();
    this.bindFilters();
    this.initDatePicker();
    this.bindModal();
  },

  async loadRequests() {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${BASE_URL}/overtime/list.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        this.requests = data.data;
        this.renderTable();
      }
    } catch (err) {
      console.error('Failed to load overtime requests:', err);
    }
  },

  renderTable() {
    const tbody = document.getElementById('overtimeTableBody');
    if (!tbody) return;

    // Get filter values
    const filterUserVal = document.getElementById('filterUser')?.value || '';
    const filterSiteVal = document.getElementById('filterSite')?.value || '';
    const searchInputVal = document.querySelector('input[type="text"][placeholder="Search..."]')?.value.toLowerCase() || '';

    let filteredData = this.requests;

    if (filterUserVal) {
      filteredData = filteredData.filter(item => item.user_name === filterUserVal);
    }
    // (Assuming site is always '-' for now, since it's not saved in DB)
    if (searchInputVal) {
      filteredData = filteredData.filter(item => 
        (item.user_name || '').toLowerCase().includes(searchInputVal) ||
        (item.reason || '').toLowerCase().includes(searchInputVal)
      );
    }

    if (filteredData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 4rem; color: var(--gray-700); font-weight: 500;">No rows</td></tr>`;
      return;
    }

    let html = '';
    const isHR = this.currentUser && this.currentUser.role === 'hr';

    filteredData.forEach(item => {
      let statusStyle = '';
      if (item.status === 'Approved') statusStyle = 'color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';
      else if (item.status === 'Pending') statusStyle = 'color: #ca8a04; background: #fef08a; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';
      else if (item.status === 'Rejected') statusStyle = 'color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';

      let actionHtml = '';
      if (isHR && item.status === 'Pending') {
        actionHtml = `
          <button onclick="Overtime.updateStatus(${item.id}, 'Approved')" style="background: none; border: none; color: #16a34a; cursor: pointer; margin-right: 0.5rem;"><i class="fa-solid fa-check"></i></button>
          <button onclick="Overtime.updateStatus(${item.id}, 'Rejected')" style="background: none; border: none; color: #dc2626; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        `;
      } else if (item.status !== 'Pending') {
        actionHtml = `<span style="${statusStyle}">${item.status}</span>`;
      } else {
        actionHtml = `<span style="${statusStyle}">Pending</span>`;
      }

      html += `
        <tr>
          <td><div style="font-weight: 500;">${item.user_name}</div></td>
          <td>-</td>
          <td>${item.approver_name || 'Pending Approval'}</td>
          <td>${item.date} ${item.start_time}</td>
          <td>${item.date} ${item.end_time}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    
    // Change header text if HR
    const thStatus = document.getElementById('thStatus');
    if (thStatus) {
      thStatus.innerText = isHR ? 'Action / Status' : 'Status';
    }
  },

  async updateStatus(id, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    try {
      const token = Storage.getToken();
      const res = await fetch(`${BASE_URL}/overtime/approve.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        if (typeof Toast !== 'undefined') Toast.show(`Request ${status.toLowerCase()} successfully`, 'success');
        this.loadRequests();
      } else {
        if (typeof Toast !== 'undefined') Toast.show(data.message || 'Error updating status', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  },

  bindFilters() {
    const filterUser = document.getElementById('filterUser');
    const filterSite = document.getElementById('filterSite');
    const searchInput = document.querySelector('input[type="text"][placeholder="Search..."]');

    // Hide user filter if not HR
    if (filterUser && this.currentUser && this.currentUser.role !== 'hr') {
      filterUser.parentElement.style.display = 'none';
    }

    if (filterUser) filterUser.addEventListener('change', () => this.renderTable());
    if (filterSite) filterSite.addEventListener('change', () => this.renderTable());
    if (searchInput) searchInput.addEventListener('input', () => this.renderTable());
  },

  bindModal() {
    const btnOpen = document.getElementById('btnRequestOvertime');
    const modal = document.getElementById('modalRequestOvertime');
    const btnClose = document.getElementById('closeModalOvertime');
    const btnCancel = document.getElementById('cancelModalOvertime');
    const btnSave = document.getElementById('saveModalOvertime');

    if (!btnOpen || !modal) return;

    btnOpen.addEventListener('click', () => {
      const user = (typeof Storage !== 'undefined' && Storage.getUser()) ? Storage.getUser().name : 'Jude';
      const inputUser = document.getElementById('modalInputUser');
      if (inputUser) {
        inputUser.value = user;
      }
      modal.style.display = 'flex';
    });

    const closeModal = () => {
      modal.style.display = 'none';
      const form = document.getElementById('formRequestOvertime');
      if (form) form.reset();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (btnSave) {
      btnSave.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('modalInputDate').value;
        const start = document.getElementById('modalInputStart').value;
        const end = document.getElementById('modalInputEnd').value;
        const reason = document.getElementById('modalInputReason').value;
        
        if (!date || !start || !end) {
          if (typeof Toast !== 'undefined') Toast.show('Please fill all required fields', 'error');
          return;
        }

        try {
          const token = Storage.getToken();
          const res = await fetch(`${BASE_URL}/overtime/create.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              date: date,
              start_time: start,
              end_time: end,
              reason: reason
            })
          });
          const data = await res.json();
          if (data.success) {
            if (typeof Toast !== 'undefined') Toast.show('Overtime request submitted successfully!', 'success');
            closeModal();
            this.loadRequests();
          } else {
            if (typeof Toast !== 'undefined') Toast.show(data.message || 'Error submitting request', 'error');
          }
        } catch (err) {
          console.error(err);
          if (typeof Toast !== 'undefined') Toast.show('Network error', 'error');
        }
      });
    }
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
