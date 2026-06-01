import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowRightLeft, FileText } from "lucide-react";

import "./Treasury.css";

interface NavCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  variant: "azul" | "verde" | "naranja" | "acento";
}

const navCards: NavCard[] = [
  {
    id: "card-movimientos",
    icon: <ArrowRightLeft size={38} strokeWidth={1.6} />,
    label: "Movimientos",
    description: "Consultá todos los movimientos registrados en la tesorería.",
    route: "/tesoreria/movimientos",
    variant: "azul",
  },
  {
    id: "card-ingresos",
    icon: <ArrowDown size={38} strokeWidth={1.6} />,
    label: "Ingresos",
    description: "Visualizá y filtrá los ingresos del período actual.",
    route: "/tesoreria/ingresos",
    variant: "verde",
  },
  {
    id: "card-egresos",
    icon: <ArrowUp size={38} strokeWidth={1.6} />,
    label: "Egresos",
    description: "Revisá los egresos registrados y sus comprobantes.",
    route: "/tesoreria/egresos",
    variant: "naranja",
  },
  {
    id: "card-reporte",
    icon: <FileText size={38} strokeWidth={1.6} />,
    label: "Generar Reporte de Tesorería",
    description: "Generá un reporte completo del estado financiero del club.",
    route: "/tesoreria/reporte",
    variant: "acento",
  },
];

const Treasury: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="treasury-hub">
      <div className="treasury-hub-grid">
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
