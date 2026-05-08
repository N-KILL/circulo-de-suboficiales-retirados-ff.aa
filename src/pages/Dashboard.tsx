import React, { useEffect } from "react";
import TopBar from "../components/TopBar";

import { Banknote, ArrowDown, ArrowUp, Scale } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from "recharts";
import StatCard from "./Dashboard/components/StatCard/StatCard";
import Transactions from "./Dashboard/components/Transactions/Transactions";
import QuickActions from "./Dashboard/components/QuickActions/QuickActions";

const DashboardPage: React.FC = () => {
  const { stats, chartData, pieData, isLoading, fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--muted)' }}>
        Cargando información del dashboard...
      </div>
    );
  }

  // Calculate total for pie percentages
  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <>
      <TopBar />

      <section className="stats-grid">
        <StatCard
          title="Saldo Disponible"
          amount={stats.saldo}
          subtitle="Actualizado hoy 10:30"
          color="#2e7d32"
          iconBg="#e6f4ea"
          Icon={Banknote}
          trend={{ value: stats.saldoTrend, isPositive: true }}
        />
        <StatCard
          title="Ingresos del Mes"
          amount={stats.ingresos}
          subtitle="Mayo 2024"
          color="#1b3a6b"
          iconBg="#eef2fb"
          Icon={ArrowDown}
          trend={{ value: stats.ingresosTrend, isPositive: true }}
        />
        <StatCard
          title="Egresos del Mes"
          amount={stats.egresos}
          subtitle="Mayo 2024"
          color="#b97b37"
          iconBg="#fef3e5"
          Icon={ArrowUp}
          trend={{ value: stats.egresosTrend, isPositive: false }}
        />
        <StatCard
          title="Resultado del Mes"
          amount={stats.resultado}
          subtitle="Mayo 2024"
          color="#1b3a6b"
          iconBg="#eef2fb"
          Icon={Scale}
          trend={{ value: stats.resultadoTrend, isPositive: true }}
        />
      </section>

      <section className="main-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "16px" }}>Evolución del Saldo</div>
              <select className="select-dropdown" style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "12px", background: "transparent", color: "var(--text)" }}>
                <option>Últimos 6 meses</option>
              </select>
            </div>
            <div style={{ flex: 1, minHeight: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={(val) => `$ ${val / 1000000}M`} />
                  <Tooltip 
                    formatter={(value: number) => [`$ ${value.toLocaleString("es-AR")}`, "Saldo"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow)" }}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "16px" }}>Resumen por Categoría - Mayo 2024</div>
            <div
              style={{
                display: "flex",
                gap: "32px",
                alignItems: "center",
              }}
            >
              <div style={{ width: "160px", height: "160px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$ ${value.toLocaleString("es-AR")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                {pieData.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontWeight: 600 }}>$ {item.value.toLocaleString("es-AR")}</span>
                      <span className="muted" style={{ width: "32px", textAlign: "right" }}>
                        {pieTotal > 0 ? Math.round((item.value / pieTotal) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column" }}>
          <Transactions />
          <QuickActions />
        </aside>
      </section>
    </>
  );
};

export default DashboardPage;
