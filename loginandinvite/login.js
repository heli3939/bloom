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
    } else if (password.length < 6) {
      els.fieldPw.classList.add('error');
      problems.push('Password must be at least 6 characters');
    }
    return problems;
  }

  // ----- Sign in -----
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

    // Save username for next visit
    localStorage.setItem(STORAGE.USERNAME, username.trim());

    // Simulated request; swap with real API call later
    await new Promise((r) => setTimeout(r, 900));

    els.signIn.disabled = false;
    els.signIn.textContent = original;
    toast(`Welcome back, ${username.trim()}! 🌷`);
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
