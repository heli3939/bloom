(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    home: $('homeBtn'),
    friendId: $('friendId'),
    idWrap: $('idInputWrap'),
    pasteBtn: $('pasteBtn'),
    copyBtn: $('copyBtn'),
    bindBtn: $('bindBtn'),
    myId: $('myId'),
    toast: $('toast'),
    bestieBadge: document.querySelector('.bestie-badge'),
    bestieLabel: document.querySelector('.gardener:last-child .gardener-label'),
  };

  if (!localStorage.getItem('bloom_token')) {
    window.location.replace('login.html');
    return;
  }

  els.home.addEventListener('click', goToGarden);

  let toastTimer;
  function toast(msg, variant = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.classList.toggle('error', variant === 'error');
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function showBestie(friend) {
    if (!friend) return;
    if (els.bestieBadge) els.bestieBadge.textContent = 'BESTIE';
    if (els.bestieLabel) els.bestieLabel.textContent = friend.username;
  }

  function bindErrorMessage(err) {
    const msg = err && err.message ? err.message : '';
    if (/user not found|no gardener found/i.test(msg)) {
      return 'No gardener found with that code';
    }
    return msg || 'Something went wrong';
  }

  async function loadMyId() {
    try {
      const me = await bloomRequest('/api/auth/me');
      els.myId.textContent = me.username || me.gardenCode || '???';
      const data = await bloomRequest('/api/friends');
      if (data.friends && data.friends[0]) showBestie(data.friends[0]);
    } catch (err) {
      els.myId.textContent = '???';
      if (/not authenticated|invalid or expired/i.test(err.message)) {
        window.location.replace('login.html');
      }
    }
  }

  els.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast('Clipboard is empty', 'error');
      const value = text.trim();
      els.friendId.value = /^blm/i.test(value) ? value.toUpperCase() : value;
      els.idWrap.classList.remove('error');
      toast('Friend code pasted ✨');
    } catch {
      toast('Cannot read clipboard — paste manually', 'error');
      els.friendId.focus();
    }
  });

  els.copyBtn.addEventListener('click', async () => {
    const text = els.myId.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text} 🌸`);
    } catch {
      toast(`Your ID is ${text}`);
    }
  });

  els.friendId.addEventListener('input', () => {
    els.idWrap.classList.remove('error');
  });

  els.bindBtn.addEventListener('click', async () => {
    const code = els.friendId.value.trim();
    if (!code) {
      els.idWrap.classList.add('error');
      return toast("Enter your friend's username first", 'error');
    }
    if (code.toUpperCase() === els.myId.textContent.trim().toUpperCase()) {
      els.idWrap.classList.add('error');
      return toast("That's your own code!", 'error');
    }

    els.bindBtn.disabled = true;
    const original = els.bindBtn.textContent;
    els.bindBtn.textContent = 'Binding… 🌱';

    const payload = { username: code };
    if (/^BLM\d{3,}$/i.test(code)) payload.gardenCode = code.toUpperCase();

    try {
      const friend = await bloomRequest('/api/friends', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showBestie(friend);
      els.friendId.value = '';
      toast(`Sprout bound with ${friend.username}! 🌷`);
      setTimeout(goToGarden, 900);
    } catch (err) {
      els.idWrap.classList.add('error');
      toast(bindErrorMessage(err), 'error');
      els.bindBtn.disabled = false;
      els.bindBtn.textContent = original;
    }
  });

  loadMyId();
})();
