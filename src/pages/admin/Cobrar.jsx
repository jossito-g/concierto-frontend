import { useEffect, useState } from "react";
import { ticketsApi, pagosApi, metodosPagoApi } from "../../api/servicios";
import { formatoDinero, formatoFecha, mensajeError, textoAsientos } from "../../utils/formato";

export default function Cobrar() {
  const [clave, setClave] = useState("");
  const [ticket, setTicket] = useState(null);
  const [metodos, setMetodos] = useState([]);
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [error, setError] = useState("");
  const [pago, setPago] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    metodosPagoApi
      .listar()
      .then((lista) => {
        const activos = lista.filter((m) => m.activo);
        setMetodos(activos);
        if (activos[0]) setMetodoPagoId(String(activos[0].id));
      })
      .catch((err) => setError(mensajeError(err)));
  }, []);

  async function buscar(e) {
    e.preventDefault();
    setPago(null);
    setTicket(null);
    const limpia = clave.trim().toUpperCase();
    if (limpia.length !== 8) return setError("La clave tiene 8 caracteres");
    try {
      setTicket(await ticketsApi.porClave(limpia));
      setMontoRecibido("");
      setError("");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const totalCentavos = ticket ? Math.round(Number(ticket.total) * 100) : 0;
  const recibidoCentavos = Math.round(Number(montoRecibido || 0) * 100);
  const cambio = (recibidoCentavos - totalCentavos) / 100;

  async function cobrar() {
    if (!(recibidoCentavos > 0)) return setError("Escribe el monto recibido");
    if (recibidoCentavos < totalCentavos) return setError("El monto recibido es menor al total");
    if (recibidoCentavos > 100000000) return setError("El monto recibido no puede pasar de $1,000,000");
    if (!metodoPagoId) return setError("Elige el método de pago");
    setEnviando(true);
    try {
      const resultado = await pagosApi.cobrar({
        clave: ticket.clave,
        metodoPagoId: Number(metodoPagoId),
        montoRecibido: recibidoCentavos / 100,
      });
      setPago(resultado);
      setTicket({ ...ticket, estado: "pagado" });
      setError("");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Cobrar ticket</h1>
      <form onSubmit={buscar} className="tarjeta en-linea">
        <input placeholder="Clave del ticket" value={clave} maxLength={8} onChange={(e) => setClave(e.target.value)} className="clave" />
        <button type="submit">Buscar</button>
      </form>

      {error && <p className="error">{error}</p>}

      {ticket && (
        <div className="tarjeta">
          <h3>{ticket.concierto?.nombre ?? `Concierto #${ticket.conciertoId}`}</h3>
          <p>Clave: <b className="clave">{ticket.clave}</b> <span className={`estado ${ticket.estado}`}>{ticket.estado}</span></p>
          {ticket.usuario && <p>Cliente: {ticket.usuario.nombre} {ticket.usuario.apellido}</p>}
          {textoAsientos(ticket) && <p>Asientos: {textoAsientos(ticket)}</p>}
          <p>Fecha límite: {formatoFecha(ticket.fechaLimite)}</p>
          <p className="total">Total: {formatoDinero(ticket.total)}</p>

          {ticket.estado === "pendiente" && (
            <>
              <div className="en-linea">
                <select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)}>
                  {metodos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Monto recibido" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} />
              </div>
              {montoRecibido && recibidoCentavos >= totalCentavos && <p>Cambio: <b>{formatoDinero(cambio)}</b></p>}
              <button onClick={cobrar} disabled={enviando}>{enviando ? "Cobrando..." : "Cobrar"}</button>
            </>
          )}

          {!pago && ticket.estado !== "pendiente" && (
            <p className="nota">
              {ticket.estado === "pagado" || ticket.estado === "usado" ? "Este ticket ya está pagado." : "Este ticket ya no se puede cobrar."}
            </p>
          )}
          {pago && <p className="exito">✅ Cobrado. Entrega {formatoDinero(pago.cambio ?? cambio)} de cambio.</p>}
        </div>
      )}
    </div>
  );
}