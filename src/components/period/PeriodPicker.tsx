import React from "react";
import { MONTHS_SHORT } from "../../utils/format";

interface PeriodPickerProps {
  periodYear: number;
  onYearChange: (year: number) => void;
  periods: string[];
  onTogglePeriod: (period: string) => void;
  disabledPeriods?: Set<string>;
  label?: string;
  required?: boolean;
}

const PeriodPicker: React.FC<PeriodPickerProps> = ({
  periodYear,
  onYearChange,
  periods,
  onTogglePeriod,
  disabledPeriods,
  label = "Período",
  required,
}) => {
  return (
    <div className="period-field-group">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="period-year-nav">
        <button type="button" className="period-year-btn" onClick={() => onYearChange(periodYear - 1)}>
          &lt;
        </button>
        <span className="period-year-label">{periodYear}</span>
        <button type="button" className="period-year-btn" onClick={() => onYearChange(periodYear + 1)}>
          &gt;
        </button>
      </div>
      <div className="period-months-grid">
        {MONTHS_SHORT.map((name, i) => {
          const m = String(i + 1).padStart(2, "0");
          const val = `${periodYear}-${m}`;
          const active = periods.includes(val);
          const isPaid = disabledPeriods?.has(val) ?? false;
          return (
            <button
              key={val}
              type="button"
              className={`period-month-btn${active && !isPaid ? " active" : ""}${isPaid ? " paid" : ""}`}
              onClick={() => {
                if (isPaid) return;
                onTogglePeriod(val);
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PeriodPicker;
