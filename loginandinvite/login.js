(() => {
  const $ = (id) => document.getElementById(id);
  const API_BASE = 'http://localhost:8000';

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
    sms: $('smsBtn'),
    forgot: $('forgotBtn'),
    create: $('createLink'),
    toast: $('toast'),
  };

  const STORAGE = {
    AVATAR: 'bloom.avatar',
    USERNAME: 'bloom.username',
  };

  // ----- Toast helper -----
  let toastTimer;
  function toast(message, variant = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.toggle('error', variant === 'error');
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  // ----- Restore saved data -----
  function restore() {
    const savedAvatar = localStorage.getItem(STORAGE.AVATAR);
    if (savedAvatar) els.avatarImg.src = savedAvatar;

    const savedUser = localStorage.getItem(STORAGE.USERNAME);
    if (savedUser) els.username.value = savedUser;
  }

  // ----- Avatar upload -----
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

  // ----- Password show / hide -----
  els.togglePw.addEventListener('click', () => {
    const isHidden = els.password.type === 'password';
    els.password.type = isHidden ? 'text' : 'password';
    els.eyeOpen.style.display = isHidden ? 'none' : '';
    els.eyeOff.style.display = isHidden ? '' : 'none';
    els.togglePw.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  // ----- Clear field-level error while typing -----
  [els.username, els.password].forEach((input) => {
    input.addEventListener('input', () => {
      input.closest('.field').classList.remove('error');
    });
  });

  // ----- Validation -----
  function validate(email, password) {
    const problems = [];
    if (!email.trim()) {
      els.fieldUser.classList.add('error');
      problems.push('Please enter your email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      els.fieldUser.classList.add('error');
      problems.push('Please enter a valid email address');
    }
    if (!password) {
      els.fieldPw.classList.add('error');
      problems.push('Please enter your password');
    }
    return problems;
  }

  // ----- Sign in -----
  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = els.username.value.trim().toLowerCase();
    const password = els.password.value;
    const problems = validate(email, password);
    if (problems.length) {
      toast(problems[0], 'error');
      return;
    }
    els.signIn.disabled = true;
    const original = els.signIn.textContent;
    els.signIn.textContent = 'Growing… 🌱';

    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (resp.status === 401) {
        toast('Wrong email or password', 'error');
        return;
      }
      if (resp.status === 422) {
        toast('Please check your inputs', 'error');
        return;
      }
      if (!resp.ok) {
        toast(`Something went wrong (${resp.status})`, 'error');
        return;
      }

      const data = await resp.json();
      localStorage.setItem('bloom.token', data.access_token);
      localStorage.setItem(STORAGE.USERNAME, email);
      toast(`Welcome back, ${data.user.username}! 🌷`);
    } catch (err) {
      toast('Cannot reach server — is the backend running?', 'error');
    } finally {
      els.signIn.disabled = false;
      els.signIn.textContent = original;
    }
  });

  // ----- Secondary buttons -----
  els.back.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else toast('Nothing to go back to');
  });

  els.profile.addEventListener('click', () => {
    els.avatarInput.click();
  });

  els.sms.addEventListener('click', () => toast('SMS code sent 💬'));
  els.forgot.addEventListener('click', () => toast('Password reset link sent to your inbox'));
  // create-account link uses the anchor's href directly — no JS override

  document.querySelectorAll('.fb').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider || 'friend';
      toast(`Signing in with ${provider}…`);
    });
  });

  // Boot
  restore();
})();
