import "../styles/auth.css";
import logo from "../assets/tikstar-logo.png";

export default function AuthLayout({ children, pie }) {
  return (
    <div className="auth">
      <span className="auth-luz uno" aria-hidden="true" />
      <span className="auth-luz dos" aria-hidden="true" />
      <span className="auth-luz tres" aria-hidden="true" />

      <img src={logo} alt="TikStar" className="auth-logo" />
      <div className="auth-tarjeta">{children}</div>
      <p className="auth-cambio">{pie}</p>
    </div>
  );
}
