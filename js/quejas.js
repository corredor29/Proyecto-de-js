(() => {
  const CONTAINER = document.getElementById('contenedorQuejas');
  if (!CONTAINER) return;

  const LS_TICKETS  = 'erc_quejas';
  const getTickets  = () => JSON.parse(localStorage.getItem(LS_TICKETS) || '[]');
  const saveTickets = arr => localStorage.setItem(LS_TICKETS, JSON.stringify(arr));

  const getBookings = () => {
    if (window.Resv?.getBookings) return window.Resv.getBookings();
    try { return JSON.parse(localStorage.getItem('erc_reservas') || '[]'); } catch { return []; }
  };

  const getSession = () => window.ErcAuth?.getSession?.() || null;
  const isAdmin = () => {
    const s = getSession();
    return !!s && (s.role === 'admin' || s.email === 'admin@hotel.com');
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'}); }
    catch { return iso; }
  };
  const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  const escapeHtml = (s) => String(s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  // NUEVO: respeta saltos de línea
  const nl2br = (s='') => String(s).replace(/\n/g, '<br>');

  const starsHTML = (n=0) => '★'.repeat(n) + '☆'.repeat(Math.max(0,5-n));
  const formatCOP = (n=0) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);

  function ticketCardGuest(t) {
    const snap = t.bookingSnapshot || {};
    const f = snap.features || {};
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? 'cama' : 'camas'}`;
    const statusClass =
      t.status === 'resuelto'  ? 'status-badge status-ok' :
      t.status === 'rechazado' ? 'status-badge status-bad' :
                                 'status-badge status-pending';

    const canDelete = t.status === 'pendiente';

    return `
      <article class="res-card q-ticket" data-id="${t.id}">
        <div class="res-media">
          <img src="${snap.image || '/image/habitacion1.jpg'}" alt="${escapeHtml(t.roomName || snap.name || 'Habitación')}" loading="lazy" />
          <span class="res-badge">${starsHTML(snap.stars || 0)}</span>
          <div class="q-chips">
            <span class="chip chip-type">${escapeHtml(t.type)}</span>
            <span class="${statusClass}">${t.status}</span>
          </div>
        </div>

        <div class="res-body">
          <h3 class="res-title">${escapeHtml(t.roomName || snap.name || 'Habitación')}</h3>
          <p class="res-sub">📍 ${escapeHtml(snap.city || '-')} · ${escapeHtml(snap.type || '')} · ${snap.sizeM2 || '-'} m² · Vista ${escapeHtml(snap.view || '-')}</p>

          <div class="res-features">
            <span>🛏️ ${bedsTxt}</span>
            ${f.wifi ? `<span>📶 Wi-Fi</span>` : ``}
            ${f.minibar ? `<span>🥤 Minibar</span>` : ``}
            ${f.hotTub ? `<span>🛁 Jacuzzi</span>` : ``}
            ${f.balcony ? `<span>🌿 Balcón</span>` : ``}
            ${f.ac ? `<span>❄️ A/A</span>` : ``}
            ${f.breakfast ? `<span>🍽️ Desayuno</span>` : ``}
          </div>

          <!-- NUEVO: rediseño de la parte inferior -->
          <div class="q-ticket__body">
            <!-- Infobar -->
            <div class="q-infobar">
              <span class="chip chip-code">#${t.id.slice(0,8)}</span>
              <span class="dot" aria-hidden="true"></span>
              <span class="q-date"><span class="ic">📅</span>${fmtDate(t.createdAt)}</span>
            </div>

            <!-- Bloque de reserva -->
            <div class="q-reserva">
              <span class="ic">🏨</span>
              <div class="q-reserva__txt">
                <span class="q-label">Reserva</span>
                <span class="q-value">${escapeHtml(t.bookingLabel || '—')}</span>
              </div>
            </div>

            <div class="q-divider" role="separator" aria-hidden="true"></div>

            <!-- Contenido del ticket -->
            <div class="q-content">
              <h4 class="q-ticket__subject">${escapeHtml(t.subject)}</h4>
              <p class="q-ticket__desc">${nl2br(escapeHtml(t.description))}</p>
            </div>

            ${t.response?.text ? `
              <div class="q-answer">
                <div class="q-answer__head">
                  <strong>Respuesta del administrador</strong>
                  <span class="q-answer__meta">${fmtDate(t.response.respondedAt)}</span>
                </div>
                <p>${nl2br(escapeHtml(t.response.text))}</p>
              </div>
            ` : `<p class="q-note">Aún no hay respuesta del administrador.</p>`}
          </div>

          <div class="q-ticket__actions">
            ${canDelete ? `<button class="luxe-btn q-del" data-del="${t.id}">Eliminar</button>` : `<span class="q-hint">No se puede eliminar (estado: ${t.status}).</span>`}
          </div>
        </div>
      </article>
    `;
  }

  function renderGuestUI() {
    const ses = getSession();
    if (!ses) {
      CONTAINER.innerHTML = `
        <section class="q-box">
          <h3>Quejas y Reclamos</h3>
          <p class="q-note">Inicia sesión para radicar y ver tus quejas o reclamos.</p>
        </section>`;
      return;
    }

    const myBookings = getBookings().filter(b => b.userEmail === ses.email);
    const options = myBookings.map(b => {
      const label = `${b.roomName} (${fmtDate(b.start)} → ${fmtDate(b.end)})`;
      return `<option value="${b.id}" data-label="${escapeHtml(label)}">${escapeHtml(label)}</option>`;
    }).join('');

    CONTAINER.innerHTML = `
      <section class="q-grid">
        <div class="q-box">
          <h3>Radicar Queja / Reclamo</h3>
          <form id="qForm" class="q-form" novalidate>
            <label class="luxe-field">
              <span>Reserva</span>
              <select name="bookingId" required>
                ${options || `<option value="">No tienes reservas activas</option>`}
              </select>
            </label>

            <label class="luxe-field">
              <span>Asunto</span>
              <input type="text" name="subject" placeholder="Asunto del ticket" minlength="3" required />
            </label>

            <label class="luxe-field">
              <span>Tipo</span>
              <select name="type" required>
                <option value="Queja">Queja</option>
                <option value="Reclamo">Reclamo</option>
              </select>
            </label>

            <label class="luxe-field">
              <span>Descripción</span>
              <textarea name="description" rows="4" placeholder="Describe lo ocurrido..." minlength="10" required></textarea>
            </label>

            <button class="luxe-btn luxe-btn--primary" type="submit">Radicar</button>
            <p class="q-tip">La fecha se asigna automáticamente y el estado inicia en <strong>pendiente</strong>.</p>
          </form>
        </div>

        <div class="q-box">
          <h3>Mis Quejas y Reclamos</h3>
          <div id="qMyList" class="q-list"></div>
        </div>
      </section>
    `;

    renderMyTickets();

    const form = document.getElementById('qForm');
    form?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const bookingId   = String(fd.get('bookingId') || '').trim();
      const subject     = String(fd.get('subject') || '').trim();
      const type        = String(fd.get('type') || '').trim();
      const description = String(fd.get('description') || '').trim();
      if (!bookingId || !subject || !type || !description) return toast('Completa todos los campos.');

      const booking = myBookings.find(b => b.id === bookingId);
      if (!booking) return toast('Reserva inválida.');

      const bookingLabel = `${booking.roomName} (${fmtDate(booking.start)} → ${fmtDate(booking.end)})`;
      const snapshot = booking.snapshot || {};
      const t = {
        id: uid(),
        bookingId,
        bookingLabel,
        roomName: booking.roomName,
        bookingSnapshot: snapshot,
        subject,
        type,
        description,
        userEmail: ses.email,
        userName:  ses.name || '',
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        response: null
      };

      const all = getTickets();
      all.push(t);
      saveTickets(all);

      form.reset();
      toast('Ticket radicado.');
      renderMyTickets();
      window.dispatchEvent(new Event('tickets:changed'));
    });

    CONTAINER.addEventListener('click', (e) => {
      const del = e.target.closest?.('[data-del]');
      if (!del) return;
      const id = del.getAttribute('data-del');
      const all = getTickets();
      const t = all.find(x => x.id === id);
      if (!t) return;
      if (t.userEmail !== ses.email) return toast('No puedes eliminar este ticket.');
      if (t.status !== 'pendiente')   return toast('Solo se pueden eliminar tickets pendientes.');

      saveTickets(all.filter(x => x.id !== id));
      toast('Ticket eliminado.');
      renderMyTickets();
      window.dispatchEvent(new Event('tickets:changed'));
    });
  }

  function renderMyTickets() {
    const ses = getSession();
    const list = document.getElementById('qMyList');
    if (!ses || !list) return;

    const mine = getTickets()
      .filter(t => t.userEmail === ses.email)
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = mine.length
      ? mine.map(ticketCardGuest).join('')
      : `<p class="q-note">Aún no has radicado tickets.</p>`;
  }

  function renderAdminUI() {
    if (!isAdmin()) return;
    const items = getTickets().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const rows = items.map(t => `
      <tr data-id="${t.id}">
        <td>${fmtDate(t.createdAt)}</td>
        <td>${escapeHtml(t.type)}</td>
        <td>${escapeHtml(t.subject)}</td>
        <td>${escapeHtml(t.userName || t.userEmail || '—')}</td>
        <td>${escapeHtml(t.status)}</td>
        <td class="q-admin-actions">
          <button class="luxe-btn luxe-btn--sm" data-view="${t.id}">Ver</button>
          <button class="luxe-btn luxe-btn--sm" data-respond="${t.id}" ${t.response?.text ? 'disabled' : ''}>Responder</button>
          <div class="q-admin-state">
            <button class="luxe-btn luxe-btn--sm q-ok" data-state="resuelto"  data-id="${t.id}">Resuelto</button>
            <button class="luxe-btn luxe-btn--sm q-bad" data-state="rechazado" data-id="${t.id}">Rechazado</button>
          </div>
        </td>
      </tr>
    `).join('');

    const existing = document.getElementById('qAdmin');
    const html = `
      <section id="qAdmin" class="q-box q-admin">
        <h3>Revisión de Quejas y Reclamos (Administrador)</h3>
        <div class="q-table-wrap">
          <table class="q-table">
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Título</th><th>Usuario</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="6" class="q-note">Sin tickets</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `;
    if (existing) existing.outerHTML = html; else CONTAINER.insertAdjacentHTML('beforeend', html);
  }

  // Acciones admin
  CONTAINER.addEventListener('click', (e) => {
    const viewBtn = e.target.closest?.('[data-view]');
    if (viewBtn && isAdmin()) {
      const id = viewBtn.getAttribute('data-view');
      const t = getTickets().find(x => x.id === id);
      if (!t) return;
      const snap = t.bookingSnapshot || {};
      const summary = `#${t.id}
Fecha: ${fmtDate(t.createdAt)}
Usuario: ${t.userName || t.userEmail}
Reserva: ${t.bookingLabel}
Tipo: ${t.type}
Asunto: ${t.subject}
Estado: ${t.status}

Descripción:
${t.description}

Respuesta:
${t.response?.text || '(sin respuesta)'}
Imagen: ${snap.image || '(sin imagen)'}`;
      alert(summary);
    }

    const respBtn = e.target.closest?.('[data-respond]');
    if (respBtn && isAdmin()) {
      const id = respBtn.getAttribute('data-respond');
      const all = getTickets();
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return;
      if (all[idx].response?.text) return toast('Este ticket ya tiene respuesta.');

      const text = prompt('Respuesta para el huésped:');
      if (!text || !text.trim()) return;

      const ses = getSession();
      all[idx].response = {
        text: text.trim(),
        respondedAt: new Date().toISOString(),
        adminEmail: ses?.email || 'admin'
      };
      saveTickets(all);
      toast('Respuesta guardada.');
      renderAdminUI();
      renderMyTickets();
    }

    const stateBtn = e.target.closest?.('[data-state]');
    if (stateBtn && isAdmin()) {
      const id = stateBtn.getAttribute('data-id');
      const newState = stateBtn.getAttribute('data-state');
      if (!['resuelto','rechazado'].includes(newState)) return;

      const all = getTickets();
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return;

      all[idx].status = newState;
      saveTickets(all);
      toast(`Estado actualizado a ${newState}.`);
      renderAdminUI();
      renderMyTickets();
    }
  });

  function toast(msg){
    let t = document.getElementById('qToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'qToast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  function renderAll(){ renderGuestUI(); if (isAdmin()) renderAdminUI(); }
  window.addEventListener('auth:login',  renderAll);
  window.addEventListener('auth:logout', renderAll);
  window.addEventListener('booking:changed', renderAll);
  window.addEventListener('tickets:changed', renderAll);
  document.addEventListener('DOMContentLoaded', renderAll);
})();
