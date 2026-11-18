import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { mensajeError } from "../../utils/formato";
import AuthLayout from "../../components/AuthLayout";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function enviar(e) {
    e.preventDefault();
    if (!correo.trim() || !contrasena) return setError("Escribe tu correo y tu contraseña");
    setError("");
    setEnviando(true);
    try {
      const usuario = await login(correo.trim(), contrasena);
      navigate(usuario.rol === "administrador" ? "/admin/usuarios" : "/cartelera");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout pie={<>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></>}>
      <h1>Iniciar sesión</h1>
      <p className="nota">Entra para ver la cartelera y apartar tus asientos.</p>
      {params.get("cerrada") && !error && (
        <p className="error">Tu sesión se cerró porque se venció o entraste desde otro dispositivo. Inicia sesión otra vez.</p>
      )}
      <form onSubmit={enviar} noValidate>
        <label htmlFor="correo">Correo</label>
        <input id="correo" type="email" autoComplete="email" placeholder="tu@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />

        <label htmlFor="contrasena">Contraseña</label>
        <input id="contrasena" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>
      </form>
    </AuthLayout>
  );
}