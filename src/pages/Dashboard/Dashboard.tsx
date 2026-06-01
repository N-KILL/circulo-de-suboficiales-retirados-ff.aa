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
          subtitle="Actualizado hoy 10:30"
          variant="verde"
          Icon={Banknote}
          trend={{ value: stats.saldoTrend, isPositive: true }}
        />
        <StatCard
          title="Ingresos del Mes"
          amount={stats.ingresos}
          subtitle="Mayo 2024"
          variant="azul"
          Icon={ArrowDown}
          trend={{ value: stats.ingresosTrend, isPositive: true }}
        />
        <StatCard
          title="Egresos del Mes"
          amount={stats.egresos}
          subtitle="Mayo 2024"
          variant="naranja"
          Icon={ArrowUp}
          trend={{ value: stats.egresosTrend, isPositive: false }}
        />
        <StatCard
          title="Resultado del Mes"
          amount={stats.resultado}
          subtitle="Mayo 2024"
          variant="azul"
          Icon={Scale}
          trend={{ value: stats.resultadoTrend, isPositive: true }}
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
