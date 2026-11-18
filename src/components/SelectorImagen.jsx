import { useState } from "react";
import { imagenesApi } from "../api/servicios";
import { errorImagen, validarImagen } from "../utils/formato";
import ImagenApi from "./ImagenApi";

export default function SelectorImagen({ etiqueta, imagenId, onChange }) {
  const [version, setVersion] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function elegir(e) {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    const problema = validarImagen(archivo);
    if (problema) return setError(problema);

    setSubiendo(true);
    setError("");
    try {
      if (imagenId) {
        await imagenesApi.reemplazar(imagenId, archivo);
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