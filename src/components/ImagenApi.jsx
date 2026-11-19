import { useEffect, useState } from "react";
import { imagenesApi } from "../api/servicios";
import { IconoMicrofono } from "./Iconos";

export default function ImagenApi({ id, version = 0, className, alt = "" }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!id) return;
    let activo = true;
    let creada = null;
    imagenesApi
      .archivo(id)
      .then((blob) => {
        creada = URL.createObjectURL(blob);
        if (activo) setUrl(creada);
      })
      .catch(() => activo && setUrl(null));
    return () => {
      activo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [id, version]);

  if (!id || !url) {
    return (
      <div className={`${className} sin-imagen`} aria-hidden="true">
        <IconoMicrofono />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} />;
}