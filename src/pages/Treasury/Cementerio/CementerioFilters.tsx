import React from "react";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import { PAGA_POR_OPTS, PAGA_POR_LABEL } from "./constants";

interface CementerioFiltersProps {
  searchText: string;
  onSearchChange: (v: string) => void;
  filtroPagaPor: string;
  onFiltroPagaPorChange: (v: string) => void;
  filtroAnios: number | null;
  onStepperDown: () => void;
  onStepperUp: () => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

const CementerioFilters: React.FC<CementerioFiltersProps> = ({
  searchText,
  onSearchChange,
  filtroPagaPor,
  onFiltroPagaPorChange,
  filtroAnios,
  onStepperDown,
  onStepperUp,
  onClearFilters,
  showFilters,
  onToggleFilters,
}) => {
  return (
    <div className="filters-panel filters-panel-stack">
      <div className="filters-top-row">
        <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
          <span className="filter-group-label">Buscar</span>
          <SearchInput
            value={searchText}
            onChange={onSearchChange}
            placeholder="Buscar por nicho, arrendatario o teléfono..."
          />
        </div>
        <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
          <button
            className="toolbar-btn"
            onClick={onClearFilters}
            title="Limpiar filtros"
          >
            <RotateCcw size={16} />
            Limpiar
          </button>
          <button
            className={`toolbar-btn ${showFilters ? "active" : ""}`}
            onClick={onToggleFilters}
          >
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-bottom-row" style={{ marginTop: 8 }}>
          <div className="filter-group">
            <span className="filter-group-label">Paga por</span>
            <div className="filter-btns">
              {PAGA_POR_OPTS.map((opt) => (
                <button
                  key={opt}
                  className={`filter-btn ${filtroPagaPor === opt ? "active" : ""}`}
                  onClick={() => onFiltroPagaPorChange(opt)}
                >
                  {opt === "" ? "Todos" : PAGA_POR_LABEL[opt]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Años desde último pago</span>
            <div className="stepper-wrapper">
              <button className="stepper-btn" onClick={onStepperDown}>-</button>
              <span className="stepper-value">{filtroAnios !== null ? filtroAnios : "Cualq."}</span>
              <button className="stepper-btn" onClick={onStepperUp}>+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CementerioFilters;
