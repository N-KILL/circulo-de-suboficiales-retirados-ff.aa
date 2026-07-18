import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DollarSign, Save, Loader } from "lucide-react";
import { savePayment } from "../../../services/paymentsApi";
import { fetchMembers, fetchMemberById } from "../../../services/membersApi";
import { fetchAllPersons, fetchPersonById } from "../../../services/personsApi";
import { fetchMovementById, updateMovement } from "../../../services/movementsApi";
import { fetchDuesByMember, saveDue, fetchFamilyMembers } from "../../../services/duesApi";
import { fetchDuesConfig } from "../../../services/duesConfigApi";
import { fetchServices } from "../../../services/servicesApi";
import { fetchCementeriosByOwner, fetchCementerioOwnerIds, fetchCementerioMovimientosByNicho, saveCementerioMovimiento, updateCementerioRecord } from "../../../services/cementeriosApi";
import { fetchMembersDebtStatus } from "../../../services/membersDebtApi";
import { saveServiceRecord, updateServiceRecord, fetchServiceRecordsByMovement, deleteServiceRecord } from "../../../services/serviceRecordsApi";
import { saveService } from "../../../services/servicesApi";
import { parseDateYMD } from "../../../utils/format";
import Banner from "../../../components/ui/Banner";
import DateInput from "../../../components/ui/DateInput";
import MovementFormFields from "./MovementFormFields";
import CementerioPicker from "./CementerioPicker";
import FamilyPaymentSection from "./FamilyPaymentSection";
import PeriodPicker from "../../../components/period/PeriodPicker";
import MovementSummary from "./MovementSummary";
import PersonInfoCard from "./PersonInfoCard";
import NewServiceModal from "./NewServiceModal";
import type { DuesConfig } from "../../../services/duesConfigApi";
import type { ServiceItem } from "../../../services/servicesApi";
import type { MembersDebtStatus } from "../../../services/membersDebtApi";
import type { Member, Person, Cementerio } from "../../../models/members";
import "./NewMovement.css";

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
  const [cementerioPaidYears, setCementerioPaidYears] = useState<Map<string, Set<string>>>(new Map());

  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCost, setNewServiceCost] = useState("");
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const memberSearchRef = useRef<HTMLDivElement>(null);
  const personSearchRef = useRef<HTMLDivElement>(null);

  const [prevSelectedMember, setPrevSelectedMember] = useState(selectedMember);
  const [prevConceptForCementerio, setPrevConceptForCementerio] = useState(concept);
  const [prevConceptForOwnerIds, setPrevConceptForOwnerIds] = useState(concept);
  const [prevOwnerKeyValue, setPrevOwnerKeyValue] = useState(`${personType}|${selectedMember?.id ?? ''}|${selectedPerson?.id ?? ''}`);
  const [prevFamilyDeps, setPrevFamilyDeps] = useState(`${selectedMember?.id ?? ''}|${String(familyPayment)}|${concept}`);
  const [prevPaidPeriodDeps, setPrevPaidPeriodDeps] = useState(`${selectedMember?.id ?? ''}|${concept}`);
  const [prevPersonTypeForConcept, setPrevPersonTypeForConcept] = useState(personType);

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
    fetchMembers()
      .then((data) => { if (mounted) { setMembers(data); setMembersLoading(false); } })
      .catch(() => { if (mounted) setMembersLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchAllPersons()
      .then((data) => { if (mounted) { setPersons(data); setPersonsLoading(false); } })
      .catch(() => { if (mounted) setPersonsLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (selectedMember !== prevSelectedMember) {
    setPrevSelectedMember(selectedMember);
    if (!selectedMember) {
      setFamilyPayment(false);
      setFamilyMembers([]);
      setSelectedFamilyMembers(new Set());
    }
  }

  if (concept !== prevConceptForCementerio) {
    setPrevConceptForCementerio(concept);
    if (concept !== "Cementerio") {
      setCementeriosList([]);
      setSelectedCementerios([]);
      setCementerioSelectedYears(new Map());
      setCementerioPaidYears(new Map());
    }
  }

  const ownerKey = `${personType}|${selectedMember?.id ?? ''}|${selectedPerson?.id ?? ''}`;
  if (ownerKey !== prevOwnerKeyValue) {
    setPrevOwnerKeyValue(ownerKey);
    if (concept === "Cementerio" && !selectedMember && !selectedPerson) {
      setCementeriosList([]);
      setSelectedCementerios([]);
      setCementerioSelectedYears(new Map());
      setCementerioPaidYears(new Map());
    }
  }

  useEffect(() => {
    if (concept !== "Cementerio") return;
    const ownerId = personType === "socio" ? selectedMember?.id : selectedPerson?.id;
    if (!ownerId) return;
    let mounted = true;
    fetchCementeriosByOwner(ownerId, personType === "socio")
      .then(async (list) => {
        if (!mounted) return;
        setCementeriosList(list);
        setSelectedCementerios([]);
        setCementerioSelectedYears(new Map());
        const paidYearsMap = new Map<string, Set<string>>();
        await Promise.all(
          list.map(async (c) => {
            try {
              const movimientos = await fetchCementerioMovimientosByNicho(c.nicho);
              const years = new Set<string>();
              for (const m of movimientos) {
                for (const y of m.anios_pagados) years.add(y);
              }
              paidYearsMap.set(c.nicho, years);
            } catch { /* ignore */ }
          })
        );
        if (mounted) setCementerioPaidYears(paidYearsMap);
      })
      .catch(() => {
        if (mounted) {
          setCementeriosList([]);
          setSelectedCementerios([]);
          setCementerioSelectedYears(new Map());
          setCementerioPaidYears(new Map());
        }
      });
    return () => { mounted = false; };
  }, [concept, personType, selectedMember, selectedPerson, id]);

  if (concept !== prevConceptForOwnerIds) {
    setPrevConceptForOwnerIds(concept);
    if (concept !== "Cementerio") {
      setCementerioOwnerIds(null);
    }
  }

  useEffect(() => {
    if (concept !== "Cementerio") return;
    let mounted = true;
    fetchCementerioOwnerIds()
      .then((ids) => { if (mounted) setCementerioOwnerIds(ids); })
      .catch(() => { if (mounted) setCementerioOwnerIds(null); });
    return () => { mounted = false; };
  }, [concept]);

  function getAvailableYears(c: Cementerio): number[] {
    const currentYear = new Date().getFullYear();
    const paidYears = new Set(cementerioPaidYears.get(c.nicho) || []);
    if (c.ultimoPago) {
      const num = parseInt(c.ultimoPago, 10);
      if (!isNaN(num)) paidYears.add(String(num));
    }

    let startYear = 2016;
    if (c.ultimoPago) {
      const ultimoPagoNum = parseInt(c.ultimoPago, 10);
      if (!isNaN(ultimoPagoNum)) {
        startYear = ultimoPagoNum + 1;
      }
    }
    if (c.anioDeGracia) {
      const graciaNum = parseInt(c.anioDeGracia, 10);
      if (!isNaN(graciaNum) && graciaNum + 1 > startYear) {
        startYear = graciaNum + 1;
      }
    }

    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      if (!paidYears.has(String(y))) years.push(y);
    }
    return years;
  }

  const getFeeForCementerio = useCallback((c: Cementerio): number => {
    if (!duesConfig) return 0;
    const tipo = (c.tipo || "nicho").toLowerCase();
    const isSocio = personType === "socio";
    if (tipo === "urna") return isSocio ? duesConfig.urna_member_fee : duesConfig.urna_non_member_fee;
    if (tipo === "bolsa") return isSocio ? duesConfig.bolsa_member_fee : duesConfig.bolsa_non_member_fee;
    return isSocio ? duesConfig.nicho_member_fee : duesConfig.nicho_non_member_fee;
  }, [duesConfig, personType]);

  const getMemberFee = useCallback((member: Member): number => {
    if (!duesConfig) return 0;
    const tipo = (member.tipoSocio || "").trim();
    let base = 0;
    if (tipo === "Activo") base = duesConfig.fee_act;
    else if (tipo === "Activo Tipo A") base = duesConfig.fee_act_a;
    else if (tipo === "Adherente") base = duesConfig.fee_adh;
    else if (tipo === "Participante") base = duesConfig.fee_part;
    else if (tipo === "Vitalicio") base = duesConfig.fee_vit;
    else base = duesConfig.member_fee;
    if (member.asistencial) base += duesConfig.asistencial_fee;
    if (member.planSalud) base += duesConfig.plan_salud_fee;
    return base;
  }, [duesConfig]);

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
    setErrors((prev) => { if (!prev.period) return prev; const next = { ...prev }; delete next.period; return next; });
  }

  function addCementerioYear(cementerioId: string) {
    const c = selectedCementerios.find((x) => x.id === cementerioId);
    if (!c) return;
    const available = getAvailableYears(c);
    const current = cementerioSelectedYears.get(cementerioId) || new Set();
    const nextYear = available.find((y) => !current.has(String(y)));
    if (!nextYear) return;
    setCementerioSelectedYears((prev) => {
      const next = new Map(prev);
      const updated = new Set(current);
      updated.add(String(nextYear));
      next.set(cementerioId, updated);
      return next;
    });
    setErrors((prev) => { if (!prev.period) return prev; const next = { ...prev }; delete next.period; return next; });
  }

  function removeCementerioYear(cementerioId: string) {
    const current = cementerioSelectedYears.get(cementerioId);
    if (!current || current.size === 0) return;
    const sorted = Array.from(current).sort();
    const lastYear = sorted[sorted.length - 1];
    setCementerioSelectedYears((prev) => {
      const next = new Map(prev);
      const updated = new Set(current);
      updated.delete(lastYear);
      next.set(cementerioId, updated);
      return next;
    });
    setErrors((prev) => { if (!prev.period) return prev; const next = { ...prev }; delete next.period; return next; });
  }

  const familyDeps = `${selectedMember?.id ?? ''}|${String(familyPayment)}|${concept}`;
  if (familyDeps !== prevFamilyDeps) {
    setPrevFamilyDeps(familyDeps);
    if (!selectedMember || !familyPayment || concept !== "Cuota Socio") {
      setFamilyMembers([]);
      setSelectedFamilyMembers(new Set());
    }
  }

  useEffect(() => {
    if (!selectedMember || !familyPayment || concept !== "Cuota Socio") return;
    let mounted = true;
    fetchFamilyMembers(selectedMember.id)
      .then((members) => {
        if (mounted) {
          const alive = members.filter((m) => !m.fallecido);
          setFamilyMembers(alive);
          if (!id) {
            const initial = new Set<string>();
            alive.filter((fm) => !fm.fallecido && (fm.pagaPor || "").toUpperCase() === "TES").forEach((fm) => initial.add(fm.id));
            setSelectedFamilyMembers(initial);
          }
        }
      })
      .catch(() => { if (mounted) setFamilyMembers([]); });
    return () => { mounted = false; };
  }, [selectedMember, familyPayment, concept, id]);

  const paidPeriodDeps = `${selectedMember?.id ?? ''}|${concept}`;
  if (paidPeriodDeps !== prevPaidPeriodDeps) {
    setPrevPaidPeriodDeps(paidPeriodDeps);
    if (!selectedMember || concept !== "Cuota Socio") {
      setPaidPeriods(new Set());
    }
  }

  useEffect(() => {
    if (!selectedMember || concept !== "Cuota Socio") return;
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
      .catch(() => { if (mounted) setPaidPeriods(new Set()); });
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
          if (m.concept === "Cementerio" || m.concept.startsWith("Cementerio")) setConcept("Cementerio");
          else if (m.concept.startsWith("Servicios")) { setConcept("Servicios"); setServicio(m.concept.replace("Servicios - ", "")); }
          else setConcept("Cuota Socio");
        }
        const due = m.linked_due;
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
                  fetchFamilyMembers(member.id).then((fms) => {
                    if (mounted && fms.length > 1) {
                      const alive = fms.filter((m) => !m.fallecido);
                      setFamilyMembers(alive);
                      const paidIds = (due.paid_members as string[]) || [];
                      if (paidIds.length > 0) { setFamilyPayment(true); setSelectedFamilyMembers(new Set(paidIds)); }
                    }
                  });
                }
              }
            }).catch(() => {});
          } else if (due.person_id) {
            setPersonType("persona");
            fetchPersonById(due.person_id).then((person) => {
              if (mounted) { setSelectedPerson(person); setPersonSearch(person.nombre); }
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
      .then((records) => { if (mounted && records.length > 0 && records[0].service_date) setServiceDate(records[0].service_date); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const selectedServiceAmount = useMemo(() => {
    if (concept !== "Servicios" || !servicio) return null;
    const found = serviciosFromApi.find((s) => s.name === servicio);
    return found ? found.amount : null;
  }, [concept, servicio, serviciosFromApi]);

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

  const importeCalcKey = `${concept}|${duesConfig?.member_fee ?? ''}|${duesConfig?.fee_act ?? ''}|${duesConfig?.fee_act_a ?? ''}|${duesConfig?.fee_adh ?? ''}|${duesConfig?.fee_part ?? ''}|${duesConfig?.fee_vit ?? ''}|${duesConfig?.asistencial_fee ?? ''}|${duesConfig?.plan_salud_fee ?? ''}|${selectedServiceAmount ?? ''}|${String(familyPayment)}|${[...selectedFamilyMembers].sort().join(',')}|${familyMembers.map((m) => m.id).join(',')}|${selectedMember?.id ?? ''}|${periods.join(',')}|${[...paidPeriods].sort().join(',')}|${selectedCementerios.map((c) => c.id).join(',')}|${[...cementerioSelectedYears.entries()].map(([k, v]) => `${k}:${[...v].sort()}`).join(',')}|${personType}`;
  const [prevImporteCalcKey, setPrevImporteCalcKey] = useState(importeCalcKey);
  if (prevImporteCalcKey !== importeCalcKey) {
    setPrevImporteCalcKey(importeCalcKey);
    if (concept === "Cuota Socio" && duesConfig) {
      const unpaidPeriods = periods.filter((p) => !paidPeriods.has(p));
      const monthCount = unpaidPeriods.length > 0 ? unpaidPeriods.length : 1;
      let total = 0;
      if (familyPayment && selectedFamilyMembers.size > 0) {
        for (const fmId of selectedFamilyMembers) {
          const fm = familyMembers.find((m) => m.id === fmId);
          if (fm) total += getMemberFee(fm);
        }
      } else if (selectedMember) {
        total = getMemberFee(selectedMember);
      }
      total *= monthCount;
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
    setErrors((prev) => { if (!prev.period) return prev; const next = { ...prev }; delete next.period; return next; });
  }

  const socioConcepts = useMemo(() => ["Cuota Socio", "Servicios", "Cementerio"], []);
  const personaConcepts = ["Servicios", "Cementerio"];
  const currentConcepts = personType === "socio" ? socioConcepts : personaConcepts;

  if (personType !== prevPersonTypeForConcept) {
    setPrevPersonTypeForConcept(personType);
    if (!currentConcepts.includes(concept)) {
      setConcept(currentConcepts[0]);
    }
  }

  const showServicioSelect = concept === "Servicios";

  const [prevShowServicioSelect, setPrevShowServicioSelect] = useState(showServicioSelect);
  if (prevShowServicioSelect !== showServicioSelect) {
    setPrevShowServicioSelect(showServicioSelect);
    if (showServicioSelect && !servicio && serviciosFromApi.length > 0) {
      setServicio(serviciosFromApi[0].name);
    }
    if (!showServicioSelect) {
      setServicio("");
    }
  }

  const shouldCreateDue = concept === "Cuota Socio" || (concept === "Cementerio" && selectedCementerios.length > 0);
  const mode = cajaOrigen === "caja_chica" ? "efectivo" : "transferencia";

  const memberResults = useMemo(() => {
    let list = members;
    if (concept === "Cuota Socio") {
      list = members.filter((m) => !m.fallecido && (m.pagaPor || "").toUpperCase() === "TES");
    } else if (concept === "Cementerio" && cementerioOwnerIds) {
      const ids = new Set(cementerioOwnerIds.memberIds);
      list = members.filter((m) => ids.has(m.id));
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      return list.filter((m) => m.nombre.toLowerCase().includes(q) || m.documento.includes(q) || m.numeroDeSocio.includes(q)).slice(0, 20);
    }
    return list;
  }, [members, memberSearch, concept, cementerioOwnerIds]);

  const personResults = useMemo(() => {
    let list = persons;
    if (concept === "Cementerio" && cementerioOwnerIds) {
      const ids = new Set(cementerioOwnerIds.personIds);
      list = persons.filter((p) => ids.has(p.id));
    }
    if (personSearch.trim()) {
      const q = personSearch.toLowerCase();
      return list.filter((p) => p.nombre.toLowerCase().includes(q) || p.documento.includes(q)).slice(0, 20);
    }
    return list;
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
    if (personType === "socio" && !selectedMember) errs.socio = "Seleccioná un socio";
    if (personType === "persona" && !selectedPerson) errs.persona = "Seleccioná una persona";
    if (!fecha) errs.fecha = "Ingresá una fecha";
    if (shouldCreateDue && concept === "Cuota Socio" && periods.length === 0) errs.period = "Seleccioná al menos un mes";
    if (concept === "Cementerio" && selectedCementerios.length === 0) errs.period = "Seleccioná al menos un nicho/urna/bolsa";
    if (concept === "Cementerio" && selectedCementerios.length > 0) {
      const allEmpty = selectedCementerios.every((c) => {
        const years = cementerioSelectedYears.get(c.id);
        return !years || years.size === 0;
      });
      if (allEmpty) errs.period = "Seleccioná al menos un año para pagar";
    }
    if (!importeNum || importeNum <= 0) errs.importe = "Ingresá un importe válido mayor a cero";
    return errs;
  }, [personType, selectedMember, selectedPerson, fecha, shouldCreateDue, periods, importeNum, cementerioSelectedYears, concept, selectedCementerios]);

  const handleSelectMember = useCallback((m: Member | Person) => {
    const member = m as Member;
    setSelectedMember(member);
    setMemberSearch(member.nombre);
    setShowMemberDropdown(false);
    setPeriods([]);
    setPaidPeriods(new Set());
    setErrors((prev) => { const next = { ...prev }; delete next.socio; return next; });
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

  const handleSelectPerson = useCallback((p: Member | Person) => {
    const person = p as Person;
    setSelectedPerson(person);
    setPersonSearch(person.nombre);
    setShowPersonDropdown(false);
    setErrors((prev) => { const next = { ...prev }; delete next.persona; return next; });
  }, []);

  const handleClearPerson = useCallback(() => {
    setSelectedPerson(null);
    setPersonSearch("");
    setTouched((prev) => ({ ...prev, persona: true }));
    setErrors((prev) => ({ ...prev, persona: "Seleccioná una persona" }));
  }, []);

  const handleToggleFamilyMember = useCallback((fmId: string) => {
    setSelectedFamilyMembers((prev) => {
      const next = new Set(prev);
      if (next.has(fmId)) next.delete(fmId); else next.add(fmId);
      return next;
    });
  }, []);

  const handleTogglePeriod = useCallback((val: string) => {
    setPeriods((prev) => {
      if (prev.includes(val)) return prev.filter((p) => p !== val);
      return [...prev, val].sort();
    });
    setErrors((prev) => { if (!prev.period) return prev; const next = { ...prev }; delete next.period; return next; });
  }, []);

  const handleSaveNewService = useCallback(async () => {
    const cost = parseFloat(newServiceCost.replace(",", "."));
    if (!newServiceName.trim()) { setServiceError("Ingresá un nombre"); return; }
    if (isNaN(cost) || cost <= 0) { setServiceError("Ingresá un costo válido"); return; }
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
  }, [newServiceName, newServiceCost]);

  const handlePersonTypeChange = useCallback((v: "socio" | "persona") => {
    setPersonType(v);
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
    setCementerioPaidYears(new Map());
  }, []);

  const payerName = personType === "socio" ? selectedMember?.nombre ?? "" : selectedPerson?.nombre ?? "";
  const originLabel = cajaOrigen === "caja_chica" ? "Caja Chica" : "Banco";
  const formaPagoLabel = mode === "efectivo" ? "Efectivo" : "Transferencia";
  const personTypeLabel = personType === "socio" ? "Socio" : "Persona";

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
        const conceptLabel = showServicioSelect ? `${concept} - ${servicio}` : concept;
        const detail = `${conceptLabel} - ${payerName}${descripcion ? `: ${descripcion}` : ""}`;

        if (isEditing && id) {
          const dueData: Record<string, unknown> = {};
          if (shouldCreateDue) {
            dueData.period = periods.length > 0 ? periods : null;
            if (concept === "Cuota Socio" && familyPayment && selectedFamilyMembers.size > 0) {
              dueData.paid_members = Array.from(selectedFamilyMembers);
            }
          }
          await updateMovement(id, {
            date: fecha, detail, amount: importeNum, type: "ingreso", mode,
            concept: conceptLabel,
            due: Object.keys(dueData).length > 0 ? dueData : undefined,
          });

          const existingRecords = await fetchServiceRecordsByMovement(id);
          const existingRecord = existingRecords.length > 0 ? existingRecords[0] : null;

          if (concept === "Servicios" && servicio) {
            const service = serviciosFromApi.find((s) => s.name === servicio);
            if (service) {
              const serviceData = {
                service_id: service.id,
                member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                amount: importeNum, date: fecha, service_date: serviceDate,
                detail: descripcion || null,
              };
              if (existingRecord) await updateServiceRecord(existingRecord.id, serviceData);
              else await saveServiceRecord({ ...serviceData, movement_id: id });
            }
          } else if (existingRecord) {
            await deleteServiceRecord(existingRecord.id);
          }
        } else {
          const { id: movementId } = await savePayment({
            date: fecha, detail, amount: importeNum, type: "ingreso", mode, concept: conceptLabel,
          });

          if (shouldCreateDue) {
            const dueType = concept === "Cementerio" ? "cementerio" : "socio";
            if (dueType === "cementerio") {
              for (const c of selectedCementerios) {
                const years = cementerioSelectedYears.get(c.id);
                const yearPeriods = years ? Array.from(years).sort() : null;
                await saveDue({
                  type: "cementerio", payment_date: fecha, period: yearPeriods,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                  movement_id: movementId,
                });
                const aniosPagados = years ? Array.from(years).sort() : [];
                const maxYear = aniosPagados.length > 0 ? aniosPagados[aniosPagados.length - 1] : null;
                await saveCementerioMovimiento({
                  movement_id: movementId, cementerio_id: c.id, nicho: c.nicho,
                  tipo: c.tipo || null, ocupante: c.ocupante || null,
                  anios_pagados: aniosPagados,
                  importe: getFeeForCementerio(c) * aniosPagados.length,
                  fecha_pago: fecha,
                  member_id: personType === "socio" ? selectedMember?.id ?? null : null,
                  person_id: personType === "persona" ? selectedPerson?.id ?? null : null,
                });
                if (maxYear) await updateCementerioRecord(c.id, { ultimoPago: maxYear, fechaDePago: fecha });
                setCementerioPaidYears((prev) => {
                  const next = new Map(prev);
                  const existing = new Set(next.get(c.nicho) || []);
                  for (const y of aniosPagados) existing.add(y);
                  next.set(c.nicho, existing);
                  return next;
                });
              }
            } else if (familyPayment && selectedMember && selectedFamilyMembers.size > 0) {
              await saveDue({
                type: "socio", payment_date: fecha,
                period: periods.length > 0 ? periods : null,
                member_id: selectedMember.id, movement_id: movementId,
                family_group: selectedMember.nroFamilia.split("/")[0],
                paid_members: Array.from(selectedFamilyMembers),
              });
            } else {
              await saveDue({
                type: "socio", payment_date: fecha,
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
                movement_id: movementId, amount: importeNum, date: fecha,
                service_date: serviceDate, detail: descripcion || null,
              });
            }
          }
        }

        if (isEditing) navigate(`/tesoreria/movimientos/detalle/${id}`);
        else {
          setSuccess(true);
          setSelectedMember(null); setMemberSearch(""); setFamilyPayment(false);
          setFamilyMembers([]); setSelectedFamilyMembers(new Set());
          setSelectedPerson(null); setPersonSearch("");
          setSelectedCementerios([]); setCementerioSelectedYears(new Map());
          setCementeriosList([]); setCementerioPaidYears(new Map()); setServiceDate(new Date().toISOString().split("T")[0]);
          setImporteStr(""); setDescripcion(""); setErrors({}); setTouched({}); setApiError(null);
        }
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Error al guardar el movimiento");
      } finally {
        setSaving(false);
      }
    },
    [isEditing, id, validate, showServicioSelect, servicio, concept, payerName,
      descripcion, fecha, serviceDate, importeNum, mode, shouldCreateDue,
      personType, selectedMember, selectedPerson, familyPayment, selectedFamilyMembers,
      periods, navigate, serviciosFromApi, selectedCementerios, cementerioSelectedYears, getFeeForCementerio, getMemberFee, familyMembers]
  );


  const lastPaid = selectedMember ? getLastPaidPeriod(selectedMember.id) : null;
  const lastPaidFormatted = lastPaid ? formatPeriod(lastPaid) : "";
  const monthsOwed = selectedMember ? calculateMonthsOwed(selectedMember.id) : null;

  return (
    <form className="new-movement-container" onSubmit={handleSubmit} noValidate>
      {success && <Banner type="success" message="Movimiento registrado correctamente" onClose={() => setSuccess(false)} />}
      {apiError && <Banner type="error" message={apiError} onClose={() => setApiError(null)} />}
      {errors.period && (
        <Banner type="error" message={errors.period!} onClose={() => setErrors((prev) => { const n = { ...prev }; delete n.period; return n; })} />
      )}

      <div className="new-movement-layout">
        <div className="new-movement-form-section">
          <div className="card-custom">
            <h3 className="card-title">Datos del Movimiento</h3>

            <MovementFormFields
              cajaOrigen={cajaOrigen} onCajaOrigenChange={setCajaOrigen}
              personType={personType} onPersonTypeChange={handlePersonTypeChange}
              concept={concept} onConceptChange={setConcept}
              concepts={currentConcepts}
              servicio={servicio} onServicioChange={setServicio}
              serviciosFromApi={serviciosFromApi}
              showServicioSelect={showServicioSelect}
              onOpenNewService={() => { setNewServiceName(""); setNewServiceCost(""); setServiceError(null); setShowNewServiceModal(true); }}
              memberSearch={memberSearch} onMemberSearchChange={(v) => { setMemberSearch(v); setShowMemberDropdown(true); if (selectedMember && v !== selectedMember.nombre) setSelectedMember(null); }}
              memberResults={memberResults} selectedMember={selectedMember}
              onSelectMember={handleSelectMember} onClearMember={handleClearMember}
              showMemberDropdown={showMemberDropdown} onShowMemberDropdown={setShowMemberDropdown}
              membersLoading={membersLoading}
              personSearch={personSearch} onPersonSearchChange={(v) => { setPersonSearch(v); setShowPersonDropdown(true); if (selectedPerson && v !== selectedPerson.nombre) setSelectedPerson(null); }}
              personResults={personResults} selectedPerson={selectedPerson}
              onSelectPerson={handleSelectPerson} onClearPerson={handleClearPerson}
              showPersonDropdown={showPersonDropdown} onShowPersonDropdown={setShowPersonDropdown}
              personsLoading={personsLoading}
              touched={touched} errors={errors} onTouchField={touchField}
            />

            {concept === "Cementerio" && (
              <CementerioPicker
                cementeriosList={cementeriosList}
                selectedCementerios={selectedCementerios}
                cementerioSelectedYears={cementerioSelectedYears}
                onToggleSelection={toggleCementerioSelection}
                onAddYear={addCementerioYear}
                onRemoveYear={removeCementerioYear}
                getAvailableYears={getAvailableYears}
              />
            )}

            {selectedMember && concept === "Cuota Socio" && (
              <FamilyPaymentSection
                familyPayment={familyPayment}
                onFamilyPaymentChange={setFamilyPayment}
                familyMembers={familyMembers}
                selectedFamilyMembers={selectedFamilyMembers}
                onToggleFamilyMember={handleToggleFamilyMember}
                selectedMemberId={selectedMember.id}
                getMemberFee={getMemberFee}
              />
            )}

            <div className="period-details-row">
              {shouldCreateDue && concept === "Cuota Socio" && (
                <div className="period-column">
                  <PeriodPicker
                    periodYear={periodYear}
                    onYearChange={setPeriodYear}
                    periods={periods}
                    onTogglePeriod={handleTogglePeriod}
                    disabledPeriods={paidPeriods}
                    required
                  />
                </div>
              )}

              <div className="details-column">
                <DateInput
                  label={showServicioSelect ? "Fecha de pago" : "Fecha"}
                  required
                  value={fecha}
                  onChange={(v) => { setFecha(v); setErrors((prev) => { const next = { ...prev }; delete next.fecha; return next; }); }}
                  id="movement-date"
                  error={errors.fecha}
                  touched={touched.fecha}
                  onBlur={() => { if (!fecha) touchField("fecha"); }}
                />

                {showServicioSelect && (
                  <DateInput
                    label="Fecha del servicio"
                    value={serviceDate}
                    onChange={setServiceDate}
                    id="service-date"
                  />
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
                        const cleaned = e.target.value.replace(/[^0-9,]/g, "");
                        setImporteStr(cleaned);
                        if (parseFloat(cleaned.replace(",", ".")) > 0) {
                          setErrors((prev) => { const next = { ...prev }; delete next.importe; return next; });
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
          <MovementSummary
            originLabel={originLabel}
            formaPagoLabel={formaPagoLabel}
            personTypeLabel={personTypeLabel}
            concept={concept}
            servicio={servicio}
            showServicioSelect={showServicioSelect}
            payerName={payerName}
            fecha={fecha}
            serviceDate={serviceDate}
            importeNum={importeNum}
            showServiceDate={showServicioSelect}
          />

          <PersonInfoCard
            personType={personType}
            selectedMember={selectedMember}
            selectedPerson={selectedPerson}
            debtLoading={debtLoading}
            monthsOwed={monthsOwed}
            lastPaidFormatted={lastPaidFormatted}
          />
        </div>
      </div>

      <NewServiceModal
        isOpen={showNewServiceModal}
        onClose={() => setShowNewServiceModal(false)}
        serviceName={newServiceName}
        onServiceNameChange={setNewServiceName}
        serviceCost={newServiceCost}
        onServiceCostChange={setNewServiceCost}
        serviceError={serviceError}
        saving={savingService}
        onSave={handleSaveNewService}
      />
    </form>
  );
};

export default NewMovement;
