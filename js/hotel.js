// /js/hotel.js  — Carrusel de HABITACIONES (compat con #roomsTrack y #hotelsTrack)
(() => {
  // Soporta ambos IDs para no romper tu HTML actual
  const track =
    document.getElementById("roomsTrack") ||
    document.getElementById("hotelsTrack");
  if (!track) return;

  // ===== DATA: Habitaciones del hotel El Rincón del Carmen =====
  const rooms = [
    {
      id: "r1",
      name: "Suite Vista al Mar",
      type: "Suite",
      capacity: 2,          // huéspedes
      rating: 9.2,
      stars: 5,
      image: "/image/habitacion1.jpg",
      features: { beds: 1, wifi: true, minibar: true, hotTub: true, balcony: true, ac: true, breakfast: true },
      sizeM2: 48,
      view: "Mar",
      priceNow: 612000, priceOld: 1020000, discount: 40,
      refDate: "25 octubre 2025"
    },
    {
      id: "r2",
      name: "Junior Suite Jardín",
      type: "Junior Suite",
      capacity: 3,
      rating: 8.6,
      stars: 4,
      image: "/image/habitacion2.jpg",
      features: { beds: 2, wifi: true, minibar: true, hotTub: false, balcony: true, ac: true, breakfast: true },
      sizeM2: 40,
      view: "Jardín",
      priceNow: 429000, priceOld: 858000, discount: 50,
      refDate: "8 octubre 2025"
    },
    {
      id: "r3",
      name: "Deluxe King",
      type: "Deluxe",
      capacity: 2,
      rating: 8.9,
      stars: 4,
      image: "/image/habitacion3.jpg",
      features: { beds: 1, wifi: true, minibar: true, hotTub: false, balcony: false, ac: true, breakfast: false },
      sizeM2: 32,
      view: "Ciudad",
      priceNow: 355000, priceOld: 718000, discount: 51,
      refDate: "20 diciembre 2025"
    },
    {
      id: "r4",
      name: "Doble Estándar",
      type: "Estándar",
      capacity: 4,
      rating: 8.1,
      stars: 3,
      image: "/image/habitacion4.jpg",
      features: { beds: 2, wifi: true, minibar: false, hotTub: false, balcony: false, ac: true, breakfast: false },
      sizeM2: 28,
      view: "Patio",
      priceNow: 299000, priceOld: 598000, discount: 50,
      refDate: "17 octubre 2025"
    }
  ];

  /* ===== Helpers ===== */
  const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const starsHTML = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const nextBtn = track.querySelector(".track-arrow.next");
  const prevBtn = track.querySelector(".track-arrow.prev");

  /* ===== Render ===== */
  const makeCard = (r) => {
    const f = r.features || {};
    // Texto pluralizado
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? "cama" : "camas"}`;
    const paxTxt = `${r.capacity} ${r.capacity === 1 ? "huésped" : "huéspedes"}`;
    return `
      <article class="hotel-card room-card" data-id="${r.id}">
        <div class="hotel-media">
          <img src="${r.image}" alt="${r.name}" loading="lazy">
          <span class="hotel-chip chip-score" title="Calificación">${r.rating.toFixed(1)}</span>
          <span class="hotel-chip chip-stars" title="Categoría">${starsHTML(r.stars)}</span>
          <span class="hotel-chip chip-view" title="Vista">${r.view}</span>
        </div>

        <div class="hotel-body">
          <h3 class="hotel-title">${r.name}</h3>
          <p class="hotel-sub">${r.type} · ${paxTxt} · ${r.sizeM2} m²</p>

          <div class="hotel-features">
            <span class="feature"><i class="fi fi-bed"></i>${bedsTxt}</span>
            ${f.wifi ? `<span class="feature"><i class="fi fi-wifi"></i>Wi-Fi</span>` : ""}
            ${f.minibar ? `<span class="feature"><i class="fi fi-mini"></i>Minibar</span>` : ""}
            ${f.hotTub ? `<span class="feature"><i class="fi fi-hot-tub"></i>Jacuzzi</span>` : ""}
            ${f.balcony ? `<span class="feature"><i class="fi fi-balcony"></i>Balcón</span>` : ""}
            ${f.ac ? `<span class="feature"><i class="fi fi-ac"></i>A/A</span>` : ""}
            ${f.breakfast ? `<span class="feature"><i class="fi fi-breakfast"></i>Desayuno</span>` : ""}
          </div>

          <div class="price-block">
            <div>
              <div class="price-now">${formatCOP(r.priceNow)}</div>
              <div class="price-old">${formatCOP(r.priceOld)}</div>
            </div>
            <div class="discount-badge">-${r.discount}%</div>
          </div>

          <div class="card-actions">
            <div class="ref-date">Fecha de referencia: ${r.refDate}</div>
            <button class="btn-card" data-book="${r.id}">Reservar</button>
          </div>
        </div>
      </article>`;
  };

  const frag = document.createDocumentFragment();
  const insertBeforeNode = nextBtn || null;
  rooms.forEach((r) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = makeCard(r);
    frag.appendChild(wrap.firstElementChild);
  });
  track.insertBefore(frag, insertBeforeNode);

  /* ===== Arrows / Navegación ===== */
  const getStep = () => {
    const card = track.querySelector(".hotel-card");
    if (!card) return 320;
    const gap = 16;
    return Math.round(card.getBoundingClientRect().width + gap);
    };

  const updateArrows = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const x = Math.round(track.scrollLeft);
    prevBtn?.classList.toggle("is-disabled", x <= 2);
    nextBtn?.classList.toggle("is-disabled", x >= maxScroll - 2);
  };

  prevBtn?.addEventListener("click", () => {
    track.scrollBy({ left: -getStep(), behavior: "smooth" });
  });
  nextBtn?.addEventListener("click", () => {
    track.scrollBy({ left: getStep(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
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
  const getX = (ev) => ("touches" in ev ? ev.touches[0].clientX : ev.clientX);

  const onDown = (ev) => {
    dragging = true;
    cancelClick = false;
    velocity = 0;
    startX = getX(ev);
    startLeft = track.scrollLeft;
    lastX = startX;
    lastT = now();
    track.classList.add("is-dragging");
    if (rafMomentum) {
      cancelAnimationFrame(rafMomentum);
      rafMomentum = 0;
    }
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

    if (Math.abs(dx) > 4) cancelClick = true;
  };

  const momentum = () => {
    const friction = 0.95; // 0..1
    const minV = 0.02;     // px/ms
    const step = () => {
      velocity *= friction;
      if (Math.abs(velocity) < minV) {
        rafMomentum = 0;
        updateArrows();
        return;
      }
      track.scrollLeft -= velocity * 16; // ~16ms/frame
      rafMomentum = requestAnimationFrame(step);
    };
    rafMomentum = requestAnimationFrame(step);
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    if (Math.abs(velocity) > 0.04) momentum();
    updateArrows();
    setTimeout(() => {
      cancelClick = false;
    }, 0);
  };

  // Mouse
  track.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  // Touch
  track.addEventListener("touchstart", onDown, { passive: true });
  track.addEventListener("touchmove", onMove, { passive: true });
  track.addEventListener("touchend", onUp);

  // Evita “click” accidental tras arrastrar
  track.addEventListener(
    "click",
    (e) => {
      if (cancelClick) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true
  );

  /* ===== Accesibilidad: teclado ===== */
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextBtn?.click();
    if (e.key === "ArrowLeft") prevBtn?.click();
  });

  /* ===== CTA Reservar (demo) ===== */
  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (!btn) return;
    const id = btn.getAttribute("data-book");
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    // Aquí puedes abrir tu drawer/modal real:
    alert(`Reservar: ${room.name} — ${formatCOP(room.priceNow)} / noche`);
  });
})();
