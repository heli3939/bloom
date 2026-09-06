(() => {
  const $ = (id) => document.getElementById(id);

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

  let toastTimer;
  function toast(msg, variant = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.classList.toggle('error', variant === 'error');
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
  }

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

  function currentAvatar() {
    const src = els.avatarImg && els.avatarImg.src;
    return src && src.startsWith('data:') ? src : null;
  }

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

  els.togglePw.addEventListener('click', () => {
    const isHidden = els.password.type === 'password';
    els.password.type = isHidden ? 'text' : 'password';
    els.eyeOpen.style.display = isHidden ? '' : 'none';
    els.eyeOff.style.display = isHidden ? 'none' : '';
    els.togglePw.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

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

  els.sendCode.addEventListener('click', () => {
    const val = els.contact.value.trim();
    if (!val) {
      els.rowContact.classList.add('error');
      return toast('Enter phone or email first', 'error');
    }
    toast('Email/phone verification is not required yet');
  });

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
      problems.push('Enter phone or email');
    } else {
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      const looksLikePhone = /^\+?\d[\d\s-]{5,}$/.test(contact);
      if (!looksLikeEmail && !looksLikePhone) {
        els.rowContact.classList.add('error');
        problems.push('That doesn’t look like a valid phone or email');
      }
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

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problems = validate();
    if (problems.length) return toast(problems[0], 'error');

    els.signUp.disabled = true;
    const original = els.signUp.textContent;
    els.signUp.textContent = 'Planting… 🌱';

    const nickname = els.nickname.value.trim();
    const contact = els.contact.value.trim();
    const invite = els.invite.value.trim();

    try {
      const data = await bloomRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: nickname.slice(0, 40),
          email: contactToEmail(contact),
          password: els.password.value,
          profileImage: currentAvatar(),
        }),
      });
      saveSession(data);
      localStorage.setItem('bloom.username', nickname);
      localStorage.removeItem(STORAGE.SIGNUP_DRAFT);

      if (invite) {
        try {
          await bloomRequest('/api/friends', {
            method: 'POST',
            body: JSON.stringify({ username: invite }),
          });
        } catch (friendError) {
          toast(`Account saved, but invite failed: ${friendError.message}`, 'error');
          setTimeout(goToGarden, 1400);
          return;
        }
      }

      toast('Garden planted! Welcome 🌷');
      setTimeout(goToGarden, 700);
    } catch (err) {
      toast(err.message, 'error');
      els.signUp.disabled = false;
      els.signUp.textContent = original;
    }
  });

  restore();
})();
