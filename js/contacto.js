(() => {
  /* ==== CONSTANTES DEL LUGAR ==== */
  const HOTEL = {
    lat: 10.3910, lng: -75.4794,
    name: 'El Rincón del Carmen',
    address: 'Calle 123 # 4-56, Barrio Centro Histórico',
    phone: '+573001112233',
    email: 'hola@rincondelcarmen.com'
  };

  /* ==== UI / TOAST ==== */
  function toast(msg){
    let t = document.getElementById('appToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'appToast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2200);
  }

  /* ==== COMPLETAR LINKS ==== */
  document.addEventListener('DOMContentLoaded', () => {
    // Links de navegación
    const icHowTo = document.getElementById('icHowTo');
    const telLink = document.getElementById('telLink');
    const waLink = document.getElementById('waLink');
    const mailLink = document.getElementById('mailLink');
    const addrTxt = document.getElementById('addrTxt');
    const gmapsLink = document.getElementById('gmapsLink');
    const wazeLink = document.getElementById('wazeLink');
    const btnDirections = document.getElementById('btnDirections');

    if (icHowTo) icHowTo.href = `https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`;
    if (telLink) telLink.href = `tel:${HOTEL.phone}`;
    if (waLink) waLink.href = `https://wa.me/${HOTEL.phone.replace(/\D/g,'')}`;
    if (mailLink) mailLink.href = `mailto:${HOTEL.email}`;
    if (addrTxt) addrTxt.textContent = HOTEL.address;
    if (gmapsLink) gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${HOTEL.lat},${HOTEL.lng}`;
    if (wazeLink) wazeLink.href = `https://waze.com/ul?ll=${HOTEL.lat},${HOTEL.lng}&navigate=yes`;
    
    if (btnDirections) {
      btnDirections.addEventListener('click', () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`, '_blank', 'noopener');
      });
    }

    // Botón copiar
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sel = btn.getAttribute('data-copy');
        const el = sel && document.querySelector(sel);
        const v = el?.textContent?.trim();
        if (!v) return;
        navigator.clipboard?.writeText(v).then(() => toast('Copiado'));
      });
    });
  });

  /* ==== FORMULARIO ==== */
  const f = document.getElementById('contactForm');
  const m = document.getElementById('cfMsg');
  const b = document.getElementById('cfSubmit');

  // Autocompletar si hay sesión
  document.addEventListener('DOMContentLoaded', () => {
    const s = window.ErcAuth?.getSession?.();
    if (s) {
      const n = document.getElementById('cfName');
      const e = document.getElementById('cfEmail');
      if (n && !n.value) n.value = s.name || '';
      if (e && !e.value) e.value = s.email || '';
    }
  });

  // Persistencia demo sin backend
  const LS_CONTACT = 'erc_contact_msgs';
  const getMsgs = () => JSON.parse(localStorage.getItem(LS_CONTACT) || '[]');
  const saveMsgs = (arr) => localStorage.setItem(LS_CONTACT, JSON.stringify(arr));

  f?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (m) m.textContent = '';

    const fd = new FormData(f);
    const data = Object.fromEntries(fd.entries());
    const consent = document.getElementById('cfConsent')?.checked;
    
    if (!data.name || !data.email || !data.subject || !data.message || !consent) {
      if (m) {
        m.textContent = 'Por favor completa los campos requeridos.';
        m.style.color = '#b00020';
      }
      return;
    }

    if (b) {
      b.disabled = true;
      b.textContent = 'Enviando…';
    }

    const payload = {
      ...data,
      phone: data.phone || null,
      ts: new Date().toISOString(),
      sessionEmail: window.ErcAuth?.getSession?.()?.email || null
    };
    
    const all = getMsgs();
    all.push(payload);
    saveMsgs(all);

    if (b) {
      b.disabled = false;
      b.textContent = 'Enviar';
    }
    
    f.reset();
    toast('¡Mensaje enviado! Te contactaremos pronto.');
    
    if (m) {
      m.textContent = '¡Gracias! Hemos recibido tu mensaje.';
      m.style.color = 'green';
    }
  });

})();

(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .14 });
  els.forEach(el => io.observe(el));
})();
