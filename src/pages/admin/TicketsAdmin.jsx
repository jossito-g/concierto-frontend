import { useState } from "react";
import { ticketsApi } from "../../api/servicios";
import { formatoDinero, formatoFecha, mensajeError, textoAsientos } from "../../utils/formato";

function diaDeEntrada(fecha) {
  if (!fecha) return "hoy";
  const concierto = new Date(fecha);
  const hoy = new Date();
  if (concierto.toDateString() === hoy.toDateString()) return "hoy";
  return concierto > hoy ? "antes" : "paso";
}

export default function TicketsAdmin() {
  const [clave, setClave] = useState("");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  async function buscar(e) {
    e?.preventDefault();
    setTicket(null);
    setAviso("");
    const limpia = clave.trim().toUpperCase();
    if (limpia.length !== 8) return setError("La clave tiene 8 caracteres");
    try {
      setTicket(await ticketsApi.porClave(limpia));
      setError("");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function cancelar() {
    if (!confirm(`¿Cancelar el ticket ${ticket.clave}? Los asientos se liberan.`)) return;
    try {
      await ticketsApi.cancelar(ticket.id);
      setTicket(await ticketsApi.porClave(ticket.clave));
      setError("");
      setAviso("Ticket cancelado");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function darEntrada() {
    if (!confirm(`¿Dar entrada con el ticket ${ticket.clave}? Ya no se podrá volver a usar.`)) return;
    try {
      setTicket(await ticketsApi.usar(ticket.id));
      setError("");
      setAviso("Entrada registrada");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <h1>Tickets</h1>
      <form onSubmit={buscar} className="tarjeta en-linea">
        <input placeholder="Clave del ticket" value={clave} maxLength={8} onChange={(e) => setClave(e.target.value)} className="clave" />
        <button type="submit">Buscar</button>
      </form>

      {error && <p className="error">{error}</p>}
      {aviso && !error && <p className="exito">✅ {aviso}</p>}

      {ticket && (
        <div className="tarjeta">
          <h3>{ticket.concierto?.nombre ?? `Concierto #${ticket.conciertoId}`}</h3>
          <p>Clave: <b className="clave">{ticket.clave}</b> <span className={`estado ${ticket.estado}`}>{ticket.estado}</span></p>
          {ticket.usuario && <p>Cliente: {ticket.usuario.nombre} {ticket.usuario.apellido}</p>}
          <p className="nota">{formatoFecha(ticket.concierto?.fecha)} · {ticket.concierto?.recinto?.nombre}</p>
          {textoAsientos(ticket) && <p>Asientos: {textoAsientos(ticket)}</p>}
          <p>Total: {formatoDinero(ticket.total)}</p>
          <p className="nota">Apartado: {formatoFecha(ticket.creadoEn)} · Fecha límite: {formatoFecha(ticket.fechaLimite)}</p>
          {ticket.usadoEn && <p className="nota">Entró al concierto: {formatoFecha(ticket.usadoEn)}</p>}
          {ticket.estado === "pagado" && diaDeEntrada(ticket.concierto?.fecha) === "hoy" && <button onClick={darEntrada}>Dar entrada</button>}
          {ticket.estado === "pagado" && diaDeEntrada(ticket.concierto?.fecha) === "antes" && (
            <p className="nota">La entrada se registra el día del concierto ({formatoFecha(ticket.concierto?.fecha)}).</p>
          )}
          {ticket.estado === "pagado" && diaDeEntrada(ticket.concierto?.fecha) === "paso" && (
            <p className="nota">El concierto ya pasó, este ticket ya no se puede usar.</p>
          )}
          {ticket.estado === "pendiente" && <button className="peligro" onClick={cancelar}>Cancelar ticket</button>}
        </div>
      )}
    </div>
  );
}