import { Routes, Route, Navigate } from "react-router-dom";
import Menu from "./components/Menu";
import RutaProtegida from "./components/RutaProtegida";

import Login from "./pages/publico/Login";
import Registro from "./pages/publico/Registro";
import Perfil from "./pages/Perfil";

import Cartelera from "./pages/cliente/Cartelera";
import DetalleConcierto from "./pages/cliente/DetalleConcierto";
import MisTickets from "./pages/cliente/MisTickets";

import Usuarios from "./pages/admin/Usuarios";
import Catalogos from "./pages/admin/Catalogos";
import Artistas from "./pages/admin/Artistas";
import Recintos from "./pages/admin/Recintos";
import Conciertos from "./pages/admin/Conciertos";
import Imagenes from "./pages/admin/Imagenes";
import Cobrar from "./pages/admin/Cobrar";
import TicketsAdmin from "./pages/admin/TicketsAdmin";
import Reportes from "./pages/admin/Reportes";

const ADMIN = ["administrador"];
const CLIENTE = ["cliente"];
const TODOS = ["administrador", "cliente"];

export default function App() {
  return (
    <>
      <Menu />
      <main className="contenido">
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          
          <Route path="/perfil" element={<RutaProtegida roles={TODOS}><Perfil /></RutaProtegida>} />
          <Route path="/cartelera" element={<RutaProtegida roles={TODOS}><Cartelera /></RutaProtegida>} />
          <Route path="/conciertos/:id" element={<RutaProtegida roles={TODOS}><DetalleConcierto /></RutaProtegida>} />

          
          <Route path="/mis-tickets" element={<RutaProtegida roles={CLIENTE}><MisTickets /></RutaProtegida>} />

          
          <Route path="/admin/usuarios" element={<RutaProtegida roles={ADMIN}><Usuarios /></RutaProtegida>} />
          <Route path="/admin/catalogos" element={<RutaProtegida roles={ADMIN}><Catalogos /></RutaProtegida>} />
          <Route path="/admin/artistas" element={<RutaProtegida roles={ADMIN}><Artistas /></RutaProtegida>} />
          <Route path="/admin/recintos" element={<RutaProtegida roles={ADMIN}><Recintos /></RutaProtegida>} />
          <Route path="/admin/conciertos" element={<RutaProtegida roles={ADMIN}><Conciertos /></RutaProtegida>} />
          <Route path="/admin/imagenes" element={<RutaProtegida roles={ADMIN}><Imagenes /></RutaProtegida>} />
          <Route path="/admin/cobrar" element={<RutaProtegida roles={ADMIN}><Cobrar /></RutaProtegida>} />
          <Route path="/admin/tickets" element={<RutaProtegida roles={ADMIN}><TicketsAdmin /></RutaProtegida>} />
          <Route path="/admin/reportes" element={<RutaProtegida roles={ADMIN}><Reportes /></RutaProtegida>} />
        </Routes>
      </main>
    </>
  );
}