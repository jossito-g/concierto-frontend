export default function EncabezadoPagina({ titulo, sinLinea = false, children }) {
  return (
    <header className={`pagina-encabezado${sinLinea ? " sin-linea" : ""}`}>
      <h1>{titulo}</h1>
      {children && <div className="pagina-lado">{children}</div>}
    </header>
  );
}