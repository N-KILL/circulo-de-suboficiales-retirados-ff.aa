import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp } from "lucide-react";

import "./NewMovement.css";

const navCards = [
  {
    id: "card-ingresos",
    icon: <ArrowDown size={38} strokeWidth={1.6} />,
    label: "Nuevo Ingreso",
    description: "Registrar un nuevo ingreso en la tesorería.",
    route: "/tesoreria/ingresos/nuevo-pago",
    variant: "verde",
  },
  {
    id: "card-egresos",
    icon: <ArrowUp size={38} strokeWidth={1.6} />,
    label: "Nuevo Egreso",
    description: "Registrar un nuevo egreso en la tesorería.",
    route: "/tesoreria/egresos/nuevo-egreso",
    variant: "naranja",
  },
];

const Treasury: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="treasury-hub">
      <div className="treasury-hub-grid two-cards">
        {navCards.map((card) => (
          <button
            key={card.id}
            id={card.id}
            className={`treasury-nav-card treasury-nav-card--${card.variant}`}
            onClick={() => navigate(card.route)}
          >
            <div className="treasury-nav-card__icon">{card.icon}</div>
            <div className="treasury-nav-card__body">
              <span className="treasury-nav-card__label">{card.label}</span>
              <span className="treasury-nav-card__desc">{card.description}</span>
            </div>
            <div className="treasury-nav-card__arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Treasury;
