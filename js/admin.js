(() => {
  'use strict';

  const LS_USERS = 'erc_users';
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
  if (!users.some(u => u.email === 'admin@erc.com')) {
    users.push({
      id: 'u-admin',
      name: 'Administrador',
      email: 'admin@erc.com',
      password: 'Admin123!', 
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(LS_USERS, JSON.stringify(users));
    console.info('Usuario admin creado: admin@erc.com / admin123');
  }

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

  // ====== Tabs ======
  tabBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
      document.getElementById(btn.dataset.tab).classList.remove('hidden');
    });
  });

  // ====== Mostrar habitaciones ======
  function renderRooms(){
    const rooms = getRooms();
    const query = qRooms.value.toLowerCase();
    const city  = fCityRooms.value;
    const filtered = rooms.filter(r=>{
      const matchCity = !city || r.ciudad===city;
      const matchName = !query || r.nombre.toLowerCase().includes(query);
      return matchCity && matchName;
    });

    roomsTbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.id}</td>
        <td>${r.nombre}</td>
        <td>${r.ciudad}</td>
        <td>${formatCOP(r.precio)}</td>
        <td>${r.disponible ? 'Sí' : 'No'}</td>
        <td>
          <button class="btn-edit" data-id="${r.id}">Editar</button>
          <button class="btn-del" data-id="${r.id}">Eliminar</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6">No hay habitaciones</td></tr>';
  }

  // ====== Mostrar reservas ======
  function renderBookings(){
    const reservas = getBookings();
    const query = qBookings.value.toLowerCase();
    const city  = fCityBookings.value;
    const rooms = getRooms();

    const filtered = reservas.filter(b=>{
      const room = rooms.find(r=>r.id===b.roomId) || {};
      const matchCity = !city || room.ciudad===city;
      const matchUser = !query || (b.usuario && b.usuario.toLowerCase().includes(query));
      return matchCity && matchUser;
    });

    bookingsTbody.innerHTML = filtered.map(b=>{
      const r = rooms.find(r=>r.id===b.roomId) || {};
      return `
        <tr>
          <td>${b.id}</td>
          <td>${r.nombre || '—'}</td>
          <td>${r.ciudad || '—'}</td>
          <td>${b.usuario || '—'}</td>
          <td>${b.checkin} → ${b.checkout}</td>
          <td>${formatCOP(b.total)}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="6">No hay reservas</td></tr>';
  }

  // ====== Inicializar ======
  renderRooms();
  renderBookings();

  [qRooms, fCityRooms].forEach(el=>el.addEventListener('input', renderRooms));
  [qBookings, fCityBookings].forEach(el=>el.addEventListener('input', renderBookings));

})();
