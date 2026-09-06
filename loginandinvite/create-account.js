(() => {
  const $ = (id) => document.getElementById(id);
  const API_BASE = 'http://localhost:8000';

  const els = {
    avatarInput: $('avatarInput'),
    avatarImg: $('avatarImg'),
    nickname: $('nickname'),
    contact: $('contact'),
    password: $('password'),
    invite: $('invite'),
    agree: $('agree'),
    togglePw: $('togglePw'),
    eyeOpen: $('eyeOpen'),
    eyeOff: $('eyeOff'),
    pasteBtn: $('pasteBtn'),
    sendCode: $('sendCodeBtn'),
    rowNickname: $('rowNickname'),
    rowContact: $('rowContact'),
    rowPassword: $('rowPassword'),
    form: $('signupForm'),
    signUp: $('signUpBtn'),
    toast: $('toast'),
  };

  const STORAGE = {
    AVATAR: 'bloom.avatar',
    SIGNUP_DRAFT: 'bloom.signupDraft',
  };

  // ----- Toast -----
  let toastTimer;
  function toast(msg, variant = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.classList.toggle('error', variant === 'error');
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  // ----- Restore avatar & any half-filled draft -----
  function restore() {
    const savedAvatar = localStorage.getItem(STORAGE.AVATAR);
    if (savedAvatar) els.avatarImg.src = savedAvatar;

    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE.SIGNUP_DRAFT) || '{}');
      if (draft.nickname) els.nickname.value = draft.nickname;
      if (draft.contact) els.contact.value = draft.contact;
      if (draft.invite) els.invite.value = draft.invite;
    } catch (_) { /* ignore malformed draft */ }
  }

  function saveDraft() {
    const draft = {
      nickname: els.nickname.value,
      contact: els.contact.value,
      invite: els.invite.value,
    };
    localStorage.setItem(STORAGE.SIGNUP_DRAFT, JSON.stringify(draft));
  }

  // ----- Avatar upload -----
  els.avatarInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Please choose an image file', 'error');
    if (file.size > 4 * 1024 * 1024) return toast('Image must be under 4MB', 'error');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      els.avatarImg.src = dataUrl;
      try {
        localStorage.setItem(STORAGE.AVATAR, dataUrl);
        toast('Photo updated 🌸');
      } catch {
        toast('Photo too large to save', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  // ----- Password show / hide -----
  els.togglePw.addEventListener('click', () => {
    const isHidden = els.password.type === 'password';
    els.password.type = isHidden ? 'text' : 'password';
    els.eyeOpen.style.display = isHidden ? '' : 'none';
    els.eyeOff.style.display = isHidden ? 'none' : '';
    els.togglePw.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  // ----- Paste invite code from clipboard -----
  els.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast('Clipboard is empty', 'error');
      els.invite.value = text.trim();
      saveDraft();
      toast('Invite code pasted ✨');
    } catch {
      toast('Cannot read clipboard — paste manually', 'error');
      els.invite.focus();
    }
  });

  // ----- Send verification code (mock) -----
  els.sendCode.addEventListener('click', () => {
    const val = els.contact.value.trim();
    if (!val) {
      els.rowContact.classList.add('error');
      return toast('Enter phone or email first', 'error');
    }
    toast(`Verification code sent to ${val}`);
  });

  // ----- Clear error on input; save draft -----
  const bindClearError = (input, row) => {
    input.addEventListener('input', () => {
      row.classList.remove('error');
      saveDraft();
    });
  };
  bindClearError(els.nickname, els.rowNickname);
  bindClearError(els.contact, els.rowContact);
  bindClearError(els.password, els.rowPassword);
  els.invite.addEventListener('input', saveDraft);

  // ----- Validation -----
  function validate() {
    const problems = [];
    const nickname = els.nickname.value.trim();
    const contact = els.contact.value.trim();
    const password = els.password.value;

    if (!nickname) {
      els.rowNickname.classList.add('error');
      problems.push('Please choose a nickname');
    } else if (nickname.length < 2) {
      els.rowNickname.classList.add('error');
      problems.push('Nickname is too short');
    }

    if (!contact) {
      els.rowContact.classList.add('error');
      problems.push('Enter your email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      els.rowContact.classList.add('error');
      problems.push('Please enter a valid email address');
    }

    if (!password) {
      els.rowPassword.classList.add('error');
      problems.push('Please set a password');
    } else if (password.length < 8) {
      els.rowPassword.classList.add('error');
      problems.push('Password must be at least 8 characters');
    }

    if (!els.agree.checked) {
      problems.push('Please agree to the guidelines to continue');
    }

    return problems;
  }

  // ----- Submit -----
  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problems = validate();
    if (problems.length) return toast(problems[0], 'error');

    els.signUp.disabled = true;
    const original = els.signUp.textContent;
    els.signUp.textContent = 'Planting… 🌱';

    const email = els.contact.value.trim().toLowerCase();
    const payload = {
      username: els.nickname.value.trim(),
      email,
      password: els.password.value,
      profileImage: localStorage.getItem(STORAGE.AVATAR) || null,
    };

    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.status === 409) {
        toast('That email or nickname is already taken', 'error');
        return;
      }
      if (resp.status === 422) {
        const detail = await resp.json().catch(() => ({}));
        const msg = detail?.detail?.[0]?.msg || 'Please check your inputs';
        toast(msg, 'error');
        return;
      }
      if (!resp.ok) {
        toast(`Something went wrong (${resp.status})`, 'error');
        return;
      }

      const data = await resp.json();
      localStorage.setItem('bloom.token', data.access_token);
      localStorage.setItem('bloom.username', email);
      localStorage.removeItem(STORAGE.SIGNUP_DRAFT);

      toast('Account created! Redirecting to sign in… 🌷');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 900);
    } catch (err) {
      toast('Cannot reach server — is the backend running?', 'error');
    } finally {
      els.signUp.disabled = false;
      els.signUp.textContent = original;
    }
  });

  // Boot
  restore();
})();
