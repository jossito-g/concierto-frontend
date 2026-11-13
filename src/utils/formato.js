export const formatoFecha = (texto) =>
  texto ? new Date(texto).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";

export const formatoDinero = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const aInputFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dosDigitos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

export const mensajeError = (err) => {
  const msg = err?.response?.data?.message;
  /**Ruta que el back todavia no tiene (ej. "Cannot GET /cartelera")*/
  if (err?.response?.status === 404 && typeof msg === "string" && msg.startsWith("Cannot ")) {
    return "Esta sección todavía no está disponible en el servidor";
  }
  if (Array.isArray(msg)) return msg.join(". ");
  if (msg) return msg;
  if (!err?.response) return "No hay conexión con el servidor";
  return "Ocurrió un error, intenta de nuevo";
};

export const buscarPorId = (lista, id) => lista.find((x) => x.id === Number(id));


export const nombreCiudad = (ciudad, estados = []) => {
  if (!ciudad) return "";
  const estado = ciudad.estado ?? buscarPorId(estados, ciudad.estadoId);
  return estado ? `${ciudad.nombre}, ${estado.nombre}` : ciudad.nombre;
};


export const nombreRol = (u) => (typeof u?.rol === "string" ? u.rol : u?.rol?.nombre ?? u?.rolNombre ?? "");



export const textoAsientos = (ticket) => {
  const detalles = ticket?.detalles ?? ticket?.asientos ?? [];
  return detalles
    .map((d) => {
      const a = d.asiento ?? d;
      const zona = typeof d.zona === "string" ? d.zona : d.zona?.nombre ?? a.zona?.nombre ?? "";
      return `${zona ? zona + " " : ""}${a.fila ?? ""}${a.numero ?? ""}`.trim();
    })
    .join(", ");
};


export const errorImagen = (err) => {
  const status = err?.response?.status;
  if (status === 413) return "La imagen pesa más de 2 MB";
  if (status === 400) return "El archivo no es una imagen válida (solo jpg, png o webp)";
  return mensajeError(err);
};