// /js/reservas.js
(() => {
  /* ========== ELEMENTOS ========== */
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const checkin   = document.getElementById("checkin");
  const checkout  = document.getElementById("checkout");
  const guests    = document.getElementById("guests");

  const nightsChip = document.getElementById("rbNights");
  const grid       = document.getElementById("resultsGrid");
  const resMsg     = document.getElementById("resMsg");
  const resTitle   = document.getElementById("resTitle");
  const resSubtitle= document.getElementById("resSubtitle");

  // Drawer / Modal
  const overlay    = document.getElementById("resOverlay");
  const drawer     = overlay?.querySelector(".res-drawer");
  const bodyDrawer = document.getElementById("resvBody");
  const btnClose   = document.getElementById("resClose");
  const btnCancel  = document.getElementById("resCancel");
  const btnConfirm = document.getElementById("resConfirm");
  if (btnConfirm) btnConfirm.textContent = "Sí";

  /* ========== DATA DEMO ========== */
  const rooms = [
    { id:"r1", name:"Suite Vista al Mar", type:"Suite", capacity:2, stars:5, image:"/image/habitacion1.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:true, balcony:true, ac:true, breakfast:true },
      sizeM2:48, view:"Mar", priceNow:612000, priceOld:1020000 },
    { id:"r2", name:"Junior Suite Jardín", type:"Junior Suite", capacity:3, stars:4, image:"/image/habitacion2.jpg",
      features:{ beds:2, wifi:true, minibar:true, hotTub:false, balcony:true, ac:true, breakfast:true },
      sizeM2:40, view:"Jardín", priceNow:429000, priceOld:858000 },
    { id:"r3", name:"Deluxe King", type:"Deluxe", capacity:2, stars:4, image:"/image/habitacion3.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:32, view:"Ciudad", priceNow:355000, priceOld:718000 },
    { id:"r4", name:"Doble Estándar", type:"Estándar", capacity:4, stars:3, image:"/image/habitacion4.jpg",
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

  /* ========== STORAGE ========== */
  const LS_BOOKINGS = "erc_reservas";
  const getBookings = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || "[]");
  const saveBookings = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));

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

  // NUEVO: ¿el usuario ya tiene una reserva que se cruza con [start, end)?
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

  /* ========== UI RENDER ========== */
  const makeCard = (r, nights) => {
    const f = r.features || {};
    const total = r.priceNow * nights;             // <-- (corregido: sin variable basura)
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
          <p class="res-sub">${r.type} · ${paxTxt} · ${r.sizeM2} m² · Vista ${r.view}</p>
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
      resMsg.textContent = "No hay disponibilidad para esas fechas. Prueba con otras fechas o reduce el número de personas.";
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

    if(!inD || !outD){ resMsg.textContent = "Selecciona fechas de entrada y salida."; return; }
    const nights = diffDays(inD, outD);
    if(nights <= 0){ resMsg.textContent = "La fecha de salida debe ser posterior a la de entrada."; return; }

    resTitle.textContent = "Disponibilidad";
    resSubtitle.textContent = `Del ${toISO(inD)} al ${toISO(outD)} · ${nights} noche${nights>1?"s":""} · ${pax} persona${pax>1?"s":""}`;

    const avail = rooms.filter(r => r.capacity >= pax && isRoomFree(r.id, inD, outD));
    renderResults(avail, nights);
  }
  form.addEventListener("submit", searchAvailability);

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

  // A) Delegación global en captura
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  }, { capture:true });

  // B) Delegación en el grid
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  });

  // C) Binding directo post-render
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
    const room = rooms.find(r => r.id === id);
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
          <p>${room.type} · ${room.capacity} huésped(es) · ${room.sizeM2} m² · Vista ${room.view}</p>
          <ul class="resv-feat">
            <li>🛏 ${room.features.beds || 1} cama(s)</li>
            ${room.features.wifi?'<li>📶 Wi-Fi</li>':''}
            ${room.features.minibar?'<li>🥤 Minibar</li>':''}
            ${room.features.hotTub?'<li>🛁 Jacuzzi</li>':''}
            ${room.features.balcony?'<li>🌿 Balcón</li>':''}
            ${room.features.ac?'<li>❄️ A/A</li>':''}
            ${room.features.breakfast?'<li>🍽️ Desayuno</li>':''}
          </ul>
        </div>
      </div>

      <div class="resv-summary">
        <div><span>Entrada</span><strong>${checkin.value}</strong></div>
        <div><span>Salida</span><strong>${checkout.value}</strong></div>
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
    selected = null;
  }
  btnClose?.addEventListener("click", closeDrawer);
  btnCancel?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", (e)=> { if (e.target === overlay) closeDrawer(); });

  // Confirmar → SOLO si hay sesión y NO existe otra reserva solapada del mismo usuario
  btnConfirm?.addEventListener("click", () => {
    if (!selected) return;

    const ses = window.ErcAuth?.getSession?.();
    if (!ses) {
      showToast("Debes iniciar sesión para confirmar tu reserva.");
      window.ErcAuth?.openLogin?.();
      return; // no guarda
    }

    // ¿Ya tiene reserva que se cruza con estas fechas?
    if (userHasBookingOverlap(ses.email, selected.inD, selected.outD)) {
      resMsg.textContent = "Ya tienes una reserva en ese rango de fechas.";
      showToast("Ya tienes una reserva para esas fechas.");
      closeDrawer();
      return;
    }

    // Validar disponibilidad por si cambió
    if (!isRoomFree(selected.room.id, selected.inD, selected.outD)) {
      resMsg.textContent = "Lo sentimos, la habitación ya no está disponible en esas fechas.";
      closeDrawer();
      searchAvailability();
      return;
    }

    // Guardar reserva
    const booking = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      roomId: selected.room.id,
      roomName: selected.room.name,
      userEmail: ses?.email || null,
      userName:  ses?.name  || null,
      pricePerNight: selected.room.priceNow,
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
  });

  // Búsqueda inicial si ya hay fechas
  if(checkin.value && checkout.value) searchAvailability();
})();
/* ================= MIS RESERVAS (solo del usuario) ================= */
(() => {
  const sec   = document.getElementById('myBookingsSec');
  const list  = document.getElementById('myBookingsList');

  // Modal de edición
  const editOverlay = document.getElementById('editOverlay');
  const editDrawer  = editOverlay?.querySelector('.res-drawer');
  const eIn   = document.getElementById('editCheckin');
  const eOut  = document.getElementById('editCheckout');
  const eSave = document.getElementById('editSave');
  const eClose= document.getElementById('editClose');

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
      const n = diffDays(new Date(b.start), new Date(b.end));
      const rango = `${toISO(new Date(b.start))} → ${toISO(new Date(b.end))}`;
      return `
        <article class="res-card">
          <div class="res-body">
            <h3 class="res-title">${b.roomName}</h3>
            <p class="res-sub">${rango} · ${n} noche${n>1?'s':''} · ${b.guests} huésped(es)</p>

            <div class="res-price">
              <div>
                <div class="price-now">${formatCOP(b.pricePerNight)} / noche</div>
                <div class="price-old">&nbsp;</div>
              </div>
              <div class="card-actions">
                <button class="luxe-btn" data-edit="${b.id}">Editar fechas</button>
                <button class="luxe-btn danger" data-cancel="${b.id}">Cancelar</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // === Cancelar ===
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    const id = btn.getAttribute('data-cancel');
    if (!confirm('¿Cancelar esta reserva?')) return;
    const all = getBookings().filter(b => b.id !== id);
    saveBookings(all);
    if (typeof showToast === 'function') showToast('Reserva cancelada.');
    renderMyBookings();
    window.dispatchEvent(new Event('booking:changed'));
  });

  // === Abrir edición ===
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
  });

  function closeEdit(){
    editDrawer?.classList.remove('is-open');
    setTimeout(() => editOverlay.hidden = true, 160);
    editing = null;
  }
  eClose?.addEventListener('click', closeEdit);
  editOverlay?.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

  // Disponibilidad de habitación excluyendo esta reserva
  function isRoomFreeForEdit(roomId, start, end, excludeId){
    for (const b of busy.filter(x => x.roomId === roomId)){
      if (overlap(start, end, parseLocal(b.start), parseLocal(b.end))) return false;
    }
    for (const r of getBookings().filter(x => x.roomId === roomId && x.id !== excludeId)){
      if (overlap(start, end, new Date(r.start), new Date(r.end))) return false;
    }
    return true;
  }
  // ¿Se cruza con otra reserva del mismo usuario (cualquier habitación)?
  function userOverlapExcept(email, start, end, excludeId){
    return getBookings().some(b =>
      b.id !== excludeId &&
      b.userEmail === email &&
      overlap(start, end, new Date(b.start), new Date(b.end))
    );
  }

  // === Guardar edición ===
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

    closeEdit();
    if (typeof showToast === 'function') showToast('Reserva actualizada.');
    renderMyBookings();
    window.dispatchEvent(new Event('booking:changed'));
  });

  // Hooks para refrescar
  window.addEventListener('auth:login',  renderMyBookings);
  window.addEventListener('auth:logout', renderMyBookings);
  window.addEventListener('booking:changed', renderMyBookings);
  document.addEventListener('DOMContentLoaded', renderMyBookings);
})();
