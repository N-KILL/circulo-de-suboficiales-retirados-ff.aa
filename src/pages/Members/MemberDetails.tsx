import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Treasury/TreasuryTables.css";

const MemberDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="treasury-container">
      <div className="treasury-header-row">
        <div>
          <h2>Detalle socio</h2>
          <div style={{ color: "var(--muted)" }}>ID: {id}</div>
        </div>
        <div>
          <button className="header-btn" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>

      <div className="table-card" style={{ padding: 20 }}>
        <p>
          Vista de detalles para el socio con ID <strong>{id}</strong>. Aquí
          puedes mostrar información completa del socio, historial de pagos,
          datos de contacto, etc.
        </p>
      </div>
    </div>
  );
};

export default MemberDetails;
