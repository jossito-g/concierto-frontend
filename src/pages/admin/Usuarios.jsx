import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi, usuariosApi } from "../../api/servicios";
import { mensajeError, nombreRol, ROLES } from "../../utils/formato";
import EncabezadoPagina from "../../components/EncabezadoPagina";

const vacio = { nombre: "", apellido: "", correo: "", contrasena: "", telefono: "", rolId: "" };

export default function Usuarios() {
  const { usuario: yo, actualizarUsuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    usuariosApi.listar().then(setUsuarios).catch((err) => setError(mensajeError(err)));
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
    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) return setError("Nombre, apellido y correo son obligatorios");
    if (!editandoId && form.contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres");
    if (!editandoId && !form.rolId) return setError("Elige el rol");
    if (form.telefono && !/^\d{10}$/.test(form.telefono)) return setError("El teléfono debe tener 10 dígitos");

    const body = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), correo: form.correo.trim() };
    if (form.telefono) body.telefono = form.telefono;
    else if (editandoId) body.telefono = null;
    if (form.contrasena) body.contrasena = form.contrasena;

    try {
      if (editandoId) {
        await usuariosApi.editar(editandoId, body);
        if (editandoId === yo.id) actualizarUsuario(await authApi.perfil());
      } else await usuariosApi.crear({ ...body, rolId: Number(form.rolId) });
      limpiar();
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  function editar(u) {
    setEditandoId(u.id);
    setForm({ nombre: u.nombre, apellido: u.apellido, correo: u.correo, contrasena: "", telefono: u.telefono ?? "", rolId: u.rolId ?? "" });
  }

  async function activarDesactivar(u) {
    try {
      if (u.activo) await usuariosApi.desactivar(u.id);
      else await usuariosApi.activar(u.id);
      recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <EncabezadoPagina titulo="Usuarios" />
      <form className="tarjeta" onSubmit={guardar}>
        <h3>{editandoId ? "Editar usuario" : "Nuevo usuario"}</h3>
        <div className="dos-columnas">
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={cambiar} maxLength={100} />
          <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={cambiar} maxLength={100} />
          <input name="correo" type="email" placeholder="Correo" value={form.correo} onChange={cambiar} maxLength={150} />
          <input name="contrasena" type="password" placeholder={editandoId ? "Nueva contraseña (opcional)" : "Contraseña"} value={form.contrasena} onChange={cambiar} maxLength={72} />
          <input name="telefono" placeholder="Teléfono (opcional)" value={form.telefono} onChange={cambiar} maxLength={10} />
          <select name="rolId" value={form.rolId} onChange={cambiar} disabled={!!editandoId}>
            <option value="">Rol...</option>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">{editandoId ? "Guardar cambios" : "Crear"}</button>
        {editandoId && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
      </form>

      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className={u.activo ? "" : "inactivo"}>
              <td>{u.nombre} {u.apellido}</td>
              <td>{u.correo}</td>
              <td>{nombreRol(u)}</td>
              <td>{u.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button className="chico" onClick={() => editar(u)}>Editar</button>
                {u.id !== yo.id && (
                  <button className="chico secundario" onClick={() => activarDesactivar(u)}>
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}