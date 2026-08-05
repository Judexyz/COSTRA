const Topbar = {

  init() {
    this.loadUser();
    this.bindLogout();
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
      window.location.href = '/Project A/index.html';
    });
  }

};
