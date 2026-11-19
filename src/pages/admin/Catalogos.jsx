import { useEffect, useState } from "react";
import { estadosApi, ciudadesApi, generosApi } from "../../api/servicios";
import { mensajeError, nombreCiudad } from "../../utils/formato";
import EncabezadoPagina from "../../components/EncabezadoPagina";

function ListaSimple({ titulo, campo, ejemplo, servicio }) {
  const [lista, setLista] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    servicio.listar().then(setLista).catch((err) => setError(mensajeError(err)));
  }, [servicio, recarga]);

  const recargar = () => setRecarga((r) => r + 1);

  async function guardar(e) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return setError("Escribe un nombre");
    try {
      if (editandoId) await servicio.editar(editandoId, { nombre: limpio });
      else await servicio.crear({ nombre: limpio });
      setNombre("");
      setEditandoId(null);
      setError("");
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function activarDesactivar(x) {
    try {
      if (x.activo) await servicio.desactivar(x.id);
      else await servicio.activar(x.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="tarjeta">
      <h3>{titulo}</h3>
      <form onSubmit={guardar} className="catalogo-form">
        {editandoId && <p className="editando">Editando: {lista.find((x) => x.id === editandoId)?.nombre}</p>}
        <label className="campo">
          {campo}
          <input placeholder={`Ej. ${ejemplo}`} value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <button type="submit">{editandoId ? "Guardar cambios" : "Agregar"}</button>
        {editandoId && (
          <button type="button" className="secundario" onClick={() => { setEditandoId(null); setNombre(""); setError(""); }}>
            Cancelar
          </button>
        )}
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="lista">
        {lista.map((x) => (
          <li key={x.id} className={x.activo ? "" : "inactivo"}>
            {x.nombre}
            <span>
              <button className="chico" onClick={() => { setEditandoId(x.id); setNombre(x.nombre); }}>Editar</button>
              <button className="chico secundario" onClick={() => activarDesactivar(x)}>{x.activo ? "Desactivar" : "Activar"}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ciudades({ estados }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nombre: "", estadoId: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    ciudadesApi.listar().then(setLista).catch((err) => setError(mensajeError(err)));
  }, [recarga]);

  const recargar = () => setRecarga((r) => r + 1);

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.estadoId) return setError("Escribe el nombre y elige el estado");
    const body = { nombre: form.nombre.trim(), estadoId: Number(form.estadoId) };
    try {
      if (editandoId) await ciudadesApi.editar(editandoId, body);
      else await ciudadesApi.crear(body);
      setForm({ nombre: "", estadoId: "" });
      setEditandoId(null);
      setError("");
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function activarDesactivar(c) {
    try {
      if (c.activo) await ciudadesApi.desactivar(c.id);
      else await ciudadesApi.activar(c.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="tarjeta">
      <h3>Ciudades</h3>
      <form onSubmit={guardar} className="catalogo-form">
        {editandoId && <p className="editando">Editando: {lista.find((x) => x.id === editandoId)?.nombre}</p>}
        <label className="campo">
          Nombre de la ciudad
          <input placeholder="Ej. Torreón" value={form.nombre} maxLength={100} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </label>
        <label className="campo">
          Estado al que pertenece
          <select value={form.estadoId} onChange={(e) => setForm({ ...form, estadoId: e.target.value })}>
            <option value="">Elige un estado...</option>
            {estados.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </label>
        <button type="submit">{editandoId ? "Guardar cambios" : "Agregar"}</button>
        {editandoId && (
          <button type="button" className="secundario" onClick={() => { setEditandoId(null); setForm({ nombre: "", estadoId: "" }); setError(""); }}>
            Cancelar
          </button>
        )}
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="lista">
        {lista.map((c) => (
          <li key={c.id} className={c.activo ? "" : "inactivo"}>
            {nombreCiudad(c, estados)}
            <span>
              <button className="chico" onClick={() => { setEditandoId(c.id); setForm({ nombre: c.nombre, estadoId: c.estadoId }); }}>Editar</button>
              <button className="chico secundario" onClick={() => activarDesactivar(c)}>{c.activo ? "Desactivar" : "Activar"}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Catalogos() {
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    estadosApi.listar().then(setEstados).catch(() => setEstados([]));
  }, []);

  return (
    <div>
      <EncabezadoPagina titulo="Catálogos" />
      <div className="rejilla catalogos">
        <Ciudades estados={estados} />
        <ListaSimple
          titulo="Géneros musicales"
          campo="Nombre del género"
          ejemplo="Rock"
          servicio={generosApi}
        />
      </div>
    </div>
  );
}