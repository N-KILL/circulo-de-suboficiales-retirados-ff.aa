import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Loader, Plus, X, Calendar } from "lucide-react";
import { fetchMemberById } from "../../../services/membersApi";
import { fetchDuesByMember, saveDue, fetchFamilyMembers } from "../../../services/duesApi";
import type { Member } from "../../../models/members";
import type { DueWithDetails } from "../../../services/duesApi";
import "../../Treasury/TreasuryTables.css";
import "./Detalle.css";

function formatCurrency(val: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)}`;
}

const DetalleSocio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [dues, setDues] = useState<DueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Set<string>>(new Set());
  const [savingMark, setSavingMark] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    Promise.all([fetchMemberById(id), fetchDuesByMember(id)])
      .then(([m, d]) => {
        if (mounted) {
          setMember(m);
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

  const socioDues = useMemo(() => dues.filter((d) => d.type === "socio"), [dues]);
  const cementerioDues = useMemo(() => dues.filter((d) => d.type === "cementerio"), [dues]);

  const familyGroupPrefix = useMemo(() => {
    if (!member?.nroFamilia) return null;
    return member.nroFamilia.split("/")[0];
  }, [member]);

  const openModal = useCallback(async () => {
    if (!id) return;
    setPeriodStart("");
    setPeriodEnd("");
    setSelectedFamily(new Set(id ? [id] : []));
    setShowModal(true);
    if (familyGroupPrefix) {
      try {
        const fMembers = await fetchFamilyMembers(id);
        setFamilyMembers(fMembers);
      } catch {
        setFamilyMembers([]);
      }
    } else {
      setFamilyMembers([]);
    }
  }, [id, familyGroupPrefix]);

  const handleConfirm = useCallback(async () => {
    if (!id || !periodStart || !periodEnd) return;
    setSavingMark(true);
    try {
      await saveDue({
        type: "socio",
        payment_date: new Date().toISOString().split("T")[0],
        period_start: periodStart,
        period_end: periodEnd,
        member_id: id,
        family_group: familyGroupPrefix ?? undefined,
        paid_members: familyGroupPrefix ? Array.from(selectedFamily) : undefined,
      });
      setShowModal(false);
      const updated = await fetchDuesByMember(id);
      setDues(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar cuota");
    } finally {
      setSavingMark(false);
    }
  }, [id, periodStart, periodEnd, familyGroupPrefix, selectedFamily]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader size={24} className="spin" /> Cargando socio...
      </div>
    );
  }

  if (error || !member) {
    return <div className="dashboard-loading" style={{ color: "var(--rojo-alerta)" }}>{error || "Socio no encontrado"}</div>;
  }

  return (
    <div className="detalle-container">
      <button className="btn-back" onClick={() => navigate("/socios")}>
        <ArrowLeft size={18} /> Volver a Socios
      </button>

      <div className="detalle-card">
        <div className="detalle-header">
          <div className="detalle-avatar">
            <User size={40} />
          </div>
          <div className="detalle-title">
            <h2>{member.nombre}</h2>
            <span className="detalle-sub">Nº Socio {member.numeroDeSocio}</span>
          </div>
        </div>

        <div className="detalle-info-grid">
          <div className="info-item"><span className="info-label">Documento</span><span>{member.tipoDoc} {member.documento}</span></div>
          <div className="info-item"><span className="info-label">CUIL</span><span>{member.cuil || "—"}</span></div>
          <div className="info-item"><span className="info-label">Teléfono</span><span>{member.telefono || "—"}</span></div>
          <div className="info-item"><span className="info-label">Email</span><span>{member.email || "—"}</span></div>
          <div className="info-item"><span className="info-label">Domicilio</span><span>{member.domicilio || "—"}</span></div>
          <div className="info-item"><span className="info-label">Localidad</span><span>{member.localidad || "—"}</span></div>
          <div className="info-item"><span className="info-label">Tipo Socio</span><span>{member.tipoSocio || "—"}</span></div>
          <div className="info-item"><span className="info-label">Estado</span><span>{member.estado || "—"}</span></div>
        </div>
      </div>

      <div className="detalle-card">
        <div className="detalle-section-header">
          <h3 className="detalle-section-title">Cuotas de Socio</h3>
          <button className="btn-register-period" onClick={openModal}>
            <Plus size={16} /> Modificar registro cuotas
          </button>
        </div>

        {socioDues.length === 0 ? (
          <p className="detalle-empty">No tiene cuotas de socio registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="treasury-table">
              <thead>
                <tr>
                  <th>Periodo inicio</th>
                  <th>Periodo fin</th>
                  <th>Fecha de Pago</th>
                  <th>Importe</th>
                  <th>Pago</th>
                  <th>Movimiento</th>
                </tr>
              </thead>
              <tbody>
                {socioDues.map((d) => {
                  const isSelf = d.member_id === member.id;
                  const isFamilyPaid = !isSelf && d.paid_members?.includes(member.id ?? "");
                  return (
                    <tr key={d.id}>
                      <td>{d.period_start || "—"}</td>
                      <td>{d.period_end || "—"}</td>
                      <td>{d.payment_date}</td>
                      <td className="amount-ingreso">{d.amount != null ? formatCurrency(d.amount) : "—"}</td>
                      <td>
                        {isSelf ? (
                          <span className="due-badge due-badge-self">Propio</span>
                        ) : isFamilyPaid ? (
                          <span className="due-badge due-badge-family" title={`Pagado por ${d.member_nombre ?? "familiar"}`}>
                            Familiar
                          </span>
                        ) : (
                          <span className="due-badge due-badge-other">—</span>
                        )}
                      </td>
                      <td>{d.movement_id ? d.movement_id.slice(0, 8) + "…" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="detalle-card">
        <h3 className="detalle-section-title">Cuotas de Cementerio</h3>
        {cementerioDues.length === 0 ? (
          <p className="detalle-empty">No tiene cuotas de cementerio registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="treasury-table">
              <thead>
                <tr>
                  <th>Periodo inicio</th>
                  <th>Periodo fin</th>
                  <th>Fecha de Pago</th>
                  <th>Importe</th>
                  <th>Movimiento</th>
                </tr>
              </thead>
              <tbody>
                {cementerioDues.map((d) => (
                  <tr key={d.id}>
                    <td>{d.period_start || "—"}</td>
                    <td>{d.period_end || "—"}</td>
                    <td>{d.payment_date}</td>
                    <td className="amount-ingreso">{d.amount != null ? formatCurrency(d.amount) : "—"}</td>
                    <td>{d.movement_id ? d.movement_id.slice(0, 8) + "…" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="family-picker-overlay">
          <div className="family-picker-modal">
            <div className="family-picker-modal-header">
              <h4>Registrar periodo como pago</h4>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-member-info">
                <User size={20} />
                <div>
                  <strong>{member.nombre}</strong>
                  <span className="modal-member-sub">Nº Socio {member.numeroDeSocio}</span>
                </div>
              </div>

              {familyGroupPrefix && familyMembers.length > 1 && (
                <div className="modal-family-section">
                  <p className="family-member-hint">
                    Grupo familiar Nº {familyGroupPrefix} — {familyMembers.length} integrantes
                  </p>
                  {familyMembers.map((fm) => (
                    <label key={fm.id} className="family-member-item">
                      <input
                        type="checkbox"
                        checked={selectedFamily.has(fm.id)}
                        onChange={() => {
                          setSelectedFamily((prev) => {
                            const next = new Set(prev);
                            if (next.has(fm.id)) next.delete(fm.id);
                            else next.add(fm.id);
                            return next;
                          });
                        }}
                      />
                      <span>{fm.nombre}</span>
                      <span className="family-member-socio">Nº {fm.numeroDeSocio}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="config-form">
                <div className="config-field">
                  <label>Periodo desde</label>
                  <div className="input-with-icon date-input-wrap">
                    <input
                      type="date"
                      className="config-input"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      id="modal-period-start"
                    />
                    <button
                      type="button"
                      className="date-picker-btn"
                      onClick={() => {
                        const el = document.getElementById("modal-period-start") as HTMLInputElement | null;
                        if (el) { el.focus(); el.showPicker?.(); }
                      }}
                    >
                      <Calendar size={18} />
                    </button>
                  </div>
                </div>
                <div className="config-field">
                  <label>Periodo hasta</label>
                  <div className="input-with-icon date-input-wrap">
                    <input
                      type="date"
                      className="config-input"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      id="modal-period-end"
                    />
                    <button
                      type="button"
                      className="date-picker-btn"
                      onClick={() => {
                        const el = document.getElementById("modal-period-end") as HTMLInputElement | null;
                        if (el) { el.focus(); el.showPicker?.(); }
                      }}
                    >
                      <Calendar size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="family-picker-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleConfirm} disabled={savingMark || !periodStart || !periodEnd}>
                {savingMark ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleSocio;
