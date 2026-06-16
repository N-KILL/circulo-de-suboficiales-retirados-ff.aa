import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowRightLeft, FileText } from "lucide-react";
import "./QuickActions.css";

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { label: "Movimientos", icon: ArrowRightLeft, variant: "azul", to: "/tesoreria/movimientos" },
    { label: "Nuevo Ingreso", icon: ArrowDown, variant: "verde", to: "/tesoreria/ingresos/nuevo-pago" },
    { label: "Nuevo Egreso", icon: ArrowUp, variant: "naranja", to: "/tesoreria/egresos/nuevo-egreso" },
    { label: "Reporte Tesorería", icon: FileText, variant: "azul", to: undefined },
  ];

  return (
    <div className="card qa-card">
      <div className="qa-title">Accesos Rápidos</div>
      <div className="quick-actions">
        {actions.map((act, i) => (
          <button
            key={i}
            className={`qa-btn${act.to ? "" : " qa-btn--disabled"}`}
            onClick={act.to ? () => navigate(act.to!) : undefined}
          >
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
