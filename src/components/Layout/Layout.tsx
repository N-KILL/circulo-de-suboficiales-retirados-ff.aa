import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../Sidebar/Sidebar";
import TopBar from "../../pages/Dashboard/components/TopBar/TopBar";
import argFlag from "../../assets/flag.png";
import logo from "../../assets/logo_ffaa-bg.png";
import "./Layout.css";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const getHeaderContent = (path: string) => {
    if (path === "/tesoreria/movimientos") return { title: "Movimientos", subtitle: "Consulta todos los movimientos registrados en la tesorería.", breadcrumbs: ["Tesorería", "Movimientos"] };

    if (path === "/tesoreria/nuevo-movimiento") return { title: "Nuevo ingreso", subtitle: "Registrá un nuevo ingreso en caja chica o banco.", breadcrumbs: ["Tesorería", "Nuevo ingreso"] };
    if (path === "/tesoreria/egresos/nuevo-egreso") return { title: "Nuevo egreso", subtitle: "Registrar un nuevo egreso del club", breadcrumbs: ["Tesorería", "Nuevo egreso"] };
    if (path === "/tesoreria/dashboard") return { title: "Dashboard Tesorería", subtitle: "Resumen general del estado financiero del club.", breadcrumbs: ["Tesorería", "Dashboard"] };
    if (path === "/socios") return { title: "Socios", subtitle: "Gestioná la información de los socios del club." };
    if (path === "/socios/nuevo") return { title: "Nuevo Socio", subtitle: "Registrar un nuevo socio en el club.", breadcrumbs: ["Socios", "Nuevo Socio"] };
    if (path.startsWith("/socios/detalle/")) return { title: "Detalle del Socio", subtitle: "Información y cuotas del socio.", breadcrumbs: ["Socios", "Detalle"] };
    if (path.startsWith("/socios/editar/")) return { title: "Editar Socio", subtitle: "Modificar los datos del socio.", breadcrumbs: ["Socios", "Editar"] };
    if (path === "/personas") return { title: "Personas", subtitle: "Gestioná la información de las personas." };
    if (path === "/personas/nuevo") return { title: "Nueva Persona", subtitle: "Registrar una nueva persona.", breadcrumbs: ["Personas", "Nueva Persona"] };
    if (path.startsWith("/personas/detalle/")) return { title: "Detalle de Persona", subtitle: "Información y cuotas de cementerio.", breadcrumbs: ["Personas", "Detalle"] };
    if (path.startsWith("/personas/editar/")) return { title: "Editar Persona", subtitle: "Modificar los datos de la persona.", breadcrumbs: ["Personas", "Editar"] };
    if (path === "/") return { title: " ", subtitle: " " };
    return { title: "Sistema de Gestión" };
  };

  const { title, subtitle, breadcrumbs } = getHeaderContent(location.pathname);
const isHome = location.pathname === "/";

  return (
    <div className="app-root">
      <Sidebar collapsed={!sidebarOpen} />
      <div className="main-wrapper">
        <img
          src={argFlag}
          alt="Fondo Bandera Argentina"
          className="layout-bg-image"
        />
        <TopBar
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="content">
          <Outlet />
        </main>
        {!isHome && (
          <footer className="layout-footer">
            <div className="footer-left">
              <img src={logo} alt="Logo" className="footer-logo-img" />
              <span>
                Circulo de Suboficiales Retirados de las Fuerzas Armadas de la Nación "Honor y Patria"
              </span>
            </div>
            <div className="footer-right">
              <span>Sistema de Gestión - Versión 0.0.1</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Layout;
