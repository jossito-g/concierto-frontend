import { useEffect, useState } from "react";
import { authApi } from "../api/servicios";
import { nombreRol } from "../utils/formato";
import { AuthContext } from "./AuthContext";

const normalizar = (u) => ({ ...u, rol: nombreRol(u) });

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const dato = JSON.parse(sessionStorage.getItem("usuario"));
      return dato && typeof dato === "object" && !Array.isArray(dato) ? dato : null;
    } catch {
      sessionStorage.removeItem("usuario");
      return null;
    }
  });

  useEffect(() => {
    if (!sessionStorage.getItem("token")) return;
    authApi
      .perfil()
      .then((perfil) => {
        const datos = normalizar(perfil);
        sessionStorage.setItem("usuario", JSON.stringify(datos));
        setUsuario(datos);
      })
      .catch(() => null);
  }, []);

  async function login(correo, contrasena) {
    const res = await authApi.login({ correo, contrasena });
    const token = res.token ?? res.access_token ?? res.accessToken;
    sessionStorage.setItem("token", token);

    const datos = normalizar(res.usuario ?? res.user ?? (await authApi.perfil()));
    sessionStorage.setItem("usuario", JSON.stringify(datos));
    setUsuario(datos);
    return datos;
  }

  function actualizarUsuario(perfil) {
    const datos = normalizar(perfil);
    sessionStorage.setItem("usuario", JSON.stringify(datos));
    setUsuario(datos);
  }

  async function logout() {
    await authApi.logout().catch(() => null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}