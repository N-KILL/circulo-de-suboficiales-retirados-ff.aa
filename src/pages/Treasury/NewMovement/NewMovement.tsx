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
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { savePayment } from "../../../services/paymentsApi";
import { fetchMembers, fetchMemberById } from "../../../services/membersApi";
import { fetchAllPersons, fetchPersonById } from "../../../services/personsApi";
import { fetchMovementById, updateMovement } from "../../../services/movementsApi";
import { fetchDuesByMember, saveDue, fetchFamilyMembers } from "../../../services/duesApi";
import { fetchDuesConfig } from "../../../services/duesConfigApi";
import { fetchServices } from "../../../services/servicesApi";
import { fetchCementeriosByOwner, fetchCementerioOwnerIds, saveCementerioMovimiento, updateCementerioRecord } from "../../../services/cementeriosApi";
import { fetchMembersDebtStatus } from "../../../services/membersDebtApi";
import { saveServiceRecord, updateServiceRecord, fetchServiceRecordsByMovement, deleteServiceRecord } from "../../../services/serviceRecordsApi";
import { saveService } from "../../../services/servicesApi";
import type { DuesConfig } from "../../../services/duesConfigApi";
import type { ServiceItem } from "../../../services/servicesApi";
import type { MembersDebtStatus } from "../../../services/membersDebtApi";
import type { Member, Person, Cementerio } from "../../../models/members";
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
  period?: string;
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
  const [familyPayment, setFamilyPayment] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<Set<string>>(new Set());

  const [personSearch, setPersonSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [importeStr, setImporteStr] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periods, setPeriods] = useState<string[]>([]);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [paidPeriods, setPaidPeriods] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [debtStatus, setDebtStatus] = useState<MembersDebtStatus | null>(null);
  const [debtLoading, setDebtLoading] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [cementeriosList, setCementeriosList] = useState<Cementerio[]>([]);
  const [selectedCementerios, setSelectedCementerios] = useState<Cementerio[]>([]);
  const [cementerioSelectedYears, setCementerioSelectedYears] = useState<Map<string, Set<string>>>(new Map());
  const [cementerioOwnerIds, setCementerioOwnerIds] = useState<{ memberIds: string[]; personIds: string[] } | null>(null);

  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCost, setNewServiceCost] = useState("");
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

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
      fetchMembersDebtStatus(),
    ]).then(([cfg, svcs, debt]) => {
      if (mounted) {
        setDuesConfig(cfg);
        setServiciosFromApi(svcs);
        setDebtStatus(debt);
        setDebtLoading(false);
      }
    }).catch(() => { if (mounted) setDebtLoading(false); });
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
      setFamilyPayment(false);
      setFamilyMembers([]);
      setSelectedFamilyMembers(new Set());
      return;
    }
  }, [selectedMember]);

  useEffect(() => {
    if (concept !== "Cementerio") {
      setCementeriosList([]);
      setSelectedCementerios([]);
      setCementerioSelectedYears(new Map());
      return;
    }
    const ownerId = personType === "socio" ? selectedMember?.id : selectedPerson?.id;
    if (!ownerId) {
      setCementeriosList([]);
      setSelectedCementerios([]);
      setCementerioSelectedYears(new Map());
      return;
    }
    let mounted = true;
    fetchCementeriosByOwner(ownerId, personType === "socio")
      .then((list) => {
        if (mounted) {
          setCementeriosList(list);
          setSelectedCementerios([]);
          setCementerioSelectedYears(new Map());
        }
      })
      .catch(() => {
        if (mounted) {
          setCementeriosList([]);
          setSelectedCementerios([]);
          setCementerioSelectedYears(new Map());
        }
      });
    return () => { mounted = false; };
  }, [concept, personType, selectedMember, selectedPerson, id]);

  useEffect(() => {
    if (concept !== "Cementerio") {
      setCementerioOwnerIds(null);
      return;
    }
    let mounted = true;
    fetchCementerioOwnerIds()
      .then((ids) => { if (mounted) setCementerioOwnerIds(ids); })
      .catch(() => { if (mounted) setCementerioOwnerIds(null); });
    return () => { mounted = false; };
  }, [concept]);

  function getAvailableYears(c: Cementerio): number[] {
    const currentYear = new Date().getFullYear();
    const ultimoPago = c.ultimoPago ? parseInt(c.ultimoPago, 10) : 0;
    const years: number[] = [];
    for (let y = ultimoPago + 1; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }

  function getFeeForCementerio(c: Cementerio): number {
    if (!duesConfig) return 0;
    const tipo = (c.tipo || "nicho").toLowerCase();
    const isSocio = personType === "socio";
    if (tipo === "urna") return isSocio ? duesConfig.urna_member_fee : duesConfig.urna_non_member_fee;
    if (tipo === "bolsa") return isSocio ? duesConfig.bolsa_member_fee : duesConfig.bolsa_non_member_fee;
    return isSocio ? duesConfig.nicho_member_fee : duesConfig.nicho_non_member_fee;
  }

  function toggleCementerioSelection(c: Cementerio) {
    setSelectedCementerios((prev) => {
      const exists = prev.find((x) => x.id === c.id);
      if (exists) {
        setCementerioSelectedYears((prev2) => {
          const next = new Map(prev2);
          next.delete(c.id);
          return next;
        });
        return prev.filter((x) => x.id !== c.id);
      }
      const available = getAvailableYears(c);
      setCementerioSelectedYears((prev2) => {
        const next = new Map(prev2);
        next.set(c.id, new Set(available.map(String)));
        return next;
      });
      return [...prev, c];
    });
    setErrors((prev) => {
      if (!prev.period) return prev;
      const next = { ...prev };
      delete next.period;
      return next;
    });
  }

  function toggleYearForCementerio(cementerioId: string, year: string) {
    setCementerioSelectedYears((prev) => {
      const next = new Map(prev);
      const current = next.get(cementerioId) || new Set();
      const updated = new Set(current);
      if (updated.has(year)) updated.delete(year);
      else updated.add(year);
      next.set(cementerioId, updated);
      return next;
    });
    setErrors((prev) => {
      if (!prev.period) return prev;
      const next = { ...prev };
      delete next.period;
      return next;
    });
  }

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
    if (!selectedMember || concept !== "Cuota Socio") {
      setPaidPeriods(new Set());
      return;
    }
    let mounted = true;
    fetchDuesByMember(selectedMember.id)
      .then((dues) => {
        if (!mounted) return;
        const all = new Set<string>();
        for (const d of dues) {
          if (d.movement_id === id) continue;
          if (d.period) d.period.forEach((p) => all.add(p));
        }
        setPaidPeriods(all);
      })
      .catch(() => {
        if (mounted) setPaidPeriods(new Set());
      });
    return () => { mounted = false; };
  }, [selectedMember, concept, id]);

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
          if (due.period && Array.isArray(due.period) && due.period.length > 0) {
            setPeriods(due.period);
            const [y] = due.period[0].split("-");
            setPeriodYear(Number(y));
          }

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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetchServiceRecordsByMovement(id)
      .then((records) => {
        if (mounted && records.length > 0 && records[0].service_date) {
          setServiceDate(records[0].service_date);
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

  function parseDateYMD(dateStr: string): Date | null {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m - 1, d);
    }
    if (parts.length === 2) {
      const [y, m] = parts.map(Number);
      if (!isNaN(y) && !isNaN(m)) return new Date(y, m - 1, 1);
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  function calculateMonthsOwed(memberId: string): number | null {
    if (!debtStatus) return null;
    const lastEnd = debtStatus.members[memberId];
    if (!lastEnd) return null;
    const last = parseDateYMD(lastEnd);
    if (!last) return null;
    const now = new Date();
    const months = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
    return Math.max(0, months - 1);
  }

  function formatPeriod(periodStr: string): string {
    const parts = periodStr.split("-");
    if (parts.length >= 2) {
      const y = parts[0];
      const m = parts[1];
      if (y && m && !isNaN(Number(y)) && !isNaN(Number(m))) return `${m.padStart(2, "0")}/${y}`;
    }
    return periodStr;
  }



  function getLastPaidPeriod(memberId: string): string | null {
    if (!debtStatus) return null;
    return debtStatus.members[memberId] || null;
  }

  useEffect(() => {
    if (concept === "Cuota Socio" && duesConfig) {
      const unpaidPeriods = periods.filter((p) => !paidPeriods.has(p));
      const count = familyPayment ? Math.max(selectedFamilyMembers.size, 1) : 1;
      const monthCount = unpaidPeriods.length > 0 ? unpaidPeriods.length : 1;
      const total = duesConfig.member_fee * count * monthCount;
      setImporteStr(total.toString().replace(".", ","));
    } else if (concept === "Cementerio" && duesConfig && selectedCementerios.length > 0) {
      let total = 0;
      for (const c of selectedCementerios) {
        const years = cementerioSelectedYears.get(c.id);
        const yearCount = years ? years.size : 0;
        total += getFeeForCementerio(c) * yearCount;
      }
      setImporteStr(total.toString().replace(".", ","));
    } else if (concept === "Servicios" && selectedServiceAmount !== null) {
      setImporteStr(selectedServiceAmount.toString().replace(".", ","));
    }
    setErrors((prev) => {
      if (!prev.period) return prev;
      const next = { ...prev };
      delete next.period;
      return next;
    });
  }, [concept, duesConfig, selectedServiceAmount, familyPayment, selectedFamilyMembers, periods, paidPeriods, selectedCementerios, cementerioSelectedYears, personType]);

  const socioConcepts = useMemo(() => {
    return ["Cuota Socio", "Servicios", "Cementerio"];
  }, []);

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

  const shouldCreateDue = concept === "Cuota Socio" || (concept === "Cementerio" && selectedCementerios.length > 0);

  const mode = cajaOrigen === "caja_chica" ? "efectivo" : "transferencia";

  const memberResults = useMemo(() => {
    let list = members;
    if (concept === "Cementerio" && cementerioOwnerIds) {
      const ids = new Set(cementerioOwnerIds.memberIds);
      list = members.filter((m) => ids.has(m.id));
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      return list
        .filter(
          (m) =>
            m.nombre.toLowerCase().includes(q) ||
            m.documento.includes(q) ||
            m.numeroDeSocio.includes(q)
        )
        .slice(0, 10);
    }
    return list.slice(0, 10);
  }, [members, memberSearch, concept, cementerioOwnerIds]);

  const personResults = useMemo(() => {
    let list = persons;
    if (concept === "Cementerio" && cementerioOwnerIds) {
      const ids = new Set(cementerioOwnerIds.personIds);
      list = persons.filter((p) => ids.has(p.id));
    }
    if (personSearch.trim()) {
      const q = personSearch.toLowerCase();
      return list
        .filter((p) => p.nombre.toLowerCase().includes(q) || p.documento.includes(q))
        .slice(0, 10);
    }
    return list.slice(0, 10);
  }, [persons, personSearch, concept, cementerioOwnerIds]);

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
    if (shouldCreateDue && concept === "Cuota Socio" && periods.length === 0) {
      errs.period = "Seleccioná al menos un mes";
    }
    if (concept === "Cementerio" && selectedCementerios.length === 0) {
      errs.period = "Seleccioná al menos un nicho/urna/bolsa";
    }
    if (concept === "Cementerio" && selectedCementerios.length > 0) {
      const allEmpty = selectedCementerios.every((c) => {
        const years = cementerioSelectedYears.get(c.id);
        return !years || years.size === 0;
      });
      if (allEmpty) {
        errs.period = "Seleccioná al menos un año para pagar";
      }
    }
    if (!importeNum || importeNum <= 0) {
      errs.importe = "Ingresá un importe válido mayor a cero";
    }
    return errs;
  }, [personType, selectedMember, selectedPerson, fecha, shouldCreateDue, periods, importeNum]);

  const handleSelectMember = useCallback((m: Member) => {
    setSelectedMember(m);
    setMemberSearch(m.nombre);
    setShowMemberDropdown(false);
    setPeriods([]);
    setPaidPeriods(new Set());
    setErrors((prev) => {
      const next = { ...prev };
      delete next.socio;
      return next;
    });
  }, []);

  const handleClearMember = useCallback(() => {
    setSelectedMember(null);
    setMemberSearch("");
    setFamilyPayment(false);
    setFamilyMembers([]);
    setSelectedFamilyMembers(new Set());
    setPeriods([]);
    setPaidPeriods(new Set());
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
            dueData.period = periods.length > 0 ? periods : null;
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

          const existingRecords = await fetchServiceRecordsByMovement(id);
          const existingRecord = existingRecords.length > 0 ? existingRecords[0] : null;

          if (concept === "Servicios" && servicio) {
            const service = serviciosFromApi.find((s) => s.name === servicio);
            if (service) {
              if (existingRecord) {
                await updateServiceRecord(existingRecord.id, {
                  service_id: service.id,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                  amount: importeNum,
                  date: fecha,
                  service_date: serviceDate,
                  detail: descripcion || null,
                });
              } else {
                await saveServiceRecord({
                  service_id: service.id,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                  movement_id: id,
                  amount: importeNum,
                  date: fecha,
                  service_date: serviceDate,
                  detail: descripcion || null,
                });
              }
            }
          } else if (existingRecord) {
            await deleteServiceRecord(existingRecord.id);
          }
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
            if (dueType === "cementerio") {
              for (const c of selectedCementerios) {
                const years = cementerioSelectedYears.get(c.id);
                const yearPeriods = years ? Array.from(years).sort() : null;
                await saveDue({
                  type: "cementerio",
                  payment_date: fecha,
                  period: yearPeriods,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                  movement_id: movementId,
                });

                const aniosPagados = years ? Array.from(years).sort() : [];
                const maxYear = aniosPagados.length > 0 ? aniosPagados[aniosPagados.length - 1] : null;
                await saveCementerioMovimiento({
                  movement_id: movementId,
                  cementerio_id: c.id,
                  nicho: c.nicho,
                  tipo: c.tipo || null,
                  ocupante: c.ocupante || null,
                  anios_pagados: aniosPagados,
                  importe: getFeeForCementerio(c) * aniosPagados.length,
                  fecha_pago: fecha,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                });

                if (maxYear) {
                  const patchData: Record<string, any> = {
                    ultimoPago: maxYear,
                    fechaDePago: fecha,
                  };
                  await updateCementerioRecord(c.id, patchData);
                }
              }
            } else if (familyPayment && selectedMember && selectedFamilyMembers.size > 0) {
              await saveDue({
                type: "socio",
                payment_date: fecha,
                period: periods.length > 0 ? periods : null,
                member_id: selectedMember.id,
                movement_id: movementId,
                family_group: selectedMember.nroFamilia.split("/")[0],
                paid_members: Array.from(selectedFamilyMembers),
              });
            } else {
              await saveDue({
                type: "socio",
                payment_date: fecha,
                period: periods.length > 0 ? periods : null,
                member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                movement_id: movementId,
              });
            }
          }

          if (concept === "Servicios" && servicio) {
            const service = serviciosFromApi.find((s) => s.name === servicio);
            if (service) {
              await saveServiceRecord({
                service_id: service.id,
                member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                movement_id: movementId,
                amount: importeNum,
                date: fecha,
                service_date: serviceDate,
                detail: descripcion || null,
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
          setFamilyPayment(false);
          setFamilyMembers([]);
          setSelectedFamilyMembers(new Set());
          setSelectedPerson(null);
          setPersonSearch("");
          setSelectedCementerios([]);
          setCementerioSelectedYears(new Map());
          setCementeriosList([]);
          setServiceDate(new Date().toISOString().split("T")[0]);
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
      descripcion, fecha, serviceDate, importeNum, mode, shouldCreateDue,
      personType, selectedMember, selectedPerson, familyPayment, selectedFamilyMembers,
      periods, navigate, serviciosFromApi,
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
      {errors.period && (
        <div className="error-banner">
          <Info size={18} />
          <span>{errors.period}</span>
          <button type="button" className="success-close" onClick={() => setErrors((prev) => { const n = { ...prev }; delete n.period; return n; })}>
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
                  onChange={(e) => {
                    setPersonType(e.target.value as "socio" | "persona");
                    setSelectedMember(null);
                    setMemberSearch("");
                    setFamilyPayment(false);
                    setFamilyMembers([]);
                    setSelectedFamilyMembers(new Set());
                    setSelectedPerson(null);
                    setPersonSearch("");
                    setPeriods([]);
                    setPaidPeriods(new Set());
                    setSelectedCementerios([]);
                    setCementerioSelectedYears(new Map());
                    setCementeriosList([]);
                  }}
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
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      className="form-control"
                      value={servicio}
                      onChange={(e) => setServicio(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {serviciosFromApi.length === 0 ? (
                        <option value="">No hay servicios disponibles</option>
                      ) : (
                        serviciosFromApi.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      className="add-service-btn"
                      onClick={() => {
                        setNewServiceName("");
                        setNewServiceCost("");
                        setServiceError(null);
                        setShowNewServiceModal(true);
                      }}
                      title="Agregar nuevo servicio"
                    >
                      +
                    </button>
                  </div>
                </div>
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
            </div>

              {concept === "Cementerio" && (
                <div className="cementerio-section-full">
                  <label className="cementerio-section-label">
                    Cementerio <span className="required">*</span>
                  </label>
                  {cementeriosList.length === 0 ? (
                    <p className="cementerio-empty-msg">
                      No se encontraron nichos/urnas/bolsas para este titular.
                    </p>
                  ) : (
                    <div className="cementerio-cards-grid">
                      {cementeriosList.map((c) => {
                        const isSelected = selectedCementerios.some((x) => x.id === c.id);
                        const availableYears = getAvailableYears(c);
                        const selectedYears = cementerioSelectedYears.get(c.id) || new Set();
                        return (
                          <div
                            key={c.id}
                            className={`cementerio-selectable-card${isSelected ? " cementerio-card-selected" : ""}`}
                          >
                            <label className="cementerio-card-header">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCementerioSelection(c)}
                              />
                              <div className="cementerio-card-title">
                                <span className="cementerio-card-nicho">{c.nicho}</span>
                                <span className="cementerio-card-tipo">{c.tipo || "Nicho"}</span>
                              </div>
                            </label>
                            <div className="cementerio-card-details">
                              <div className="cementerio-card-row">
                                <span className="cementerio-card-dlabel">Ocupante</span>
                                <span className="cementerio-card-dvalue">{c.ocupante || "—"}</span>
                              </div>
                              <div className="cementerio-card-row">
                                <span className="cementerio-card-dlabel">Año Gracia</span>
                                <span className="cementerio-card-dvalue">{c.anioDeGracia || "—"}</span>
                              </div>
                              <div className="cementerio-card-row">
                                <span className="cementerio-card-dlabel">Último Pago</span>
                                <span className="cementerio-card-dvalue">{c.ultimoPago || "—"}</span>
                              </div>
                              <div className="cementerio-card-row">
                                <span className="cementerio-card-dlabel">Nº Orden</span>
                                <span className="cementerio-card-dvalue">{c.numeroOrden || "—"}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="cementerio-card-years">
                                <span className="cementerio-card-years-label">Años a pagar:</span>
                                {availableYears.length === 0 ? (
                                  <span className="cementerio-al-day">Al día</span>
                                ) : (
                                  <div className="cementerio-years-chips">
                                    {availableYears.map((y) => {
                                      const ys = String(y);
                                      return (
                                        <button
                                          key={y}
                                          type="button"
                                          className={`cementerio-year-chip${selectedYears.has(ys) ? " chip-active" : ""}`}
                                          onClick={() => toggleYearForCementerio(c.id, ys)}
                                        >
                                          {y}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            <div className="period-details-row">
              {shouldCreateDue && concept === "Cuota Socio" && (
                <div className="period-column">
                  <div className="period-field-group">
                    <label>
                      Período <span className="required">*</span>
                    </label>
                    <div className="period-year-nav">
                      <button type="button" className="period-year-btn" onClick={() => setPeriodYear((y) => y - 1)}>
                        &lt;
                      </button>
                      <span className="period-year-label">{periodYear}</span>
                      <button type="button" className="period-year-btn" onClick={() => setPeriodYear((y) => y + 1)}>
                        &gt;
                      </button>
                    </div>
                    <div className="period-months-grid">
                      {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((name, i) => {
                        const m = String(i + 1).padStart(2, "0");
                        const val = `${periodYear}-${m}`;
                        const active = periods.includes(val);
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`period-month-btn${active && !paidPeriods.has(val) ? " active" : ""}${paidPeriods.has(val) ? " paid" : ""}`}
                            onClick={() => {
                              if (paidPeriods.has(val)) return;
                              setPeriods((prev) => {
                                if (prev.includes(val)) return prev.filter((p) => p !== val);
                                return [...prev, val].sort();
                              });
                              setErrors((prev) => {
                                if (!prev.period) return prev;
                                const next = { ...prev };
                                delete next.period;
                                return next;
                              });
                            }}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="details-column">
                <div className="form-group">
                  <label>
                    {showServicioSelect ? "Fecha de pago" : "Fecha"} <span className="required">*</span>
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

                {showServicioSelect && (
                  <div className="form-group">
                    <label>Fecha del servicio</label>
                    <div className="input-with-icon date-input-wrap">
                      <input
                        type="date"
                        className="form-control"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        id="service-date"
                      />
                      <button
                        type="button"
                        className="date-picker-btn"
                        onClick={() => {
                          const el = document.getElementById("service-date") as HTMLInputElement | null;
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
                )}

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

                <div className="form-group">
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
                  <Calendar size={16} /> <span>{showServicioSelect ? "Fecha de pago" : "Fecha"}</span>
                </div>
                <div className="summary-value">{fecha || "—"}</div>
              </div>
              {showServicioSelect && (
                <div className="summary-item">
                  <div className="summary-label">
                    <Calendar size={16} /> <span>Fecha del servicio</span>
                  </div>
                  <div className="summary-value">{serviceDate || "—"}</div>
                </div>
              )}
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
                      <div className="contact-item">
                  <AlertTriangle size={16} /> <span>{"Estado deuda"}</span>
                </div>
              </div>

              {(() => {
                if (debtLoading) return null;
                const monthsOwed = calculateMonthsOwed(selectedMember.id);
                const canCalculate = monthsOwed !== null;
                const lastPaid = getLastPaidPeriod(selectedMember.id);
                const lastPaidFormatted = lastPaid ? formatPeriod(lastPaid) : "";
                const showWarning = canCalculate && monthsOwed! > 0;
                return (
                  <div className={`debt-alert${showWarning ? " debt-alert-warning" : " debt-alert-ok"}`}>
                    <div className="debt-alert-header">
                      <AlertTriangle size={16} />
                      <span>
                        {canCalculate
                          ? monthsOwed! > 0
                            ? `Debe ${monthsOwed} ${monthsOwed === 1 ? "mes" : "meses"}`
                            : `Al día (último pago: ${lastPaidFormatted})`
                          : lastPaidFormatted
                            ? `Último pago: ${lastPaidFormatted}`
                            : "No disp."
                        }
                      </span>
                    </div>
                    <a
                      href={`/socios/detalle/${selectedMember.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="debt-detail-btn"
                    >
                      Ver detalles
                      <ExternalLink size={14} />
                    </a>
                  </div>
                );
              })()}
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

      {showNewServiceModal && (
        <div className="modal-overlay" onClick={() => setShowNewServiceModal(false)}>
          <div className="modal-content" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Servicio</h3>
              <button className="modal-close" onClick={() => setShowNewServiceModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
              {serviceError && (
                <div className="error-banner" style={{ fontSize: 13 }}>
                  <Info size={16} /> {serviceError}
                </div>
              )}
              <div className="form-group">
                <label>Nombre <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del servicio"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Costo <span className="required">*</span></label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0,00"
                    value={newServiceCost}
                    onChange={(e) => setNewServiceCost(e.target.value.replace(/[^0-9,]/g, ""))}
                  />
                  <DollarSign size={18} className="input-icon" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewServiceModal(false)} disabled={savingService}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-save"
                  disabled={savingService || !newServiceName.trim() || !newServiceCost}
                  onClick={async () => {
                    const cost = parseFloat(newServiceCost.replace(",", "."));
                    if (!newServiceName.trim()) {
                      setServiceError("Ingresá un nombre");
                      return;
                    }
                    if (isNaN(cost) || cost <= 0) {
                      setServiceError("Ingresá un costo válido");
                      return;
                    }
                    setSavingService(true);
                    setServiceError(null);
                    try {
                      const created = await saveService(newServiceName.trim(), cost);
                      setServiciosFromApi((prev) => [...prev, created]);
                      setServicio(created.name);
                      setShowNewServiceModal(false);
                    } catch (err) {
                      setServiceError(err instanceof Error ? err.message : "Error al guardar servicio");
                    } finally {
                      setSavingService(false);
                    }
                  }}
                >
                  {savingService ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default NewMovement;
