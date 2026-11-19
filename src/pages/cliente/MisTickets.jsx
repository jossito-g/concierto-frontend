import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ticketsApi, estadosApi, pagoEnLineaApi } from "../../api/servicios";
import { useDialogos } from "../../context/DialogosContext";
import { formatoFecha, formatoDinero, mensajeError, nombreCiudad } from "../../utils/formato";
import EncabezadoPagina from "../../components/EncabezadoPagina";
import Exito from "../../components/Exito";
import DatosPago, { Dato } from "../../components/DatosPago";
import { IconoCalendario, IconoLugar, IconoReloj, IconoTarjeta } from "../../components/Iconos";

const MAXIMO_PENDIENTES = 3;

const ORDEN_ESTADO = { pendiente: 0, pagado: 1, usado: 2, vencido: 3, cancelado: 4 };
const ordenar = (lista) =>
  [...lista].sort((a, b) => (ORDEN_ESTADO[a.estado] ?? 9) - (ORDEN_ESTADO[b.estado] ?? 9) || b.id - a.id);

export default function MisTickets() {
  const { state } = useLocation();
  const { confirmar } = useDialogos();
  const nuevoId = state?.nuevoId;
  const [tickets, setTickets] = useState(null);
  const [estados, setEstados] = useState([]);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");
  const [conTarjeta, setConTarjeta] = useState(false);
  const [pagandoId, setPagandoId] = useState(null);

  useEffect(() => {
    estadosApi.listar().then(setEstados).catch(() => setEstados([]));
    pagoEnLineaApi.estado().then((r) => setConTarjeta(Boolean(r?.disponible))).catch(() => setConTarjeta(false));
  }, []);

  useEffect(() => {
    ticketsApi.mios().then(setTickets).catch((err) => setError(mensajeError(err)));
  }, [recarga]);

  useEffect(() => {
    const alMostrar = (e) => {
      if (e.persisted) setPagandoId(null);
    };
    window.addEventListener("pageshow", alMostrar);
    return () => window.removeEventListener("pageshow", alMostrar);
  }, []);

  async function cancelar(t) {
    const seguro = await confirmar({
      titulo: "Cancelar ticket",
      mensaje: `¿Cancelar el ticket ${t.clave}? Los asientos se liberan.`,
      confirmar: "Sí, cancelar ticket",
      cancelar: "No, conservarlo",
      peligro: true,
    });
    if (!seguro) return;
    try {
      await ticketsApi.cancelar(t.id);
      setError("");
      setRecarga((r) => r + 1);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function pagarConTarjeta(t) {
    setPagandoId(t.id);
    setError("");
    try {
      const { url } = await pagoEnLineaApi.checkout(t.clave);
      window.location.assign(url);
    } catch (err) {
      setError(mensajeError(err));
      setPagandoId(null);
      setRecarga((r) => r + 1);
    }
  }

  const pendientes = tickets?.filter((t) => t.estado === "pendiente").length ?? 0;

  return (
    <div>
      <EncabezadoPagina titulo="Mis tickets">
        {tickets && (
          <p className="pagina-texto">
            Tickets pendientes: <span className="mono">{pendientes} de {MAXIMO_PENDIENTES}</span>
          </p>
        )}
      </EncabezadoPagina>

      {nuevoId && (
        <Exito>
          Asientos apartados. {conTarjeta ? "Paga con tarjeta aquí mismo o en taquilla con la clave de tu ficha." : "Paga en taquilla con la clave de tu ficha."}
        </Exito>
      )}
      {error && <p className="error">{error}</p>}
      {!tickets && !error && <p className="nota">Cargando...</p>}
      {tickets?.length === 0 && (
        <p>
          Todavía no tienes tickets. <Link to="/cartelera">Ve a la cartelera</Link>
        </p>
      )}

      <div className="boletos">
        {tickets && ordenar(tickets).map((t) => (
          <Boleto
            key={t.id}
            ticket={t}
            estados={estados}
            nuevo={t.id === nuevoId}
            conTarjeta={conTarjeta}
            pagando={pagandoId === t.id}
            ocupado={pagandoId !== null}
            onPagar={() => pagarConTarjeta(t)}
            onCancelar={() => cancelar(t)}
          />
        ))}
      </div>
    </div>
  );
}

const ETIQUETA_CLAVE = { pendiente: "Clave de pago", pagado: "Clave de entrada", usado: "Clave de entrada" };

const AYUDA = {
  pagado: "Da esta clave en la entrada del concierto.",
  usado: "Este ticket ya se usó.",
  cancelado: "Ticket cancelado. Los asientos se liberaron.",
  vencido: "Este ticket venció. Los asientos se liberaron.",
};

function imprimir(e) {
  const boleto = e.currentTarget.closest(".boleto");
  boleto.classList.add("imprimiendo");
  window.addEventListener("afterprint", () => boleto.classList.remove("imprimiendo"), { once: true });
  window.print();
}

function Boleto({ ticket, estados, nuevo, conTarjeta, pagando, ocupado, onPagar, onCancelar }) {
  const c = ticket.concierto;
  const recinto = c?.recinto;
  const pendiente = ticket.estado === "pendiente";
  const asientos = ticket.asientos ?? [];

  return (
    <article className={`boleto ${ticket.estado}${pendiente ? " ficha" : ""}${nuevo ? " ficha-nueva" : ""}`}>
      <div className="boleto-principal">
        <div className="boleto-estado">
          <span className={`estado ${ticket.estado}`}>{ticket.estado}</span>
          {pendiente && <span className="boleto-etiqueta">Ficha de pago</span>}
        </div>

        <h2>{c?.nombre ?? `Concierto #${ticket.conciertoId}`}</h2>

        <div className="datos">
          <p className="dato">
            <IconoCalendario />
            <span className="mono">{formatoFecha(c?.fecha)}</span>
          </p>
          {recinto && (
            <p className="dato">
              <IconoLugar />
              <span>{recinto.nombre}, {nombreCiudad(recinto.ciudad, estados)}</span>
            </p>
          )}
        </div>

        {pendiente ? (
          <table>
            <thead><tr><th>Zona</th><th>Asiento</th><th>Precio</th></tr></thead>
            <tbody>
              {asientos.map((a) => (
                <tr key={a.asientoId}>
                  <td>{a.zona}</td>
                  <td>{a.fila}{a.numero}</td>
                  <td>{formatoDinero(a.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="boleto-asientos">
            <span className="boleto-etiqueta">Asientos</span>
            {asientos.map((a) => (
              <span key={a.asientoId} className="asiento-chip">{a.zona} {a.fila}{a.numero}</span>
            ))}
          </div>
        )}

        {pendiente && (
          <div className="boleto-aviso">
            <IconoReloj tam={18} />
            <div>
              <p className="aviso-principal">
                {conTarjeta ? "Paga con tarjeta o en efectivo en taquilla" : "Paga en efectivo en taquilla"} antes del{" "}
                <span className="mono">{formatoFecha(ticket.fechaLimite)}</span>
              </p>
              <p className="aviso-detalle">Si no pagas a tiempo, el ticket vence y los asientos se liberan.</p>
            </div>
          </div>
        )}

        <DatosPago pago={ticket.pago}>
          {ticket.usadoEn && <Dato titulo="Entraste el">{formatoFecha(ticket.usadoEn)}</Dato>}
        </DatosPago>
      </div>

      <div className="boleto-talon">
        <div className="boleto-campo">
          <p className="boleto-etiqueta">{ETIQUETA_CLAVE[ticket.estado] ?? "Clave"}</p>
          <p className="boleto-clave">{ticket.clave}</p>
        </div>
        <div className="boleto-campo">
          <p className="boleto-etiqueta">{pendiente ? "Total a pagar" : "Total"}</p>
          <p className="boleto-total">{formatoDinero(ticket.total)}</p>
        </div>

        {pendiente ? (
          <div className="boleto-acciones">
            {conTarjeta && (
              <button type="button" className="boton-pagar" onClick={onPagar} disabled={ocupado}>
                <IconoTarjeta tam={20} />
                <span>{pagando ? "Abriendo pago..." : "Pagar con tarjeta"}</span>
              </button>
            )}
            <button type="button" className="secundario" onClick={imprimir} disabled={ocupado}>Imprimir</button>
            <button type="button" className="enlace-peligro" onClick={onCancelar} disabled={ocupado}>Cancelar ticket</button>
          </div>
        ) : (
          <p className="boleto-ayuda">{AYUDA[ticket.estado]}</p>
        )}
      </div>
    </article>
  );
}