(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    back: $('backBtn'),
    profile: $('profileBtn'),
    avatarInput: $('avatarInput'),
    avatarImg: $('avatarImg'),
    username: $('username'),
    password: $('password'),
    togglePw: $('togglePw'),
    eyeOpen: $('eyeOpen'),
    eyeOff: $('eyeOff'),
    fieldUser: $('fieldUser'),
    fieldPw: $('fieldPw'),
    form: $('loginForm'),
    signIn: $('signInBtn'),
    devMode: $('devModeBtn'),
    sms: $('smsBtn'),
    forgot: $('forgotBtn'),
    create: $('createLink'),
    toast: $('toast'),
  };

  const STORAGE = {
    AVATAR: 'bloom.avatar',
    USERNAME: 'bloom.username',
  };

  let toastTimer;
  function toast(message, variant = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.toggle('error', variant === 'error');
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function restore() {
    const savedAvatar = localStorage.getItem(STORAGE.AVATAR);
    if (savedAvatar) els.avatarImg.src = savedAvatar;

    const savedUser = localStorage.getItem(STORAGE.USERNAME);
    if (savedUser) els.username.value = savedUser;
  }

  els.avatarInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast('Image must be under 4MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      els.avatarImg.src = dataUrl;
      try {
        localStorage.setItem(STORAGE.AVATAR, dataUrl);
        toast('Photo updated 🌸');
      } catch (err) {
        toast('Photo too large to save', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  els.togglePw.addEventListener('click', () => {
    const isHidden = els.password.type === 'password';
    els.password.type = isHidden ? 'text' : 'password';
    els.eyeOpen.style.display = isHidden ? 'none' : '';
    els.eyeOff.style.display = isHidden ? '' : 'none';
    els.togglePw.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  [els.username, els.password].forEach((input) => {
    input.addEventListener('input', () => {
      input.closest('.field').classList.remove('error');
    });
  });

  function validate(username, password) {
    const problems = [];
    if (!username.trim()) {
      els.fieldUser.classList.add('error');
      problems.push('Please enter your phone number or username');
    } else if (/^\d+$/.test(username) && username.length < 7) {
      els.fieldUser.classList.add('error');
      problems.push('Phone number is too short');
    }
    if (!password) {
      els.fieldPw.classList.add('error');
      problems.push('Please enter your password');
    } else if (password.length < 8) {
      els.fieldPw.classList.add('error');
      problems.push('Password must be at least 8 characters');
    }
    return problems;
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = els.username.value;
    const password = els.password.value;
    const problems = validate(username, password);
    if (problems.length) {
      toast(problems[0], 'error');
      return;
    }
    els.signIn.disabled = true;
    const original = els.signIn.textContent;
    els.signIn.textContent = 'Growing… 🌱';

    localStorage.setItem(STORAGE.USERNAME, username.trim());

    try {
      const identifier = username.trim();
      const payload = identifier.includes('@')
        ? { email: identifier, password }
        : { username: identifier, password };
      const data = await bloomRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      saveSession(data);
      toast(`Welcome back, ${data.user.username}! 🌷`);
      setTimeout(goToGarden, 600);
    } catch (err) {
      toast(err.message, 'error');
      els.signIn.disabled = false;
      els.signIn.textContent = original;
    }
  });

  els.devMode.addEventListener('click', () => {
    setBloomDevMode(true);
    window.location.href = '/';
  });

  if (els.back) {
    els.back.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else toast('Nothing to go back to');
    });
  }

  if (els.profile) {
    els.profile.addEventListener('click', () => {
      els.avatarInput.click();
    });
  }

  els.sms.addEventListener('click', () => toast('SMS sign-in is not available yet'));
  els.forgot.addEventListener('click', () => toast('Password reset is not available yet'));

  document.querySelectorAll('.fb').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.provider === 'add-friend') {
        window.location.href = 'create-account.html';
        return;
      }
      toast('This sign-in option is not available yet');
    });
  });

  restore();
})();
