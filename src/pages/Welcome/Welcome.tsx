import React from "react";
import logo from "../../assets/logo_ffaa-bg.png";
import "./Welcome.css";

const Welcome: React.FC = () => {
  return (
    <div className="welcome-root">
      <img src={logo} alt="Logo" className="welcome-logo" />
      <h1 className="welcome-title">Bienvenido al Sistema</h1>
      <p className="welcome-sub">Seleccioná una opción del menú lateral para comenzar.</p>
    </div>
  );
};

export default Welcome;
