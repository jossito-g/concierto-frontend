import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { carteleraApi, ciudadesApi, estadosApi, generosApi, artistasApi } from "../../api/servicios";
import { formatoFecha, mensajeError, nombreCiudad, buscarPorId, partesFecha } from "../../utils/formato";
import ImagenApi from "../../components/ImagenApi";
import EncabezadoPagina from "../../components/EncabezadoPagina";
import { IconoCalendario, IconoLugar } from "../../components/Iconos";

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
      <EncabezadoPagina titulo="Cartelera" sinLinea>
        {!cargando && (
          <p className="pagina-dato">
            {conciertos.length} {conciertos.length === 1 ? "concierto" : "conciertos"}
          </p>
        )}
      </EncabezadoPagina>

      <div className="filtros-barra">
        <div className="campo-filtro">
          <label htmlFor="filtro-ciudad">Ciudad</label>
          <select id="filtro-ciudad" name="ciudadId" value={filtros.ciudadId} onChange={cambiar}>
            <option value="">Todas las ciudades</option>
            {activos(catalogos.ciudades).map((c) => <option key={c.id} value={c.id}>{nombreCiudad(c, catalogos.estados)}</option>)}
          </select>
        </div>
        <div className="campo-filtro">
          <label htmlFor="filtro-genero">Género</label>
          <select id="filtro-genero" name="generoId" value={filtros.generoId} onChange={cambiar}>
            <option value="">Todos los géneros</option>
            {activos(catalogos.generos).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div className="campo-filtro">
          <label htmlFor="filtro-artista">Artista</label>
          <select id="filtro-artista" name="artistaId" value={filtros.artistaId} onChange={cambiar}>
            <option value="">Todos los artistas</option>
            {activos(catalogos.artistas).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {cargando && <p className="nota">Cargando...</p>}
      {!cargando && conciertos.length === 0 && <p>No hay conciertos con esos filtros.</p>}

      <div className="cartelera">
        {conciertos.map((c) => {
          const recinto = c.recinto;
          const ciudad = recinto?.ciudad ?? c.ciudad ?? buscarPorId(catalogos.ciudades, recinto?.ciudadId);
          const { dia, mes } = partesFecha(c.fecha);
          return (
            <article key={c.id} className="concierto">
              <div className="concierto-imagen">
                <ImagenApi id={c.imagenId} className="miniatura" alt={c.nombre} />
                <div className="concierto-fecha" aria-hidden="true">
                  <span className="dia">{dia}</span>
                  <span className="mes">{mes}</span>
                </div>
              </div>
              <div className="concierto-cuerpo">
                <h2>{c.nombre}</h2>
                {c.artistas?.length > 0 && (
                  <p className="concierto-artista">{c.artistas.map((a) => a.nombre ?? a.artista?.nombre).join(", ")}</p>
                )}
                <div className="datos">
                  <p className="dato">
                    <IconoCalendario />
                    <span className="mono">{formatoFecha(c.fecha)}</span>
                  </p>
                  {recinto && (
                    <p className="dato">
                      <IconoLugar />
                      <span>{recinto.nombre} · {nombreCiudad(ciudad, catalogos.estados)}</span>
                    </p>
                  )}
                </div>
                <Link to={`/conciertos/${c.id}`} className="boton">Ver detalle</Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}