const Sidebar = {

  menus: [
    {
      section: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', page: 'dashboard.html' }
      ]
    },
    {
      section: 'Master Data',
      items: [
        {
          id: 'master', label: 'Master Data', icon: 'fa-database',
          children: [
            { id: 'asset-category', label: 'Asset Category', page: 'asset-category.html' },
            { id: 'asset-brand',    label: 'Asset Brand',    page: 'asset-brand.html' },
            { id: 'client',         label: 'Client',          page: 'client.html' },
            { id: 'cause',          label: 'Cause',           page: 'cause.html' },
            { id: 'impact',         label: 'Impact',          page: 'impact.html' }
          ]
        }
      ]
    },
    {
      section: 'Operations',
      items: [
        { id: 'asset',           label: 'Asset',           icon: 'fa-box-archive',        page: 'asset.html' },
        { id: 'ticket',          label: 'Ticket',          icon: 'fa-ticket',             page: 'ticket.html' },
        { id: 'incident',        label: 'Incident',        icon: 'fa-triangle-exclamation', page: 'incident.html' },
        { id: 'service-request', label: 'Service Request', icon: 'fa-file-circle-plus',   page: 'service-request.html' },
        { id: 'maintenance',     label: 'Maintenance',     icon: 'fa-screwdriver-wrench', page: 'maintenance.html' },
        { id: 'reports',         label: 'Reports',         icon: 'fa-chart-pie',          page: 'reports.html' }
      ]
    },
    {
      section: 'System',
      items: [
        { id: 'users',     label: 'Users',     icon: 'fa-users',          page: 'users.html' },
        { id: 'audit-log', label: 'Audit Log', icon: 'fa-clock-rotate-left', page: 'audit-log.html' },
        { id: 'backups',   label: 'Backups',   icon: 'fa-box-archive',    page: 'backups.html' }
      ]
    }
  ],

  init() {
    const user = Storage.getUser();
    if (!user) {
      window.location.href = '/Project A/index.html';
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
    this.menus.forEach(section => {
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
