// app.js — utilidades globales de la UI
(() => {
  'use strict';

  const doc = document;
  const $  = (s, root = doc) => root.querySelector(s);
  const $$ = (s, root = doc) => Array.from(root.querySelectorAll(s));

  /* ========== CSS var: --header-height (para hero 100vh real) ========== */
  const header = $('.site-header');
  const setHeaderHeight = () => {
    const h = header ? header.offsetHeight : 64;
    document.documentElement.style.setProperty('--header-height', `${h}px`);
  };
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight, { passive: true });

  /* ========== Menú móvil (accesible) ========== */
  const toggle = $('.nav-toggle');
  const nav    = $('.nav');

  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };
    const openNav = () => {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    };
    const toggleNav = () => (nav.classList.contains('open') ? closeNav() : openNav());

    toggle.addEventListener('click', toggleNav);
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    $$('.nav a').forEach((a) => a.addEventListener('click', closeNav));
  }

  /* ========== Marcar link activo por URL (si no está seteado) ========== */
  (() => {
    const links = $$('.nav a');
    if (!links.length) return;

    if (links.some((a) => a.getAttribute('data-active') === 'true')) return;

    const path = location.pathname.split('/').pop() || 'index.html';
    let found = false;

    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      const match = href === path || (path === '' && /index\.html$/i.test(href));
      if (match) {
        a.setAttribute('data-active', 'true');
        found = true;
      } else {
        a.removeAttribute('data-active');
      }
    });

    if (!found) links[0]?.setAttribute('data-active', 'true');
  })();

  /* ========== Animación “reveal” para servicios ========== */
  (() => {
    const cards = $$('.service-card');
    if (!cards.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add('is-visible');
            io.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    cards.forEach((el) => io.observe(el));
  })();
})();

/* ========= Footer: utilidades (año, newsletter, país, to-top) ========= */
(() => {
  const yearEl = document.getElementById('copyYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Newsletter (demo a localStorage; cambia por tu API si la tienes)
  const form = document.getElementById('newsForm');
  const email = document.getElementById('newsEmail');
  const msg = document.getElementById('newsMsg');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = (email?.value || '').trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok){
      if (msg) { msg.textContent = 'Ingresa un correo válido.'; msg.style.color = '#fca5a5'; }
      return;
    }
    const key = 'erc_newsletter';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    if (!list.includes(val)) list.push(val);
    localStorage.setItem(key, JSON.stringify(list));
    if (msg) { msg.textContent = '¡Gracias por suscribirte! 🎉'; msg.style.color = '#86efac'; }
    form.reset();
  });

  // Selector de país (persistencia simple)
  const cSel = document.getElementById('countrySelect');
  if (cSel){
    const saved = localStorage.getItem('erc_country');
    if (saved) cSel.value = saved;
    cSel.addEventListener('change', () => {
      localStorage.setItem('erc_country', cSel.value);
    });
  }

  // Volver arriba
  document.querySelector('.to-top')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ===== Footer: construir mapa del sitio con lo que ya existe ===== */
(() => {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const pagesEl    = $('#footPages');
  const sectionsEl = $('#footSections');
  const quickEl    = $('#footQuick');

  // Normaliza texto: si el <a> no tiene texto, lo generamos a partir del slug
  const pretty = (str) => {
    if (!str) return '';
    return str
      .replace(/[-_]+/g, ' ')
      .replace(/\.\w+$/, '')
      .replace(/^\//, '')
      .replace(/(^|\s)\S/g, s => s.toUpperCase())
      .trim();
  };

  // 1) Páginas (.html absolutas/relativas dentro del sitio)
  if (pagesEl) {
    const anchors = $$('a[href]');
    const sameHost = (href) => {
      try {
        const u = new URL(href, location.origin);
        return u.origin === location.origin;
      } catch { return false; }
    };

    const pageSet = new Map(); // pathname -> {href, text}
    anchors.forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (!sameHost(href)) return;

      const u = new URL(href, location.origin);
      const isHtml = u.pathname.endsWith('.html') || u.pathname === '/' || u.pathname === '/index.html';
      if (!isHtml) return;

      const key = u.pathname === '/' ? '/index.html' : u.pathname;
      if (!pageSet.has(key)) {
        const label = (a.textContent || pretty(u.pathname)).trim() || 'Página';
        pageSet.set(key, { href: u.pathname, text: label });
      }
    });

    // Asegurar páginas principales aunque no haya enlaces visibles
    [['/index.html','Inicio'], ['/reservas.html','Reservas'], ['/contacto.html','Contacto']]
      .forEach(([p,t]) => { if (!pageSet.has(p)) pageSet.set(p, {href:p, text:t}); });

    pagesEl.innerHTML = [...pageSet.values()]
      .sort((a,b)=> a.text.localeCompare(b.text,'es'))
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`)
      .join('');
  }

  // 2) Secciones (busca <section id="..."> con un <h2> dentro)
  if (sectionsEl) {
    const sections = $$('section[id]');
    const items = sections.map(sec => {
      const h2 = $('h2, [role="heading"][aria-level="2"]', sec);
      const text = (h2?.textContent || pretty(sec.id) || 'Sección').trim();
      return { href: `#${sec.id}`, text };
    });

    // De-duplicar por href
    const uniq = [];
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.href)) continue;
      seen.add(it.href);
      uniq.push(it);
    }

    sectionsEl.innerHTML = uniq
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`)
      .join('');
  }

  // 3) Accesos rápidos (clona el menú principal + chips de la galería si existen)
  if (quickEl) {
    const menuLinks = $$('.nav a[href]');
    const chips     = $$('.gallery-filters .chip[data-filter]');
    const fast = [];

    // Menú principal
    menuLinks.forEach(a => {
      const href = a.getAttribute('href');
      const txt  = (a.textContent || '').trim();
      if (href && txt) fast.push({ href, text: txt });
    });

    // Filtros de galería (atajos a #galeria)
    chips.forEach(c => {
      const txt = (c.textContent || '').trim();
      fast.push({ href: '#galeria', text: txt });
    });

    // De-duplicar por (href+text)
    const uniq = [];
    const seen = new Set();
    fast.forEach(it => {
      const key = `${it.href}|${it.text.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      uniq.push(it);
    });

    const blocked = new Set(['Spa & Wellness','Gastronomía','Exteriores','Eventos'].map(s=>s.toLowerCase()));
    const cleaned = uniq.filter(it => !blocked.has(it.text.trim().toLowerCase()));



    quickEl.innerHTML = cleaned
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`)
      .join('');
  }
})();
