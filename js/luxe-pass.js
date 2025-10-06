// /js/auth-luxe.js — Auth sin alertas, diseño luxe + medidor de contraseña
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ====== Nodos base
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

  // ====== Storage
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

  // ====== Utils
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

  // ====== UI helpers
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
    // Sincroniza widget al abrir registro
    if (register) setTimeout(() => updatePwWidget(pwInput?.value || ''), 0);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    cleanMsgs();
    fLogin?.reset();
    fReg?.reset();
    updatePwWidget(''); // reset widget
  };

  // Mostrar/ocultar contraseña
  modal?.addEventListener('click', (e) => {
    const btn = e.target.closest('.luxe-eye');
    if (!btn) return;
    const input = btn.previousElementSibling;
    if (input) input.type = (input.type === 'password' ? 'text' : 'password');
  });

  // Abrir modal desde el botón del header eliminando viejos listeners con alert
  document.addEventListener('DOMContentLoaded', () => {
    if (!btnOpen) return;
    const clone = btnOpen.cloneNode(true);
    btnOpen.parentNode.replaceChild(clone, btnOpen);
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

  // Cambiar estado login/register
  goRegister?.addEventListener('click', () => { cleanMsgs(); card?.classList.add('is-register');  updatePwWidget(pwInput?.value || ''); });
  goLogin?.addEventListener('click',    () => { cleanMsgs(); card?.classList.remove('is-register'); });

  // Forgot: mensaje inline (sin alert)
  $('#luxeForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    setMsg(msgLogin, 'Demo local: para restablecer, edita o borra el usuario en LocalStorage.', 'info');
  });

  // ====== Registro
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

  // ====== Login
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

  // ====== Header mini UI (hola, {nombre})
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

  // ====== Password strength widget ======
  const pwInput   = $('#luxeRegister input[name="password"]');
  const pwWidget  = $('#pwWidget');
  const pwFill    = $('#pwFill');
  const pwLabel   = $('#pwLabel');
  const pwRing    = pwWidget?.querySelector('.prog');
  const pwTipsLis = pwWidget ? [...pwWidget.querySelectorAll('.pw-tips li')] : [];
  const CIRC      = 113; // 2πr con r=18 (stroke-dasharray)

  function scorePassword(v) {
    const parts = {
      len: v.length >= 6,
      uc: /[A-Z]/.test(v),
      lc: /[a-z]/.test(v),
      num: /[0-9]/.test(v),
      sym: /[^A-Za-z0-9]/.test(v)
    };
    let s = 0;
    if (parts.len) s += Math.min(30, (v.length - 5) * 3);
    if (parts.uc)  s += 15;
    if (parts.lc)  s += 15;
    if (parts.num) s += 20;
    if (parts.sym) s += 20;
    s = Math.max(0, Math.min(100, s));

    let state = 'weak', label = 'Débil';
    if (s >= 75)      { state = 'strong'; label = 'Excelente'; }
    else if (s >= 55) { state = 'good';   label = 'Buena'; }
    else if (s >= 35) { state = 'fair';   label = 'Regular'; }

    return { score: s, state, label, parts };
  }

  function spawnSparks(lock) {
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const ang  = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 10;
      s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
      lock.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  function updatePwWidget(v) {
    if (!pwWidget) return;
    const { score, state, label, parts } = scorePassword(v);

    pwWidget.classList.remove('weak','fair','good','strong');
    pwWidget.classList.add(state);
    pwLabel.textContent = v ? `Seguridad: ${label}` : 'Seguridad: —';
    if (pwFill) pwFill.style.width = `${score}%`;
    if (pwRing) pwRing.style.strokeDashoffset = (CIRC - (CIRC * score / 100));

    pwTipsLis.forEach(li => {
      const k = li.dataset.k;
      li.classList.toggle('is-ok', !!parts[k]);
    });

    const lock = pwWidget.querySelector('.pw-lock');
    if (lock) {
      lock.classList.toggle('glow', state === 'strong');
      if (state === 'strong' && v.length) spawnSparks(lock);
    }
  }

  pwInput?.addEventListener('input', (e) => updatePwWidget(e.target.value));
  // Cuando abres registro vía evento externo
  window.addEventListener('open-register', () => setTimeout(() => updatePwWidget(pwInput?.value || ''), 0));

  // Auto init
  document.addEventListener('DOMContentLoaded', updateHeaderUI);
})();
