import React from "react";
import { ArrowDown, ArrowUp, ArrowRightLeft, FileText } from "lucide-react";
import "./QuickActions.css";

const QuickActions: React.FC = () => {
  const actions = [
    { label: "Movimientos", icon: ArrowRightLeft, variant: "azul" },
    { label: "Nuevo Ingreso", icon: ArrowDown, variant: "verde" },
    { label: "Nuevo Egreso", icon: ArrowUp, variant: "naranja" },
    { label: "Reporte Tesorería", icon: FileText, variant: "azul" },
  ];

  return (
    <div className="card qa-card">
      <div className="qa-title">Accesos Rápidos</div>
      <div className="quick-actions">
        {actions.map((act, i) => (
          <button key={i} className="qa-btn">
            <div className={`qa-icon-box ${act.variant}`}>
              <act.icon size={26} strokeWidth={2} />
            </div>
            <span className="qa-label">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
