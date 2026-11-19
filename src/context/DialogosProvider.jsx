import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { DialogosContext } from "./DialogosContext";

export function DialogosProvider({ children }) {
  const { pathname } = useLocation();
  const [abierta, setAbierta] = useState(null);
  const pendiente = useRef(null);

  const abrir = useCallback((tipo, opciones) => {
    return new Promise((resolve) => {
      if (pendiente.current) pendiente.current.resolve(pendiente.current.vacio);
      pendiente.current = { resolve, vacio: tipo === "texto" ? null : false };
      setAbierta({ tipo, opciones, ruta: window.location.pathname });
    });
  }, []);

  const resolver = useCallback((valor) => {
    const actual = pendiente.current;
    if (!actual) return;
    pendiente.current = null;
    setAbierta(null);
    actual.resolve(valor === undefined ? actual.vacio : valor);
  }, []);

  useEffect(() => {
    return () => {
      const actual = pendiente.current;
      if (!actual) return;
      pendiente.current = null;
      setAbierta(null);
      actual.resolve(actual.vacio);
    };
  }, [pathname]);

  const valor = useMemo(
    () => ({
      confirmar: (opciones) => abrir("confirmar", opciones),
      pedirTexto: (opciones) => abrir("texto", opciones),
    }),
    [abrir]
  );

  return (
    <DialogosContext.Provider value={valor}>
      {children}
      {abierta && abierta.ruta === pathname && <Ventana datos={abierta} onResultado={resolver} />}
    </DialogosContext.Provider>
  );
}

function Ventana({ datos, onResultado }) {
  const { tipo, opciones } = datos;
  const {
    titulo,
    mensaje,
    etiqueta,
    maxLength,
    peligro = false,
    confirmar = tipo === "texto" ? "Guardar" : "Sí, continuar",
    cancelar = "Volver",
  } = opciones;

  const id = useId();
  const dialogo = useRef(null);
  const campo = useRef(null);
  const botonCancelar = useRef(null);
  const [texto, setTexto] = useState(opciones.valor ?? "");

  useEffect(() => {
    const ventana = dialogo.current;
    const anterior = document.activeElement;
    if (!ventana.open) ventana.showModal();
    (campo.current ?? botonCancelar.current)?.focus();
    campo.current?.select();
    return () => {
      ventana.close();
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);

  function enviar(e) {
    e.preventDefault();
    if (tipo === "texto") {
      if (texto.trim()) onResultado(texto.trim());
      return;
    }
    onResultado(true);
  }

  function mantenerFoco(e) {
    if (e.key !== "Tab") return;
    const items = Array.from(dialogo.current.querySelectorAll("input, button:not(:disabled)"));
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  return (
    <dialog
      ref={dialogo}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={mensaje ? `${id}-mensaje` : undefined}
      onCancel={(e) => {
        e.preventDefault(); // Esc
        onResultado();
      }}
      onClick={(e) => {
        if (e.target === dialogo.current) onResultado(); // clic en el fondo oscuro
      }}
      onKeyDown={mantenerFoco}
    >
      <form onSubmit={enviar} className={`dialogo-cuerpo ${peligro ? "alerta" : ""}`}>
        <h2 id={`${id}-titulo`} className="dialogo-titulo">{titulo}</h2>
        {mensaje && <p id={`${id}-mensaje`} className="dialogo-texto">{mensaje}</p>}
        {tipo === "texto" && (
          <>
            <label htmlFor={`${id}-campo`}>{etiqueta}</label>
            <input
              id={`${id}-campo`}
              ref={campo}
              value={texto}
              maxLength={maxLength}
              autoComplete="off"
              onChange={(e) => setTexto(e.target.value)}
            />
          </>
        )}
        <div className="dialogo-botones">
          <button type="button" ref={botonCancelar} className="secundario" onClick={() => onResultado()}>
            {cancelar}
          </button>
          <button type="submit" className={peligro ? "peligro" : ""} disabled={tipo === "texto" && !texto.trim()}>
            {confirmar}
          </button>
        </div>
      </form>
    </dialog>
  );
}