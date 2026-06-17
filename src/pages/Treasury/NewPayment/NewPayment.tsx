import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Calendar,
  DollarSign,
  CreditCard,

  CheckCircle,
  Save,
  Info,
  User,
  History,
  FileSearch,
  MapPin,
  Phone,
  Mail,

  X,
  Loader
} from "lucide-react";
import { savePayment } from "../../../services/paymentsApi";
import { fetchMembers } from "../../../services/membersApi";
import type { Member } from "../../../models/members";
import "./NewPayment.css";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toCurrency(val: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)}`;
}

const periodosActuales = () => {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  const periods: { label: string; value: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const month = (m - i + 12) % 12;
    const year = m - i < 0 ? y - 1 : y;
    periods.push({
      label: `${MONTHS[month]} ${year}`,
      value: `${year}-${String(month + 1).padStart(2, "0")}`,
    });
  }
  return periods;
};

const NewPayment: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [tipoIngreso, setTipoIngreso] = useState("Cuota Social");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [periodo, setPeriodo] = useState("");
  const [importeStr, setImporteStr] = useState("");
  const [formaPago, setFormaPago] = useState("Transferencia");
  const [descripcion, setDescripcion] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const memberSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (memberSearchRef.current && !memberSearchRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const periodos = useMemo(() => periodosActuales(), []);

  useEffect(() => {
    let mounted = true;
    setMembersLoading(true);
    fetchMembers()
      .then((data) => {
        if (mounted) {
          setMembers(data);
          setMembersLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setMembersLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const memberResults = useMemo(() => {
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      return members
        .filter(
          (m) =>
            m.nombre.toLowerCase().includes(q) ||
            m.documento.includes(q) ||
            m.numeroDeSocio.includes(q)
        )
        .slice(0, 10);
    }
    return members.slice(0, 10);
  }, [members, memberSearch]);

  const importeNum = useMemo(() => {
    const cleaned = importeStr.replace(/[^0-9,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [importeStr]);

  const mode = formaPago === "Efectivo" ? "efectivo" : "transferencia";

  const handleSelectMember = useCallback((m: Member) => {
    setSelectedMember(m);
    setMemberSearch(m.nombre);
    setShowMemberDropdown(false);
  }, []);

  const handleClearMember = useCallback(() => {
    setSelectedMember(null);
    setMemberSearch("");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMember) {
        setError("Seleccioná un socio");
        return;
      }
      if (!importeNum || importeNum <= 0) {
        setError("Ingresá un importe válido");
        return;
      }
      if (!fecha) {
        setError("Ingresá una fecha");
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(false);

      try {
        const detail = `${
          periodo
            ? periodos.find((p) => p.value === periodo)?.label ?? periodo
            : tipoIngreso
        } - ${selectedMember.nombre}${descripcion ? `: ${descripcion}` : ""}`;

        await savePayment({
          date: fecha,
          detail,
          amount: importeNum,
          type: "ingreso",
          mode,
        });

        setSuccess(true);
        setSelectedMember(null);
        setMemberSearch("");
        setImporteStr("");
        setDescripcion("");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el pago");
      } finally {
        setSaving(false);
      }
    },
    [selectedMember, importeNum, fecha, periodo, tipoIngreso, descripcion, mode, periodos]
  );

  return (
    <form className="new-payment-container" onSubmit={handleSubmit}>
      {success && (
        <div className="success-banner">
          <CheckCircle size={18} />
          Pago registrado correctamente
          <button type="button" className="success-close" onClick={() => setSuccess(false)}>
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner">
          <Info size={18} />
          {error}
          <button type="button" className="success-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="new-payment-layout">
        {/* Left: Form */}
        <div className="new-payment-form-section">
          <div className="card-custom">
            <h3 className="card-title">Datos del Pago</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Tipo de Ingreso <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={tipoIngreso}
                  onChange={(e) => setTipoIngreso(e.target.value)}
                >
                  <option>Cuota Social</option>
                  <option>Donación</option>
                  <option>Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Fecha del Pago <span className="required">*</span>
                </label>
                <div className="input-with-icon date-input-wrap">
                  <input
                    type="date"
                    className="form-control"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    id="payment-date"
                  />
                  <button
                    type="button"
                    className="date-picker-btn"
                    onClick={() => {
                      const el = document.getElementById("payment-date") as HTMLInputElement | null;
                      if (el) {
                        el.focus();
                        el.showPicker?.();
                      }
                    }}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group full-width">
                <label>
                  Socio <span className="required">*</span>
                </label>
                <div className="member-search-wrapper" ref={memberSearchRef}>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={
                        membersLoading
                          ? "Cargando socios..."
                          : "Buscar socio por nombre o DNI..."
                      }
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        setShowMemberDropdown(true);
                        if (selectedMember && e.target.value !== selectedMember.nombre) {
                          setSelectedMember(null);
                        }
                      }}
                      onFocus={() => {
                        setShowMemberDropdown(true);
                      }}
                      disabled={membersLoading}
                    />
                    <Search size={18} className="input-icon" />
                  </div>

                  {showMemberDropdown && memberResults.length > 0 && !selectedMember && (
                    <div className="member-dropdown">
                      {memberResults.map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          className="member-dropdown-item"
                          onClick={() => handleSelectMember(m)}
                        >
                          <User size={16} />
                          <div className="member-dropdown-info">
                            <span className="member-dropdown-name">{m.nombre}</span>
                            <span className="member-dropdown-detail">
                              DNI {m.documento} · Nº {m.numeroDeSocio}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMember && (
                  <div className="selected-user-card">
                    <div className="user-info">
                      <div className="user-avatar-small">
                        <User size={20} />
                      </div>
                      <div className="user-details">
                        <span className="user-name">{selectedMember.nombre}</span>
                        <span className="user-dni">DNI {selectedMember.documento}</span>
                      </div>
                    </div>
                    <div className="user-status">
                      <span className="user-number">Nº Socio {selectedMember.numeroDeSocio}</span>
                      <button type="button" className="clear-member-btn" onClick={handleClearMember}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Período / Concepto</label>
                <select
                  className="form-control"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                >
                  <option value="">Sin período</option>
                  {periodos.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Importe <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0,00"
                    value={importeStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cleaned = raw.replace(/[^0-9,]/g, "");
                      setImporteStr(cleaned);
                    }}
                  />
                  <DollarSign size={18} className="input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Forma de Pago <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                >
                  <option>Transferencia</option>
                  <option>Efectivo</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Descripción / Observaciones</label>
                <textarea
                  className="form-control text-area"
                  placeholder="Detalle del pago..."
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={200}
                />
                <span className="char-counter">{descripcion.length}/200</span>
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                {saving ? "Guardando..." : "Guardar Pago"}
              </button>
            </div>

            <div className="info-alert">
              <Info size={18} />
              <p>
                Los pagos registrados se reflejarán automáticamente en el saldo disponible y en los
                reportes de tesorería.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="new-payment-sidebar-section">
          <div className="card-custom summary-card">
            <h3 className="card-title">Resumen del Pago</h3>
            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Tipo de Ingreso</span>
                </div>
                <div className="summary-value">{tipoIngreso}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Socio</span>
                </div>
                <div className="summary-value">
                  {selectedMember ? selectedMember.nombre : "—"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <Calendar size={16} /> <span>Período</span>
                </div>
                <div className="summary-value">
                  {periodo
                    ? periodos.find((p) => p.value === periodo)?.label ?? periodo
                    : "—"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <DollarSign size={16} /> <span>Importe</span>
                </div>
                <div className="summary-value highlight-green">
                  {importeNum > 0 ? toCurrency(importeNum) : "—"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <CreditCard size={16} /> <span>Forma de Pago</span>
                </div>
                <div className="summary-value">{formaPago}</div>
              </div>
            </div>

            <div className="summary-total">
              <span>Total a Registrar</span>
              <span className="total-amount">
                {importeNum > 0 ? toCurrency(importeNum) : "—"}
              </span>
            </div>
          </div>

          {selectedMember && (
            <div className="card-custom socio-info-card">
              <h3 className="card-title">Información del Socio</h3>
              <div className="socio-profile">
                <div className="socio-avatar">
                  <User size={32} />
                </div>
                <div className="socio-meta">
                  <span className="socio-name">{selectedMember.nombre}</span>
                  <span className="socio-sub">Nº Socio: {selectedMember.numeroDeSocio}</span>
                  <span className="socio-sub">DNI: {selectedMember.documento}</span>
                </div>
              </div>
              <div className="socio-contact">
                <div className="contact-item">
                  <Phone size={16} /> <span>{selectedMember.telefono || "—"}</span>
                </div>
                <div className="contact-item">
                  <Mail size={16} /> <span>{selectedMember.email || "—"}</span>
                </div>
                <div className="contact-item">
                  <MapPin size={16} /> <span>{selectedMember.domicilio || "—"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="card-custom">
            <h3 className="card-title">Detalle Socio</h3>
            <div className="quick-grid">
              <button type="button" className="quick-btn">
                <div className="quick-icon-wrap">
                  <History size={20} />
                </div>
                <span>Historial del Socio</span>
              </button>
              <button type="button" className="quick-btn">
                <div className="quick-icon-wrap">
                  <FileSearch size={20} />
                </div>
                <span>Ficha del Socio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NewPayment;
