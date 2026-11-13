import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { carteleraApi, ciudadesApi, estadosApi, generosApi, artistasApi } from "../../api/servicios";
import { formatoFecha, mensajeError, nombreCiudad, buscarPorId } from "../../utils/formato";
import ImagenApi from "../../components/ImagenApi";

export default function Cartelera() {
  const [conciertos, setConciertos] = useState([]);
  const [catalogos, setCatalogos] = useState({ ciudades: [], estados: [], generos: [], artistas: [] });
  const [filtros, setFiltros] = useState({ ciudadId: "", generoId: "", artistaId: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([ciudadesApi.listar(), estadosApi.listar(), generosApi.listar(), artistasApi.listar()])
      .then(([ciudades, estados, generos, artistas]) => setCatalogos({ ciudades, estados, generos, artistas }))
      .catch((err) => setError(mensajeError(err)));
  }, []);

  
  useEffect(() => {
    carteleraApi
      .listar(filtros)
      .then((lista) => {
        setConciertos(lista);
        setError("");
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const activos = (lista) => lista.filter((x) => x.activo !== false);

  return (
    <div>
      <h1>Cartelera</h1>

      <div className="filtros">
        <select name="ciudadId" value={filtros.ciudadId} onChange={cambiar}>
          <option value="">Todas las ciudades</option>
          {activos(catalogos.ciudades).map((c) => <option key={c.id} value={c.id}>{nombreCiudad(c, catalogos.estados)}</option>)}
        </select>
        <select name="generoId" value={filtros.generoId} onChange={cambiar}>
          <option value="">Todos los géneros</option>
          {activos(catalogos.generos).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
        <select name="artistaId" value={filtros.artistaId} onChange={cambiar}>
          <option value="">Todos los artistas</option>
          {activos(catalogos.artistas).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {cargando && <p className="nota">Cargando...</p>}
      {!cargando && conciertos.length === 0 && <p>No hay conciertos con esos filtros.</p>}

      <div className="rejilla">
        {conciertos.map((c) => {
          const recinto = c.recinto;
          const ciudad = recinto?.ciudad ?? c.ciudad ?? buscarPorId(catalogos.ciudades, recinto?.ciudadId);
          return (
            <div key={c.id} className="tarjeta">
              <ImagenApi id={c.imagenId} className="miniatura" alt={c.nombre} />
              <h3>{c.nombre}</h3>
              {c.artistas?.length > 0 && <p>{c.artistas.map((a) => a.nombre ?? a.artista?.nombre).join(", ")}</p>}
              <p className="nota">{formatoFecha(c.fecha)}</p>
              {recinto && <p className="nota">{recinto.nombre} · {nombreCiudad(ciudad, catalogos.estados)}</p>}
              <Link to={`/conciertos/${c.id}`} className="boton">Ver detalle</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
