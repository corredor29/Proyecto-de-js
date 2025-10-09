// /js/reservas.js
(() => {
  /* ========== ELEMENTOS ========== */
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const checkin    = document.getElementById("checkin");
  const checkout   = document.getElementById("checkout");
  const guests     = document.getElementById("guests");
  const citySel    = document.getElementById("city");

  const nightsChip = document.getElementById("rbNights");
  const grid       = document.getElementById("resultsGrid");
  const resMsg     = document.getElementById("resMsg");
  const resTitle   = document.getElementById("resTitle");
  const resSubtitle= document.getElementById("resSubtitle");

  // Drawer / Modal (confirmación)
  const overlay    = document.getElementById("resOverlay");
  const drawer     = overlay?.querySelector(".res-drawer");
  const bodyDrawer = document.getElementById("resvBody");
  const btnClose   = document.getElementById("resClose");
  const btnCancel  = document.getElementById("resCancel");
  const btnConfirm = document.getElementById("resConfirm");
  if (btnConfirm) btnConfirm.textContent = "Sí";

  /* === Login por encima del drawer === */
  function showLoginOverDrawer(){
    overlay?.classList.add('auth-on-top');
    window.ErcAuth?.openLogin?.();
    const cleanup = () => overlay?.classList.remove('auth-on-top');
    window.addEventListener('auth:login',  cleanup, { once:true });
    window.addEventListener('auth:logout', cleanup, { once:true });
    const auth = document.getElementById('luxeAuth');
    if (auth) {
      const closes = auth.querySelectorAll('[data-close], .luxe-auth__overlay');
      closes.forEach(el => el.addEventListener('click', cleanup, { once:true }));
    }
  }

  /* ========== DATA DEMO ========== */
  // Habitaciones de demo
  const demoRooms = [
    { id:"r1", city:"Cartagena",   name:"Suite Vista al Mar", type:"Suite", capacity:2, stars:5, image:"/image/habitacion1.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:true, balcony:true, ac:true, breakfast:true },
      sizeM2:48, view:"Mar", priceNow:612000, priceOld:1020000 },
    { id:"r2", city:"Medellín",    name:"Junior Suite Jardín", type:"Junior Suite", capacity:3, stars:4, image:"/image/habitacion2.jpg",
      features:{ beds:2, wifi:true, minibar:true, hotTub:false, balcony:true, ac:true, breakfast:true },
      sizeM2:40, view:"Jardín", priceNow:429000, priceOld:858000 },
    { id:"r3", city:"Bogotá",      name:"Deluxe King", type:"Deluxe", capacity:2, stars:4, image:"/image/habitacion3.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:32, view:"Ciudad", priceNow:355000, priceOld:718000 },
    { id:"r4", city:"Santa Marta", name:"Doble Estándar", type:"Estándar", capacity:4, stars:3, image:"/image/habitacion4.jpg",
      features:{ beds:2, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:28, view:"Patio", priceNow:299000, priceOld:598000 }
  ];

  // Ocupaciones fijas (rangos [start, end), end no incluido)
  const busy = [
    { roomId:"r1", start:"2025-10-07", end:"2025-10-09" },
    { roomId:"r1", start:"2025-12-24", end:"2025-12-27" },
    { roomId:"r2", start:"2025-10-10", end:"2025-10-14" },
    { roomId:"r3", start:"2025-10-08", end:"2025-10-09" },
    { roomId:"r4", start:"2025-10-20", end:"2025-10-23" }
  ];

  // ======= Habitaciones guardadas desde ADMIN + merge seguro =======
  const LS_ROOMS = 'erc_rooms';
  const getLSRooms = () => {
    try { 
      const v = JSON.parse(localStorage.getItem(LS_ROOMS) || "[]");
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };

  // Lista total (demo + LS) filtrando registros inválidos
  function allRooms(){
    return [...demoRooms, ...getLSRooms()]
      .filter(r => r && typeof r === 'object'); // quita null/strings, etc
  }

  // Exponer por compatibilidad (algunas vistas lo usan como fallback)
  window.__ERC_ROOMS = allRooms();

  /* ========== PRESELECCIÓN QUE VIENE DESDE HOTEL.JS ========== */
  function upsertPreselectRoom(pre) {
    if (!pre || typeof pre !== 'object') return null;
    const normalized = {
      id: pre.id || `pre_${Date.now()}`,
      city: pre.city || '-',   // si no venía ciudad, muestra '-'
      name: pre.name || 'Habitación',
      type: pre.type || '',
      capacity: Number(pre.capacity || 1),
      stars: Number(pre.stars || 0),
      image: pre.image || '/image/habitacion1.jpg',
      features: pre.features || {},
      sizeM2: Number(pre.sizeM2 || 0),
      view: pre.view || '',
      priceNow: Number(pre.priceNow || 0),
      priceOld: Number(pre.priceOld || pre.priceNow || 0)
    };
    const found = allRooms().find(r => r.id === normalized.id);
    return found || normalized;
  }

  function handlePreselectIfAny() {
    const raw = localStorage.getItem('rb_preselect');
    if (!raw) return;

    let pre = null;
    try { pre = JSON.parse(raw); } catch { pre = null; }
    localStorage.removeItem('rb_preselect'); // evitar repetir
    if (!pre) return;

    const r = upsertPreselectRoom(pre);
    if (!r) return;

    // Si no hay fechas elegidas, pone hoy y mañana por defecto
    const today = new Date(); today.setHours(12,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    if (!checkin.value)  checkin.value  = toISO(today);
    if (!checkout.value) checkout.value = toISO(tomorrow);

    // Recalcula chip de noches y min de checkout
    (function syncMins(){
      const inD = parseLocal(checkin.value);
      if (inD) {
        const minOut = new Date(inD); minOut.setDate(minOut.getDate() + 1);
        checkout.min = toISO(minOut);
      }
      renderNightsChip();
    })();

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    if (!inD || !outD || outD <= inD) return;

    const nights = diffDays(inD, outD);
    resTitle.textContent = 'Disponibilidad';
    resSubtitle.textContent = `Del ${toISO(inD)} al ${toISO(outD)} · ${nights} noche${nights>1?"s":""} · ${guests.value || 1} persona${(parseInt(guests.value||"1",10)>1)?"s":""}`;

    // Renderiza SOLO la habitación preseleccionada
    renderResults([r], nights);

    // Si venimos con hash #preselect, hace scroll suave al grid
    if (location.hash.includes('preselect')) {
      setTimeout(() => grid?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }

  /* ========== STORAGE RESERVAS ========== */
  const LS_BOOKINGS = "erc_reservas";
  const getBookings   = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || "[]");
  const saveBookings  = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));

  /* ========== HELPERS ========== */
  const toISO = (d) => {
    const dt = new Date(d);
    dt.setHours(12,0,0,0);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,"0");
    const day = String(dt.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const parseLocal  = (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays    = (a,b) => Math.round((b-a) / 86400000);
  const formatCOP   = (n) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
  const starsHTML   = (n) => "★".repeat(n) + "☆".repeat(5-n);
  const overlap     = (A,B,C,D) => (A < D) && (C < B);

  function isRoomFree(roomId, start, end){
    for (const b of busy.filter(x=>x.roomId===roomId)){
      if (overlap(start, end, parseLocal(b.start), parseLocal(b.end))) return false;
    }
    for (const r of getBookings().filter(x=>x.roomId===roomId)){
      const rs = new Date(r.start), re = new Date(r.end);
      if (overlap(start, end, rs, re)) return false;
    }
    return true;
  }

  function userHasBookingOverlap(email, start, end){
    if (!email) return false;
    return getBookings().some(b =>
      b.userEmail === email &&
      overlap(start, end, new Date(b.start), new Date(b.end))
    );
  }

  function renderNightsChip(){
    const a = parseLocal(checkin.value);
    const b = parseLocal(checkout.value);
    const n = (a && b) ? diffDays(a,b) : 0;
    if(n > 0){
      nightsChip.hidden = false;
      nightsChip.textContent = `${n} noche${n>1?"s":""}`;
    } else {
      nightsChip.hidden = true;
      nightsChip.textContent = "—";
    }
  }

  // Fechas mínimas
  const today = new Date(); today.setHours(12,0,0,0);
  const isoToday = toISO(today);
  checkin.min  = isoToday;
  checkout.min = isoToday;

  checkin.addEventListener("change", () => {
    const inD = parseLocal(checkin.value);
    if(inD){
      const minOut = new Date(inD); minOut.setDate(minOut.getDate()+1);
      checkout.min = toISO(minOut);
      const outD = parseLocal(checkout.value);
      if(!outD || outD <= inD){ checkout.value = checkout.min; }
    }
    renderNightsChip();
  });
  checkout.addEventListener("change", renderNightsChip);
  renderNightsChip();

  /* ========== POBLAR SELECT DE CIUDADES (seguro) ========== */
  function populateCities(){
    if (!citySel) return;

    const cityList = allRooms()
      .map(r => String(r.city ?? '').trim())
      .filter(Boolean); // quita '', undefined, null

    const cities = [...new Set(cityList)]
      .sort((a,b)=>a.localeCompare(b,'es'));

    citySel.innerHTML =
      `<option value="all" selected>Todas las ciudades</option>` +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  populateCities();

  // Procesa preselección si venimos desde el carrusel
  handlePreselectIfAny();

  /* ========== UI RENDER ========== */
  const makeCard = (r, nights) => {
    const f = r.features || {};
    const total = r.priceNow * nights;
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? "cama" : "camas"}`;
    const paxTxt  = `${r.capacity} ${r.capacity === 1 ? "huésped" : "huéspedes"}`;

    return `
      <article class="res-card" data-id="${r.id}">
        <div class="res-media">
          <img src="${r.image}" alt="${r.name}" loading="lazy" />
          <span class="res-badge">${starsHTML(r.stars)}</span>
        </div>
        <div class="res-body">
          <h3 class="res-title">${r.name}</h3>
          <p class="res-sub">📍 ${r.city || '-'} · ${r.type} · ${paxTxt} · ${r.sizeM2} m² · Vista ${r.view}</p>
          <div class="res-features">
            <span>🛏️ ${bedsTxt}</span>
            ${f.wifi ? `<span>📶 Wi-Fi</span>` : ""}
            ${f.minibar ? `<span>🥤 Minibar</span>` : ""}
            ${f.hotTub ? `<span>🛁 Jacuzzi</span>` : ""}
            ${f.balcony ? `<span>🌿 Balcón</span>` : ""}
            ${f.ac ? `<span>❄️ A/A</span>` : ""}
            ${f.breakfast ? `<span>🍽️ Desayuno</span>` : ""}
          </div>
          <div class="res-price">
            <div>
              <div class="price-now">${formatCOP(r.priceNow)} / noche</div>
              <div class="price-old">${formatCOP(r.priceOld)}</div>
            </div>
            <button class="res-cta" type="button" data-book="${r.id}" data-nights="${nights}">
              Reservar · ${formatCOP(total)}
            </button>
          </div>
        </div>
      </article>`;
  };

  function renderResults(list, nights){
    grid.innerHTML = "";
    resMsg.textContent = "";

    if(!list.length){
      resMsg.textContent = "No hay disponibilidad para esas fechas. Prueba con otras fechas o cambia de ciudad.";
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(r => {
      const wrap = document.createElement("div");
      wrap.innerHTML = makeCard(r, nights);
      frag.appendChild(wrap.firstElementChild);
    });
    grid.appendChild(frag);

    bindReserveButtonsDirect();
  }

  /* ========== BÚSQUEDA ========== */
  function searchAvailability(e){
    e?.preventDefault();

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    const pax  = parseInt(guests.value || "1", 10);
    const cty  = citySel?.value || "all";

    if(!inD || !outD){ resMsg.textContent = "Selecciona fechas de entrada y salida."; return; }
    const nights = diffDays(inD, outD);
    if(nights <= 0){ resMsg.textContent = "La fecha de salida debe ser posterior a la de entrada."; return; }

    const cityTxt = (cty === "all" ? "todas las ciudades" : cty);
    resTitle.textContent = "Disponibilidad";
    resSubtitle.textContent = `Del ${toISO(inD)} al ${toISO(outD)} · ${nights} noche${nights>1?"s":""} · ${pax} persona${pax>1?"s":""} · en ${cityTxt}`;

    const avail = allRooms().filter(r =>
      r.capacity >= pax &&
      (cty === "all" || r.city === cty) &&
      isRoomFree(r.id, inD, outD)
    );
    renderResults(avail, nights);
  }
  form.addEventListener("submit", searchAvailability);
  citySel?.addEventListener('change', () => {      // buscar al cambiar ciudad si ya hay fechas
    if (checkin.value && checkout.value) searchAvailability();
  });

  /* ========== TOAST ========== */
  function showToast(msg){
    let t = document.getElementById("appToast");
    if(!t){
      t = document.createElement("div");
      t.id = "appToast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._hide);
    t._hide = setTimeout(()=> t.classList.remove("show"), 2200);
  }

  /* ========== RESERVAR (Drawer) ========== */
  let selected = null;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  }, { capture:true });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  });

  function bindReserveButtonsDirect(){
    grid.querySelectorAll("[data-book]").forEach(b => {
      if (b.__bound) return;
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openDrawerFor(b);
      });
      b.__bound = true;
      b.style.pointerEvents = "auto";
      b.tabIndex = 0;
      b.setAttribute("role","button");
    });
  }

  function openDrawerFor(btn){
    const id = btn.getAttribute("data-book");
    const nights = parseInt(btn.getAttribute("data-nights"), 10) || 1;
    const room = allRooms().find(r => r.id === id);
    if(!room || !overlay || !drawer || !bodyDrawer) return;

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    if (!inD || !outD) { showToast("Selecciona fechas antes de reservar."); return; }

    selected = {
      room,
      nights,
      inD,
      outD,
      pax:  parseInt(guests.value || "1", 10),
      total: room.priceNow * nights
    };

    bodyDrawer.innerHTML = `
      <div class="resv-room">
        <img class="resv-img" src="${room.image}" alt="${room.name}" />
        <div class="resv-info">
          <h4>${room.name}</h4>
          <p>📍 ${room.city} · ${room.type} · ${room.capacity} huésped(es) · ${room.sizeM2} m² · Vista ${room.view}</p>
          <ul class="resv-feat">
            <li>🛏 ${room.features?.beds || 1} cama(s)</li>
            ${room.features?.wifi?'<li>📶 Wi-Fi</li>':''}
            ${room.features?.minibar?'<li>🥤 Minibar</li>':''}
            ${room.features?.hotTub?'<li>🛁 Jacuzzi</li>':''}
            ${room.features?.balcony?'<li>🌿 Balcón</li>':''}
            ${room.features?.ac?'<li>❄️ A/A</li>':''}
            ${room.features?.breakfast?'<li>🍽️ Desayuno</li>':''}
          </ul>
        </div>
      </div>

      <div class="resv-summary">
        <div><span>Entrada</span><strong>${checkin.value}</strong></div>
        <div><span>Salida</span><strong>${checkout.value}</strong></div>
        <div><span>Ciudad</span><strong>${room.city}</strong></div>
        <div><span>Huéspedes</span><strong>${selected.pax}</strong></div>
        <div><span>Noches</span><strong>${selected.nights}</strong></div>
        <div class="total">
          <span>Total a pagar</span>
          <span class="resv-total">${formatCOP(selected.total)} COP</span>
        </div>
      </div>
    `;

    overlay.hidden = false;
    requestAnimationFrame(()=> drawer.classList.add("is-open"));
  }

  function closeDrawer(){
    drawer?.classList.remove("is-open");
    setTimeout(()=> overlay.hidden = true, 160);
    overlay?.classList.remove('auth-on-top');
    selected = null;
  }
  btnClose?.addEventListener("click", closeDrawer);
  btnCancel?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", (e)=> { if (e.target === overlay) closeDrawer(); });

  btnConfirm?.addEventListener("click", () => {
    if (!selected) return;

    const ses = window.ErcAuth?.getSession?.();
    if (!ses) {
      showToast("Debes iniciar sesión para confirmar tu reserva.");
      showLoginOverDrawer();
      return;
    }

    if (userHasBookingOverlap(ses.email, selected.inD, selected.outD)) {
      resMsg.textContent = "Ya tienes una reserva en ese rango de fechas.";
      showToast("Ya tienes una reserva para esas fechas.");
      closeDrawer();
      return;
    }

    if (!isRoomFree(selected.room.id, selected.inD, selected.outD)) {
      resMsg.textContent = "Lo sentimos, la habitación ya no está disponible en esas fechas.";
      closeDrawer();
      searchAvailability();
      return;
    }

    // Snapshot incluye ciudad
    const r = selected.room;
    const snap = (({id, city, name, type, sizeM2, view, stars, image, features}) =>
      ({id, city, name, type, sizeM2, view, stars, image, features}))(r);

    const booking = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      roomId: r.id,
      roomName: r.name,
      snapshot: snap,
      userEmail: ses?.email || null,
      userName:  ses?.name  || null,
      pricePerNight: r.priceNow,
      total: selected.total,
      guests: selected.pax,
      start: selected.inD.toISOString(),
      end:   selected.outD.toISOString(),
      createdAt: new Date().toISOString(),
      status: "confirmada"
    };

    const all = getBookings();
    all.push(booking);
    saveBookings(all);

    showToast("¡Reserva confirmada!");
    resMsg.textContent = "¡Reserva confirmada! La verás en “Mis reservas”.";
    closeDrawer();
    searchAvailability();
    window.dispatchEvent(new Event('booking:changed'));
  });

  window.addEventListener('booking:changed', () => {
    if (checkin.value && checkout.value) searchAvailability();
  });

  if(checkin.value && checkout.value) searchAvailability();

  window.Resv = {
    getBookings, saveBookings, toISO, parseLocal, diffDays, overlap,
    isRoomFree, busy, showToast, rooms: allRooms()
  };
})();

/* ================= MIS RESERVAS (solo del usuario) ================= */
(() => {
  const LS_BOOKINGS = 'erc_reservas';
  const getBookings = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');
  const saveBookings = arr => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));
  const toISO = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const parseLocal = (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays = (a,b) => Math.round((b-a)/86400000);
  const overlap  = (A,B,C,D) => (A < D) && (C < B);
  const formatCOP = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
  const starsHTML = n => '★'.repeat(n||0) + '☆'.repeat(Math.max(0,5-(n||0)));

  // Acceso a todas las habitaciones (demo + admin/LS) para snapshots faltantes
  const LS_ROOMS = 'erc_rooms';
  const getLSRooms = () => {
    try { 
      const v = JSON.parse(localStorage.getItem(LS_ROOMS) || "[]");
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };
  const allRooms = () => {
    const demo = (window.__ERC_ROOMS || []).filter(Boolean);
    const ls   = getLSRooms();
    return [...demo, ...ls].filter(r => r && typeof r === 'object');
  };

  const sec   = document.getElementById('myBookingsSec');
  const list  = document.getElementById('myBookingsList');

  const editOverlay = document.getElementById('editOverlay');
  const editDrawer  = editOverlay?.querySelector('.res-drawer');
  const eIn   = document.getElementById('editCheckin');
  const eOut  = document.getElementById('editCheckout');
  const eSave = document.getElementById('editSave');
  const eClose= document.getElementById('editClose');
  const nEl  = document.getElementById('editNights');
  const tEl  = document.getElementById('editTotal');

  let editing = null;

  function renderMyBookings(){
    if (!sec || !list) return;
    const ses = window.ErcAuth?.getSession?.();
    if (!ses){
      sec.hidden = true;
      list.innerHTML = '';
      return;
    }

    const mine = getBookings()
      .filter(b => b.userEmail === ses.email)
      .sort((a,b) => new Date(a.start) - new Date(b.start));

    sec.hidden = false;

    if (!mine.length){
      list.innerHTML = `<p class="res-note">Aún no tienes reservas.</p>`;
      return;
    }

    list.innerHTML = mine.map(b => {
      const snap = b.snapshot || allRooms().find(r => r.id === b.roomId) || {};
      const f       = snap.features || {};
      const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? 'cama' : 'camas'}`;
      const nights  = diffDays(new Date(b.start), new Date(b.end));

      return `
        <article class="res-card" data-id="${b.id}">
          <div class="res-media">
            <img src="${snap.image || '/image/habitacion1.jpg'}" alt="${b.roomName}" loading="lazy" />
            <span class="res-badge">${starsHTML(snap.stars || 0)}</span>
          </div>

          <div class="res-body">
            <h3 class="res-title">${b.roomName}</h3>
            <p class="res-sub">📍 ${snap.city || '-'} · ${snap.type || ''} · ${b.guests} huésped(es) · ${snap.sizeM2 || '-'} m² · Vista ${snap.view || '-'}</p>

            <div class="res-features">
              <span>📅 ${toISO(new Date(b.start))} → ${toISO(new Date(b.end))} (${nights} noche${nights>1?'s':''})</span>
              <span>🛏️ ${bedsTxt}</span>
              ${f.wifi ? `<span>📶 Wi-Fi</span>` : ``}
              ${f.minibar ? `<span>🥤 Minibar</span>` : ``}
              ${f.hotTub ? `<span>🛁 Jacuzzi</span>` : ``}
              ${f.balcony ? `<span>🌿 Balcón</span>` : ``}
              ${f.ac ? `<span>❄️ A/A</span>` : ``}
              ${f.breakfast ? `<span>🍽️ Desayuno</span>` : ``}
            </div>

            <div class="res-price">
              <div>
                <div class="price-now">${formatCOP(b.pricePerNight)} / noche</div>
                <div class="price-old">&nbsp;</div>
              </div>

              <div class="card-actions">
                <button class="btn-card" data-edit="${b.id}">Editar fechas</button>
                <button class="btn-card btn-card--danger" data-cancel="${b.id}">Cancelar</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Cancelar sin alert
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    const id = btn.getAttribute('data-cancel');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const all = getBookings().filter(b => b.id !== id);
    saveBookings(all);
    if (window.Resv?.showToast) window.Resv.showToast('Reserva cancelada.');
    renderMyBookings();
    window.dispatchEvent(new Event('booking:changed'));
  });

  // Abrir edición
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit]');
    if (!btn) return;
    const id = btn.getAttribute('data-edit');
    const b = getBookings().find(x => x.id === id);
    if (!b) return;

    editing = b;
    eIn.value  = toISO(new Date(b.start));
    eOut.value = toISO(new Date(b.end));
    const hoy = toISO(new Date());
    eIn.min = hoy; eOut.min = hoy;

    editOverlay.hidden = false;
    requestAnimationFrame(() => editDrawer.classList.add('is-open'));
    updateEditPreview();
  });

  function closeEdit(){
    editDrawer?.classList.remove('is-open');
    setTimeout(() => editOverlay.hidden = true, 160);
    editing = null;
    eSave?.classList.remove('is-loading','is-done');
  }
  eClose?.addEventListener('click', closeEdit);
  editOverlay?.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

  function updateEditPreview(){
    if (!nEl || !tEl || !editing) return;
    const s = parseLocal(eIn.value);
    const t = parseLocal(eOut.value);
    if (!s || !t || t <= s){ nEl.textContent='—'; tEl.textContent='—'; return; }
    const nights = diffDays(s, t);
    nEl.textContent = String(nights);
    const total = (editing.pricePerNight || 0) * nights;
    tEl.textContent = new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(total);
  }
  eIn?.addEventListener('input', updateEditPreview);
  eOut?.addEventListener('input', updateEditPreview);

  function isRoomFreeForEdit(roomId, start, end, excludeId){
    for (const b of (window.Resv?.busy || [])){
      if (b.roomId === roomId && overlap(start, end, new Date(b.start), new Date(b.end))) return false;
    }
    for (const r of getBookings().filter(x => x.roomId === roomId && x.id !== excludeId)){
      if (overlap(start, end, new Date(r.start), new Date(r.end))) return false;
    }
    return true;
  }
  function userOverlapExcept(email, start, end, excludeId){
    return getBookings().some(b =>
      b.id !== excludeId && b.userEmail === email &&
      overlap(start, end, new Date(b.start), new Date(b.end))
    );
  }

  eSave?.addEventListener('click', () => {
    if (!editing) return;

    const s = parseLocal(eIn.value);
    const t = parseLocal(eOut.value);
    if (!s || !t || t <= s){ alert('Revisa las fechas.'); return; }

    if (!isRoomFreeForEdit(editing.roomId, s, t, editing.id)){
      alert('La habitación no está disponible en esas fechas.');
      return;
    }
    if (userOverlapExcept(editing.userEmail, s, t, editing.id)){
      alert('Ya tienes otra reserva que se cruza con esas fechas.');
      return;
    }

    eSave.classList.add('is-loading');

    const all = getBookings();
    const i   = all.findIndex(x => x.id === editing.id);
    const nights = diffDays(s, t);

    all[i] = {
      ...editing,
      start: s.toISOString(),
      end:   t.toISOString(),
      total: nights * (editing.pricePerNight || 0),
      updatedAt: new Date().toISOString()
    };
    saveBookings(all);

    eSave.classList.remove('is-loading');
    eSave.classList.add('is-done');

    setTimeout(() => {
      if (window.Resv?.showToast) window.Resv.showToast('Reserva actualizada.');
      closeEdit();
      renderMyBookings();
      window.dispatchEvent(new Event('booking:changed'));
    }, 650);
  });

  window.addEventListener('auth:login',  renderMyBookings);
  window.addEventListener('auth:logout', renderMyBookings);
  window.addEventListener('booking:changed', renderMyBookings);
  document.addEventListener('DOMContentLoaded', renderMyBookings);
})();
