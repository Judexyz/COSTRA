const Sidebar = {

  menus: {
    helpdesk: [
      {
        section: 'OVERVIEW',
        items: [
          { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie', page: 'dashboard.html' }
        ]
      },
      {
        section: 'USER MANAGEMENT',
        items: [
          { id: 'users', label: 'User', icon: 'fa-user', page: 'users.html' },
          { id: 'roles', label: 'Role', icon: 'fa-key', page: 'roles.html' }
        ]
      },
      {
        section: 'MANAGEMENT',
        items: [
          { id: 'asset',           label: 'Asset',           icon: 'fa-box-archive',        page: 'asset.html' },
          { id: 'incident',        label: 'Incident',        icon: 'fa-flag',               page: 'incident.html' },
          { id: 'service-request', label: 'Service Request', icon: 'fa-hammer',             page: 'service-request.html' },
          { id: 'maintenance',     label: 'Maintenance',     icon: 'fa-screwdriver-wrench', page: 'maintenance.html' }
        ]
      },
      {
        section: 'ATTENDANCE MANAGEMENT',
        items: [
          { id: 'attendance', label: 'Attendance',       icon: 'fa-address-card', page: 'attendance.html' },
          { id: 'shift',      label: 'Shift Management', icon: 'fa-calendar-days', page: 'shift.html' },
          { id: 'overtime',   label: 'Overtime Request', icon: 'fa-clock',        page: 'overtime.html' },
          { id: 'overtime-history', label: 'Overtime History', icon: 'fa-clock-rotate-left', page: 'overtime-history.html' },
          { id: 'leave',      label: 'On Leave (Sick/Leave)', icon: 'fa-user-injured', page: 'leave.html' }
        ]
      },
      {
        section: 'REPORT MANAGEMENT',
        items: [
          { id: 'incident-report',   label: 'Incident Report',   icon: 'fa-flag', page: 'incident-report.html' },
          { id: 'maintenance-report',label: 'Maintenance Report',icon: 'fa-flag', page: 'maintenance-report.html' },
          { id: 'sr-report',         label: 'Service Request Report', icon: 'fa-flag', page: 'service-request-report.html' },
          { id: 'attendance-report', label: 'User Attendance Report', icon: 'fa-flag', page: 'attendance-report.html' }
        ]
      }
    ],
    cost_control: [
      {
        section: 'Main',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', page: 'dashboard.html' }
        ]
      },
      {
        section: 'Operations',
        items: [
          { id: 'maintenance',     label: 'Maintenance',     icon: 'fa-screwdriver-wrench', page: 'maintenance.html' },
          { id: 'reports',         label: 'Reports',         icon: 'fa-chart-pie',          page: 'reports.html' }
        ]
      },
      {
        section: 'System',
        items: [
          { id: 'users',     label: 'Users',     icon: 'fa-users',          page: 'users.html' }
        ]
      }
    ],
    hr: [
      {
        section: 'Main',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', page: 'dashboard.html' }
        ]
      },
      {
        section: 'Coming Soon',
        items: [
          { id: 'coming-soon', label: 'Modul HR', icon: 'fa-users-gear', page: '#' }
        ]
      }
    ]
  },

  init() {
    const user = Storage.getUser();
    if (!user) {
      window.location.href = '/index.html';
      return;
    }

    this.render();
    this.setActiveMenu();
    this.bindToggle();
  },

  render() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    let html = '';
    const currentModule = Storage.getModule();
    const activeMenus = this.menus[currentModule] || this.menus['helpdesk'];

    activeMenus.forEach(section => {
      html += `<div class="nav-section">
        <div class="nav-section-label">${section.section}</div>`;

      section.items.forEach(item => {
        if (item.children) {
          html += `
          <div class="nav-group">
            <div class="nav-group-header" onclick="Sidebar.toggleGroup(this)">
              <div class="nav-left">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
              </div>
              <i class="fa-solid fa-chevron-right nav-group-arrow"></i>
            </div>
            <div class="nav-submenu">`;

          item.children.forEach(child => {
            html += `<div class="nav-subitem" data-page="${child.page}" onclick="Sidebar.navigate('${child.page}', '${child.label}')">${child.label}</div>`;
          });

          html += `</div></div>`;
        } else {
          html += `<div class="nav-item" data-page="${item.page}" onclick="Sidebar.navigate('${item.page}', '${item.label}')">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.label}</span>
          </div>`;
        }
      });

      html += `</div>`;
    });

    nav.innerHTML = html;
  },

  toggleGroup(header) {
    const submenu = header.nextElementSibling;
    const isOpen  = submenu.classList.contains('open');
    submenu.classList.toggle('open', !isOpen);
    header.classList.toggle('open', !isOpen);
  },

  setActiveMenu() {
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === current);
    });
    document.querySelectorAll('.nav-subitem').forEach(el => {
      if (el.dataset.page === current) {
        el.classList.add('active');
        const group = el.closest('.nav-submenu');
        if (group) {
          group.classList.add('open');
          group.previousElementSibling.classList.add('open');
        }
      }
    });
  },

  navigate(page, label) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = label;
    window.location.href = page;
  },

  bindToggle() {
    const btn = document.getElementById('sidebarToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const wrapper = document.getElementById('mainWrapper');
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
        wrapper.classList.toggle('expanded');
      }
    });
  }

};
