import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./NotFound.css";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="notfound-root">
      <h1 className="notfound-code">404</h1>
      <p className="notfound-msg">La pagina que buscas no existe.</p>
      <button className="notfound-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={18} /> Volver al inicio
      </button>
    </div>
  );
};

export default NotFound;
