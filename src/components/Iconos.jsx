function Icono({ tam = 16, trazo = 2, className = "", children }) {
  return (
    <svg
      className={`icono ${className}`.trim()}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trazo}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconoCalendario(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icono>
  );
}

export function IconoLugar(props) {
  return (
    <Icono {...props}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icono>
  );
}

export function IconoReloj(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icono>
  );
}

export function IconoTarjeta(props) {
  return (
    <Icono {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </Icono>
  );
}

export function IconoCheck(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3L16.5 9" />
    </Icono>
  );
}

export function IconoMicrofono(props) {
  return (
    <Icono {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </Icono>
  );
}

export function IconoMenu(props) {
  return (
    <Icono {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icono>
  );
}

export function IconoCerrar(props) {
  return (
    <Icono {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icono>
  );
}