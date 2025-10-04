// Mobile menu toggle
const menuToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Active link by URL (if no data-active set manually)
(function setActiveLinkByPath(){
  const links = document.querySelectorAll('.nav a');
  const path = location.pathname.split('/').pop() || 'index.html';
  let matched = false;
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === path) {
      link.setAttribute('data-active', 'true');
      matched = true;
    } else {
      link.removeAttribute('data-active');
    }
  });
  if (!matched && (path === '' || path === '/')) {
    const home = [...links].find(a => /index\.html$/i.test(a.getAttribute('href')));
    if (home) home.setAttribute('data-active','true');
  }
})();

document.getElementById('btnLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  alert('Open your auth modal here');
});

document.addEventListener('DOMContentLoaded', () => {
  // Toggle menú móvil
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  // Mantener --header-height actualizada (hero = 100vh - header)
  const header = document.querySelector('.site-header');
  const setHeaderHeight = () => {
    const h = header ? header.offsetHeight : 64;
    document.documentElement.style.setProperty('--header-height', `${h}px`);
  };
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight, { passive: true });
});
