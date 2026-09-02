import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Loader, Eye, Pencil } from "lucide-react";
import { fetchPersonById } from "../../../services/personsApi";
import { fetchDuesByPerson } from "../../../services/duesApi";
import { fetchCementerioMovimientosByMovement } from "../../../services/cementeriosApi";
import { fetchServiceRecordsByPerson, type ServiceRecordItem } from "../../../services/serviceRecordsApi";
import AccountSection from "../../../components/account/AccountSection";
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
  const [serviceRecords, setServiceRecords] = useState<ServiceRecordItem[]>([]);
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
          if (p?.brindaServicios) {
            fetchServiceRecordsByPerson(id)
              .then((records) => { if (mounted) setServiceRecords(records); })
              .catch(() => { if (mounted) setServiceRecords([]); });
          }
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

  const cementerioMovementIds = useMemo(() => {
    if (dues.length === 0) return [];
    return [...new Set(dues.filter((d) => d.movement_id).map((d) => d.movement_id!))];
  }, [dues]);

  const [cementerioAsync, setCementerioAsync] = useState<{ movement_id: string; nichos: string; dues: DueWithDetails[]; amount: number; payment_date: string; period: string[] | null }[]>([]);

  useEffect(() => {
    if (cementerioMovementIds.length === 0) return;
    let mounted = true;
    Promise.all(
      cementerioMovementIds.map(async (mid) => {
        try {
          const movimientos = await fetchCementerioMovimientosByMovement(mid);
          const nichos = [...new Set(movimientos.map((m) => m.nicho))].join(", ");
          const relatedDues = dues.filter((d) => d.movement_id === mid);
          const totalAmount = relatedDues.reduce((sum, d) => sum + (d.amount ?? 0), 0);
          return {
            movement_id: mid,
            nichos,
            dues: relatedDues,
            amount: totalAmount,
            payment_date: relatedDues[0]?.payment_date ?? "",
            period: relatedDues.flatMap((d) => d.period ?? []),
          };
        } catch {
          const relatedDues = dues.filter((d) => d.movement_id === mid);
          return {
            movement_id: mid,
            nichos: "—",
            dues: relatedDues,
            amount: relatedDues.reduce((sum, d) => sum + (d.amount ?? 0), 0),
            payment_date: relatedDues[0]?.payment_date ?? "",
            period: relatedDues.flatMap((d) => d.period ?? []),
          };
        }
      })
    ).then((groups) => {
      if (mounted) setCementerioAsync(groups.sort((a, b) => b.payment_date.localeCompare(a.payment_date)));
    });
    return () => { mounted = false; };
  }, [dues, cementerioMovementIds]);

  const cementerioGrouped = cementerioMovementIds.length === 0 ? [] : cementerioAsync;

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
      <div className="detalle-actions-row">
        <button className="btn-back" onClick={() => navigate("/personas")}>
          <ArrowLeft size={18} /> Volver a Personas
        </button>
        <button className="btn-register-period" onClick={() => navigate(`/personas/editar/${id}`)}>
          <Pencil size={16} /> Editar persona
        </button>
      </div>

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
                  <th>Nicho(s)</th>
                  <th>Fecha de Pago</th>
                  <th>Importe</th>
                  <th>Movimiento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cementerioGrouped.map((g) => (
                  <tr key={g.movement_id}>
                    <td style={{ fontWeight: 600 }}>{g.nichos}</td>
                    <td>{g.payment_date}</td>
                    <td className="amount-ingreso">{g.amount > 0 ? formatCurrency(g.amount) : "—"}</td>
                    <td>{g.movement_id ? g.movement_id.slice(0, 8) + "…" : "—"}</td>
                    <td>
                      {g.movement_id && (
                        <button className="btn-view-detail" type="button" onClick={() => navigate(`/tesoreria/movimientos/detalle/${g.movement_id}`)}>
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

      {person.brindaServicios && (
        <div className="detalle-card">
          <h3 className="detalle-section-title">Historial de Servicios Brindados</h3>
          {serviceRecords.length === 0 ? (
            <p className="detalle-empty">No tiene servicios brindados registrados.</p>
          ) : (
            <div className="table-wrapper">
              <table className="treasury-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Importe</th>
                    <th>Detalle</th>
                    <th>Movimiento</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRecords.map((sr) => (
                    <tr key={sr.id}>
                      <td>{sr.date}</td>
                      <td className="amount-ingreso">{sr.amount > 0 ? formatCurrency(sr.amount) : "—"}</td>
                      <td>{sr.detail || sr.service_name || "—"}</td>
                      <td>{sr.movement_id ? sr.movement_id.slice(0, 8) + "…" : "—"}</td>
                      <td>
                        {sr.movement_id && (
                          <button className="btn-view-detail" type="button" onClick={() => navigate(`/tesoreria/movimientos/detalle/${sr.movement_id}`)}>
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
      )}

      <AccountSection personId={id} />
    </div>
  );
};

export default DetallePersona;
