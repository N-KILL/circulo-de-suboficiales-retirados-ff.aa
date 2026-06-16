import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw } from "lucide-react";
import TablePagination from "../../../components/TablePagination/TablePagination";
import { fetchMovements, type Movement } from "../../../services/movementsApi";
import { fetchInitialBalances } from "../../../services/initialBalancesApi";
import "../TreasuryTables.css";

function formatCurrency(val: number): string {
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return `${val < 0 ? "- " : ""}$ ${formatted}`;
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const Movements: React.FC = () => {
  // ── Raw data ──────────────────────────────────────────
  const [rawMovements, setRawMovements] = useState<Movement[]>([]);
  const [initialBanco, setInitialBanco] = useState(0);
  const [initialCajaChica, setInitialCajaChica] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showSaldoColumns, setShowSaldoColumns] = useState(true);
  const [cajaBanco, setCajaBanco] = useState(true);
  const [cajaChica, setCajaChica] = useState(true);
  const [filtroIngreso, setFiltroIngreso] = useState(true);
  const [filtroEgreso, setFiltroEgreso] = useState(true);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // ── Available years from data ─────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const m of rawMovements) {
      const d = new Date(m.date + "T12:00:00");
      years.add(d.getFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }, [rawMovements]);

  // ── Click outside to close year dropdown ────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    };
    if (yearDropdownOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [yearDropdownOpen, yearDropdownRef]);

  // ── Initial data fetch ────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([fetchMovements(), fetchInitialBalances()])
      .then(([data, balances]) => {
        if (!mounted) return;
        setRawMovements(data);
        setInitialBanco(balances?.banco ?? 0);
        setInitialCajaChica(balances?.caja_chica ?? 0);

        // Default to latest month/year
        if (data.length > 0) {
          const last = data[data.length - 1];
          const d = new Date(last.date + "T12:00:00");
          setSelectedMonths([d.getMonth()]);
          setSelectedYears([d.getFullYear()]);
        } else {
          const now = new Date();
          setSelectedMonths([now.getMonth()]);
          setSelectedYears([now.getFullYear()]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Error al cargar movimientos.");
          setIsLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  // ── Running balances ──────────────────────────────────
  const movementsWithSaldo = useMemo(() => {
    let rb = initialBanco;
    let rc = initialCajaChica;
    return rawMovements.map((m) => {
      if (m.type === "ingreso") {
        rb += m.amount;
        if (m.mode === "efectivo") rc += m.amount;
      } else if (m.type === "egreso") {
        rb -= m.amount;
        if (m.mode === "efectivo") rc -= m.amount;
      }
      const parts = m.date.split("-");
      const fecha = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : m.date;
      return {
        id: m.id,
        date: m.date,
        fecha,
        tipo: m.type === "ingreso" ? "Ingreso" : m.type === "egreso" ? "Egreso" : "Transferencia",
        modalidad: m.mode === "efectivo" ? "Efectivo" : "Transferencia",
        concepto: m.detail,
        ingreso: m.type === "ingreso" ? formatCurrency(m.amount) : "-",
        egreso: m.type === "egreso" ? formatCurrency(m.amount) : "-",
        saldoBanco: formatCurrency(rb),
        saldoCajaChica: formatCurrency(rc),
        dateObj: new Date(m.date + "T12:00:00"),
      };
    });
  }, [rawMovements, initialBanco, initialCajaChica]);

  // ── Filtered ──────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    const hasYear = selectedYears.length > 0;
    const hasMonth = selectedMonths.length > 0;

    return movementsWithSaldo
      .filter((m) => {
        // month/year
        if (hasYear || hasMonth) {
          const d = m.dateObj;
          if (hasYear && !selectedYears.includes(d.getFullYear())) return false;
          if (hasMonth && !selectedMonths.includes(d.getMonth())) return false;
        }
        // caja
        const modeMatch =
          (cajaBanco && m.modalidad === "Transferencia") ||
          (cajaChica && m.modalidad === "Efectivo");
        if (!cajaBanco && !cajaChica) return false;
        if (!modeMatch) return false;
        // search
        if (search && !m.concepto.toLowerCase().includes(search)) return false;
        // tipo
        if (m.tipo === "Transferencia") return false;
        if (m.tipo === "Ingreso" && !filtroIngreso) return false;
        if (m.tipo === "Egreso" && !filtroEgreso) return false;
        return true;
      })
      .reverse();
  }, [movementsWithSaldo, searchText, selectedMonths, selectedYears,
      cajaBanco, cajaChica, filtroIngreso, filtroEgreso]);

  // ── Pagination ────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const totalItems = filteredMovements.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [
    searchText, selectedMonths, selectedYears,
    cajaBanco, cajaChica, filtroIngreso, filtroEgreso,
  ]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + rowsPerPage);

  // Toggle helpers
  const toggleMonth = (m: number) =>
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  const clearFilters = () => {
    const now = new Date();
    setSearchText("");
    setSelectedMonths([now.getMonth()]);
    setSelectedYears([now.getFullYear()]);
    setCajaBanco(true);
    setCajaChica(true);
    setFiltroIngreso(true);
    setFiltroEgreso(true);
  };

  // ── Render ────────────────────────────────────────────
  if (isLoading) return <div className="dashboard-loading">Cargando movimientos...</div>;
  if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

  const ultimoSaldoBanco =
    movementsWithSaldo.length > 0
      ? movementsWithSaldo[movementsWithSaldo.length - 1].saldoBanco
      : formatCurrency(initialBanco);
  const ultimoSaldoCajaChica =
    movementsWithSaldo.length > 0
      ? movementsWithSaldo[movementsWithSaldo.length - 1].saldoCajaChica
      : formatCurrency(initialCajaChica);

  return (
    <div className="treasury-container">
      {/* Always-visible top row: search + toggle buttons */}
      <div className="filters-panel filters-panel-stack">
        <div className="filters-top-row">
          <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
            <span className="filter-group-label">Buscar</span>
            <div className="search-wrapper" style={{ width: "100%", minWidth: 0, marginRight: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
            <button
              className="toolbar-btn"
              onClick={clearFilters}
              title="Limpiar filtros"
            >
              <RotateCcw size={16} />
              Limpiar
            </button>
            <button
              className="toolbar-btn"
              onClick={() => setShowSaldoColumns((v) => !v)}
              title={showSaldoColumns ? "Ocultar columnas de saldo" : "Mostrar columnas de saldo"}
            >
              {showSaldoColumns ? <EyeOff size={16} /> : <Eye size={16} />}
              Saldos
            </button>
            <button
              className={`toolbar-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Filtros
            </button>
          </div>
        </div>

        {/* Collapsible extra filters */}
        {showFilters && (
          <div className="filters-bottom-row">
            {/* Left: Tipo, Año, Mes */}
            <div className="filters-bottom-left">
              <div className="filter-group">
                <span className="filter-group-label">Tipo</span>
                <div className="filter-btns">
                  <button
                    className={`filter-btn ${filtroIngreso ? "active" : ""}`}
                    onClick={() => setFiltroIngreso((v) => !v)}
                  >
                    Ingreso
                  </button>
                  <button
                    className={`filter-btn ${filtroEgreso ? "active" : ""}`}
                    onClick={() => setFiltroEgreso((v) => !v)}
                  >
                    Egreso
                  </button>
                </div>
              </div>
              <div className="filter-group" ref={yearDropdownRef}>
                <span className="filter-group-label">Año</span>
                <div className="multi-select-wrapper">
                  <button
                    className={`filter-select ${yearDropdownOpen ? "open" : ""}`}
                    onClick={() => setYearDropdownOpen((v) => !v)}
                  >
                    {selectedYears.length === 0
                      ? "Todos"
                      : selectedYears.length === 1
                        ? String(selectedYears[0])
                        : `${selectedYears.length} seleccionados`}
                    <ChevronDown size={14} />
                  </button>
                  {yearDropdownOpen && (
                    <div className="multi-select-dropdown">
                      {availableYears.map((y) => (
                        <label key={y} className={`multi-select-option ${selectedYears.includes(y) ? "active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selectedYears.includes(y)}
                            onChange={() =>
                              setSelectedYears((prev) =>
                                prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
                              )
                            }
                          />
                          {y}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="filter-group filter-group-months">
                <span className="filter-group-label">Mes</span>
                <div className="filter-btns months-grid">
                  {MONTHS.map((label, m) => (
                    <button
                      key={m}
                      className={`filter-btn ${selectedMonths.includes(m) ? "active" : ""}`}
                      onClick={() => toggleMonth(m)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Banco + Caja Chica stacked */}
            <div className="filters-bottom-right">
              <button
                className={`caja-card-toggle-sm ${cajaBanco ? "active" : "inactive"}`}
                onClick={() => setCajaBanco((v) => !v)}
              >
                <span className="caja-card-label">Banco</span>
                <span className="caja-card-value">{ultimoSaldoBanco}</span>
              </button>
              <button
                className={`caja-card-toggle-sm ${cajaChica ? "active" : "inactive"}`}
                onClick={() => setCajaChica((v) => !v)}
              >
                <span className="caja-card-label">Caja Chica</span>
                <span className="caja-card-value">{ultimoSaldoCajaChica}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Modalidad</th>
                <th>Concepto</th>
                <th>Ingreso</th>
                <th>Egreso</th>
                {showSaldoColumns && <th>Saldo Banco</th>}
                {showSaldoColumns && <th>Saldo Caja Chica</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={showSaldoColumns ? 8 : 6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No se encontraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.fecha}</td>
                    <td>
                      <span className={`badge ${m.tipo === "Ingreso" ? "badge-ingreso" : "badge-egreso"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.modalidad}</td>
                    <td>{m.concepto}</td>
                    <td className="amount-ingreso">{m.ingreso}</td>
                    <td className="amount-egreso">{m.egreso}</td>
                    {showSaldoColumns && <td className="amount-saldo">{m.saldoBanco}</td>}
                    {showSaldoColumns && <td className="amount-saldo">{m.saldoCajaChica}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="movimientos"
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
};

export default Movements;
