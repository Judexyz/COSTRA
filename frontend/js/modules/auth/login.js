const LoginPage = {

  init() {
    this.bindEvents();
    this.loadRemembered();
    this.loadLiveStats();
  },

  bindEvents() {
    const form = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('togglePassword');

    if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePassword());
  },

  async loadLiveStats() {
    try {
      const res = await fetch(`${BASE_URL}/public/stats.php`);
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        const elAssets = document.getElementById('statAssets');
        const elResolved = document.getElementById('statResolved');
        const elAttention = document.getElementById('statAttention');
        
        if(elAssets) elAssets.innerText = `${d.total_assets} Assets`;
        if(elResolved) elResolved.innerText = `${d.tickets_resolved} Ticket Selesai`;
        if(elAttention) elAttention.innerText = `${d.perlu_perhatian} Perlu Perhatian`;
      }
    } catch (e) {
      console.warn('Gagal memuat live stats:', e);
    }
  },

  loadRemembered() {
    const savedEmail = Storage.getRemember();
    if (savedEmail) {
      document.getElementById('email').value = savedEmail;
      document.getElementById('rememberMe').checked = true;
    }
  },

  togglePassword() {
    const input = document.getElementById('password');
    const icon  = document.getElementById('eyeIcon');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  },

  async handleSubmit(e) {
    e.preventDefault();

    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('rememberMe').checked;

    if (!Validator.validateLogin(email, password)) return;

    this.setLoading(true);
    this.hideAlert();

    try {
      const response = await fetch(`${BASE_URL}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        Storage.setToken(data.token);
        Storage.setUser(data.user);

        if (remember) {
          Storage.setRemember(email);
        } else {
          Storage.removeRemember();
        }

        window.location.href = 'frontend/pages/dashboard.html';

      } else {
        this.showAlert(data.message || 'Email atau password salah');
      }

    } catch (error) {
      console.error('LOGIN ERROR:', error);
      this.showAlert('Gagal terhubung ke server. Periksa koneksi Anda.');
    } finally {
      this.setLoading(false);
    }
  },

  setLoading(isLoading) {
    const btn    = document.getElementById('btnLogin');
    const text   = document.getElementById('btnText');
    const loader = document.getElementById('btnLoader');

    btn.disabled         = isLoading;
    text.style.display   = isLoading ? 'none' : 'inline';
    loader.style.display = isLoading ? 'flex' : 'none';
  },

  showAlert(message) {
    const box = document.getElementById('alertBox');
    const msg = document.getElementById('alertMessage');
    msg.textContent   = message;
    box.style.display = 'flex';
  },

  hideAlert() {
    document.getElementById('alertBox').style.display = 'none';
  }

};

document.addEventListener('DOMContentLoaded', () => LoginPage.init());
