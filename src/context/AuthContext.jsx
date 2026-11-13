import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/servicios";
import { nombreRol } from "../utils/formato";

const AuthContext = createContext(null);

const normalizar = (u) => ({ ...u, rol: nombreRol(u) });

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  });

  
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authApi
      .perfil()
      .then((perfil) => {
        const datos = normalizar(perfil);
        localStorage.setItem("usuario", JSON.stringify(datos));
        setUsuario(datos);
      })
      .catch(() => {});
  }, []);

  async function login(correo, contrasena) {
    const res = await authApi.login({ correo, contrasena });
    const token = res.token ?? res.access_token ?? res.accessToken;
    localStorage.setItem("token", token);

    const datos = normalizar(res.usuario ?? res.user ?? (await authApi.perfil()));
    localStorage.setItem("usuario", JSON.stringify(datos));
    setUsuario(datos);
    return datos;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
    }
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);