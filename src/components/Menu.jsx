import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/tikstar-horizontal.png";

const opcionesCliente = [
  { ruta: "/cartelera", texto: "Cartelera" },
  { ruta: "/mis-tickets", texto: "Mis tickets" },
  { ruta: "/perfil", texto: "Perfil" },
];

const opcionesAdmin = [
  { ruta: "/admin/reportes", texto: "Reportes" },
  { ruta: "/admin/usuarios", texto: "Usuarios" },
  { ruta: "/admin/catalogos", texto: "Catálogos" },
  { ruta: "/admin/artistas", texto: "Artistas" },
  { ruta: "/admin/recintos", texto: "Recintos" },
  { ruta: "/admin/conciertos", texto: "Conciertos" },
  { ruta: "/admin/imagenes", texto: "Imágenes" },
  { ruta: "/admin/cobrar", texto: "Cobrar" },
  { ruta: "/admin/tickets", texto: "Tickets" },
  { ruta: "/cartelera", texto: "Cartelera" },
  { ruta: "/perfil", texto: "Perfil" },
];

export default function Menu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  const opciones = usuario.rol === "administrador" ? opcionesAdmin : opcionesCliente;

  async function salir() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="menu">
      <span className="menu-logo"><img src={logo} alt="TikStar" /></span>
      {opciones.map((o) => (
        <NavLink key={o.ruta} to={o.ruta}>{o.texto}</NavLink>
      ))}
      <span className="menu-usuario">{usuario.nombre}</span>
      <button onClick={salir}>Cerrar sesión</button>
    </nav>
  );
}