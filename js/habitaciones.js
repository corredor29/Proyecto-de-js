// /js/habitaciones.js
(() => {
  // ======= Cache de nodos
  const $modal   = document.getElementById('hbModal');
  const $mainImg = document.getElementById('hbMainImg');
  const $thumbs  = document.getElementById('hbThumbs');

  const $name = document.querySelector('.hb-name');
  const $sub  = document.querySelector('.hb-sub');
  const $priceEl = document.querySelector('.hb-price');

  let currentImages = [];
  let currentIndex  = 0;

  // ======= Utilidades
  const fmtPrice = (num) => {
    if (typeof num === 'string') num = Number(num.replace(/[^\d.-]/g, ''));
    if (!isFinite(num)) return '$ —';
    // Ajusta la región si quieres (es-AR, es-CO, es-CL, etc.)
    return `$ ${num.toLocaleString('es-AR')}`;
  };

  const lockScroll = () => {
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
  };
  const unlockScroll = () => {
    document.documentElement.style.scrollbarGutter = '';
    document.body.style.overflow = '';
  };

  // ======= Thumbs / Imagen principal
  function setMainImgByIndex(idx) {
    if (!currentImages.length) return;
    currentIndex = (idx + currentImages.length) % currentImages.length;

    const src = currentImages[currentIndex];
    $mainImg.src = src;
    $mainImg.alt = `Foto ${currentIndex + 1} de la habitación`;

    // Estado visual en thumbs
    [...$thumbs.querySelectorAll('img')].forEach((img, i) => {
      img.classList.toggle('active', i === currentIndex);
      img.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });
  }

  function buildThumbs(images = []) {
    currentImages = images;
    $thumbs.innerHTML = '';

    images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Miniatura ${i + 1}`;
      img.decoding = 'async';
      img.loading = 'lazy';
      if (i === 0) img.classList.add('active');
      img.addEventListener('click', () => setMainImgByIndex(i));
      $thumbs.appendChild(img);
    });

    setMainImgByIndex(0);
  }

  // Expuesto para el onclick que ya tienes en el HTML
  function setMainImg(el) {
    const idx = [...$thumbs.querySelectorAll('img')].indexOf(el);
    if (idx >= 0) setMainImgByIndex(idx);
  }

  // ======= Modal
  function openModal() {
    if (!$modal) return;
    $modal.classList.add('show');
    $modal.removeAttribute('aria-hidden');
    lockScroll();
    // Foco al botón cerrar por accesibilidad
    const closeBtn = $modal.querySelector('.hb-modal-close');
    closeBtn && closeBtn.focus();
  }

  function closeModal() {
    if (!$modal) return;
    $modal.classList.remove('show');
    $modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }

  // Exponer closeModal para el onclick del HTML
  window.closeModal = closeModal;
  window.setMainImg = setMainImg;

  // ======= Poblar datos
  function updateRoomModal({ title, subtitle, price, images }) {
    if ($name && title)   $name.textContent = title;
    if ($sub && subtitle) $sub.textContent  = subtitle;
    if ($priceEl) {
      const valEl = $priceEl.querySelector('.hb-price-currency + .hb-price-value') || null;
      // Estructura de tu HTML muestra todo el precio junto; reescribimos el texto:
      $priceEl.innerHTML = `<span class="hb-price-currency">$</span>${fmtPrice(price).replace('$ ', '')}`;
    }
    buildThumbs(images && images.length ? images : [$mainImg.src]);
  }

  // ======= Disparadores (cards/botones)
  function wireOpeners() {
    const triggers = document.querySelectorAll('.js-open-hb');
    triggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const { title, sub, price, images } = btn.dataset;
        let pics = [];
        try {
          pics = images ? JSON.parse(images) : [];
        } catch { pics = []; }

        updateRoomModal({
          title: title || 'Habitación',
          subtitle: sub || '',
          price: price || 0,
          images: pics
        });
        openModal();
      });
    });
  }

  // ======= Eventos globales
  // Cerrar con ESC
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && $modal.classList.contains('show')) {
      closeModal();
    }
  });

  // Cerrar si se hace click fuera del diálogo (backdrop)
  if ($modal) {
    const backdrop = $modal.querySelector('.hb-modal-backdrop');
    backdrop && backdrop.addEventListener('click', closeModal, { passive: true });
  }

  // Navegación con flechas del teclado (opcional)
  document.addEventListener('keydown', (ev) => {
    if (!$modal.classList.contains('show')) return;
    if (!currentImages.length) return;

    if (ev.key === 'ArrowRight') setMainImgByIndex(currentIndex + 1);
    if (ev.key === 'ArrowLeft')  setMainImgByIndex(currentIndex - 1);
  });

  // ======= Init
  document.addEventListener('DOMContentLoaded', () => {
    wireOpeners();

    // Si alguien llama programáticamente:
    window.openRoomModal = (data) => {
      updateRoomModal(data || {});
      openModal();
    };
  });
})();
