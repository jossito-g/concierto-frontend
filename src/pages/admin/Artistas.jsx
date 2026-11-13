import { useEffect, useState } from "react";
import { artistasApi, generosApi } from "../../api/servicios";
import { mensajeError, buscarPorId } from "../../utils/formato";
import SelectorImagen from "../../components/SelectorImagen";
import ImagenApi from "../../components/ImagenApi";

const vacio = { nombre: "", generoId: "", descripcion: "", imagenId: "" };

export default function Artistas() {
  const [artistas, setArtistas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    generosApi.listar().then(setGeneros).catch((err) => setError(mensajeError(err)));
  }, []);

  useEffect(() => {
    artistasApi.listar().then(setArtistas).catch((err) => setError(mensajeError(err)));
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
    if (!form.nombre.trim() || !form.generoId) return setError("Nombre y género son obligatorios");
    const body = { nombre: form.nombre.trim(), generoId: Number(form.generoId) };
    if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
    else if (editandoId) body.descripcion = null;
    if (form.imagenId) body.imagenId = Number(form.imagenId);
    else if (editandoId) body.imagenId = null;
    try {
      if (editandoId) await artistasApi.editar(editandoId, body);
      else await artistasApi.crear(body);
      limpiar();
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function activarDesactivar(a) {
    try {
      if (a.activo) await artistasApi.desactivar(a.id);
      else await artistasApi.activar(a.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <h1>Artistas</h1>
      <form className="tarjeta" onSubmit={guardar}>
        <h3>{editandoId ? "Editar artista" : "Nuevo artista"}</h3>
        <div className="dos-columnas">
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={cambiar} maxLength={100} />
          <select name="generoId" value={form.generoId} onChange={cambiar}>
            <option value="">Género...</option>
            {generos.filter((g) => g.activo).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <textarea name="descripcion" placeholder="Descripción (opcional)" value={form.descripcion} onChange={cambiar} maxLength={1000} />
        <SelectorImagen etiqueta="Foto del artista" imagenId={form.imagenId} onChange={(id) => setForm({ ...form, imagenId: id })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">{editandoId ? "Guardar cambios" : "Crear"}</button>
        {editandoId && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
      </form>

      <table>
        <thead><tr><th>Foto</th><th>Nombre</th><th>Género</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {artistas.map((a) => (
            <tr key={a.id} className={a.activo ? "" : "inactivo"}>
              <td><ImagenApi id={a.imagenId} className="foto-artista" alt={a.nombre} /></td>
              <td>{a.nombre}</td>
              <td>{a.genero?.nombre ?? buscarPorId(generos, a.generoId)?.nombre}</td>
              <td>{a.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button className="chico" onClick={() => { setEditandoId(a.id); setForm({ nombre: a.nombre, generoId: a.generoId, descripcion: a.descripcion ?? "", imagenId: a.imagenId ?? "" }); }}>Editar</button>
                <button className="chico secundario" onClick={() => activarDesactivar(a)}>{a.activo ? "Desactivar" : "Activar"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}