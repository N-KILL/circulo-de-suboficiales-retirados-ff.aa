import React from "react";
import { DollarSign, Info } from "lucide-react";
import Modal from "../../../components/ui/Modal";

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  onServiceNameChange: (v: string) => void;
  serviceCost: string;
  onServiceCostChange: (v: string) => void;
  serviceError: string | null;
  saving: boolean;
  onSave: () => void;
}

const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  serviceName,
  onServiceNameChange,
  serviceCost,
  onServiceCostChange,
  serviceError,
  saving,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Servicio" maxWidth={380}>
      <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
        {serviceError && (
          <div className="error-banner" style={{ fontSize: 13 }}>
            <Info size={16} /> {serviceError}
          </div>
        )}
        <div className="form-group">
          <label>Nombre <span className="required">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del servicio"
            value={serviceName}
            onChange={(e) => onServiceNameChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Costo <span className="required">*</span></label>
          <div className="input-with-icon">
            <input
              type="text"
              className="form-control"
              placeholder="0,00"
              value={serviceCost}
              onChange={(e) => onServiceCostChange(e.target.value.replace(/[^0-9,]/g, ""))}
            />
            <DollarSign size={18} className="input-icon" />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-save"
            disabled={saving || !serviceName.trim() || !serviceCost}
            onClick={onSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewServiceModal;
