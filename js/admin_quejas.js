// /js/admin_quejas.js
(() => {
  'use strict';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ------------ storage ------------ */
  const TKEY = 'erc_quejas';
  const getTickets  = () => JSON.parse(localStorage.getItem(TKEY) || '[]');
  const saveTickets = (arr) => localStorage.setItem(TKEY, JSON.stringify(arr));

  /* ------------ utils ------------ */
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'}); }
    catch { return iso || '—'; }
  };
  const esc = (s) => String(s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const table = $('#quejasTable');
  const tbody = table?.querySelector('tbody');
  if (!table || !tbody) return;

  /* ========= 1) normalizar tickets legados ========= */
  function normalizeTickets() {
    const items = getTickets();
    let changed = false;

    const norm = items.map(t => {
      const out = { ...t };

      // estado controlado
      if (typeof out.status === 'string') {
        const s = out.status.toLowerCase();
        if (s !== out.status) { out.status = s; changed = true; }
        if (!['pendiente','resuelto','rechazado'].includes(out.status)) {
          out.status = 'pendiente'; changed = true;
        }
      } else { out.status = 'pendiente'; changed = true; }

      // tipo consistente
      if (typeof out.type === 'string') {
        const tl = out.type.trim().toLowerCase();
        const fixed = tl === 'reclamo' ? 'Reclamo' : 'Queja';
        if (fixed !== out.type) { out.type = fixed; changed = true; }
      } else { out.type = 'Queja'; changed = true; }

      // usuario
      if (!('userName' in out))  { out.userName = ''; changed = true; }
      if (!('userEmail' in out)) { out.userEmail = ''; changed = true; }

      // snapshot opcional
      if (!out.bookingSnapshot) out.bookingSnapshot = {};

      return out;
    });

    if (changed) saveTickets(norm);
  }

  /* ========= 2) asegurar thead + colgroup (8 columnas) ========= */
  function ensureQuejasHead() {
    const desired = ['ID','Fecha','Tipo','Asunto','Usuario','Estado','Respuesta','Acciones'];

    // thead
    let thead = table.querySelector('thead');
    if (!thead) thead = table.insertBefore(document.createElement('thead'), table.firstChild);

    let tr = thead.querySelector('tr');
    if (!tr) tr = thead.appendChild(document.createElement('tr'));

    const ths = [...tr.querySelectorAll('th')].map(th => th.textContent.trim());
    const needsBuild = ths.length !== desired.length || ths.some((t,i)=>t !== desired[i]);

    if (needsBuild) {
      tr.innerHTML = desired.map(t => `<th>${t}</th>`).join('');
    }

    // colgroup fijo (evita corrimientos)
    let colgroup = table.querySelector('colgroup[data-quejas-cols]');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      colgroup.setAttribute('data-quejas-cols','');
      table.insertBefore(colgroup, thead);
    }
    if (!colgroup.children.length) {
      // anchos sugeridos, ajusta a tu gusto
      const widths = ['90px','120px','100px','220px','160px','140px','220px','260px'];
      colgroup.innerHTML = widths.map(w => `<col style="width:${w}">`).join('');
    }
  }

  /* ========= 3) render tbody (8 <td> orden exacto) ========= */
  function renderAdminTickets() {
    normalizeTickets();
    ensureQuejasHead();

    const items = getTickets().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="adm-empty">No hay quejas ni reclamos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(t => {
      const idShort     = esc((t.id||'').slice(0,8));
      const fecha       = fmtDate(t.createdAt);
      const tipo        = esc(t.type||'—');
      const asunto      = esc(t.subject||'—');
      const usuario     = esc(t.userName || t.userEmail || '—');
      const isResuelto  = (t.status === 'resuelto');
      const estadoCell  = isResuelto
        ? `<span class="badge-resuelto"><span class="chk">✓</span>Resuelto</span>`
        : esc(t.status || 'pendiente');
      const respPrev    = t.response?.text
        ? esc(t.response.text.slice(0,40)) + (t.response.text.length>40?'…':'')
        : '<span style="opacity:.7">—</span>';
      const disableResp = t.response?.text ? 'disabled' : '';

      // ORDEN EXACTO: ID, Fecha, Tipo, Asunto, Usuario, Estado, Respuesta, Acciones
      return `
        <tr data-id="${esc(t.id)}" class="${isResuelto ? 'row-resuelto' : ''}">
          <td>${idShort}</td>
          <td>${fecha}</td>
          <td>${tipo}</td>
          <td class="td-asunto">${asunto}</td>
          <td>${usuario}</td>
          <td>${estadoCell}</td>
          <td class="td-resp">${respPrev}</td>
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

  /* ========= 4) animación mini al resolver ========= */
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

  /* ========= 5) acciones ========= */
  tbody.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn) {
      const id = viewBtn.getAttribute('data-view');
      const t = getTickets().find(x=>x.id===id);
      if (!t) return;
      const snap = t.bookingSnapshot || {};
      const summary = `Ticket #${t.id}
Fecha: ${fmtDate(t.createdAt)}
Usuario: ${t.userName || t.userEmail || '—'}
Reserva: ${t.bookingLabel || '—'}
Tipo: ${t.type || '—'}
Asunto: ${t.subject || '—'}
Estado: ${t.status || 'pendiente'}

Descripción:
${t.description || '—'}

Respuesta:
${t.response?.text || '(sin respuesta)'}
Imagen: ${snap.image || '(sin imagen)'}`;
      alert(summary);
      return;
    }

    const respBtn = e.target.closest('[data-respond]');
    if (respBtn) {
      const id = respBtn.getAttribute('data-respond');
      const all = getTickets();
      const idx = all.findIndex(x=>x.id===id);
      if (idx === -1) return;
      if (all[idx].response?.text) { alert('Este ticket ya tiene respuesta.'); return; }
      const text = prompt('Respuesta para el huésped:');
      if (!text || !text.trim()) return;
      const admin = window.ErcAuth?.getSession?.()?.email || 'admin';
      all[idx].response = { text: text.trim(), respondedAt: new Date().toISOString(), adminEmail: admin };
      saveTickets(all);
      renderAdminTickets();
      window.dispatchEvent(new Event('tickets:changed'));
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
    }
  });

  function boot(){
    normalizeTickets();
    ensureQuejasHead();
    renderAdminTickets();
  }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('tickets:changed', renderAdminTickets);
  window.addEventListener('auth:login', renderAdminTickets);
  window.addEventListener('auth:logout', renderAdminTickets);
  document.querySelector('.tabs .tab[data-tab="quejas"]')?.addEventListener('click', renderAdminTickets);
})();
