import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Landmark,
  Users,
  BarChart2,
  Calendar,
  Settings,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import logo from "../../assets/logo_ffaa-bg.png";
import "./Sidebar.css";

interface SidebarProps {
  collapsed?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  secretario: "Secretario/a",
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role ?? "secretario";
  const isSecretario = role === "secretario";

  const toggleSubmenu = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/", label: "Inicio", icon: Home },
    ...(!isSecretario ? [
      { to: "/tesoreria/dashboard", label: "Tesorería", icon: Landmark, hasSubmenu: true },
    ] : []),
    { to: "/socios", label: "Socios", icon: Users },
    { to: "/personas", label: "Personas", icon: User },
    ...(!isSecretario ? [
      { to: "/reportes", label: "Reportes", icon: BarChart2 },
    ] : []),
    { to: "/calendario", label: "Calendario", icon: Calendar },
    ...(!isSecretario ? [
      { to: "/configuracion", label: "Configuración", icon: Settings },
    ] : []),
  ];

  const submenuLinks = [
    { to: "/tesoreria/movimientos", label: "Movimientos" },
    { to: "/tesoreria/nuevo-movimiento", label: "Nuevo ingreso" },
    { to: "/tesoreria/egresos/nuevo-egreso", label: "Nuevo egreso" },
    { to: "/tesoreria/historial-servicios", label: "Historial de servicios" },
    { to: "/tesoreria/servicios-externos", label: "Serv. Externos / Impuestos" },
    { to: "/tesoreria/cementerio", label: "Cementerio" },
  ];

  const displayName = user?.name || user?.email || "Administrador";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <img src={logo} alt="Logo FF.AA" className="sidebar-logo-img" />
        <div className="sidebar-brand-text">
          CÍRCULO DE SUBOFICIALES<br />RETIRADOS DE LAS<br />FUERZAS ARMADAS<br /> DE LA NACIÓN <br /> HONOR Y PATRIA
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
                  <span className="sidebar-label">{l.label}</span>
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
          <div className="sidebar-user-info">
            <div className="sidebar-username">{displayName}</div>
            <div className="sidebar-role">Rol: {ROLE_LABELS[role] ?? role}</div>
          </div>
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Cerrar sesion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
