import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconoCerrar, IconoMenu } from "./Iconos";
import logo from "../assets/tikstar-horizontal.png";

const opcionesCliente = [
  { ruta: "/cartelera", texto: "Cartelera" },
  { ruta: "/mis-tickets", texto: "Mis tickets" },
  { ruta: "/perfil", texto: "Perfil" },
];

const gruposAdmin = [
  {
    titulo: "Operación",
    opciones: [
      { ruta: "/admin/reportes", texto: "Reportes" },
      { ruta: "/admin/tickets", texto: "Tickets" },
      { ruta: "/admin/checkin", texto: "Check-in" },
      { ruta: "/admin/cobrar", texto: "Cobrar" },
    ],
  },
  {
    titulo: "Catálogo",
    opciones: [
      { ruta: "/admin/conciertos", texto: "Conciertos" },
      { ruta: "/admin/artistas", texto: "Artistas" },
      { ruta: "/admin/recintos", texto: "Recintos" },
      { ruta: "/admin/catalogos", texto: "Catálogos" },
      { ruta: "/admin/imagenes", texto: "Imágenes" },
    ],
  },
  {
    titulo: "Sistema",
    opciones: [{ ruta: "/admin/usuarios", texto: "Usuarios" }],
  },
];

const enlacesPie = [
  { ruta: "/cartelera", texto: "Cartelera" },
  { ruta: "/perfil", texto: "Perfil" },
];

function BarraCliente({ usuario, salir }) {
  return (
    <header className="cabecera">
      <div className="cabecera-interior">
        <Link to="/" className="cabecera-logo" aria-label="TikStar, inicio">
          <img src={logo} alt="TikStar" />
        </Link>
        <nav className="menu" aria-label="Principal">
          {opcionesCliente.map((o) => (
            <NavLink key={o.ruta} to={o.ruta}>{o.texto}</NavLink>
          ))}
        </nav>
        <div className="cabecera-sesion">
          <span className="menu-usuario">{usuario.nombre}</span>
          <button type="button" className="boton-sesion" onClick={salir}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
}

function MenuLateral({ usuario, salir }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <aside className={`lateral${abierto ? " abierta" : ""}`}>
      <div className="lateral-cabecera">
        <Link to="/" className="lateral-logo" aria-label="TikStar, inicio">
          <img src={logo} alt="TikStar" />
        </Link>
        <button
          type="button"
          className="boton-sesion lateral-boton"
          aria-expanded={abierto}
          aria-controls="menu-admin"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <IconoCerrar tam={18} /> : <IconoMenu tam={18} />}
          {abierto ? "Cerrar menú" : "Menú"}
        </button>
      </div>

      <nav
        className="menu"
        id="menu-admin"
        aria-label="Administración"
        onClick={(e) => {
          if (e.target.closest("a")) setAbierto(false);
        }}
      >
        {gruposAdmin.map((grupo) => (
          <div key={grupo.titulo} className="menu-grupo-bloque">
            <p className="menu-grupo">{grupo.titulo}</p>
            {grupo.opciones.map((o) => (
              <NavLink key={o.ruta} to={o.ruta}>{o.texto}</NavLink>
            ))}
          </div>
        ))}

        <div className="menu-pie">
          <div className="menu-enlaces">
            {enlacesPie.map((o) => (
              <NavLink key={o.ruta} to={o.ruta}>{o.texto}</NavLink>
            ))}
          </div>
          <div className="menu-sesion">
            <span className="menu-usuario">{usuario.nombre}</span>
            <button type="button" className="boton-sesion" onClick={salir}>Cerrar sesión</button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export default function Menu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  async function salir() {
    await logout();
    navigate("/login");
  }

  return usuario.rol === "administrador" ? (
    <MenuLateral usuario={usuario} salir={salir} />
  ) : (
    <BarraCliente usuario={usuario} salir={salir} />
  );
}