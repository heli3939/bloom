(() => {
    const $ = (id) => document.getElementById(id);
    const API_BASE = 'http://localhost:8000';

    const els = {
        home: $('homeBtn'),
        friendId: $('friendId'),
        idWrap: $('idInputWrap'),
        pasteBtn: $('pasteBtn'),
        copyBtn: $('copyBtn'),
        bindBtn: $('bindBtn'),
        myId: $('myId'),
        toast: $('toast'),
    };

    const STORAGE = { TOKEN: 'bloom.token' };

    // ----- Toast -----
    let toastTimer;
    function toast(msg, variant = 'success') {
        clearTimeout(toastTimer);
        els.toast.textContent = msg;
        els.toast.classList.toggle('error', variant === 'error');
        els.toast.classList.add('show');
        toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
    }

    // ----- Load current user's Garden Code from backend -----
    async function loadMyId() {
        const token = localStorage.getItem(STORAGE.TOKEN);
        if (!token) {
            els.myId.textContent = 'BLM???';
            return;
        }
        try {
            const resp = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) {
                els.myId.textContent = 'BLM???';
                return;
            }
            const me = await resp.json();
            els.myId.textContent = me.gardenCode || 'BLM???';
        } catch {
            els.myId.textContent = 'BLM???';
        }
    }

    // ----- Paste from clipboard -----
    els.pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return toast('Clipboard is empty', 'error');
            els.friendId.value = text.trim().toUpperCase();
            els.idWrap.classList.remove('error');
            toast('Friend code pasted ✨');
        } catch {
            toast('Cannot read clipboard — paste manually', 'error');
            els.friendId.focus();
        }
    });

    // ----- Copy My ID -----
    els.copyBtn.addEventListener('click', async () => {
        const text = els.myId.textContent.trim();
        try {
            await navigator.clipboard.writeText(text);
            toast(`Copied ${text} 🌸`);
        } catch {
            // Fallback: select & prompt
            toast(`Your ID is ${text}`);
        }
    });

    // Clear error on typing
    els.friendId.addEventListener('input', () => {
        els.idWrap.classList.remove('error');
    });

    // ----- Bind Our Sprout Together -----
    els.bindBtn.addEventListener('click', async () => {
        const code = els.friendId.value.trim().toUpperCase();
        if (!code) {
            els.idWrap.classList.add('error');
            return toast("Enter your friend's Garden Code first", 'error');
        }
        if (!/^BLM\d{3,}$/.test(code)) {
            els.idWrap.classList.add('error');
            return toast('Code should look like BLM001', 'error');
        }
        if (code === els.myId.textContent.trim()) {
            els.idWrap.classList.add('error');
            return toast("That's your own code!", 'error');
        }

        const token = localStorage.getItem(STORAGE.TOKEN);
        if (!token) {
            return toast('Please sign in first', 'error');
        }

        els.bindBtn.disabled = true;
        const original = els.bindBtn.textContent;
        els.bindBtn.textContent = 'Binding… 🌱';

        try {
            const resp = await fetch(`${API_BASE}/api/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gardenCode: code }),
            });

            if (resp.status === 401) {
                toast('Session expired — please sign in again', 'error');
                return;
            }
            if (resp.status === 404) {
                els.idWrap.classList.add('error');
                toast('No gardener found with that code', 'error');
                return;
            }
            if (resp.status === 409) {
                toast("You've already bound this gardener", 'error');
                return;
            }
            if (!resp.ok) {
                toast(`Something went wrong (${resp.status})`, 'error');
                return;
            }

            const friend = await resp.json();
            toast(`Sprout bound with ${friend.username}! 🌷`);
            els.friendId.value = '';
        } catch {
            toast('Cannot reach server — is the backend running?', 'error');
        } finally {
            els.bindBtn.disabled = false;
            els.bindBtn.textContent = original;
        }
    });

    // Boot
    loadMyId();
})();