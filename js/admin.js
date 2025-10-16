(() => {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ================== Tabs / Secciones ================== */
  const tabButtons = $$('.tabs .tab');
  const sections   = {
    rooms:    $('#tab-rooms'),
    bookings: $('#tab-bookings'),
    quejas:   $('#tab-quejas'),
  };

  const roomsTbody    = $('#roomsTable tbody');
  const bookingsTbody = $('#bookingsTable tbody');

  const fCityRooms    = $('#fCityRooms');
  const qRooms        = $('#qRooms');

  const fCityBookings = $('#fCityBookings');
  const qBookings     = $('#qBookings');

  const btnNewRoom    = $('#btnNewRoom');

  /* ================== Storage ================== */
  const LS_ROOMS    = 'erc_rooms';
  const LS_BOOKINGS = 'erc_reservas';

  const getRoomsRaw  = () => JSON.parse(localStorage.getItem(LS_ROOMS)    || '[]');
  const saveRoomsRaw = (arr) => localStorage.setItem(LS_ROOMS, JSON.stringify(arr));
  const getBookings  = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');
  const saveBookings = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));

  /* ================== Utils ================== */
  const formatCOP = (n) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
  const toISO     = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const fmtDate   = (iso) => { try { return toISO(new Date(iso)); } catch { return iso || '—'; } };
  const uid       = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));
  const parseLocal= (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays  = (a,b) => Math.round((b-a)/86400000);
  const overlap   = (A,B,C,D) => (A < D) && (C < B);

  // Normalizador de habitaciones (es/en)
  const normalizeRoom = (r={}) => ({
    id:        r.id || r.roomId || '',
    city:      r.city ?? r.ciudad ?? r.City ?? '',
    name:      r.name ?? r.nombre ?? r.roomName ?? '',
    type:      r.type ?? r.tipo ?? '',
    capacity:  Number(r.capacity ?? r.capacidad ?? 0),
    stars:     Number(r.stars ?? r.estrellas ?? 0),
    sizeM2:    Number(r.sizeM2 ?? r.m2 ?? r.metros ?? 0),
    view:      r.view ?? r.vista ?? '',
    priceNow:  Number(r.priceNow ?? r.precio ?? r.price ?? 0),
    priceOld:  Number(r.priceOld ?? r.precioAntes ?? r.priceBefore ?? r.priceNow ?? r.precio ?? 0),
    image:     r.image ?? r.img ?? r.foto ?? '',
    features:  r.features ?? r.caracteristicas ?? {},
  });

  const denormalizeToCanonical = (nr) => ({
    id: nr.id,
    city: nr.city,
    name: nr.name,
    type: nr.type,
    capacity: nr.capacity,
    stars: nr.stars,
    sizeM2: nr.sizeM2,
    view: nr.view,
    priceNow: nr.priceNow,
    priceOld: nr.priceOld ?? nr.priceNow,
    image: nr.image,
    features: nr.features || { beds:1, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false }
  });

  const getRooms  = () => getRoomsRaw().map(normalizeRoom);
  const saveRooms = (normRooms) => saveRoomsRaw(normRooms.map(denormalizeToCanonical));

  /* ================== Tabs ================== */
  function activateTab(name){
    tabButtons.forEach(b=>{
      const on = b.dataset.tab === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true':'false');
    });
    Object.entries(sections).forEach(([key,sec])=>{
      sec?.classList.toggle('is-active', key===name);
    });
  }
  tabButtons.forEach(btn=> btn.addEventListener('click', ()=> activateTab(btn.dataset.tab)));

  /* ================== Filtros por ciudad ================== */
  function uniqueCitiesFromRooms(){
    return [...new Set(getRooms().map(r => (r.city || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function fillCityFilters(){
    const makeOpts = (list) => ['<option value="all">Todas las ciudades</option>', ...list.map(c=>`<option value="${c}">${c}</option>`)].join('');
    const cities = uniqueCitiesFromRooms();
    if (fCityRooms)    fCityRooms.innerHTML    = makeOpts(cities);
    if (fCityBookings) fCityBookings.innerHTML = makeOpts(cities);
  }

  /* ================== Toast ================== */
  function showToast(msg){
    let t = document.getElementById('admToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'admToast';
      t.style.cssText = `
        position: fixed; right: 16px; bottom: 16px; z-index: 9999;
        background: #10b981; color: #0b1321; padding: 10px 14px; border-radius: 10px;
        font: 600 14px/1 Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        box-shadow: 0 10px 30px rgba(0,0,0,.25); transform: translateY(20px); opacity: 0;
        transition: .25s ease;`;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(()=>{ t.style.opacity = 1; t.style.transform = 'translateY(0)'; });
    clearTimeout(t._h);
    t._h = setTimeout(()=>{ t.style.opacity = 0; t.style.transform = 'translateY(20px)'; }, 1800);
  }

  /* ================== Modal de Habitación ================== */
  function ensureRoomModal(){
    if (document.getElementById('roomOverlay')) return;
    const html = `
    <div class="adm-overlay" id="roomOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="roomModalTitle">
        <header class="adm-modal__head">
          <h3 id="roomModalTitle">Nueva habitación</h3>
          <button class="adm-close" data-close>×</button>
        </header>

        <form id="roomForm" class="adm-form">
          <div class="adm-grid-2">
            <label>Ciudad
              <input type="text" id="rmCity" required>
            </label>
            <label>Nombre
              <input type="text" id="rmName" required>
            </label>
            <label>Tipo
              <input type="text" id="rmType" placeholder="Suite, Deluxe, Estándar…">
            </label>
            <label>Capacidad
              <input type="number" id="rmCap" min="1" value="2" required>
            </label>
            <label>Estrellas
              <input type="number" id="rmStars" min="0" max="5" value="4">
            </label>
            <label>Metros (m²)
              <input type="number" id="rmM2" min="0" value="30">
            </label>
            <label>Vista
              <input type="text" id="rmView" placeholder="Mar, Ciudad, Jardín…">
            </label>
            <label>Precio /noche (COP)
              <input type="number" id="rmPrice" min="0" value="300000" required>
            </label>
            <label class="adm-grid-span">Imagen (URL)
              <input type="url" id="rmImg" placeholder="https://…">
            </label>
          </div>

          <fieldset class="adm-feats">
            <legend>Características</legend>
            <label><span>Camas</span><input type="number" id="rmBeds" min="1" value="1"></label>
            <label><input type="checkbox" id="rmWifi" checked> Wi-Fi</label>
            <label><input type="checkbox" id="rmMinibar"> Minibar</label>
            <label><input type="checkbox" id="rmHotTub"> Jacuzzi</label>
            <label><input type="checkbox" id="rmBalcony"> Balcón</label>
            <label><input type="checkbox" id="rmAC" checked> A/A</label>
            <label><input type="checkbox" id="rmBreakfast"> Desayuno</label>
          </fieldset>

          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--primary">Guardar</button>
          </footer>
        </form>
      </section>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('roomOverlay');
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay || e.target.closest('[data-close]')) closeRoomModal();
    });
  }

  function openRoomModal(mode, room, onSave){
    ensureRoomModal();
    const overlay = document.getElementById('roomOverlay');
    const title   = document.getElementById('roomModalTitle');
    const form    = document.getElementById('roomForm');

    const r = room || {
      id: null, city:'', name:'', type:'', capacity:2, stars:4, sizeM2:30, view:'',
      priceNow:300000, image:'', features:{ beds:1, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false }
    };

    // Rellenar valores
    $('#rmCity').value  = r.city || '';
    $('#rmName').value  = r.name || '';
    $('#rmType').value  = r.type || '';
    $('#rmCap').value   = r.capacity ?? 2;
    $('#rmStars').value = r.stars ?? 0;
    $('#rmM2').value    = r.sizeM2 ?? 0;
    $('#rmView').value  = r.view || '';
    $('#rmPrice').value = r.priceNow ?? 0;
    $('#rmImg').value   = r.image || '';
    $('#rmBeds').value  = r.features?.beds ?? 1;
    $('#rmWifi').checked = !!r.features?.wifi;
    $('#rmMinibar').checked = !!r.features?.minibar;
    $('#rmHotTub').checked  = !!r.features?.hotTub;
    $('#rmBalcony').checked = !!r.features?.balcony;
    $('#rmAC').checked      = !!r.features?.ac;
    $('#rmBreakfast').checked = !!r.features?.breakfast;

    title.textContent = mode === 'edit' ? 'Editar habitación' : 'Nueva habitación';

    // Abrir + bloquear scroll del fondo
    overlay.style.display = 'block';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    form.onsubmit = (ev)=>{
      ev.preventDefault();
      const data = {
        id: r.id,
        city: $('#rmCity').value.trim(),
        name: $('#rmName').value.trim(),
        type: $('#rmType').value.trim(),
        capacity: Number($('#rmCap').value || 0),
        stars: Number($('#rmStars').value || 0),
        sizeM2: Number($('#rmM2').value || 0),
        view: $('#rmView').value.trim(),
        priceNow: Number($('#rmPrice').value || 0),
        image: $('#rmImg').value.trim(),
        features: {
          beds: Number($('#rmBeds').value || 1),
          wifi: $('#rmWifi').checked,
          minibar: $('#rmMinibar').checked,
          hotTub: $('#rmHotTub').checked,
          balcony: $('#rmBalcony').checked,
          ac: $('#rmAC').checked,
          breakfast: $('#rmBreakfast').checked
        }
      };
      onSave?.(data);
      closeRoomModal();
    };
  }

  function closeRoomModal(){
    const overlay = document.getElementById('roomOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.style.display='none', 160);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /* ================== Modal EDITAR Reserva ================== */
  function ensureBookingModal(){
    if (document.getElementById('bookingOverlay')) return;
    const html = `
    <div class="adm-overlay" id="bookingOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="bookingModalTitle">
        <header class="adm-modal__head">
          <h3 id="bookingModalTitle">Editar reserva</h3>
          <button class="adm-close" data-close>×</button>
        </header>

        <form id="bookingForm" class="adm-form">
          <div class="adm-grid-2">
            <label>Huésped
              <input type="text" id="bkName" required placeholder="Nombre y apellido">
            </label>
            <label>Correo
              <input type="email" id="bkEmail" required placeholder="correo@ejemplo.com">
            </label>
            <label>Entrada
              <input type="date" id="bkIn" required>
            </label>
            <label>Salida
              <input type="date" id="bkOut" required>
            </label>
            <label>Habitación
              <input type="text" id="bkRoom" disabled>
            </label>
            <label>Ciudad
              <input type="text" id="bkCity" disabled>
            </label>
            <label>Noches
              <input type="number" id="bkNights" disabled>
            </label>
            <label>Total (COP)
              <input type="text" id="bkTotal" disabled>
            </label>
          </div>

          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--primary">Guardar</button>
          </footer>
        </form>
      </section>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('bookingOverlay');
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay || e.target.closest('[data-close]')) closeBookingModal();
    });
  }

  function openBookingModal(booking, room, onSave){
    ensureBookingModal();

    const overlay = document.getElementById('bookingOverlay');
    const form    = document.getElementById('bookingForm');
    const title   = document.getElementById('bookingModalTitle');

    // Prefill
    $('#bkName').value  = booking.userName || '';
    $('#bkEmail').value = booking.userEmail || '';
    $('#bkIn').value    = toISO(new Date(booking.start));
    $('#bkOut').value   = toISO(new Date(booking.end));
    $('#bkRoom').value  = room.name || '—';
    $('#bkCity').value  = room.city || '—';

    const price = Number(room.priceNow || 0);

    const recalc = () => {
      const s = parseLocal($('#bkIn').value);
      const e = parseLocal($('#bkOut').value);
      let nights = (s && e) ? Math.max(0, diffDays(s,e)) : 0;
      $('#bkNights').value = nights;
      $('#bkTotal').value  = formatCOP(nights * price);
    };
    $('#bkIn').onchange = $('#bkOut').onchange = recalc;
    recalc();

    title.textContent = 'Editar reserva';
    overlay.style.display = 'block';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    form.onsubmit = (ev)=>{
      ev.preventDefault();

      const inStr  = $('#bkIn').value;
      const outStr = $('#bkOut').value;
      const s = parseLocal(inStr);
      const e2 = parseLocal(outStr);
      if (!s || !e2 || e2 <= s){ showToast('Fechas inválidas'); return; }

      const all = getBookings();
      const overlapRoom = all.some(x => x.id !== booking.id && x.roomId === booking.roomId &&
        overlap(s, e2, new Date(x.start), new Date(x.end)));
      if (overlapRoom){ showToast('Se cruza con otra reserva'); return; }

      const nights = diffDays(s, e2);
      const total  = nights * price;

      const data = {
        ...booking,
        userName: $('#bkName').value.trim(),
        userEmail: $('#bkEmail').value.trim(),
        start: s.toISOString(),
        end:   e2.toISOString(),
        total,
        updatedAt: new Date().toISOString()
      };

      onSave?.(data);
      closeBookingModal();
    };
  }

  function closeBookingModal(){
    const overlay = document.getElementById('bookingOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.style.display='none', 160);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /* ================== Modal ELIMINAR Reserva (nuevo) ================== */
  function ensureDeleteBookingModal(){
    if (document.getElementById('delBkOverlay')) return;

    const html = `
    <div class="adm-overlay" id="delBkOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="delBkTitle">
        <header class="adm-modal__head">
          <h3 id="delBkTitle">Eliminar reserva</h3>
          <button class="adm-close" data-close>×</button>
        </header>

        <form class="adm-form" id="delBkForm">
          <div class="adm-grid-2">
            <label>Habitación
              <input type="text" id="dbkRoom" disabled>
            </label>
            <label>Ciudad
              <input type="text" id="dbkCity" disabled>
            </label>
            <label>Huésped
              <input type="text" id="dbkGuest" disabled>
            </label>
            <label>Correo
              <input type="text" id="dbkEmail" disabled>
            </label>
            <label>Entrada
              <input type="text" id="dbkIn" disabled>
            </label>
            <label>Salida
              <input type="text" id="dbkOut" disabled>
            </label>
            <label>Noches
              <input type="text" id="dbkNights" disabled>
            </label>
            <label>Total
              <input type="text" id="dbkTotal" disabled>
            </label>
          </div>

          <div style="margin-top:.4rem;color:var(--adm-soft)">
            ¿Seguro que deseas <b>eliminar</b> esta reserva? Esta acción no se puede deshacer.
          </div>

          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--danger">Eliminar</button>
          </footer>
        </form>
      </section>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('delBkOverlay');
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay || e.target.closest('[data-close]')) closeDeleteBookingModal(false);
    });
    document.addEventListener('keydown', (ev)=>{
      if (overlay.classList.contains('is-open') && ev.key === 'Escape') closeDeleteBookingModal(false);
    });
  }

  function openDeleteBookingModal(booking, room){
    ensureDeleteBookingModal();
    const overlay = document.getElementById('delBkOverlay');
    const form    = document.getElementById('delBkForm');

    const nights = (()=>{ try { return diffDays(new Date(booking.start), new Date(booking.end)); } catch { return 0; } })();
    $('#dbkRoom').value   = room.name || '—';
    $('#dbkCity').value   = room.city || '—';
    $('#dbkGuest').value  = booking.userName || '—';
    $('#dbkEmail').value  = booking.userEmail || '—';
    $('#dbkIn').value     = fmtDate(booking.start);
    $('#dbkOut').value    = fmtDate(booking.end);
    $('#dbkNights').value = String(nights);
    $('#dbkTotal').value  = formatCOP(booking.total || 0);

    overlay.style.display = 'block';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return new Promise((resolve)=>{
      overlay._resolver = resolve;
      form.onsubmit = (ev)=>{
        ev.preventDefault();
        closeDeleteBookingModal(true);
      };
    });
  }

  function closeDeleteBookingModal(result){
    const overlay = document.getElementById('delBkOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.style.display='none', 160);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (overlay._resolver){
      overlay._resolver(result === true);
      overlay._resolver = null;
    }
  }

  /* ================== Render: Habitaciones ================== */
  function renderRooms(){
    const rooms = getRooms();
    const q    = (qRooms?.value || '').toLowerCase().trim();
    const city = fCityRooms?.value || 'all';

    const filtered = rooms.filter(r=>{
      const matchCity = (city === 'all') || (r.city === city);
      const haystack  = `${r.name||''} ${r.type||''}`.toLowerCase();
      const matchQ    = !q || haystack.includes(q);
      return matchCity && matchQ;
    });

    roomsTbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.id || '—'}</td>
        <td>${r.city || '—'}</td>
        <td>${r.name || '—'}</td>
        <td>${r.type || '—'}</td>
        <td>${r.capacity || '—'}</td>
        <td>${r.stars ? '★'.repeat(r.stars) : '—'}</td>
        <td>${r.sizeM2 || '—'}</td>
        <td>${r.view || '—'}</td>
        <td>${formatCOP(r.priceNow)}</td>
        <td>
          <button class="adm-btn adm-btn--sm" data-edit="${r.id}">Editar</button>
          <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${r.id}">Eliminar</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="10">No hay habitaciones</td></tr>`;
  }

  /* ================== Crear / Editar / Eliminar habitaciones ================== */
  btnNewRoom?.addEventListener('click', () => {
    openRoomModal('new', null, (nr) => {
      const rooms = getRooms();
      nr.id = uid();
      rooms.push(nr);
      saveRooms(rooms);
      fillCityFilters();
      renderRooms();
      showToast('Habitación creada');
    });
  });

  roomsTbody?.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel  = e.target.closest('[data-del]');

    if (btnEdit){
      const id = btnEdit.getAttribute('data-edit');
      const rooms = getRooms();
      const idx = rooms.findIndex(r=>r.id===id);
      if (idx === -1) return;

      const current = rooms[idx];
      openRoomModal('edit', current, (edited) => {
        rooms[idx] = { ...current, ...edited };
        saveRooms(rooms);
        fillCityFilters();
        renderRooms();
        showToast('Habitación actualizada');
      });
    }

    if (btnDel){
      const id = btnDel.getAttribute('data-del');
      if (!confirm('¿Eliminar esta habitación?')) return; // (si quieres también lo paso a modal luego)
      const rooms = getRooms().filter(r=>r.id!==id);
      saveRooms(rooms);
      fillCityFilters();
      renderRooms();
      showToast('Habitación eliminada');
    }
  });

  /* ================== Render: Reservas (con acciones) ================== */
  function renderBookings(){
    const rooms = getRooms();
    const bookings = getBookings();

    const q    = (qBookings?.value || '').toLowerCase().trim();
    const city = fCityBookings?.value || 'all';

    const filtered = bookings.filter(b=>{
      const room = rooms.find(r=>r.id===b.roomId) || {};
      const matchCity = (city === 'all') || (room.city === city);
      const text = `${b.userName||''} ${b.userEmail||''}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      return matchCity && matchQ;
    });

    bookingsTbody.innerHTML = filtered.map(b=>{
      const r = rooms.find(x=>x.id===b.roomId) || {};
      const s = fmtDate(b.start);
      const e = fmtDate(b.end);
      const nights = (() => { try { return diffDays(new Date(b.start), new Date(b.end)); } catch { return '—'; } })();

      return `
        <tr>
          <td>${b.id.slice(0,8)}</td>
          <td>${r.name || '—'}</td>
          <td>${r.city || '—'}</td>
          <td>${b.userName || '—'}</td>
          <td>${b.userEmail || '—'}</td>
          <td>${s}</td>
          <td>${e}</td>
          <td>${nights}</td>
          <td>${formatCOP(b.total)}</td>
          <td>
            <button class="adm-btn adm-btn--sm" data-bkedit="${b.id}">Editar</button>
            <button class="adm-btn adm-btn--sm adm-btn--danger" data-bkdel="${b.id}">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="10">No hay reservas</td></tr>`;
  }

  bookingsTbody?.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('[data-bkedit]');
    const btnDel  = e.target.closest('[data-bkdel]');
    if (!btnEdit && !btnDel) return;

    const rooms = getRooms();
    const all   = getBookings();

    if (btnDel){
      const id   = btnDel.getAttribute('data-bkdel');
      const bk   = all.find(x => x.id === id);
      const room = rooms.find(r => r.id === bk?.roomId) || {};
      if (!bk){ showToast('Reserva no encontrada'); return; }

      // Modal interactivo de eliminación
      openDeleteBookingModal(bk, room).then(ok=>{
        if (!ok) return;
        saveBookings(all.filter(x => x.id !== id));
        renderBookings();
        showToast('Reserva eliminada');
      });
      return;
    }

    if (btnEdit){
      const id = btnEdit.getAttribute('data-bkedit');
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return;
      const b = all[idx];
      const room = rooms.find(r=>r.id===b.roomId) || {};

      openBookingModal(b, room, (updated) => {
        all[idx] = updated;
        saveBookings(all);
        renderBookings();
        showToast('Reserva actualizada');
      });
    }
  });

  /* ================== Init ================== */
  function init(){
    activateTab('rooms');
    fillCityFilters();
    renderRooms();
    renderBookings();

    qRooms?.addEventListener('input', renderRooms);
    fCityRooms?.addEventListener('change', renderRooms);

    qBookings?.addEventListener('input', renderBookings);
    fCityBookings?.addEventListener('change', renderBookings);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
