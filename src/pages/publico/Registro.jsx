import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/servicios";
import { mensajeError } from "../../utils/formato";
import AuthLayout from "../../components/AuthLayout";

const vacio = { nombre: "", apellido: "", correo: "", contrasena: "", telefono: "" };

export default function Registro() {
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  // Un solo onChange para todos los campos: usa el "name" del input
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validar() {
    if (!form.nombre.trim() || !form.apellido.trim()) return "Nombre y apellido son obligatorios";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) return "El correo no es válido";
    if (form.contrasena.length < 8 || form.contrasena.length > 72) return "La contraseña debe tener de 8 a 72 caracteres";
    if (form.telefono && !/^\d{10}$/.test(form.telefono)) return "El teléfono debe tener 10 dígitos";
    return "";
  }

  async function enviar(e) {
    e.preventDefault();
    const mensaje = validar();
    if (mensaje) return setError(mensaje);
    setError("");
    setEnviando(true);
    try {
      const body = { ...form };
      if (!body.telefono) delete body.telefono; /* esto es opcional si esta vacio no se manda */
      await authApi.registro(body);
      alert("Cuenta creada. Ahora inicia sesión.");
      navigate("/login");
    } catch (err) {
      setError(mensajeError(err)); 
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout pie={<>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></>}>
      <h1>Crear cuenta</h1>
      <p className="nota">Aparta asientos y págalos en taquilla con tu clave.</p>
      <form onSubmit={enviar} noValidate>
        <div className="dos-columnas">
          <div>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" autoComplete="given-name" value={form.nombre} onChange={cambiar} maxLength={100} />
          </div>
          <div>
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" name="apellido" autoComplete="family-name" value={form.apellido} onChange={cambiar} maxLength={100} />
          </div>
        </div>
        <label htmlFor="correo">Correo</label>
        <input id="correo" name="correo" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.correo} onChange={cambiar} maxLength={150} />
        <label htmlFor="contrasena">Contraseña</label>
        <input id="contrasena" name="contrasena" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={form.contrasena} onChange={cambiar} maxLength={72} />
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input id="telefono" name="telefono" inputMode="numeric" autoComplete="tel" placeholder="10 dígitos" value={form.telefono} onChange={cambiar} maxLength={10} />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? "Creando..." : "Crear cuenta"}</button>
      </form>
    </AuthLayout>
  );
}
