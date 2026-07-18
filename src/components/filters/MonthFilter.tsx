import React from "react";
import { MONTHS_SHORT } from "../../utils/format";

interface MonthFilterProps {
  selectedMonths: number[];
  onToggleMonth: (month: number) => void;
}

const MonthFilter: React.FC<MonthFilterProps> = ({ selectedMonths, onToggleMonth }) => {
  return (
    <div className="filter-group filter-group-months">
      <span className="filter-group-label">Mes</span>
      <div className="filter-btns months-grid">
        {MONTHS_SHORT.map((label, m) => (
          <button
            key={m}
            className={`filter-btn ${selectedMonths.includes(m) ? "active" : ""}`}
            onClick={() => onToggleMonth(m)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthFilter;
