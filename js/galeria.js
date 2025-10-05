(() => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const items  = Array.from(grid.querySelectorAll('.g-item'));
  const chips  = Array.from(document.querySelectorAll('.gallery-filters .chip'));

  /* ====== Filtros ====== */
  const applyFilter = (cat) => {
    items.forEach((el) => {
      const show = cat === '*' ? true : el.classList.contains(cat);
      el.style.display = show ? '' : 'none';
    });
  };

  chips.forEach((btn) => {
    btn.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  });

  /* ====== Lightbox ====== */
  const lb     = document.getElementById('lightbox');
  const lbImg  = document.getElementById('lbImg');
  const lbCap  = document.getElementById('lbCap');
  const btnC   = lb.querySelector('.lb-close');
  const btnP   = lb.querySelector('.lb-prev');
  const btnN   = lb.querySelector('.lb-next');

  let currentIndex = 0;

  const visibleItems = () =>
    items.filter(el => el.style.display !== 'none');

  const open = (indexFromDOM) => {
    const list = visibleItems();
    currentIndex = Math.max(0, list.indexOf(items[indexFromDOM]));
    if (currentIndex === -1) currentIndex = 0;
    render();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const render = () => {
    const list = visibleItems();
    const el   = list[currentIndex] || list[0];
    if (!el) return;
    const img  = el.querySelector('img');
    const cap  = el.querySelector('figcaption')?.textContent || '';
    lbImg.src  = img.currentSrc || img.src;
    lbImg.alt  = img.alt || cap;
    lbCap.textContent = cap;
  };

  const next = () => {
    const list = visibleItems();
    currentIndex = (currentIndex + 1) % list.length;
    render();
  };
  const prev = () => {
    const list = visibleItems();
    currentIndex = (currentIndex - 1 + list.length) % list.length;
    render();
  };

  // Abrir al click
  items.forEach((el) => {
    el.addEventListener('click', () => open(Number(el.dataset.index)));
  });

  // Controles
  btnC.addEventListener('click', close);
  btnN.addEventListener('click', next);
  btnP.addEventListener('click', prev);

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')  close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  // Cerrar al click de fondo
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });
})();
