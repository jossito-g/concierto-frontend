import { useEffect, useState } from "react";
import { recintosApi, zonasApi, ciudadesApi, estadosApi } from "../../api/servicios";
import { mensajeError, nombreCiudad, buscarPorId } from "../../utils/formato";
import SelectorImagen from "../../components/SelectorImagen";

const vacio = { nombre: "", direccion: "", ciudadId: "", imagenId: "" };

export default function Recintos() {
  const [recintos, setRecintos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([ciudadesApi.listar(), estadosApi.listar()])
      .then(([c, e]) => {
        setCiudades(c);
        setEstados(e);
      })
      .catch((err) => setError(mensajeError(err)));
  }, []);

  useEffect(() => {
    recintosApi.listar().then(setRecintos).catch((err) => setError(mensajeError(err)));
  }, [recarga]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const recargar = () => setRecarga((r) => r + 1);

  function limpiar() {
    setForm(vacio);
    setEditandoId(null);
    setError("");
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.direccion.trim() || !form.ciudadId) return setError("Llena nombre, dirección y ciudad");
    const body = { nombre: form.nombre.trim(), direccion: form.direccion.trim(), ciudadId: Number(form.ciudadId) };
    if (form.imagenId) body.imagenId = Number(form.imagenId);
    else if (editandoId) body.imagenId = null; 
    try {
      if (editandoId) await recintosApi.editar(editandoId, body);
      else await recintosApi.crear(body);
      limpiar();
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  function editar(r) {
    setEditandoId(r.id);
    setForm({ nombre: r.nombre, direccion: r.direccion, ciudadId: r.ciudadId, imagenId: r.imagenId ?? "" });
  }

  async function activarDesactivar(r) {
    try {
      if (r.activo) await recintosApi.desactivar(r.id);
      else await recintosApi.activar(r.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err)); 
    }
  }

  return (
    <div>
      <h1>Recintos</h1>
      <form className="tarjeta" onSubmit={guardar}>
        <h3>{editandoId ? "Editar recinto" : "Nuevo recinto"}</h3>
        <div className="dos-columnas">
          <input name="nombre" placeholder="Nombre" value={form.nombre} maxLength={100} onChange={cambiar} />
          <input name="direccion" placeholder="Dirección" value={form.direccion} maxLength={255} onChange={cambiar} />
          <select name="ciudadId" value={form.ciudadId} onChange={cambiar}>
            <option value="">Ciudad...</option>
            {ciudades.filter((c) => c.activo).map((c) => <option key={c.id} value={c.id}>{nombreCiudad(c, estados)}</option>)}
          </select>
        </div>
        <SelectorImagen etiqueta="Plano del recinto" imagenId={form.imagenId} onChange={(id) => setForm({ ...form, imagenId: id })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">{editandoId ? "Guardar cambios" : "Crear"}</button>
        {editandoId && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
      </form>

      <table>
        <thead><tr><th>Nombre</th><th>Ciudad</th><th>Dirección</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {recintos.map((r) => (
            <tr key={r.id} className={`${r.activo ? "" : "inactivo"} ${seleccionado?.id === r.id ? "seleccionada" : ""}`}>
              <td>{r.nombre}</td>
              <td>{nombreCiudad(r.ciudad ?? buscarPorId(ciudades, r.ciudadId), estados)}</td>
              <td>{r.direccion}</td>
              <td>{r.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button className="chico" onClick={() => setSeleccionado(r)}>Zonas</button>
                <button className="chico" onClick={() => editar(r)}>Editar</button>
                <button className="chico secundario" onClick={() => activarDesactivar(r)}>{r.activo ? "Desactivar" : "Activar"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {seleccionado && <Zonas key={seleccionado.id} recinto={seleccionado} />}
    </div>
  );
}

function Zonas({ recinto }) {
  const [zonas, setZonas] = useState([]);
  const [form, setForm] = useState({ nombre: "", filas: "", asientosPorFila: "" });
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    zonasApi.listar(recinto.id).then(setZonas).catch((err) => setError(mensajeError(err)));
  }, [recinto.id, recarga]);

  const recargar = () => setRecarga((r) => r + 1);

  async function crear(e) {
    e.preventDefault();
    const filas = Number(form.filas);
    const porFila = Number(form.asientosPorFila);
    if (!form.nombre.trim()) return setError("Escribe el nombre de la zona");
    if (!Number.isInteger(filas) || filas < 1 || filas > 26) return setError("Las filas van de 1 a 26");
    if (!Number.isInteger(porFila) || porFila < 1 || porFila > 50) return setError("Los asientos por fila van de 1 a 50");
    try {
      await zonasApi.crear(recinto.id, { nombre: form.nombre.trim(), filas, asientosPorFila: porFila });
      setForm({ nombre: "", filas: "", asientosPorFila: "" });
      setError("");
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function renombrar(z) {
    const nombre = prompt("Nuevo nombre de la zona", z.nombre);
    if (!nombre || !nombre.trim()) return;
    try {
      await zonasApi.editar(z.id, { nombre: nombre.trim() }); /* solo el nombre se edita */
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function activarDesactivar(z) {
    try {
      if (z.activo) await zonasApi.desactivar(z.id);
      else await zonasApi.activar(z.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="tarjeta">
      <h3>Zonas de {recinto.nombre}</h3>
      <form onSubmit={crear} className="en-linea">
        <input placeholder="Nombre" value={form.nombre} maxLength={50} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input type="number" placeholder="Filas (1-26)" value={form.filas} onChange={(e) => setForm({ ...form, filas: e.target.value })} />
        <input type="number" placeholder="Asientos por fila (1-50)" value={form.asientosPorFila} onChange={(e) => setForm({ ...form, asientosPorFila: e.target.value })} />
        <button type="submit">Agregar zona</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="nota">El tamaño de una zona no se edita: si te equivocaste, crea otra. Los asientos se generan solos.</p>
      <ul className="lista">
        {zonas.map((z) => (
          <li key={z.id} className={z.activo ? "" : "inactivo"}>
            {z.nombre}: {z.filas} filas × {z.asientosPorFila} = {z.filas * z.asientosPorFila} asientos
            <span>
              <button className="chico" onClick={() => renombrar(z)}>Renombrar</button>
              <button className="chico secundario" onClick={() => activarDesactivar(z)}>{z.activo ? "Desactivar" : "Activar"}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}