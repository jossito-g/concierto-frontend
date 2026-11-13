import { useEffect, useState } from "react";
import { recintosApi, conciertosApi, artistasApi, imagenesApi } from "../../api/servicios";
import { errorImagen, mensajeError } from "../../utils/formato";
import ImagenApi from "../../components/ImagenApi";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAXIMO_BYTES = 2 * 1024 * 1024;

export default function Imagenes() {
  const [usos, setUsos] = useState([]);
  const [versiones, setVersiones] = useState({});
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    Promise.all([recintosApi.listar(), conciertosApi.listar(), artistasApi.listar()])
      .then(([recintos, conciertos, artistas]) => {
        setUsos([
          ...recintos.filter((r) => r.imagenId).map((r) => ({ imagenId: r.imagenId, tipo: "Plano", nombre: r.nombre })),
          ...conciertos.filter((c) => c.imagenId).map((c) => ({ imagenId: c.imagenId, tipo: "Cartel", nombre: c.nombre })),
          ...artistas.filter((a) => a.imagenId).map((a) => ({ imagenId: a.imagenId, tipo: "Foto", nombre: a.nombre })),
        ]);
      })
      .catch((err) => setError(mensajeError(err)));
  }, []);

  async function reemplazar(e, imagenId) {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) return setError("Solo jpg, png o webp");
    if (archivo.size > MAXIMO_BYTES) return setError("La imagen pesa más de 2 MB");
    try {
      await imagenesApi.reemplazar(imagenId, archivo);
      setVersiones({ ...versiones, [imagenId]: (versiones[imagenId] ?? 0) + 1 });
      setError("");
      setAviso(`Imagen #${imagenId} reemplazada`);
    } catch (err) {
      setError(errorImagen(err));
    }
  }

  return (
    <div>
      <h1>Imágenes</h1>
      <p className="nota">
        Planos de recintos, carteles de conciertos y fotos de artistas. Para ponerle o quitarle la imagen a uno, edítalo en Recintos, Conciertos o Artistas.
      </p>
      {error && <p className="error">{error}</p>}
      {aviso && !error && <p className="exito">✅ {aviso}</p>}
      {usos.length === 0 && !error && <p className="nota">Todavía ningún recinto, concierto ni artista tiene imagen.</p>}

      <div className="rejilla">
        {usos.map((u) => (
          <div key={`${u.tipo}-${u.nombre}-${u.imagenId}`} className="tarjeta">
            <ImagenApi id={u.imagenId} version={versiones[u.imagenId] ?? 0} className="miniatura" alt={u.nombre} />
            <p><b>{u.tipo}:</b> {u.nombre}</p>
            <p className="nota">Imagen #{u.imagenId}</p>
            <label className="boton chico">
              Reemplazar
              <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => reemplazar(e, u.imagenId)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}