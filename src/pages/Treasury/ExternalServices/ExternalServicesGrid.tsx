import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X, Search, ChevronDown, Pencil, Save } from "lucide-react";
import {
  fetchExternalServices,
  fetchExternalServicePayments,
  saveExternalServicePayment,
  deleteExternalServicePayment,
  updateExternalService,
  type ExternalServiceItem,
  type ExternalServicePaymentItem,
} from "../../../services/externalServicesApi";
import { savePayment } from "../../../services/paymentsApi";
import "./ExternalServices.css";

const FRECUENCIA_LABEL: Record<string, string> = {
  unico: "Único", semanal: "Semanal", quincenal: "Quincenal",
  mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral",
  semestral: "Semestral", anual: "Anual",
};

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getExpectedMonths(frequency: string, startMonth: number | null): number[] {
  const start = startMonth ?? 1;
  switch (frequency) {
    case "bimestral": {
      const months: number[] = [];
      for (let m = start; m <= 12; m += 2) months.push(m);
      return months;
    }
    case "trimestral": {
      const months: number[] = [];
      for (let m = start; m <= 12; m += 3) months.push(m);
      return months;
    }
    case "semestral": {
      const months: number[] = [];
      for (let m = start; m <= 12; m += 6) months.push(m);
      return months;
    }
    case "anual":
      return start <= 12 ? [start] : [];
    case "unico":
      return [];
    case "semanal":
    case "quincenal":
      return [];
    default:
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
}

function defaultDateForMonth(year: number, month: number): string {
  const y = year;
  const m = String(month).padStart(2, "0");
  return `${y}-${m}-01`;
}

function parseAmountInput(val: string): number {
  return parseFloat(val.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
}

type CellEdit = {
  amountStr: string;
  paid: boolean;
};

type PendingMovement = {
  serviceId: string;
  serviceName: string;
  month: number;
  year: number;
  amount: number;
  date: string;
};

const ExternalServicesGrid: React.FC = () => {
  const [services, setServices] = useState<ExternalServiceItem[]>([]);
  const [payments, setPayments] = useState<ExternalServicePaymentItem[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowEdits, setRowEdits] = useState<Record<string, CellEdit>>({});

  const [pendingMovements, setPendingMovements] = useState<PendingMovement[]>([]);
  const [pendingIndex, setPendingIndex] = useState(0);

  const [confirmDeletePayment, setConfirmDeletePayment] = useState<{
    serviceId: string;
    month: number;
    year: number;
  } | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchExternalServices(),
      fetchExternalServicePayments(year),
    ])
      .then(([svcs, pays]) => {
        if (!mounted) return;
        setServices(svcs);
        setPayments(pays);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [year]);

  const paymentsMap = useMemo(() => {
    const map = new Map<string, ExternalServicePaymentItem>();
    for (const p of payments) {
      map.set(`${p.service_id}|${p.month}`, p);
    }
    return map;
  }, [payments]);

  const filteredServices = useMemo(() => {
    const q = searchText.toLowerCase();
    return services.filter((svc) => {
      if (!showInactive && !svc.active) return false;
      if (q && !svc.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, searchText, showInactive]);

  const startEditRow = useCallback((serviceId: string) => {
    setEditingRow(serviceId);
    const edits: Record<string, CellEdit> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${serviceId}|${m}`;
      const payment = paymentsMap.get(key);
      edits[key] = {
        amountStr: payment?.amount != null ? String(payment.amount).replace(".", ",") : "",
        paid: !!payment,
      };
    }
    setRowEdits(edits);
  }, [paymentsMap]);

  const cancelEditRow = useCallback(() => {
    setEditingRow(null);
    setRowEdits({});
  }, []);

  const updateCell = useCallback((serviceId: string, month: number, field: "amountStr" | "paid", value: string | boolean) => {
    const key = `${serviceId}|${month}`;
    const wasOriginallyPaid = !!paymentsMap.get(key);

    if (field === "amountStr" && typeof value === "string" && value.length > 0) {
      setRowEdits((prev) => ({
        ...prev,
        [key]: { ...prev[key], amountStr: value, paid: true },
      }));
      return;
    }

    if (field === "paid" && value === false && wasOriginallyPaid) {
      setConfirmDeletePayment({ serviceId, month, year });
      return;
    }

    setRowEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }, [paymentsMap, year]);

  const confirmDeletePaymentYes = useCallback(() => {
    if (!confirmDeletePayment) return;
    const key = `${confirmDeletePayment.serviceId}|${confirmDeletePayment.month}`;
    setRowEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], paid: false },
    }));
    setConfirmDeletePayment(null);
  }, [confirmDeletePayment]);

  const saveRowEdits = useCallback(async (serviceId: string) => {
    const svcName = services.find((s) => s.id === serviceId)?.name ?? "";
    const toCreate: PendingMovement[] = [];
    const toDelete: { serviceId: string; month: number; year: number }[] = [];

    for (let m = 1; m <= 12; m++) {
      const key = `${serviceId}|${m}`;
      const edit = rowEdits[key];
      if (!edit) continue;
      const payment = paymentsMap.get(key);
      const wasPaid = !!payment;
      const amount = parseAmountInput(edit.amountStr);

      if (edit.paid && !wasPaid) {
        if (amount > 0) {
          toCreate.push({
            serviceId,
            serviceName: svcName,
            month: m,
            year,
            amount,
            date: defaultDateForMonth(year, m),
          });
        }
      } else if (!edit.paid && wasPaid) {
        toDelete.push({ serviceId, month: m, year });
      } else if (edit.paid && wasPaid && amount !== (payment?.amount ?? null)) {
        await saveExternalServicePayment(serviceId, m, year, amount || null, payment?.movement_id ?? null);
      }
    }

    for (const d of toDelete) {
      await deleteExternalServicePayment(d.serviceId, d.month, d.year);
    }

    if (toCreate.length > 0) {
      setPendingMovements(toCreate);
      setPendingIndex(0);
    } else {
      const pays = await fetchExternalServicePayments(year);
      setPayments(pays);
      setEditingRow(null);
      setRowEdits({});
    }
  }, [rowEdits, paymentsMap, year, services]);

  const handleMovementDateChange = useCallback((date: string) => {
    setPendingMovements((prev) => {
      const next = [...prev];
      next[pendingIndex] = { ...next[pendingIndex], date };
      return next;
    });
  }, [pendingIndex]);

  const handleMovementChoice = useCallback(async (mode: "efectivo" | "transferencia" | "skip") => {
    const current = pendingMovements[pendingIndex];
    if (!current) return;

    if (mode !== "skip") {
      try {
        const payment = await savePayment({
          date: current.date,
          detail: `Pago servicio externo: ${current.serviceName}`,
          amount: current.amount,
          type: "egreso",
          mode,
          concept: "Pago de servicio externo",
        });
        await saveExternalServicePayment(current.serviceId, current.month, current.year, current.amount, payment.id);
      } catch {
        // silent
      }
    } else {
      await saveExternalServicePayment(current.serviceId, current.month, current.year, current.amount, null);
    }

    if (pendingIndex < pendingMovements.length - 1) {
      setPendingIndex((i) => i + 1);
    } else {
      const pays = await fetchExternalServicePayments(year);
      setPayments(pays);
      setPendingMovements([]);
      setPendingIndex(0);
      setEditingRow(null);
      setRowEdits({});
    }
  }, [pendingMovements, pendingIndex, year]);

  const handleToggleActive = useCallback(async (svc: ExternalServiceItem) => {
    await updateExternalService(svc.id, svc.name, svc.phone, svc.description, svc.frequency, svc.start_month, !svc.active);
    setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, active: !s.active } : s));
  }, []);

  if (loading) return <div className="dashboard-loading">Cargando servicios externos...</div>;

  const showMovementModal = pendingMovements.length > 0;
  const currentPending = showMovementModal ? pendingMovements[pendingIndex] : null;

  return (
    <div className="treasury-container">
      <div className="ext-svc-header">
        <div className="ext-svc-year-nav">
          <button className="ext-svc-year-btn" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="ext-svc-year-label">{year}</span>
          <button className="ext-svc-year-btn" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="ext-svc-filters">
          <div className="ext-svc-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <label className="ext-svc-inactive-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inactivos
          </label>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="ext-svc-empty">
          {services.length === 0
            ? "No hay servicios externos/impuestos configurados. Agregalos en Configuracion > Variables > Servicios Externos / Impuestos."
            : "No se encontraron servicios con los filtros aplicados."}
        </div>
      ) : (
        <div className="ext-svc-table-wrapper custom-scroll">
          <table className="ext-svc-table">
            <thead>
              <tr>
                <th className="ext-svc-th-name">Servicio</th>
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const isCurrent = year === currentYear && month === currentMonth;
                  return (
                    <th key={i} className={`ext-svc-th-month ${isCurrent ? "ext-svc-th-current" : ""}`}>
                      {m}
                    </th>
                  );
                })}
                <th className="ext-svc-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((svc) => {
                const isExpanded = expandedId === svc.id;
                const isEditing = editingRow === svc.id;
                return (
                  <React.Fragment key={svc.id}>
                    <tr className={!svc.active ? "ext-svc-row-inactive" : ""}>
                      <td className="ext-svc-td-name">
                        <button
                          className={`ext-svc-name-btn ${isExpanded ? "expanded" : ""}`}
                          onClick={() => setExpandedId(isExpanded ? null : svc.id)}
                        >
                          <ChevronDown size={14} />
                          <span>{svc.name}</span>
                        </button>
                      </td>
                      {MONTHS.map((_, i) => {
                        const month = i + 1;
                        const key = `${svc.id}|${month}`;
                        const payment = paymentsMap.get(key);
                        const edit = rowEdits[key];
                        const isCurrent = year === currentYear && month === currentMonth;
                        const expectedMonths = getExpectedMonths(svc.frequency, svc.start_month);
                        const isExpected = expectedMonths.includes(month);
                        const isPast = year < currentYear || (year === currentYear && month < currentMonth);
                        const unpaidOverdue = isExpected && !edit?.paid && isPast;
                        const cellPaid = edit ? edit.paid : !!payment;

                        const cellClass = [
                          cellPaid ? "ext-svc-cell-paid" : "",
                          unpaidOverdue ? "ext-svc-cell-unpaid-overdue" : "",
                          isCurrent ? "ext-svc-cell-current" : "",
                        ].filter(Boolean).join(" ");

                        return (
                          <td key={month} className={`ext-svc-td-cell ${cellClass}`}>
                            {isEditing ? (
                              <div className="ext-svc-editing">
                                <input
                                  type="text"
                                  className="ext-svc-amount-input"
                                  placeholder="Monto"
                                  value={edit?.amountStr ?? ""}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^0-9,]/g, "");
                                    updateCell(svc.id, month, "amountStr", cleaned);
                                  }}
                                />
                                <button
                                  className={`ext-svc-check ${edit?.paid ? "paid" : "unpaid"}`}
                                  onClick={() => updateCell(svc.id, month, "paid", !edit?.paid)}
                                  title={edit?.paid ? "Desmarcar" : "Marcar pagado"}
                                >
                                  {edit?.paid ? <Check size={14} /> : <X size={14} />}
                                </button>
                              </div>
                            ) : (
                              <div className="ext-svc-cell-display">
                                <span className={`ext-svc-check-static ${cellPaid ? "paid" : "unpaid"}`}>
                                  {cellPaid ? <Check size={14} /> : <X size={14} />}
                                </span>
                                {payment?.amount != null && (
                                  <span className="ext-svc-amount-label">
                                    ${payment.amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="ext-svc-td-actions">
                        {isEditing ? (
                          <>
                            <button
                              className="ext-svc-row-btn ext-svc-row-save"
                              onClick={() => saveRowEdits(svc.id)}
                              title="Guardar"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              className="ext-svc-row-btn ext-svc-row-cancel"
                              onClick={cancelEditRow}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="ext-svc-row-btn ext-svc-row-edit"
                            onClick={() => startEditRow(svc.id)}
                            title="Editar fila"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="ext-svc-expanded-row">
                        <td colSpan={14} className="ext-svc-expanded-cell">
                          <div className="ext-svc-expanded-content">
                            <span><strong>Tipo de pago:</strong> {FRECUENCIA_LABEL[svc.frequency] ?? svc.frequency}</span>
                            {svc.start_month && (
                              <span><strong>Inicio:</strong> {MESES[svc.start_month] ?? svc.start_month}</span>
                            )}
                            {svc.phone && <span><strong>Tel:</strong> {svc.phone}</span>}
                            {svc.description && <span><strong>Detalle:</strong> {svc.description}</span>}
                            <button
                              className={`ext-svc-active-btn ${svc.active ? "active" : "inactive"}`}
                              onClick={() => handleToggleActive(svc)}
                            >
                              {svc.active ? "Marcar como inactivo" : "Marcar como activo"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showMovementModal && currentPending && (
        <div className="ext-svc-modal-overlay">
          <div className="ext-svc-modal">
            <div className="ext-svc-modal-header">
              <h3>Generar movimiento de tesorería</h3>
              <span className="ext-svc-modal-counter">
                {pendingIndex + 1} / {pendingMovements.length}
              </span>
            </div>
            <p>
              <strong>{currentPending.serviceName}</strong> — {MONTHS[currentPending.month - 1]} {currentPending.year}
            </p>
            <p className="ext-svc-modal-amount">
              ${currentPending.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <div className="ext-svc-modal-date">
              <label>Fecha del movimiento:</label>
              <input
                type="date"
                value={currentPending.date}
                onChange={(e) => handleMovementDateChange(e.target.value)}
              />
            </div>
            <p className="ext-svc-modal-sub">¿Generar movimiento?</p>
            <div className="ext-svc-modal-actions">
              <button className="ext-svc-modal-btn efectivo" onClick={() => handleMovementChoice("efectivo")}>
                Efectivo
              </button>
              <button className="ext-svc-modal-btn transferencia" onClick={() => handleMovementChoice("transferencia")}>
                Transferencia
              </button>
              <button className="ext-svc-modal-btn skip" onClick={() => handleMovementChoice("skip")}>
                Solo pago
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeletePayment && (
        <div className="ext-svc-modal-overlay" onClick={() => setConfirmDeletePayment(null)}>
          <div className="ext-svc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar registro de pago</h3>
            <p>
              El mes <strong>{MONTHS[confirmDeletePayment.month - 1]} {confirmDeletePayment.year}</strong> tiene un pago registrado.
            </p>
            <p className="ext-svc-modal-sub">¿Desea eliminar este registro de pago?</p>
            <div className="ext-svc-modal-actions">
              <button className="ext-svc-modal-btn skip" onClick={confirmDeletePaymentYes}>
                Sí, eliminar
              </button>
              <button className="ext-svc-modal-btn cancel" onClick={() => setConfirmDeletePayment(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalServicesGrid;
