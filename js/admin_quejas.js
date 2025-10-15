document.addEventListener("DOMContentLoaded", () => {
    const LS_QUEJAS = "quejas";
    const quejas = JSON.parse(localStorage.getItem(LS_QUEJAS)) || [];
  
    const tabla = document.querySelector("#quejasTable tbody");
    const overlay = document.querySelector("#quejaOverlay");
    const form = document.querySelector("#quejaForm");
    const respuesta = document.querySelector("#respuestaAdmin");
    const estadoSel = document.querySelector("#estadoQueja");
    const idHidden = document.querySelector("#quejaId");
  
    function renderQuejas() {
      tabla.innerHTML = "";
      if (quejas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="8">No hay quejas ni reclamos registrados.</td></tr>`;
        return;
      }
  
      quejas.forEach(q => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${q.id}</td>
          <td>${q.fecha}</td>
          <td>${q.tipo}</td>
          <td>${q.asunto}</td>
          <td>${q.usuario || "—"}</td>
          <td>${q.estado}</td>
          <td>${q.respuesta || "—"}</td>
          <td>
            ${q.estado === "Pendiente" 
              ? `<button class="adm-btn btn-responder" data-id="${q.id}">Responder</button>` 
              : ""}
          </td>
        `;
        tabla.appendChild(tr);
      });
  
      document.querySelectorAll(".btn-responder").forEach(btn => {
        btn.addEventListener("click", () => abrirModal(btn.dataset.id));
      });
    }
  
    function abrirModal(id) {
      const q = quejas.find(x => x.id == id);
      if (!q) return;
      idHidden.value = q.id;
      respuesta.value = q.respuesta || "";
      estadoSel.value = "Resuelto";
      overlay.hidden = false;
    }
  
    function cerrarModal() {
      overlay.hidden = true;
      form.reset();
    }
  
    overlay.addEventListener("click", e => {
      if (e.target.dataset.close !== undefined || e.target === overlay) cerrarModal();
    });
  
    form.addEventListener("submit", e => {
      e.preventDefault();
      const id = idHidden.value;
      const q = quejas.find(x => x.id == id);
      if (!q) return;
  
      q.respuesta = respuesta.value.trim();
      q.estado = estadoSel.value;
  
      localStorage.setItem(LS_QUEJAS, JSON.stringify(quejas));
      cerrarModal();
      renderQuejas();
    });
  
    renderQuejas();
  });
  