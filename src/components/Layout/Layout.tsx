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
    switch (path) {
      case "/tesoreria/movimientos":
        return {
          title: "Movimientos",
          subtitle:
            "Consulta todos los movimientos registrados en la tesorería.",
          breadcrumbs: ["Tesorería", "Movimientos"],
        };
      case "/tesoreria/ingresos/nuevo-pago":
        return {
          title: "Nuevo ingreso",
          subtitle: "Registrar un nuevo ingreso al club",
          breadcrumbs: ["Tesorería", "Nuevo ingreso"],
        };
      case "/tesoreria/nuevo-movimiento":
        return {
          title: "Nuevo movimiento",
          subtitle: "Seleccioná el tipo de movimiento a registrar.",
          breadcrumbs: ["Tesorería", "Nuevo movimiento"],
        };
      case "/tesoreria/egresos/nuevo-egreso":
        return {
          title: "Nuevo egreso",
          subtitle: "Registrar un nuevo egreso del club",
          breadcrumbs: ["Tesorería", "Nuevo egreso"],
        };
      case "/tesoreria/dashboard":
        return {
          title: "Dashboard Tesorería",
          subtitle: "Resumen general del estado financiero del club.",
          breadcrumbs: ["Tesorería", "Dashboard"],
        };
      case "/socios":
        return {
          title: "Socios",
          subtitle: "Gestioná la información de los socios del club.",
        };
      case "/socios/nuevo":
        return {
          title: "Nuevo Socio",
          subtitle: "Registrar un nuevo socio en el club.",
          breadcrumbs: ["Socios", "Nuevo Socio"],
        };
      case "/":
        return {
          title: " ",
          subtitle: " ",
        };
      default:
        return {
          title: "Sistema de Gestión",
        };
    }
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
                Club de Miembros Retirados de las Fuerzas Armadas Argentinas
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
