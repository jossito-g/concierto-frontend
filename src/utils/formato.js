export const formatoFecha = (texto) =>
  texto ? new Date(texto).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";

export const formatoDia = (texto) => (texto ? new Date(texto).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "");

export const partesFecha = (texto) => {
  if (!texto) return { dia: "", mes: "" };
  const fecha = new Date(texto);
  return {
    dia: String(fecha.getDate()).padStart(2, "0"),
    mes: fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
  };
};

export const formatoDinero = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const aInputFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dosDigitos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

const traducirMensaje = (texto) => (texto === "correo must be an email" ? "El correo no es válido" : texto);

export const mensajeError = (err) => {
  const msg = err?.response?.data?.message;
  if (err?.response?.status === 404 && typeof msg === "string" && msg.startsWith("Cannot ")) {
    return "Esta sección todavía no está disponible en el servidor";
  }
  if (Array.isArray(msg)) return msg.map(traducirMensaje).join(". ");
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

export const ROLES = [
  { id: 1, nombre: "administrador" },
  { id: 2, nombre: "cliente" },
];

export const nombreRol = (u) =>
  typeof u?.rol === "string" ? u.rol : u?.rol?.nombre ?? u?.rolNombre ?? buscarPorId(ROLES, u?.rolId)?.nombre ?? "";

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

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const MAXIMO_IMAGEN = 2 * 1024 * 1024;

export const validarImagen = (archivo) => {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return "Solo jpg, png o webp";
  if (archivo.size > MAXIMO_IMAGEN) return "La imagen pesa más de 2 MB";
  return "";
};