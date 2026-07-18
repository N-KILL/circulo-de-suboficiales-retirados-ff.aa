import React from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

interface FiltersPanelProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  showSaldos?: boolean;
  onToggleSaldos?: () => void;
  showSaldosLabel?: string;
  nichoFilter?: string;
  onClearNichoFilter?: () => void;
  topContent?: React.ReactNode;
  children?: React.ReactNode;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  onToggleFilters,
  onClearFilters,
  showSaldos,
  onToggleSaldos,
  showSaldosLabel,
  nichoFilter,
  onClearNichoFilter,
  topContent,
  children,
}) => {
  return (
    <div className="filters-panel filters-panel-stack">
      <div className="filters-top-row">
        {topContent}
        <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
          <button className="toolbar-btn" onClick={onClearFilters} title="Limpiar filtros">
            <RotateCcw size={16} /> Limpiar
          </button>
          {onToggleSaldos && (
            <button
              className="toolbar-btn"
              onClick={onToggleSaldos}
              title={showSaldos ? "Ocultar columnas de saldo" : "Mostrar columnas de saldo"}
            >
              {showSaldos ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg></>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></>
              )}
              {showSaldosLabel || "Saldos"}
            </button>
          )}
          <button
            className={`toolbar-btn ${showFilters ? "active" : ""}`}
            onClick={onToggleFilters}
          >
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Filtros
          </button>
        </div>
        {nichoFilter && onClearNichoFilter && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", marginTop: 8,
            background: "#e0f2fe", borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: "#0369a1",
          }}>
            <span>Filtrado por nicho: {nichoFilter}</span>
            <button
              onClick={onClearNichoFilter}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#0369a1", padding: 2, display: "flex",
              }}
              title="Quitar filtro"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )}
      </div>

      {showFilters && children && (
        <div className="filters-bottom-row">
          {children}
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;
