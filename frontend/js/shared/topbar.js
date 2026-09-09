const Topbar = {

  init() {
    this.loadUser();
    this.injectModuleSwitcher();
    this.bindLogout();
  },

  injectModuleSwitcher() {
    const topbarLeft = document.querySelector('.topbar-left');
    if (!topbarLeft) return;

    // Check if switcher already exists to prevent duplicate injections
    if (document.getElementById('moduleSwitcher')) return;

    const currentModule = Storage.getModule();

    const switcherHtml = `
      <div class="module-switcher" id="moduleSwitcher">
        <select id="moduleSelect" class="module-select" onchange="Topbar.switchModule(this.value)">
          <option value="helpdesk" ${currentModule === 'helpdesk' ? 'selected' : ''}>Helpdesk</option>
          <option value="cost_control" ${currentModule === 'cost_control' ? 'selected' : ''}>Cost Control</option>
          <option value="hr" ${currentModule === 'hr' ? 'selected' : ''}>HR</option>
        </select>
        <i class="fa-solid fa-chevron-down select-icon"></i>
      </div>
    `;

    // Inject right after the sidebar toggle (before breadcrumb)
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.insertAdjacentHTML('afterend', switcherHtml);
    } else {
      topbarLeft.insertAdjacentHTML('afterbegin', switcherHtml);
    }
  },

  switchModule(moduleName) {
    Storage.setModule(moduleName);
    window.location.href = 'dashboard.html';
  },

  loadUser() {
    const user = Storage.getUser();
    if (!user) return;

    const userName  = document.getElementById('userName');
    const userRole  = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');
    const welcomeName = document.getElementById('welcomeName');

    if (userName)   userName.textContent  = user.name;
    if (userRole)   userRole.textContent  = user.role.replace('_', ' ');
    if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();
    if (welcomeName) welcomeName.textContent = user.name;
  },

  bindLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const confirm = window.confirm('Yakin ingin keluar?');
      if (!confirm) return;

      try {
        await fetch(`${BASE_URL}/auth/logout.php`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
        });
      } catch (e) {
      }

      Storage.clearAll();
      window.location.href = '/index.html';
    });
  }

};
