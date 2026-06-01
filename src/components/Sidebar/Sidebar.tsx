import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Landmark,
  Users,
  BarChart2,
  FileText,
  Settings,
  ChevronDown,
  User,
} from "lucide-react";
import logo from "../../assets/logo_ffaa-bg.png";
import "./Sidebar.css";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const links = [
    { to: "/", label: "Inicio", icon: Home },
    { to: "/tesoreria", label: "Tesorería", icon: Landmark, hasSubmenu: true },
    { to: "/socios", label: "Socios", icon: Users },
    { to: "/reportes", label: "Reportes", icon: BarChart2 },
    { to: "/documentos", label: "Documentos", icon: FileText },
    { to: "/configuracion", label: "Configuración", icon: Settings },
  ];

  const submenuLinks = [
    { to: "/tesoreria/movimientos", label: "Movimientos" },
    { to: "/tesoreria/ingresos/nuevo-pago", label: "Nuevo Ingreso" },
    { to: "/tesoreria/egresos/nuevo-egreso", label: "Nuevo Egreso" },
    { to: "/tesoreria/transferencias", label: "Transferencias" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <img src={logo} alt="Logo FF.AA" className="sidebar-logo-img" />
        <div className="sidebar-brand-text">
          CLUB DE MIEMBROS<br />RETIRADOS DE LAS<br />FUERZAS ARMADAS<br />ARGENTINAS
        </div>
      </div>

      <nav className="sidebar-nav custom-scroll">
        {links.map((l) => (
          <React.Fragment key={l.to}>
            <div className="sidebar-item">
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <div className="sidebar-link-inner">
                  <l.icon size={20} />
                  {l.label}
                </div>
              </NavLink>
              {l.hasSubmenu && (
                <button
                  className={`sidebar-chevron ${openSubmenus[l.to] ? "open" : ""}`}
                  onClick={(e) => toggleSubmenu(l.to, e)}
                  aria-label="Expandir submenú"
                >
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {l.hasSubmenu && (
              <div
                className={`sidebar-submenu ${openSubmenus[l.to] ? "open" : ""}`}
              >
                {submenuLinks.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      `sidebar-submenu-link ${isActive ? "active-submenu" : ""}`
                    }
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-inner">
          <div className="sidebar-avatar">
            <User size={20} color="#fff" />
          </div>
          <div>
            <div className="sidebar-username">Administrador</div>
            <div className="sidebar-role">Rol: Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
