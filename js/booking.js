// Utilidad global para crear el borrador y redirigir
(function(){
  function getSearchParams() {
    try {
      const ls = JSON.parse(localStorage.getItem("searchParams") || "{}");
      const checkin  = ls.checkin  || document.querySelector("#checkin")?.value || null;
      const checkout = ls.checkout || document.querySelector("#checkout")?.value || null;
      const guests   = Number(ls.guests || document.querySelector("#guests")?.value) || null;
      return { checkin, checkout, guests };
    } catch {
      return { checkin: null, checkout: null, guests: null };
    }
  }

  window.setBookingDraft = function(room) {
    const { checkin, checkout, guests } = getSearchParams();

    // Adapta nombres entre hotel.js (name/priceNow) y el modal (roomName/price)
    const draft = {
      roomId: room.id,
      roomName: room.name || room.nombre,
      price: room.priceNow ?? room.precio,
      imgs: room.gallery || room.imagenes || (room.image ? [room.image] : []),
      mts2: room.sizeM2 ?? room.metros2,
      createdAt: new Date().toISOString(),
      checkin, checkout, guests,
      source: "habitaciones"
    };

    localStorage.setItem("bookingDraft", JSON.stringify(draft));
    window.location.href = "/reservas.html?step=datos";
  };
})();
