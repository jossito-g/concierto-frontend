import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { conciertosApi, ticketsApi } from "../../api/servicios";
import { useDialogos } from "../../context/DialogosContext";
import { formatoDia, formatoDinero, formatoFecha, mensajeError } from "../../utils/formato";
import EncabezadoPagina from "../../components/EncabezadoPagina";
import Exito from "../../components/Exito";
import DatosPago, { Dato } from "../../components/DatosPago";
import { IconoCalendario, IconoCerrar, IconoLugar } from "../../components/Iconos";

const LARGO_CLAVE = 8;

const FILTROS_ESTADO = [
  { valor: "", nombre: "Todos" },
  { valor: "pendiente", nombre: "Pendientes" },
  { valor: "pagado", nombre: "Pagados" },
  { valor: "usado", nombre: "Usados" },
  { valor: "cancelado", nombre: "Cancelados" },
  { valor: "vencido", nombre: "Vencidos" },
];

const SIN_FILTROS = { estado: "", conciertoId: "", pagina: 1 };

function diaDeEntrada(fecha) {
  if (!fecha) return "hoy";
  const concierto = new Date(fecha);
  const hoy = new Date();
  if (concierto.toDateString() === hoy.toDateString()) return "hoy";
  return concierto > hoy ? "antes" : "paso";
}

const nombreCliente = (ticket) => (ticket.usuario ? `${ticket.usuario.nombre} ${ticket.usuario.apellido}`.trim() : "");

function textoSinPago(ticket) {
  if (ticket.estado === "pendiente") return `Todavía no se paga. Fecha límite: ${formatoFecha(ticket.fechaLimite)}`;
  if (ticket.estado === "cancelado") return "Se canceló sin pagarse.";
  if (ticket.estado === "vencido") return "No se pagó a tiempo.";
  return "No hay datos del pago.";
}

