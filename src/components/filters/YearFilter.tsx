import React, { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "../../hooks/useClickOutside";

interface YearFilterProps {
  availableYears: number[];
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const YearFilter: React.FC<YearFilterProps> = ({
  availableYears,
  selectedYears,
  onToggleYear,
  isOpen,
  onToggleOpen,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => { if (isOpen) onToggleOpen(); }, isOpen);

  return (
    <div className="filter-group" ref={ref}>
      <span className="filter-group-label">Año</span>
      <div className="multi-select-wrapper">
        <button
          className={`filter-select ${isOpen ? "open" : ""}`}
          onClick={onToggleOpen}
        >
          {selectedYears.length === 0
            ? "Todos"
            : selectedYears.length === 1
              ? String(selectedYears[0])
              : `${selectedYears.length} seleccionados`}
          <ChevronDown size={14} />
        </button>
        {isOpen && (
          <div className="multi-select-dropdown">
            {availableYears.map((y) => (
              <label key={y} className={`multi-select-option ${selectedYears.includes(y) ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={selectedYears.includes(y)}
                  onChange={() => onToggleYear(y)}
                />
                {y}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YearFilter;
