import React from "react";
import { useEffect } from "react";
import StatCard from "./components/StatCard/StatCard";
import Transactions from "./components/Transactions/Transactions";
import QuickActions from "./components/QuickActions/QuickActions";
import { Banknote, ArrowDown, ArrowUp, Scale, Landmark, Wallet } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
  const { stats, isLoading, selectedCaja, setSelectedCaja, fetchData } =
    useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !stats) {
    return (
      <div className="dashboard-loading">
        Cargando información del dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <div className="stats-row">
        <div className="caja-toggle-column">
          <button
            className={`caja-card ${selectedCaja === "banco" ? "active" : ""}`}
            onClick={() => setSelectedCaja("banco")}
          >
            <Landmark size={24} />
            <span>Banco</span>
          </button>
          <button
            className={`caja-card ${selectedCaja === "caja_chica" ? "active" : ""}`}
            onClick={() => setSelectedCaja("caja_chica")}
          >
            <Wallet size={24} />
            <span>Caja<br />Chica</span>
          </button>
        </div>

        <section className="stats-grid">
          <StatCard
            title="Saldo Disponible"
            amount={stats.saldo}
            variant="verde"
            Icon={Banknote}
          />
          <StatCard
            title="Ingresos del Mes"
            amount={stats.ingresos}
            variant="azul"
            Icon={ArrowDown}
          />
          <StatCard
            title="Egresos del Mes"
            amount={stats.egresos}
            variant="naranja"
            Icon={ArrowUp}
          />
          <StatCard
            title="Resultado del Mes"
            amount={stats.resultado}
            variant="azul"
            Icon={Scale}
          />
        </section>
      </div>

      <section className="main-grid">
        <div className="main-grid-col">
          <Transactions />
        </div>
        <div className="main-grid-col">
          <QuickActions />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
