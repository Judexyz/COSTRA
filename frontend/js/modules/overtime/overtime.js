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
    this.bindModal();
  },

  renderTable() {
    const tbody = document.getElementById('overtimeTableBody');
    if (!tbody) return;

    const filterStatus = document.getElementById('filterStatus')?.value || 'All';
    const filterUser = document.getElementById('filterUser')?.value || '';
    const searchVal = document.querySelector('input[type="text"][placeholder="Search..."]')?.value.toLowerCase() || '';

    let data = this.mockData;

    if (filterStatus !== 'All') {
      data = data.filter(item => item.status === filterStatus);
    }
    if (filterUser) {
      data = data.filter(item => item.user === filterUser);
    }
    if (searchVal) {
      data = data.filter(item => 
        item.user.toLowerCase().includes(searchVal) ||
        item.date.includes(searchVal)
      );
    }

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-500);">No overtime records found</td></tr>`;
      return;
    }

    let html = '';
    data.forEach(item => {
      let statusStyle = '';
      if (item.status === 'Approved') statusStyle = 'color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';
      else if (item.status === 'Pending') statusStyle = 'color: #ca8a04; background: #fef08a; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';
      else if (item.status === 'Rejected') statusStyle = 'color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;';

      html += `
        <tr>
          <td><div style="font-weight: 500;">${item.user}</div></td>
          <td>${item.date}</td>
          <td>${item.start}</td>
          <td>${item.end}</td>
          <td>${item.duration}</td>
          <td><span style="${statusStyle}">${item.status}</span></td>
          <td>
            <button style="background: none; border: none; color: var(--gray-400); cursor: pointer;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  bindFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterUser = document.getElementById('filterUser');
    const searchInput = document.querySelector('input[type="text"][placeholder="Search..."]');

    if (filterStatus) filterStatus.addEventListener('change', () => this.renderTable());
    if (filterUser) filterUser.addEventListener('change', () => this.renderTable());
    if (searchInput) searchInput.addEventListener('input', () => this.renderTable());
  },

  bindModal() {
    const btnOpen = document.getElementById('btnAddOvertime');
    const modal = document.getElementById('modalAddOvertime');
    const btnClose = document.getElementById('closeModalOvertime');
    const btnCancel = document.getElementById('cancelModalOvertime');
    const btnSave = document.getElementById('saveModalOvertime');

    if (!btnOpen || !modal) return;

    btnOpen.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    const closeModal = () => {
      modal.style.display = 'none';
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (typeof Toast !== 'undefined') {
          Toast.show('Overtime request saved successfully (Mock)', 'success');
        }
        closeModal();
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Overtime.init();
});
