const UsersPage = {

  currentPage: 1,
  deleteId: null,
  editId: null,
  eventsBound: false,

  init() {
    try { if (typeof Sidebar !== 'undefined') Sidebar.init(); } catch (e) { console.warn('Sidebar init error:', e); }
    try { if (typeof Topbar !== 'undefined') Topbar.init(); } catch (e) { console.warn('Topbar init error:', e); }
    
    this.loadUsers();
    this.bindEvents();
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    document.getElementById('btnAdd').addEventListener('click', () => this.openForm());
    document.getElementById('searchInput').addEventListener('input', () => { this.currentPage = 1; this.loadUsers(); });
    document.getElementById('filterRole').addEventListener('change', () => { this.currentPage = 1; this.loadUsers(); });
    document.getElementById('btnRefresh').addEventListener('click', () => this.loadUsers());
    
    document.getElementById('btnSaveForm').addEventListener('click', () => this.saveUser());
    document.getElementById('btnCloseForm').addEventListener('click', () => this.closeForm());
    document.getElementById('btnCancelForm').addEventListener('click', () => this.closeForm());
    
    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeDelete());
    document.getElementById('btnConfirmDelete').addEventListener('click', () => this.confirmDelete());
  },

  async loadUsers() {
    const search = document.getElementById('searchInput').value;
    const role = document.getElementById('filterRole').value;
    
    const params = new URLSearchParams({ 
      page: this.currentPage, 
      limit: 10, 
      search,
      role
    });
    
    try {
      const res = await fetch(`${BASE_URL}/user/get.php?${params}`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        this.renderTable(data.data, data.pagination);
      } else {
        Toast.error(data.message || 'Gagal memuat data pengguna');
      }
    } catch (e) {
      Toast.error('Gagal terhubung ke server');
      console.error(e);
    }
  },

  renderTable(users, pagination) {
    const tbody = document.getElementById('userTableBody');
    const start = (pagination.current_page - 1) * pagination.per_page + 1;

    if (!users || !users.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Belum ada data pengguna</td></tr>';
      document.getElementById('tableInfo').textContent = 'Tidak ada data';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = users.map((u, i) => {
      const no = start + i;
      let avatarHtml = `<div class="user-avatar-placeholder">${u.name.charAt(0).toUpperCase()}</div>`;
      if (u.avatar) {
        avatarHtml = `<div class="user-avatar-wrap"><img src="/Project A/uploads/avatars/${u.avatar}" alt="Avatar" onerror="this.parentElement.innerHTML='<div class=\\'user-avatar-placeholder\\'>${u.name.charAt(0).toUpperCase()}</div>'"/></div>`;
      }

      let date = new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

      return `
        <tr>
          <td class="text-gray-500">${no}</td>
          <td>
            <div class="user-table-name">
              ${avatarHtml}
              <strong>${this.escapeHtml(u.name)}</strong>
            </div>
          </td>
          <td>${this.escapeHtml(u.email)}</td>
          <td><span class="badge badge-role-${u.role}">${u.role.replace('_', ' ')}</span></td>
          <td class="text-gray-500">${date}</td>
          <td>
            <div class="action-group">
              <button class="btn btn-icon btn-edit btn-sm" onclick="UsersPage.openEdit(${u.id})" title="Edit">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-icon btn-delete btn-sm" onclick="UsersPage.openDelete(${u.id}, '${this.escapeHtml(u.name)}')" title="Hapus">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const end = Math.min(start + pagination.per_page - 1, pagination.total);
    document.getElementById('tableInfo').textContent = `Menampilkan ${start}–${end} dari ${pagination.total} pengguna`;
    this.renderPagination(pagination);
  },

  escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  renderPagination(p) {
    const el = document.getElementById('pagination');
    if (p.last_page <= 1) { el.innerHTML = ''; return; }

    let html = `
      <button class="page-btn ${p.current_page === 1 ? 'disabled' : ''}"
        onclick="UsersPage.goPage(${p.current_page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= p.last_page; i++) {
      html += `<button class="page-btn ${i === p.current_page ? 'active' : ''}"
        onclick="UsersPage.goPage(${i})">${i}</button>`;
    }

    html += `
      <button class="page-btn ${p.current_page === p.last_page ? 'disabled' : ''}"
        onclick="UsersPage.goPage(${p.current_page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>`;

    el.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.loadUsers();
  },

  clearErrors() {
    ['nameError', 'emailError', 'passwordError'].forEach(id => {
      document.getElementById(id).textContent = '';
    });
    ['userNameInput', 'userEmail', 'userPassword'].forEach(id => {
      document.getElementById(id).classList.remove('is-error');
    });
  },

  openForm() {
    this.editId = null;
    document.getElementById('modalFormTitle').textContent = 'Tambah User Baru';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    document.getElementById('passwordRequiredStar').style.display = 'inline';
    document.getElementById('passwordHint').textContent = '';
    
    this.clearErrors();
    document.getElementById('modalForm').classList.add('active');
  },

  async openEdit(id) {
    this.editId = id;
    document.getElementById('modalFormTitle').textContent = 'Edit User';
    this.clearErrors();
    document.getElementById('userForm').reset();

    try {
      const res = await fetch(`${BASE_URL}/user/get.php?search=`, {
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` }
      });
      const data = await res.json();
      
      const u = data.data?.find(x => x.id === parseInt(id));
      if (!u) {
        Toast.error('Data user tidak ditemukan');
        return;
      }

      document.getElementById('userId').value = u.id;
      document.getElementById('userNameInput').value = u.name;
      document.getElementById('userEmail').value = u.email;
      document.getElementById('userRoleSelect').value = u.role;
      
      document.getElementById('passwordRequiredStar').style.display = 'none';
      document.getElementById('passwordHint').textContent = '* Kosongkan jika tidak ingin mengubah password';
      
      document.getElementById('modalForm').classList.add('active');

    } catch (e) {
      Toast.error('Gagal memuat data');
      console.error(e);
    }
  },

  closeForm() {
    document.getElementById('modalForm').classList.remove('active');
  },

  async saveUser() {
    this.clearErrors();
    let hasError = false;

    const name = document.getElementById('userNameInput').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRoleSelect').value;
    const fileInput = document.getElementById('userAvatarFile');

    if (!name) {
      document.getElementById('userNameInput').classList.add('is-error');
      document.getElementById('nameError').textContent = 'Nama wajib diisi';
      hasError = true;
    }
    
    if (!email) {
      document.getElementById('userEmail').classList.add('is-error');
      document.getElementById('emailError').textContent = 'Email wajib diisi';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('userEmail').classList.add('is-error');
      document.getElementById('emailError').textContent = 'Format email tidak valid';
      hasError = true;
    }

    if (!this.editId && !password) {
      document.getElementById('userPassword').classList.add('is-error');
      document.getElementById('passwordError').textContent = 'Password wajib diisi untuk pengguna baru';
      hasError = true;
    } else if (password && password.length < 6) {
      document.getElementById('userPassword').classList.add('is-error');
      document.getElementById('passwordError').textContent = 'Password minimal 6 karakter';
      hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    if (this.editId) formData.append('id', this.editId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('role', role);
    if (password) formData.append('password', password);
    
    if (fileInput.files.length > 0) {
      formData.append('avatar', fileInput.files[0]);
    }

    const url = this.editId ? `${BASE_URL}/user/update.php` : `${BASE_URL}/user/create.php`;
    document.getElementById('saveBtnText').textContent = 'Menyimpan...';
    document.getElementById('btnSaveForm').disabled = true;

    try {
      const res = await fetch(url, {
        method: 'POST', // Both create and update use POST in this backend because of FormData (multipart)
        headers: { 
          'Authorization': `Bearer ${Storage.getToken()}` 
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        Toast.success(data.message);
        this.closeForm();
        this.loadUsers();
      } else {
        Toast.error(data.message || 'Gagal menyimpan data');
      }
    } catch (e) {
      Toast.error('Terjadi kesalahan sistem');
      console.error(e);
    } finally {
      document.getElementById('saveBtnText').textContent = 'Simpan';
      document.getElementById('btnSaveForm').disabled = false;
    }
  },

  openDelete(id, name) {
    this.deleteId = id;
    document.getElementById('deleteUserName').textContent = name;
    document.getElementById('modalDelete').classList.add('active');
  },

  closeDelete() {
    document.getElementById('modalDelete').classList.remove('active');
    this.deleteId = null;
  },

  async confirmDelete() {
    if (!this.deleteId) return;

    const btn = document.getElementById('btnConfirmDelete');
    const oldText = btn.textContent;
    btn.textContent = 'Menghapus...';
    btn.disabled = true;

    try {
      const res = await fetch(`${BASE_URL}/user/delete.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Storage.getToken()}`
        },
        body: JSON.stringify({ id: this.deleteId })
      });
      const data = await res.json();

      if (data.success) {
        Toast.success(data.message);
        this.closeDelete();
        this.loadUsers();
      } else {
        Toast.error(data.message || 'Gagal menghapus pengguna');
      }
    } catch (e) {
      Toast.error('Gagal menghapus data');
      console.error(e);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UsersPage.init();
});
