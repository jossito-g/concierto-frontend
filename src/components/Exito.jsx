import { IconoCheck } from "./Iconos";

export default function Exito({ children }) {
  return (
    <p className="exito" role="status">
      <IconoCheck tam={20} />
      <span>{children}</span>
    </p>
  );
}