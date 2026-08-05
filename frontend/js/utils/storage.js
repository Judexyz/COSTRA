const Storage = {

  setToken(token) {
    localStorage.setItem('hd_token', token);
  },

  getToken() {
    return localStorage.getItem('hd_token');
  },

  removeToken() {
    localStorage.removeItem('hd_token');
  },

  setUser(user) {
    localStorage.setItem('hd_user', JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem('hd_user');
    return user ? JSON.parse(user) : null;
  },

  removeUser() {
    localStorage.removeItem('hd_user');
  },

  setRemember(email) {
    localStorage.setItem('hd_remember', email);
  },

  getRemember() {
    return localStorage.getItem('hd_remember');
  },

  removeRemember() {
    localStorage.removeItem('hd_remember');
  },

  clearAll() {
    localStorage.removeItem('hd_token');
    localStorage.removeItem('hd_user');
  }

};
