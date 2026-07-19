import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Loader, Plus, X, Eye } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { fetchMemberById } from "../../../services/membersApi";
import { fetchDuesByMember, saveDue, fetchFamilyMembers } from "../../../services/duesApi";
import { fetchCementeriosByOwner, fetchCementerioMovimientosByMovement } from "../../../services/cementeriosApi";
import PeriodPicker from "../../../components/period/PeriodPicker";
import { formatCurrency, formatPeriodsDisplay, todayLocal } from "../../../utils/format";
import type { Member } from "../../../models/members";
import type { DueWithDetails } from "../../../services/duesApi";
import "../../Treasury/TreasuryTables.css";
import "./Detalle.css";

const DetalleSocio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canModify = user?.role !== "secretario";
  const [member, setMember] = useState<Member | null>(null);
  const [dues, setDues] = useState<DueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNichos, setHasNichos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [periods, setPeriods] = useState<string[]>([]);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Set<string>>(new Set());
  const [savingMark, setSavingMark] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    Promise.all([fetchMemberById(id), fetchDuesByMember(id)])
      .then(([m, d]) => { if (mounted) { setMember(m); setDues(d); setLoading(false); } })
      .catch((err) => { if (mounted) { setError(err instanceof Error ? err.message : "Error al cargar datos"); setLoading(false); } });
    fetchCementeriosByOwner(id, true)
      .then((c) => { if (mounted) setHasNichos(c.length > 0); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const socioDues = useMemo(() => dues.filter((d) => d.type === "socio"), [dues]);
  const cementerioDues = useMemo(() => dues.filter((d) => d.type === "cementerio"), [dues]);

  const cementerioMovementIds = useMemo(() => {
    if (cementerioDues.length === 0) return [];
    return [...new Set(cementerioDues.filter((d) => d.movement_id).map((d) => d.movement_id!))];
  }, [cementerioDues]);

  const [cementerioAsync, setCementerioAsync] = useState<{ movement_id: string; nichos: string; dues: typeof cementerioDues; amount: number; payment_date: string; period: string[] | null }[]>([]);

  useEffect(() => {
    if (cementerioMovementIds.length === 0) return;
    let mounted = true;
    Promise.all(
      cementerioMovementIds.map(async (mid) => {
        try {
          const movimientos = await fetchCementerioMovimientosByMovement(mid);
          const nichos = [...new Set(movimientos.map((m) => m.nicho))].join(", ");
          const relatedDues = cementerioDues.filter((d) => d.movement_id === mid);
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
          const relatedDues = cementerioDues.filter((d) => d.movement_id === mid);
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
  }, [cementerioDues, cementerioMovementIds]);

  const cementerioGrouped = cementerioMovementIds.length === 0 ? [] : cementerioAsync;

  const familyGroupPrefix = useMemo(() => {
    if (!member?.nroFamilia) return null;
    return member.nroFamilia.split("/")[0];
  }, [member]);

  const openModal = useCallback(async () => {
    if (!id) return;
    setPeriods([]);
    setPeriodYear(new Date().getFullYear());
    setSelectedFamily(new Set(id ? [id] : []));
    setShowModal(true);
    if (familyGroupPrefix) {
      try { const fMembers = await fetchFamilyMembers(id); setFamilyMembers(fMembers.filter((m) => !m.fallecido && !m.fechaBaja)); }
      catch { setFamilyMembers([]); }
    } else { setFamilyMembers([]); }
  }, [id, familyGroupPrefix]);

  const handleConfirm = useCallback(async () => {
    if (!id || periods.length === 0) return;
    setSavingMark(true);
    try {
      await saveDue({
        type: "socio", payment_date: todayLocal(), period: periods, member_id: id,
        family_group: familyGroupPrefix ?? undefined,
        paid_members: familyGroupPrefix ? Array.from(selectedFamily) : undefined,
      });
      setShowModal(false);
      const updated = await fetchDuesByMember(id);
      setDues(updated);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al marcar cuota"); }
    finally { setSavingMark(false); }
  }, [id, periods, familyGroupPrefix, selectedFamily]);

  if (loading) return <div className="dashboard-loading"><Loader size={24} className="spin" /> Cargando socio...</div>;
  if (error || !member) return <div className="dashboard-loading" style={{ color: "var(--rojo-alerta)" }}>{error || "Socio no encontrado"}</div>;

  return (
    <div className="detalle-container">
      <button className="btn-back" onClick={() => navigate("/socios")}><ArrowLeft size={18} /> Volver a Socios</button>

      <div className="detalle-card">
        <div className="detalle-header">
          <div className="detalle-avatar"><User size={40} /></div>
          <div className="detalle-title"><h2>{member.nombre}</h2><span className="detalle-sub">Nº Socio {member.numeroDeSocio}{member.fechaBaja && <span style={{ marginLeft: 8, color: "#dc2626", fontWeight: 700 }}>(Dado de baja)</span>}</span></div>
        </div>
        <div className="detalle-info-grid">
          <div className="info-item"><span className="info-label">Documento</span><span>{member.tipoDoc} {member.documento}</span></div>
          <div className="info-item"><span className="info-label">CUIL</span><span>{member.cuil || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Teléfono</span><span>{member.telefono || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Email</span><span>{member.email || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Domicilio</span><span>{member.domicilio || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Localidad</span><span>{member.localidad || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Tipo Socio</span><span>{member.tipoSocio || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Estado</span><span>{member.estado || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Paga por</span><span>{member.pagaPor || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Fecha Nac. (Edad)</span><span>{member.fechaNac || "\u2014"}{member.edad ? ` (${member.edad})` : ""}</span></div>
          <div className="info-item"><span className="info-label">Residencia</span><span>{member.residencia || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Plan Salud</span><span>{member.planSalud ? "Sí" : "No"}</span></div>
          <div className="info-item"><span className="info-label">Asistencial</span><span>{member.asistencial ? "Sí" : "No"}</span></div>
          <div className="info-item"><span className="info-label">Fecha Ingreso</span><span>{member.fechaIngreso || "\u2014"}</span></div>
          <div className="info-item"><span className="info-label">Fecha Baja</span><span>{member.fechaBaja || "\u2014"}{member.fechaBaja && member.motivoBaja ? ` (${member.motivoBaja})` : ""}</span></div>
        </div>
      </div>

      <div className="detalle-card">
        <div className="detalle-section-header">
          <h3 className="detalle-section-title">Cuotas de Socio</h3>
          {canModify && <button className="btn-register-period" onClick={openModal}><Plus size={16} /> Modificar registro cuotas</button>}
        </div>
        {socioDues.length === 0 ? <p className="detalle-empty">No tiene cuotas de socio registradas.</p> : (
          <div className="table-wrapper">
            <table className="treasury-table">
              <thead><tr><th>Periodo</th><th>Fecha de Pago</th><th>Importe</th><th>Pago</th><th>Movimiento</th><th></th></tr></thead>
              <tbody>
                {socioDues.map((d) => {
                  const isSelf = d.member_id === member.id;
                  const isFamilyPaid = !isSelf && d.paid_members?.includes(member.id ?? "");
                  return (
                    <tr key={d.id}>
                      <td>{formatPeriodsDisplay(d.period)}</td>
                      <td>{d.payment_date}</td>
                      <td className="amount-ingreso">{d.amount != null ? formatCurrency(d.amount) : "\u2014"}</td>
                      <td>{isSelf ? <span className="due-badge due-badge-self">Propio</span> : isFamilyPaid ? <span className="due-badge due-badge-family" title={`Pagado por ${d.member_nombre ?? "familiar"}`}>Familiar</span> : <span className="due-badge due-badge-other">\u2014</span>}</td>
                      <td>{d.movement_id ? d.movement_id.slice(0, 8) + "\u2026" : "\u2014"}</td>
                      <td>{d.movement_id && <button className="btn-view-detail" type="button" onClick={() => navigate(`/tesoreria/movimientos/detalle/${d.movement_id}`)}><Eye size={14} /> Ver detalles</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasNichos && (
      <div className="detalle-card">
        <h3 className="detalle-section-title">Cuotas de Cementerio</h3>
        {cementerioDues.length === 0 ? <p className="detalle-empty">No tiene cuotas de cementerio registradas.</p> : (
          <div className="table-wrapper">
            <table className="treasury-table">
              <thead><tr><th>Nicho(s)</th><th>Periodo</th><th>Fecha de Pago</th><th>Importe</th><th>Movimiento</th><th></th></tr></thead>
              <tbody>
                {cementerioGrouped.map((g) => (
                  <tr key={g.movement_id}>
                    <td style={{ fontWeight: 600 }}>{g.nichos}</td>
                    <td>{formatPeriodsDisplay(g.period.length > 0 ? g.period : null)}</td>
                    <td>{g.payment_date}</td>
                    <td className="amount-ingreso">{g.amount > 0 ? formatCurrency(g.amount) : "\u2014"}</td>
                    <td>{g.movement_id ? g.movement_id.slice(0, 8) + "\u2026" : "\u2014"}</td>
                    <td>{g.movement_id && <button className="btn-view-detail" type="button" onClick={() => navigate(`/tesoreria/movimientos/detalle/${g.movement_id}`)}><Eye size={14} /> Ver detalles</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {showModal && canModify && (
        <div className="family-picker-overlay">
          <div className="family-picker-modal">
            <div className="family-picker-modal-header">
              <h4>Registrar periodo como pago</h4>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-member-info">
                <User size={20} />
                <div><strong>{member.nombre}</strong><span className="modal-member-sub">Nº Socio {member.numeroDeSocio}</span></div>
              </div>
              {familyGroupPrefix && familyMembers.length > 1 && (
                <div className="modal-family-section">
                  <p className="family-member-hint">Grupo familiar N° {familyGroupPrefix} — {familyMembers.length} integrantes</p>
                  {familyMembers.map((fm) => (
                    <label key={fm.id} className="family-member-item">
                      <input type="checkbox" checked={selectedFamily.has(fm.id)} onChange={() => setSelectedFamily((prev) => { const next = new Set(prev); if (next.has(fm.id)) next.delete(fm.id); else next.add(fm.id); return next; })} />
                      <span>{fm.nombre}</span>
                      <span className="family-member-socio">Nº {fm.numeroDeSocio}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="config-form">
                <div className="config-field">
                  <label>Período</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    <PeriodPicker
                      periodYear={periodYear}
                      onYearChange={setPeriodYear}
                      periods={periods}
                      onTogglePeriod={(val) => setPeriods((prev) => prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val].sort())}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="family-picker-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleConfirm} disabled={savingMark || periods.length === 0}>{savingMark ? "Guardando..." : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleSocio;
