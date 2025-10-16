(() => {
  'use strict';

  /* ===== Utils ===== */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ===== Nodos ===== */
  const modal   = $('#luxeAuth');
  const card    = modal?.querySelector('.luxe-auth__card');

  const btnCloseEls = $$('[data-close]', modal);
  const goRegister  = $('#goRegister');
  const goLogin     = $('#goLogin');

  const fLogin   = $('#luxeLogin');
  const fReg     = $('#luxeRegister');
  const msgLogin = $('#luxeLoginMsg');
  const msgReg   = $('#luxeRegMsg');

  /* ===== Storage ===== */
  const LS_USERS   = 'erc_users';
  const LS_SESSION = 'erc_session';

  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
    catch { return []; }
  };
  const saveUsers = (arr) => localStorage.setItem(LS_USERS, JSON.stringify(arr));

  const getSession = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(LS_SESSION) || localStorage.getItem(LS_SESSION)) || null;
      if (s && s.role) s.role = normalizeRole(s.role); // <- normaliza sesiones viejas con "abmin"
      return s;
    } catch { return null; }
  };
  const saveSession = (obj, remember = false) => {
    const str = JSON.stringify(obj);
    sessionStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_SESSION);
    (remember ? localStorage : sessionStorage).setItem(LS_SESSION, str);
  };
  const clearSession = () => {
    sessionStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_SESSION);
  };

  const roleFromEmail = (email='') => (/^admin@/i.test(String(email)) ? 'admin' : 'user');

  const normalizeRole = (r) => (String(r || 'user').toLowerCase() === 'abmin'
    ? 'admin'
    : String(r || 'user').toLowerCase());

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function weakHash(str) {
    if (window.crypto?.subtle) {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch { return str; }
  }

  /* ===== Seeding: crea admin si no existe ===== */
  async function seedAdmin() {
    const users = getUsers();
    const targetEmail = 'admin@hotelrincondelcarmen.com'; // <- en minúsculas
    const exists = users.some(u => (u.email || '').toLowerCase() === targetEmail);
    if (!exists) {
      const pass = await weakHash('Admin123!'); 
      users.push({
        name: 'Admin',
        email: targetEmail,
        role: 'admin',
        pass,
        createdAt: Date.now()
      });
      saveUsers(users);
    }
  }

  /* ===== UI helpers ===== */
  const setMsg = (el, text = '', cls = '') => {
    if (!el) return;
    el.textContent = text;
    el.className = 'luxe-msg' + (cls ? ` ${cls}` : '');
  };
  const cleanMsgs = () => { setMsg(msgLogin); setMsg(msgReg); };

  const openModal = (register = false) => {
    if (!modal || !card) return;
    card.classList.toggle('is-register', !!register);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    (register ? $('#luxeRegister input[name="name"]') : $('#luxeLogin input[name="email"]'))?.focus();
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    cleanMsgs();
    fLogin?.reset();
    fReg?.reset();
  };

  /* Mostrar / ocultar contraseña (ojo) */
  modal?.addEventListener('click', (e) => {
    const btn = e.target.closest('.luxe-eye');
    if (!btn) return;
    const input = btn.previousElementSibling;
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  /* Cerrar modal */
  btnCloseEls.forEach(b => b.addEventListener('click', closeModal));
  modal?.addEventListener('click', (e) => { if (e.target.matches('.luxe-auth__overlay')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal(); });

  /* Cambiar estado login/registro */
  goRegister?.addEventListener('click', () => { cleanMsgs(); card?.classList.add('is-register'); });
  goLogin?.addEventListener('click', () => { cleanMsgs(); card?.classList.remove('is-register'); });

  /* Forgot (mensaje inline) */
  $('#luxeForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    setMsg(msgLogin, 'Demo local: para restablecer, edita o borra el usuario en LocalStorage.', 'info');
  });

  /* ===== Header: botón Login -> abre modal ===== */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnLogin');
    if (btn) {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openModal(false);
      }, true);
    }
  });

  /* ===== Login ===== */
  fLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cleanMsgs();

    const fd = new FormData(fLogin);
    const email    = (fd.get('email') || '').toString().trim().toLowerCase();
    const pass     = (fd.get('password') || '').toString();
    const remember = !!fd.get('remember');

    if (!isEmail(email) || !pass) return setMsg(msgLogin, 'Revisa correo/contraseña.', 'err');

    const users = getUsers();
    const user  = users.find(u => (u.email || '').toLowerCase() === email);
    if (!user)   return setMsg(msgLogin, 'Usuario no encontrado.', 'err');

    const hash = await weakHash(pass);
    if (user.pass !== hash) return setMsg(msgLogin, 'Contraseña incorrecta.', 'err');

    // Rol desde usuario guardado o patrón, normalizado
    const role = normalizeRole(user.role || roleFromEmail(user.email));

    const sessionObj = { name: user.name, email: user.email, role, ts: Date.now() };
    saveSession(sessionObj, remember);
    setMsg(msgLogin, '¡Bienvenido!', 'ok');

    updateHeaderUI();
    window.dispatchEvent(new CustomEvent('auth:login', { detail: sessionObj }));
    setTimeout(closeModal, 500);
  });

  /* ===== Registro ===== */
  fReg?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cleanMsgs();

    const fd = new FormData(fReg);
    const name   = (fd.get('name') || '').toString().trim();
    const email  = (fd.get('email') || '').toString().trim().toLowerCase();
    const pass   = (fd.get('password') || '').toString();
    const terms  = !!fd.get('terms');

    if (!name || !email || !pass || !terms) return setMsg(msgReg, 'Completa todos los campos y acepta los términos.', 'err');
    if (!isEmail(email))                     return setMsg(msgReg, 'Correo no válido.', 'err');
    if (pass.length < 6)                     return setMsg(msgReg, 'La contraseña debe tener al menos 6 caracteres.', 'err');

    const users = getUsers();
    if (users.some(u => (u.email || '').toLowerCase() === email))  return setMsg(msgReg, 'Ya existe una cuenta con ese correo.', 'err');

    const hash = await weakHash(pass);
    const role = normalizeRole(roleFromEmail(email)); // demo: admin si empieza por admin@
    users.push({ name, email, role, pass: hash, createdAt: Date.now() });
    saveUsers(users);

    const sessionObj = { name, email, role, ts: Date.now() };
    saveSession(sessionObj, true); // recuerda por defecto al crear cuenta
    setMsg(msgReg, '¡Cuenta creada! Conectando…', 'ok');

    updateHeaderUI();
    window.dispatchEvent(new CustomEvent('auth:register', { detail: sessionObj }));
    window.dispatchEvent(new CustomEvent('auth:login',    { detail: sessionObj }));
    setTimeout(closeModal, 700);
  });

  /* ===== Mini menú de usuario en header ===== */
  function updateHeaderUI() {
    const s = getSession();
    const loginBtn = document.getElementById('btnLogin');
    if (!loginBtn) return;

    if (!s) {
      const freshBtn = document.getElementById('btnLogin');
      freshBtn?.addEventListener('click', (e) => { e.preventDefault(); openModal(false); });
      return;
    }

    const firstName = (s.name || 'Tu cuenta').trim().split(/\s+/)[0];
    const initials  = s.name ? s.name.trim().split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase()||'').join('') : 'RC';

    loginBtn.outerHTML = `
      <div class="auth-mini" id="authMini">
        <button class="auth-user" id="btnUser" aria-expanded="false" aria-haspopup="menu">
          <span class="auth-avatar" aria-hidden="true">${initials}</span>
          <span class="auth-label">${firstName.toLowerCase()}</span>
          <svg class="auth-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div class="auth-menu" id="miniMenu" role="menu" hidden>
          <div class="auth-menu__header">
            <span class="auth-avatar" aria-hidden="true">${initials}</span>
            <div class="auth-id">
              <strong>${s.name || 'Tu cuenta'}${s.role==='admin' ? ' · <small style="color:#22c55e">Admin</small>' : ''}</strong>
              <small>${s.email}</small>
            </div>
          </div>

          ${s.role==='admin' ? `<a href="admin.html" class="auth-menu__item" role="menuitem">Admin</a>` : ''}
          <a href="reservas.html" class="auth-menu__item" role="menuitem">Mis reservas</a>
          <button class="auth-menu__item danger" id="btnLogout" role="menuitem">Cerrar sesión</button>
        </div>
      </div>
    `;

    const userBtn = document.getElementById('btnUser');
    const menu    = document.getElementById('miniMenu');

    const showMenu = (show) => {
      const willShow = typeof show === 'boolean' ? show : menu.hidden;
      menu.hidden = !willShow;
      userBtn.setAttribute('aria-expanded', String(willShow));
    };

    userBtn?.addEventListener('click', (e) => { e.stopPropagation(); showMenu(menu.hidden); });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('#authMini') && !menu.hidden) showMenu(false); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') showMenu(false); });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      logout(); // usa la función pública
    });
  }

  /* ===== Password Strength Widget ===== */
  function initPwWidget() {
    const widget    = $('#pwWidget');
    const passInput = $('#luxeRegister input[name="password"]');
    if (!widget || !passInput) return;

    const fill  = $('#pwFill');
    const label = $('#pwLabel');
    const ring  = widget.querySelector('.ring .prog');
    const tips  = widget.querySelectorAll('.pw-tips li');
    const lock  = widget.querySelector('.pw-lock');

    const circ = 2 * Math.PI * 18;
    if (ring) {
      ring.style.strokeDasharray = String(circ);
      ring.style.strokeDashoffset = String(circ);
    }

    const setProgress = (pct) => {
      const off = circ * (1 - pct);
      if (ring) ring.style.strokeDashoffset = String(off);
      if (fill) fill.style.width = `${pct * 100}%`;
    };

    const scorePassword = (str) => {
      const s = String(str || '');
      const flags = {
        len: s.length >= 6,
        uc : /[A-ZÁÉÍÓÚÑ]/.test(s),
        lc : /[a-záéíóúñ]/.test(s),
        num: /\d/.test(s),
        sym: /[^A-Za-z0-9]/.test(s),
      };
      const score = Object.values(flags).reduce((a, b) => a + (b ? 1 : 0), 0); // 0..5
      return { flags, score };
    };

    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];

    const sparkle = () => {
      if (!lock) return;
      for (let i = 0; i < 3; i++) {
        const sp = document.createElement('span');
        sp.className = 'spark';
        const angle = Math.random() * 2 * Math.PI;
        const dist  = 16 + Math.random() * 10;
        sp.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        sp.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        lock.appendChild(sp);
        setTimeout(() => sp.remove(), 900);
      }
    };

    const update = () => {
      const { flags, score } = scorePassword(passInput.value);

      tips.forEach(li => {
        const k = li.getAttribute('data-k');
        if (k && flags[k]) li.classList.add('is-ok'); else li.classList.remove('is-ok');
      });

      const pct = Math.min(1, Math.max(0, score / 5));
      setProgress(pct);

      widget.classList.remove('weak','fair','good','strong');
      let state = 'weak';
      if (score >= 4) state = 'strong';
      else if (score === 3) state = 'good';
      else if (score === 2) state = 'fair';
      widget.classList.add(state);

      if (label) label.textContent = `Seguridad: ${labels[score] || '—'}`;
      if (state === 'strong') sparkle();
    };

    update();
    passInput.addEventListener('input', update);
    $('#goRegister')?.addEventListener('click', () => setTimeout(() => passInput.focus(), 220));
  }

  function requireAuth(onOk) {
    const s = getSession();
    if (s) { onOk?.(s); return; }
    openModal(false);
    const once = (ev) => { onOk?.(ev.detail || getSession()); };
    window.addEventListener('auth:login', once, { once: true });
  }

  /* ===== Guard de admin para páginas protegidas ===== */
  function ensureAdminPage() {
    const s = getSession();
    const currRole = normalizeRole(s?.role);
    if (!s || currRole !== 'admin') {
      openModal(false);
      const msg = document.getElementById('luxeLoginMsg');
      if (msg) {
        msg.textContent = 'Necesitas iniciar sesión como administrador.';
        msg.className = 'luxe-msg info';
      }
      const once = (ev) => {
        const sess = ev?.detail || getSession();
        if (normalizeRole(sess?.role) !== 'admin') {
          const m = document.getElementById('luxeLoginMsg');
          if (m) {
            m.textContent = 'Tu cuenta no es de administrador.';
            m.className = 'luxe-msg err';
          }
          openModal(false);
        }
      };
      window.addEventListener('auth:login', once, { once: true });
      return false;
    }
    return true;
  }

  /* ===== Logout público (para admin.js) ===== */
  function logout(redirect = 'index.html') {
    clearSession();
    window.dispatchEvent(new Event('auth:logout'));
    if (redirect) location.href = redirect;
  }

  window.ErcAuth = {
    getSession,
    clearSession,
    saveSession,
    requireAuth,
    ensureAdminPage,          // <- expuesto para admin.js
    logout,
    normalizeRole,            // <- opcionalmente expuesto
    onLogin:   (cb) => window.addEventListener('auth:login', cb),
    onLogout:  (cb) => window.addEventListener('auth:logout', cb),
    onRegister:(cb) => window.addEventListener('auth:register', cb),
    openLogin: () => openModal(false),
    openRegister: () => openModal(true),
  };

  window.addEventListener('open-auth',     () => openModal(false));
  window.addEventListener('open-register', () => openModal(true));

  document.addEventListener('DOMContentLoaded', async () => {
    // 1) Seed de admin ANTES de pintar UI
    await seedAdmin();
    // 2) Ahora sí, UI
    updateHeaderUI();
    initPwWidget();
  });
})();
