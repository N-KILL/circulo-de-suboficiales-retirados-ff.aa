import React from "react";
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import "./StatCard.css";

type Props = {
  title: string;
  amount: string;
  subtitle?: string;
  Icon: LucideIcon;
  trend?: { value: string; isPositive: boolean };
  variant?: 'verde' | 'azul' | 'naranja';
};

const StatCard: React.FC<Props> = ({ title, amount, subtitle, Icon, trend, variant = 'azul' }) => {
  return (
    <div className="card stat-card-wrapper">
      <div className="stat-card-header">
        <div className={`stat-icon-container ${variant}`}>
          <Icon size={24} />
        </div>
        <div className="muted stat-card-title">{title}</div>
      </div>
      <div className="stat-amount">
        {amount}
      </div>
      <div className="stat-card-footer">
        {subtitle && <div className="muted stat-card-subtitle">{subtitle}</div>}
        {trend && (
          <div className={`stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
