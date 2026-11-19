import api from "./api";

const datos = (promesa) => promesa.then((res) => res.data);

const limpiarParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));

const crud = (ruta) => ({
  listar: () => datos(api.get(ruta)),
  crear: (body) => datos(api.post(ruta, body)),
  editar: (id, body) => datos(api.patch(`${ruta}/${id}`, body)),
  activar: (id) => datos(api.patch(`${ruta}/${id}/activar`)),
  desactivar: (id) => datos(api.patch(`${ruta}/${id}/desactivar`)),
});

export const authApi = {
  registro: (body) => datos(api.post("/auth/registro", body)),
  login: (body) => datos(api.post("/auth/login", body)),
  perfil: () => datos(api.get("/auth/perfil")),
  actualizarPerfil: (body) => datos(api.patch("/auth/perfil", body)),
  logout: () => datos(api.post("/auth/logout")),
};

export const usuariosApi = crud("/usuarios");

export const estadosApi = { listar: () => datos(api.get("/estados")) };
export const ciudadesApi = crud("/ciudades");
export const generosApi = crud("/generos");
export const metodosPagoApi = crud("/metodos-pago");
export const artistasApi = crud("/artistas");
export const recintosApi = crud("/recintos");

export const zonasApi = {
  listar: (recintoId) => datos(api.get(`/recintos/${recintoId}/zonas`)),
  crear: (recintoId, body) => datos(api.post("/zonas", { recintoId, ...body })),
  editar: (id, body) => datos(api.patch(`/zonas/${id}`, body)),
  activar: (id) => datos(api.patch(`/zonas/${id}/activar`)),
  desactivar: (id) => datos(api.patch(`/zonas/${id}/desactivar`)),
  asientos: (id) => datos(api.get(`/zonas/${id}/asientos`)),
};

export const conciertosApi = {
  listar: () => datos(api.get("/conciertos")),
  uno: (id) => datos(api.get(`/conciertos/${id}`)),
  crear: (body) => datos(api.post("/conciertos", body)),
  editar: (id, body) => datos(api.patch(`/conciertos/${id}`, body)),
  cancelar: (id) => datos(api.patch(`/conciertos/${id}/cancelar`)),
  asignarArtistas: (id, artistaIds) => datos(api.put(`/conciertos/${id}/artistas`, { artistaIds })),
  asignarPrecios: (id, precios) => datos(api.put(`/conciertos/${id}/precios`, { precios })),
};

export const carteleraApi = {
  listar: (filtros) => datos(api.get("/cartelera", { params: limpiarParams(filtros) })),
  detalle: (id) => datos(api.get(`/cartelera/${id}`)),
  asientos: (id, zonaId) => datos(api.get(`/cartelera/${id}/zonas/${zonaId}/asientos`)),
};

export const ticketsApi = {
  crear: (conciertoId, asientoIds) => datos(api.post("/tickets", { conciertoId, asientoIds })),
  mios: () => datos(api.get("/tickets/mis")),
  listar: (filtros) => datos(api.get("/tickets", { params: limpiarParams(filtros) })),
  entradasHoy: () => datos(api.get("/tickets/entradas-hoy")),
  cancelar: (id) => datos(api.patch(`/tickets/${id}/cancelar`)),
  porClave: (clave) => datos(api.get(`/tickets/clave/${encodeURIComponent(clave)}`)),
  usar: (id) => datos(api.patch(`/tickets/${id}/usar`)),
};

export const pagosApi = {
  cobrar: (body) => datos(api.post("/pagos", body)),
};

export const pagoEnLineaApi = {
  estado: () => datos(api.get("/pagos/en-linea/estado")),
  checkout: (clave) => datos(api.post("/pagos/en-linea/checkout", { clave })),
  confirmar: (sessionId) => datos(api.post("/pagos/en-linea/confirmar", { sessionId })),
};

export const imagenesApi = {
  subir: (archivo) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return datos(api.post("/imagenes", form));
  },
  reemplazar: (id, archivo) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return datos(api.put(`/imagenes/${id}`, form));
  },
  quitar: (id) => datos(api.delete(`/imagenes/${id}`)),
  archivo: (id) => datos(api.get(`/imagenes/${id}`, { responseType: "blob" })),
};

export const reportesApi = {
  conciertos: (filtros) => datos(api.get("/reportes/conciertos", { params: limpiarParams(filtros) })),
  concierto: (id) => datos(api.get(`/reportes/conciertos/${id}`)),
};