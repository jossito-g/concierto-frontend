import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { pagoEnLineaApi } from "../../api/servicios";
import { formatoDinero, formatoFecha, mensajeError, textoAsientos } from "../../utils/formato";

export default function PagoExito() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [pago, setPago] = useState(null);
  const [error, setError] = useState(sessionId ? "" : "No llegó la información del pago.");
  const enviado = useRef(false);

  useEffect(() => {
    if (!sessionId || enviado.current) return;
    enviado.current = true;
    pagoEnLineaApi
      .confirmar(sessionId)
      .then(setPago)
      .catch((err) => setError(mensajeError(err)));
  }, [sessionId]);

  if (error) {
    return (
      <div className="tarjeta pago-resultado">
        <h1>No se pudo confirmar el pago</h1>
        <p className="error">{error}</p>
        <Link to="/mis-tickets" className="boton">Volver a mis tickets</Link>
      </div>
    );
  }

  if (!pago) {
    return (
      <div className="tarjeta pago-resultado">
        <h1>Confirmando tu pago...</h1>
        <p className="nota">No cierres esta página.</p>
      </div>
    );
  }

  const ticket = pago.ticket;
  return (
    <div className="tarjeta pago-resultado">
      <p className="pago-icono">✅</p>
      <h1>¡Pago aprobado!</h1>
      <p className="nota">Tu ticket ya está pagado. Preséntalo con su clave el día del concierto.</p>
      {ticket && (
        <>
          <h3>{ticket.concierto?.nombre}</h3>
          <p className="ficha-clave">{ticket.clave}</p>
          {textoAsientos(ticket) && <p>Asientos: {textoAsientos(ticket)}</p>}
          <p className="nota">{formatoFecha(ticket.concierto?.fecha)} · {ticket.concierto?.recinto?.nombre}</p>
        </>
      )}
      <p className="total">Pagado: {formatoDinero(pago.montoRecibido ?? ticket?.total)}</p>
      {pago.referencia && <p className="nota">Referencia: <span className="clave">{pago.referencia}</span></p>}
      <Link to="/mis-tickets" className="boton">Ver mis tickets</Link>
    </div>
  );
}