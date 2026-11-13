import { useEffect, useState } from "react";
import { authApi, ticketsApi } from "../api/servicios";
import { mensajeError, nombreRol } from "../utils/formato";

function iniciales(p) {
  return `${p.nombre?.[0] ?? ""}${p.apellido?.[0] ?? ""}`.toUpperCase();
}

function fechaCorta(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi
      .perfil()
      .then((p) => {
        setPerfil(p);
        if (nombreRol(p) === "cliente") {
          ticketsApi.mios().then(setTickets).catch(() => setTickets([]));
        }
      })
      .catch((err) => setError(mensajeError(err)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!perfil) return <p className="nota">Cargando...</p>;

  const rol = nombreRol(perfil);
  const contar = (estado) => (tickets ?? []).filter((t) => t.estado === estado).length;

  return (
    <div className="perfil">
      <div className="tarjeta perfil-encabezado">
        <div className="perfil-avatar">{iniciales(perfil)}</div>
        <div>
          <h1>{perfil.nombre} {perfil.apellido}</h1>
          <span className={`perfil-rol ${rol}`}>{rol === "administrador" ? "Administrador" : "Cliente"}</span>
        </div>
      </div>

      <div className="tarjeta">
        <h3>Mis datos</h3>
        <dl className="perfil-datos">
          <div>
            <dt>Correo</dt>
            <dd>{perfil.correo}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{perfil.telefono || "Sin teléfono"}</dd>
          </div>
          <div>
            <dt>Miembro desde</dt>
            <dd>{fechaCorta(perfil.creadoEn)}</dd>
          </div>
          <div>
            <dt>Cuenta</dt>
            <dd>{perfil.activo === false ? "Desactivada" : "Activa"}</dd>
          </div>
        </dl>
      </div>

      {rol === "cliente" && (
        <div className="tarjeta">
          <h3>Mis tickets</h3>
          {!tickets ? (
            <p className="nota">Cargando...</p>
          ) : (
            <div className="perfil-numeros">
              <div>
                <b>{contar("pendiente")}</b>
                <span>Por pagar</span>
              </div>
              <div>
                <b>{contar("pagado") + contar("usado")}</b>
                <span>Pagados</span>
              </div>
              <div>
                <b>{contar("cancelado") + contar("vencido")}</b>
                <span>Cancelados o vencidos</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
