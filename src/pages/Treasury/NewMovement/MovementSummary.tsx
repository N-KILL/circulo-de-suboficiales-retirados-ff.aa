import React from "react";
import { Landmark, CreditCard, User, Info, Calendar, DollarSign } from "lucide-react";
import { toCurrency } from "../../../utils/format";

interface MovementSummaryProps {
  originLabel: string;
  formaPagoLabel: string;
  personTypeLabel: string;
  concept: string;
  servicio: string;
  showServicioSelect: boolean;
  payerName: string;
  fecha: string;
  serviceDate: string;
  importeNum: number;
  showServiceDate: boolean;
}

const MovementSummary: React.FC<MovementSummaryProps> = ({
  originLabel,
  formaPagoLabel,
  personTypeLabel,
  concept,
  servicio,
  showServicioSelect,
  payerName,
  fecha,
  serviceDate,
  importeNum,
  showServiceDate,
}) => {
  return (
    <div className="card-custom summary-card">
      <h3 className="card-title">Resumen del Movimiento</h3>
      <div className="summary-list">
        <div className="summary-item">
          <div className="summary-label">
            <Landmark size={16} /> <span>Origen</span>
          </div>
          <div className="summary-value">{originLabel}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">
            <CreditCard size={16} /> <span>Forma de Pago</span>
          </div>
          <div className="summary-value">{formaPagoLabel}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">
            <User size={16} /> <span>Tipo</span>
          </div>
          <div className="summary-value">{personTypeLabel}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">
            <Info size={16} /> <span>Concepto</span>
          </div>
          <div className="summary-value">
            {showServicioSelect ? `${concept} - ${servicio}` : concept}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">
            <User size={16} /> <span>Paga</span>
          </div>
          <div className="summary-value">{payerName || "\u2014"}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">
            <Calendar size={16} /> <span>{showServicioSelect ? "Fecha de pago" : "Fecha"}</span>
          </div>
          <div className="summary-value">{fecha || "\u2014"}</div>
        </div>
        {showServiceDate && (
          <div className="summary-item">
            <div className="summary-label">
              <Calendar size={16} /> <span>Fecha del servicio</span>
            </div>
            <div className="summary-value">{serviceDate || "\u2014"}</div>
          </div>
        )}
        <div className="summary-item">
          <div className="summary-label">
            <DollarSign size={16} /> <span>Importe</span>
          </div>
          <div className="summary-value highlight-green">
            {importeNum > 0 ? toCurrency(importeNum) : "\u2014"}
          </div>
        </div>
      </div>

      <div className="summary-total">
        <span>Total a Registrar</span>
        <span className="total-amount">
          {importeNum > 0 ? toCurrency(importeNum) : "\u2014"}
        </span>
      </div>
    </div>
  );
};

export default MovementSummary;
