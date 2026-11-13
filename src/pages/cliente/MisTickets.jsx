import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ticketsApi, estadosApi } from "../../api/servicios";
import { formatoFecha, formatoDinero, mensajeError, nombreCiudad } from "../../utils/formato";

const MAXIMO_PENDIENTES = 3;

export default function MisTickets() {
  const { state } = useLocation();
  const nuevoId = state?.nuevoId;
  const [tickets, setTickets] = useState(null);
  const [estados, setEstados] = useState([]);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    estadosApi.listar().then(setEstados).catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    ticketsApi.mios().then(setTickets).catch((err) => setError(mensajeError(err)));
  }, [recarga]);

  async function cancelar(t) {
    if (!confirm(`¿Cancelar el ticket ${t.clave}? Los asientos se liberan.`)) return;
    try {
      await ticketsApi.cancelar(t.id);
      setError("");
      setRecarga((r) => r + 1);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const pendientes = tickets?.filter((t) => t.estado === "pendiente").length ?? 0;

  return (
    <div>
      <h1>Mis tickets</h1>
      {nuevoId && <p className="exito">✅ Asientos apartados. Paga en taquilla con la clave de tu ficha.</p>}
      {error && <p className="error">{error}</p>}
      {!tickets && !error && <p className="nota">Cargando...</p>}
      {tickets && <p className="nota">Tickets pendientes: {pendientes} de {MAXIMO_PENDIENTES}.</p>}
      {tickets?.length === 0 && (
        <p>
          Todavía no tienes tickets. <Link to="/cartelera">Ve a la cartelera</Link>
        </p>
      )}

      {tickets?.map((t) =>
        t.estado === "pendiente" ? (
          <Ficha key={t.id} ticket={t} estados={estados} nuevo={t.id === nuevoId} onCancelar={() => cancelar(t)} />
        ) : (
          <div key={t.id} className="tarjeta">
            <h3>{t.concierto?.nombre ?? `Concierto #${t.conciertoId}`}</h3>
            <p>
              Clave: <b className="clave">{t.clave}</b> <span className={`estado ${t.estado}`}>{t.estado}</span>
            </p>
            <p className="nota">{formatoFecha(t.concierto?.fecha)} · {t.concierto?.recinto?.nombre}</p>
            <p>Asientos: {(t.asientos ?? []).map((a) => `${a.zona} ${a.fila}${a.numero}`).join(", ")}</p>
            <p>Total: {formatoDinero(t.total)}</p>
            {t.usadoEn && <p className="nota">Entraste al concierto: {formatoFecha(t.usadoEn)}</p>}
          </div>
        )
      )}
    </div>
  );
}

function Ficha({ ticket, estados, nuevo, onCancelar }) {
  const c = ticket.concierto;
  const recinto = c?.recinto;
  return (
    <div className={`tarjeta ficha ${nuevo ? "ficha-nueva" : ""}`}>
      <div className="ficha-encabezado">
        <span>FICHA DE PAGO</span>
        <span className="estado pendiente">pendiente</span>
      </div>

      <h3>{c?.nombre}</h3>
      <p className="nota">
        📅 {formatoFecha(c?.fecha)}
        {recinto && <> · 📍 {recinto.nombre}, {nombreCiudad(recinto.ciudad, estados)}</>}
      </p>

      <p className="nota">Clave de pago</p>
      <p className="ficha-clave">{ticket.clave}</p>

      <table>
        <thead><tr><th>Zona</th><th>Asiento</th><th>Precio</th></tr></thead>
        <tbody>
          {(ticket.asientos ?? []).map((a) => (
            <tr key={a.asientoId}>
              <td>{a.zona}</td>
              <td>{a.fila}{a.numero}</td>
              <td>{formatoDinero(a.precio)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total">Total a pagar: {formatoDinero(ticket.total)}</p>
      <p>
        ⏰ Paga en efectivo en taquilla antes de: <b>{formatoFecha(ticket.fechaLimite)}</b>
      </p>
      <p className="nota">Si no pagas a tiempo, el ticket vence y los asientos se liberan.</p>

      <button className="secundario" onClick={() => window.print()}>Imprimir</button>
      <button className="peligro" onClick={onCancelar}>Cancelar ticket</button>
    </div>
  );
}