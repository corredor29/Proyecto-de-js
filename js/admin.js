// /js/admin.js
(() => {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // ====== DOM ======
  const tabBtns       = $$('.tab');
  const roomsTbody    = $('#roomsTable tbody');
  const bookingsTbody = $('#bookingsTable tbody');

  const fCityRooms    = $('#fCityRooms');
  const qRooms        = $('#qRooms');

  const fCityBookings = $('#fCityBookings');
  const qBookings     = $('#qBookings');

  const btnNewRoom    = $('#btnNewRoom');

  // Modales
  const roomOverlay   = $('#roomOverlay');
  const roomForm      = $('#roomForm');
  const roomTitle     = $('#roomModalTitle');

  const bookingOverlay = $('#bookingOverlay');
  const bookingForm    = $('#bookingForm');
  const bookingTitle   = $('#bookingModalTitle');
  const bkRoomSelect   = $('#bkRoomId');

  // ====== Storage ======
  const LS_ROOMS    = 'erc_rooms';
  const LS_BOOKINGS = 'erc_reservas';

  const getRooms     = () => JSON.parse(localStorage.getItem(LS_ROOMS)    || '[]');
  const saveRooms    = (arr) => localStorage.setItem(LS_ROOMS, JSON.stringify(arr));
  const getBookings  = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');
  const saveBookings = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));

  // ====== Util ======
  const formatCOP = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n||0);
  const toISO     = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const parseLocal= (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays  = (a,b) => Math.round((b-a)/86400000);
  const overlap   = (A,B,C,D) => (A < D) && (C < B);

  // Fechas ocupadas demo (mismas que el sitio)
  const busy = (window.Resv?.busy) || [
    { roomId:"r1", start:"2025-10-07", end:"2025-10-09" },
    { roomId:"r1", start:"2025-12-24", end:"2025-12-27" },
    { roomId:"r2", start:"2025-10-10", end:"2025-10-14" },
    { roomId:"r3", start:"2025-10-08", end:"2025-10-09" },
    { roomId:"r4", start:"2025-10-20", end:"2025-10-23" }
  ];

  // Semilla de habitaciones si está vacío
  const demoRooms = [
    { id:"r1", city:"Cartagena",   name:"Suite Vista al Mar",    type:"Suite",        capacity:2, stars:5, image:"/image/habitacion1.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:true, balcony:true, ac:true, breakfast:true },
      sizeM2:48, view:"Mar", priceNow:612000, priceOld:1020000 },
    { id:"r2", city:"Medellín",    name:"Junior Suite Jardín",   type:"Junior Suite", capacity:3, stars:4, image:"/image/habitacion2.jpg",
      features:{ beds:2, wifi:true, minibar:true, hotTub:false, balcony:true, ac:true, breakfast:true },
      sizeM2:40, view:"Jardín", priceNow:429000, priceOld:858000 },
    { id:"r3", city:"Bogotá",      name:"Deluxe King",           type:"Deluxe",       capacity:2, stars:4, image:"/image/habitacion3.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:32, view:"Ciudad", priceNow:355000, priceOld:718000 },
    { id:"r4", city:"Santa Marta", name:"Doble Estándar",        type:"Estándar",     capacity:4, stars:3, image:"/image/habitacion4.jpg",
      features:{ beds:2, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:28, view:"Patio", priceNow:299000, priceOld:598000 }
  ];
  if (!getRooms().length) saveRooms(demoRooms);

  // ====== Tabs ======
  tabBtns.forEach(b => b.addEventListener('click', () => {
    tabBtns.forEach(x => x.classList.remove('is-active'));
    $$('.admin-tab').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    const id = b.getAttribute('data-tab');
    $('#tab-'+id)?.classList.add('is-active');
  }));

  // ====== Ciudades en filtros ======
  function refreshCityFilters(){
    const cities = [...new Set(getRooms().map(r=>r.city))].sort((a,b)=>a.localeCompare(b,'es'));
    const opts = ['<option value="all">Todas las ciudades</option>', ...cities.map(c=>`<option value="${c}">${c}</option>`)].join('');
    if (fCityRooms)    fCityRooms.innerHTML    = opts;
    if (fCityBookings) fCityBookings.innerHTML = opts;
  }

  // ====== Habitaciones ======
  function renderRooms(){
    const city = fCityRooms?.value || 'all';
    const q    = (qRooms?.value || '').toLowerCase().trim();

    let rows = getRooms();
    if (city !== 'all') rows = rows.filter(r => r.city === city);
    if (q) rows = rows.filter(r => (r.name+' '+r.type).toLowerCase().includes(q));

    roomsTbody.innerHTML = rows.map(r => `
      <tr data-id="${r.id}">
        <td>${r.id}</td>
        <td><span class="badge badge--city">${r.city}</span></td>
        <td>${r.name}</td>
        <td>${r.type}</td>
        <td>${r.capacity}</td>
        <td>${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</td>
        <td>${r.sizeM2}</td>
        <td>${r.view}</td>
        <td>${formatCOP(r.priceNow)}</td>
        <td class="row-actions">
          <button class="icon-btn" data-edit-room="${r.id}">✏️</button>
          <button class="icon-btn icon-btn--danger" data-del-room="${r.id}">🗑</button>
        </td>
      </tr>
    `).join('');
  }

  function openRoomModal(room){
    roomForm.reset();
    roomOverlay.hidden = false;
    roomTitle.textContent = room ? 'Editar habitación' : 'Nueva habitación';

    if (room){
      roomForm.elements.id.value       = room.id;
      roomForm.elements.city.value     = room.city;
      roomForm.elements.type.value     = room.type;
      roomForm.elements.name.value     = room.name;
      roomForm.elements.capacity.value = room.capacity;
      roomForm.elements.stars.value    = room.stars;
      roomForm.elements.sizeM2.value   = room.sizeM2;
      roomForm.elements.view.value     = room.view;
      roomForm.elements.priceNow.value = room.priceNow;
      roomForm.elements.priceOld.value = room.priceOld;
      roomForm.elements.image.value    = room.image || '';
      const f = room.features || {};
      roomForm.elements.beds.value     = f.beds || 1;
      ['wifi','minibar','hotTub','balcony','ac','breakfast'].forEach(k => roomForm.elements[k].checked = !!f[k]);
    } else {
      roomForm.elements.id.value = '';
      roomForm.elements.beds.value = 1;
    }
  }
  function closeRoomModal(){ roomOverlay.hidden = true; }
  roomOverlay?.addEventListener('click', e => { if (e.target === roomOverlay) closeRoomModal(); });
  roomOverlay?.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeRoomModal));
  btnNewRoom?.addEventListener('click', () => openRoomModal(null));

  roomForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(roomForm);
    const obj = Object.fromEntries(fd.entries());

    const features = {
      beds: Number(obj.beds || 1),
      wifi: !!fd.get('wifi'),
      minibar: !!fd.get('minibar'),
      hotTub: !!fd.get('hotTub'),
      balcony: !!fd.get('balcony'),
      ac: !!fd.get('ac'),
      breakfast: !!fd.get('breakfast')
    };

    const rec = {
      id: obj.id || ('r' + Date.now()),
      city: obj.city.trim(),
      type: obj.type.trim(),
      name: obj.name.trim(),
      capacity: Number(obj.capacity || 1),
      stars: Math.max(1, Math.min(5, Number(obj.stars || 3))),
      sizeM2: Number(obj.sizeM2 || 20),
      view: obj.view.trim(),
      priceNow: Number(obj.priceNow || 0),
      priceOld: Number(obj.priceOld || 0),
      image: obj.image || '',
      features
    };

    const arr = getRooms();
    const i = arr.findIndex(r => r.id === rec.id);
    if (i >= 0) arr[i] = rec; else arr.push(rec);
    saveRooms(arr);

    refreshCityFilters();
    renderRooms();
    closeRoomModal();
  });

  // Acciones en tabla de habitaciones
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-room]');
    if (editBtn){
      const id = editBtn.getAttribute('data-edit-room');
      const r = getRooms().find(x => x.id === id);
      return openRoomModal(r);
    }
    const delBtn = e.target.closest('[data-del-room]');
    if (delBtn){
      const id = delBtn.getAttribute('data-del-room');
      if (!confirm('¿Eliminar la habitación y TODAS sus reservas?')) return;
      saveRooms(getRooms().filter(r => r.id !== id));
      saveBookings(getBookings().filter(b => b.roomId !== id));
      refreshCityFilters();
      renderRooms();
      renderBookings();
    }
  });

  // ====== Reservas ======
  const roomNameById = id => (getRooms().find(r => r.id === id)?.name || '—');
  const cityByRoomId = id => (getRooms().find(r => r.id === id)?.city || '—');

  function renderBookings(){
    const city = fCityBookings?.value || 'all';
    const q    = (qBookings?.value || '').toLowerCase().trim();

    let rows = getBookings();
    if (city !== 'all') rows = rows.filter(b => cityByRoomId(b.roomId) === city);
    if (q) rows = rows.filter(b => ((b.userName||'')+' '+(b.userEmail||'')).toLowerCase().includes(q));

    bookingsTbody.innerHTML = rows.map((b, i) => {
      const start  = new Date(b.start);
      const end    = new Date(b.end);
      const nights = diffDays(start, end);
      return `
        <tr data-id="${b.id}">
          <td>${i+1}</td>
          <td>${roomNameById(b.roomId)}</td>
          <td><span class="badge badge--city">${cityByRoomId(b.roomId)}</span></td>
          <td>${b.userName || '—'}</td>
          <td>${b.userEmail || '—'}</td>
          <td>${toISO(start)}</td>
          <td>${toISO(end)}</td>
          <td>${nights}</td>
          <td>${formatCOP(b.total || nights * (b.pricePerNight||0))}</td>
          <td class="row-actions">
            <button class="icon-btn" data-edit-booking="${b.id}">✏️</button>
            <button class="icon-btn icon-btn--danger" data-del-booking="${b.id}">🗑</button>
          </td>
        </tr>
      `;
    }).join('');

    // opciones para el modal de reservas
    bkRoomSelect.innerHTML = getRooms().map(r => `<option value="${r.id}">${r.name} — ${r.city}</option>`).join('');
  }

  function openBookingModal(b){
    bookingForm.reset();
    bookingOverlay.hidden = false;
    bookingTitle.textContent = 'Editar reserva';
    if (b){
      bookingForm.elements.id.value    = b.id;
      bookingForm.elements.roomId.value= b.roomId;
      bookingForm.elements.start.value = toISO(new Date(b.start));
      bookingForm.elements.end.value   = toISO(new Date(b.end));
      bookingForm.elements.guests.value= b.guests || 1;
    }
  }
  function closeBookingModal(){ bookingOverlay.hidden = true; }
  bookingOverlay?.addEventListener('click', e => { if (e.target === bookingOverlay) closeBookingModal(); });
  bookingOverlay?.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeBookingModal));

  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(bookingForm);
    const id     = fd.get('id');
    const roomId = fd.get('roomId');
    const start  = parseLocal(fd.get('start'));
    const end    = parseLocal(fd.get('end'));
    const guests = Number(fd.get('guests') || 1);

    if (!start || !end || end <= start){ alert('Revisa las fechas.'); return; }

    const arr = getBookings();

    // Disponibilidad: ocupaciones fijas + otras reservas (excluyendo esta)
    const blocked = busy.some(b => b.roomId === roomId && overlap(start, end, parseLocal(b.start), parseLocal(b.end)));
    const taken   = arr.some(b => b.id !== id && b.roomId === roomId && overlap(start, end, new Date(b.start), new Date(b.end)));
    if (blocked || taken){ alert('La habitación no está disponible en esas fechas.'); return; }

    const i = arr.findIndex(x => x.id === id);
    if (i >= 0){
      const pricePerNight = arr[i].pricePerNight || 0;
      const nights = diffDays(start, end);
      arr[i] = {
        ...arr[i],
        roomId,
        start: start.toISOString(),
        end:   end.toISOString(),
        guests,
        total: nights * pricePerNight,
        updatedAt: new Date().toISOString()
      };
      saveBookings(arr);
      closeBookingModal();
      renderBookings();
    }
  });

  // Acciones reservas
  document.addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit-booking]');
    if (ed){
      const id = ed.getAttribute('data-edit-booking');
      const b  = getBookings().find(x => x.id === id);
      if (b) openBookingModal(b);
    }
    const del = e.target.closest('[data-del-booking]');
    if (del){
      const id = del.getAttribute('data-del-booking');
      if (!confirm('¿Eliminar esta reserva?')) return;
      saveBookings(getBookings().filter(b => b.id !== id));
      renderBookings();
    }
  });

  // Filtros
  [fCityRooms, qRooms].forEach(el => el?.addEventListener('input', renderRooms));
  [fCityBookings, qBookings].forEach(el => el?.addEventListener('input', renderBookings));

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    // Doble guardia (por si no lo dejaste en el HTML)
    window.ErcAuth?.ensureAdminPage?.();
    refreshCityFilters();
    renderRooms();
    renderBookings();
  });
})();
