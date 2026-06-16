import React from "react";
import { useEffect } from "react";
import StatCard from "./components/StatCard/StatCard";
import Transactions from "./components/Transactions/Transactions";
import QuickActions from "./components/QuickActions/QuickActions";
import { Banknote, ArrowDown, ArrowUp, Scale } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
  const { stats, isLoading, fetchData } = useDashboardStore();

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
