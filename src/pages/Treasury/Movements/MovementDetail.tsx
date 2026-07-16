import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, Edit3, Trash2, X, Calendar, Briefcase, User, DollarSign, FileText } from "lucide-react";
import { fetchMovementById, deleteMovement, type Movement, type ServiceRecordLink, type CementerioMovimientoLink } from "../../../services/movementsApi";
import { fetchMemberById } from "../../../services/membersApi";
import "../TreasuryTables.css";
import "../ServiceHistory/ServiceHistory.css";
import "./MovementDetail.css";

function toCurrency(val: number): string {
    return `$ ${new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(val))}`;
}

function formatPeriodsDisplay(periods: string[] | null): string {
    if (!periods || periods.length === 0) return "—";
    const byYear: Record<string, string[]> = {};
    for (const p of periods) {
        const [y, m] = p.split("-");
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push(m);
    }
    return Object.entries(byYear)
        .map(([year, months]) => `${year} (Meses: ${months.join(",")})`)
        .join(" ");
}

function formatRecordDate(dateStr: string): string {
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function getTitular(r: ServiceRecordLink): string {
    if (r.member_nombre) {
        return `${r.member_nombre}${r.member_numero_de_socio ? ` (Nº ${r.member_numero_de_socio})` : ""}`;
    }
    return r.person_nombre ?? "—";
}

const MovementDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movement, setMovement] = useState<Movement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [paidMemberNames, setPaidMemberNames] = useState<{ id: string; nombre: string }[]>([]);
    const [selectedServiceRecord, setSelectedServiceRecord] = useState<ServiceRecordLink | null>(null);

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setLoading(true);
        fetchMovementById(id)
            .then((m) => {
                if (mounted) {
                    setMovement(m);
                    setLoading(false);
                    if (m.linked_due?.paid_members?.length) {
                        Promise.all(
                            m.linked_due.paid_members.map((pid: string) =>
                                fetchMemberById(pid).catch(() => null)
                            )
                        ).then((members) => {
                            if (mounted) {
                                const valid = members.filter((mem): mem is NonNullable<typeof mem> => mem !== null);
                                setPaidMemberNames(
                                    valid.map((mem) => ({ id: mem.id, nombre: mem.nombre }))
                                );
                            }
                        }).catch(() => {});
                    }
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Error al cargar movimiento");
                    setLoading(false);
                }
            });
        return () => { mounted = false; };
    }, [id]);

    const handleDelete = useCallback(async () => {
        if (!id) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteMovement(id);
            navigate("/tesoreria/movimientos");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al eliminar");
            setDeleting(false);
        }
    }, [id, navigate]);

    if (loading) {
        return <div className="dashboard-loading"><Loader size={24} className="spin" /> Cargando movimiento...</div>;
    }

    if (error && !movement) {
        return <div className="dashboard-loading" style={{ color: "var(--rojo-alerta)" }}>{error}</div>;
    }

    if (!movement) {
        return <div className="dashboard-loading" style={{ color: "var(--rojo-alerta)" }}>Movimiento no encontrado</div>;
    }

    const typeLabel = movement.type === "ingreso" ? "Ingreso" : movement.type === "egreso" ? "Egreso" : "Transferencia";
    const modeLabel = movement.mode === "efectivo" ? "Efectivo" : "Transferencia";
    const hasLinkedDue = !!movement.linked_due;
    const hasServiceRecords = (movement.linked_service_records?.length ?? 0) > 0;
    const hasCementerioMovimientos = (movement.linked_cementerio_movimientos?.length ?? 0) > 0;
    const hasAnyLinked = hasLinkedDue || hasServiceRecords || hasCementerioMovimientos;

    return (
        <div className="movement-detail-container">
            <button className="btn-back" onClick={() => navigate("/tesoreria/movimientos")}>
                <ArrowLeft size={18} /> Volver a Movimientos
            </button>

            {error && (
                <div className="error-banner">
                    {error}
                    <button type="button" className="success-close" onClick={() => setError(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="movement-detail-card">
                <div className="movement-detail-header">
                    <h2>Detalle del Movimiento</h2>
                    {!confirmDelete && (
                        <div className="movement-detail-actions">
                            <button className="btn-edit" onClick={() => navigate(`/tesoreria/nuevo-movimiento/${movement.id}`)}>
                                <Edit3 size={16} /> Editar
                            </button>
                            <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
                                <Trash2 size={16} /> Eliminar
                            </button>
                        </div>
                    )}
                </div>

                {confirmDelete && (
                    <div className="delete-confirm-box">
                        <p>
                            {hasAnyLinked
                                ? "Este movimiento está asociado a registros vinculados (cuotas, servicios y/o cementerio). Se eliminarán todos los registros vinculados."
                                : "¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer."}
                        </p>
                        <div className="delete-confirm-actions">
                            <button className="btn-cancel" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                                Cancelar
                            </button>
                            <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="movement-detail-grid">
                    <div className="detail-field">
                        <span className="detail-label">ID</span>
                        <span className="detail-value mono">{movement.id}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-label">Fecha</span>
                        <span className="detail-value">{movement.date}</span>
                    </div>
                    <div className="detail-field full-width">
                        <span className="detail-label">Detalle</span>
                        <span className="detail-value">{movement.detail || "—"}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-label">Tipo</span>
                        <span className={`badge ${movement.type === "ingreso" ? "badge-ingreso" : movement.type === "egreso" ? "badge-egreso" : "badge-transferencia"}`}>
                            {typeLabel}
                        </span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-label">Modalidad</span>
                        <span className="detail-value">{modeLabel}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-label">Importe</span>
                        <span className={`detail-value ${movement.type === "ingreso" ? "amount-ingreso" : "amount-egreso"}`}>
                            {movement.type === "ingreso" ? "+" : "-"} {toCurrency(movement.amount)}
                        </span>
                    </div>
                    {movement.concept && (
                        <div className="detail-field">
                            <span className="detail-label">Concepto</span>
                            <span className="detail-value">{movement.concept}</span>
                        </div>
                    )}

                    {hasLinkedDue && (
                        <>
                            <div className="detail-field separator-row" style={{ gridColumn: "1 / -1" }}>
                                <hr />
                            </div>
                            <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
                                <span className="detail-label due-label">Cuota vinculada</span>
                                <span className={`badge ${movement.linked_due!.type === "socio" ? "badge-ingreso" : "badge-egreso"}`}>
                                    {movement.linked_due!.type === "socio" ? "Cuota Socio" : "Cuota Cementerio"}
                                </span>
                            </div>
                            {movement.linked_due!.period && movement.linked_due!.period.length > 0 && movement.linked_due!.type === "socio" && (
                                <div className="detail-field">
                                    <span className="detail-label">Periodo</span>
                                    <span className="detail-value">{formatPeriodsDisplay(movement.linked_due!.period)}</span>
                                </div>
                            )}
                            {movement.linked_due!.member_nombre && (
                                <div className="detail-field">
                                    <span className="detail-label">Socio</span>
                                    <span className="detail-value">{movement.linked_due!.member_nombre}</span>
                                </div>
                            )}
                            {movement.linked_due!.person_nombre && (
                                <div className="detail-field">
                                    <span className="detail-label">Persona</span>
                                    <span className="detail-value">{movement.linked_due!.person_nombre}</span>
                                </div>
                            )}
                            {movement.linked_due!.family_group && (
                                <div className="detail-field">
                                    <span className="detail-label">Grupo familiar</span>
                                    <span className="detail-value">Nº {movement.linked_due!.family_group}</span>
                                </div>
                            )}
                            {paidMemberNames.length > 1 && (
                                <div className="detail-field full-width">
                                    <span className="detail-label">Miembros incluidos</span>
                                    <div className="paid-members-list">
                                        {paidMemberNames.map((pm) => (
                                            <span key={pm.id} className="paid-member-chip">{pm.nombre}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {hasServiceRecords && (
                        <>
                            <div className="detail-field separator-row" style={{ gridColumn: "1 / -1" }}>
                                <hr />
                            </div>
                            <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
                                <span className="detail-label due-label">Servicios vinculados</span>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <table className="treasury-table" style={{ minWidth: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>Servicio</th>
                                            <th>Titular</th>
                                            <th>Importe</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movement.linked_service_records!.map((sr: ServiceRecordLink) => {
                                            const titular = sr.member_nombre
                                                ? `${sr.member_nombre}${sr.member_numero_de_socio ? ` (Nº ${sr.member_numero_de_socio})` : ""}`
                                                : sr.person_nombre ?? "—";
                                            const parts = sr.date.split("-");
                                            const fecha = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : sr.date;
                                            return (
                                                <tr key={sr.id} className="clickable-row" onClick={() => setSelectedServiceRecord(sr)}>
                                                    <td>{sr.service_name ?? "—"}</td>
                                                    <td>{titular}</td>
                                                    <td className="amount-ingreso">{toCurrency(sr.amount)}</td>
                                                    <td>{fecha}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {hasCementerioMovimientos && (
                        <>
                            <div className="detail-field separator-row" style={{ gridColumn: "1 / -1" }}>
                                <hr />
                            </div>
                            <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
                                <span className="detail-label due-label">Cementerio - Detalle por nicho</span>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <table className="treasury-table" style={{ minWidth: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>Nicho</th>
                                            <th>Tipo</th>
                                            <th>Ocupante</th>
                                            <th>Años pagados</th>
                                            <th>Importe</th>
                                            <th>Fecha pago</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movement.linked_cementerio_movimientos!.map((cm: CementerioMovimientoLink) => {
                                            const parts = cm.fecha_pago.split("-");
                                            const fecha = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : cm.fecha_pago;
                                            return (
                                                <tr key={cm.id}>
                                                    <td style={{ fontWeight: 600 }}>{cm.nicho}</td>
                                                    <td>{cm.tipo ?? "—"}</td>
                                                    <td>{cm.ocupante ?? "—"}</td>
                                                    <td>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                            {cm.anios_pagados.map((y) => (
                                                                <span key={y} className="paid-member-chip" style={{ background: "#e0f2fe", color: "#0369a1" }}>{y}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="amount-ingreso">{toCurrency(cm.importe)}</td>
                                                    <td>{fecha}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedServiceRecord && (
                <div className="modal-overlay" onClick={() => setSelectedServiceRecord(null)}>
                    <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalle del Registro de Servicio</h3>
                            <button className="modal-close" onClick={() => setSelectedServiceRecord(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="service-modal-body">
                            <div className="service-modal-highlight">
                                <span className="service-modal-amount">{toCurrency(selectedServiceRecord.amount)}</span>
                                <span className="service-modal-date">
                                    <Calendar size={14} />
                                    {formatRecordDate(selectedServiceRecord.date)}
                                </span>
                            </div>

                            <div className="service-modal-grid">
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><Briefcase size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Servicio</span>
                                        <span className="service-modal-value">{selectedServiceRecord.service_name ?? "—"}</span>
                                    </div>
                                </div>
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><User size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Titular</span>
                                        <span className="service-modal-value">{getTitular(selectedServiceRecord)}</span>
                                    </div>
                                </div>
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><Calendar size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Fecha de pago</span>
                                        <span className="service-modal-value">{formatRecordDate(selectedServiceRecord.date)}</span>
                                    </div>
                                </div>
                                {selectedServiceRecord.service_date && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><Calendar size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Fecha del servicio</span>
                                            <span className="service-modal-value">{formatRecordDate(selectedServiceRecord.service_date)}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedServiceRecord.service_amount != null && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><DollarSign size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Monto base del servicio</span>
                                            <span className="service-modal-value">{toCurrency(selectedServiceRecord.service_amount)}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedServiceRecord.detail && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><FileText size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Detalle</span>
                                            <span className="service-modal-value">{selectedServiceRecord.detail}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovementDetail;
