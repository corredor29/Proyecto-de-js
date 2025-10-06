(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);

  const form = $('#bookingForm');
  const inEl = $('#checkin');
  const outEl = $('#checkout');
  const guests = $('#guests');
  const msgEl = $('#bookingMsg');
  const chip  = $('#rbNights');

  const resTitle = $('#resTitle');
  const resSub   = $('#resSubtitle');
  const resGrid  = $('#resultsGrid');
  const resMsg   = $('#resMsg');

  const overlay  = $('#resOverlay');
  const drawer   = $('.res-drawer');
  const btnClose = $('#resClose');
  const btnCancel= $('#resCancel');
  const btnOK    = $('#resConfirm');
  const bodyBox  = $('#resvBody');

  const MS = 86400000;
  const fmt = (d) => d.toISOString().slice(0,10);
  const toMoney = (n) => n.toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});

  const today = new Date(); today.setHours(0,0,0,0);
  inEl.min = fmt(today);
  outEl.min = fmt(new Date(today.getTime() + MS));

  const setMsg = (t='', c='') => { msgEl.textContent = t; msgEl.className = 'book-msg' + (c?` ${c}`:''); };

  // Demo de habitaciones
  const ROOMS = [
    { id:'suite-deluxe', name:'Suite Deluxe', img:'/image/gallery/habitacion-01.jpg', price:480000, tags:['Vista ciudad','Desayuno','King bed'] },
    { id:'junior-suite', name:'Junior Suite', img:'/image/gallery/habitacion-02.jpg', price:380000, tags:['Balcón','Café gourmet','Queen bed'] },
    { id:'doble-garden', name:'Doble Garden', img:'/image/gallery/jardin-01.jpg', price:290000, tags:['Vista jardín','2 camas','A/C'] },
    { id:'spa-retreat',  name:'Spa Retreat',  img:'/image/gallery/spa-01.jpg',       price:520000, tags:['Acceso spa','Jacuzzi','King bed'] },
  ];

  // ========= Helpers UI =========
  const updateChip = () => {
    const ci = new Date(inEl.value);
    const co = new Date(outEl.value);
    if (!isNaN(ci) && !isNaN(co) && co > ci) {
      const nights = Math.round((co - ci)/MS);
      chip.hidden = false;
      chip.textContent = `${nights} noche${nights>1?'s':''} · ${guests.value} huésped${guests.value>1?'es':''}`;
    } else {
      chip.hidden = true;
      chip.textContent = '—';
    }
  };

  const renderResults = (ci, co, g) => {
    const nights = Math.round((co - ci)/MS);
    resTitle.textContent = 'Disponibilidad';
    resSub.textContent = `${nights} noche${nights>1?'s':''} · ${g} huésped${g>1?'es':''}`;
    resGrid.innerHTML = '';

    ROOMS.forEach(r => {
      const total = r.price * nights;
      const el = document.createElement('article');
      el.className = 'res-card hotel-card';
      el.innerHTML = `
        <div class="hotel-media"><img src="${r.img}" alt="${r.name}"></div>
        <div class="hotel-body">
          <h3 class="hotel-title">${r.name}</h3>
          <p class="hotel-sub">${r.tags.join(' · ')}</p>
          <div class="price-block">
            <div>
              <div class="price-now">${toMoney(r.price)} <span style="font-weight:700;font-size:.9rem">/ noche</span></div>
              <div class="price-old">Total ${nights}n: <strong>${toMoney(total)}</strong></div>
            </div>
            <button class="btn-card" data-id="${r.id}">Reservar</button>
          </div>
        </div>
      `;
      resGrid.appendChild(el);
    });

    resMsg.textContent = ROOMS.length ? '' : 'No encontramos opciones para esas fechas.';
  };

  const openDrawer = (payload) => {
    bodyBox.innerHTML = `
      <ul class="res-sum">
        <li><strong>Habitación:</strong> ${payload.roomName}</li>
        <li><strong>Entrada:</strong> ${payload.checkin}</li>
        <li><strong>Salida:</strong> ${payload.checkout}</li>
        <li><strong>Noches:</strong> ${payload.nights}</li>
        <li><strong>Huéspedes:</strong> ${payload.guests}</li>
        <li><strong>Total:</strong> ${toMoney(payload.total)}</li>
      </ul>
      <p class="res-note">Tu reserva quedará registrada y recibirás confirmación en recepción.</p>
    `;
    overlay.hidden = false;
    setTimeout(() => drawer.classList.add('is-open'), 10);
  };
  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    setTimeout(() => overlay.hidden = true, 200);
  };

  // ========= Listeners =========
  inEl.addEventListener('change', () => {
    const ci = new Date(inEl.value);
    if (isNaN(ci)) return;
    outEl.min = fmt(new Date(ci.getTime() + MS));
    if (outEl.value && new Date(outEl.value) <= ci) outEl.value = '';
    updateChip();
  });
  outEl.addEventListener('change', updateChip);
  guests.addEventListener('change', updateChip);

  form.addEventListener('submit', (e) => {
    e.preventDefault(); setMsg('');
    const ci = inEl.value, co = outEl.value, g = parseInt(guests.value||'0',10);
    if (!ci || !co || !g) return setMsg('Completa fechas y personas.', 'err');
    const ciD = new Date(ci), coD = new Date(co);
    if (coD <= ciD) return setMsg('La salida debe ser posterior a la entrada.', 'err');
    const nights = Math.round((coD - ciD)/MS);
    if (nights > 30) return setMsg('Estancia máxima: 30 noches.', 'err');

    sessionStorage.setItem('erc_booking', JSON.stringify({checkin:ci, checkout:co, guests:g, nights}));
    renderResults(ciD, coD, g);
    location.hash = '#resultados';
  });

  // Reservar click (delegado)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-card');
    if (!btn || !resGrid.contains(btn)) return;

    const r = ROOMS.find(x => x.id === btn.dataset.id);
    const ci = new Date(inEl.value), co = new Date(outEl.value);
    const nights = Math.round((co - ci)/MS);
    const payload = {
      roomId: r.id,
      roomName: r.name,
      checkin: inEl.value,
      checkout: outEl.value,
      guests: parseInt(guests.value,10),
      nights,
      total: r.price * nights,
    };
    openDrawer(payload);

    // Confirmar
    btnOK.onclick = () => {
      const list = JSON.parse(localStorage.getItem('erc_reservations') || '[]');
      const code = 'RC' + Math.random().toString(36).slice(2,7).toUpperCase();
      list.push({...payload, code, ts: Date.now()});
      localStorage.setItem('erc_reservations', JSON.stringify(list));
      closeDrawer();
      resMsg.className = 'book-msg ok';
      resMsg.textContent = `¡Reserva confirmada! Código: ${code}`;
    };
  });

  btnClose.addEventListener('click', closeDrawer);
  btnCancel.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closeDrawer(); });

  const params = new URLSearchParams(location.search);
  const saved = sessionStorage.getItem('erc_booking');
  const pre = saved ? JSON.parse(saved) : Object.fromEntries(params.entries());

  if (pre.checkin) inEl.value  = pre.checkin;
  if (pre.checkout) outEl.value = pre.checkout;
  if (pre.guests) guests.value  = String(pre.guests);

  updateChip();
  if (inEl.value && outEl.value) {
    renderResults(new Date(inEl.value), new Date(outEl.value), parseInt(guests.value,10));
  }
})();
const checkin  = document.querySelector('#checkin');
const checkout = document.querySelector('#checkout');
const nightsEl = document.querySelector('#rbNights');

function fmt(d){ return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

const today = new Date();
checkin.min  = fmt(today);
checkout.min = fmt(today);

checkin.addEventListener('change', () => {
  const inD = new Date(checkin.value);
  if(!isNaN(inD)) {
    const minOut = new Date(inD); minOut.setDate(minOut.getDate()+1);
    checkout.min = fmt(minOut);
    if(new Date(checkout.value) <= inD) checkout.value = checkout.min;
  }
  renderNights();
});
checkout.addEventListener('change', renderNights);

function renderNights(){
  const a = new Date(checkin.value), b = new Date(checkout.value);
  const n = Math.round((b-a)/(1000*60*60*24));
  if(n>0){ nightsEl.textContent = `${n} noche${n>1?'s':''}`; nightsEl.hidden = false; }
  else   { nightsEl.hidden = true; }
}
renderNights();
