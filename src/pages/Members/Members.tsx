import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Search, UserPlus, Home, Eye, ChevronDown, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import "../Treasury/TreasuryTables.css";
import { useMembersListStore } from "../../store/membersListStore";
import { useAuthStore } from "../../store/authStore";
import { fetchMembersDebtStatus } from "../../services/membersDebtApi";

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

const Members: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isSecretario = user?.role === "secretario";
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

  const tipoSocioOptions = useMemo(() => {
    const values = new Set<string>();
    allMembers.forEach((m) => { if (m.tipoSocio) values.add(m.tipoSocio); });
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
      const matchTipoSocio = !tipoSocioFilter || m.tipoSocio === tipoSocioFilter;
      const matchDebtor = !showDebtorsOnly || item.monthsOwed > 0 || item.noData;
      const matchOldDebt = !hideOldDebt || maxMonths <= 0 || item.monthsOwed <= maxMonths;
      return matchSearch && matchEstado && matchPagaPor && matchTipoSocio && matchDebtor && matchOldDebt;
    }).sort((a, b) => {
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
  }, [membersWithDebt, searchText, showActivos, showFallecidos, showBaja, pagaPorFilter, showDebtorsOnly, hideOldDebt, considerationYears, debtSortDir, tipoSocioFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="treasury-container">
      <div className="treasury-header-row">
        <h2></h2>
        {!isSecretario && (
          <div style={{ display: "flex", gap: 8 }}>
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
        )}
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o número de socio..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="filter-item" ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setEstadoDropdownOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              background: "white",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            Estado: {estadoLabel}
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

        <div
          className="filter-item"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            id="debtors"
            type="checkbox"
            checked={showDebtorsOnly}
            onChange={(e) => setShowDebtorsOnly(e.target.checked)}
          />
          <label htmlFor="debtors" style={{ userSelect: "none" }}>
            Solo deudores
          </label>
        </div>

        <div
          className="filter-item"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            id="hideOldDebt"
            type="checkbox"
            checked={hideOldDebt}
            onChange={(e) => setHideOldDebt(e.target.checked)}
          />
          <label htmlFor="hideOldDebt" style={{ userSelect: "none" }}>
            Ocultar deuda &gt; {considerationYears} años
          </label>
        </div>

        <select
          value={pagaPorFilter}
          onChange={(e) => setPagaPorFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            fontSize: "0.875rem",
            background: "white",
          }}
        >
          <option value="">Todos (Paga por)</option>
          {pagaPorOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <div className="filter-item" ref={tipoSocioDropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setTipoSocioDropdownOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              background: "white",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            Tipo: {tipoSocioFilter || "Todos"}
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
                padding: "6px 0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                  userSelect: "none",
                  fontWeight: !tipoSocioFilter ? 600 : 400,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <input
                  type="radio"
                  name="tipoSocio"
                  checked={!tipoSocioFilter}
                  onChange={() => setTipoSocioFilter("")}
                  style={{ accentColor: "var(--azul-institucional)" }}
                />
                Todos
              </label>
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
                    fontWeight: tipoSocioFilter === opt ? 600 : 400,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="radio"
                    name="tipoSocio"
                    checked={tipoSocioFilter === opt}
                    onChange={() => setTipoSocioFilter(opt)}
                    style={{ accentColor: "var(--azul-institucional)" }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <colgroup>
              <col className="column-socio" />
              <col className="column-nombre" />
              <col className="column-telefono" />
              <col className="column-tipo" />
              <col className="column-documento" />
              <col className="column-localidad" />
              <col className="column-domicilio" />
              <col className="column-paga-por" />
              <col className="column-deuda" />
            </colgroup>
            <thead>
              <tr>
                <th>Nº Socio</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Localidad</th>
                <th>Dirección/Residencia</th>
                <th>Paga por</th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setDebtSortDir((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                >
                  Deuda {debtSortDir === "asc" ? "▲" : debtSortDir === "desc" ? "▼" : ""}
                </th>
                <th style={{ width: 100 }}></th>
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
                    colSpan={9}
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
                    onClick={() => navigate(`/socios/detalle/${m.id}`)}
                    style={{ cursor: "pointer" }}
                  >
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
                      {owed === -1 ? (
                        <span style={{ color: "var(--muted)" }}>No disp.</span>
                      ) : owed === 0 ? (
                        <span style={{ color: "green" }}>Al día</span>
                      ) : (
                        <span style={{ color: "#dc3545" }}>{owed} meses</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="header-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/socios/detalle/${m.id}`);
                        }}
                        title="Ver cuotas"
                      >
                        <Eye size={14} />
                        Cuotas
                      </button>
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
    </div>
  );
};

export default Members;
