// /js/auth-luxe.js — Auth sin alertas, diseño luxe
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const modal   = $('#luxeAuth');
  const card    = modal?.querySelector('.luxe-auth__card');
  const btnOpen = $('#btnLogin');

  const btnCloseEls = $$('[data-close]', modal);
  const goRegister  = $('#goRegister');
  const goLogin     = $('#goLogin');

  const fLogin   = $('#luxeLogin');
  const fReg     = $('#luxeRegister');
  const msgLogin = $('#luxeLoginMsg');
  const msgReg   = $('#luxeRegMsg');

  const LS_USERS   = 'erc_users';
  const LS_SESSION = 'erc_session';

  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
    catch { return []; }
  };
  const saveUsers = (arr) => localStorage.setItem(LS_USERS, JSON.stringify(arr));

  const getSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(LS_SESSION) || localStorage.getItem(LS_SESSION)) || null;
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

  // UI helpers
  const setMsg = (el, text, cls) => {
    if (!el) return;
    el.textContent = text || '';
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

  // Mostrar/ocultar contraseña
  modal?.addEventListener('click', (e) => {
    const btn = e.target.closest('.luxe-eye');
    if (!btn) return;
    const input = btn.previousElementSibling;
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Abrir modal desde el botón del header (forzando eliminar viejos listeners con alert)
  document.addEventListener('DOMContentLoaded', () => {
    if (!btnOpen) return;

    // 1) Limpia posibles listeners antiguos clonando el botón
    const clone = btnOpen.cloneNode(true);
    btnOpen.parentNode.replaceChild(clone, btnOpen);

    // 2) Listener limpio (sin alertas) + captura para bloquear otros
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openModal(false);
    }, true);
  });

  // Cerrar modal
  btnCloseEls.forEach(b => b.addEventListener('click', closeModal));
  modal?.addEventListener('click', (e) => { if (e.target.matches('.luxe-auth__overlay')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal(); });

  // Cambiar estado
  goRegister?.addEventListener('click', () => { cleanMsgs(); card?.classList.add('is-register'); });
  goLogin?.addEventListener('click', () => { cleanMsgs(); card?.classList.remove('is-register'); });

  // Forgot (mensaje inline)
  $('#luxeForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    setMsg(msgLogin, 'Demo local: para restablecer, edita o borra el usuario en LocalStorage.', 'info');
  });

  // Registro
  fReg?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cleanMsgs();

    const fd = new FormData(fReg);
    const name  = (fd.get('name')  || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim().toLowerCase();
    const pass  = (fd.get('password') || '').toString();
    const terms = !!fd.get('terms');

    if (!name || !email || !pass || !terms) return setMsg(msgReg, 'Completa todos los campos y acepta los términos.', 'err');
    if (!isEmail(email))                 return setMsg(msgReg, 'Correo no válido.', 'err');
    if (pass.length < 6)                 return setMsg(msgReg, 'La contraseña debe tener al menos 6 caracteres.', 'err');

    const users = getUsers();
    if (users.some(u => u.email === email)) return setMsg(msgReg, 'Ya existe una cuenta con ese correo.', 'err');

    const hash = await weakHash(pass);
    users.push({ name, email, pass: hash, createdAt: Date.now() });
    saveUsers(users);

    saveSession({ name, email, ts: Date.now() }, true);
    setMsg(msgReg, '¡Cuenta creada! Conectando…', 'ok');

    updateHeaderUI();
    setTimeout(closeModal, 700);
  });

  // Login
  fLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cleanMsgs();

    const fd = new FormData(fLogin);
    const email = (fd.get('email') || '').toString().trim().toLowerCase();
    const pass  = (fd.get('password') || '').toString();
    const remember = !!fd.get('remember');

    if (!isEmail(email) || !pass) return setMsg(msgLogin, 'Revisa correo/contraseña.', 'err');

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return setMsg(msgLogin, 'Usuario no encontrado.', 'err');

    const hash = await weakHash(pass);
    if (user.pass !== hash) return setMsg(msgLogin, 'Contraseña incorrecta.', 'err');

    saveSession({ name: user.name, email: user.email, ts: Date.now() }, remember);
    setMsg(msgLogin, '¡Bienvenido!', 'ok');

    updateHeaderUI();
    setTimeout(closeModal, 500);
  });

  // Header mini UI
  function updateHeaderUI() {
    const s = getSession();
    const btn = $('#btnLogin');
    if (!btn || !s) return;

    btn.outerHTML = `
      <div class="auth-mini">
        <button class="btn btn-login" id="btnUser">${(s.name || 'Tu cuenta').split(' ')[0]}</button>
        <div class="auth-mini-menu" id="miniMenu" hidden>
          <div class="mini-row">${s.email}</div>
          <button class="mini-action" id="btnLogout">Cerrar sesión</button>
        </div>
      </div>
    `;
    $('#btnUser')?.addEventListener('click', () => {
      const mm = $('#miniMenu'); if (mm) mm.hidden = !mm.hidden;
    });
    $('#btnLogout')?.addEventListener('click', () => { clearSession(); location.reload(); });
    document.addEventListener('click', (ev) => {
      const wrap = ev.target.closest('.auth-mini');
      if (!wrap) { const mm = $('#miniMenu'); if (mm) mm.hidden = true; }
    });
  }

  // Exponer eventos opcionales
  window.addEventListener('open-auth',     () => openModal(false));
  window.addEventListener('open-register', () => openModal(true));

  // Auto init (si ya hay sesión)
  document.addEventListener('DOMContentLoaded', updateHeaderUI);
})();
