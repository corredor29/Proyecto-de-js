// app.js — utilidades globales de la UI
(() => {
  const doc = document;
  const $  = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));

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

    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', closeNav));
  }

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

  $('#btnLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Aquí abrirías tu modal de autenticación.');
  });

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