function PanelTicket({ ticket, aviso, error, trabajando, onCerrar, onCancelar, onEntrada }) {
  const id = useId();
  const dialogo = useRef(null);
  const botonCerrar = useRef(null);

  useEffect(() => {
    const ventana = dialogo.current;
    const anterior = document.activeElement;
    if (!ventana.open) ventana.showModal();
    return () => {
      ventana.close();
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);

  useEffect(() => {
    if (aviso) botonCerrar.current?.focus();
  }, [aviso]);

  function mantenerFoco(e) {
    if (e.key !== "Tab") return;
    const items = Array.from(dialogo.current.querySelectorAll("button:not(:disabled), a[href]"));
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  const concierto = ticket.concierto;
  const recinto = concierto?.recinto;
  const asientos = ticket.asientos ?? [];
  const dia = diaDeEntrada(concierto?.fecha);

  return (
    <dialog
      ref={dialogo}
      className="panel-ticket"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        if (e.target === dialogo.current) onCerrar();
      }}
      onKeyDown={mantenerFoco}
    >
      <header className="panel-cabecera">
        <div id={`${id}-titulo`}>
          <p className="panel-etiqueta">Ticket</p>
          <h2>{ticket.clave}</h2>
        </div>
        <span className={`estado ${ticket.estado}`}>{ticket.estado}</span>
        <button type="button" ref={botonCerrar} className="secundario panel-cerrar" aria-label="Cerrar" onClick={onCerrar}>
          <IconoCerrar tam={20} />
        </button>
      </header>

      <div className="panel-contenido">
        {error && <p className="error" role="alert">{error}</p>}
        {aviso && !error && <Exito>{aviso}</Exito>}

        <section>
          <h3 className="panel-subtitulo">Concierto</h3>
          <p className="panel-nombre">{concierto?.nombre ?? `Concierto #${ticket.conciertoId}`}</p>
          <div className="datos">
            <p className="dato">
              <IconoCalendario />
              <span className="mono">{formatoFecha(concierto?.fecha)}</span>
            </p>
            {recinto && (
              <p className="dato">
                <IconoLugar />
                <span>{recinto.nombre}{recinto.ciudad ? `, ${recinto.ciudad.nombre}` : ""}</span>
              </p>
            )}
          </div>
        </section>

        <section>
          <h3 className="panel-subtitulo">Cliente</h3>
          <p className="panel-valor">{nombreCliente(ticket) || "—"}</p>
          {ticket.usuario?.correo && <p className="nota">{ticket.usuario.correo}</p>}
        </section>

        <section>
          <h3 className="panel-subtitulo">Asientos ({asientos.length})</h3>
          {asientos.length === 0 ? (
            <p className="nota">—</p>
          ) : (
            <div className="panel-asientos">
              {asientos.map((a) => (
                <span key={a.asientoId} className="asiento-chip">{a.zona} {a.fila}{a.numero}</span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="panel-subtitulo">Pago</h3>
          {ticket.pago ? <DatosPago pago={ticket.pago} detallado /> : <p className="panel-valor">{textoSinPago(ticket)}</p>}
        </section>

        <section>
          <h3 className="panel-subtitulo">Fechas</h3>
          <dl className="datos-lista">
            <Dato titulo="Apartado el">{formatoFecha(ticket.creadoEn)}</Dato>
            {ticket.usadoEn && <Dato titulo="Entró el">{formatoFecha(ticket.usadoEn)}</Dato>}
          </dl>
          {ticket.estado === "pagado" && dia === "antes" && (
            <p className="nota">La entrada se registra el día del concierto ({formatoFecha(concierto?.fecha)}).</p>
          )}
          {ticket.estado === "pagado" && dia === "paso" && (
            <p className="nota">El concierto ya pasó, este ticket ya no se puede usar.</p>
          )}
        </section>

        <p className="panel-total">
          <span className="panel-subtitulo">Total</span>
          <span className="total">{formatoDinero(ticket.total)}</span>
        </p>
      </div>

      {(ticket.estado === "pendiente" || (ticket.estado === "pagado" && dia === "hoy")) && (
        <footer className="panel-acciones">
          {ticket.estado === "pagado" && (
            <button type="button" onClick={onEntrada} disabled={trabajando}>Dar entrada</button>
          )}
          {ticket.estado === "pendiente" && (
            <>
              <Link className="boton" to={`/admin/cobrar?clave=${ticket.clave}`}>Cobrar</Link>
              <button type="button" className="peligro" onClick={onCancelar} disabled={trabajando}>Cancelar ticket</button>
            </>
          )}
        </footer>
      )}
    </dialog>
  );
}

export default function TicketsAdmin() {
  const { confirmar } = useDialogos();
  const [consulta, setConsulta] = useState(SIN_FILTROS);
  const [resultado, setResultado] = useState(null);
  const [conciertos, setConciertos] = useState([]);
  const [clave, setClave] = useState("");
  const [errorClave, setErrorClave] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [aviso, setAviso] = useState("");
  const [errorPanel, setErrorPanel] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const lista = useRef(null);

  useEffect(() => {
    conciertosApi.listar().then(setConciertos).catch(() => setConciertos([]));
  }, []);

  useEffect(() => {
    let vigente = true;
    ticketsApi
      .listar(consulta)
      .then((datos) => {
        if (!vigente) return;
        const ultima = Math.max(1, Math.ceil(datos.total / datos.limite));
        if (consulta.pagina > ultima) {
          setConsulta({ ...consulta, pagina: ultima });
          return;
        }
        setResultado({ consulta, datos, error: "" });
      })
      .catch((err) => {
        if (vigente) setResultado({ consulta, datos: null, error: mensajeError(err) });
      });
    return () => {
      vigente = false;
    };
  }, [consulta]);

  const cargando = resultado?.consulta !== consulta;
  const datos = resultado?.datos ?? null;
  const error = cargando ? "" : resultado.error;
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.limite)) : 1;
  const sumaEstados = datos ? Object.values(datos.porEstado).reduce((suma, n) => suma + n, 0) : 0;

  const recargar = () => setConsulta((c) => ({ ...c }));

  function cambiarFiltro(cambio) {
    setConsulta({ ...consulta, ...cambio, pagina: 1 });
  }

  function irAPagina(pagina) {
    setConsulta({ ...consulta, pagina });
    lista.current?.scrollIntoView({ block: "start" });
  }

  function abrir(ticket) {
    setAviso("");
    setErrorPanel("");
    setAbierto(ticket);
  }

  async function buscar(e) {
    e.preventDefault();
    if (buscando) return;
    const limpia = clave.trim().toUpperCase();
    if (limpia.length !== LARGO_CLAVE) return setErrorClave(`La clave tiene ${LARGO_CLAVE} caracteres`);
    setBuscando(true);
    try {
      const ticket = await ticketsApi.porClave(limpia);
      setErrorClave("");
      abrir(ticket);
    } catch (err) {
      setErrorClave(mensajeError(err));
    } finally {
      setBuscando(false);
    }
  }

  async function cancelar() {
    const seguro = await confirmar({
      titulo: "Cancelar ticket",
      mensaje: `¿Cancelar el ticket ${abierto.clave}? Los asientos se liberan.`,
      confirmar: "Sí, cancelar ticket",
      cancelar: "No, conservarlo",
      peligro: true,
    });
    if (!seguro) return;
    setTrabajando(true);
    try {
      await ticketsApi.cancelar(abierto.id);
      setAbierto(await ticketsApi.porClave(abierto.clave));
      setErrorPanel("");
      setAviso("Ticket cancelado");
      recargar();
    } catch (err) {
      setErrorPanel(mensajeError(err));
    } finally {
      setTrabajando(false);
    }
  }

  async function darEntrada() {
    const seguro = await confirmar({
      titulo: "Dar entrada",
      mensaje: `¿Dar entrada con el ticket ${abierto.clave}? Ya no se podrá volver a usar.`,
      confirmar: "Sí, dar entrada",
    });
    if (!seguro) return;
    setTrabajando(true);
    try {
      setAbierto(await ticketsApi.usar(abierto.id));
      setErrorPanel("");
      setAviso("Entrada registrada");
      recargar();
    } catch (err) {
      setErrorPanel(mensajeError(err));
    } finally {
      setTrabajando(false);
    }
  }

  const cuenta = (estado) => (datos ? (estado ? datos.porEstado[estado] ?? 0 : sumaEstados) : "");
  const hayFiltros = consulta.estado !== "" || consulta.conciertoId !== "";
  const primero = datos ? (datos.pagina - 1) * datos.limite + 1 : 0;
  const ultimo = datos ? primero + datos.tickets.length - 1 : 0;
  const porFecha = [...conciertos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <EncabezadoPagina titulo="Tickets" sinLinea>
        {datos && (
          <p className="pagina-texto">
            <span className="mono">{datos.total}</span> {datos.total === 1 ? "ticket" : "tickets"}
          </p>
        )}
      </EncabezadoPagina>

      <div className="filtros-barra tickets-filtros">
        <form onSubmit={buscar} className="campo-filtro campo-clave">
          <label htmlFor="ticket-clave">Buscar por clave</label>
          <div className="busqueda-clave">
            <input
              id="ticket-clave"
              className="clave"
              placeholder="Clave del ticket"
              value={clave}
              maxLength={LARGO_CLAVE}
              autoComplete="off"
              onChange={(e) => setClave(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </div>
        </form>

        <div className="campo-filtro">
          <label htmlFor="ticket-concierto">Concierto</label>
          <select id="ticket-concierto" value={consulta.conciertoId} onChange={(e) => cambiarFiltro({ conciertoId: e.target.value })}>
            <option value="">Todos los conciertos</option>
            {porFecha.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} · {formatoDia(c.fecha)}</option>
            ))}
          </select>
        </div>
      </div>
      {errorClave && <p className="error">{errorClave}</p>}

      <div className="filtro-estados" role="radiogroup" aria-label="Filtrar por estado">
        {FILTROS_ESTADO.map(({ valor, nombre }) => (
          <label key={valor} className="filtro-estado">
            <input
              type="radio"
              name="estado-ticket"
              value={valor}
              checked={consulta.estado === valor}
              onChange={() => cambiarFiltro({ estado: valor })}
            />
            {valor && <i className={`marca ${valor}`} aria-hidden="true" />}
            <span>{nombre}</span>
            <span className="mono">{cuenta(valor)}</span>
          </label>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!datos && !error && <p className="nota">Cargando...</p>}

      {datos && (
        <div ref={lista} className={`tickets-lista${cargando ? " cargando" : ""}`} aria-busy={cargando}>
          {datos.tickets.length === 0 ? (
            <div className="tarjeta">
              <p>{hayFiltros ? "No hay tickets con estos filtros." : "Todavía no hay tickets."}</p>
              {hayFiltros && (
                <button type="button" className="secundario chico" onClick={() => setConsulta(SIN_FILTROS)}>Quitar filtros</button>
              )}
            </div>
          ) : (
            <table className="tabla-tickets">
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Concierto</th>
                  <th>Cliente</th>
                  <th className="num">Asientos</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th><span className="solo-lectores">Detalle</span></th>
                </tr>
              </thead>
              <tbody>
                {datos.tickets.map((t) => (
                  <tr key={t.id} className={abierto?.id === t.id ? "seleccionada" : ""}>
                    <td className="celda-clave"><b className="clave">{t.clave}</b></td>
                    <td>
                      {t.concierto?.nombre ?? `Concierto #${t.conciertoId}`}
                      <span className="celda-sub">{formatoDia(t.concierto?.fecha)}</span>
                    </td>
                    <td>
                      {nombreCliente(t) || "—"}
                      {t.usuario?.correo && <span className="celda-sub">{t.usuario.correo}</span>}
                    </td>
                    <td className="num">{t.asientos?.length ?? 0}</td>
                    <td className="num">{formatoDinero(t.total)}</td>
                    <td><span className={`estado ${t.estado}`}>{t.estado}</span></td>
                    <td className="celda-pago">
                      {t.pago ? (
                        <>
                          {formatoDia(t.pago.creadoEn)}
                          <span className="celda-sub">{t.pago.metodo}</span>
                        </>
                      ) : (
                        <span className="celda-vacia">—</span>
                      )}
                    </td>
                    <td>
                      <button type="button" className="chico" aria-label={`Ver el ticket ${t.clave}`} onClick={() => abrir(t)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {paginas > 1 && (
            <nav className="paginacion" aria-label="Páginas de tickets">
              <p className="nota">Mostrando {primero}–{ultimo} de {datos.total}</p>
              <div className="paginacion-botones">
                <button type="button" className="chico secundario" disabled={datos.pagina <= 1 || cargando} onClick={() => irAPagina(datos.pagina - 1)}>Anterior</button>
                <span className="mono">Página {datos.pagina} de {paginas}</span>
                <button type="button" className="chico secundario" disabled={datos.pagina >= paginas || cargando} onClick={() => irAPagina(datos.pagina + 1)}>Siguiente</button>
              </div>
            </nav>
          )}
        </div>
      )}

      {abierto && (
        <PanelTicket
          ticket={abierto}
          aviso={aviso}
          error={errorPanel}
          trabajando={trabajando}
          onCerrar={() => setAbierto(null)}
          onCancelar={cancelar}
          onEntrada={darEntrada}
        />
      )}
    </div>
  );
}