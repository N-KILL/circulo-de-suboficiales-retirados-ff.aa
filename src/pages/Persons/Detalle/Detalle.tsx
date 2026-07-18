import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Loader, Eye } from "lucide-react";
import { fetchPersonById } from "../../../services/personsApi";
import { fetchDuesByPerson } from "../../../services/duesApi";
import type { Person } from "../../../models/members";
import type { DueWithDetails } from "../../../services/duesApi";
import "../../Treasury/TreasuryTables.css";
import "../../Members/Detalle/Detalle.css";

function formatCurrency(val: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)}`;
}

const DetallePersona: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [dues, setDues] = useState<DueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    Promise.all([fetchPersonById(id), fetchDuesByPerson(id)])
      .then(([p, d]) => {
        if (mounted) {
          setPerson(p);
          setDues(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error al cargar datos");
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader size={24} className="spin" /> Cargando persona...
      </div>
    );
  }

  if (error || !person) {
    return <div className="dashboard-loading" style={{ color: "var(--rojo-alerta)" }}>{error || "Persona no encontrada"}</div>;
  }

  return (
    <div className="detalle-container">
      <button className="btn-back" onClick={() => navigate("/personas")}>
        <ArrowLeft size={18} /> Volver a Personas
      </button>

      <div className="detalle-card">
        <div className="detalle-header">
          <div className="detalle-avatar">
            <User size={40} />
          </div>
          <div className="detalle-title">
            <h2>{person.nombre}</h2>
            <span className="detalle-sub">{person.tipoDoc} {person.documento}</span>
          </div>
        </div>

        <div className="detalle-info-grid">
          <div className="info-item"><span className="info-label">Documento</span><span>{person.tipoDoc} {person.documento}</span></div>
          <div className="info-item"><span className="info-label">Teléfono</span><span>{person.telefono || "—"}</span></div>
          <div className="info-item"><span className="info-label">Domicilio</span><span>{person.domicilio || "—"}</span></div>
        </div>
      </div>

      <div className="detalle-card">
        <h3 className="detalle-section-title">Cuotas de Cementerio</h3>
        {dues.length === 0 ? (
          <p className="detalle-empty">No tiene cuotas de cementerio registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="treasury-table">
              <thead>
                <tr>
                  <th>Fecha de Pago</th>
                  <th>Importe</th>
                  <th>Movimiento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dues.map((d) => (
                  <tr key={d.id}>
                    <td>{d.payment_date}</td>
                    <td className="amount-ingreso">{d.amount != null ? formatCurrency(d.amount) : "—"}</td>
                    <td>{d.movement_id ? d.movement_id.slice(0, 8) + "…" : "—"}</td>
                    <td>
                      {d.movement_id && (
                        <button className="btn-view-detail" type="button" onClick={() => navigate(`/tesoreria/movimientos/detalle/${d.movement_id}`)}>
                          <Eye size={14} /> Ver detalles
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetallePersona;
