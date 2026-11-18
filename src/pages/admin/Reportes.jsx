import { useEffect, useState } from "react";
import { reportesApi } from "../../api/servicios";
import { formatoDinero, formatoFecha, mensajeError } from "../../utils/formato";

function Barra({ ocupados, capacidad, porcentaje }) {
  return (
    <>
      <div className="barra"><div style={{ width: `${Math.min(porcentaje, 100)}%` }} /></div>
      <span className="nota">{ocupados} de {capacidad} ({porcentaje}%)</span>
    </>
  );
}

export default function Reportes() {
  const [estado, setEstado] = useState("");
  const [resultado, setResultado] = useState(null);
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  useEffect(() => {
    reportesApi
      .conciertos({ estado })
      .then((lista) => setResultado({ estado, lista, error: "" }))
      .catch((err) => setResultado({ estado, lista: null, error: mensajeError(err) }));
  }, [estado]);

  const actual = resultado?.estado === estado ? resultado : null;
  const filas = actual?.lista ?? null;
  const error = actual?.error ?? "";

  const totalCentavos = (filas ?? []).reduce((suma, f) => suma + Math.round(Number(f.ingresos) * 100), 0);
  const sumar = (estadoTicket) => (filas ?? []).reduce((suma, f) => suma + (f.tickets.porEstado[estadoTicket] ?? 0), 0);

  return (
    <div>
      <h1>Reportes</h1>

      <div className="filtros">
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setSeleccionadoId(null); }}>
          <option value="">Todos los conciertos</option>
          <option value="programado">Programados</option>
          <option value="finalizado">Finalizados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {!filas && !error && <p className="nota">Cargando...</p>}

      {filas && (
        <>
          <div className="resumen">
            <div className="tarjeta">
              <p className="nota">Ingresos</p>
              <p className="total">{formatoDinero(totalCentavos / 100)}</p>
            </div>
            <div className="tarjeta">
              <p className="nota">Tickets pagados</p>
              <p className="total">{sumar("pagado") + sumar("usado")}</p>
            </div>
            <div className="tarjeta">
              <p className="nota">Tickets pendientes</p>
              <p className="total">{sumar("pendiente")}</p>
            </div>
            <div className="tarjeta">
              <p className="nota">Conciertos</p>
              <p className="total">{filas.length}</p>
            </div>
          </div>

          {filas.length === 0 ? (
            <p className="nota">No hay conciertos con ese filtro.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Concierto</th>
                  <th>Estado</th>
                  <th>Pendientes</th>
                  <th>Pagados</th>
                  <th>Usados</th>
                  <th>Cancelados</th>
                  <th>Vencidos</th>
                  <th>Ingresos</th>
                  <th>Ocupación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const c = f.concierto;
                  const yaPaso = c.estado === "programado" && new Date(c.fecha) < new Date();
                  return (
                    <tr key={c.id} className={seleccionadoId === c.id ? "seleccionada" : ""}>
                      <td>
                        <b>{c.nombre}</b>
                        <br />
                        <span className="nota">{formatoFecha(c.fecha)} · {c.recinto?.nombre}</span>
                      </td>
                      <td>
                        <span className={`estado ${c.estado}`}>{c.estado}</span>
                        {yaPaso && <span className="estado"> ya pasó</span>}
                      </td>
                      <td>{f.tickets.porEstado.pendiente}</td>
                      <td>{f.tickets.porEstado.pagado}</td>
                      <td>{f.tickets.porEstado.usado ?? 0}</td>
                      <td>{f.tickets.porEstado.cancelado}</td>
                      <td>{f.tickets.porEstado.vencido}</td>
                      <td>{formatoDinero(f.ingresos)}</td>
                      <td><Barra {...f.ocupacion} /></td>
                      <td><button className="chico" onClick={() => setSeleccionadoId(c.id)}>Por zona</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {seleccionadoId && <DetallePorZona key={seleccionadoId} id={seleccionadoId} />}
    </div>
  );
}

function DetallePorZona({ id }) {
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    reportesApi.concierto(id).then(setDetalle).catch((err) => setError(mensajeError(err)));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!detalle) return <p className="nota">Cargando...</p>;

  return (
    <div className="tarjeta">
      <h3>{detalle.concierto.nombre}: ocupación por zona</h3>
      <p className="nota">
        {detalle.tickets.total} tickets · Ingresos {formatoDinero(detalle.ingresos)} · Ocupación total {detalle.ocupacion.porcentaje}%
      </p>
      {detalle.zonas.length === 0 ? (
        <p className="nota">Este concierto no tiene zonas con precio.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Precio</th>
              <th>Ocupados</th>
              <th>Disponibles</th>
              <th>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {detalle.zonas.map((z) => (
              <tr key={z.zonaId}>
                <td>{z.nombre}</td>
                <td>{formatoDinero(z.precio)}</td>
                <td>{z.ocupados}</td>
                <td>{z.disponibles}</td>
                <td><Barra {...z} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}