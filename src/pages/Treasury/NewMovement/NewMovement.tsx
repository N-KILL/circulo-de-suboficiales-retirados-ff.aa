import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  Save,
  Info,
  User,
  X,
  Loader,
  Landmark,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { savePayment } from "../../../services/paymentsApi";
import { fetchMembers, fetchMemberById } from "../../../services/membersApi";
import { fetchAllPersons, fetchPersonById } from "../../../services/personsApi";
import { fetchMovementById, updateMovement } from "../../../services/movementsApi";
import { fetchMemberCemeteryCheck, saveDue, fetchFamilyMembers } from "../../../services/duesApi";
import { fetchDuesConfig } from "../../../services/duesConfigApi";
import { fetchServices } from "../../../services/servicesApi";
import type { DuesConfig } from "../../../services/duesConfigApi";
import type { ServiceItem } from "../../../services/servicesApi";
import type { Member, Person } from "../../../models/members";
import "./NewMovement.css";

function toCurrency(val: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)}`;
}

type FieldErrors = {
  socio?: string;
  persona?: string;
  fecha?: string;
  importe?: string;
};

const NewMovement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [cajaOrigen, setCajaOrigen] = useState<"caja_chica" | "banco">("caja_chica");
  const [personType, setPersonType] = useState<"socio" | "persona">("socio");
  const [concept, setConcept] = useState("Cuota Socio");
  const [servicio, setServicio] = useState("");

  const [duesConfig, setDuesConfig] = useState<DuesConfig | null>(null);
  const [serviciosFromApi, setServiciosFromApi] = useState<ServiceItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [personsLoading, setPersonsLoading] = useState(true);

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberHasCementerio, setMemberHasCementerio] = useState(false);
  const [familyPayment, setFamilyPayment] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<Set<string>>(new Set());

  const [personSearch, setPersonSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [importeStr, setImporteStr] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const memberSearchRef = useRef<HTMLDivElement>(null);
  const personSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (memberSearchRef.current && !memberSearchRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
      if (personSearchRef.current && !personSearchRef.current.contains(e.target as Node)) {
        setShowPersonDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchDuesConfig(),
      fetchServices(),
    ]).then(([cfg, svcs]) => {
      if (mounted) {
        setDuesConfig(cfg);
        setServiciosFromApi(svcs);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    let mounted = true;
    setPersonsLoading(true);
    fetchAllPersons()
      .then((data) => {
        if (mounted) {
          setPersons(data);
          setPersonsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setPersonsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedMember) {
      setMemberHasCementerio(false);
      setFamilyPayment(false);
      setFamilyMembers([]);
      setSelectedFamilyMembers(new Set());
      return;
    }
    let mounted = true;
    fetchMemberCemeteryCheck(selectedMember.id)
      .then((result) => {
        if (mounted) setMemberHasCementerio(result.hasCementerio);
      })
      .catch(() => {
        if (mounted) setMemberHasCementerio(false);
      });
    return () => { mounted = false; };
  }, [selectedMember]);

  useEffect(() => {
    if (!selectedMember || !familyPayment || concept !== "Cuota Socio") {
      setFamilyMembers([]);
      setSelectedFamilyMembers(new Set());
      return;
    }
    let mounted = true;
    fetchFamilyMembers(selectedMember.id)
      .then((members) => {
        if (mounted) {
          setFamilyMembers(members);
          if (!id) {
            const initial = new Set<string>();
            members.forEach((fm) => initial.add(fm.id));
            setSelectedFamilyMembers(initial);
          }
        }
      })
      .catch(() => {
        if (mounted) setFamilyMembers([]);
      });
    return () => { mounted = false; };
  }, [selectedMember, familyPayment, concept, id]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetchMovementById(id)
      .then((m) => {
        if (!mounted) return;
        setCajaOrigen(m.mode === "efectivo" ? "caja_chica" : "banco");
        setFecha(m.date);
        setImporteStr(m.amount.toString().replace(".", ","));
        const colonIdx = m.detail?.indexOf(": ");
        setDescripcion(colonIdx && colonIdx > 0 ? m.detail.slice(colonIdx + 2) : "");

        if (m.concept) {
          if (m.concept === "Cementerio" || m.concept.startsWith("Cementerio")) {
            setConcept("Cementerio");
          } else if (m.concept.startsWith("Servicios")) {
            setConcept("Servicios");
            const svcName = m.concept.replace("Servicios - ", "");
            setServicio(svcName);
          } else {
            setConcept("Cuota Socio");
          }
        }

        const due = (m as any).linked_due;
        if (due) {
          setPeriodStart(due.period_start || "");
          setPeriodEnd(due.period_end || "");

          if (due.member_id) {
            setPersonType("socio");
            fetchMemberById(due.member_id).then((member) => {
              if (mounted) {
                setSelectedMember(member);
                setMemberSearch(member.nombre);
                  if (member.nroFamilia) {
                    fetchFamilyMembers(member.id)
                      .then((fms) => {
                        if (mounted && fms.length > 1) {
                          setFamilyMembers(fms);
                          const paidIds = (due.paid_members as string[]) || [];
                          if (paidIds.length > 0) {
                            setFamilyPayment(true);
                            setSelectedFamilyMembers(new Set(paidIds));
                          }
                        }
                      })
                  }
              }
            }).catch(() => {});
          } else if (due.person_id) {
            setPersonType("persona");
            fetchPersonById(due.person_id).then((person) => {
              if (mounted) {
                setSelectedPerson(person);
                setPersonSearch(person.nombre);
              }
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const selectedServiceAmount = useMemo(() => {
    if (concept !== "Servicios" || !servicio) return null;
    const found = serviciosFromApi.find((s) => s.name === servicio);
    return found ? found.amount : null;
  }, [concept, servicio, serviciosFromApi]);

  function monthsBetween(start: string, end: string): number {
    if (!start || !end) return 1;
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    if (!sy || !sm || !ey || !em) return 1;
    return (ey - sy) * 12 + (em - sm) + 1;
  }

  useEffect(() => {
    if (concept === "Cuota Socio" && duesConfig) {
      const count = familyPayment ? Math.max(selectedFamilyMembers.size, 1) : 1;
      const months = monthsBetween(periodStart, periodEnd);
      const total = duesConfig.member_fee * count * months;
      setImporteStr(total.toString().replace(".", ","));
    } else if (concept === "Cementerio" && duesConfig) {
      const months = monthsBetween(periodStart, periodEnd);
      const total = duesConfig.cemetery_fee * months;
      setImporteStr(total.toString().replace(".", ","));
    } else if (concept === "Servicios" && selectedServiceAmount !== null) {
      setImporteStr(selectedServiceAmount.toString().replace(".", ","));
    }
  }, [concept, duesConfig, selectedServiceAmount, familyPayment, selectedFamilyMembers, periodStart, periodEnd]);

  const socioConcepts = useMemo(() => {
    const base = ["Cuota Socio", "Servicios"];
    if (memberHasCementerio) base.push("Cementerio");
    return base;
  }, [memberHasCementerio]);

  const personaConcepts = ["Servicios", "Cementerio"];

  const currentConcepts = personType === "socio" ? socioConcepts : personaConcepts;

  useEffect(() => {
    if (!currentConcepts.includes(concept)) {
      setConcept(currentConcepts[0]);
    }
  }, [personType, currentConcepts, concept]);

  const showServicioSelect = concept === "Servicios";

  useEffect(() => {
    if (showServicioSelect && !servicio && serviciosFromApi.length > 0) {
      setServicio(serviciosFromApi[0].name);
    }
    if (!showServicioSelect) {
      setServicio("");
    }
  }, [showServicioSelect, servicio, serviciosFromApi]);

  const shouldCreateDue = concept === "Cuota Socio" || concept === "Cementerio";

  const mode = cajaOrigen === "caja_chica" ? "efectivo" : "transferencia";

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

  const personResults = useMemo(() => {
    if (personSearch.trim()) {
      const q = personSearch.toLowerCase();
      return persons
        .filter((p) => p.nombre.toLowerCase().includes(q) || p.documento.includes(q))
        .slice(0, 10);
    }
    return persons.slice(0, 10);
  }, [persons, personSearch]);

  const importeNum = useMemo(() => {
    const cleaned = importeStr.replace(/[^0-9,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [importeStr]);

  const touchField = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {};
    if (personType === "socio" && !selectedMember) {
      errs.socio = "Seleccioná un socio";
    }
    if (personType === "persona" && !selectedPerson) {
      errs.persona = "Seleccioná una persona";
    }
    if (!fecha) {
      errs.fecha = "Ingresá una fecha";
    }
    if (!importeNum || importeNum <= 0) {
      errs.importe = "Ingresá un importe válido mayor a cero";
    }
    return errs;
  }, [personType, selectedMember, selectedPerson, fecha, importeNum]);

  const handleSelectMember = useCallback((m: Member) => {
    setSelectedMember(m);
    setMemberSearch(m.nombre);
    setShowMemberDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.socio;
      return next;
    });
  }, []);

  const handleClearMember = useCallback(() => {
    setSelectedMember(null);
    setMemberSearch("");
    setMemberHasCementerio(false);
    setFamilyPayment(false);
    setFamilyMembers([]);
    setSelectedFamilyMembers(new Set());
    setTouched((prev) => ({ ...prev, socio: true }));
    setErrors((prev) => ({ ...prev, socio: "Seleccioná un socio" }));
  }, []);

  const handleSelectPerson = useCallback((p: Person) => {
    setSelectedPerson(p);
    setPersonSearch(p.nombre);
    setShowPersonDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.persona;
      return next;
    });
  }, []);

  const handleClearPerson = useCallback(() => {
    setSelectedPerson(null);
    setPersonSearch("");
    setTouched((prev) => ({ ...prev, persona: true }));
    setErrors((prev) => ({ ...prev, persona: "Seleccioná una persona" }));
  }, []);

  const payerName = personType === "socio"
    ? selectedMember?.nombre ?? ""
    : selectedPerson?.nombre ?? "";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      setTouched({ socio: true, persona: true, fecha: true, importe: true });
      if (Object.keys(errs).length > 0) return;

      setSaving(true);
      setApiError(null);
      setSuccess(false);

      try {
        const conceptLabel = showServicioSelect
          ? `${concept} - ${servicio}`
          : concept;

        const detail = `${conceptLabel} - ${payerName}${descripcion ? `: ${descripcion}` : ""}`;

        if (isEditing && id) {
          const dueData: Record<string, any> = {};
          if (shouldCreateDue) {
            dueData.period_start = periodStart || null;
            dueData.period_end = periodEnd || null;
            if (concept === "Cuota Socio" && familyPayment && selectedFamilyMembers.size > 0) {
              dueData.paid_members = Array.from(selectedFamilyMembers);
            }
          }
          await updateMovement(id, {
            date: fecha,
            detail,
            amount: importeNum,
            type: "ingreso",
            mode,
            concept: conceptLabel,
            due: Object.keys(dueData).length > 0 ? dueData : undefined,
          });
        } else {
          const { id: movementId } = await savePayment({
            date: fecha,
            detail,
            amount: importeNum,
            type: "ingreso",
            mode,
            concept: conceptLabel,
          });

          if (shouldCreateDue) {
            const dueType = concept === "Cementerio" ? "cementerio" : "socio";
            const commonDue = {
              type: dueType,
              payment_date: fecha,
              period_start: periodStart || null,
              period_end: periodEnd || null,
            } as const;
            if (dueType === "socio" && familyPayment && selectedMember && selectedFamilyMembers.size > 0) {
              await saveDue({
                ...commonDue,
                member_id: selectedMember.id,
                movement_id: movementId,
                family_group: selectedMember.nroFamilia.split("/")[0],
                paid_members: Array.from(selectedFamilyMembers),
              });
            } else {
              await saveDue({
                ...commonDue,
                member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                movement_id: movementId,
              });
            }
          }
        }

        if (isEditing) {
          navigate(`/tesoreria/movimientos/detalle/${id}`);
        } else {
          setSuccess(true);
          setSelectedMember(null);
          setMemberSearch("");
          setMemberHasCementerio(false);
          setFamilyPayment(false);
          setFamilyMembers([]);
          setSelectedFamilyMembers(new Set());
          setSelectedPerson(null);
          setPersonSearch("");
          setImporteStr("");
          setDescripcion("");
          setErrors({});
          setTouched({});
          setApiError(null);
        }
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Error al guardar el movimiento");
      } finally {
        setSaving(false);
      }
    },
    [
      isEditing, id, validate, showServicioSelect, servicio, concept, payerName,
      descripcion, fecha, importeNum, mode, shouldCreateDue,
      personType, selectedMember, selectedPerson, familyPayment, selectedFamilyMembers,
      periodStart, periodEnd, navigate,
    ]
  );

  const originLabel = cajaOrigen === "caja_chica" ? "Caja Chica" : "Banco";
  const formaPagoLabel = mode === "efectivo" ? "Efectivo" : "Transferencia";
  const personTypeLabel = personType === "socio" ? "Socio" : "Persona";

  return (
    <form className="new-movement-container" onSubmit={handleSubmit} noValidate>
      {success && (
        <div className="success-banner">
          <CheckCircle size={18} />
          Movimiento registrado correctamente
          <button type="button" className="success-close" onClick={() => setSuccess(false)}>
            <X size={16} />
          </button>
        </div>
      )}
      {apiError && (
        <div className="error-banner">
          <Info size={18} />
          {apiError}
          <button type="button" className="success-close" onClick={() => setApiError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="new-movement-layout">
        <div className="new-movement-form-section">
          <div className="card-custom">
            <h3 className="card-title">Datos del Movimiento</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Origen del Movimiento <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={cajaOrigen}
                  onChange={(e) => setCajaOrigen(e.target.value as "caja_chica" | "banco")}
                >
                  <option value="caja_chica">Caja Chica</option>
                  <option value="banco">Banco</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Forma de Pago <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    className="form-control"
                    value={formaPagoLabel}
                    readOnly
                  />
                  <CreditCard size={18} className="input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Quien realiza el pago <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={personType}
                  onChange={(e) => setPersonType(e.target.value as "socio" | "persona")}
                >
                  <option value="socio">Socio</option>
                  <option value="persona">Persona</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Concepto <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                >
                  {currentConcepts.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {showServicioSelect && (
                <div className="form-group full-width">
                  <label>
                    Servicio <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={servicio}
                    onChange={(e) => setServicio(e.target.value)}
                  >
                    {serviciosFromApi.length === 0 ? (
                      <option value="">No hay servicios disponibles</option>
                    ) : (
                      serviciosFromApi.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {shouldCreateDue && (
                <>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                    <div style={{ flex: "0 0 33%" }}>
                      <button
                        type="button"
                        className="header-btn-sm"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: "0.9rem",
                          justifyContent: "center",
                        }}
                        onClick={() => {
                          const now = new Date();
                          const y = now.getFullYear();
                          const m = String(now.getMonth() + 1).padStart(2, "0");
                          const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
                          setPeriodStart(`${y}-${m}-01`);
                          setPeriodEnd(`${y}-${m}-${String(lastDay).padStart(2, "0")}`);
                        }}
                      >
                        Este mes
                      </button>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>
                        Desde <span className="required">*</span>
                      </label>
                      <div className="input-with-icon date-input-wrap">
                        <input
                          type="date"
                          className="form-control"
                          value={periodStart}
                          onChange={(e) => setPeriodStart(e.target.value)}
                          id="period-start"
                        />
                        <button
                          type="button"
                          className="date-picker-btn"
                          onClick={() => {
                            const el = document.getElementById("period-start") as HTMLInputElement | null;
                            if (el) { el.focus(); el.showPicker?.(); }
                          }}
                        >
                          <Calendar size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>
                        Hasta <span className="required">*</span>
                      </label>
                      <div className="input-with-icon date-input-wrap">
                        <input
                          type="date"
                          className="form-control"
                          value={periodEnd}
                          onChange={(e) => setPeriodEnd(e.target.value)}
                          id="period-end"
                        />
                        <button
                          type="button"
                          className="date-picker-btn"
                          onClick={() => {
                            const el = document.getElementById("period-end") as HTMLInputElement | null;
                            if (el) { el.focus(); el.showPicker?.(); }
                          }}
                        >
                          <Calendar size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label>
                  {personType === "socio" ? "Socio" : "Persona"} <span className="required">*</span>
                </label>

                {personType === "socio" ? (
                  <div className="member-search-wrapper" ref={memberSearchRef}>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        className={`form-control${touched.socio && errors.socio ? " input-error" : ""}`}
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
                        onFocus={() => setShowMemberDropdown(true)}
                        onBlur={() => {
                          if (!selectedMember) touchField("socio");
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

                    {selectedMember && concept === "Cuota Socio" && (
                      <div className="family-payment-section">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={familyPayment}
                            onChange={(e) => setFamilyPayment(e.target.checked)}
                          />
                          Pago por grupo familiar
                        </label>
                        {familyPayment && familyMembers.length > 0 && (
                          <div className="family-member-list">
                            <p className="family-member-hint">Seleccioná los miembros del grupo familiar a pagar:</p>
                            {familyMembers.map((fm) => {
                              const isPayer = fm.id === selectedMember.id;
                              return (
                                <label key={fm.id} className={`family-member-item${isPayer ? " family-member-payer" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedFamilyMembers.has(fm.id)}
                                    onChange={() => {
                                      setSelectedFamilyMembers((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(fm.id)) next.delete(fm.id);
                                        else next.add(fm.id);
                                        return next;
                                      });
                                    }}
                                  />
                                  <span>{fm.nombre}</span>
                                  <span className="family-member-socio">Nº {fm.numeroDeSocio}</span>
                                  {isPayer && <span className="family-member-badge">Paga</span>}
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {familyPayment && familyMembers.length === 0 && (
                          <p className="family-member-hint">No se encontraron miembros del grupo familiar.</p>
                        )}
                      </div>
                    )}

                    {touched.socio && errors.socio && (
                      <span className="field-error">{errors.socio}</span>
                    )}
                  </div>
                ) : (
                  <div className="member-search-wrapper" ref={personSearchRef}>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        className={`form-control${touched.persona && errors.persona ? " input-error" : ""}`}
                        placeholder={
                          personsLoading
                            ? "Cargando personas..."
                            : "Buscar persona por nombre o DNI..."
                        }
                        value={personSearch}
                        onChange={(e) => {
                          setPersonSearch(e.target.value);
                          setShowPersonDropdown(true);
                          if (selectedPerson && e.target.value !== selectedPerson.nombre) {
                            setSelectedPerson(null);
                          }
                        }}
                        onFocus={() => setShowPersonDropdown(true)}
                        onBlur={() => {
                          if (!selectedPerson) touchField("persona");
                        }}
                        disabled={personsLoading}
                      />
                      <Search size={18} className="input-icon" />
                    </div>

                    {showPersonDropdown && personResults.length > 0 && !selectedPerson && (
                      <div className="member-dropdown">
                        {personResults.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            className="member-dropdown-item"
                            onClick={() => handleSelectPerson(p)}
                          >
                            <User size={16} />
                            <div className="member-dropdown-info">
                              <span className="member-dropdown-name">{p.nombre}</span>
                              <span className="member-dropdown-detail">
                                {p.tipoDoc} {p.documento}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedPerson && (
                      <div className="selected-user-card">
                        <div className="user-info">
                          <div className="user-avatar-small">
                            <User size={20} />
                          </div>
                          <div className="user-details">
                            <span className="user-name">{selectedPerson.nombre}</span>
                            <span className="user-dni">{selectedPerson.tipoDoc} {selectedPerson.documento}</span>
                          </div>
                        </div>
                        <div className="user-status">
                          <button type="button" className="clear-member-btn" onClick={handleClearPerson}>
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {touched.persona && errors.persona && (
                      <span className="field-error">{errors.persona}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  Fecha <span className="required">*</span>
                </label>
                <div className="input-with-icon date-input-wrap">
                  <input
                    type="date"
                    className={`form-control${touched.fecha && errors.fecha ? " input-error" : ""}`}
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.fecha;
                        return next;
                      });
                    }}
                    onBlur={() => {
                      if (!fecha) touchField("fecha");
                    }}
                    id="movement-date"
                  />
                  <button
                    type="button"
                    className="date-picker-btn"
                    onClick={() => {
                      const el = document.getElementById("movement-date") as HTMLInputElement | null;
                      if (el) {
                        el.focus();
                        el.showPicker?.();
                      }
                    }}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
                {touched.fecha && errors.fecha && (
                  <span className="field-error">{errors.fecha}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Importe <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    className={`form-control${touched.importe && errors.importe ? " input-error" : ""}`}
                    placeholder="0,00"
                    value={importeStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cleaned = raw.replace(/[^0-9,]/g, "");
                      setImporteStr(cleaned);
                      if (parseFloat(cleaned.replace(",", ".")) > 0) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.importe;
                          return next;
                        });
                      }
                    }}
                    onBlur={() => touchField("importe")}
                  />
                  <DollarSign size={18} className="input-icon" />
                </div>
                {touched.importe && errors.importe && (
                  <span className="field-error">{errors.importe}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label>Descripción / Observaciones</label>
                <textarea
                  className="form-control text-area"
                  placeholder="Detalle del movimiento..."
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={200}
                />
                <span className="char-counter">{descripcion.length}/200</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => window.history.back()}>
                Cancelar
              </button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar Movimiento"}
              </button>
            </div>

            <div className="info-alert">
              <Info size={18} />
              <p>
                Los movimientos registrados se reflejarán automáticamente en el saldo disponible y en los
                reportes de tesorería.
              </p>
            </div>
          </div>
        </div>

        <div className="new-movement-sidebar-section">
          <div className="card-custom summary-card">
            <h3 className="card-title">Resumen del Movimiento</h3>
            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-label">
                  <Landmark size={16} /> <span>Origen</span>
                </div>
                <div className="summary-value">{originLabel}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <CreditCard size={16} /> <span>Forma de Pago</span>
                </div>
                <div className="summary-value">{formaPagoLabel}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Tipo</span>
                </div>
                <div className="summary-value">{personTypeLabel}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <Info size={16} /> <span>Concepto</span>
                </div>
                <div className="summary-value">
                  {showServicioSelect ? `${concept} - ${servicio}` : concept}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Paga</span>
                </div>
                <div className="summary-value">
                  {payerName || "—"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <Calendar size={16} /> <span>Fecha</span>
                </div>
                <div className="summary-value">{fecha || "—"}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <DollarSign size={16} /> <span>Importe</span>
                </div>
                <div className="summary-value highlight-green">
                  {importeNum > 0 ? toCurrency(importeNum) : "—"}
                </div>
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
                  {selectedMember.nroFamilia && (
                    <span className="socio-sub" style={{ fontWeight: 600, color: "var(--azul-institucional)" }}>
                      Grupo Familiar: {selectedMember.nroFamilia.split("/")[0]}
                    </span>
                  )}
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

          {selectedPerson && (
            <div className="card-custom socio-info-card">
              <h3 className="card-title">Información de la Persona</h3>
              <div className="socio-profile">
                <div className="socio-avatar">
                  <User size={32} />
                </div>
                <div className="socio-meta">
                  <span className="socio-name">{selectedPerson.nombre}</span>
                  <span className="socio-sub">{selectedPerson.tipoDoc}: {selectedPerson.documento}</span>
                </div>
              </div>
              <div className="socio-contact">
                <div className="contact-item">
                  <Phone size={16} /> <span>{selectedPerson.telefono || "—"}</span>
                </div>
                <div className="contact-item">
                  <MapPin size={16} /> <span>{selectedPerson.domicilio || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default NewMovement;
