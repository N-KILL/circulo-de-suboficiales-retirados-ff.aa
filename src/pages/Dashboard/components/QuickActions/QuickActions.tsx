import React from "react";
import { Download, Upload, ArrowRightLeft, FileText } from "lucide-react";
import "./QuickActions.css";

const QuickActions: React.FC = () => {
  const actions = [
    { label: "Nuevo Ingreso", icon: Download, color: "#2e7d32", bg: "#e6f4ea" },
    { label: "Nuevo Egreso", icon: Upload, color: "#b97b37", bg: "#fef3e5" },
    { label: "Transferencia", icon: ArrowRightLeft, color: "#1b3a6b", bg: "#eef2fb" },
    { label: "Reporte Tesorería", icon: FileText, color: "#1b3a6b", bg: "#eef2fb" },
  ];

  return (
    <div className="card" style={{ marginTop: "16px" }}>
      <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "16px" }}>Accesos Rápidos</div>
      <div className="quick-actions">
        {actions.map((act, i) => (
          <div key={i} className="qa-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "transparent", padding: "0" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: act.bg,
              color: act.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer"
            }}
            className="qa-icon-box"
            >
              <act.icon size={26} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textAlign: "center", lineHeight: "1.2" }}>
              {act.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
