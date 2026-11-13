import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { carteleraApi, ticketsApi, estadosApi } from "../../api/servicios";
import { formatoFecha, formatoDinero, mensajeError, nombreCiudad } from "../../utils/formato";
import ImagenApi from "../../components/ImagenApi";

const MAXIMO_ASIENTOS = 8;

export default function DetalleConcierto() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [concierto, setConcierto] = useState(null);
  const [estados, setEstados] = useState([]);
  const [zonaId, setZonaId] = useState("");
  const [asientos, setAsientos] = useState([]);
  const [elegidos, setElegidos] = useState([]);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carteleraApi.detalle(id).then(setConcierto).catch((err) => setError(mensajeError(err)));
    estadosApi.listar().then(setEstados).catch(() => setEstados([]));
  }, [id]);

  useEffect(() => {
    if (!zonaId) return;
    carteleraApi.asientos(id, zonaId).then(setAsientos).catch((err) => setError(mensajeError(err)));
  }, [id, zonaId, recarga]);

  if (!concierto) {
    return error ? (
      <div>
        <p className="error">{error}</p>
        <Link to="/cartelera" className="boton">Volver a la cartelera</Link>
      </div>
    ) : (
      <p className="nota">Cargando...</p>
    );
  }

  const zonas = concierto.zonas ?? [];
  const zona = zonas.find((z) => z.zonaId === Number(zonaId));
  const totalCentavos = elegidos.reduce((suma, a) => suma + Math.round(Number(a.precio) * 100), 0);
  const recinto = concierto.recinto;

  const filas = {};
  for (const a of asientos) (filas[a.fila] ??= []).push(a);

  function cambiarZona(e) {
    setZonaId(e.target.value);
    setAsientos([]);
    setError("");
  }

  function tocarAsiento(a) {
    setError("");
    if (elegidos.some((x) => x.id === a.id)) {
      setElegidos(elegidos.filter((x) => x.id !== a.id));
    } else if (elegidos.length >= MAXIMO_ASIENTOS) {
      setError(`Máximo ${MAXIMO_ASIENTOS} asientos por ticket`);
    } else {
      setElegidos([...elegidos, { id: a.id, fila: a.fila, numero: a.numero, zonaId: zona.zonaId, zona: zona.nombre, precio: zona.precio }]);
    }
  }

  async function quitarOcupados() {
    const zonaIds = [...new Set(elegidos.map((a) => a.zonaId))];
    const listas = await Promise.all(zonaIds.map((z) => carteleraApi.asientos(id, z)));
    const ocupados = new Set(listas.flat().filter((a) => a.ocupado).map((a) => a.id));
    setElegidos((lista) => lista.filter((a) => !ocupados.has(a.id)));
    setRecarga((r) => r + 1);
  }

  async function apartar() {
    setEnviando(true);
    setError("");
    try {
      const ticket = await ticketsApi.crear(Number(id), elegidos.map((a) => a.id));
      navigate("/mis-tickets", { state: { nuevoId: ticket.id } });
    } catch (err) {
      setError(mensajeError(err));
      if (err?.response?.status === 409) await quitarOcupados().catch(() => {});
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="detalle-encabezado">
        <ImagenApi id={concierto.imagenId} className="cartel-grande" alt={concierto.nombre} />
        <div>
          <h1>{concierto.nombre}</h1>
          {concierto.artistas?.length > 0 && (
            <div className="artistas-detalle">
              {concierto.artistas.map((a) => (
                <span key={a.id}>
                  <ImagenApi id={a.imagenId} className="foto-artista" alt={a.nombre} />
                  <b>{a.nombre}</b>
                </span>
              ))}
            </div>
          )}
          <p className="nota">📅 {formatoFecha(concierto.fecha)}</p>
          {recinto && (
            <p className="nota">
              📍 {recinto.nombre} · {recinto.direccion} · {nombreCiudad(recinto.ciudad, estados)}
            </p>
          )}
          {concierto.descripcion && <p>{concierto.descripcion}</p>}
        </div>
      </div>

      {recinto?.imagenId && (
        <details className="tarjeta">
          <summary>Ver plano del recinto</summary>
          <ImagenApi id={recinto.imagenId} className="plano" alt={`Plano de ${recinto.nombre}`} />
        </details>
      )}

      <h2>Elige tus asientos</h2>
      {zonas.length === 0 ? (
        <p className="nota">Este concierto todavía no tiene zonas a la venta.</p>
      ) : (
        <select value={zonaId} onChange={cambiarZona}>
          <option value="">Elige una zona</option>
          {zonas.map((z) => (
            <option key={z.zonaId} value={z.zonaId}>{z.nombre} — {formatoDinero(z.precio)}</option>
          ))}
        </select>
      )}

      {zona && (
        <>
          <div className="escenario">ESCENARIO</div>
          <div className="mapa">
            {Object.keys(filas).map((letra) => (
              <div key={letra} className="fila">
                <span className="letra">{letra}</span>
                {filas[letra].map((a) => {
                  const elegido = elegidos.some((x) => x.id === a.id);
                  return (
                    <button
                      key={a.id}
                      className={`asiento ${a.ocupado ? "ocupado" : ""} ${elegido ? "elegido" : ""}`}
                      disabled={a.ocupado}
                      onClick={() => tocarAsiento(a)}
                      title={`${zona.nombre} ${a.fila}${a.numero}`}
                    >
                      {a.numero}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="leyenda">
            <span><i className="libre" /> Libre</span>
            <span><i className="elegido" /> Elegido</span>
            <span><i className="ocupado" /> Ocupado</span>
            <span>Puedes elegir de varias zonas, máximo {MAXIMO_ASIENTOS}.</span>
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {elegidos.length > 0 && (
        <div className="tarjeta">
          <h3>Tu selección ({elegidos.length})</h3>
          <ul className="lista">
            {elegidos.map((a) => (
              <li key={a.id}>
                {a.zona} {a.fila}{a.numero}
                <span>
                  {formatoDinero(a.precio)}{" "}
                  <button className="chico secundario" onClick={() => setElegidos(elegidos.filter((x) => x.id !== a.id))}>Quitar</button>
                </span>
              </li>
            ))}
          </ul>
          <p className="total">Total: {formatoDinero(totalCentavos / 100)}</p>
          {usuario.rol === "cliente" ? (
            <>
              <button onClick={apartar} disabled={enviando}>{enviando ? "Apartando..." : "Apartar asientos"}</button>
              <p className="nota">Se genera una clave y tienes 48 horas para pagar en efectivo en taquilla.</p>
            </>
          ) : (
            <p className="nota">El administrador no puede apartar asientos.</p>
          )}
        </div>
      )}
    </div>
  );
}