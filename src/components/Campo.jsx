import { useState } from "react";

// Input con icono a la izquierda. Si es contraseña, trae boton para mostrarla u ocultarla.
export default function Campo({ id, label, icono, ayuda, type = "text", ...props }) {
  const [ver, setVer] = useState(false);
  const esContrasena = type === "password";

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="campo">
        <span className="campo-icono" aria-hidden="true">{icono}</span>
        <input id={id} type={esContrasena && ver ? "text" : type} {...props} />
        {esContrasena && (
          <button type="button" className="ver" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {ver ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      {ayuda && <p className="campo-ayuda">{ayuda}</p>}
    </div>
  );
}
