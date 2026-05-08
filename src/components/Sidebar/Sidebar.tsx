import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Landmark, Users, BarChart2, FileText, Settings, ChevronDown, Shield, User } from "lucide-react";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
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
    { to: "/tesoreria/ingresos", label: "Ingresos" },
    { to: "/tesoreria/egresos", label: "Egresos" },
    { to: "/tesoreria/transferencias", label: "Transferencias" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ padding: "16px", borderRadius: "50%", background: "linear-gradient(145deg, #1f3f77, #12284c)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
          <Shield size={48} color="#eab308" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", lineHeight: "1.4", textTransform: "uppercase" }}>
          CLUB DE MIEMBROS<br />RETIRADOS DE LAS<br />FUERZAS ARMADAS<br />ARGENTINAS
        </div>
      </div>

      <nav style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", marginTop: "16px" }}>
        {links.map((l) => (
          <React.Fragment key={l.to}>
            <NavLink
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "8px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <l.icon size={20} />
                {l.label}
              </div>
              {l.hasSubmenu && <ChevronDown size={16} />}
            </NavLink>
            
            {l.hasSubmenu && (
              <div style={{ display: "flex", flexDirection: "column", marginLeft: "16px", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "16px", marginTop: "4px", marginBottom: "8px", gap: "8px" }}>
                {submenuLinks.map(sub => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "13px", padding: "4px 0", display: "block" }}
                    className={({ isActive }) => isActive ? "active-submenu" : ""}
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Administrador</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Rol: Administrador</div>
          </div>
        </div>
        <ChevronDown size={18} color="rgba(255,255,255,0.6)" />
      </div>
    </aside>
  );
};

export default Sidebar;
