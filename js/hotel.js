// /js/hotel.js
(() => {
  const track = document.getElementById('hotelsTrack');
  if (!track) return;

  /* ===== Datos de ejemplo (ajusta a tus rutas reales) ===== */
  const hotels = [
    {
      id: "h1",
      name: "Ocean Paradise Resort",
      city: "Punta Cana",
      rating: 8.4,
      stars: 5,
      image: "/image/hotels/ocean-paradise.jpg",
      features: { beds: 2, wifi: true, minibar: true, hotTub: false },
      priceNow: 1066470, priceOld: 2132940, discount: 50,
      refDate: "25 octubre 2025"
    },
    {
      id: "h2",
      name: "Grand Oasis Cancún All Inclusive",
      city: "Cancún",
      rating: 6.1,
      stars: 4,
      image: "/image/hotels/grand-oasis.jpg",
      features: { beds: 2, wifi: true, minibar: true, hotTub: true },
      priceNow: 769691, priceOld: 2333397, discount: 67,
      refDate: "8 octubre 2025"
    },
    {
      id: "h3",
      name: "Caribbean Pyramid Hotel",
      city: "Cancún",
      rating: 7.1,
      stars: 4,
      image: "/image/hotels/pyramid.jpg",
      features: { beds: 1, wifi: true, minibar: false, hotTub: false },
      priceNow: 992024, priceOld: 2681146, discount: 63,
      refDate: "20 diciembre 2025"
    },
    {
      id: "h4",
      name: "Sun Bay Beach",
      city: "Cancún",
      rating: 7.0,
      stars: 4,
      image: "/image/hotels/sun-bay.jpg",
      features: { beds: 2, wifi: true, minibar: true, hotTub: false },
      priceNow: 886133, priceOld: 2685251, discount: 67,
      refDate: "17 octubre 2025"
    }
  ];

  /* ===== Helpers ===== */
  const formatCOP = n =>
    new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);

  const starsHTML = n => "★".repeat(n) + "☆".repeat(5 - n);

  const nextBtn = track.querySelector('.track-arrow.next');
  const prevBtn = track.querySelector('.track-arrow.prev');

  /* ===== Render ===== */
  const makeCard = (h) => {
    const f = h.features || {};
    return `
      <article class="hotel-card" data-id="${h.id}">
        <div class="hotel-media">
          <img src="${h.image}" alt="${h.name}" loading="lazy">
          <span class="hotel-chip chip-score">${h.rating.toFixed(1)}</span>
          <span class="hotel-chip chip-city">${h.city}</span>
          <span class="hotel-chip chip-stars">${starsHTML(h.stars)}</span>
        </div>

        <div class="hotel-body">
          <h3 class="hotel-title">${h.name}</h3>
          <p class="hotel-sub">1 noche, 2 personas</p>

          <div class="hotel-features">
            <span class="feature"><i class="fi fi-bed"></i>${f.beds || 1} camas</span>
            ${f.wifi ? `<span class="feature"><i class="fi fi-wifi"></i>Wi-Fi</span>` : ""}
            ${f.minibar ? `<span class="feature"><i class="fi fi-mini"></i>Minibar</span>` : ""}
            ${f.hotTub ? `<span class="feature"><i class="fi fi-hot-tub"></i>Jacuzzi</span>` : ""}
          </div>

          <div class="price-block">
            <div>
              <div class="price-now">${formatCOP(h.priceNow)}</div>
              <div class="price-old">${formatCOP(h.priceOld)}</div>
            </div>
            <div class="discount-badge">-${h.discount}%</div>
          </div>

          <div class="card-actions">
            <div class="ref-date">Fecha de referencia: ${h.refDate}</div>
            <button class="btn-card" data-book="${h.id}">Reservar</button>
          </div>
        </div>
      </article>`;
  };

  const frag = document.createDocumentFragment();
  const insertBeforeNode = nextBtn || null;
  hotels.forEach(h => {
    const wrap = document.createElement('div');
    wrap.innerHTML = makeCard(h);
    frag.appendChild(wrap.firstElementChild);
  });
  track.insertBefore(frag, insertBeforeNode);

  /* ===== Arrows / Navegación ===== */
  const getStep = () => {
    const card = track.querySelector('.hotel-card');
    if (!card) return 320;
    const gap = 16;
    return Math.round(card.getBoundingClientRect().width + gap);
  };

  const updateArrows = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const x = Math.round(track.scrollLeft);
    prevBtn?.classList.toggle('is-disabled', x <= 2);
    nextBtn?.classList.toggle('is-disabled', x >= maxScroll - 2);
  };

  prevBtn?.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });
  nextBtn?.addEventListener('click', () => {
    track.scrollBy({ left:  getStep(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);
  updateArrows();

  /* ===== Arrastre con inercia ===== */
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let cancelClick = false;
  let rafMomentum = 0;

  const now = () => performance.now();
  const getX = (ev) => ('touches' in ev) ? ev.touches[0].clientX : ev.clientX;

  const onDown = (ev) => {
    dragging = true;
    cancelClick = false;
    velocity = 0;
    startX = getX(ev);
    startLeft = track.scrollLeft;
    lastX = startX;
    lastT = now();
    track.classList.add('is-dragging');
    if (rafMomentum) { cancelAnimationFrame(rafMomentum); rafMomentum = 0; }
  };

  const onMove = (ev) => {
    if (!dragging) return;
    const x = getX(ev);
    const dx = x - startX;
    track.scrollLeft = startLeft - dx;

    // velocidad
    const t = now();
    const dt = Math.max(1, t - lastT);
    velocity = (x - lastX) / dt; // px/ms
    lastX = x;
    lastT = t;

    if (Math.abs(dx) > 4) cancelClick = true; // bloqueo de click fantasma
  };

  const momentum = () => {
    // desaceleración exponencial simple
    const friction = 0.95;  // 0..1
    const minV = 0.02;      // px/ms
    const step = () => {
      velocity *= friction;
      if (Math.abs(velocity) < minV) {
        rafMomentum = 0;
        updateArrows();
        return;
      }
      track.scrollLeft -= velocity * 16; // 16ms aprox por frame
      rafMomentum = requestAnimationFrame(step);
    };
    rafMomentum = requestAnimationFrame(step);
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (Math.abs(velocity) > 0.04) momentum();
    updateArrows();
    setTimeout(() => { cancelClick = false; }, 0);
  };

  // Mouse
  track.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  // Touch
  track.addEventListener('touchstart', onDown, { passive: true });
  track.addEventListener('touchmove', onMove, { passive: true });
  track.addEventListener('touchend', onUp);

  // Evita “click” accidental tras arrastrar
  track.addEventListener('click', (e) => {
    if (cancelClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  /* ===== Accesibilidad: teclado ===== */
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextBtn?.click();
    if (e.key === 'ArrowLeft')  prevBtn?.click();
  });

  /* ===== CTA Reservar (demo) ===== */
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    const id = btn.getAttribute('data-book');
    const hotel = hotels.find(h => h.id === id);
    alert(`Reservar: ${hotel?.name || id}`);
  });
})();
