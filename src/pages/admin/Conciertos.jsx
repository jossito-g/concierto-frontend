import { useEffect, useState } from "react";
import { conciertosApi, recintosApi, zonasApi, artistasApi, generosApi } from "../../api/servicios";
import { useDialogos } from "../../context/DialogosContext";
import { mensajeError, formatoFecha, formatoDinero, aInputFecha, buscarPorId } from "../../utils/formato";
import SelectorImagen from "../../components/SelectorImagen";
import EncabezadoPagina from "../../components/EncabezadoPagina";
import Exito from "../../components/Exito";

const vacio = { nombre: "", descripcion: "", fecha: "", recintoId: "", imagenId: "" };

export default function Conciertos() {
  const { confirmar } = useDialogos();
  const [conciertos, setConciertos] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    recintosApi.listar().then(setRecintos).catch((err) => setError(mensajeError(err)));
  }, []);

  useEffect(() => {
    conciertosApi.listar().then(setConciertos).catch((err) => setError(mensajeError(err)));
  }, [recarga]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const recargar = () => setRecarga((r) => r + 1);

  const seleccionado = conciertos.find((c) => c.id === seleccionadoId);

  function limpiar() {
    setForm(vacio);
    setEditando(null);
    setError("");
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.fecha || !form.recintoId) return setError("Nombre, fecha y recinto son obligatorios");

    const cambiaFecha = !editando || form.fecha !== aInputFecha(editando.fecha);
    if (cambiaFecha && new Date(form.fecha) <= new Date()) return setError("La fecha debe ser futura");

    const cambiaRecinto = editando && Number(form.recintoId) !== editando.recintoId;
    if (cambiaRecinto) {
      const seguro = await confirmar({
        titulo: "Cambiar el recinto",
        mensaje: "Si cambias el recinto se borran los precios de este concierto. ¿Continuar?",
        confirmar: "Sí, cambiar recinto",
        peligro: true,
      });
      if (!seguro) return;
    }

    const body = { nombre: form.nombre.trim(), recintoId: Number(form.recintoId) };
    if (cambiaFecha) body.fecha = new Date(form.fecha).toISOString(); 
    if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
    else if (editando) body.descripcion = null; 
    if (form.imagenId) body.imagenId = Number(form.imagenId);
    else if (editando) body.imagenId = null; 

    try {
      if (editando) {
        await conciertosApi.editar(editando.id, body);
      } else {
        const nuevo = await conciertosApi.crear(body);
        setSeleccionadoId(nuevo.id); 
      }
      limpiar();
      recargar();
    } catch (err) {
      setError(mensajeError(err)); 
    }
  }

  function editar(c) {
    setEditando(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "", fecha: aInputFecha(c.fecha), recintoId: c.recintoId, imagenId: c.imagenId ?? "" });
  }

  async function cancelar(c) {
    const seguro = await confirmar({
      titulo: "Cancelar concierto",
      mensaje: `¿Cancelar "${c.nombre}"? No se puede deshacer.`,
      confirmar: "Sí, cancelar concierto",
      cancelar: "No, regresar",
      peligro: true,
    });
    if (!seguro) return;
    try {
      await conciertosApi.cancelar(c.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <EncabezadoPagina titulo="Conciertos" />
      <form className="tarjeta" onSubmit={guardar}>
        <h3>{editando ? "Editar concierto" : "Nuevo concierto"}</h3>
        <div className="dos-columnas">
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={cambiar} maxLength={150} />
          <input name="fecha" type="datetime-local" value={form.fecha} onChange={cambiar} />
          <select name="recintoId" value={form.recintoId} onChange={cambiar}>
            <option value="">Recinto...</option>
            {recintos.filter((r) => r.activo || r.id === Number(form.recintoId)).map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <textarea name="descripcion" placeholder="Descripción (opcional)" value={form.descripcion} onChange={cambiar} maxLength={1000} />
        <SelectorImagen etiqueta="Cartel del concierto" imagenId={form.imagenId} onChange={(id) => setForm({ ...form, imagenId: id })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">{editando ? "Guardar cambios" : "Crear"}</button>
        {editando && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
      </form>

      <table>
        <thead><tr><th>Nombre</th><th>Fecha</th><th>Recinto</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {conciertos.map((c) => (
            <tr key={c.id} className={seleccionadoId === c.id ? "seleccionada" : ""}>
              <td>{c.nombre}</td>
              <td>{formatoFecha(c.fecha)}</td>
              <td>{c.recinto?.nombre ?? buscarPorId(recintos, c.recintoId)?.nombre}</td>
              <td><span className={`estado ${c.estado}`}>{c.estado}</span></td>
              <td>
                <button className="chico" onClick={() => setSeleccionadoId(c.id)}>Artistas y precios</button>
                {c.estado === "programado" && (
                  <>
                    <button className="chico" onClick={() => editar(c)}>Editar</button>
                    <button className="chico peligro" onClick={() => cancelar(c)}>Cancelar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {seleccionado && <ArtistasYPrecios key={`${seleccionado.id}-${seleccionado.recintoId}`} concierto={seleccionado} />}
    </div>
  );
}

function ArtistasYPrecios({ concierto }) {
  const [artistas, setArtistas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [artistaIds, setArtistaIds] = useState([]); 
  const [precios, setPrecios] = useState({}); 
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  function cargarDetalle(detalle) {
    setArtistaIds((detalle.artistas ?? []).map((a) => a.id));
    setPrecios(Object.fromEntries((detalle.zonas ?? []).map((z) => [z.zonaId, String(Number(z.precio))])));
  }

  useEffect(() => {
    Promise.all([artistasApi.listar(), generosApi.listar(), zonasApi.listar(concierto.recintoId), conciertosApi.uno(concierto.id)])
      .then(([listaArtistas, listaGeneros, listaZonas, detalle]) => {
        setArtistas(listaArtistas);
        setGeneros(listaGeneros);
        setZonas(listaZonas);
        cargarDetalle(detalle);
      })
      .catch((err) => setError(mensajeError(err)));
  }, [concierto.id, concierto.recintoId]);

  const artistasActivos = artistas.filter((a) => a.activo);
  const zonasActivas = zonas.filter((z) => z.activo);

  function marcarArtista(id) {
    setAviso("");
    setArtistaIds(artistaIds.includes(id) ? artistaIds.filter((x) => x !== id) : [...artistaIds, id]);
  }

  async function guardarArtistas() {
    const ids = artistaIds.filter((id) => artistasActivos.some((a) => a.id === id));
    if (ids.length === 0) return setError("Elige al menos un artista");
    try {
      cargarDetalle(await conciertosApi.asignarArtistas(concierto.id, ids)); // reemplaza la lista completa
      setError("");
      setAviso("Artistas guardados");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function guardarPrecios() {
    const lista = zonasActivas
      .filter((z) => precios[z.id] !== undefined && precios[z.id] !== "")
      .map((z) => ({ zonaId: z.id, precio: Number(precios[z.id]) })); 
    if (lista.length === 0) return setError("Pon precio al menos a una zona");
    const malo = lista.find((p) => !(p.precio >= 10) || p.precio > 100000 || Math.round(p.precio * 100) / 100 !== p.precio);
    if (malo) return setError("Cada precio debe ser de al menos $10, hasta 100,000 y con máximo 2 decimales");
    try {
      cargarDetalle(await conciertosApi.asignarPrecios(concierto.id, lista)); 
      setError("");
      setAviso("Precios guardados");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const nombreGenero = (a) => buscarPorId(generos, a.generoId)?.nombre ?? "";

  return (
    <div className="tarjeta">
      <h3>{concierto.nombre}: artistas y precios</h3>

      <h4>Artistas</h4>
      {artistasActivos.length === 0 && <p className="nota">No hay artistas activos. Créalos en la pantalla de Artistas.</p>}
      <div className="chips">
        {artistasActivos.map((a) => (
          <label key={a.id} className="chip">
            <input type="checkbox" checked={artistaIds.includes(a.id)} onChange={() => marcarArtista(a.id)} />
            {a.nombre} {nombreGenero(a) && <span className="nota">({nombreGenero(a)})</span>}
          </label>
        ))}
      </div>
      <button onClick={guardarArtistas}>Guardar artistas</button>

      <h4>Precio por zona (mínimo $10; vacío = no se vende)</h4>
      {zonasActivas.length === 0 && <p className="nota">Este recinto no tiene zonas activas. Créalas en Recintos → Zonas.</p>}
      {zonasActivas.map((z) => (
        <div key={z.id} className="en-linea">
          <span className="etiqueta-zona">{z.nombre}</span>
          <input
            type="number"
            step="0.01"
            min="10"
            placeholder="Precio"
            value={precios[z.id] ?? ""}
            onChange={(e) => { setAviso(""); setPrecios({ ...precios, [z.id]: e.target.value }); }}
          />
          {precios[z.id] && <span className="nota">{formatoDinero(precios[z.id])}</span>}
        </div>
      ))}
      <button onClick={guardarPrecios}>Guardar precios</button>

      {error && <p className="error">{error}</p>}
      {aviso && !error && <Exito>{aviso}</Exito>}
    </div>
  );
}