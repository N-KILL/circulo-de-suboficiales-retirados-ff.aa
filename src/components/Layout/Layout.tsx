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
    // Definimos los títulos y subtítulos según la ruta
    switch (path) {
      case "/tesoreria":
        return {
          title: "Tesorería",
          subtitle: "Accedé a los módulos de gestión financiera del club.",
          breadcrumbs: ["Tesorería"],
        };
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
          breadcrumbs: ["Tesorería", "Ingresos", "Nuevo ingreso"],
        };
      case "/tesoreria/ingresos/nuevo-egreso":
        return {
          title: "Nuevo egreso",
          subtitle: "Registrar un nuevo egreso del club",
          breadcrumbs: ["Tesorería", "Egresos", "Nuevo egreso"],
        };
      case "/tesoreria/ingresos/nuevo-pago":
        return {
          title: "Nuevo Pago",
          subtitle: "Registrar un nuevo ingreso al club",
          breadcrumbs: ["Tesorería", "Ingresos", "Nuevo Pago"],
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
          title: "¡Bienvenido, Administrador!",
          subtitle: "Resumen general de la tesorería del club.",
        };
      default:
        return {
          title: "¡Bienvenido, Administrador!",
        };
    }
  };

  const { title, subtitle, breadcrumbs } = getHeaderContent(location.pathname);

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
      </div>
    </div>
  );
};

export default Layout;
