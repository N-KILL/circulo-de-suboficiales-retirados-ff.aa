import React from "react";
import { Loader } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  warning,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p dangerouslySetInnerHTML={{ __html: message }} />
        {warning && <p className="confirm-warning">{warning}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn-cancel"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-delete confirm-btn"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <><Loader size={16} className="spin" /> {confirmLabel}...</>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
