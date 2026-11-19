import { formatoDinero, formatoFecha } from "../utils/formato";

export function Dato({ titulo, children }) {
  return (
    <div>
      <dt>{titulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function DatosPago({ pago, detallado = false, children }) {
  if (!pago && !children) return null;
  const conCambio = detallado && pago && pago.metodo.toLowerCase() !== "tarjeta";
  return (
    <dl className="datos-lista">
      {pago && (
        <>
          <Dato titulo="Pagado el">{formatoFecha(pago.creadoEn)}</Dato>
          <Dato titulo="Método">{pago.metodo}</Dato>
          <Dato titulo="Monto">{formatoDinero(pago.monto)}</Dato>
        </>
      )}
      {conCambio && (
        <>
          <Dato titulo="Recibido">{formatoDinero(pago.montoRecibido)}</Dato>
          <Dato titulo="Cambio">{formatoDinero(pago.cambio)}</Dato>
        </>
      )}
      {children}
    </dl>
  );
}