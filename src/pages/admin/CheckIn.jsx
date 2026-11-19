import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "../../api/servicios";
import { formatoFecha, mensajeError, textoAsientos } from "../../utils/formato";

const LARGO_CLAVE = 8;

const limpiarClave = (texto) => texto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LARGO_CLAVE);

const horaCorta = (fecha) => new Date(fecha).toLocaleTimeString("es-MX", { timeStyle: "short" });

const nombreCliente = (ticket) => (ticket.usuario ? `${ticket.usuario.nombre} ${ticket.usuario.apellido}` : "");

function diaDelConcierto(fecha) {
  if (!fecha) return "hoy";
  const concierto = new Date(fecha);
  const ahora = new Date();
  if (concierto.toDateString() === ahora.toDateString()) return "hoy";
  return concierto > ahora ? "antes" : "paso";
}

function textoPersonas(ticket) {
  const cantidad = (ticket.asientos ?? ticket.detalles ?? []).length;
  if (!cantidad) return "";
  return `${cantidad} ${cantidad === 1 ? "persona" : "personas"}`;
}

function veredicto(ticket) {
  const concierto = ticket.concierto;
  if (concierto?.estado === "cancelado") {
    return { tono: "mal", titulo: "Concierto cancelado", detalle: "Este concierto ya no se va a realizar." };
  }
  switch (ticket.estado) {
    case "pagado": {
      const dia = diaDelConcierto(concierto?.fecha);
      if (dia === "hoy") {
        return { tono: "ok", titulo: "Puede entrar", detalle: textoPersonas(ticket), puedeEntrar: true };
      }
      if (dia === "antes") {
        return { tono: "aviso", titulo: "Aún no es el día", detalle: `La entrada se registra el día del concierto (${formatoFecha(concierto.fecha)}).` };
      }
      return { tono: "mal", titulo: "El concierto ya pasó", detalle: `Este ticket ya no se puede usar: el concierto fue el ${formatoFecha(concierto.fecha)}` };
    }
    case "usado":
      return {
        tono: "mal",
        titulo: "Ya fue usado",
        detalle: ticket.usadoEn ? `Entró el ${formatoFecha(ticket.usadoEn)}` : "Este ticket ya se usó para entrar.",
      };
    case "pendiente":
      return { tono: "aviso", titulo: "Sin pagar", detalle: "Todavía no se paga. Cóbralo primero para que pueda entrar.", cobrar: true };
    case "cancelado":
      return { tono: "mal", titulo: "Ticket cancelado", detalle: "Este ticket se canceló, no vale para entrar." };
    case "vencido":
      return { tono: "mal", titulo: "Ticket vencido", detalle: "No se pagó a tiempo, no vale para entrar." };
    default:
      return { tono: "mal", titulo: "Ticket no válido", detalle: `Estado del ticket: ${ticket.estado}.` };
  }
}

function veredictoRegistrado(ticket) {
  const detalle = [textoPersonas(ticket), ticket.usadoEn ? horaCorta(ticket.usadoEn) : ""].filter(Boolean).join(" · ");
  return { tono: "ok", titulo: "Entrada registrada", detalle };
}

function Icono({ tono }) {
  const trazo = { ok: "M7 12.5l3.5 3.5L17 9", aviso: "M12 7.5v5.5M12 16.5v.5", mal: "M8.5 8.5l7 7M15.5 8.5l-7 7" }[tono];
  return (
    <svg className="checkin-icono" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" />
      <path d={trazo} />
    </svg>
  );
}

function Resultado({ datos, enviando, botonEntrada, onEntrada, onLimpiar }) {
  const { ticket, veredicto: v, registrado } = datos;
  const concierto = ticket.concierto;
  const lugar = concierto?.recinto?.nombre;
  return (
    <section className={`checkin-resultado ${v.tono}`}>
      <div className="checkin-banner">
        <Icono tono={v.tono} />
        <div>
          <p className="checkin-titulo">{v.titulo}</p>
          {v.detalle && <p className="checkin-detalle">{v.detalle}</p>}
        </div>
      </div>

      <dl className="checkin-datos">
        <div>
          <dt>Concierto</dt>
          <dd>{concierto?.nombre ?? `Concierto #${ticket.conciertoId}`}</dd>
        </div>
        <div>
          <dt>Fecha y lugar</dt>
          <dd>
            {formatoFecha(concierto?.fecha) || "—"}
            {lugar && <span className="checkin-sub">{lugar}</span>}
          </dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>{nombreCliente(ticket) || "—"}</dd>
        </div>
        <div>
          <dt>Asientos</dt>
          <dd>{textoAsientos(ticket) || "—"}</dd>
        </div>
        <div>
          <dt>Clave</dt>
          <dd>
            <b className="clave">{ticket.clave}</b> <span className={`estado ${ticket.estado}`}>{ticket.estado}</span>
          </dd>
        </div>
      </dl>

      {(v.puedeEntrar || v.cobrar) && !registrado && (
        <div className="checkin-acciones">
          {v.puedeEntrar && (
            <>
              <button type="button" ref={botonEntrada} className="checkin-entrada" onClick={onEntrada} disabled={enviando}>
                {enviando ? "Registrando..." : "Dar entrada"}
              </button>
              <button type="button" className="secundario" onClick={onLimpiar} disabled={enviando}>Limpiar</button>
            </>
          )}
          {v.cobrar && <Link className="boton secundario" to="/admin/cobrar">Ir a Cobrar</Link>}
        </div>
      )}
    </section>
  );
}

