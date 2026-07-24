import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import logo from "../../assets/logo_ffaa-bg.png";
import notFoundIllustration from "../../assets/not_found.png";
import "./NotFound.css";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-root">
      <h1 className="notfound-code">404</h1>

      <div className="notfound-logo-wrap" aria-hidden="true">
        <span className="notfound-line" />
        <img className="notfound-logo" src={logo} alt="Logo FFAA" />
        <span className="notfound-line" />
      </div>

      <h2 className="notfound-msg">Página no encontrada</h2>
      <p className="notfound-description">
        Lo sentimos, la página que estas buscando 
      </p>
      <p className="notfound-description">
        no existe o ha sido movida.
      </p>

      <img
        className="notfound-illustration"
        src={notFoundIllustration}
        alt="Ilustración de página no encontrada"
      />

      <button className="notfound-btn" onClick={() => navigate("/")}>
        <Home size={18} /> Volver al inicio
      </button>
    </div>
  );
};

export default NotFound;
