import React from "react";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import { PAGA_POR_OPTS, PAGA_POR_LABEL } from "./constants";

interface CementerioFiltersProps {
  searchText: string;
  onSearchChange: (v: string) => void;
  filtroPagaPor: string;
  onFiltroPagaPorChange: (v: string) => void;
  filtroVacios: string;
  onFiltroVaciosChange: (v: string) => void;
  filtroAnios: number | null;
  onStepperDown: () => void;
  onStepperUp: () => void;
  filtroReducible: "ocultar" | "todo" | "solo";
  onFiltroReducibleChange: (v: "ocultar" | "todo" | "solo") => void;
  debtFilterActive: boolean;
  onDebtFilterActiveChange: (v: boolean) => void;
  debtFilterYears: number;
  onDebtStepperDown: () => void;
  onDebtStepperUp: () => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

const VACIOS_OPTS = [
  { value: "", label: "Todos" },
  { value: "vacios", label: "Vacío" },
  { value: "ocupados", label: "Ocupado" },
] as const;

const REDUCIBLE_OPTS = [
  { value: "todo" as const, label: "Todo" },
  { value: "solo" as const, label: "Solo reducibles" },
  { value: "ocultar" as const, label: "Ocultar" },
] as const;

const CementerioFilters: React.FC<CementerioFiltersProps> = ({
  searchText,
  onSearchChange,
  filtroPagaPor,
  onFiltroPagaPorChange,
  filtroVacios,
  onFiltroVaciosChange,
  filtroAnios,
  onStepperDown,
  onStepperUp,
  filtroReducible,
  onFiltroReducibleChange,
  debtFilterActive,
  onDebtFilterActiveChange,
  debtFilterYears,
  onDebtStepperDown,
  onDebtStepperUp,
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
            <select
              className="filter-select"
              value={filtroPagaPor}
              onChange={(e) => onFiltroPagaPorChange(e.target.value)}
            >
              {PAGA_POR_OPTS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "" ? "Todos" : PAGA_POR_LABEL[opt]}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Nichos vacíos</span>
            <select
              className="filter-select"
              value={filtroVacios}
              onChange={(e) => onFiltroVaciosChange(e.target.value)}
            >
              {VACIOS_OPTS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Años desde último pago</span>
            <div className="stepper-wrapper">
              <button className="stepper-btn" onClick={onStepperDown}>-</button>
              <span className="stepper-value">{filtroAnios !== null ? filtroAnios : "TODOS"}</span>
              <button className="stepper-btn" onClick={onStepperUp}>+</button>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Ocultar deuda desde</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="stepper-wrapper">
                <button className="stepper-btn" onClick={onDebtStepperDown}>-</button>
                <span className="stepper-value">{debtFilterYears}</span>
                <button className="stepper-btn" onClick={onDebtStepperUp}>+</button>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                <input
                  type="checkbox"
                  checked={debtFilterActive}
                  onChange={(e) => onDebtFilterActiveChange(e.target.checked)}
                />
                ACTIVO
              </label>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Reducible</span>
            <select
              className="filter-select"
              value={filtroReducible}
              onChange={(e) => onFiltroReducibleChange(e.target.value as "ocultar" | "todo" | "solo")}
            >
              {REDUCIBLE_OPTS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CementerioFilters;
