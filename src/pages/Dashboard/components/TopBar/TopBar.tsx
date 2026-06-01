import React from "react";
import { Menu, Calendar, Bell, ChevronRight } from "lucide-react";
import "./TopBar.css";

interface TopBarProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, title, subtitle, breadcrumbs }) => {
  return (
    <header className="topbar">
      <div className="topbar-top">
        <button
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Alternar sidebar"
        >
          <Menu size={24} />
        </button>

        <div className="topbar-actions">
          <div className="topbar-date">
            <Calendar size={18} />
            <span>{new Date().toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="topbar-bell-wrapper">
            <Bell size={20} className="topbar-bell-icon" />
            <div className="topbar-bell-indicator" />
          </div>
        </div>
      </div>

      <div className="topbar-header-info">
        <h2 className="topbar-title">{title || "¡Bienvenido, Administrador!"}</h2>
        <div className="muted topbar-subtitle">
          {subtitle || "Resumen general de la tesorería del club."}
        </div>
        
        {breadcrumbs && (
          <div className="topbar-breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item}>
                <span className={index === breadcrumbs.length - 1 ? "breadcrumb-active" : ""}>
                  {item}
                </span>
                {index < breadcrumbs.length - 1 && <ChevronRight size={14} className="breadcrumb-separator" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
