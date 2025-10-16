(() => {
  'use strict';

  // ============== Helpers DOM ==============
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // ============== Selectores principales ==============
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

  // ============== Storage y utilidades ==============
  const LS_ROOMS    = 'erc_rooms';
  const LS_BOOKINGS = 'erc_reservas';

  const getRooms     = () => JSON.parse(localStorage.getItem(LS_ROOMS)    || '[]');
  const saveRooms    = (arr) => localStorage.setItem(LS_ROOMS, JSON.stringify(arr));
  const getBookings  = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');

  const formatCOP = (n) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
  const toISO     = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const fmtDate   = (iso) => { try { return toISO(new Date(iso)); } catch { return iso || '—'; } };
  const uid       = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));

  // ============== Tabs ==============
  function activateTab(name){
    // botones
    tabButtons.forEach(b=>{
      const isActive = b.dataset.tab === name;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // secciones
    Object.entries(sections).forEach(([key,sec])=>{
      sec?.classList.toggle('is-active', key === name);
    });
  }
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // ============== Filtros (ciudades) ==============
  function uniqueCitiesFromRooms(){
    return [...new Set(getRooms().map(r => (r.ciudad || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function fillCityFilters(){
    const options = (list) => ['<option value="all">Todas las ciudades</option>', ...list.map(c=>`<option value="${c}">${c}</option>`)].join('');
    const cities = uniqueCitiesFromRooms();
    if (fCityRooms)    fCityRooms.innerHTML    = options(cities);
    if (fCityBookings) fCityBookings.innerHTML = options(cities);
  }

  // ============== Render: Habitaciones ==============
  function renderRooms(){
    const rooms = getRooms();
    // filtros
    const q    = (qRooms?.value || '').toLowerCase().trim();
    const city = fCityRooms?.value || 'all';

    const filtered = rooms.filter(r=>{
      const matchCity = (city === 'all') || (r.ciudad === city);
      const haystack  = `${r.nombre||''} ${r.tipo||''}`.toLowerCase();
      const matchQ    = !q || haystack.includes(q);
      return matchCity && matchQ;
    });

    roomsTbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.id || '—'}</td>
        <td>${r.ciudad || '—'}</td>
        <td>${r.nombre  || '—'}</td>
        <td>${r.tipo    || '—'}</td>
        <td>${r.capacidad ?? '—'}</td>
        <td>${Number(r.estrellas||0) > 0 ? '★'.repeat(r.estrellas) : '—'}</td>
        <td>${r.sizeM2 ?? '—'}</td>
        <td>${r.vista  || '—'}</td>
        <td>${formatCOP(r.precio)}</td>
        <td>
          <button class="adm-btn adm-btn--sm" data-edit="${r.id}">Editar</button>
          <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${r.id}">Eliminar</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="10">No hay habitaciones</td></tr>`;
  }

  // Crear / Editar / Eliminar (con prompts simples)
  btnNewRoom?.addEventListener('click', () => {
    const base = {
      id: uid(),
      ciudad: prompt('Ciudad de la habitación:','') || '',
      nombre: prompt('Nombre de la habitación:','') || '',
      tipo: prompt('Tipo (Suite, Deluxe, Estándar, etc.):','') || '',
      capacidad: Number(prompt('Capacidad (número de huéspedes):','2') || 2),
      estrellas: Number(prompt('Estrellas (0-5):','4') || 4),
      sizeM2: Number(prompt('Metros cuadrados:','30') || 30),
      vista: prompt('Vista (Mar, Ciudad, Jardín, etc.):','') || '',
      precio: Number(prompt('Precio por noche (COP):','300000') || 300000),
      image: prompt('URL de imagen (opcional):','') || '',
      features: { beds: 1, wifi: true, minibar: false, hotTub:false, balcony:false, ac:true, breakfast:false },
    };
    const rooms = getRooms();
    rooms.push(base);
    saveRooms(rooms);
    fillCityFilters();
    renderRooms();
    alert('Habitación creada.');
  });

  roomsTbody?.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel  = e.target.closest('[data-del]');
    if (btnEdit){
      const id = btnEdit.getAttribute('data-edit');
      const rooms = getRooms();
      const idx = rooms.findIndex(r=>r.id===id);
      if (idx === -1) return;

      const r = rooms[idx];
      // prompts con defaults
      r.ciudad    = prompt('Ciudad:', r.ciudad || '') ?? r.ciudad;
      r.nombre    = prompt('Nombre:', r.nombre || '') ?? r.nombre;
      r.tipo      = prompt('Tipo:', r.tipo || '') ?? r.tipo;
      r.capacidad = Number(prompt('Capacidad:', r.capacidad ?? 2) || r.capacidad || 2);
      r.estrellas = Number(prompt('Estrellas (0-5):', r.estrellas ?? 0) || r.estrellas || 0);
      r.sizeM2    = Number(prompt('Metros cuadrados:', r.sizeM2 ?? 0) || r.sizeM2 || 0);
      r.vista     = prompt('Vista:', r.vista || '') ?? r.vista;
      r.precio    = Number(prompt('Precio por noche (COP):', r.precio ?? 0) || r.precio || 0);
      r.image     = prompt('URL de imagen:', r.image || '') ?? r.image;

      rooms[idx] = r;
      saveRooms(rooms);
      fillCityFilters();
      renderRooms();
      alert('Habitación actualizada.');
    }
    if (btnDel){
      const id = btnDel.getAttribute('data-del');
      if (!confirm('¿Eliminar esta habitación?')) return;
      const rooms = getRooms().filter(r=>r.id!==id);
      saveRooms(rooms);
      fillCityFilters();
      renderRooms();
      alert('Habitación eliminada.');
    }
  });

  // ============== Render: Reservas ==============
  function renderBookings(){
    const rooms = getRooms();
    const bookings = getBookings();

    const q    = (qBookings?.value || '').toLowerCase().trim();
    const city = fCityBookings?.value || 'all';

    const filtered = bookings.filter(b=>{
      const room = rooms.find(r=>r.id===b.roomId) || {};
      const matchCity = (city === 'all') || (room.ciudad === city);
      const text = `${b.userName||''} ${b.userEmail||''}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      return matchCity && matchQ;
    });

    bookingsTbody.innerHTML = filtered.map(b=>{
      const r = rooms.find(x=>x.id===b.roomId) || {};
      const inD  = fmtDate(b.start);
      const outD = fmtDate(b.end);
      const nights = (() => {
        try { const a=new Date(b.start), c=new Date(b.end); return Math.round((c-a)/86400000); } catch { return '—'; }
      })();

      return `
        <tr>
          <td>${b.id}</td>
          <td>${r.nombre || '—'}</td>
          <td>${r.ciudad || '—'}</td>
          <td>${b.userName || '—'}</td>
          <td>${b.userEmail || '—'}</td>
          <td>${inD}</td>
          <td>${outD}</td>
          <td>${nights}</td>
          <td>${formatCOP(b.total)}</td>
          <td>—</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="10">No hay reservas</td></tr>`;
  }

  function init(){
    activateTab('rooms');
    // filtros
    fillCityFilters();
    // renders
    renderRooms();
    renderBookings();

    qRooms?.addEventListener('input', renderRooms);
    fCityRooms?.addEventListener('change', renderRooms);

    qBookings?.addEventListener('input', renderBookings);
    fCityBookings?.addEventListener('change', renderBookings);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
