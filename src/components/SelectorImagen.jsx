import { useState } from "react";
import { imagenesApi } from "../api/servicios";
import { errorImagen } from "../utils/formato";
import ImagenApi from "./ImagenApi";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAXIMO_BYTES = 2 * 1024 * 1024; // 2 MB

/* Para los formularios de recinto (plano) y concierto (cartel).
-> imagenId: el id actual (o "" si no tiene). onChange(nuevoId | ""): avisa al formulario.*/
export default function SelectorImagen({ etiqueta, imagenId, onChange }) {
  const [version, setVersion] = useState(0); // para refrescar la vista previa al reemplazar
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function elegir(e) {
    const archivo = e.target.files[0];
    e.target.value = ""; /* permite volver a elegir el mismo archivo*/
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) return setError("Solo jpg, png o webp");
    if (archivo.size > MAXIMO_BYTES) return setError("La imagen pesa más de 2 MB");

    setSubiendo(true);
    setError("");
    try {
      if (imagenId) {
        await imagenesApi.reemplazar(imagenId, archivo); /* mismo id, otra imagen*/
        setVersion((v) => v + 1);
      } else {
        const nueva = await imagenesApi.subir(archivo);
        onChange(nueva.id);
      }
    } catch (err) {
      setError(errorImagen(err));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="selector-imagen">
      <ImagenApi id={imagenId || null} version={version} className="miniatura" alt={etiqueta} />
      <div>
        <p className="nota">{etiqueta} (jpg, png o webp, máximo 2 MB)</p>
        <label className="boton chico">
          {subiendo ? "Subiendo..." : imagenId ? "Cambiar imagen" : "Subir imagen"}
          <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={elegir} disabled={subiendo} />
        </label>
        {imagenId && (
          <button type="button" className="chico secundario" onClick={() => onChange("")}>
            Quitar
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}