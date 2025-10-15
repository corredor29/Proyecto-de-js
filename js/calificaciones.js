document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("usuarioActivo"));
  const quejas = JSON.parse(localStorage.getItem("quejas")) || [];
  const contenedor = document.querySelector("#contenedorQuejas");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <h2>Quejas y Reclamos</h2>
    <form id="formQueja" class="luxe-form">
      <label>
        <span>Reserva asociada</span>
        <input type="hidden" id="reservaAsociadaId" required>
        <div id="reservaAsociadaList" class="reserva-cards"></div>
      </label>

      <label>
        <span>Asunto</span>
        <input type="text" id="asunto" required>
      </label>

      <label>
        <span>Tipo</span>
        <select id="tipo" required>
          <option value="Queja">Queja</option>
          <option value="Reclamo">Reclamo</option>
        </select>
      </label>

      <label>
        <span>Descripción</span>
        <textarea id="descripcion" rows="3" required></textarea>
      </label>

      <button type="submit" class="luxe-btn luxe-btn--primary">Enviar</button>
    </form>

    <h3>Mis quejas y reclamos</h3>
    <div id="listaQuejas"></div>
  `;

  const listaQuejas = document.querySelector("#listaQuejas");
  const contenedorReservas = document.querySelector("#reservaAsociadaList");
  const inputReservaId = document.querySelector("#reservaAsociadaId");

  const clavesPosibles = ["reservas", "erc_reservas", "reservaciones"];
  let reservas = [];

  for (const clave of clavesPosibles) {
    const datos = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(datos)) {
      reservas = datos;
      break;
    }
  }

  const reservasUsuario = reservas.filter(r => 
    r.usuario === user?.email || r.email === user?.email || r.correo === user?.email
  );

  // === Mostrar reservas como tarjetas ===
  function renderReservasAsociadas() {
    contenedorReservas.innerHTML = "";

    if (reservasUsuario.length === 0) {
      contenedorReservas.innerHTML = `<p>No tienes reservas registradas.</p>`;
      return;
    }

    contenedorReservas.innerHTML = reservasUsuario.map(r => {
      const id = r.id || r.codigo || Date.now();
      const fechaEntrada = r.fechaEntrada || r.checkin || "—";
      const fechaSalida = r.fechaSalida || r.checkout || "—";
      const habitacion = r.habitacion || r.roomName || "Habitación";
      const ciudad = r.ciudad || r.city || "—";
      const img = r.imagen || (r.snapshot && r.snapshot.image) || "/image/habitacion1.jpg";

      return `
        <article class="res-card" data-id="${id}">
          <div class="res-media">
            <img src="${img}" alt="${habitacion}">
          </div>
          <div class="res-body">
            <h4>${habitacion}</h4>
            <p><strong>📍 Ciudad:</strong> ${ciudad}</p>
            <p><strong>📅</strong> ${fechaEntrada} → ${fechaSalida}</p>
            <button type="button" class="btn-select" data-select="${id}">Seleccionar</button>
          </div>
        </article>
      `;
    }).join("");
  }

  renderReservasAsociadas();

  // === Seleccionar reserva ===
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-select]");
    if (!btn) return;

    const id = btn.getAttribute("data-select");
    inputReservaId.value = id;

    document.querySelectorAll(".btn-select").forEach(b => {
      b.textContent = "Seleccionar";
      b.classList.remove("selected");
    });

    btn.textContent = "Seleccionada ✅";
    btn.classList.add("selected");
  });

  // === Envío del formulario ===
  document.querySelector("#formQueja").addEventListener("submit", e => {
    e.preventDefault();

    if (!inputReservaId.value) {
      alert("Por favor selecciona una reserva antes de enviar la queja.");
      return;
    }

    const nuevaQueja = {
      id: Date.now(),
      reservaId: inputReservaId.value,
      asunto: document.querySelector("#asunto").value.trim(),
      tipo: document.querySelector("#tipo").value,
      descripcion: document.querySelector("#descripcion").value.trim(),
      fecha: new Date().toLocaleDateString(),
      estado: "Pendiente",
      respuesta: "",
      usuario: user?.email
    };

    quejas.push(nuevaQueja);
    localStorage.setItem("quejas", JSON.stringify(quejas));

    e.target.reset();
    inputReservaId.value = "";
    document.querySelectorAll(".btn-select").forEach(b => {
      b.textContent = "Seleccionar";
      b.classList.remove("selected");
    });
    mostrarQuejas();
  });

  // === Mostrar lista de quejas ===
  function mostrarQuejas() {
    listaQuejas.innerHTML = "";
    const misQuejas = quejas.filter(q => q.usuario === user?.email);

    if (misQuejas.length === 0) {
      listaQuejas.innerHTML = `<p>No has registrado quejas ni reclamos.</p>`;
      return;
    }

    misQuejas.forEach(q => {
      const div = document.createElement("div");
      div.classList.add("queja-item");
      div.innerHTML = `
        <h4>${q.tipo}: ${q.asunto}</h4>
        <p><strong>Reserva asociada:</strong> ${q.reservaId}</p>
        <p><strong>Fecha:</strong> ${q.fecha}</p>
        <p><strong>Descripción:</strong> ${q.descripcion}</p>
        <p><strong>Estado:</strong> ${q.estado}</p>
        <p><strong>Respuesta:</strong> ${q.respuesta || "—"}</p>
        ${q.estado === "Pendiente" ? `<button data-id="${q.id}" class="btn-eliminar">Eliminar</button>` : ""}
        <hr>
      `;
      listaQuejas.appendChild(div);
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        const index = quejas.findIndex(q => q.id == id);
        if (index !== -1) {
          quejas.splice(index, 1);
          localStorage.setItem("quejas", JSON.stringify(quejas));
          mostrarQuejas();
        }
      });
    });
  }

  mostrarQuejas();
});
