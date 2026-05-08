import React from "react";
import { Menu, Calendar, Bell } from "lucide-react";
import argFlag from "../../../../assets/arg_flag.webp";
import "./TopBar.css";

const TopBar: React.FC = () => {
  return (
    <header className="topbar">
      {/* Background Graphic - Real Image */}
      <img 
        src={argFlag}
        alt="Fondo Bandera Argentina"
        className="topbar-bg-image"
      />

      <div className="topbar-content">
        <Menu size={24} className="topbar-menu-icon" />
        <div>
          <h2 className="topbar-title">¡Bienvenido, Administrador!</h2>
          <div className="muted topbar-subtitle">Resumen general de la tesorería del club.</div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-date">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="topbar-bell-wrapper">
          <Bell size={20} className="topbar-bell-icon" />
          <div className="topbar-bell-indicator" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
