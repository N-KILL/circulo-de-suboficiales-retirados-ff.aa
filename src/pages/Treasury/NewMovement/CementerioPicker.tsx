import React from "react";
import type { Cementerio } from "../../../models/members";

const TIPO_LABEL: Record<string, string> = {
  F: "Féretro",
  VF: "Vacío Féretro",
  B: "Bolsa",
  U: "Urna",
  UV: "Vacío Urna",
};

interface CementerioPickerProps {
  cementeriosList: Cementerio[];
  selectedCementerios: Cementerio[];
  cementerioSelectedYears: Map<string, Set<string>>;
  onToggleSelection: (c: Cementerio) => void;
  onAddYear: (cementerioId: string) => void;
  onRemoveYear: (cementerioId: string) => void;
  getAvailableYears: (c: Cementerio) => number[];
}

const CementerioPicker: React.FC<CementerioPickerProps> = ({
  cementeriosList,
  selectedCementerios,
  cementerioSelectedYears,
  onToggleSelection,
  onAddYear,
  onRemoveYear,
  getAvailableYears,
}) => {
  return (
    <div className="cementerio-section-full">
      <label className="cementerio-section-label">
        Cementerio <span className="required">*</span>
      </label>
      {cementeriosList.length === 0 ? (
        <p className="cementerio-empty-msg">
          No se encontraron nichos/urnas/bolsas para este titular.
        </p>
      ) : (
        <div className="cementerio-cards-grid">
          {cementeriosList.map((c) => {
            const isSelected = selectedCementerios.some((x) => x.id === c.id);
            const availableYears = getAvailableYears(c);
            const selectedYears = cementerioSelectedYears.get(c.id) || new Set();
            const sortedSelected = Array.from(selectedYears).sort();
            const minYear = sortedSelected.length > 0 ? sortedSelected[0] : null;
            const maxYear = sortedSelected.length > 0 ? sortedSelected[sortedSelected.length - 1] : null;
            const hasUnpaid = availableYears.length > 0;
            const allSelected = hasUnpaid && availableYears.every((y) => selectedYears.has(String(y)));
            return (
              <div
                key={c.id}
                className={`cementerio-selectable-card${isSelected ? " cementerio-card-selected" : ""}`}
              >
                <label className="cementerio-card-header">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(c)}
                  />
                  <div className="cementerio-card-title">
                    <span className="cementerio-card-nicho">{c.nicho}</span>
                    <span className="cementerio-card-tipo">{TIPO_LABEL[c.tipo || ""] || c.tipo || "Nicho"}</span>
                  </div>
                </label>
                <div className="cementerio-card-details">
                  <div className="cementerio-card-row">
                    <span className="cementerio-card-dlabel">Ocupante</span>
                    <span className="cementerio-card-dvalue">{c.ocupante || "\u2014"}</span>
                  </div>
                  <div className="cementerio-card-row">
                    <span className="cementerio-card-dlabel">Año Gracia</span>
                    <span className="cementerio-card-dvalue">{c.anioDeGracia || "\u2014"}</span>
                  </div>
                  <div className="cementerio-card-row">
                    <span className="cementerio-card-dlabel">Último Pago</span>
                    <span className="cementerio-card-dvalue">{c.ultimoPago || "\u2014"}</span>
                  </div>
                  <div className="cementerio-card-row">
                    <span className="cementerio-card-dlabel">Nº Orden</span>
                    <span className="cementerio-card-dvalue">{c.numeroOrden || "\u2014"}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="cementerio-card-years">
                    <span className="cementerio-card-years-label">Años a pagar:</span>
                    {!hasUnpaid ? (
                      <span className="cementerio-al-day">Al día</span>
                    ) : (
                      <div className="cementerio-year-selector">
                        <button
                          type="button"
                          className="cementerio-year-btn"
                          disabled={sortedSelected.length === 0}
                          onClick={() => onRemoveYear(c.id)}
                        >
                          −
                        </button>
                        <div className="cementerio-year-display">
                          {sortedSelected.length === 0 ? (
                            <span className="cementerio-year-range-text">Sin años seleccionados</span>
                          ) : sortedSelected.length === 1 ? (
                            <span className="cementerio-year-range-text">Año {minYear}</span>
                          ) : (
                            <span className="cementerio-year-range-text">{minYear} — {maxYear} ({sortedSelected.length} años)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="cementerio-year-btn"
                          disabled={allSelected}
                          onClick={() => onAddYear(c.id)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CementerioPicker;
