// /js/hotel.js — Carrusel de HABITACIONES (compat con #roomsTrack y #hotelsTrack)
(() => {
  const track =
    document.getElementById("roomsTrack") ||
    document.getElementById("hotelsTrack");
  if (!track) return;

  // Usa la fuente única de datos
  const rooms = Array.isArray(window.ROOMS) ? window.ROOMS : [];

  const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
  const starsHTML = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const nextBtn = track.querySelector(".track-arrow.next");
  const prevBtn = track.querySelector(".track-arrow.prev");

  const makeCard = (r) => {
    const f = r.features || {};
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? "cama" : "camas"}`;
    const paxTxt = `${r.capacity} ${r.capacity === 1 ? "huésped" : "huéspedes"}`;
    return `
      <article class="hotel-card room-card" data-id="${r.id}">
        <div class="hotel-media">
          <img src="${r.image}" alt="${r.name}" loading="lazy">
          <span class="hotel-chip chip-score" title="Calificación">${Number(r.rating).toFixed(1)}</span>
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

  prevBtn?.addEventListener("click", () => track.scrollBy({ left: -getStep(), behavior: "smooth" }));
  nextBtn?.addEventListener("click", () => track.scrollBy({ left:  getStep(), behavior: "smooth" }));
  track.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  updateArrows();


  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (!btn) return;
    const id = btn.getAttribute("data-book");
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    if (typeof window.setBookingDraft === "function") {
      window.setBookingDraft(room);
    }
  });
})();
