import { useEffect, useState } from "react";
import { authApi, ticketsApi } from "../api/servicios";
import { useAuth } from "../context/AuthContext";
import { mensajeError, nombreRol } from "../utils/formato";

const formVacio = { nombre: "", apellido: "", telefono: "", contrasenaActual: "", contrasenaNueva: "", confirmar: "" };

function iniciales(p) {
  return `${p.nombre?.[0] ?? ""}${p.apellido?.[0] ?? ""}`.toUpperCase();
}

function fechaCorta(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function Perfil() {
  const { actualizarUsuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  const [editando, setEditando] = useState(false);
  const [conClave, setConClave] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [errorForm, setErrorForm] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    authApi
      .perfil()
      .then((p) => {
        setPerfil(p);
        if (nombreRol(p) === "cliente") {
          ticketsApi.mios().then(setTickets).catch(() => setTickets([]));
        }
      })
      .catch((err) => setError(mensajeError(err)));
  }, []);

  function abrirEdicion() {
    setForm({ ...formVacio, nombre: perfil.nombre ?? "", apellido: perfil.apellido ?? "", telefono: perfil.telefono ?? "" });
    setErrorForm("");
    setAviso("");
    setConClave(false);
    setEditando(true);
  }

  function cancelar() {
    setForm(formVacio);
    setErrorForm("");
    setConClave(false);
    setEditando(false);
  }

  function quitarClave() {
    setForm({ ...form, contrasenaActual: "", contrasenaNueva: "", confirmar: "" });
    setErrorForm("");
    setConClave(false);
  }

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validar() {
    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    const telefono = form.telefono.trim();
    if (!nombre || !apellido) return "Nombre y apellido son obligatorios";
    if (telefono && !/^\d{10}$/.test(telefono)) return "El teléfono debe tener 10 dígitos";
    if (conClave) {
      if (!form.contrasenaActual) return "Escribe tu contraseña actual";
      if (form.contrasenaNueva.length < 8 || form.contrasenaNueva.length > 72) {
        return "La contraseña nueva debe tener de 8 a 72 caracteres";
      }
      if (form.contrasenaNueva !== form.confirmar) return "Las contraseñas nuevas no coinciden";
      if (form.contrasenaNueva === form.contrasenaActual) return "La contraseña nueva debe ser diferente a la actual";
    }
    return "";
  }

  async function guardar(e) {
    e.preventDefault();
    const mensaje = validar();
    if (mensaje) return setErrorForm(mensaje);
    setErrorForm("");
    setGuardando(true);
    const body = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim() || null,
    };
    const cambiaClave = conClave;
    if (cambiaClave) {
      body.contrasenaActual = form.contrasenaActual;
      body.contrasenaNueva = form.contrasenaNueva;
    }
    try {
      const actualizado = await authApi.actualizarPerfil(body);
      setPerfil(actualizado);
      actualizarUsuario(actualizado);
      setForm(formVacio);
      setConClave(false);
      setEditando(false);
      setAviso(cambiaClave ? "Tus datos y tu contraseña se guardaron" : "Tus datos se guardaron");
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!perfil) return <p className="nota">Cargando...</p>;

  const rol = nombreRol(perfil);
  const contar = (estado) => (tickets ?? []).filter((t) => t.estado === estado).length;

  return (
    <div className="perfil">
      <div className="tarjeta perfil-encabezado">
        <div className="perfil-avatar">{iniciales(perfil)}</div>
        <div>
          <h1>{perfil.nombre} {perfil.apellido}</h1>
          <span className={`perfil-rol ${rol}`}>{rol === "administrador" ? "Administrador" : "Cliente"}</span>
        </div>
        {!editando && (
          <button type="button" className="perfil-editar" onClick={abrirEdicion}>
            Editar perfil
          </button>
        )}
      </div>

      {aviso && !editando && <p className="exito perfil-aviso">{aviso}</p>}

      {editando ? (
        <form className="tarjeta" onSubmit={guardar} noValidate>
          <h3>Editar perfil</h3>
          <div className="dos-columnas">
            <div>
              <label htmlFor="perfil-nombre">Nombre</label>
              <input id="perfil-nombre" name="nombre" autoComplete="given-name" value={form.nombre} onChange={cambiar} maxLength={100} />
            </div>
            <div>
              <label htmlFor="perfil-apellido">Apellido</label>
              <input id="perfil-apellido" name="apellido" autoComplete="family-name" value={form.apellido} onChange={cambiar} maxLength={100} />
            </div>
          </div>
          <label htmlFor="perfil-telefono">Teléfono (opcional)</label>
          <input id="perfil-telefono" name="telefono" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10 dígitos" value={form.telefono} onChange={cambiar} maxLength={10} />
          <p className="nota">El correo no se puede cambiar porque es con el que inicias sesión.</p>

          <div className="perfil-seccion">
            {conClave ? (
              <>
                <h4>Cambiar contraseña</h4>
                <input className="perfil-oculto" type="text" name="username" autoComplete="username" value={perfil.correo} readOnly tabIndex={-1} aria-hidden="true" />
                <label htmlFor="perfil-actual">Contraseña actual</label>
                <input id="perfil-actual" name="contrasenaActual" type="password" autoComplete="current-password" value={form.contrasenaActual} onChange={cambiar} maxLength={72} />
                <div className="dos-columnas">
                  <div>
                    <label htmlFor="perfil-nueva">Contraseña nueva</label>
                    <input id="perfil-nueva" name="contrasenaNueva" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={form.contrasenaNueva} onChange={cambiar} maxLength={72} />
                  </div>
                  <div>
                    <label htmlFor="perfil-confirmar">Repite la contraseña nueva</label>
                    <input id="perfil-confirmar" name="confirmar" type="password" autoComplete="new-password" value={form.confirmar} onChange={cambiar} maxLength={72} />
                  </div>
                </div>
                <button type="button" className="chico secundario perfil-quitar" onClick={quitarClave}>
                  No cambiar contraseña
                </button>
              </>
            ) : (
              <button type="button" className="chico secundario" onClick={() => setConClave(true)}>
                Cambiar contraseña
              </button>
            )}
          </div>

          {errorForm && <p className="error perfil-aviso">{errorForm}</p>}
          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" className="secundario" onClick={cancelar} disabled={guardando}>
            Cancelar
          </button>
        </form>
      ) : (
        <div className="tarjeta">
          <h3>Mis datos</h3>
          <dl className="perfil-datos">
            <div>
              <dt>Correo</dt>
              <dd>{perfil.correo}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{perfil.telefono || "Sin teléfono"}</dd>
            </div>
            <div>
              <dt>Miembro desde</dt>
              <dd>{fechaCorta(perfil.creadoEn)}</dd>
            </div>
            <div>
              <dt>Cuenta</dt>
              <dd>{perfil.activo === false ? "Desactivada" : "Activa"}</dd>
            </div>
          </dl>
        </div>
      )}

      {rol === "cliente" && !editando && (
        <div className="tarjeta">
          <h3>Mis tickets</h3>
          {!tickets ? (
            <p className="nota">Cargando...</p>
          ) : (
            <div className="perfil-numeros">
              <div>
                <b>{contar("pendiente")}</b>
                <span>Por pagar</span>
              </div>
              <div>
                <b>{contar("pagado") + contar("usado")}</b>
                <span>Pagados</span>
              </div>
              <div>
                <b>{contar("cancelado") + contar("vencido")}</b>
                <span>Cancelados o vencidos</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}