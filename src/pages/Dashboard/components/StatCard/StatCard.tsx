import React from "react";
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import "./StatCard.css";

type Props = {
  title: string;
  amount: string;
  subtitle?: string;
  color?: string;
  Icon: LucideIcon;
  trend?: { value: string; isPositive: boolean };
  iconBg?: string;
};

const StatCard: React.FC<Props> = ({ title, amount, subtitle, color, Icon, trend, iconBg }) => {
  return (
    <div className="card stat-card-wrapper">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{ 
          background: iconBg || "var(--gris-claro)", 
          color: color || "var(--text)",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
        </div>
        <div className="muted" style={{ fontWeight: 500, fontSize: "14px" }}>{title}</div>
      </div>
      <div className="stat-amount" style={{ marginBottom: "8px" }}>
        {amount}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
        {subtitle && <div className="muted">{subtitle}</div>}
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: trend.isPositive ? "var(--verde-exito)" : "var(--rojo-alerta)", fontWeight: 600 }}>
            {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