export default function CheckIn() {
  const [clave, setClave] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [entradas, setEntradas] = useState([]);
  const campo = useRef(null);
  const botonEntrada = useRef(null);
  const peticion = useRef(0);

  useEffect(() => {
    if (resultado?.veredicto.puedeEntrar && !resultado.registrado) botonEntrada.current?.focus();
  }, [resultado]);

  async function buscar(texto) {
    const limpia = limpiarClave(texto);
    if (limpia.length !== LARGO_CLAVE) {
      setResultado(null);
      setError(`La clave tiene ${LARGO_CLAVE} caracteres`);
      campo.current?.focus();
      return;
    }
    const numero = ++peticion.current;
    setBuscando(true);
    try {
      const ticket = await ticketsApi.porClave(limpia);
      if (numero !== peticion.current) return;
      const decision = veredicto(ticket);
      setError("");
      setResultado({ ticket, veredicto: decision, registrado: false });
      if (!decision.puedeEntrar) {
        campo.current?.focus();
        campo.current?.select();
      }
    } catch (err) {
      if (numero !== peticion.current) return;
      setResultado(null);
      setError(mensajeError(err));
      campo.current?.focus();
      campo.current?.select();
    } finally {
      if (numero === peticion.current) setBuscando(false);
    }
  }

  function enviar(e) {
    e.preventDefault();
    buscar(clave);
  }

  function cambiar(e) {
    const limpia = limpiarClave(e.target.value);
    peticion.current++;
    setClave(limpia);
    setError("");
    setResultado(null);
    setBuscando(false);
    if (limpia.length === LARGO_CLAVE) buscar(limpia);
  }

  const limpiar = useCallback(() => {
    peticion.current++;
    setClave("");
    setError("");
    setResultado(null);
    setBuscando(false);
    campo.current?.focus();
  }, []);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") limpiar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [limpiar]);

  async function darEntrada() {
    if (enviando || !resultado) return;
    const { ticket } = resultado;
    setEnviando(true);
    try {
      const actualizado = await ticketsApi.usar(ticket.id);
      setResultado({ ticket: actualizado, veredicto: veredictoRegistrado(actualizado), registrado: true });
      setEntradas((lista) => [
        {
          id: actualizado.id,
          clave: actualizado.clave,
          hora: actualizado.usadoEn ?? new Date().toISOString(),
          cliente: nombreCliente(actualizado),
          asientos: textoAsientos(actualizado),
        },
        ...lista,
      ]);
      setClave("");
      setError("");
      campo.current?.focus();
    } catch (err) {
      setError(mensajeError(err));
      try {
        const vigente = await ticketsApi.porClave(ticket.clave);
        const decision = veredicto(vigente);
        setResultado({ ticket: vigente, veredicto: decision, registrado: false });
        if (!decision.puedeEntrar) {
          campo.current?.focus();
          campo.current?.select();
        }
      } catch {
        campo.current?.focus();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="checkin">
      <div className="checkin-cabecera">
        <h1>Check-in</h1>
        <p className="nota">Escribe o pega la clave del ticket. Se revisa sola al completar los {LARGO_CLAVE} caracteres.</p>
      </div>

      <div className="checkin-principal">
        <form onSubmit={enviar} className="checkin-busqueda">
          <input
            ref={campo}
            className="clave checkin-clave"
            value={clave}
            onChange={cambiar}
            onFocus={(e) => e.target.select()}
            placeholder="Clave del ticket"
            aria-label="Clave del ticket"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button type="submit" disabled={buscando}>{buscando ? "Buscando..." : "Buscar"}</button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}

        <div aria-live="polite">
          {resultado && (
            <Resultado
              datos={resultado}
              enviando={enviando}
              botonEntrada={botonEntrada}
              onEntrada={darEntrada}
              onLimpiar={limpiar}
            />
          )}
        </div>
      </div>

      <aside className="tarjeta checkin-lateral">
        <h3>Últimas entradas</h3>
        <p className="nota">
          {entradas.length === 0
            ? "Aquí aparecen las entradas que registres en esta pantalla."
            : `Registradas en esta pantalla: ${entradas.length}`}
        </p>
        {entradas.length > 0 && (
          <ul className="checkin-lista">
            {entradas.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="hora">{horaCorta(e.hora)}</span>
                <b className="clave">{e.clave}</b>
                <span className="quien">{[e.cliente, e.asientos].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}