import React, { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { MONTHS_SHORT } from "../../utils/format";
import { useClickOutside } from "../../hooks/useClickOutside";

interface MonthFilterProps {
  selectedMonths: number[];
  onToggleMonth: (month: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const MonthFilter: React.FC<MonthFilterProps> = ({ selectedMonths, onToggleMonth, isOpen, onToggleOpen }) => {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => { if (isOpen) onToggleOpen(); }, isOpen);

  return (
    <div className="filter-group" ref={ref}>
      <span className="filter-group-label">Mes</span>
      <div className="multi-select-wrapper">
        <button
          className={`filter-select ${isOpen ? "open" : ""}`}
          onClick={onToggleOpen}
        >
          {selectedMonths.length === 0
            ? "Todos"
            : selectedMonths.length === 1
              ? MONTHS_SHORT[selectedMonths[0]]
              : `${selectedMonths.length} seleccionados`}
          <ChevronDown size={14} />
        </button>
        {isOpen && (
          <div className="multi-select-dropdown">
            {MONTHS_SHORT.map((label, m) => (
              <label key={m} className={`multi-select-option ${selectedMonths.includes(m) ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(m)}
                  onChange={() => onToggleMonth(m)}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthFilter;
