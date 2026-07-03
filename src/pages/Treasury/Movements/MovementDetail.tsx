import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, Edit3, Trash2, X } from "lucide-react";
import { fetchMovementById, deleteMovement, type Movement } from "../../../services/movementsApi";
import { fetchMemberById } from "../../../services/membersApi";
import "../TreasuryTables.css";
import "./MovementDetail.css";

function toCurrency(val: number): string {
    return `$ ${new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(val))}`;
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
                            {hasLinkedDue
                                ? "Este movimiento está asociado a un registro de cuota. Se eliminarán ambos registros."
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
                            {movement.linked_due!.period_start && (
                                <div className="detail-field">
                                    <span className="detail-label">Periodo inicio</span>
                                    <span className="detail-value">{movement.linked_due!.period_start}</span>
                                </div>
                            )}
                            {movement.linked_due!.period_end && (
                                <div className="detail-field">
                                    <span className="detail-label">Periodo fin</span>
                                    <span className="detail-value">{movement.linked_due!.period_end}</span>
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
                </div>
            </div>
        </div>
    );
};

export default MovementDetail;
