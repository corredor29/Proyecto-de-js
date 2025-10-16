// /js/admin_quejas.js
(() => {
  'use strict';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const TKEY = 'erc_quejas';
  const getTickets  = () => JSON.parse(localStorage.getItem(TKEY) || '[]');
  const saveTickets = (arr) => localStorage.setItem(TKEY, JSON.stringify(arr));

  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'});} catch { return iso||'—'; } };
  const esc = (s) => String(s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const table = $('#quejasTable');
  const tbody = $('#quejasTable tbody');
  if (!table || !tbody) return;

  /* ========= Normalizar tickets legados ========= */
  function normalizeTickets() {
    const items = getTickets();
    let changed = false;

    const norm = items.map(t => {
      const out = { ...t };

      // Estado a minúsculas controladas
      if (typeof out.status === 'string') {
        const s = out.status.toLowerCase();
        if (s !== out.status) { out.status = s; changed = true; }
        if (!['pendiente','resuelto','rechazado'].includes(out.status)) {
          out.status = 'pendiente'; changed = true;
        }
      } else {
        out.status = 'pendiente'; changed = true;
      }

      // Tipo consistente (Queja / Reclamo con inicial mayúscula)
      if (typeof out.type === 'string') {
        const tl = out.type.trim().toLowerCase();
        const fixed = tl === 'reclamo' ? 'Reclamo' : 'Queja';
        if (fixed !== out.type) { out.type = fixed; changed = true; }
      } else { out.type = 'Queja'; changed = true; }

      // Campos de usuario
      if (!out.userName && out.userEmail) { out.userName = ''; changed = true; }
      if (!out.userEmail && out.userName) { out.userEmail = ''; changed = true; }

      // Snapshot opcional
      if (!out.bookingSnapshot) out.bookingSnapshot = {};

      return out;
    });

    if (changed) {
      saveTickets(norm);
      return true;
    }
    return false;
  }

  /* ========= Forzar orden del thead (8 columnas) ========= */
  function ensureQuejasHeadOrder() {
    const thead = table.querySelector('thead');
    if (!thead) return;

    const desired = ['ID','Fecha','Tipo','Asunto','Usuario','Estado','Respuesta','Acciones'];
    const ths = [...thead.querySelectorAll('th')].map(th => th.textContent.trim());
    if (ths.length === desired.length && ths.every((t,i)=>t === desired[i])) return;

    const row = thead.querySelector('tr') || thead.appendChild(document.createElement('tr'));
    row.innerHTML = '';
    desired.forEach(label => {
      const existing = [...thead.querySelectorAll('th')].find(th => th.textContent.trim() === label);
      const th = existing || document.createElement('th');
      if (!existing) th.textContent = label;
      row.appendChild(th);
    });
  }

  /* ========= Modal: Ver ticket ========= */
  function ensureTicketViewModal(){
    if (document.getElementById('ticketOverlay')) return;
    const html = `
    <div class="adm-overlay" id="ticketOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="ticketTitle">
        <header class="adm-modal__head">
          <h3 id="ticketTitle">Detalle del ticket</h3>
          <button class="adm-close" data-close>×</button>
        </header>

        <div class="adm-form" id="ticketBody"><!-- contenido dinámico --></div>

        <footer class="adm-modal__foot">
          <button type="button" class="adm-btn" data-close>Cerrar</button>
        </footer>
      </section>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('ticketOverlay');
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay || e.target.closest('[data-close]')) closeTicketViewModal();
    });
    document.addEventListener('keydown',(ev)=>{
      if (overlay.classList.contains('is-open') && ev.key === 'Escape') closeTicketViewModal();
    });
  }

  function openTicketViewModal(t){
    ensureTicketViewModal();
    const overlay = document.getElementById('ticketOverlay');
    const body    = document.getElementById('ticketBody');

    const snap = t.bookingSnapshot || {};
    const img  = snap.image || t.imageUrl || '';

    const statusBadge = (t.status === 'resuelto')
      ? '<span class="badge-resuelto"><span class="chk">✓</span>Resuelto</span>'
      : esc(t.status || 'pendiente');

    const kv = (k,v) => `
      <div class="kv">
        <div class="kv__label">${k}</div>
        <div class="kv__value">${v}</div>
      </div>`;

    const metaHTML = [
      kv('Ticket',  esc(t.id || '—')),
      kv('Fecha',   esc(fmtDate(t.createdAt))),
      kv('Usuario', esc(t.userName || t.userEmail || '—')),
      kv('Reserva', esc(t.bookingLabel || '—')),
      kv('Tipo',    esc(t.type || '—')),
      kv('Asunto',  esc(t.subject || '—')),
      kv('Estado',  statusBadge)
    ].join('');

    const imgHTML = img
      ? `<img src="${esc(img)}" alt="Imagen del ticket" class="ticket-img">`
      : `<div class="box" style="display:grid;place-items:center;height:220px;color:var(--adm-soft)">Sin imagen</div>`;

    body.innerHTML = `
      <div class="view-grid">
        <div class="view-meta">
          ${metaHTML}
        </div>
        <figure class="view-figure">
          ${imgHTML}
        </figure>
      </div>

      <div class="view-section">
        <h4>Descripción</h4>
        <div class="box">${esc(t.description || '—')}</div>
      </div>

      <div class="view-section">
        <h4>Respuesta</h4>
        <div class="box">${t.response?.text ? esc(t.response.text) : '<span style="opacity:.7">(sin respuesta)</span>'}</div>
      </div>
    `;

    overlay.style.display = 'block';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeTicketViewModal(){
    const overlay = document.getElementById('ticketOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.style.display='none', 160);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /* ========= Modal: Responder ticket (NUEVO) ========= */
  function ensureTicketRespondModal(){
    if (document.getElementById('respondOverlay')) return;
    const html = `
    <div class="adm-overlay" id="respondOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="respondTitle">
        <header class="adm-modal__head">
          <h3 id="respondTitle">Responder ticket</h3>
          <button class="adm-close" data-close>×</button>
        </header>

        <form class="adm-form" id="respondForm">
          <div class="adm-grid-2">
            <label>Usuario
              <input type="text" id="rUser" disabled>
            </label>
            <label>Asunto
              <input type="text" id="rSubject" disabled>
            </label>
            <label>Estado
              <select id="rStatus" required>
                <option value="resuelto">Resuelto</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </label>
          </div>

          <label class="adm-grid-span">Respuesta para el huésped
            <textarea id="rText" rows="6" required placeholder="Escribe aquí la respuesta…"></textarea>
          </label>

          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--primary">Guardar</button>
          </footer>
        </form>
      </section>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('respondOverlay');
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay || e.target.closest('[data-close]')) closeTicketRespondModal();
    });
    document.addEventListener('keydown',(ev)=>{
      if (overlay.classList.contains('is-open') && ev.key === 'Escape') closeTicketRespondModal();
    });
  }

  function openTicketRespondModal(ticket, onSave){
    ensureTicketRespondModal();

    const overlay = document.getElementById('respondOverlay');
    const form    = document.getElementById('respondForm');

    // Prefill
    $('#rUser').value    = ticket.userName || ticket.userEmail || '—';
    $('#rSubject').value = ticket.subject || '—';
    $('#rStatus').value  = (['resuelto','rechazado'].includes(ticket.status) ? ticket.status : 'resuelto');
    $('#rText').value    = '';

    overlay.style.display = 'block';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    form.onsubmit = (ev)=>{
      ev.preventDefault();
      const text = $('#rText').value.trim();
      const st   = $('#rStatus').value;
      if (!text) return;

      const admin = window.ErcAuth?.getSession?.()?.email || 'admin';
      const updated = {
        ...ticket,
        status: st,
        response: { text, respondedAt: new Date().toISOString(), adminEmail: admin }
      };

      onSave?.(updated);
      closeTicketRespondModal();
    };
  }

  function closeTicketRespondModal(){
    const overlay = document.getElementById('respondOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.style.display='none', 160);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /* ========= Render ========= */
  function renderAdminTickets() {
    const updated = normalizeTickets();
    if (updated) {}

    ensureQuejasHeadOrder();

    const items = getTickets().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    if (!items.length){ tbody.innerHTML = `<tr><td colspan="8">No hay quejas ni reclamos registrados.</td></tr>`; return; }

    tbody.innerHTML = items.map(t=>{
      const idShort = esc((t.id||'').slice(0,8));
      const date = fmtDate(t.createdAt);
      const type = esc(t.type||'—');
      const subj = esc(t.subject||'—');
      const user = esc(t.userName || t.userEmail || '—');
      const isResolved = (t.status==='resuelto');
      const statusCell = isResolved
        ? `<span class="badge-resuelto"><span class="chk">✓</span>Resuelto</span>`
        : esc(t.status||'pendiente');
      const respPrev = t.response?.text ? esc(t.response.text.slice(0,40))+(t.response.text.length>40?'…':'') : '<span style="opacity:.7">—</span>';
      const disableResp = t.response?.text ? 'disabled' : '';

      return `
        <tr data-id="${esc(t.id)}" class="${isResolved?'row-resuelto':''}">
          <td>${idShort}</td>
          <td>${date}</td>
          <td>${type}</td>
          <td>${subj}</td>
          <td>${user}</td>
          <td>${statusCell}</td>
          <td>${respPrev}</td>
          <td class="td-actions">
            <button class="adm-btn adm-btn--sm" data-view="${esc(t.id)}">Ver</button>
            <button class="adm-btn adm-btn--sm" data-respond="${esc(t.id)}" ${disableResp}>Responder</button>
            <button class="adm-btn adm-btn--sm" data-state="resuelto"  data-id="${esc(t.id)}">Resuelto</button>
            <button class="adm-btn adm-btn--sm adm-btn--danger" data-state="rechazado" data-id="${esc(t.id)}">Rechazado</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Mini confetti al marcar "Resuelto"
  function fireResolvedFX(row){
    if (!row) return;
    row.classList.add('row-resuelto-pop');
    const wrap = document.createElement('div');
    wrap.className = 'confetti';
    const colors = ['#34d399','#22c55e','#86efac','#bbf7d0','#10b981'];
    for (let i=0;i<24;i++){
      const p = document.createElement('i');
      p.style.left = Math.random()*100 + 'vw';
      p.style.top  = (10 + Math.random()*10) + 'vh';
      p.style.background = colors[i%colors.length];
      p.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
      p.style.animationDelay = (Math.random()*0.2)+'s';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(()=> wrap.remove(), 1000);
    setTimeout(()=> row.classList.remove('row-resuelto-pop'), 600);
  }

  // Acciones admin
  tbody.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn) {
      const id = viewBtn.getAttribute('data-view');
      const t = getTickets().find(x=>x.id===id);
      if (!t) return;
      openTicketViewModal(t);
      return;
    }

    const respBtn = e.target.closest('[data-respond]');
    if (respBtn) {
      const id = respBtn.getAttribute('data-respond');
      const all = getTickets();
      const idx = all.findIndex(x=>x.id===id);
      if (idx === -1) return;
      const t = all[idx];
      if (t.response?.text) return;

      openTicketRespondModal(t, (updated)=>{
        all[idx] = updated;
        saveTickets(all);
        renderAdminTickets();
        window.dispatchEvent(new Event('tickets:changed'));
      });
      return;
    }

    const stateBtn = e.target.closest('[data-state]');
    if (stateBtn) {
      const id = stateBtn.getAttribute('data-id');
      const st = stateBtn.getAttribute('data-state'); // 'resuelto' | 'rechazado'
      if (!['resuelto','rechazado'].includes(st)) return;
      const all = getTickets();
      const idx = all.findIndex(x=>x.id===id);
      if (idx === -1) return;
      all[idx].status = st;
      saveTickets(all);
      renderAdminTickets();
      window.dispatchEvent(new Event('tickets:changed'));

      if (st === 'resuelto'){
        const row = tbody.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
        fireResolvedFX(row);
      }
      return;
    }
  });

  function boot(){
    normalizeTickets();
    ensureQuejasHeadOrder();
    renderAdminTickets();
  }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('tickets:changed', renderAdminTickets);
  window.addEventListener('auth:login', renderAdminTickets);
  window.addEventListener('auth:logout', renderAdminTickets);
  const tabBtn = document.querySelector(`.tabs .tab[data-tab="quejas"]`);
  tabBtn?.addEventListener('click', renderAdminTickets);
})();
