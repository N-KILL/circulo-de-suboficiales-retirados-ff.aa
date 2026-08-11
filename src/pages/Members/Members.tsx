import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { UserPlus, Home, ChevronDown, ChevronUp, RefreshCw, ListChecks, X, Printer, FileText, RotateCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import SearchInput from "../../components/ui/SearchInput";
import "../Treasury/TreasuryTables.css";
import { useMembersListStore } from "../../store/membersListStore";
import { fetchMembersDebtStatus } from "../../services/membersDebtApi";
import { todayLocal, parseDateYMD } from "../../utils/format";
import type { Member } from "../../models/members";
import logoUrl from "../../assets/logo_ffaa.png";

function monthsOwed(lastPeriod: string | null): number {
  if (!lastPeriod) return -1;
  const now = new Date();
  const end = new Date(lastPeriod + "-01T00:00:00");
  if (end >= now) return 0;
  return (now.getFullYear() - end.getFullYear()) * 12 + (now.getMonth() - end.getMonth());
}

const ESTADO_OPTIONS = [
  { key: "activos", label: "Activos" },
  { key: "fallecidos", label: "Fallecidos" },
  { key: "baja", label: "Dados de baja" },
] as const;

const FUERZA_LABELS: Record<string, string> = {
  EA: "Ejército Argentino",
  FAA: "Fuerza Aérea",
  ARA: "Armada",
  POLICIA: "Policía",
};

function fuerzaLabel(value: string): string {
  return FUERZA_LABELS[value] ?? value;
}

function buildListPrintHtml(members: Member[], name: string): string {
  const today = todayLocal().split("-").reverse().join("/");
  const rows = members
    .map(
      (m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="num-socio">${m.numeroDeSocio}</td>
      <td>${m.nombre}${m.fallecido ? " †" : ""}</td>
      <td>${m.documento}</td>
      <td>${m.telefono || "\u2014"}</td>
      <td>${m.localidad || "\u2014"}</td>
      <td>${m.fechaBaja || "\u2014"}</td>
    </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #1a3a5c;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .list-header .logo { width: 62px; flex: 0 0 auto; }
        .list-header .logo img { width: 100%; height: auto; }
        .list-header .center { text-align: center; flex: 1; padding: 0 12px; }
        .list-header .institution-name { font-weight: 700; color: #1a3a5c; font-size: 15px; line-height: 1.25; }
        .list-header .motto { font-weight: 700; color: #1a3a5c; font-size: 14px; margin-top: 2px; }
        .list-header .right { text-align: right; font-size: 12px; color: #555; flex: 0 0 auto; }
        .list-title { text-align: center; font-size: 18px; font-weight: 700; color: #1a3a5c; text-transform: uppercase; margin: 6px 0; }
        .list-subtitle { text-align: center; font-size: 12px; color: #555; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f0f4f8; color: #1a3a5c; font-weight: 700; }
        .num-socio { white-space: nowrap; }
      </style>
    </head>
    <body>
      <div class="list-header">
        <div class="logo"><img src="${logoUrl}" alt="Logo" /></div>
        <div class="center">
          <div class="institution-name">Círculo de Suboficiales Retirados de las Fuerzas Armadas de la Nación</div>
          <div class="motto">"Honor y Patria"</div>
        </div>
        <div class="right"><div><strong>Fecha:</strong> ${today}</div></div>
      </div>
      <div class="list-title">${name}</div>
      <div class="list-subtitle">Cantidad de socios: ${members.length}</div>
      <table>
        <thead>
          <tr><th>N°</th><th>Nº Socio</th><th>Apellido y Nombre</th><th>Documento</th><th>Teléfono</th><th>Localidad</th><th>Fecha Baja</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;
}

function printList(members: Member[], name: string, download: boolean): void {
  const html = buildListPrintHtml(members, name);
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.title = name || "Lista de socios";
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    if (download) {
      setTimeout(() => printWindow.close(), 500);
    }
  }, 300);
}

const Members: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tipoSocioDropdownRef = useRef<HTMLDivElement>(null);

  const searchText = useMembersListStore((s) => s.searchText);
  const showActivos = useMembersListStore((s) => s.showActivos);
  const showFallecidos = useMembersListStore((s) => s.showFallecidos);
  const showBaja = useMembersListStore((s) => s.showBaja);
  const pagaPorFilter = useMembersListStore((s) => s.pagaPorFilter);
  const currentPage = useMembersListStore((s) => s.currentPage);
  const rowsPerPage = useMembersListStore((s) => s.rowsPerPage);
  const allMembers = useMembersListStore((s) => s.allMembers);
  const isLoading = useMembersListStore((s) => s.isLoading);
  const error = useMembersListStore((s) => s.error);
  const loadMembers = useMembersListStore((s) => s.loadMembers);
  const setSearchText = useMembersListStore((s) => s.setSearchText);
  const setShowActivos = useMembersListStore((s) => s.setShowActivos);
  const setShowFallecidos = useMembersListStore((s) => s.setShowFallecidos);
  const setShowBaja = useMembersListStore((s) => s.setShowBaja);
  const setPagaPorFilter = useMembersListStore((s) => s.setPagaPorFilter);
  const tipoSocioFilter = useMembersListStore((s) => s.tipoSocioFilter);
  const setTipoSocioFilter = useMembersListStore((s) => s.setTipoSocioFilter);
  const setCurrentPage = useMembersListStore((s) => s.setCurrentPage);
  const setRowsPerPage = useMembersListStore((s) => s.setRowsPerPage);

  const [debtMap, setDebtMap] = useState<Record<string, string | null>>({});
  const [considerationYears, setConsiderationYears] = useState(0);
  const [debtLoading, setDebtLoading] = useState(true);
  const [showDebtorsOnly, setShowDebtorsOnly] = useState(false);
  const [hideOldDebt, setHideOldDebt] = useState(false);
  const [debtSortDir, setDebtSortDir] = useState<"asc" | "desc" | null>(null);
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const [tipoSocioDropdownOpen, setTipoSocioDropdownOpen] = useState(false);
  const [updatingVitalicios, setUpdatingVitalicios] = useState(false);
  const [asistencialFilter, setAsistencialFilter] = useState<"todos" | "si" | "no">("todos");
  const [fuerzaFilter, setFuerzaFilter] = useState("");
  const [showMembersFilters, setShowMembersFilters] = useState(false);
  const [bajaSortDir, setBajaSortDir] = useState<"asc" | "desc" | null>(null);
  const [listaMode, setListaMode] = useState(false);
  const [selectedListaIds, setSelectedListaIds] = useState<Set<string>>(new Set());
  const [listaName, setListaName] = useState("");
  const [showListaModal, setShowListaModal] = useState(false);
  const [lastVitaliciosUpdate, setLastVitaliciosUpdate] = useState<string | null>(() => {
    try { return localStorage.getItem("lastVitaliciosUpdate"); } catch { return null; }
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEstadoDropdownOpen(false);
      }
      if (tipoSocioDropdownRef.current && !tipoSocioDropdownRef.current.contains(e.target as Node)) {
        setTipoSocioDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleEstado = (key: string) => {
    if (key === "activos") setShowActivos(!showActivos);
    else if (key === "fallecidos") setShowFallecidos(!showFallecidos);
    else if (key === "baja") setShowBaja(!showBaja);
  };

  const toggleTipoSocio = (opt: string) => {
    setTipoSocioFilter(
      tipoSocioFilter.includes(opt)
        ? tipoSocioFilter.filter((o) => o !== opt)
        : [...tipoSocioFilter, opt]
    );
  };

  const clearMembersFilters = () => {
    setSearchText("");
    setShowActivos(true);
    setShowFallecidos(true);
    setShowBaja(true);
    setPagaPorFilter("");
    setTipoSocioFilter([]);
    setAsistencialFilter("todos");
    setFuerzaFilter("");
    setShowDebtorsOnly(false);
    setHideOldDebt(false);
  };

  const tipoSocioOptions = useMemo(() => {
    const values = new Set<string>();
    allMembers.forEach((m) => { if (m.tipoSocio) values.add(m.tipoSocio); });
    return Array.from(values).sort();
  }, [allMembers]);

  const fuerzaOptions = useMemo(() => {
    const values = new Set<string>();
    allMembers.forEach((m) => { if (m.fuerza) values.add(m.fuerza); });
    return Array.from(values).sort();
  }, [allMembers]);

  const handleActualizarVitalicios = useCallback(async () => {
    if (!window.confirm("Se cambiarán a Vitalicios todos los socios activos con más de 35 años. ¿Continuar?")) return;
    setUpdatingVitalicios(true);
    try {
      const res = await fetch("/api/members/vitalicios", { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        const now = new Date().toLocaleString("es-AR");
        localStorage.setItem("lastVitaliciosUpdate", now);
        setLastVitaliciosUpdate(now);
        alert(`Se actualizaron ${data.updated} socios a Vitalicio.`);
        void loadMembers();
      } else {
        alert("Error al actualizar socios.");
      }
    } catch {
      alert("Error al actualizar socios.");
    } finally {
      setUpdatingVitalicios(false);
    }
  }, [loadMembers]);

  const activeCount = [showActivos, showFallecidos, showBaja].filter(Boolean).length;
  const estadoLabel = activeCount === 3
    ? "Todos"
    : activeCount === 0
      ? "Ninguno"
      : ESTADO_OPTIONS.filter((o) =>
          o.key === "activos" ? showActivos : o.key === "fallecidos" ? showFallecidos : showBaja
        ).map((o) => o.label).join(", ");

  useEffect(() => {
    void loadMembers();
    fetchMembersDebtStatus()
      .then((data) => {
        setDebtMap(data.members);
        setConsiderationYears(data.consideration_years);
      })
      .catch(() => {})
      .finally(() => setDebtLoading(false));
  }, [loadMembers, location.key]);

  const pagaPorOptions = useMemo(() => {
    const values = new Set<string>();
    allMembers.forEach((m) => { if (m.pagaPor) values.add(m.pagaPor); });
    return Array.from(values).sort();
  }, [allMembers]);

  const membersWithDebt = useMemo(() => {
    return allMembers.map((m) => {
      const owed = monthsOwed(debtMap[m.id] ?? null);
      return {
        member: m,
        monthsOwed: owed,
        noData: owed === -1,
      };
    });
  }, [allMembers, debtMap]);

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    const maxMonths = considerationYears * 12;
    return membersWithDebt.filter((item) => {
      const m = item.member;
      const matchSearch =
        !s ||
        m.nombre.toLowerCase().includes(s) ||
        m.documento.includes(s) ||
        m.numeroDeSocio.includes(s);
      const isActivo = !m.fallecido && !m.fechaBaja;
      const matchEstado =
        (showActivos && isActivo) ||
        (showFallecidos && m.fallecido) ||
        (showBaja && !!m.fechaBaja);
      const matchPagaPor = !pagaPorFilter || m.pagaPor === pagaPorFilter;
      const matchTipoSocio = tipoSocioFilter.length === 0 || tipoSocioFilter.includes(m.tipoSocio);
      const matchAsistencial =
        asistencialFilter === "todos" ||
        (asistencialFilter === "si" ? m.asistencial : !m.asistencial);
      const matchFuerza = !fuerzaFilter || m.fuerza === fuerzaFilter;
      const matchDebtor = !showDebtorsOnly || item.monthsOwed > 0 || item.noData;
      const matchOldDebt = !hideOldDebt || maxMonths <= 0 || item.monthsOwed <= maxMonths;
      return matchSearch && matchEstado && matchPagaPor && matchTipoSocio && matchAsistencial && matchFuerza && matchDebtor && matchOldDebt;
    }).sort((a, b) => {
      if (bajaSortDir) {
        const da = a.member.fechaBaja ? parseDateYMD(a.member.fechaBaja)?.getTime() ?? null : null;
        const db = b.member.fechaBaja ? parseDateYMD(b.member.fechaBaja)?.getTime() ?? null : null;
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return bajaSortDir === "asc" ? da - db : db - da;
      }
      if (debtSortDir === "asc") {
        return (a.monthsOwed - b.monthsOwed);
      }
      if (debtSortDir === "desc") {
        return (b.monthsOwed - a.monthsOwed);
      }
      const na = parseInt(a.member.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(b.member.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      return na - nb;
    });
  }, [membersWithDebt, searchText, showActivos, showFallecidos, showBaja, pagaPorFilter, showDebtorsOnly, hideOldDebt, considerationYears, debtSortDir, tipoSocioFilter, asistencialFilter, fuerzaFilter, bajaSortDir]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

  const selectedListaMembers = useMemo(() => {
    const sel = allMembers.filter((m) => selectedListaIds.has(m.id));
    return sel.sort((a, b) => {
      const na = parseInt(a.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(b.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      return na - nb;
    });
  }, [allMembers, selectedListaIds]);

  const toggleListaSelect = useCallback((id: string) => {
    setSelectedListaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedListaIds(new Set(filtered.map((i) => i.member.id)));
  }, [filtered]);

  return (
    <div className="treasury-container">
      <div className="treasury-header-row">
        <h2></h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className={`header-btn${listaMode ? " header-btn-active" : ""}`}
            onClick={() => setListaMode((v) => !v)}
            title="Seleccionar socios para crear una lista imprimible"
          >
            <ListChecks size={16} />
            Crear lista
          </button>
          <button
            className="header-btn"
            onClick={handleActualizarVitalicios}
            disabled={updatingVitalicios}
            title="Cambiar a Vitalicio a todos los activos con más de 35 años"
          >
            <RefreshCw size={16} className={updatingVitalicios ? "spin" : ""} />
            Actualizar vitalicios
          </button>
          {lastVitaliciosUpdate && (
            <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center", whiteSpace: "nowrap" }}>
              Última vez: {lastVitaliciosUpdate}
            </span>
          )}
          <button
            className="header-btn"
            onClick={() => navigate("/socios/nuevo")}
          >
            <UserPlus size={16} />
            Agregar socio
          </button>
        </div>
      </div>

      <div className="filters-panel filters-panel-stack">
        <div className="filters-top-row">
          <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
            <span className="filter-group-label">Buscar</span>
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="Buscar por nombre o número de socio..."
            />
          </div>
          <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
            <button className="toolbar-btn" onClick={clearMembersFilters} title="Limpiar filtros">
              <RotateCcw size={16} />
              Limpiar
            </button>
            <button
              className={`toolbar-btn ${showMembersFilters ? "active" : ""}`}
              onClick={() => setShowMembersFilters((v) => !v)}
            >
              {showMembersFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showMembersFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>
        </div>

        {showMembersFilters && (
          <div className="filters-bottom-row" style={{ marginTop: 8, flexWrap: "wrap" }}>
            <div className="filter-group" ref={dropdownRef} style={{ position: "relative" }}>
              <span className="filter-group-label">Estado</span>
              <button
                className="filter-btn"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setEstadoDropdownOpen((prev) => !prev)}
              >
                {estadoLabel}
                <ChevronDown size={14} />
              </button>
              {estadoDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    minWidth: 180,
                    padding: "6px 0",
                  }}
                >
                  {ESTADO_OPTIONS.map((opt) => {
                    const checked = opt.key === "activos" ? showActivos : opt.key === "fallecidos" ? showFallecidos : showBaja;
                    return (
                      <label
                        key={opt.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: 14,
                          userSelect: "none",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEstado(opt.key)}
                          style={{ accentColor: "var(--azul-institucional)" }}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="filter-group" ref={tipoSocioDropdownRef} style={{ position: "relative" }}>
              <span className="filter-group-label">Tipo de socio</span>
              <button
                className="filter-btn"
                style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 220 }}
                onClick={() => setTipoSocioDropdownOpen((prev) => !prev)}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tipoSocioFilter.length === 0 ? "Todos" : tipoSocioFilter.join(", ")}
                </span>
                <ChevronDown size={14} />
              </button>
              {tipoSocioDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    minWidth: 180,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: "6px 0",
                  }}
                >
                  {tipoSocioOptions.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: 14,
                        userSelect: "none",
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <input
                        type="checkbox"
                        checked={tipoSocioFilter.includes(opt)}
                        onChange={() => toggleTipoSocio(opt)}
                        style={{ accentColor: "var(--azul-institucional)" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Paga por</span>
              <select
                className="filter-select"
                value={pagaPorFilter}
                onChange={(e) => setPagaPorFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {pagaPorOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Asistencial</span>
              <select
                className="filter-select"
                value={asistencialFilter}
                onChange={(e) => setAsistencialFilter(e.target.value as "todos" | "si" | "no")}
              >
                <option value="todos">Todos</option>
                <option value="si">Con asistencial</option>
                <option value="no">Sin asistencial</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Fuerza</span>
              <select
                className="filter-select"
                value={fuerzaFilter}
                onChange={(e) => setFuerzaFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {fuerzaOptions.map((opt) => (
                  <option key={opt} value={opt}>{fuerzaLabel(opt)}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Deudores</span>
              <label
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", userSelect: "none", minHeight: 34 }}
              >
                <input
                  type="checkbox"
                  checked={showDebtorsOnly}
                  onChange={(e) => setShowDebtorsOnly(e.target.checked)}
                  style={{ accentColor: "var(--azul-institucional)" }}
                />
                Solo deudores
              </label>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Deuda</span>
              <label
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", userSelect: "none", minHeight: 34 }}
              >
                <input
                  type="checkbox"
                  checked={hideOldDebt}
                  onChange={(e) => setHideOldDebt(e.target.checked)}
                  style={{ accentColor: "var(--azul-institucional)" }}
                />
                Ocultar deuda &gt; {considerationYears} años
              </label>
            </div>
          </div>
        )}
      </div>

      {listaMode && (
        <div className="lista-toolbar">
          <span className="lista-count">
            {selectedListaIds.size} seleccionado{selectedListaIds.size === 1 ? "" : "s"}
          </span>
          <button className="header-btn-sm" onClick={selectAllFiltered} title="Seleccionar todos los socios que coinciden con los filtros actuales">
            Seleccionar todos ({filtered.length})
          </button>
          <button className="header-btn-sm" onClick={() => setSelectedListaIds(new Set())}>
            Limpiar
          </button>
          <button
            className="header-btn"
            disabled={selectedListaIds.size === 0}
            onClick={() => { setListaName(""); setShowListaModal(true); }}
          >
            <Printer size={16} />
            Generar lista
          </button>
          <button
            className="header-btn header-btn-danger"
            onClick={() => {
              setListaMode(false);
              setSelectedListaIds(new Set());
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <colgroup>
              {listaMode && <col className="column-check" />}
              <col className="column-socio" />
              <col className="column-nombre" />
              <col className="column-telefono" />
              <col className="column-tipo" />
              <col className="column-documento" />
              <col className="column-localidad" />
              <col className="column-domicilio" />
              <col className="column-paga-por" />
              <col className="column-baja" />
              <col className="column-deuda" />
            </colgroup>
            <thead>
              <tr>
                {listaMode && (
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && paginated.every((i) => selectedListaIds.has(i.member.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedListaIds((prev) => {
                            const next = new Set(prev);
                            paginated.forEach((i) => next.add(i.member.id));
                            return next;
                          });
                        } else {
                          setSelectedListaIds((prev) => {
                            const next = new Set(prev);
                            paginated.forEach((i) => next.delete(i.member.id));
                            return next;
                          });
                        }
                      }}
                      style={{ accentColor: "var(--azul-institucional)" }}
                    />
                  </th>
                )}
                <th>Nº Socio</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Localidad</th>
                <th>Dirección/Residencia</th>
                <th>Paga por</th>
                <th
                  className="sortable-th"
                  style={{ userSelect: "none" }}
                  onClick={() =>
                    setBajaSortDir((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                  title="Ordenar por fecha de baja"
                >
                  Baja {bajaSortDir === "asc" ? "▲" : bajaSortDir === "desc" ? "▼" : <span className="sort-neutral">↕</span>}
                </th>
                <th
                  className="sortable-th"
                  style={{ userSelect: "none" }}
                  onClick={() =>
                    setDebtSortDir((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                  title="Ordenar por deuda"
                >
                  Deuda {debtSortDir === "asc" ? "▲" : debtSortDir === "desc" ? "▼" : <span className="sort-neutral">↕</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || debtLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    Cargando socios...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={11 + (listaMode ? 1 : 0)}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    No se encontraron socios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map(({ member: m, monthsOwed: owed }) => (
                  <tr
                    key={m.id}
                    onClick={() => {
                      if (listaMode) return;
                      navigate(`/socios/detalle/${m.id}`);
                    }}
                    style={{ cursor: listaMode ? "default" : "pointer" }}
                    className={selectedListaIds.has(m.id) ? "row-lista-selected" : ""}
                  >
                    {listaMode && (
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedListaIds.has(m.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleListaSelect(m.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: "var(--azul-institucional)" }}
                        />
                      </td>
                    )}
                    <td>{m.numeroDeSocio}</td>
                    <td>
                      {m.nombre}
                      {m.fallecido && (
                        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                          †
                        </span>
                      )}
                    </td>
                    <td>{m.telefono}</td>
                    <td>{m.tipoSocio}</td>
                    <td>{m.documento}</td>
                    <td>{m.localidad}</td>
                    <td>
                      {m.residencia ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {m.domicilio || ""}
                          <span
                            title={m.residencia}
                            style={{ cursor: "help", display: "inline-flex" }}
                          >
                            <Home
                              size={14}
                              strokeWidth={1.5}
                              color="var(--muted)"
                            />
                          </span>
                        </span>
                      ) : (
                        m.domicilio
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{m.pagaPor}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {m.fechaBaja ? (
                        <span style={{ color: "#dc3545" }}>{m.fechaBaja}</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {owed === -1 ? (
                        <span style={{ color: "var(--muted)" }}>No disp.</span>
                      ) : owed === 0 ? (
                        <span style={{ color: "green" }}>Al día</span>
                      ) : (
                        <span style={{ color: "#dc3545" }}>{owed} meses</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={safePage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="socios"
          onPageChange={(p) =>
            setCurrentPage(Math.min(Math.max(1, p), totalPages))
          }
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>

      {showListaModal && (
        <div
          className="family-picker-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowListaModal(false);
          }}
        >
          <div className="family-picker-modal">
            <div className="family-picker-modal-header">
              <h3>Imprimir lista de socios</h3>
              <button className="modal-close-btn" onClick={() => setShowListaModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="family-picker-modal-body" style={{ padding: 16 }}>
              <label style={{ display: "block", fontSize: 14, marginBottom: 6, fontWeight: 600 }}>
                Nombre de la lista
              </label>
              <input
                type="text"
                value={listaName}
                onChange={(e) => setListaName(e.target.value)}
                placeholder="Lista de socios"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: "0.875rem",
                  background: "var(--gris-claro)",
                  color: "var(--azul-armada)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FileText size={15} />
                {selectedListaMembers.length} socio{selectedListaMembers.length === 1 ? "" : "s"} seleccionado{selectedListaMembers.length === 1 ? "" : "s"}
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button
                  className="header-btn"
                  onClick={() => setShowListaModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="header-btn"
                  disabled={selectedListaMembers.length === 0}
                  onClick={() => {
                    printList(selectedListaMembers, listaName.trim() || "Lista de socios", false);
                    setShowListaModal(false);
                  }}
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
