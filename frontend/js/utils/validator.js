const Validator = {

  isRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  },

  isEmail(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value.trim());
  },

  isMinLength(value, min) {
    return value.trim().length >= min;
  },

  showError(fieldId, errorId, message) {
    const group = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (group) group.classList.add('is-error');
    if (error) error.textContent = message;
  },

  clearError(fieldId, errorId) {
    const group = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (group) group.classList.remove('is-error');
    if (error) error.textContent = '';
  },

  validateLogin(email, password) {
    let isValid = true;

    this.clearError('emailGroup', 'emailError');
    this.clearError('passwordGroup', 'passwordError');

    if (!this.isRequired(email)) {
      this.showError('emailGroup', 'emailError', 'Email wajib diisi');
      isValid = false;
    } else if (!this.isEmail(email)) {
      this.showError('emailGroup', 'emailError', 'Format email tidak valid');
      isValid = false;
    }

    if (!this.isRequired(password)) {
      this.showError('passwordGroup', 'passwordError', 'Password wajib diisi');
      isValid = false;
    } else if (!this.isMinLength(password, 6)) {
      this.showError('passwordGroup', 'passwordError', 'Password minimal 6 karakter');
      isValid = false;
    }

    return isValid;
  }

};
