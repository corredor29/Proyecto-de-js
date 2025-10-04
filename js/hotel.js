
(function(){
  const track = document.getElementById('hotelsTrack');
  if (!track) return;

  // ====== Data (ejemplo). Cambia rutas/imágenes a las tuyas ======
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

  // ===== Helpers =====
  const formatCOP = n =>
    new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);

  const starsHTML = n => "★".repeat(n) + "☆".repeat(5 - n);

  // ===== Render =====
  const nextBtn = track.querySelector('.track-arrow.next');
  const prevBtn = track.querySelector('.track-arrow.prev');

  const makeCard = h => {
    const f = h.features || {};
    return `
    <article class="hotel-card" data-id="${h.id}">
      <div class="hotel-media">
        <img src="${h.image}" alt="${h.name}">
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
  hotels.forEach(h => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = makeCard(h);
    frag.appendChild(wrapper.firstElementChild);
  });
  track.insertBefore(frag, nextBtn);

  // ===== Carousel controls =====
  const scrollStep = () => {
    // desplaza aproximadamente un "viewport" del carrusel
    const card = track.querySelector('.hotel-card');
    return card ? card.getBoundingClientRect().width + 16 : 300;
  };

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    prevBtn.classList.toggle('is-disabled', x <= 2);
    nextBtn.classList.toggle('is-disabled', x >= maxScroll - 2);
  };

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left:  scrollStep(), behavior: 'smooth' });
  });
  track.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // Botón “Reservar” (demo)
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    const id = btn.dataset.book;
    const hotel = hotels.find(h => h.id === id);
    alert(`Reservar: ${hotel?.name || id}`);
    // aquí iría tu flujo real de reserva / navegación
  });

  // Accesibilidad: teclado
  track.setAttribute('tabindex','0');
  track.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'ArrowLeft')  prevBtn.click();
  });
})();

// /js/hero-carousel.js
(function () {
  const root = document;
  const track = root.querySelector('#heroTrack');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.hero-slide'));
  const btnPrev = root.querySelector('.hero-arrow.prev');
  const btnNext = root.querySelector('.hero-arrow.next');
  const dotsWrap = root.querySelector('#heroDots');

  let idx = 0;
  let timer = null;
  const AUTOPLAY_MS = 6000;

  // Dots
  const dots = slides.map((_, i) => {
    const b = root.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Ir al slide ${i + 1}`);
    dotsWrap.appendChild(b);
    b.addEventListener('click', () => go(i, true));
    return b;
  });

  function setActive(i) {
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.setAttribute('aria-selected', k === i ? 'true' : 'false'));
  }

  function go(n, user = false) {
    idx = (n + slides.length) % slides.length;
    setActive(idx);
    if (user) restart();
  }

  function next() { go(idx + 1); }
  function prev() { go(idx - 1); }

  function start() {
    stop();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restart() {
    stop();
    start();
  }

  // Eventos
  btnNext && btnNext.addEventListener('click', () => next());
  btnPrev && btnPrev.addEventListener('click', () => prev());

  const hero = root.querySelector('.hero-slider');
  if (hero) {
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
  }

  // Gestos táctiles
  let x0 = null;
  track.addEventListener('touchstart', e => (x0 = e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    x0 = null;
  }, { passive: true });

  // Init
  setActive(0);
  start();
})();

